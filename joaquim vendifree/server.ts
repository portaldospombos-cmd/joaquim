import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Stripe from 'stripe';
import { Resend } from 'resend';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import admin from 'firebase-admin';

dotenv.config();

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
});
const db = admin.firestore();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

let stripeClient: Stripe | null = null;
function getStripe() {
  if (!stripeClient && process.env.STRIPE_SECRET_KEY) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16' as any,
    });
  }
  return stripeClient;
}

let resendClient: Resend | null = null;
function getResend() {
  if (!resendClient && process.env.RESEND_API_KEY) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

// API Routes
app.post('/api/checkout', async (req, res) => {
  try {
    const stripe = getStripe();
    if (!stripe) return res.status(400).json({ error: 'Stripe is not configured. Please add STRIPE_SECRET_KEY to your environment variables.' });
    
    const { adId, title, price, type, successUrl, cancelUrl } = req.body;
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: { name: title },
          unit_amount: Math.round(price * 100),
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { adId, type }
    });
    
    res.json({ url: session.url });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/notify', async (req, res) => {
  try {
    const resend = getResend();
    if (!resend) return res.status(400).json({ error: 'Resend is not configured. Please add RESEND_API_KEY to your environment variables.' });
    
    const { to, subject, html } = req.body;
    await resend.emails.send({
      from: 'Vendifree <onboarding@resend.dev>',
      to,
      subject,
      html
    });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const stripe = getStripe();
  if (!stripe || !sig || !process.env.STRIPE_WEBHOOK_SECRET) return res.status(400).send('Webhook Error');

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err: any) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const adId = session.metadata?.adId;
    if (adId) {
      await db.collection('ads').doc(adId).update({ status: 'active' });
    }
  }
  res.json({ received: true });
});

app.post('/api/admin-login', async (req, res) => {
  const { email, password } = req.body;
  if (email === 'portaldospombos@gmail.com' && password === 'Admin123!') {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, message: 'Credenciais inválidas' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
