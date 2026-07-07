import React from 'react';
import { LayoutDashboard, DollarSign, Heart, Bell } from 'lucide-react';

export default function StudioNavigationPanel({ navigateTo, active = 'dashboard' }) {
  const actions = [
    { id: 'dashboard', label: 'Studio', icon: LayoutDashboard, onClick: () => navigateTo('dashboard') },
    { id: 'finance', label: 'Pendapatan', icon: DollarSign, onClick: () => navigateTo('dashboard-finance') },
    { id: 'liked', label: 'Disukai', icon: Heart, onClick: () => navigateTo('dashboard-liked') },
    { id: 'activity', label: 'Aktivitas', icon: Bell, onClick: () => navigateTo('dashboard-activity') },
  ];

  return (
    <>
      <aside className="hidden xl:flex fixed inset-y-0 right-0 z-30 h-dvh min-h-dvh w-14 flex-col items-center justify-between border-l border-white/10 bg-slate-950 p-3 shadow-[0_35px_60px_-30px_rgba(0,0,0,0.8)]">
        <div className="space-y-2 text-center pt-6">
          <div className="text-[9px] uppercase tracking-[0.45em] text-emerald-400 font-mono">Aksi</div>
          <div className="h-px w-full bg-white/10" />
        </div>

        <div className="flex flex-col items-center gap-3">
          {actions.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={item.onClick}
                className={`group relative flex h-12 w-12 items-center justify-center rounded-3xl border transition duration-200 ${isActive ? 'border-emerald-400 bg-emerald-500/15 text-emerald-300 shadow-[0_0_16px_-6px_rgba(52,211,153,0.8)]' : 'border-white/10 bg-slate-950 text-slate-300 hover:border-emerald-400 hover:text-emerald-300'}`}
              >
                <Icon className="h-5 w-5" />
                <span className="pointer-events-none absolute right-full mr-2 hidden rounded-full border border-white/10 bg-slate-950 px-3 py-1 text-[10px] uppercase tracking-[0.35em] font-black text-white shadow-lg group-hover:block">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>

        <div className="h-10" />
      </aside>

      <div className="xl:hidden fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 z-40 w-[calc(100%-1rem)] max-w-md rounded-2xl border-2 border-neutral-950 bg-white/95 backdrop-blur p-1.5 shadow-[0_8px_20px_rgba(0,0,0,0.25)]">
        <div className="grid grid-cols-4 gap-1.5">
          {actions.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={item.onClick}
                className={`inline-flex flex-col items-center justify-center gap-1 rounded-xl border px-1 py-1.5 text-[9px] font-black uppercase tracking-wider transition ${isActive ? 'border-neutral-950 bg-neutral-950 text-white' : 'border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-50'}`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="leading-none">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
