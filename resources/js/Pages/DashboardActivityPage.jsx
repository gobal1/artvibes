import React, { useMemo, useState } from 'react';
import { Bell, MessageSquare, Image, ShoppingBag, ArrowRightLeft, Wallet, ArrowRight } from 'lucide-react';

export default function DashboardActivityPage({
  unreadCount = 0,
  notifications = [],
  myProductsCount = 0,
  purchasedCount = 0,
  recentProducts = [],
  recentPurchases = [],
  onOpenChat,
  onGoExplore,
  walletAddress = '',
  fullPage = false,
}) {
  const [activeWallet, setActiveWallet] = useState('all');
  const [activeType, setActiveType] = useState('all');

  const shortWallet = useMemo(() => {
    if (!walletAddress) return 'Wallet belum terhubung';
    return `${walletAddress.slice(0, 8)}...${walletAddress.slice(-4)}`;
  }, [walletAddress]);

  const activityRows = useMemo(() => {
    const rowsFromPurchases = (recentPurchases || []).map((item, index) => ({
      id: `buy-${item.idproduk || item.id || index}`,
      type: 'receive',
      eventLabel: 'Receive',
      asset: item.title || 'NFT Asset',
      amount: Number.parseFloat(item.transaction_amount || item.price_crypto || 0) || 0,
      from: 'Market',
      to: 'You',
      icon: ShoppingBag,
      status: 'confirmed',
    }));

    const rowsFromProducts = (recentProducts || []).map((item, index) => ({
      id: `list-${item.idproduk || item.id || index}`,
      type: 'listing',
      eventLabel: 'Listing',
      asset: item.title || 'Artwork',
      amount: Number.parseFloat(item.price_crypto || 0) || 0,
      from: 'You',
      to: 'Market',
      icon: Image,
      status: item.status === 'sold' ? 'confirmed' : 'active',
    }));

    const rowsFromNotifications = (notifications || []).slice(0, 8).map((item, index) => ({
      id: `notif-${item.id || index}`,
      type: 'system',
      eventLabel: item.read ? 'System' : 'Alert',
      asset: (item.text || 'Update sistem').slice(0, 46),
      amount: 0,
      from: 'System',
      to: 'You',
      icon: Bell,
      status: item.read ? 'confirmed' : 'pending',
    }));

    return [...rowsFromPurchases, ...rowsFromProducts, ...rowsFromNotifications].slice(0, 22);
  }, [recentPurchases, recentProducts, notifications]);

  const filteredRows = useMemo(() => {
    return activityRows.filter((row) => {
      if (activeType !== 'all' && row.type !== activeType) return false;
      if (activeWallet !== 'all' && row.to !== 'You') return false;
      return true;
    });
  }, [activityRows, activeType, activeWallet]);

  const usdValue = useMemo(() => {
    const total = filteredRows.reduce((sum, row) => sum + (row.amount || 0), 0);
    return (total * 0.18).toFixed(2);
  }, [filteredRows]);

  return (
    <div className={`overflow-hidden border-2 border-neutral-800 bg-slate-950 text-slate-100 ${fullPage ? 'min-h-[calc(100vh-10rem)] rounded-none shadow-none' : 'rounded-2xl shadow-[0_20px_60px_rgba(2,6,23,0.75)]'}`}>
      <div className="border-b border-white/10 bg-[radial-gradient(circle_at_top,rgba(217,70,239,0.15),transparent_40%),linear-gradient(180deg,#1e1b2e_0%,#0b1020_90%)] px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h3 className="text-xl font-black tracking-tight text-white">Activity</h3>
            <p className="mt-1 text-xs text-slate-300">Riwayat transaksi, listing, dan notifikasi akun kreator.</p>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center min-w-65">
            <div className="rounded-lg border border-white/10 bg-slate-900/60 px-2 py-2">
              <p className="text-[10px] uppercase tracking-widest text-slate-400">USD Value</p>
              <p className="text-lg font-black text-white">${usdValue}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-slate-900/60 px-2 py-2">
              <p className="text-[10px] uppercase tracking-widest text-slate-400">NFTs</p>
              <p className="text-lg font-black text-white">{myProductsCount + purchasedCount}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-slate-900/60 px-2 py-2">
              <p className="text-[10px] uppercase tracking-widest text-slate-400">Alerts</p>
              <p className="text-lg font-black text-white">{unreadCount}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-0 lg:grid-cols-[270px_minmax(0,1fr)]">
        <aside className="border-b lg:border-b-0 lg:border-r border-white/10 bg-slate-950/90 p-4">
          <div>
            <p className="mb-2 text-xs font-black uppercase tracking-wider text-slate-400">Wallets</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setActiveWallet('all')}
                className={`rounded-md border px-3 py-1 text-xs font-black transition ${activeWallet === 'all' ? 'border-cyan-400 bg-cyan-500/20 text-cyan-200' : 'border-white/15 bg-slate-900 text-slate-200 hover:border-cyan-500/40'}`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setActiveWallet('mine')}
                className={`inline-flex items-center gap-1 rounded-md border px-3 py-1 text-xs font-black transition ${activeWallet === 'mine' ? 'border-cyan-400 bg-cyan-500/20 text-cyan-200' : 'border-white/15 bg-slate-900 text-slate-200 hover:border-cyan-500/40'}`}
              >
                <Wallet className="h-3.5 w-3.5" />
                {shortWallet}
              </button>
            </div>
          </div>

          <div className="mt-5">
            <p className="mb-2 text-xs font-black uppercase tracking-wider text-slate-400">Status / Event</p>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'all', label: 'All' },
                { id: 'receive', label: 'Receive' },
                { id: 'listing', label: 'Listing' },
                { id: 'system', label: 'System' },
              ].map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setActiveType(type.id)}
                  className={`rounded-md border px-3 py-1 text-xs font-black transition ${activeType === type.id ? 'border-fuchsia-400 bg-fuchsia-500/20 text-fuchsia-200' : 'border-white/15 bg-slate-900 text-slate-200 hover:border-fuchsia-500/40'}`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 space-y-2 text-xs text-slate-300">
            <div className="rounded-lg border border-white/10 bg-slate-900/70 p-2.5">
              Total records: <span className="font-black text-white">{filteredRows.length}</span>
            </div>
            <button
              type="button"
              onClick={onOpenChat}
              className="w-full inline-flex items-center justify-center gap-1 rounded-md border border-white/15 bg-slate-900 px-3 py-2 text-xs font-black uppercase tracking-wider text-slate-100 transition hover:border-cyan-400/50"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Buka Chat
            </button>
            <button
              type="button"
              onClick={onGoExplore}
              className="w-full inline-flex items-center justify-center gap-1 rounded-md border border-white/15 bg-slate-900 px-3 py-2 text-xs font-black uppercase tracking-wider text-slate-100 transition hover:border-fuchsia-400/50"
            >
              <ArrowRight className="h-3.5 w-3.5" />
              Ke Explore
            </button>
          </div>
        </aside>

        <section className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <div className="min-w-190">
              <div className="grid grid-cols-[1.5fr_2fr_1fr_1.5fr] gap-2 border-b border-white/10 bg-slate-900/60 px-4 py-2 text-[11px] font-black uppercase tracking-widest text-slate-400">
                <span>Event</span>
                <span>Asset</span>
                <span className="text-right">Amount</span>
                <span className="text-right">From / To</span>
              </div>

              {filteredRows.length === 0 ? (
                <div className="px-4 py-10 text-center text-sm text-slate-400">Tidak ada aktivitas yang cocok dengan filter saat ini.</div>
              ) : (
                <div className="divide-y divide-white/10">
                  {filteredRows.map((row) => {
                    const RowIcon = row.icon || ArrowRightLeft;
                    return (
                      <div key={row.id} className="grid grid-cols-[1.5fr_2fr_1fr_1.5fr] gap-2 px-4 py-3 text-sm hover:bg-white/3">
                        <div className="flex items-center gap-2 font-bold text-white">
                          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/15 bg-slate-900">
                            <RowIcon className="h-3.5 w-3.5 text-cyan-300" />
                          </span>
                          {row.eventLabel}
                        </div>
                        <div className="truncate text-slate-100">{row.asset}</div>
                        <div className="text-right font-mono font-bold text-cyan-200">{row.amount.toFixed(3)} POL</div>
                        <div className="text-right text-slate-300">
                          {row.from} <span className="text-slate-500">-&gt;</span> <span className="font-black text-white">{row.to}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
