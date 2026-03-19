/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
/// <reference types="vite/client" />

import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useIsAdmin } from './hooks/useIsAdmin';
import { AdminLogin } from './components/AdminLogin';
import PaymentSuccess from './pages/PaymentSuccess';
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Link, 
  useNavigate, 
  useParams 
} from 'react-router-dom';
import { 
  onAuthStateChanged, 
  User as FirebaseUser 
} from 'firebase/auth';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc,
  doc, 
  getDoc,
  deleteDoc,
  serverTimestamp,
  getDocFromServer,
  getDocs,
  where,
  or,
  and
} from 'firebase/firestore';
import { auth, db, storage, loginWithGoogle, loginWithFacebook, logout, handleFirestoreError, OperationType } from './firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { generateAdDescription, analyzeAdPerformance } from './services/geminiService';
import { CookieBanner } from './components/CookieBanner';
import { AmbassadorNetwork } from './pages/AmbassadorNetwork';
import { Profile } from './pages/Profile';
import { Terms, Privacy } from './pages/Legal';
import { 
  Search, 
  Plus, 
  LogOut, 
  MapPin, 
  Tag, 
  Clock, 
  ChevronLeft, 
  Sparkles,
  Trash2,
  CheckCircle,
  AlertCircle,
  Menu,
  X,
  Crown,
  Anchor,
  Palmtree,
  User,
  Gem,
  Compass,
  Award,
  Megaphone,
  Truck,
  MessageCircle,
  ShieldCheck,
  BarChart3,
  Image as ImageIcon,
  Send,
  Settings,
  CreditCard,
  RefreshCw,
  Database,
  Code,
  Check
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Utility ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}


interface Ad {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  location: string;
  images: string[];
  authorId: string;
  authorName: string;
  authorEmail?: string;
  status: 'active' | 'sold' | 'deleted';
  isPremium?: boolean;
  transactionType: 'sale' | 'rent';
  createdAt: any;
}

interface AmbassadorApp {
  id: string;
  userId: string;
  name: string;
  email: string;
  socialMedia: string;
  experience: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: any;
}

interface Inquiry {
  id: string;
  adId: string;
  adTitle: string;
  senderName: string;
  senderEmail: string;
  message: string;
  status: 'new' | 'read' | 'replied';
  createdAt: any;
}

interface Bot {
  id: string;
  name: string;
  role: 'CEO' | 'Analyst' | 'Compliance' | 'Content Curation' | 'Marketing' | 'Marketing & SEO' | 'Logistics';
  status: 'active' | 'idle' | 'processing';
  lastAction: string;
  updatedAt: any;
  enabled?: boolean;
}

interface Chat {
  id: string;
  adId: string;
  buyerId: string;
  sellerId: string;
  createdAt: any;
  updatedAt: any;
}

interface Message {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  createdAt: any;
}

interface MarketAnalysis {
  id: string;
  category: string;
  trend: string;
  demandScore: number;
  recommendation: string;
  createdAt: any;
}

// --- Components ---

const ErrorBoundary = ({ children }: { children: React.ReactNode }) => {
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      if (event.error?.message?.startsWith('{')) {
        try {
          const info = JSON.parse(event.error.message);
          setErrorMessage(`Erro de permissão (${info.operationType} em ${info.path}).`);
        } catch {
          setErrorMessage(event.error.message);
        }
      } else {
        setErrorMessage(event.error?.message || 'Ocorreu um erro inesperado.');
      }
      setHasError(true);
    };
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="bg-[#111] p-8 rounded-2xl border border-gold/20 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-gold mx-auto mb-4" />
          <h2 className="text-2xl font-serif text-white mb-2">Sistema Indisponível</h2>
          <p className="text-gray-400 mb-6">{errorMessage}</p>
          <button onClick={() => window.location.reload()} className="gold-button px-6 py-2 rounded-full">Recarregar</button>
        </div>
      </div>
    );
  }
  return <>{children}</>;
};

const Navbar = ({ user }: { user: FirebaseUser | null }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAdmin } = useIsAdmin();
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'en' ? 'pt' : 'en');
  };

  return (
    <nav className="bg-black/80 backdrop-blur-xl border-b border-gold/10 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          <Link to="/" className="flex items-center gap-3">
            <Crown className="text-gold w-8 h-8" />
            <span className="text-2xl font-serif font-light tracking-[0.2em] text-white">VENDI<span className="text-gold font-bold">FREE</span></span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <button onClick={toggleLanguage} className="text-xs font-bold uppercase tracking-widest text-gold hover:text-white transition-colors">
              {i18n.language === 'en' ? 'PT' : 'EN'}
            </button>
            <Link to="/" className="text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-gold transition-colors">{t('nav.explore')}</Link>
            <Link to="/ambassadors" className="text-xs font-bold uppercase tracking-widest text-gold hover:text-white transition-colors flex items-center gap-2">
              <Award className="w-4 h-4" />
              {t('nav.ambassadors')}
            </Link>
            <Link to="/network" className="text-xs font-bold uppercase tracking-widest text-white hover:text-gold transition-colors flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              Rede
            </Link>
            <Link to="/ambassador-dashboard" className="text-xs font-bold uppercase tracking-widest text-white hover:text-gold transition-colors flex items-center gap-2">
              <Gem className="w-4 h-4" />
              {t('nav.dashboard')}
            </Link>
            <Link to="/chats" className="text-xs font-bold uppercase tracking-widest text-white hover:text-gold transition-colors flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              {t('nav.messages')}
            </Link>
            <Link to="/profile" className="text-xs font-bold uppercase tracking-widest text-white hover:text-gold transition-colors flex items-center gap-2">
              <User className="w-4 h-4" />
              Perfil
            </Link>
            {isAdmin && (
              <Link to="/admin" className="text-xs font-bold uppercase tracking-widest text-white hover:text-gold transition-colors flex items-center gap-2">
                <Crown className="w-4 h-4" />
                {t('nav.admin')}
              </Link>
            )}
            {user ? (
              <>
                <Link to="/create" className="gold-button px-6 py-2 rounded-full text-xs uppercase tracking-widest flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  {t('nav.listAsset')}
                </Link>
                <div className="flex items-center gap-4 pl-6 border-l border-gold/20">
                  <img src={user.photoURL || ''} alt="" className="w-8 h-8 rounded-full border border-gold/30" loading="lazy" referrerPolicy="no-referrer" />
                  <button onClick={logout} className="text-gray-500 hover:text-gold transition-colors">
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <button onClick={loginWithGoogle} className="text-[10px] font-bold uppercase tracking-widest text-white border border-gold/50 px-4 py-2 rounded-full hover:bg-gold hover:text-black transition-all flex items-center gap-2">
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                  Google
                </button>
                <button onClick={loginWithFacebook} className="text-[10px] font-bold uppercase tracking-widest text-white bg-[#1877F2] px-4 py-2 rounded-full hover:bg-[#166fe5] transition-all flex items-center gap-2">
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  Facebook
                </button>
              </div>
            )}
          </div>

          <button className="md:hidden text-gold" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden bg-black border-t border-gold/10 p-6 space-y-6">
          <button onClick={toggleLanguage} className="block text-gold font-bold uppercase tracking-widest text-sm">
            {i18n.language === 'en' ? 'PT' : 'EN'}
          </button>
          <Link to="/" className="block text-gold font-bold uppercase tracking-widest text-sm">{t('nav.explore')}</Link>
          <Link to="/ambassadors" className="block text-white font-bold uppercase tracking-widest text-sm">{t('nav.ambassadors')}</Link>
          {user && (
            <>
              <Link to="/ambassador-dashboard" className="block text-white font-bold uppercase tracking-widest text-sm">{t('nav.dashboard')}</Link>
              <Link to="/chats" className="block text-white font-bold uppercase tracking-widest text-sm">{t('nav.messages')}</Link>
              <Link to="/profile" className="block text-white font-bold uppercase tracking-widest text-sm">Perfil</Link>
              <Link to="/admin-login" className="block text-gold font-bold uppercase tracking-widest text-sm">Admin Login</Link>
              <Link to="/create" className="block text-gold font-bold uppercase tracking-widest text-sm">{t('nav.listAsset')}</Link>
            </>
          )}
          {isAdmin && (
            <Link to="/admin" className="block text-white font-bold uppercase tracking-widest text-sm">{t('nav.admin')}</Link>
          )}
          {user ? (
            <>
              <button onClick={logout} className="block text-red-500 font-bold uppercase tracking-widest text-sm">{t('nav.logout')}</button>
            </>
          ) : (
            <div className="space-y-3">
              <button onClick={loginWithGoogle} className="w-full text-gold font-bold uppercase tracking-widest text-sm flex items-center gap-2">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                {t('nav.login')} (Google)
              </button>
              <button onClick={loginWithFacebook} className="w-full text-[#1877F2] font-bold uppercase tracking-widest text-sm flex items-center gap-2">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                {t('nav.login')} (Facebook)
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

const Home = () => {
  const [ads, setAds] = useState<Ad[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [showPremiumOnly, setShowPremiumOnly] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const adsPerPage = 12;

  const categories = [
    { name: 'Todas', icon: <Gem className="w-4 h-4" /> },
    { name: 'Private Islands', icon: <Palmtree className="w-4 h-4" /> },
    { name: 'Superyachts', icon: <Anchor className="w-4 h-4" /> },
    { name: 'Luxury Villas', icon: <Crown className="w-4 h-4" /> },
    { name: 'Exclusive Charters', icon: <Compass className="w-4 h-4" /> },
    { name: 'Bespoke Experiences', icon: <Sparkles className="w-4 h-4" /> }
  ];

  useEffect(() => {
    const q = query(collection(db, 'ads'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const adsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ad));
      setAds(adsData);
      setCurrentPage(1); // Reset to page 1 when ads change
    });
    return unsubscribe;
  }, []);

  const filteredAds = useMemo(() => {
    return ads.filter(ad => {
      const matchesSearch = ad.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            ad.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'Todas' || ad.category === selectedCategory;
      const matchesPremium = !showPremiumOnly || ad.isPremium;
      return matchesSearch && matchesCategory && matchesPremium;
    });
  }, [ads, searchTerm, selectedCategory, showPremiumOnly]);

  const totalPages = Math.ceil(filteredAds.length / adsPerPage);
  const currentAds = filteredAds.slice((currentPage - 1) * adsPerPage, currentPage * adsPerPage);

  const eliteDestinations = [
    { name: 'Bora Bora', image: 'https://images.unsplash.com/photo-1506929113675-88afdec58abb?auto=format&fit=crop&w=800&q=80' },
    { name: 'Moorea', image: 'https://images.unsplash.com/photo-1500930287596-c1ecadef7373?auto=format&fit=crop&w=800&q=80' },
    { name: 'Tahiti', image: 'https://images.unsplash.com/photo-1505881502353-a1986add373c?auto=format&fit=crop&w=800&q=80' },
    { name: 'Tetiaroa', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Section */}
      <div className="relative h-[70vh] rounded-[4rem] overflow-hidden mb-24 group">
        <img 
          src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1920&q=80" 
          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" 
          alt="Polynesia Luxury"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-px w-12 bg-gold" />
            <span className="text-gold font-bold uppercase tracking-[0.5em] text-[10px]">The Private Circle</span>
            <div className="h-px w-12 bg-gold" />
          </div>
          <h1 className="text-6xl md:text-8xl font-serif text-white mb-8 tracking-tight leading-none">
            Polinésia <span className="text-gold italic">Elite</span>
          </h1>
          <p className="text-white/80 font-light tracking-[0.2em] uppercase text-xs mb-12 max-w-xl leading-relaxed">
            Acesso exclusivo aos ativos mais cobiçados do Pacífico Sul. Curadoria rigorosa para o mercado de ultra-luxo.
          </p>
          
          <div className="w-full max-w-2xl relative">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gold w-5 h-5" />
            <input 
              type="text" 
              placeholder="Pesquise o seu próximo paraíso..." 
              className="w-full h-20 pl-16 pr-8 rounded-full bg-white/10 backdrop-blur-xl border border-gold/30 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gold/50 transition-all shadow-2xl"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Elite Destinations */}
      <div className="mb-24">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-4xl font-serif text-white mb-2">Destinos de <span className="text-gold">Elite</span></h2>
            <p className="text-gray-500 text-xs uppercase tracking-widest">As localizações mais exclusivas do arquipélago</p>
          </div>
          <div className="h-px flex-1 mx-12 bg-gold/10 hidden md:block" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {eliteDestinations.map(dest => (
            <div key={dest.name} className="group relative aspect-[4/5] rounded-3xl overflow-hidden cursor-pointer">
              <img src={dest.image} alt={dest.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" referrerPolicy="no-referrer" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <div className="absolute bottom-6 left-6">
                <div className="text-gold text-[8px] font-bold uppercase tracking-widest mb-1">Polinésia Francesa</div>
                <div className="text-white font-serif text-xl">{dest.name}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters & Categories */}
      <div className="space-y-8 mb-16">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map(cat => (
              <button
                key={cat.name}
                onClick={() => setSelectedCategory(cat.name)}
                className={cn(
                  "px-6 py-3 rounded-full text-[9px] font-bold uppercase tracking-[0.2em] transition-all flex items-center gap-3 border whitespace-nowrap",
                  selectedCategory === cat.name 
                    ? "bg-gold text-black border-gold" 
                    : "bg-transparent text-gray-400 border-gold/10 hover:border-gold hover:text-gold"
                )}
              >
                {cat.icon}
                {cat.name}
              </button>
            ))}
          </div>
          
          <button 
            onClick={() => setShowPremiumOnly(!showPremiumOnly)}
            className={cn(
              "flex items-center gap-3 px-6 py-3 rounded-full text-[9px] font-bold uppercase tracking-[0.2em] border transition-all",
              showPremiumOnly ? "bg-gold/20 text-gold border-gold" : "text-gray-500 border-gray-800 hover:border-gold"
            )}
          >
            <Crown className="w-4 h-4" />
            Apenas Premium
          </button>
        </div>
      </div>

      {/* Luxury Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
        {currentAds.map(ad => (
          <Link key={ad.id} to={`/ad/${ad.id}`} className={cn(
            "group relative bg-[#0a0a0a] rounded-[2rem] overflow-hidden border transition-all duration-700",
            ad.isPremium ? "border-gold/40 shadow-[0_0_50px_rgba(212,175,55,0.15)]" : "border-gold/5 hover:border-gold/30"
          )}>
            <div className="aspect-[4/5] overflow-hidden">
              <img 
                src={ad.images?.[0] || `https://picsum.photos/seed/${ad.id}/800/1000`} 
                alt={ad.title} 
                className="w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-105"
                referrerPolicy="no-referrer"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-90" />
              {ad.isPremium && (
                <div className="absolute top-6 left-6 bg-gold text-black px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                  <Crown className="w-3 h-3" />
                  Premium
                </div>
              )}
            </div>
            
            <div className="absolute bottom-0 left-0 right-0 p-8">
              <div className="text-[9px] font-bold text-gold uppercase tracking-[0.3em] mb-3">{ad.category}</div>
              <h3 className="text-2xl font-serif text-white mb-4 group-hover:text-gold transition-colors duration-500">{ad.title}</h3>
              <div className="flex items-center justify-between border-t border-white/10 pt-4">
                <div className="text-xl font-light text-white">
                  {ad.price.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
                </div>
                <div className="flex items-center gap-2 text-[9px] text-gray-400 uppercase tracking-[0.2em]">
                  <MapPin className="w-3 h-3 text-gold" />
                  {ad.location}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center mt-12 gap-4">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-6 py-3 rounded-full bg-white text-black disabled:opacity-50 font-sans font-medium transition-opacity"
          >
            Anterior
          </button>
          <span className="text-white font-mono">
            Página {currentPage} de {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-6 py-3 rounded-full bg-white text-black disabled:opacity-50 font-sans font-medium transition-opacity"
          >
            Próxima
          </button>
        </div>
      )}
    </div>
  );
};

const AmbassadorRecruitment = ({ user }: { user: FirebaseUser | null }) => {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    socialMedia: '',
    experience: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, 'ambassadors'), {
        ...formData,
        userId: user?.uid || 'guest',
        status: 'pending',
        createdAt: serverTimestamp()
      });
      setSubmitted(true);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center px-4">
        <CheckCircle className="w-20 h-20 text-gold mx-auto mb-8" />
        <h2 className="text-4xl font-serif mb-4">Candidatura Recebida</h2>
        <p className="text-gray-400 font-light leading-relaxed">
          A nossa equipa de curadoria irá analisar o seu perfil. Entraremos em contacto em breve para discutir a sua entrada no círculo de elite da Polinésia.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-20 px-4">
      <div className="text-center mb-16">
        <Award className="w-12 h-12 text-gold mx-auto mb-6" />
        <h1 className="text-5xl font-serif mb-6">Torne-se um <span className="text-gold">Embaixador</span></h1>
        <p className="text-gray-400 font-light max-w-2xl mx-auto leading-relaxed">
          Procuramos visionários e influenciadores do mercado de luxo para representar os ativos mais exclusivos do mundo nas ilhas da Polinésia.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-[#0a0a0a] p-12 rounded-[3rem] border border-gold/20 space-y-8 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-gold">Nome Completo</label>
            <input 
              required
              type="text" 
              className="w-full bg-transparent border-b border-white/10 py-4 focus:border-gold outline-none transition-all text-white placeholder:text-white/20"
              placeholder="O seu nome"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-gold">Email de Contacto</label>
            <input 
              required
              type="email" 
              className="w-full bg-transparent border-b border-white/10 py-4 focus:border-gold outline-none transition-all text-white placeholder:text-white/20"
              placeholder="O seu email"
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-gold">Redes Sociais / Portfolio</label>
          <input 
            required
            type="text" 
            placeholder="Instagram, LinkedIn ou Website"
            className="w-full bg-black border-b border-gold/30 py-4 focus:border-gold outline-none transition-all text-white"
            value={formData.socialMedia}
            onChange={e => setFormData({...formData, socialMedia: e.target.value})}
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-gold">Porquê a Polinésia Elite?</label>
          <textarea 
            required
            className="w-full bg-black border-b border-gold/30 py-4 focus:border-gold outline-none transition-all text-white h-32"
            value={formData.experience}
            onChange={e => setFormData({...formData, experience: e.target.value})}
          />
        </div>
        <button 
          disabled={loading}
          className="w-full gold-button py-5 rounded-full uppercase tracking-[0.3em] text-xs font-black shadow-2xl shadow-gold/10"
        >
          {loading ? 'A Enviar...' : 'Solicitar Acreditação'}
        </button>
      </form>
    </div>
  );
};

const CreateAd = ({ user }: { user: FirebaseUser | null }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const { isAdmin } = useIsAdmin();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: 'Luxury Villas',
    location: '',
    features: '',
    isPremium: false,
    transactionType: 'sale'
  });

  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files) as File[];
      setImageFiles(prev => [...prev, ...files]);
      const previews = files.map(file => URL.createObjectURL(file));
      setImagePreviews(prev => [...prev, ...previews]);
    }
  };

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSmartDescription = async () => {
    if (!formData.title || !formData.features) return alert("Preencha o título e características.");
    setGenerating(true);
    const desc = await generateAdDescription(formData.title, formData.category, formData.features);
    setFormData(prev => ({ ...prev, description: desc }));
    setGenerating(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (parseFloat(formData.price) <= 0) {
      alert("O preço deve ser um valor positivo.");
      setLoading(false);
      return;
    }
    try {
      const uploadedUrls: string[] = [];
      for (const file of imageFiles) {
        const storageRef = ref(storage, `ads/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        uploadedUrls.push(url);
      }

      const adRef = await addDoc(collection(db, 'ads'), {
        ...formData,
        price: parseFloat(formData.price),
        authorId: user?.uid || 'guest',
        authorName: user?.displayName || 'Membro Elite',
        authorEmail: user?.email || 'guest@vendifree.com',
        status: formData.isPremium ? 'pending_payment' : 'active',
        createdAt: serverTimestamp(),
        images: uploadedUrls.length > 0 ? uploadedUrls : [`https://picsum.photos/seed/${Date.now()}/1200/900`]
      });

      if (formData.isPremium) {
        const response = await fetch('/api/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            adId: adRef.id,
            title: formData.title,
            price: 50, // Premium price
            type: 'featured_ad',
            successUrl: `${window.location.origin}/payment-success?adId=${adRef.id}`,
            cancelUrl: `${window.location.origin}/create-ad`
          })
        });
        const { url } = await response.json();
        window.location.href = url;
      } else {
        navigate('/');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-20 px-4">
      <h1 className="text-4xl font-serif mb-12 text-center">Listar Novo <span className="text-gold">Ativo de Luxo</span></h1>
      <form onSubmit={handleSubmit} className="bg-[#111] p-10 rounded-[3rem] border border-gold/20 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <select className="w-full bg-black border-b border-gold/30 py-4 outline-none text-gold" value={formData.transactionType} onChange={e => setFormData({...formData, transactionType: e.target.value})}>
            <option value="sale">Venda</option>
            <option value="rent">Aluguer</option>
          </select>
          <select className="w-full bg-black border-b border-gold/30 py-4 outline-none text-gold" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
            <option>Private Islands</option>
            <option>Superyachts</option>
            <option>Luxury Villas</option>
            <option>Exclusive Charters</option>
            <option>Bespoke Experiences</option>
          </select>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <input required placeholder="Título do Ativo" className="w-full bg-black border-b border-gold/30 py-4 outline-none text-white" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
          <input required type="number" min="0.01" step="0.01" placeholder={formData.transactionType === 'rent' ? "Valor por noite (€)" : "Valor Total (€)"} className="w-full bg-black border-b border-gold/30 py-4 outline-none text-white" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
        </div>
        <div className="flex items-center gap-4">
          <input 
            type="checkbox" 
            id="isPremium" 
            checked={formData.isPremium} 
            onChange={e => setFormData({...formData, isPremium: e.target.checked})} 
            className="w-5 h-5 accent-gold"
          />
          <label htmlFor="isPremium" className="text-gold">Destaque (Premium - 50€)</label>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <input required placeholder="Localização (ex: Bora Bora)" className="w-full bg-black border-b border-gold/30 py-4 outline-none text-white" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
        </div>
        
        {isAdmin && (
          <div className="flex items-center gap-4 p-4 bg-gold/10 rounded-2xl border border-gold/30">
            <input 
              type="checkbox" 
              id="isPremium"
              className="w-5 h-5 accent-gold"
              checked={formData.isPremium}
              onChange={e => setFormData({...formData, isPremium: e.target.checked})}
            />
            <label htmlFor="isPremium" className="text-xs font-bold uppercase tracking-widest text-gold cursor-pointer">Destaque Premium (Admin Only)</label>
          </div>
        )}

        <div className="p-6 bg-gold/5 rounded-2xl border border-gold/20 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-gold uppercase tracking-widest">Curadoria IA</span>
            <button type="button" onClick={handleSmartDescription} disabled={generating} className="text-[10px] bg-gold text-black px-4 py-1 rounded-full font-bold uppercase">{generating ? 'A Gerar...' : 'Gerar Descrição'}</button>
          </div>
          <textarea placeholder="Características exclusivas..." className="w-full bg-transparent border-none outline-none text-white text-sm h-20" value={formData.features} onChange={e => setFormData({...formData, features: e.target.value})} />
        </div>
        <textarea required placeholder="Descrição Detalhada" className="w-full bg-black border-b border-gold/30 py-4 outline-none text-white h-40" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-poly-coral uppercase tracking-widest flex items-center gap-2"><ImageIcon className="w-4 h-4" /> Imagens do Ativo</span>
            <label className="text-[10px] border border-poly-coral text-poly-coral px-4 py-1 rounded-full font-bold uppercase hover:bg-poly-coral hover:text-poly-dark transition-colors cursor-pointer">
              + Adicionar Imagens
              <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageChange} />
            </label>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {imagePreviews.map((preview, index) => (
              <div key={index} className="relative group rounded-xl overflow-hidden border border-poly-coral/20 aspect-video">
                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                <button 
                  type="button" 
                  onClick={() => removeImage(index)} 
                  className="absolute top-2 right-2 bg-poly-dark/80 text-poly-sunset p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <button disabled={loading} className="w-full gold-button py-5 rounded-full uppercase tracking-[0.3em] text-xs font-black">{loading ? 'A Publicar...' : 'Confirmar Listagem'}</button>
      </form>
    </div>
  );
};

const ChatModal = ({ ad, user, onClose }: { ad: Ad, user: FirebaseUser, onClose: () => void }) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatId, setChatId] = useState<string | null>(null);

  useEffect(() => {
    // Find or create chat
    const findChat = async () => {
      const q = query(
        collection(db, 'chats'),
        and(
          where('adId', '==', ad.id),
          or(where('buyerId', '==', user.uid), where('sellerId', '==', user.uid))
        )
      );
      
      try {
        const snapshot = await getDocs(q);
        const existingChat = snapshot.docs.find(doc => {
          const data = doc.data();
          return data.adId === ad.id && 
                 ((data.buyerId === user.uid && data.sellerId === ad.authorId) ||
                  (data.sellerId === user.uid && data.buyerId === ad.authorId));
        });

        if (existingChat) {
          setChatId(existingChat.id);
        } else if (user.uid !== ad.authorId) {
          // Create new chat if buyer
          const newChatRef = await addDoc(collection(db, 'chats'), {
            adId: ad.id,
            adTitle: ad.title,
            buyerId: user.uid,
            buyerName: user.displayName || 'Comprador Elite',
            sellerId: ad.authorId,
            sellerName: ad.authorName,
            createdAt: serverTimestamp(),
            lastMessage: '',
            lastMessageAt: serverTimestamp()
          });
          setChatId(newChatRef.id);
        }
      } catch (error) {
        console.error("Error finding or creating chat:", error);
      }
    };
    
    findChat();
  }, [ad, user]);

  useEffect(() => {
    if (!chatId) return;
    const q = query(
      collection(db, `chats/${chatId}/messages`),
      orderBy('createdAt', 'asc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return unsubscribe;
  }, [chatId]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !chatId) return;

    try {
      await addDoc(collection(db, `chats/${chatId}/messages`), {
        senderId: user.uid,
        senderName: user.displayName || 'Membro Elite',
        text: newMessage,
        createdAt: serverTimestamp()
      });
      await updateDoc(doc(db, 'chats', chatId), {
        lastMessage: newMessage,
        lastMessageAt: serverTimestamp()
      });
      setNewMessage('');
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
      <div className="bg-[#111] border border-gold/20 rounded-[2rem] w-full max-w-2xl h-[80vh] flex flex-col overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-gold/10 flex justify-between items-center bg-black/50">
          <div>
            <h3 className="text-xl font-serif text-white">{ad.title}</h3>
            <p className="text-xs text-gold uppercase tracking-widest mt-1">Chat com {user.uid === ad.authorId ? 'Comprador' : 'Vendedor'}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={cn("flex flex-col", msg.senderId === user.uid ? "items-end" : "items-start")}>
              <span className="text-[10px] text-gray-500 mb-1 px-2">{msg.senderName}</span>
              <div className={cn(
                "px-6 py-3 rounded-2xl max-w-[80%]",
                msg.senderId === user.uid 
                  ? "bg-gold text-black rounded-tr-sm" 
                  : "bg-white/5 text-white border border-gold/10 rounded-tl-sm"
              )}>
                {msg.text}
              </div>
            </div>
          ))}
          {messages.length === 0 && (
            <div className="h-full flex items-center justify-center text-gray-500 text-sm italic">
              Inicie a conversa sobre este ativo exclusivo...
            </div>
          )}
        </div>

        <form onSubmit={sendMessage} className="p-4 border-t border-gold/10 bg-black/50 flex gap-4">
          <input 
            type="text" 
            placeholder="Escreva a sua mensagem..." 
            className="flex-1 bg-white/5 border border-gold/20 rounded-full px-6 py-3 text-white outline-none focus:border-gold transition-colors"
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
          />
          <button type="submit" disabled={!newMessage.trim()} className="bg-gold text-black w-12 h-12 rounded-full flex items-center justify-center disabled:opacity-50 hover:bg-gold/90 transition-colors">
            <Send className="w-5 h-5 ml-1" />
          </button>
        </form>
      </div>
    </div>
  );
};

const AdDetails = ({ user }: { user: FirebaseUser | null }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ad, setAd] = useState<Ad | null>(null);
  const [inquirySent, setInquirySent] = useState(false);
  const [inquiryLoading, setInquiryLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState(0);
  const [showChat, setShowChat] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'canceled' | null>(null);

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const payment = queryParams.get('payment');
    const reservationId = queryParams.get('reservationId');

    if (payment === 'success' && reservationId) {
      setPaymentStatus('success');
      updateDoc(doc(db, 'reservations', reservationId), { status: 'paid' }).then(() => {
        // Send email notification to admin/seller
        fetch('/api/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: 'PortaldosPombos@gmail.com', // Admin email
            subject: `Novo pagamento recebido!`,
            html: `<p>Um novo pagamento foi efetuado com sucesso para a reserva ${reservationId}.</p>`
          })
        }).catch(console.error);
      }).catch(console.error);
    } else if (payment === 'canceled' && reservationId) {
      setPaymentStatus('canceled');
      updateDoc(doc(db, 'reservations', reservationId), { status: 'canceled' }).catch(console.error);
    }

    if (!id) return;
    getDoc(doc(db, 'ads', id)).then(snap => {
      if (snap.exists()) setAd({ id: snap.id, ...snap.data() } as Ad);
    });
  }, [id]);

  const handleInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ad) return;
    setInquiryLoading(true);
    try {
      await addDoc(collection(db, 'inquiries'), {
        adId: ad.id,
        adTitle: ad.title,
        authorId: ad.authorId,
        senderId: user?.uid || 'guest',
        senderName: user?.displayName || 'Membro Elite',
        senderEmail: user?.email || 'guest@vendifree.com',
        message,
        status: 'new',
        createdAt: serverTimestamp()
      });
      
      // Send email notification
      await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: ad.authorEmail || 'PortaldosPombos@gmail.com', // fallback to admin if author email not available
          subject: `Novo inquérito para: ${ad.title}`,
          html: `<p>Olá,</p><p>Recebeu um novo inquérito de ${user?.displayName || 'Membro Elite'} sobre o seu anúncio <strong>${ad.title}</strong>.</p><p>Mensagem:</p><blockquote>${message}</blockquote><p>Aceda à plataforma Vendifree para responder.</p>`
        })
      }).catch(console.error);

      setInquirySent(true);
    } catch (error) {
      console.error(error);
    } finally {
      setInquiryLoading(false);
    }
  };

  if (!ad) return <div className="h-96 flex items-center justify-center text-gold animate-pulse">Carregando Ativo...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        <div className="space-y-6">
          <div className="rounded-[3rem] overflow-hidden border border-gold/20 shadow-2xl relative aspect-[3/4]">
            <img src={ad.images?.[selectedImage] || `https://picsum.photos/seed/${ad.id}/1200/1600`} className="w-full h-full object-cover" alt="" />
            {ad.isPremium && (
              <div className="absolute top-10 left-10 bg-gold text-black px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-2xl">
                <Crown className="w-4 h-4" />
                Ativo Premium
              </div>
            )}
          </div>
          {ad.images && ad.images.length > 1 && (
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {ad.images.map((img, idx) => (
                <button 
                  key={idx} 
                  onClick={() => setSelectedImage(idx)}
                  className={cn(
                    "w-24 h-24 rounded-2xl overflow-hidden border-2 flex-shrink-0 transition-all",
                    selectedImage === idx ? "border-gold" : "border-transparent opacity-50 hover:opacity-100"
                  )}
                >
                  <img src={img} className="w-full h-full object-cover" alt="" />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="space-y-10">
          <div>
            <div className="text-gold font-bold uppercase tracking-[0.4em] text-xs mb-4">{ad.category}</div>
            <h1 className="text-6xl font-serif text-white mb-6 leading-tight">{ad.title}</h1>
            <div className="text-4xl font-light text-gold">
              {ad.price.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
              {ad.transactionType === 'rent' && <span className="text-sm text-gray-400 ml-2">/ noite</span>}
            </div>
          </div>
          <div className="flex gap-10 py-8 border-y border-gold/10">
            <div>
              <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Localização</div>
              <div className="text-white font-medium">{ad.location}</div>
            </div>
            <div>
              <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Curadoria</div>
              <div className="text-white font-medium">{ad.authorName}</div>
            </div>
          </div>
          <p className="text-gray-400 font-light leading-relaxed text-lg whitespace-pre-wrap">{ad.description}</p>
          
          {/* Map Section */}
          <div className="rounded-[2rem] overflow-hidden border border-gold/20 h-64 relative z-0 flex items-center justify-center bg-[#111] text-gold/50">
            <MapPin className="w-8 h-8 mr-2" />
            <span>Localização: {ad.location}</span>
          </div>

          <div className="flex gap-4">
            {user?.uid !== ad.authorId && (
              <button 
                onClick={() => {
                  setShowChat(true);
                }}
                className="flex-1 border border-gold text-gold py-6 rounded-full uppercase tracking-[0.3em] text-xs font-black hover:bg-gold hover:text-black transition-all flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-5 h-5" />
                Chat Direto
              </button>
            )}
          </div>

          {paymentStatus === 'success' && (
            <div className="bg-green-500/10 border border-green-500/30 p-8 rounded-[2rem] text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-serif text-white mb-2">Pagamento Confirmado!</h3>
              <p className="text-sm text-gray-400">A sua transação foi concluída com sucesso. O curador entrará em contacto em breve.</p>
            </div>
          )}

          {paymentStatus === 'canceled' && (
            <div className="bg-red-500/10 border border-red-500/30 p-8 rounded-[2rem] text-center">
              <h3 className="text-xl font-serif text-white mb-2">Pagamento Cancelado</h3>
              <p className="text-sm text-gray-400">A sua transação foi cancelada. Não foi efetuada qualquer cobrança.</p>
            </div>
          )}

          {user?.uid !== ad.authorId && paymentStatus !== 'success' && (
            <div className="bg-[#111] p-8 rounded-[2rem] border border-gold/10 space-y-6">
              <h3 className="text-xl font-serif text-white">
                {ad.transactionType === 'rent' ? 'Reservar Ativo' : 'Adquirir Ativo'}
              </h3>
              {ad.transactionType === 'rent' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gold">Data de Início</label>
                    <input type="date" className="w-full bg-black border border-gold/20 rounded-xl p-4 text-white outline-none" value={startDate} onChange={e => setStartDate(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gold">Data de Fim</label>
                    <input type="date" className="w-full bg-black border border-gold/20 rounded-xl p-4 text-white outline-none" value={endDate} onChange={e => setEndDate(e.target.value)} />
                  </div>
                </div>
              )}
              <button 
                disabled={bookingLoading || (ad.transactionType === 'rent' && (!startDate || !endDate))}
                onClick={async () => {
                  setBookingLoading(true);
                  try {
                    let finalPrice = ad.price;
                    if (ad.transactionType === 'rent') {
                      const start = new Date(startDate);
                      const end = new Date(endDate);
                      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24));
                      if (days <= 0) {
                        alert("Data de fim deve ser posterior à data de início.");
                        setBookingLoading(false);
                        return;
                      }
                      finalPrice = ad.price * days;
                    }

                    // Create reservation record
                    const resRef = await addDoc(collection(db, 'reservations'), {
                      adId: ad.id,
                      buyerId: user?.uid || 'guest',
                      sellerId: ad.authorId,
                      startDate: startDate || null,
                      endDate: endDate || null,
                      totalPrice: finalPrice,
                      status: 'pending',
                      createdAt: serverTimestamp()
                    });

                    // Call Stripe checkout
                    const response = await fetch('/api/checkout', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        adId: ad.id,
                        title: ad.title,
                        price: finalPrice,
                        type: ad.transactionType,
                        successUrl: `${window.location.origin}/ad/${ad.id}?payment=success&reservationId=${resRef.id}`,
                        cancelUrl: `${window.location.origin}/ad/${ad.id}?payment=canceled&reservationId=${resRef.id}`
                      })
                    });
                    const data = await response.json();
                    if (data.url) {
                      window.location.href = data.url;
                    } else {
                      throw new Error(data.error || "Erro ao iniciar pagamento");
                    }
                  } catch (error: any) {
                    console.error("Booking error:", error);
                    alert(error.message);
                  } finally {
                    setBookingLoading(false);
                  }
                }}
                className="w-full gold-button py-6 rounded-full uppercase tracking-[0.3em] text-xs font-black"
              >
                {bookingLoading ? 'A Processar...' : (ad.transactionType === 'rent' ? 'Reservar Agora' : 'Comprar Agora')}
              </button>
            </div>
          )}

          {inquirySent ? (
            <div className="bg-gold/10 border border-gold/30 p-8 rounded-[2rem] text-center">
              <CheckCircle className="w-12 h-12 text-gold mx-auto mb-4" />
              <h3 className="text-xl font-serif text-white mb-2">Inquérito Enviado</h3>
              <p className="text-sm text-gray-400">O curador entrará em contacto através do seu email privado.</p>
            </div>
          ) : (
            <form onSubmit={handleInquiry} className="space-y-6 bg-[#111] p-8 rounded-[2rem] border border-gold/10">
              <h3 className="text-xl font-serif text-white">Solicitar Informações Privadas</h3>
              <textarea 
                required
                placeholder="Escreva a sua mensagem para o curador..."
                className="w-full bg-black border border-gold/20 rounded-xl p-4 text-white focus:border-gold outline-none h-32 transition-all"
                value={message}
                onChange={e => setMessage(e.target.value)}
              />
              <button 
                disabled={inquiryLoading}
                className="w-full gold-button py-6 rounded-full uppercase tracking-[0.3em] text-xs font-black"
              >
                {inquiryLoading ? 'Enviando...' : 'Enviar Solicitação'}
              </button>
            </form>
          )}

          {user?.uid === ad.authorId && (
            <button onClick={() => deleteDoc(doc(db, 'ads', ad.id)).then(() => navigate('/'))} className="w-full border border-red-500/30 text-red-500 py-4 rounded-full text-xs uppercase font-bold hover:bg-red-500 hover:text-white transition-all">Remover Listagem</button>
          )}
        </div>
      </div>
      {showChat && user && <ChatModal ad={ad} user={user} onClose={() => setShowChat(false)} />}
    </div>
  );
};

const MyChats = ({ user }: { user: FirebaseUser | null }) => {
  const [chats, setChats] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    const uid = user?.uid || 'guest';
    const q = query(
      collection(db, 'chats'),
      or(where('buyerId', '==', uid), where('sellerId', '==', uid))
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const userChats = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a: any, b: any) => (b.lastMessageAt?.toMillis() || 0) - (a.lastMessageAt?.toMillis() || 0));
      setChats(userChats);
    });
    return unsubscribe;
  }, [user]);

  useEffect(() => {
    if (!selectedChat) return;
    const q = query(
      collection(db, `chats/${selectedChat.id}/messages`),
      orderBy('createdAt', 'asc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return unsubscribe;
  }, [selectedChat]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat) return;

    try {
      await addDoc(collection(db, `chats/${selectedChat.id}/messages`), {
        senderId: user?.uid || 'guest',
        senderName: user?.displayName || 'Membro Elite',
        text: newMessage,
        createdAt: serverTimestamp()
      });
      await updateDoc(doc(db, 'chats', selectedChat.id), {
        lastMessage: newMessage,
        lastMessageAt: serverTimestamp()
      });
      setNewMessage('');
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 h-[calc(100vh-80px)] flex gap-6">
      <div className="w-1/3 bg-[#111] border border-gold/20 rounded-[2rem] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gold/10 bg-black/50">
          <h2 className="text-2xl font-serif text-white">Mensagens</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {chats.map(chat => {
            const isBuyer = chat.buyerId === user.uid;
            const otherName = isBuyer ? chat.sellerName : chat.buyerName;
            return (
              <button 
                key={chat.id}
                onClick={() => setSelectedChat(chat)}
                className={cn(
                  "w-full text-left p-6 border-b border-gold/5 hover:bg-white/5 transition-colors",
                  selectedChat?.id === chat.id ? "bg-white/5 border-l-4 border-l-gold" : ""
                )}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-white font-bold truncate pr-4">{chat.adTitle}</h3>
                  <span className="text-[10px] text-gold uppercase tracking-widest whitespace-nowrap">
                    {isBuyer ? 'Comprando' : 'Vendendo'}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mb-1">Com: {otherName}</p>
                <p className="text-sm text-gray-500 truncate">{chat.lastMessage || 'Nenhuma mensagem ainda'}</p>
              </button>
            );
          })}
          {chats.length === 0 && (
            <div className="p-8 text-center text-gray-500 italic text-sm">
              Não tem conversas ativas.
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 bg-[#111] border border-gold/20 rounded-[2rem] overflow-hidden flex flex-col">
        {selectedChat ? (
          <>
            <div className="p-6 border-b border-gold/10 bg-black/50">
              <h3 className="text-xl font-serif text-white">{selectedChat.adTitle}</h3>
              <p className="text-xs text-gold uppercase tracking-widest mt-1">
                Chat com {selectedChat.buyerId === user.uid ? selectedChat.sellerName : selectedChat.buyerName}
              </p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className={cn("flex flex-col", msg.senderId === user.uid ? "items-end" : "items-start")}>
                  <span className="text-[10px] text-gray-500 mb-1 px-2">{msg.senderName}</span>
                  <div className={cn(
                    "px-6 py-3 rounded-2xl max-w-[80%]",
                    msg.senderId === user.uid 
                      ? "bg-gold text-black rounded-tr-sm" 
                      : "bg-white/5 text-white border border-gold/10 rounded-tl-sm"
                  )}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {messages.length === 0 && (
                <div className="h-full flex items-center justify-center text-gray-500 text-sm italic">
                  Inicie a conversa...
                </div>
              )}
            </div>

            <form onSubmit={sendMessage} className="p-4 border-t border-gold/10 bg-black/50 flex gap-4">
              <input 
                type="text" 
                placeholder="Escreva a sua mensagem..." 
                className="flex-1 bg-white/5 border border-gold/20 rounded-full px-6 py-3 text-white outline-none focus:border-gold transition-colors"
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
              />
              <button type="submit" disabled={!newMessage.trim()} className="bg-gold text-black w-12 h-12 rounded-full flex items-center justify-center disabled:opacity-50 hover:bg-gold/90 transition-colors">
                <Send className="w-5 h-5 ml-1" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p>Selecione uma conversa para começar</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const AdminDashboard = ({ user }: { user: FirebaseUser | null }) => {
  const [apps, setApps] = useState<AmbassadorApp[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [bots, setBots] = useState<Bot[]>([]);
  const [analysis, setAnalysis] = useState<MarketAnalysis[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const { isAdmin } = useIsAdmin();

  useEffect(() => {
    const qApps = query(collection(db, 'ambassadors'), orderBy('createdAt', 'desc'));
    const unsubscribeApps = onSnapshot(qApps, (snapshot) => {
      setApps(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AmbassadorApp)));
    });

    const qInquiries = query(collection(db, 'inquiries'), orderBy('createdAt', 'desc'));
    const unsubscribeInquiries = onSnapshot(qInquiries, (snapshot) => {
      setInquiries(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Inquiry)));
    });

    const qBots = query(collection(db, 'bots'));
    const unsubscribeBots = onSnapshot(qBots, (snapshot) => {
      const botsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Bot));
      setBots(botsData);
      
      // Initialize bots if they don't exist
      if (snapshot.empty) {
        const initialBots = [
          { name: 'Aether', role: 'CEO', status: 'active', lastAction: 'Liderando a visão estratégica.', updatedAt: serverTimestamp() },
          { name: 'Aura', role: 'Compliance', status: 'active', lastAction: 'Garantindo conformidade legal.', updatedAt: serverTimestamp() },
          { name: 'Lumia', role: 'Content Curation', status: 'active', lastAction: 'Curando experiências de luxo.', updatedAt: serverTimestamp() },
          { name: 'Nova', role: 'Marketing & SEO', status: 'active', lastAction: 'Otimizando SEO e lançando campanhas.', updatedAt: serverTimestamp() },
          { name: 'Atlas', role: 'Logistics', status: 'active', lastAction: 'Otimizando rotas de entrega.', updatedAt: serverTimestamp() },
          { name: 'Analyst', role: 'Analyst', status: 'active', lastAction: 'Analisando tendências globais.', updatedAt: serverTimestamp() }
        ];
        initialBots.forEach(b => addDoc(collection(db, 'bots'), b));
      }
    });

    const qAnalysis = query(collection(db, 'market_analysis'), orderBy('createdAt', 'desc'));
    const unsubscribeAnalysis = onSnapshot(qAnalysis, (snapshot) => {
      setAnalysis(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MarketAnalysis)));
    });

    const qReservations = query(collection(db, 'reservations'), orderBy('createdAt', 'desc'));
    const unsubscribeReservations = onSnapshot(qReservations, (snapshot) => {
      setReservations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const qAds = query(collection(db, 'ads'));
    const unsubscribeAds = onSnapshot(qAds, (snapshot) => {
      setAds(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ad)));
    });

    return () => {
      unsubscribeApps();
      unsubscribeInquiries();
      unsubscribeBots();
      unsubscribeAnalysis();
      unsubscribeReservations();
      unsubscribeAds();
    };
  }, []);

  const handleUpdateStatus = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await updateDoc(doc(db, 'ambassadors', id), { status });
    } catch (error) {
      console.error(error);
    }
  };

  const handleUpdateInquiryStatus = async (id: string, status: 'read' | 'replied') => {
    try {
      await updateDoc(doc(db, 'inquiries', id), { status });
    } catch (error) {
      console.error(error);
    }
  };

  const handleManualBotControl = async (botId: string, updates: Partial<Bot>) => {
    try {
      await updateDoc(doc(db, 'bots', botId), {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error(error);
    }
  };

  const evolutionData = useMemo(() => {
    const data: any[] = [];
    const allDates = new Set([
      ...ads.map(a => a.createdAt?.toDate().toLocaleDateString() || ''),
      ...apps.map(a => a.createdAt?.toDate().toLocaleDateString() || '')
    ]);
    
    Array.from(allDates).sort().forEach(date => {
      data.push({
        date,
        ads: ads.filter(a => a.createdAt?.toDate().toLocaleDateString() === date).length,
        ambassadors: apps.filter(a => a.createdAt?.toDate().toLocaleDateString() === date).length
      });
    });
    return data;
  }, [ads, apps]);

  const runMarketAnalysis = async () => {
    // Simulate Aether Analyst bot action
    const analystBot = bots.find(b => b.role === 'Analyst');
    if (!analystBot || !analystBot.enabled) return;

    const categories = ["Private Islands", "Superyachts", "Luxury Villas", "Exclusive Charters", "Bespoke Experiences"];
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    const trends = ["Crescimento Exponencial", "Estável", "Alta Procura", "Oportunidade de Investimento"];
    const randomTrend = trends[Math.floor(Math.random() * trends.length)];
    
    try {
      await addDoc(collection(db, 'market_analysis'), {
        category: randomCategory,
        trend: randomTrend,
        demandScore: Math.floor(Math.random() * 100),
        recommendation: `Aether Analyst recomenda focar em ${randomCategory} devido à tendência de ${randomTrend}.`,
        createdAt: serverTimestamp()
      });
      
      // Update bot status
      const analystBot = bots.find(b => b.role === 'Analyst');
      if (analystBot) {
        await updateDoc(doc(db, 'bots', analystBot.id), {
          status: 'processing',
          lastAction: `Analisando mercado de ${randomCategory}...`,
          updatedAt: serverTimestamp()
        });
        setTimeout(async () => {
          await updateDoc(doc(db, 'bots', analystBot.id), {
            status: 'idle',
            lastAction: `Análise de ${randomCategory} concluída.`,
            updatedAt: serverTimestamp()
          });
        }, 3000);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const recruitTopAmbassadors = async () => {
    // Simulate Super CEO bot action
    const ceoBot = bots.find(b => b.role === 'CEO');
    if (!ceoBot || !ceoBot.enabled) return;

    if (ceoBot) {
      await updateDoc(doc(db, 'bots', ceoBot.id), {
        status: 'processing',
        lastAction: 'Aether está a recrutar embaixadores de elite...',
        updatedAt: serverTimestamp()
      });
      
      // Automatically approve pending applications if they meet "criteria"
      const pendingApps = apps.filter(a => a.status === 'pending');
      for (const app of pendingApps) {
        if (app.experience.length > 50) { // Simple criteria
          await updateDoc(doc(db, 'ambassadors', app.id), { status: 'approved' });
        }
      }

      setTimeout(async () => {
        await updateDoc(doc(db, 'bots', ceoBot.id), {
          status: 'idle',
          lastAction: 'Recrutamento concluído. Novos embaixadores integrados.',
          updatedAt: serverTimestamp()
        });
      }, 3000);
    }
  };

  const runComplianceCheck = async () => {
    // Simulate Aura Compliance bot action
    const cooBot = bots.find(b => b.role === 'Compliance');
    if (!cooBot || !cooBot.enabled) return;

    if (cooBot) {
      await updateDoc(doc(db, 'bots', cooBot.id), {
        status: 'processing',
        lastAction: 'Aura está a verificar conformidade legal...',
        updatedAt: serverTimestamp()
      });
      setTimeout(async () => {
        await updateDoc(doc(db, 'bots', cooBot.id), {
          status: 'idle',
          lastAction: 'Verificação concluída. Todos os ativos estão em conformidade.',
          updatedAt: serverTimestamp()
        });
      }, 3000);
    }
  };

  const curateLuxuryExperience = async () => {
    // Simulate Lumia Content Curation bot action
    const cxoBot = bots.find(b => b.role === 'Content Curation');
    if (!cxoBot || !cxoBot.enabled) return;

    if (cxoBot) {
      await updateDoc(doc(db, 'bots', cxoBot.id), {
        status: 'processing',
        lastAction: 'Lumia está a curar novas experiências...',
        updatedAt: serverTimestamp()
      });
      setTimeout(async () => {
        await updateDoc(doc(db, 'bots', cxoBot.id), {
          status: 'idle',
          lastAction: 'Curadoria concluída. Novos destaques premium ativos.',
          updatedAt: serverTimestamp()
        });
      }, 3000);
    }
  };

  const runMarketingAndSEO = async () => {
    // Simulate Nova Marketing & SEO bot action
    const mktBot = bots.find(b => b.role === 'Marketing' || b.role === 'Marketing & SEO');
    if (!mktBot || !mktBot.enabled) return;

    if (mktBot) {
      await updateDoc(doc(db, 'bots', mktBot.id), {
        status: 'processing',
        lastAction: 'Nova está a analisar o desempenho dos anúncios...',
        updatedAt: serverTimestamp()
      });
      
      const analysis = await analyzeAdPerformance(ads);
      
      await updateDoc(doc(db, 'bots', mktBot.id), {
        status: 'idle',
        lastAction: analysis,
        updatedAt: serverTimestamp()
      });
    }
  };

  const optimizeLogistics = async () => {
    // Simulate Atlas Logistics bot action
    const logBot = bots.find(b => b.role === 'Logistics');
    if (!logBot || !logBot.enabled) return;

    if (logBot) {
      await updateDoc(doc(db, 'bots', logBot.id), {
        status: 'processing',
        lastAction: 'Atlas está a otimizar rotas de entrega...',
        updatedAt: serverTimestamp()
      });
      setTimeout(async () => {
        await updateDoc(doc(db, 'bots', logBot.id), {
          status: 'idle',
          lastAction: 'Logística otimizada. Entregas garantidas.',
          updatedAt: serverTimestamp()
        });
      }, 3000);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-20 space-y-16">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-serif">Painel de <span className="text-gold">Controlo</span></h1>
        <div className="flex gap-4">
          <button onClick={runMarketAnalysis} className="flex items-center gap-2 px-4 py-2 bg-gold/10 border border-gold/30 rounded-full text-[10px] font-bold text-gold uppercase tracking-widest hover:bg-gold hover:text-black transition-all">
            <Sparkles className="w-4 h-4" />
            Aether Analyst
          </button>
          <button onClick={runComplianceCheck} className="flex items-center gap-2 px-4 py-2 bg-gold/10 border border-gold/30 rounded-full text-[10px] font-bold text-gold uppercase tracking-widest hover:bg-gold hover:text-black transition-all">
            <ShieldCheck className="w-4 h-4" />
            Aura COMPLIANCE
          </button>
          <button onClick={curateLuxuryExperience} className="flex items-center gap-2 px-4 py-2 bg-gold/10 border border-gold/30 rounded-full text-[10px] font-bold text-gold uppercase tracking-widest hover:bg-gold hover:text-black transition-all">
            <ImageIcon className="w-4 h-4" />
            Lumia CURATION
          </button>
          <button onClick={runMarketingAndSEO} className="flex items-center gap-2 px-4 py-2 bg-gold/10 border border-gold/30 rounded-full text-[10px] font-bold text-gold uppercase tracking-widest hover:bg-gold hover:text-black transition-all">
            <Megaphone className="w-4 h-4" />
            Nova SEO & MKT
          </button>
          <button onClick={optimizeLogistics} className="flex items-center gap-2 px-4 py-2 bg-gold/10 border border-gold/30 rounded-full text-[10px] font-bold text-gold uppercase tracking-widest hover:bg-gold hover:text-black transition-all">
            <Truck className="w-4 h-4" />
            Atlas LOG
          </button>
          <button onClick={recruitTopAmbassadors} className="flex items-center gap-2 px-4 py-2 bg-gold/10 border border-gold/30 rounded-full text-[10px] font-bold text-gold uppercase tracking-widest hover:bg-gold hover:text-black transition-all">
            <Crown className="w-4 h-4" />
            Super CEO
          </button>
        </div>
      </div>

      {/* Aether Bots Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {bots.map(bot => (
          <div key={bot.id} className="bg-[#111] p-8 rounded-[2rem] border border-gold/20 flex flex-col justify-between">
            <div className="flex items-center gap-6 mb-6">
              <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center",
                bot.status === 'processing' ? "bg-gold animate-pulse" : "bg-gold/20"
              )}>
                {bot.role === 'CEO' ? <Crown className="text-gold w-6 h-6" /> : 
                 bot.role === 'Compliance' ? <ShieldCheck className="text-gold w-6 h-6" /> :
                 bot.role === 'Content Curation' ? <ImageIcon className="text-gold w-6 h-6" /> :
                 (bot.role === 'Marketing' || bot.role === 'Marketing & SEO') ? <Megaphone className="text-gold w-6 h-6" /> :
                 bot.role === 'Logistics' ? <Truck className="text-gold w-6 h-6" /> :
                 <Sparkles className="text-gold w-6 h-6" />}
              </div>
              <div>
                <div className="text-[10px] font-bold text-gold uppercase tracking-widest mb-1">{bot.role} Bot</div>
                <div className="text-white font-serif text-xl">{bot.name}</div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="text-[10px] text-gray-500 uppercase tracking-widest">Última Ação</div>
              <input 
                className="w-full bg-black border-b border-gold/20 text-xs text-white italic py-1 focus:border-gold outline-none"
                value={bot.lastAction}
                onChange={(e) => handleManualBotControl(bot.id, { lastAction: e.target.value })}
              />
              <div className="flex justify-between items-center pt-4 border-t border-gold/10">
                <button 
                  onClick={() => handleManualBotControl(bot.id, { enabled: !bot.enabled })}
                  className={cn(
                    "text-[8px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest transition-all",
                    bot.enabled ? "bg-green-500/20 text-green-500 hover:bg-green-500/40" : "bg-red-500/20 text-red-500 hover:bg-red-500/40"
                  )}
                >
                  {bot.enabled ? 'Ligado' : 'Desligado'}
                </button>
                <div className="text-[8px] text-gray-600 uppercase">Controlo Manual Ativo</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Market Analysis Reports */}
      <div className="bg-[#111] rounded-[2rem] border border-gold/20 overflow-hidden">
        <div className="p-8 border-b border-gold/10 bg-gold/5 flex justify-between items-center">
          <h2 className="text-xl font-serif text-gold">Relatórios de Mercado Global</h2>
          <span className="text-[10px] bg-gold text-black px-3 py-1 rounded-full font-bold">{analysis.length}</span>
        </div>
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {analysis.map(report => (
            <div key={report.id} className="bg-black p-6 rounded-2xl border border-gold/10 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-[8px] font-bold text-gold uppercase tracking-widest mb-1">{report.category}</div>
                  <div className="text-white font-serif">{report.trend}</div>
                </div>
                <div className="text-right">
                  <div className="text-[8px] text-gray-500 uppercase mb-1">Demand Score</div>
                  <div className="text-gold font-bold">{report.demandScore}%</div>
                </div>
              </div>
              <p className="text-gray-400 text-xs italic leading-relaxed">"{report.recommendation}"</p>
            </div>
          ))}
        </div>
      </div>
      
      {/* Reservations */}
      <div className="bg-[#111] rounded-[2rem] border border-gold/20 overflow-hidden">
        <div className="p-8 border-b border-gold/10 bg-gold/5 flex justify-between items-center">
          <h2 className="text-xl font-serif text-gold">Reservas e Transações</h2>
          <span className="text-[10px] bg-gold text-black px-3 py-1 rounded-full font-bold">{reservations.length}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-gray-500 border-b border-gold/10">
                <th className="p-6">ID Anúncio</th>
                <th className="p-6">Comprador/Locatário</th>
                <th className="p-6">Datas</th>
                <th className="p-6">Valor Total</th>
                <th className="p-6">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gold/10">
              {reservations.map(res => (
                <tr key={res.id} className="hover:bg-white/5 transition-colors">
                  <td className="p-6 font-serif text-white">{res.adId}</td>
                  <td className="p-6 text-sm text-gray-400">{res.buyerId}</td>
                  <td className="p-6 text-sm text-gray-400">
                    {res.startDate && res.endDate ? `${res.startDate} a ${res.endDate}` : 'Venda Direta'}
                  </td>
                  <td className="p-6 text-gold font-bold">{res.totalPrice?.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}</td>
                  <td className="p-6">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                      res.status === 'paid' ? "bg-green-500/20 text-green-500" :
                      res.status === 'pending' ? "bg-yellow-500/20 text-yellow-500" :
                      "bg-red-500/20 text-red-500"
                    )}>
                      {res.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ambassador Applications */}
      <div className="bg-[#111] rounded-[2rem] border border-gold/20 overflow-hidden">
        <div className="p-8 border-b border-gold/10 bg-gold/5 flex justify-between items-center">
          <h2 className="text-xl font-serif text-gold">Candidaturas a Embaixador</h2>
          <span className="text-[10px] bg-gold text-black px-3 py-1 rounded-full font-bold">{apps.length}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-gray-500 border-b border-gold/10">
                <th className="p-6">Candidato</th>
                <th className="p-6">Contacto</th>
                <th className="p-6">Redes Sociais</th>
                <th className="p-6">Status</th>
                <th className="p-6">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gold/5">
              {apps.map(app => (
                <tr key={app.id} className="hover:bg-white/5 transition-colors">
                  <td className="p-6 font-medium">{app.name}</td>
                  <td className="p-6 text-gray-400">{app.email}</td>
                  <td className="p-6 text-gold text-xs">{app.socialMedia}</td>
                  <td className="p-6">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[8px] font-bold uppercase tracking-widest",
                      app.status === 'pending' ? "bg-yellow-500/20 text-yellow-500" :
                      app.status === 'approved' ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"
                    )}>
                      {app.status}
                    </span>
                  </td>
                  <td className="p-6">
                    {app.status === 'pending' && (
                      <div className="flex gap-4">
                        <button onClick={() => handleUpdateStatus(app.id, 'approved')} className="text-[10px] font-bold text-green-500 hover:text-green-400 uppercase tracking-widest">Aprovar</button>
                        <button onClick={() => handleUpdateStatus(app.id, 'rejected')} className="text-[10px] font-bold text-red-500 hover:text-red-400 uppercase tracking-widest">Rejeitar</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inquiries */}
      <div className="bg-[#111] rounded-[2rem] border border-gold/20 overflow-hidden">
        <div className="p-8 border-b border-gold/10 bg-gold/5 flex justify-between items-center">
          <h2 className="text-xl font-serif text-gold">Inquéritos Privados</h2>
          <span className="text-[10px] bg-gold text-black px-3 py-1 rounded-full font-bold">{inquiries.length}</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-8">
          {inquiries.map(inquiry => (
            <div key={inquiry.id} className="bg-black p-6 rounded-2xl border border-gold/10 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-[8px] font-bold text-gold uppercase tracking-widest mb-1">Sobre: {inquiry.adTitle}</div>
                  <div className="text-white font-serif">{inquiry.senderName}</div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={cn(
                    "text-[8px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest",
                    inquiry.status === 'new' ? "bg-blue-500/20 text-blue-500" :
                    inquiry.status === 'read' ? "bg-gray-500/20 text-gray-500" : "bg-green-500/20 text-green-500"
                  )}>
                    {inquiry.status}
                  </span>
                  {inquiry.status === 'new' && (
                    <button onClick={() => handleUpdateInquiryStatus(inquiry.id, 'read')} className="text-[8px] text-gold hover:underline uppercase">Marcar como Lido</button>
                  )}
                  {inquiry.status !== 'replied' && (
                    <button onClick={() => handleUpdateInquiryStatus(inquiry.id, 'replied')} className="text-[8px] text-green-500 hover:underline uppercase">Respondido</button>
                  )}
                </div>
              </div>
              <p className="text-gray-400 text-sm italic leading-relaxed">"{inquiry.message}"</p>
              <div className="text-[10px] text-gold">{inquiry.senderEmail}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Development Tools */}
      <div className="bg-[#111] rounded-[2rem] border border-gold/20 overflow-hidden">
        <div className="p-8 border-b border-gold/10 bg-gold/5 flex justify-between items-center">
          <h2 className="text-xl font-serif text-gold flex items-center gap-3">
            <Settings className="w-6 h-6" />
            Ferramentas de Desenvolvimento
          </h2>
        </div>
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-black border border-gold/10 p-6 rounded-2xl flex flex-col items-center text-center gap-4 hover:border-gold/30 transition-colors">
            <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center text-gold">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-white font-bold uppercase tracking-widest text-xs mb-2">Modo de Manutenção</h3>
              <p className="text-gray-400 text-[10px] mb-4">Ativar ecrã de manutenção para todos os utilizadores.</p>
              <button className="px-4 py-2 bg-red-500/10 text-red-500 border border-red-500/30 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all w-full">
                Ativar
              </button>
            </div>
          </div>

          <div className="bg-black border border-gold/10 p-6 rounded-2xl flex flex-col items-center text-center gap-4 hover:border-gold/30 transition-colors">
            <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center text-gold">
              <RefreshCw className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-white font-bold uppercase tracking-widest text-xs mb-2">Limpar Cache</h3>
              <p className="text-gray-400 text-[10px] mb-4">Forçar atualização de assets e dados cacheados.</p>
              <button className="px-4 py-2 bg-gold/10 text-gold border border-gold/30 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-gold hover:text-black transition-all w-full">
                Limpar Agora
              </button>
            </div>
          </div>

          <div className="bg-black border border-gold/10 p-6 rounded-2xl flex flex-col items-center text-center gap-4 hover:border-gold/30 transition-colors">
            <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center text-gold">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-white font-bold uppercase tracking-widest text-xs mb-2">Sincronizar BD</h3>
              <p className="text-gray-400 text-[10px] mb-4">Re-indexar anúncios e otimizar base de dados.</p>
              <button className="px-4 py-2 bg-gold/10 text-gold border border-gold/30 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-gold hover:text-black transition-all w-full">
                Sincronizar
              </button>
            </div>
          </div>

          <div className="bg-black border border-gold/10 p-6 rounded-2xl flex flex-col items-center text-center gap-4 hover:border-gold/30 transition-colors">
            <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center text-gold">
              <Code className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-white font-bold uppercase tracking-widest text-xs mb-2">Logs do Sistema</h3>
              <p className="text-gray-400 text-[10px] mb-4">Visualizar erros e avisos do servidor em tempo real.</p>
              <button className="px-4 py-2 bg-gold/10 text-gold border border-gold/30 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-gold hover:text-black transition-all w-full">
                Ver Logs
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Platform Plans */}
      <div className="bg-[#111] rounded-[2rem] border border-gold/20 overflow-hidden">
        <div className="p-8 border-b border-gold/10 bg-gold/5 flex justify-between items-center">
          <h2 className="text-xl font-serif text-gold flex items-center gap-3">
            <CreditCard className="w-6 h-6" />
            Planos da Plataforma
          </h2>
          <button className="px-4 py-2 bg-gold text-black rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-white transition-all">
            Criar Novo Plano
          </button>
        </div>
        <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Free Plan */}
          <div className="bg-black border border-gray-800 p-8 rounded-2xl flex flex-col relative">
            <div className="mb-8">
              <h3 className="text-white font-serif text-2xl mb-2">Basic</h3>
              <div className="text-gold font-bold text-3xl mb-4">Grátis</div>
              <p className="text-gray-400 text-xs">Ideal para utilizadores casuais que querem explorar o mercado.</p>
            </div>
            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-center gap-3 text-sm text-gray-300">
                <Check className="w-4 h-4 text-gold" /> 1 Anúncio ativo
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-300">
                <Check className="w-4 h-4 text-gold" /> Fotos padrão (até 5)
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-300">
                <Check className="w-4 h-4 text-gold" /> Suporte por email
              </li>
            </ul>
            <button className="w-full py-3 border border-gray-600 text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors">
              Editar Plano
            </button>
          </div>

          {/* Pro Plan */}
          <div className="bg-black border border-gold p-8 rounded-2xl flex flex-col relative transform md:-translate-y-4 shadow-[0_0_30px_rgba(212,175,55,0.1)]">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gold text-black px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
              Mais Popular
            </div>
            <div className="mb-8">
              <h3 className="text-white font-serif text-2xl mb-2">Pro</h3>
              <div className="text-gold font-bold text-3xl mb-4">€49<span className="text-sm text-gray-500 font-normal">/mês</span></div>
              <p className="text-gray-400 text-xs">Para vendedores frequentes e agentes imobiliários.</p>
            </div>
            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-center gap-3 text-sm text-gray-300">
                <Check className="w-4 h-4 text-gold" /> Até 10 Anúncios ativos
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-300">
                <Check className="w-4 h-4 text-gold" /> Fotos ilimitadas + Vídeo
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-300">
                <Check className="w-4 h-4 text-gold" /> Destaque nas pesquisas
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-300">
                <Check className="w-4 h-4 text-gold" /> Acesso ao Aether Analyst
              </li>
            </ul>
            <button className="w-full py-3 bg-gold text-black rounded-full text-xs font-bold uppercase tracking-widest hover:bg-white transition-colors">
              Editar Plano
            </button>
          </div>

          {/* Elite Plan */}
          <div className="bg-black border border-gray-800 p-8 rounded-2xl flex flex-col relative">
            <div className="mb-8">
              <h3 className="text-white font-serif text-2xl mb-2">Elite</h3>
              <div className="text-gold font-bold text-3xl mb-4">€199<span className="text-sm text-gray-500 font-normal">/mês</span></div>
              <p className="text-gray-400 text-xs">Para agências de luxo e brokers internacionais.</p>
            </div>
            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-center gap-3 text-sm text-gray-300">
                <Check className="w-4 h-4 text-gold" /> Anúncios Ilimitados
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-300">
                <Check className="w-4 h-4 text-gold" /> Destaque Premium na Homepage
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-300">
                <Check className="w-4 h-4 text-gold" /> Assistente Pessoal (Lumia)
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-300">
                <Check className="w-4 h-4 text-gold" /> Relatórios de Mercado Exclusivos
              </li>
            </ul>
            <button className="w-full py-3 border border-gray-600 text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors">
              Editar Plano
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};

const AmbassadorDashboard = ({ user }: { user: FirebaseUser | null }) => {
  const { t } = useTranslation();
  const [app, setApp] = useState<AmbassadorApp | null>(null);
  const [ads, setAds] = useState<Ad[]>([]);
  const [analysis, setAnalysis] = useState<MarketAnalysis[]>([]);

  useEffect(() => {
    if (!user) return;
    const uid = user.uid;
    
    // Check application status
    const qApp = query(collection(db, 'ambassadors'), where('userId', '==', uid));
    const unsubscribeApp = onSnapshot(qApp, (snapshot) => {
      const userApp = snapshot.docs[0];
      if (userApp) setApp({ id: userApp.id, ...userApp.data() } as AmbassadorApp);
      else setApp({ id: 'guest', userId: 'guest', name: 'Convidado', email: 'guest@vendifree.com', socialMedia: '', experience: '', status: 'approved', createdAt: null });
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'ambassadors');
    });

    // Get user's ads
    const qAds = query(collection(db, 'ads'), where('authorId', '==', uid));
    const unsubscribeAds = onSnapshot(qAds, (snapshot) => {
      const userAds = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ad));
      userAds.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      setAds(userAds);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'ads');
    });

    // Get market analysis
    const qAnalysis = query(collection(db, 'market_analysis'), orderBy('createdAt', 'desc'));
    const unsubscribeAnalysis = onSnapshot(qAnalysis, (snapshot) => {
      setAnalysis(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MarketAnalysis)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'market_analysis');
    });

    return () => {
      unsubscribeApp();
      unsubscribeAds();
      unsubscribeAnalysis();
    };
  }, [user]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-20 space-y-16">
      <div className="flex justify-between items-end">
        <div>
          <div className="text-gold font-bold uppercase tracking-[0.4em] text-[10px] mb-2">Bem-vindo, Embaixador</div>
          <h1 className="text-5xl font-serif text-white">{app?.name || 'Carregando...'}</h1>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/create" className="gold-button px-8 py-3 rounded-full uppercase text-[10px] font-bold tracking-widest flex items-center gap-2">
            <Plus className="w-4 h-4" />
            {t('nav.listNewAsset')}
          </Link>
          <div className="bg-gold/10 border border-gold/30 px-6 py-3 rounded-2xl flex items-center gap-4">
            <Award className="text-gold w-6 h-6" />
            <span className="text-xs font-bold text-gold uppercase tracking-widest">Membro de Elite</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-12">
          {/* My Managed Assets */}
          <div className="bg-[#111] rounded-[2rem] border border-gold/20 overflow-hidden">
            <div className="p-8 border-b border-gold/10 bg-gold/5 flex justify-between items-center">
              <h2 className="text-xl font-serif text-gold">Os Meus Ativos Curados</h2>
              <span className="text-[10px] bg-gold text-black px-3 py-1 rounded-full font-bold">{ads.length}</span>
            </div>
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              {ads.map(ad => (
                <Link key={ad.id} to={`/ad/${ad.id}`} className="bg-black p-4 rounded-2xl border border-gold/10 group hover:border-gold transition-all">
                  <div className="aspect-video rounded-xl overflow-hidden mb-4">
                    <img src={ad.images?.[0]} className="w-full h-full object-cover group-hover:scale-105 transition-transform" alt="" />
                  </div>
                  <div className="text-[8px] font-bold text-gold uppercase tracking-widest mb-1">{ad.category}</div>
                  <div className="text-white font-serif truncate">{ad.title}</div>
                </Link>
              ))}
              {ads.length === 0 && <div className="col-span-2 text-center py-12 text-gray-500 text-sm">Ainda não listou nenhum ativo.</div>}
            </div>
          </div>

          {/* Market Insights */}
          <div className="bg-[#111] rounded-[2rem] border border-gold/20 overflow-hidden">
            <div className="p-8 border-b border-gold/10 bg-gold/5">
              <h2 className="text-xl font-serif text-gold">Insights de Mercado Aether</h2>
            </div>
            <div className="p-8 space-y-6">
              {analysis.slice(0, 3).map(report => (
                <div key={report.id} className="flex items-center justify-between p-6 bg-black rounded-2xl border border-gold/10">
                  <div className="flex items-center gap-6">
                    <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center">
                      <Sparkles className="text-gold w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-white font-serif">{report.category}</div>
                      <div className="text-[10px] text-gold uppercase tracking-widest">{report.trend}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-light text-white">{report.demandScore}%</div>
                    <div className="text-[8px] text-gray-500 uppercase">Demand</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Stats Card */}
          <div className="bg-gold p-8 rounded-[2rem] text-black">
            <h3 className="text-xs font-black uppercase tracking-widest mb-8">Performance Global</h3>
            <div className="space-y-6">
              <div>
                <div className="text-4xl font-serif">12.4M €</div>
                <div className="text-[10px] font-bold uppercase tracking-widest opacity-60">Valor Total Curado</div>
              </div>
              <div className="h-px bg-black/10" />
              <div>
                <div className="text-4xl font-serif">86%</div>
                <div className="text-[10px] font-bold uppercase tracking-widest opacity-60">Taxa de Conversão</div>
              </div>
            </div>
          </div>

          {/* Tips Card */}
          <div className="bg-[#111] p-8 rounded-[2rem] border border-gold/20">
            <div className="flex items-center gap-4 mb-6">
              <AlertCircle className="text-gold w-6 h-6" />
              <h3 className="text-xs font-bold text-gold uppercase tracking-widest">Dicas da Direção AI</h3>
            </div>
            <div className="space-y-6">
              <p className="text-gray-400 text-xs leading-relaxed italic">
                <span className="text-gold font-bold">Super CEO Aether:</span> "O mercado de Superyachts em Bora Bora está a atingir o pico. Recomendo atualizar as descrições dos seus ativos para focar em sustentabilidade e privacidade extrema."
              </p>
              <p className="text-gray-400 text-xs leading-relaxed italic">
                <span className="text-gold font-bold">Aura Compliance:</span> "Certifique-se de que todos os seus contratos de exclusividade estão assinados digitalmente para evitar atrasos na Lumia."
              </p>
              <p className="text-gray-400 text-xs leading-relaxed italic">
                <span className="text-gold font-bold">Lumia Curation:</span> "A estética minimalista está em alta. Use fotos com luz natural para os seus anúncios de ilhas privadas."
              </p>
              <p className="text-gray-400 text-xs leading-relaxed italic">
                <span className="text-gold font-bold">Nova MKT:</span> "As campanhas em redes sociais focadas em exclusividade estão a converter 30% mais. Foque no mistério."
              </p>
              <p className="text-gray-400 text-xs leading-relaxed italic">
                <span className="text-gold font-bold">Atlas LOG:</span> "As rotas para a Polinésia estão otimizadas. Garanta aos seus clientes que a entrega do ativo será impecável."
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(auth, u => { setUser(u); setReady(true); });
  }, []);

  if (!ready) return <div className="h-screen bg-poly-dark flex items-center justify-center"><Crown className="w-12 h-12 text-poly-coral animate-spin" /></div>;

  if (!user) {
    return (
      <div className="min-h-screen bg-poly-dark flex flex-col items-center justify-center relative overflow-hidden">
        {/* Polynesian Background Elements */}
        <div className="absolute inset-0 opacity-20">
          <img src="https://picsum.photos/seed/polynesia/1920/1080" alt="Polynesia" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          <div className="absolute inset-0 bg-gradient-to-t from-poly-dark via-poly-dark/80 to-transparent"></div>
        </div>
        
        <div className="relative z-10 text-center space-y-8 p-10 max-w-md w-full bg-poly-dark/60 backdrop-blur-md rounded-[3rem] border border-poly-ocean/30 shadow-2xl">
          <Crown className="w-20 h-20 text-poly-coral mx-auto" />
          <div>
            <h1 className="text-5xl font-serif text-poly-sand mb-3">Vendifree</h1>
            <p className="text-poly-ocean tracking-[0.3em] uppercase text-xs font-bold">Paraíso Privado</p>
          </div>
          
          <button 
            onClick={loginWithGoogle}
            className="w-full bg-poly-ocean text-poly-dark py-4 rounded-full uppercase tracking-[0.2em] text-sm font-black hover:bg-poly-sand transition-all flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(0,180,216,0.4)] hover:shadow-[0_0_30px_rgba(253,240,213,0.6)]"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Entrar com Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Router>
        <div className="min-h-screen bg-poly-dark text-poly-sand selection:bg-poly-coral/30">
          <Navbar user={user} />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/ad/:id" element={<AdDetails user={user} />} />
            <Route path="/create" element={<CreateAd user={user} />} />
            <Route path="/ambassadors" element={<AmbassadorRecruitment user={user} />} />
            <Route path="/network" element={<AmbassadorNetwork />} />
            <Route path="/ambassador-dashboard" element={<AmbassadorDashboard user={user} />} />
            <Route path="/chats" element={<MyChats user={user} />} />
            <Route path="/admin" element={<AdminDashboard user={user} />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/profile" element={<Profile user={user} />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
          </Routes>
          <footer className="py-20 border-t border-gold/10 text-center">
            <Crown className="w-8 h-8 text-gold mx-auto mb-6 opacity-50" />
            <p className="text-[10px] text-gray-600 uppercase tracking-[0.5em]">Vendifree © 2026 | Private Circle</p>
            <div className="mt-4 flex justify-center gap-4 text-xs text-poly-ocean">
              <Link to="/terms" className="hover:text-poly-sand transition-colors">Termos de Serviço</Link>
              <Link to="/privacy" className="hover:text-poly-sand transition-colors">Política de Privacidade</Link>
            </div>
          </footer>
          <CookieBanner />
        </div>
      </Router>
    </ErrorBoundary>
  );
}
