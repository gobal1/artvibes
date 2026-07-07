import React from 'react';
import { motion } from 'framer-motion';

export default function RhombusButton({ isOpen, onClick }) {
  return (
    <div className="relative w-10 h-10 flex items-center justify-center z-[70] flex-shrink-0 select-none">
      <button 
        onClick={onClick}
        className="absolute inset-0 w-full h-full flex items-center justify-center focus:outline-none group cursor-pointer"
      >
        {/* SEGITIGA ATAS (Jangkar - Menetap di Header, Berubah Emerald saat Zipper kebuka) */}
        <motion.div
          animate={{ 
            y: isOpen ? 0 : 0,
            borderBottomColor: isOpen ? '#34d399' : '#ffffff' 
          }}
          transition={{ type: 'spring', stiffness: 140, damping: 18 }}
          className="absolute top-0 w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-b-[20px] filter drop-shadow-[0_-2px_4px_rgba(52,211,153,0.2)]"
        />

        {/* SEGITIGA BAWAH SAMARAN (Hanya muncul saat tertutup untuk mengunci bentuk Rhombus utuh) */}
        <motion.div 
          animate={{ 
            opacity: isOpen ? 0 : 1,
            y: isOpen ? 10 : 0 
          }}
          transition={{ duration: 0.15 }}
          className="absolute bottom-0 w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[20px] border-t-white"
        />

        {/* TEKS MENU TENGAH */}
        {!isOpen && (
          <span className="absolute text-[8px] font-black text-slate-950 font-mono tracking-tighter top-[15px] z-10 pointer-events-none group-hover:scale-110 transition-transform">
            MENU
          </span>
        )}
      </button>
    </div>
  );
}