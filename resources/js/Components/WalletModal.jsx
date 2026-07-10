import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { openMetaMaskSignOnly } from '../Utils/artVibesMarket';

export default function WalletModal({ isOpen, onClose, onSelectWallet }) {
  // Daftar wallet yang akan ditampilkan di pop-up
  const wallets = [
    {
      name: 'MetaMask',
      icon: 'https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg',
      description: 'Buka di browser aplikasi MetaMask atau ekstensi MetaMask',
      popular: true,
      key: 'metamask',
    },
    {
      name: 'Coinbase Wallet',
      icon: 'https://images.ctfassets.net/q5ulk4bp65r7/1r5mhiK3uwt0wGISO861zA/426b334be01e747ee37da30b42fbb1bf/coinbase-wallet-logo.png',
      description: 'Gunakan Coinbase Wallet mobile atau ekstensi',
      key: 'coinbase-wallet',
    },
    {
      name: 'Trust Wallet',
      icon: 'https://trustwallet.com/assets/images/media/assets/TWT_Logo_Vertical_Blue.svg',
      description: 'Buka Trust Wallet atau gunakan WalletConnect',
      key: 'trust',
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          
          {/* BACKDROP/OVERLAY */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-xl"
          />

          {/* KONTEN MODAL - THIN & ELEGANT */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 30 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300, duration: 0.35 }}
            className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-white/10 bg-slate-950/95 backdrop-blur-2xl shadow-2xl"
          >
            {/* GRADIENT GLOW EFFECTS */}
            <div className="absolute -right-24 -top-24 -z-10 h-48 w-48 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />
            <div className="absolute -left-24 -bottom-24 -z-10 h-48 w-48 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

            {/* TOP BAR - MINIMAL */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
              <div className="flex-1">
                <h3 className="text-sm font-bold tracking-wide text-white uppercase">Pilih Dompet</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Koneksi untuk NFT & transaksi</p>
              </div>
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="ml-2 rounded-lg border border-white/5 bg-slate-900/50 p-1.5 text-slate-400 transition hover:bg-slate-900 hover:text-white hover:border-white/10"
              >
                <X className="h-4 w-4" />
              </motion.button>
            </div>

            {/* WALLET LIST - COMPACT */}
            <div className="px-5 py-4 space-y-2.5">
              {wallets.map((wallet, index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={async () => {
                    if (typeof onSelectWallet === 'function') {
                      await onSelectWallet(wallet.key || wallet.name.toLowerCase().replace(/\s+/g, '-'));
                    }
                    onClose();
                  }}
                  role="button"
                  tabIndex={0}
                  className="group relative flex w-full cursor-pointer items-center gap-3 rounded-xl border border-white/5 bg-slate-900/40 px-4 py-3 text-left transition-all duration-200 hover:border-emerald-500/40 hover:bg-slate-900/60 hover:shadow-[0_0_12px_-6px_rgba(16,185,129,0.3)]"
                >
                  {/* WALLET ICON */}
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-white/5 bg-slate-950/60 group-hover:scale-110 transition-transform duration-200">
                    <img src={wallet.icon} alt={wallet.name} className="h-full w-full object-contain p-1" />
                  </div>
                  
                  {/* WALLET INFO */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-bold text-white">{wallet.name}</p>
                      {wallet.popular && (
                        <motion.span 
                          initial={{ scale: 0.8 }}
                          animate={{ scale: 1 }}
                          className="rounded-sm bg-emerald-500/20 px-1.5 py-0.5 text-[8px] font-bold tracking-wide text-emerald-300 border border-emerald-500/30"
                        >
                          POPULAR
                        </motion.span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-1">{wallet.description}</p>
                  </div>

                  {/* HOVER ARROW */}
                  <div className="flex-shrink-0 text-slate-600 group-hover:text-emerald-500 transition-colors">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  {wallet.key === 'metamask' && (
                    <div className="absolute right-3 bottom-3">
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            await openMetaMaskSignOnly();
                          } catch (err) {
                            console.error('openMetaMaskSignOnly failed', err);
                            // eslint-disable-next-line no-alert
                            alert('Gagal membuka MetaMask otomatis. Pastikan Anda memilih MetaMask app saat chooser muncul, lalu coba lagi.');
                          }
                        }}
                        className="text-[11px] px-2 py-1 rounded-md bg-emerald-600 text-white hover:brightness-110"
                      >
                        Open MetaMask (sign only)
                      </button>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            {/* FOOTER - MINIMAL INFO */}
            <div className="px-5 py-3.5 border-t border-white/5 bg-slate-950/30">
              <p className="text-[10px] text-slate-500 text-center leading-relaxed">
                Pertama kali? <a href="#" className="text-emerald-400 hover:text-emerald-300 font-semibold transition">Pelajari wallet</a>
              </p>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}