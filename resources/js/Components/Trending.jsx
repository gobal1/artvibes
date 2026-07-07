import React from 'react';
import { motion } from 'motion/react';

export default function Trending({ artworks, trendingRef }) {
  return (
    <section ref={trendingRef} className="py-20 px-6 md:px-12 lg:px-20">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Karya Trending</h2>
          <p className="text-xl text-slate-400">Koleksi terpopuler minggu ini</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {artworks.slice(0, 3).map((artwork, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ y: -10 }}
              className="group cursor-pointer"
            >
              <div className="relative overflow-hidden rounded-2xl mb-4">
                <img src={artwork.url} alt={artwork.alt} className="w-full h-80 object-cover transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="text-white font-semibold text-lg mb-1">Abstract Dream #{index + 1}</div>
                  <div className="flex items-center justify-between">
                    <span className="text-emerald-300">0.{index + 5} ETH</span>
                    <span className="text-slate-300 text-sm">1 of 1</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
