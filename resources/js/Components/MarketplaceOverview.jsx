import React, { useState } from 'react';
import { motion } from 'motion/react';

const promoEvents = [
  {
    title: 'Art Vibes Drop Party',
    tag: 'Live Auction',
    image: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=1200&q=85',
  },
  {
    title: 'Crypto Canvas Festival',
    tag: 'Exclusive Launch',
    image: 'https://images.unsplash.com/photo-1498575207493-52c97e7caecf?w=1200&q=85',
  },
  {
    title: 'Polygon Gala Night',
    tag: 'Premium Drop',
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&q=85',
  },
  {
    title: 'Digital Art Summit',
    tag: 'Masterclass',
    image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&q=85',
  },
  {
    title: 'NFT Collector\'s Hub',
    tag: 'Community',
    image: 'https://images.unsplash.com/photo-1460925895917-aeb19be489c7?w=1200&q=85',
  },
];

export default function MarketplaceOverview({ artworks, stats, navigateTo }) {
  const [activeIndex, setActiveIndex] = useState(2);

  const nextIndex = () => setActiveIndex((prev) => (prev + 1) % promoEvents.length);
  const prevIndex = () => setActiveIndex((prev) => (prev - 1 + promoEvents.length) % promoEvents.length);

  const getCardStyle = (index) => {
    const total = promoEvents.length;
    let offset = index - activeIndex;
    if (offset > total / 2) offset -= total;
    if (offset < -total / 2) offset += total;

    const distance = Math.abs(offset);
    const translateX = offset * 220;
    const translateZ = -distance * 130;
    const rotationY = offset * 16;
    const scale = distance === 0 ? 1 : distance === 1 ? 0.85 : 0.75;
    const opacity = 1 - Math.min(distance * 0.18, 0.6);

    return {
      transform: `translateX(${translateX}px) translateZ(${translateZ}px) rotateY(${rotationY}deg) scale(${scale})`,
      opacity,
      zIndex: 50 - distance,
      filter: distance > 1 ? 'blur(0.08rem)' : 'none',
      transition: 'all 0.4s ease',
      pointerEvents: 'auto',
    };
  };

  return (
    <section className="relative w-full flex items-center justify-center px-4 py-24 overflow-hidden bg-slate-950">
      <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at top left, rgba(14,165,233,0.18), transparent 22%), radial-gradient(circle at bottom right, rgba(59,130,246,0.1), transparent 34%)' }} />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-slate-950/100 to-transparent" />

      <div className="relative w-full max-w-6xl">
        <div className="relative mx-auto max-w-3xl text-center mb-10">
          <span className="text-xs uppercase tracking-[0.45em] text-slate-400">Featured Drops</span>
          <h2 className="mt-4 text-3xl sm:text-4xl font-black text-white">Discover featured collections in 3D space</h2>
          <p className="mt-3 text-sm text-slate-400">Swipe through curated drops with a polished 3D preview. Sentuhan modern dan immersive di lingkungan NFT.</p>
        </div>

        <div className="relative mx-auto w-full max-w-[1040px] h-[420px] sm:h-[460px]" style={{ perspective: 1200, transformStyle: 'preserve-3d' }}>
          {promoEvents.map((event, index) => (
            <motion.button
              key={index}
              type="button"
              onClick={() => setActiveIndex(index)}
              style={getCardStyle(index)}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-[420px] sm:w-80 sm:h-[460px] rounded-[2rem] overflow-hidden border border-white/10 bg-slate-950/95 shadow-[0_40px_120px_rgba(15,23,42,0.45)] focus:outline-none"
              whileHover={{ y: -10 }}
              whileTap={{ scale: 0.98 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.18}
              onDragEnd={(event, info) => {
                if (info.offset.x < -70) nextIndex();
                if (info.offset.x > 70) prevIndex();
              }}
            >
              <div className="absolute inset-0 overflow-hidden">
                <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-950/10 to-slate-950/95" />
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-5 bg-slate-950/75 backdrop-blur-xl border-t border-white/10">
                <span className="inline-flex items-center rounded-full bg-slate-950/30 px-3 py-1 text-[11px] uppercase tracking-[0.32em] text-slate-200">{event.tag}</span>
                <h3 className="mt-3 text-xl font-black text-white">{event.title}</h3>
              </div>
            </motion.button>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={prevIndex}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-slate-900/90 text-white shadow-lg shadow-slate-950/30 transition hover:-translate-y-0.5 hover:bg-slate-800"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={nextIndex}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-slate-900/90 text-white shadow-lg shadow-slate-950/30 transition hover:-translate-y-0.5 hover:bg-slate-800"
            >
              ›
            </button>
          </div>

          <div className="flex items-center gap-2">
            {promoEvents.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={`h-2.5 rounded-full transition-all duration-300 ${index === activeIndex ? 'w-10 bg-slate-100' : 'w-3 bg-slate-500/30'}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

