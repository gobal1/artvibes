import React, { useState } from 'react';
import { Mail, Lock, ArrowRight, Sparkles } from 'lucide-react';

export default function LoginPage({ onLoginSuccess, navigateTo }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Menembak endpoint login Laravel kamu
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Email atau password salah!');
      }

      // Jika login sukses di backend Laravel:
      // 1. Lempar data user ke state global App.jsx
      onLoginSuccess(data.user); 
      // 2. Alihkan halaman langsung ke Dashboard milikmu
      navigateTo('dashboard'); 

    } catch (err) {
      console.error(err);
      setError(err.message || 'Terjadi kesalahan koneksi ke server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-5rem)] flex items-center justify-center p-4 bg-slate-950 relative overflow-hidden">
      {/* Efek Background Abstrak Gaya NFT */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* BOX UTAMA: Desain Neo-Brutalisme Tebal */}
      <div className="w-full max-w-md bg-slate-900 border-4 border-slate-100 p-6 md:p-8 shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] translate-y-[-10px]">
        
        {/* Header Form */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center bg-emerald-500 text-slate-950 p-2.5 border-2 border-slate-100 shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] mb-4">
            <Sparkles className="h-6 w-6 font-black" />
          </div>
          <h2 className="text-2xl font-black text-white uppercase tracking-wide">
            Masuk Studio Kreator
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Wallet untuk mint/list/buy. Google untuk profil, chat, dan notifikasi.
          </p>
        </div>

        <div className="mb-6 rounded-2xl border border-slate-700 bg-slate-950/80 p-4 text-left">
          <p className="text-[11px] leading-relaxed text-slate-300 font-mono">
            Login Wallet adalah identitas utama. Jika belum punya akun, sistem akan membuat akun otomatis.
            Google dipakai sebagai pelengkap akun untuk pengalaman sosial dan notifikasi.
          </p>
        </div>

        {/* Notifikasi Error */}
        {error && (
          <div className="bg-rose-500/20 border-2 border-rose-500 p-3 mb-6 rounded-lg text-xs text-rose-300 font-mono flex items-center gap-2">
            <span>🚨</span> {error}
          </div>
        )}

        {/* Form Login */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Input Email */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-300 mb-2 font-mono">
              Alamat Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Mail className="h-4 w-4" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@studio.com"
                className="w-full pl-10 pr-4 py-3 bg-slate-950 border-2 border-slate-800 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors font-mono"
              />
            </div>
          </div>

          {/* Input Password */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-300 font-mono">
                Kata Sandi
              </label>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Lock className="h-4 w-4" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 bg-slate-950 border-2 border-slate-800 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors font-mono"
              />
            </div>
          </div>

          {/* Tombol Submit Neo-Brutalisme */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 bg-emerald-500 text-slate-950 py-3.5 px-4 font-black text-xs uppercase tracking-[0.2em] border-2 border-slate-100 shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span className="font-mono">Memverifikasi Hak Akses...</span>
            ) : (
              <>
                Masuk Studio <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* Tombol Kembali ke Beranda Utama */}
        <div className="mt-8 pt-4 border-t border-slate-800/60 text-center">
          <a
            href="/auth/google/redirect"
            className="block mb-3 w-full bg-white text-slate-950 py-3.5 px-4 font-black text-xs uppercase tracking-[0.2em] border-2 border-slate-100 shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all cursor-pointer"
          >
            Login Google untuk Profil & Chat
          </a>
          <button
            type="button"
            onClick={() => navigateTo('marketplace')}
            className="text-xs text-slate-500 hover:text-emerald-400 font-mono transition-colors"
          >
            ← Kembali Jelajahi NFT
          </button>
        </div>

      </div>
    </div>
  );
}