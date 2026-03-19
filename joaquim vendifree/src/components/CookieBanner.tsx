import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export const CookieBanner = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('vendifree_cookie_consent');
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem('vendifree_cookie_consent', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-poly-dark-light border-t border-poly-coral/20 p-4 z-[9999] shadow-2xl">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-poly-sand text-sm flex-1">
          <p>
            Utilizamos cookies para melhorar a sua experiência no nosso Paraíso Privado. 
            Ao continuar a navegar, concorda com a nossa <a href="/privacy" className="text-poly-ocean underline">Política de Privacidade</a> e <a href="/terms" className="text-poly-ocean underline">Termos de Serviço</a>.
          </p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={acceptCookies}
            className="bg-poly-ocean text-poly-dark px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-poly-sand transition-all"
          >
            Aceitar
          </button>
          <button 
            onClick={() => setIsVisible(false)}
            className="text-poly-sand/50 hover:text-poly-sand p-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
