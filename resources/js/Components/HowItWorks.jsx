import React from 'react';
import { motion } from 'motion/react';

export default function HowItWorks({ howRef }) {
  const steps = [
    { step: '01', title: 'Daftar & Verifikasi', description: 'Buat akun dan hubungkan wallet digital Anda untuk memulai' },
    { step: '02', title: 'Jelajahi Koleksi', description: 'Temukan karya seni unik dari seniman berbakat di seluruh dunia' },
    { step: '03', title: 'Beli & Miliki', description: 'Transaksi aman dengan blockchain, kepemilikan terjamin selamanya' }
  ];

  return (
    <section ref={howRef} className="py-20 px-6 md:px-12 lg:px-20">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Cara Kerja</h2>
          <p className="text-xl text-slate-400">Mulai dalam 3 langkah mudah</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              className="relative p-8 bg-slate-800/30 backdrop-blur-sm rounded-2xl border border-slate-700/50"
            >
              <div className="text-6xl font-bold text-emerald-500/20 mb-4">{item.step}</div>
              <h3 className="text-2xl font-semibold text-white mb-3">{item.title}</h3>
              <p className="text-slate-400">{item.description}</p>

              {index < 2 && (
                <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-emerald-500 to-emerald-700" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
