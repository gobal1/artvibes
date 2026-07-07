import React, { useState } from 'react';
import { Mail, Lock, ArrowRight, X, ShieldCheck } from 'lucide-react';

export default function LoginModal({ isOpen, onClose }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Accept': 'application/json' 
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Gagal autentikasi');
      }

      // Hard redirect memotong error state React, langsung lempar ke URL '/studio'
      window.location.href = data.redirect || '/studio';
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl p-6 text-center text-white">
        
        {/* Tombol Close Modal */}
        <button onClick={onClose} className="absolute right-4 top-4 text-slate-400 hover:text-white transition">
          <X className="h-4 w-4" />
        </button>
        
        <div className="inline-flex rounded-2xl bg-amber-500/10 p-3 mb-4 text-amber-500">
          <ShieldCheck className="h-6 w-6" />
        </div>
        
        <h3 className="text-xl font-black uppercase tracking-wide">Autentikasi Akun</h3>
        <p className="text-xs text-slate-400 mt-1">Wallet tetap utama. Google dipakai untuk profil, chat, dan notifikasi.</p>
        
        {/* Alert Error Box */}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 p-3 my-4 rounded-xl text-xs text-rose-400 text-left animate-shake">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-left">
          {/* Input Email */}
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400 pl-1">Alamat Email</label>
            <div className="relative mt-1">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500"><Mail className="h-4 w-4" /></span>
              <input 
                type="email" 
                required 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-emerald-500/50 text-white transition" 
                placeholder="nama@artvibes.com" 
              />
            </div>
          </div>
          
          {/* Input Password */}
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400 pl-1">Kata Sandi</label>
            <div className="relative mt-1">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500"><Lock className="h-4 w-4" /></span>
              <input 
                type="password" 
                required 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-emerald-500/50 text-white transition" 
                placeholder="••••••••" 
              />
            </div>
          </div>
          
          {/* Tombol Submit Form */}
          <button 
            type="submit" 
            disabled={loading} 
            className="w-full mt-2 py-3 bg-gradient-to-r from-emerald-500 to-emerald-700 hover:from-emerald-400 hover:to-emerald-600 rounded-xl font-bold text-xs uppercase tracking-wider text-white inline-flex items-center justify-center gap-2 shadow-lg transition cursor-pointer disabled:opacity-50"
          >
            {loading ? "Memproses..." : <><>Masuk Studio</> <ArrowRight className="h-4 w-4" /></>}
          </button>
        </form>
      </div>
    </div>
  );
}