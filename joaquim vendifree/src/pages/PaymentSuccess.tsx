import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const adId = searchParams.get('adId');
  const [ad, setAd] = useState<any>(null);

  useEffect(() => {
    if (adId) {
      getDoc(doc(db, 'ads', adId)).then(docSnap => {
        if (docSnap.exists()) {
          setAd(docSnap.data());
        }
      });
    }
  }, [adId]);

  return (
    <div className="max-w-2xl mx-auto py-20 px-4 text-center">
      <h1 className="text-4xl font-serif mb-6">Pagamento Confirmado!</h1>
      <p className="text-lg mb-8">O seu anúncio {ad?.title ? `"${ad.title}"` : ''} foi destacado com sucesso.</p>
      <button onClick={() => navigate('/')} className="bg-gold text-black px-8 py-3 rounded-full font-semibold">
        Voltar ao Início
      </button>
    </div>
  );
};

export default PaymentSuccess;
