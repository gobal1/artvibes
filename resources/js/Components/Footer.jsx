import React from 'react';

export default function Footer() {
  return (
    <footer className="relative overflow-hidden py-14 px-6 md:px-12 lg:px-20 border-t border-emerald-800/40 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.28),rgba(2,6,23,0.98)_40%),radial-gradient(circle_at_bottom_right,rgba(14,116,144,0.22),rgba(2,6,23,0.96)_45%)] text-white">
      <div className="pointer-events-none absolute inset-0 opacity-25 bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-size-[26px_26px]" />
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-10 relative z-10">
          <div>
            <h3 className="text-2xl font-black tracking-wide text-white mb-4">ART VIBES MARKET</h3>
            <p className="text-emerald-100/80 max-w-xs">Platform terpercaya untuk karya seni digital dengan vibe modern, berani, dan koleksi lintas genre.</p>
          </div>
          <div>
            <h4 className="text-emerald-200 font-semibold mb-3 uppercase tracking-wider text-sm">Marketplace</h4>
            <ul className="space-y-2 text-slate-200/90">
              <li className="hover:text-white transition cursor-pointer">Jelajahi</li>
              <li className="hover:text-white transition cursor-pointer">Trending</li>
              <li className="hover:text-white transition cursor-pointer">Koleksi</li>
            </ul>
          </div>
          <div>
            <h4 className="text-emerald-200 font-semibold mb-3 uppercase tracking-wider text-sm">Sumber Daya</h4>
            <ul className="space-y-2 text-slate-200/90">
              <li className="hover:text-white transition cursor-pointer">Panduan</li>
              <li className="hover:text-white transition cursor-pointer">FAQ</li>
              <li className="hover:text-white transition cursor-pointer">Blog</li>
            </ul>
          </div>
          <div>
            <h4 className="text-emerald-200 font-semibold mb-3 uppercase tracking-wider text-sm">Perusahaan</h4>
            <ul className="space-y-2 text-slate-200/90">
              <li className="hover:text-white transition cursor-pointer">Tentang Kami</li>
              <li className="hover:text-white transition cursor-pointer">Kontak</li>
              <li className="hover:text-white transition cursor-pointer">Karir</li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-emerald-900/50 text-center text-emerald-100/80 relative z-10">
          <p>&copy; 2026 NFT Marketplace. Semua hak dilindungi.</p>
        </div>
      </div>
    </footer>
  );
}
