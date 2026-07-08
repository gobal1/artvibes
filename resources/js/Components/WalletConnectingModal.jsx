import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader, CheckCircle, AlertCircle } from 'lucide-react';

export default function WalletConnectingModal({ isOpen, status = 'connecting', message = 'Menghubungkan wallet...', details = '' }) {
  // Status: 'connecting', 'signing', 'verifying', 'success', 'error'
  
  const getStatusConfig = () => {
    const configs = {
      connecting: {
        icon: Loader,
        title: 'Menghubungkan',
        subtitle: 'Membuka wallet Anda...',
        color: 'from-blue-500 to-blue-600',
        animation: 'spin',
      },
      signing: {
        icon: Loader,
        title: 'Tanda Tangani',
        subtitle: 'Mohon tandatangani di wallet...',
        color: 'from-emerald-500 to-emerald-600',
        animation: 'pulse',
      },
      verifying: {
        icon: Loader,
        title: 'Verifikasi',
        subtitle: 'Memverifikasi signature...',
        color: 'from-purple-500 to-purple-600',
        animation: 'spin',
      },
      success: {
        icon: CheckCircle,
        title: 'Berhasil!',
        subtitle: 'Wallet terhubung sempurna',
        color: 'from-emerald-500 to-emerald-600',
        animation: 'bounce',
      },
      error: {
        icon: AlertCircle,
        title: 'Error',
        subtitle: 'Terjadi kesalahan',
        color: 'from-rose-500 to-rose-600',
        animation: 'shake',
      },
    };
    return configs[status] || configs.connecting;
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          {/* BACKDROP */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md pointer-events-none"
          />

          {/* MODAL CONTENT - MINIMAL & ELEGANT */}
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: 20 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className="relative w-full max-w-sm"
          >
            <div className="rounded-2xl border border-white/10 bg-slate-900/95 backdrop-blur-xl p-6 shadow-2xl">
              {/* GLOW EFFECTS */}
              <div className={`absolute -right-16 -top-16 -z-10 h-32 w-32 rounded-full bg-gradient-to-br ${config.color} opacity-20 blur-3xl pointer-events-none`} />
              <div className={`absolute -left-16 -bottom-16 -z-10 h-32 w-32 rounded-full bg-gradient-to-br ${config.color} opacity-10 blur-3xl pointer-events-none`} />

              {/* CENTER CONTENT */}
              <div className="flex flex-col items-center text-center">
                {/* ICON DENGAN ANIMASI */}
                <motion.div
                  animate={
                    config.animation === 'spin'
                      ? { rotate: 360 }
                      : config.animation === 'pulse'
                      ? { scale: [1, 1.1, 1] }
                      : config.animation === 'bounce'
                      ? { y: [0, -8, 0] }
                      : config.animation === 'shake'
                      ? { x: [-4, 4, -4, 0] }
                      : {}
                  }
                  transition={
                    config.animation === 'spin'
                      ? { duration: 2, repeat: Infinity, ease: 'linear' }
                      : config.animation === 'pulse'
                      ? { duration: 1.5, repeat: Infinity }
                      : config.animation === 'bounce'
                      ? { duration: 0.8, repeat: Infinity }
                      : config.animation === 'shake'
                      ? { duration: 0.5, repeat: Infinity }
                      : {}
                  }
                  className={`mb-4 p-3 rounded-full bg-gradient-to-br ${config.color} shadow-lg shadow-${config.color.split('-')[1]}-500/30`}
                >
                  <Icon className="h-6 w-6 text-white" />
                </motion.div>

                {/* TITLE */}
                <h3 className="text-lg font-bold text-white mb-1 tracking-wide">
                  {config.title}
                </h3>

                {/* SUBTITLE */}
                <p className="text-sm text-slate-400 mb-4 leading-relaxed">
                  {config.subtitle}
                </p>

                {/* CUSTOM MESSAGE */}
                {message && message !== config.subtitle && (
                  <div className="mb-4 p-2.5 rounded-lg bg-slate-950/50 border border-white/5">
                    <p className="text-xs text-slate-300 font-mono">{message}</p>
                  </div>
                )}

                {/* DETAILS/ERROR MESSAGE */}
                {details && (
                  <div className={`w-full p-3 rounded-lg border ${
                    status === 'error'
                      ? 'bg-rose-500/5 border-rose-500/20'
                      : 'bg-blue-500/5 border-blue-500/20'
                  }`}>
                    <p className={`text-xs ${status === 'error' ? 'text-rose-300' : 'text-blue-300'} leading-relaxed`}>
                      {details}
                    </p>
                  </div>
                )}

                {/* PROGRESS DOTS */}
                {['connecting', 'signing', 'verifying'].includes(status) && (
                  <div className="mt-5 flex gap-2 justify-center">
                    <motion.div
                      animate={{ scale: [1, 0.8, 1] }}
                      transition={{ duration: 0.8, repeat: Infinity, delay: 0 }}
                      className="h-2 w-2 rounded-full bg-emerald-500"
                    />
                    <motion.div
                      animate={{ scale: [1, 0.8, 1] }}
                      transition={{ duration: 0.8, repeat: Infinity, delay: 0.2 }}
                      className="h-2 w-2 rounded-full bg-emerald-500/60"
                    />
                    <motion.div
                      animate={{ scale: [1, 0.8, 1] }}
                      transition={{ duration: 0.8, repeat: Infinity, delay: 0.4 }}
                      className="h-2 w-2 rounded-full bg-emerald-500/30"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* HELPER TEXT */}
            <p className="text-center text-[11px] text-slate-500 mt-4 px-2">
              {status === 'signing' && 'Jangan tutup atau refresh halaman ini'}
              {status === 'error' && 'Silakan coba lagi atau gunakan wallet lain'}
              {status === 'success' && 'Mengalihkan ke halaman berikutnya...'}
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
