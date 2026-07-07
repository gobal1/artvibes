import React from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function LatestWorks({ latestWorks, latestScrollRef }) {
  return (
    <section className="py-20 px-6 md:px-12 lg:px-20">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-10"
        >
          <div>
            <h2 className="text-4xl md:text-5xl font-bold text-white">Karya Terbaru</h2>
            <p className="text-slate-400 mt-3">Jelajahi koleksi terbaru yang bisa digeser ke kiri dan kanan.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => latestScrollRef.current?.scrollBy({ left: -320, behavior: 'smooth' })}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-slate-900/70 text-slate-200 transition hover:border-white/20 hover:bg-slate-900/90"
              aria-label="Geser kiri"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => latestScrollRef.current?.scrollBy({ left: 320, behavior: 'smooth' })}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-slate-900/70 text-slate-200 transition hover:border-white/20 hover:bg-slate-900/90"
              aria-label="Geser kanan"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </motion.div>

        <div
          ref={latestScrollRef}
          className="flex w-full gap-5 overflow-x-auto pb-4 scroll-smooth snap-x snap-mandatory"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {latestWorks.map((work, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
              className="snap-start min-w-[280px] md:min-w-[320px] rounded-3xl border border-white/10 bg-slate-950/80 shadow-[0_20px_50px_-30px_rgba(15,23,42,0.8)]"
            >
              <div className="overflow-hidden rounded-t-3xl">
                <img src={work.image} alt={work.title} className="h-52 w-full object-cover" />
              </div>
              <div className="p-5">
                <p className="text-xs uppercase tracking-[0.35em] text-slate-500">{work.creator}</p>
                <h3 className="mt-3 text-2xl font-semibold text-white">{work.title}</h3>
                <p className="mt-4 text-sm text-slate-400">Harga: {work.price}</p>
                <button className="mt-6 inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-700 px-4 py-3 text-sm font-semibold text-white transition hover:from-emerald-400 hover:to-emerald-600">
                  Lihat Detail
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
