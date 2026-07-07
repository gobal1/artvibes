import React from 'react';
import { motion } from 'motion/react';

export default function CTA() {
  return (
    <section className="py-20 px-6 md:px-12 lg:px-20">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative p-12 bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-3xl overflow-hidden"
        >
          <div className="absolute inset-0 opacity-20 bg-white/5" />

          <div className="relative text-center space-y-6">
            <h2 className="text-4xl md:text-5xl font-bold text-white">Siap Memulai Perjalanan Anda?</h2>
            <p className="text-xl text-white/90">Bergabunglah dengan ribuan seniman dan kolektor di platform kami</p>
            <div className="flex flex-wrap justify-center gap-4 pt-4">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="px-8 py-4 bg-white text-emerald-600 rounded-lg font-semibold shadow-lg">Daftar Sekarang</motion.button>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="px-8 py-4 bg-white/20 backdrop-blur-sm text-white rounded-lg font-semibold border border-white/30">Pelajari Lebih Lanjut</motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
