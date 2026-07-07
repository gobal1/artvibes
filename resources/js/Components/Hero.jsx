import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Flame, CheckCircle2 } from 'lucide-react';

// Hero component with YouTube video embed
export default function Hero({ artworks, stats, homeRef, navigateTo }) {
  return (
    <section ref={homeRef} className="flex-1 w-full">
      {/* HERO SECTION - FULL HEIGHT WITH VIDEO BACKGROUND */}
      <div className="relative overflow-hidden w-full min-h-screen">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 h-full w-full object-cover saturate-125 contrast-[1.05]"
        >
          <source src="/videos/mawon.webm" type="video/webm" />
          Browser kamu tidak mendukung pemutar video.
        </video>

        <div className="absolute inset-0 bg-slate-950/75" />
        <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-24 text-center sm:px-6 lg:px-14">
          <button
            type="button"
            onClick={() => navigateTo?.('explore')}
            className="inline-flex items-center justify-center rounded-none bg-emerald-500 px-10 py-4 text-base font-semibold text-slate-950 shadow-2xl shadow-emerald-500/25 transition hover:bg-emerald-400"
          >
            Explore
          </button>

          <div className="mt-6 flex flex-wrap justify-center gap-5 text-sm uppercase tracking-[0.28em] text-slate-300">
            <span>Populer</span>
            <span>Musik/Suara</span>
            <span>Video</span>
            <span>Fotografi</span>
          </div>
        </div>
      </div>

      {/* CONTENT SECTION - FULL WIDTH BOTTOM */}
      <div className="w-full px-0 py-8">
        <div className="w-full border border-white/10 bg-linear-to-b from-slate-950/95 via-slate-900/90 to-slate-950/95 p-4 sm:p-8 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.85)]">
        
        <div className="flex flex-col gap-6 lg:gap-8 lg:flex-row lg:items-start lg:justify-between">
          
          {/* KIRI: AREA VIDEO YOUTUBE (16:9) */}
          <div className="flex-1 w-full">
            <div className="relative w-full aspect-video overflow-hidden border border-white/10 bg-slate-950 shadow-2xl group">
              <div className="absolute inset-0 bg-linear-to-t from-slate-950/20 to-transparent pointer-events-none z-10" />
              <iframe
                className="w-full h-full"
                src="https://www.youtube.com/embed/MBRtCiE7-v8?si=6Aqr6Lc-WUm0G7T-&autoplay=0&controls=1"
                title="Art Vibes Creative Video"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* Tren Scroll) */}
          {/* ========================================================================= */}
          <div className="flex flex-col w-full bg-slate-900/40 border border-white/6 p-4 lg:w-105 shrink-0 h-full lg:h-61.25 xl:h-82.5 2xl:h-98.75">
            
            {/* Header Mini Kolom */}
            <div className="flex items-center justify-between pb-2.5 border-b border-white/5 mb-3 shrink-0">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
                <h2 className="text-xs font-black uppercase tracking-wider text-white">Trending Bids</h2>
              </div>
              <span className="text-[9px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded-full border border-white/5 animate-pulse">
                Live
              </span>
            </div>

            {/* Area List Artwork + Kreator (Nge-scroll di sini) */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-87.5 lg:max-h-none overflow-x-hidden custom-scrollbar">
              {artworks.slice(0, 6).map((artwork, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  className="group flex items-center justify-between p-2 bg-slate-950/50 hover:bg-slate-950 border border-white/2 hover:border-emerald-500/30 transition-all duration-300"
                >
                  {/* Sisi Kiri: Gambar Seni + Nama Pengguna */}
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Thumbnail Image Artwork */}
                    <div className="relative w-12 h-12 overflow-hidden border border-white/10 shrink-0">
                      <img 
                        src={artwork.url} 
                        alt={artwork.alt} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                      />
                    </div>
                    {/* Info Nama Pemilik / Tren */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <p className="text-xs font-bold text-white tracking-wide truncate group-hover:text-emerald-400 transition-colors">
                          {artwork.alt || `Art Vibes #${index + 1}`}
                        </p>
                        <CheckCircle2 className="h-3 w-3 text-blue-400 shrink-0" />
                      </div>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                        By: {index === 1 ? 'fahmi' : 'Creative_User'}
                      </p>
                    </div>
                  </div>

                  {/* Sisi Kanan: Action Button Penawaran (Bermanfaat) */}
                  <div className="shrink-0 pl-2">
                    {index % 2 === 0 ? (
                      <button className="flex items-center gap-1 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white px-2.5 py-1.5 rounded-none text-[9px] font-bold uppercase tracking-wider border border-emerald-500/20 transition-all cursor-pointer">
                        <Flame className="h-3 w-3" /> Bid
                      </button>
                    ) : (
                      <button className="bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white px-2.5 py-1.5 rounded-none text-[9px] font-bold uppercase tracking-wider border border-white/5 transition-all cursor-pointer">
                        View
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Footer Mini Kolom */}
            <div className="pt-2 border-t border-white/5 mt-3 text-center shrink-0">
              <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-300 transition-colors cursor-pointer">
                Scroll for more assets ↓
              </span>
            </div>

          </div>
        </div>

        {/* BAWAH: STATISTIK */}
        <div className="mt-6 sm:mt-10 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {stats.map((stat, index) => (
            <div key={index} className="border border-white/10 bg-slate-900/80 p-3 sm:p-5 text-center">
              <p className="text-xl sm:text-3xl font-bold text-white tracking-tight">{stat.value}</p>
              <p className="mt-1 sm:mt-2 text-[10px] sm:text-sm text-slate-400 uppercase tracking-wider">{stat.label}</p>
            </div>
          ))}
        </div>
        </div>
      </div>
    </section>
  );
}