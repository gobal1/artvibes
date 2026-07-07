import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldAlert, Eye } from 'lucide-react';

export default function ProfileAuthModal({ isOpen, onClose, onConfirm }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          
          {/* BACKDROP GELAP BLUR */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
          />

          {/* KONTEN MODAL */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/[0.08] bg-slate-900/90 p-6 shadow-2xl backdrop-blur-2xl text-center"
          >
            {/* GLOW EFFECT WARNA AMBER/CYAN */}
            <div className="absolute -right-20 -top-20 -z-10 h-40 w-40 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
            <div className="absolute -left-20 -bottom-20 -z-10 h-40 w-40 rounded-full bg-cyan-500/5 blur-3xl pointer-events-none" />

            {/* TOMBOL CLOSE SILANG */}
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 rounded-xl border border-white/5 bg-slate-950 p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            {/* ICON WARNING/SHIELD */}
            <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 mt-2">
              <ShieldAlert className="h-7 w-7 text-amber-500" />
            </div>

            {/* INFO TEKS */}
            <h3 className="text-lg font-black tracking-wide text-white uppercase">Autentikasi Dasbor</h3>
            <p className="text-xs text-slate-400 mt-0.5">Verifikasi Hak Akses Studio Privat</p>
            
            <p className="text-xs text-slate-300 my-5 bg-slate-950/50 border border-white/[0.03] rounded-2xl p-4 italic leading-relaxed text-left">
              "Sistem mendeteksi Anda mencoba meninggalkan galeri publik untuk masuk ke pengelolaan aset internal kreator."
            </p>

            {/* ACTION BUTTONS */}
            <div className="space-y-2.5">
              <button 
                onClick={onConfirm}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 p-3 text-xs font-bold text-white shadow-lg shadow-cyan-500/10 transition hover:from-cyan-400 hover:to-blue-500 cursor-pointer"
              >
                <Eye className="h-4 w-4" />
                <span>KONFIRMASI & MASUK</span>
              </button>

              <button 
                onClick={onClose}
                className="w-full rounded-xl border border-white/10 bg-slate-950/40 p-3 text-xs font-semibold text-slate-400 transition hover:border-white/20 hover:bg-slate-900/60 hover:text-white cursor-pointer"
              >
                KEMBALI KE EKSIBISI
              </button>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}