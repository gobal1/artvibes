import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Compass, User, PlusCircle } from 'lucide-react';

export default function Sidebar({
  sidebarOpen,
  setSidebarOpen,
  sidebarPanelOpen,
  setSidebarPanelOpen,
  navigateTo,
  currentPage,
}) {
  
  // ID DI SINI SEKARANG SUDAH SINKRON 100% DENGAN APP.JSX KAMU, MI
  const globalMenu = [
    { id: 'marketplace', label: 'Beranda Utama', desc: 'Landing page galeri', icon: LayoutDashboard },
    { id: 'explore', label: 'Eksplorasi Karya', desc: 'Jelajahi seni & item game', icon: Compass },
    { id: 'dashboard', label: 'Profil Saya', desc: 'Koleksi & dompet digital', icon: User },
  ];

  const containerVariants = {
    closed: { 
      height: 0,
      opacity: 0,
      transition: { when: "afterChildren", duration: 0.2, ease: "easeInOut" }
    },
    open: { 
      height: "calc(100vh - 80px)",
      opacity: 1,
      transition: { when: "beforeChildren", staggerChildren: 0.05, ease: [0.16, 1, 0.3, 1] }
    }
  };

  const itemVariants = {
    closed: { opacity: 0, x: -20 },
    open: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 120, damping: 16 } }
  };

  const handleNavClick = (pageId) => {
    if (typeof navigateTo === 'function') {
      navigateTo(pageId);
    }
    if (typeof setSidebarOpen === 'function') {
      setSidebarOpen(false);
    }
    if (typeof setSidebarPanelOpen === 'function') {
      setSidebarPanelOpen(false);
    }
  };

  return (
    <>
      {/* 1. MOBILE OVERLAY & SIDEBAR */}
      {sidebarOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setSidebarOpen && setSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 z-[45] lg:hidden"
        />
      )}

      <motion.aside
        initial={{ x: -280 }}
        animate={{ x: sidebarOpen ? 0 : -280 }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        className="fixed top-0 left-0 z-[60] h-screen w-[280px] overflow-hidden border-r border-white/10 bg-slate-950/95 backdrop-blur-xl lg:hidden"
      >
        <div className="h-full w-full space-y-6 p-5">
          <div className="pb-2 border-b border-white/10">
            <p className="text-sm uppercase tracking-[0.35em] text-emerald-400 font-mono font-semibold">Navigasi</p>
            <h3 className="text-xl font-bold text-white">Pilih Halaman</h3>
          </div>
          
          <div className="space-y-2">
            {globalMenu.map((item, index) => {
              const MobileIcon = item.icon;
              const isCurrent = currentPage === item.id;
              return (
                <button
                  key={index}
                  onClick={() => handleNavClick(item.id)}
                  className={`group relative flex h-14 w-full items-center rounded-2xl border transition duration-200 ${
                    isCurrent 
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' 
                      : 'border-white/5 bg-slate-900/50 text-slate-300 hover:text-white hover:bg-slate-900/80'
                  }`}
                >
                  <div className="flex w-full items-center justify-start px-4">
                    <MobileIcon className="h-5 w-5 flex-shrink-0 text-emerald-300" />
                    <span className="ml-4 text-sm font-medium">{item.label}</span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-4 border-t border-white/10 pt-4 space-y-3">
            <p className="text-[10px] uppercase tracking-[0.35em] text-slate-400 font-mono">Aksi Cepat</p>
            <button
              onClick={() => handleNavClick('dashboard')}
              className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-slate-200 hover:bg-slate-900/90"
            >
              <span>🔔 Notifikasi</span>
              <span className="text-[11px] text-slate-400">Lihat</span>
            </button>
            <button
              onClick={() => handleNavClick('dashboard')}
              className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-slate-200 hover:bg-slate-900/90"
            >
              <span>💬 Chat</span>
              <span className="text-[11px] text-slate-400">Profil</span>
            </button>
          </div>
        </div>
      </motion.aside>

      {/* 2. DESKTOP SIDEBAR (Zipper) */}
      <div className="hidden lg:block">
        <AnimatePresence>
          {sidebarPanelOpen && (
            <motion.div
              initial="closed"
              animate="open"
              exit="closed"
              variants={containerVariants}
              className="fixed left-0 top-20 z-[55] w-72 max-h-[calc(100vh-5rem)] overflow-y-auto bg-slate-950/95 backdrop-blur-2xl shadow-[30px_0_60px_-20px_rgba(0,0,0,0.9)] flex flex-col justify-between border-none"
            >
              <div className="absolute left-[36px] top-0 bottom-0 w-[2px] z-10 pointer-events-none">
                <div className="w-full h-full bg-gradient-to-b from-emerald-400 via-teal-500 to-transparent shadow-[0_0_10px_rgba(52,211,153,0.6)]" />
              </div>

              <motion.div
                initial={{ y: -20 }}
                animate={{ y: "calc(100vh - 140px)" }}
                exit={{ y: -20 }}
                transition={{ type: 'spring', stiffness: 100, damping: 18 }}
                className="absolute left-[16px] z-20 w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[20px] border-t-emerald-500 filter drop-shadow-[0_4px_10px_rgba(16,185,129,0.5)]"
              >
                <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[8px] font-mono font-black text-emerald-400 bg-slate-950 px-1 py-0.5 rounded border border-emerald-500/30">
                  ZIP
                </span>
              </motion.div>

              <div className="p-6 pl-16 space-y-6 w-full relative z-0">
                <motion.div variants={itemVariants}>
                  <p className="text-xs uppercase tracking-[0.35em] text-emerald-400 font-mono font-semibold">Navigasi Utama</p>
                  <h3 className="text-lg font-black text-white mt-1">PILIH HALAMAN</h3>
                </motion.div>

                <div className="space-y-3">
                  {globalMenu.map((item) => {
                    const DesktopIcon = item.icon;
                    const isCurrent = currentPage === item.id;
                    return (
                      <motion.button
                        key={item.id}
                        variants={itemVariants}
                        whileHover={{ x: 6, transition: { duration: 0.1 } }}
                        onClick={() => handleNavClick(item.id)}
                        className={`flex w-full items-center gap-4 rounded-2xl border px-4 py-3 text-left transition-all duration-200 ${
                          isCurrent
                            ? 'bg-gradient-to-r from-emerald-500/15 to-transparent text-emerald-300 border-emerald-500/30 shadow-[0_0_20px_-5px_rgba(16,185,129,0.15)]'
                            : 'bg-slate-900/40 text-slate-400 border-white/[0.04] hover:bg-slate-900/80 hover:text-white'
                        }`}
                      >
                        <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${
                          isCurrent ? 'bg-emerald-500 text-slate-950' : 'bg-slate-950 border border-white/5 text-slate-400'
                        }`}>
                          <DesktopIcon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-bold tracking-wide">{item.label}</p>
                          <p className="text-[11px] text-slate-500">{item.desc}</p>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>

                <div className="mt-6 border-t border-white/10 pt-5 space-y-3">
                  <p className="text-[10px] uppercase tracking-[0.35em] text-slate-400 font-mono">Aksi Cepat</p>
                  <button
                    onClick={() => handleNavClick('dashboard')}
                    className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-slate-200 hover:bg-slate-900/90"
                  >
                    <span>🔔 Notifikasi</span>
                    <span className="text-[11px] text-slate-400">Lihat</span>
                  </button>
                  <button
                    onClick={() => handleNavClick('dashboard')}
                    className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-slate-200 hover:bg-slate-900/90"
                  >
                    <span>💬 Chat</span>
                    <span className="text-[11px] text-slate-400">Profil</span>
                  </button>
                </div>
              </div>

              <motion.div 
                variants={itemVariants}
                className="p-4 pl-16 bg-slate-900/10 text-left w-full border-none"
              >
                <p className="text-[9px] font-mono text-slate-600 tracking-wider">
                  ZIPPER ENGINE v2.5
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* LENGKUNGAN INTERKONEKSI LAYOUT */}
        {sidebarPanelOpen && (
          <div className="fixed left-72 top-20 w-12 h-12 pointer-events-none overflow-hidden z-[56]">
            <div 
              className="w-full h-full rounded-tl-[48px] bg-transparent"
              style={{ boxShadow: '-24px -24px 0 0 #020617' }}
            />
          </div>
        )}
      </div>
    </>
  );
}