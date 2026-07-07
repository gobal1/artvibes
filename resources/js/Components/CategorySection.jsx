import React from 'react';

export default function CategorySection({ categories, categoriesRef }) {
  return (
    <section ref={categoriesRef} className="px-6 md:px-12 lg:px-20 py-12">
      <div className="rounded-[2rem] border border-white/10 bg-slate-950/95 p-6 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.85)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Kategori yang Sedang Tren</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">Pilih kategori cepat</h2>
          </div>
          <div className="flex gap-2">
            <button className="rounded-full border border-white/10 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200 hover:bg-emerald-500/15">Terbaru</button>
            <button className="rounded-full border border-white/10 bg-slate-900/70 px-4 py-2 text-sm text-slate-200 hover:bg-slate-900/90">Trend</button>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category, index) => (
            <button
              key={index}
              className="rounded-3xl border border-white/10 bg-slate-900/80 px-5 py-4 text-left text-sm text-slate-100 transition hover:border-white/20 hover:bg-slate-900/90"
            >
              <span className="block text-lg font-semibold text-white">{category}</span>
              <span className="mt-2 block text-xs text-slate-500">
                Eksplorasi koleksi terbaik {category.toLowerCase()} hari ini.
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
