import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export default function WalletModal({ isOpen, onClose }) {
  // Daftar wallet yang akan ditampilkan di pop-up
  const wallets = [
    {
      name: 'MetaMask',
      icon: 'https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg',
      description: 'Connect using your browser extension',
      popular: true,
    },
    {
      name: 'Coinbase Wallet',
      icon: 'https://images.ctfassets.net/q5ulk4bp65r7/1r5mhiK3uwt0wGISO861zA/426b334be01e747ee37da30b42fbb1bf/coinbase-wallet-logo.png',
      description: 'Connect with Coinbase account',
    },
    {
      name: 'Trust Wallet',
      icon: 'https://trustwallet.com/assets/images/media/assets/TWT_Logo_Vertical_Blue.svg',
      description: 'Scan via WalletConnect to log in',
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          
          {/* BACKDROP/OVERLAY: Efek blur transparan gelap ketika di luar modal diklik akan menutup popup */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
          />

          {/* KONTEN MODAL POP-UP */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/[0.08] bg-slate-900/90 p-6 shadow-2xl backdrop-blur-2xl"
          >
            {/* GLOW EFFECT DI BACKGROUND POPUP */}
            <div className="absolute -right-20 -top-20 -z-10 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
            <div className="absolute -left-20 -bottom-20 -z-10 h-40 w-40 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

            {/* HEADER POP-UP */}
            <div className="flex items-center justify-between pb-4 border-b border-white/5">
              <div>
                <h3 className="text-lg font-black tracking-wide text-white uppercase">Connect Wallet Utama</h3>
                <p className="text-xs text-slate-400 mt-0.5">Wallet dipakai untuk mint, list, dan buy. Google menyusul untuk profil dan chat.</p>
              </div>
              <button 
                onClick={onClose}
                className="rounded-xl border border-white/5 bg-slate-950 p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* LIST PILIHAN WALLET */}
            <div className="mt-5 space-y-3">
              {wallets.map((wallet, index) => (
                <button
                  key={index}
                  onClick={() => {
                    alert(`Menghubungkan ke ${wallet.name}... (Integrasi Web3/Ethers berikutnya)`);
                    onClose();
                  }}
                  className="group relative flex w-full items-center gap-4 rounded-2xl border border-white/[0.04] bg-slate-950/40 p-4 text-left transition-all duration-200 hover:border-emerald-500/30 hover:bg-slate-950/80 hover:shadow-[0_0_15px_-5px_rgba(16,185,129,0.2)]"
                >
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border border-white/5 bg-slate-900 p-2 group-hover:scale-105 transition-transform">
                    <img src={wallet.icon} alt={wallet.name} className="h-full w-full object-contain" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-white tracking-wide">{wallet.name}</p>
                      {wallet.popular && (
                        <span className="rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-mono font-bold tracking-wide text-emerald-400 border border-emerald-500/20">
                          POPULAR
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 truncate mt-0.5">{wallet.description}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* FOOTER POP-UP */}
            <div className="mt-6 text-center">
              <p className="text-[10px] font-mono text-slate-500">
                Baru mengenal Crypto? <a href="#" className="text-emerald-400 hover:underline">Pelajari selengkapnya</a>
              </p>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}