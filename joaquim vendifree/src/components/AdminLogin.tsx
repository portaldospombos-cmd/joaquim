import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === 'portaldospombos@gmail.com') {
      setShowPassword(true);
      setError('');
    } else {
      setError('Email não autorizado para login administrativo.');
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      if (data.success) {
        navigate('/admin');
      } else {
        setError(data.message || 'Credenciais inválidas.');
      }
    } catch (error) {
      setError('Erro ao tentar fazer login.');
    }
  };

  return (
    <div className="p-6 bg-[#111] rounded-2xl border border-gold/20 max-w-sm mx-auto mt-10">
      <h2 className="text-xl font-serif text-gold mb-4">Login Administrativo</h2>
      {!showPassword ? (
        <form onSubmit={handleEmailSubmit}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email do Administrador"
            className="w-full bg-black border border-gold/30 p-3 rounded-lg text-white mb-4"
            required
          />
          <button type="submit" className="w-full bg-gold text-black py-2 rounded-lg font-bold uppercase tracking-widest text-sm">
            Continuar
          </button>
        </form>
      ) : (
        <form onSubmit={handlePasswordSubmit}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Palavra-passe"
            className="w-full bg-black border border-gold/30 p-3 rounded-lg text-white mb-4"
            required
          />
          <button type="submit" className="w-full bg-gold text-black py-2 rounded-lg font-bold uppercase tracking-widest text-sm">
            Entrar
          </button>
        </form>
      )}
      {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
    </div>
  );
};
