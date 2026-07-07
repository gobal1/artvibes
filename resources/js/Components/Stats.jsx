import React from 'react';
import { motion } from 'motion/react';

export default function Stats({ stats }) {
  return (
    <section className="py-20 px-6 md:px-12 lg:px-20 bg-gradient-to-r from-emerald-600/10 to-emerald-700/10 border-y border-emerald-500/20">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.5 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="text-center"
            >
              <div className="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-700 mb-2">{stat.value}</div>
              <div className="text-lg text-slate-300">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
