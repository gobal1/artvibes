import React, { useEffect, useMemo, useState } from 'react';

export default function DashboardFinancePage({ navigateTo, purchasedProducts = [], marketCurrencySymbol = 'POL' }) {
  const fallbackAnalytics = useMemo(() => {
    const totalRevenue = purchasedProducts.reduce((sum, p) => {
      const v = parseFloat(p.transaction_amount || p.price_crypto);
      return sum + (Number.isNaN(v) ? 0 : v);
    }, 0);

    const months = Array.from({ length: 12 }, (_, i) => ({ label: `M${i + 1}`, value: 0 }));
    (purchasedProducts || []).forEach((p, idx) => {
      const m = idx % 12;
      const v = parseFloat(p.transaction_amount || p.price_crypto) || 0;
      months[m].value += v;
    });

    const maxMonthValue = Math.max(...months.map((m) => m.value), 1);

    const smallStats = {
      totalRevenue: Number(totalRevenue.toFixed(3)),
      totalSales: purchasedProducts.length,
      avgPrice: purchasedProducts.length ? Number((totalRevenue / purchasedProducts.length).toFixed(3)) : 0,
      topMonthValue: Number(maxMonthValue.toFixed(3)),
    };

    const recent = (purchasedProducts || []).slice(0, 6).map((p) => ({
      id: p.idproduk || p.id || Math.random().toString(36).slice(2, 9),
      title: p.title || 'Untitled',
      price: parseFloat(p.transaction_amount || p.price_crypto) || 0,
      status: p.status || 'unlisted',
    }));

    return { months, smallStats, recent };
  }, [purchasedProducts]);

  const [analytics, setAnalytics] = useState(fallbackAnalytics);

  useEffect(() => {
    setAnalytics(fallbackAnalytics);
  }, [fallbackAnalytics]);

  useEffect(() => {
    let isCancelled = false;

    const fetchAnalytics = async () => {
      try {
        const response = await fetch('/api/transaksi/finance-analytics', {
          headers: {
            Accept: 'application/json',
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
          },
          credentials: 'include',
        });

        if (!response.ok) {
          return;
        }

        const data = await response.json();
        if (!isCancelled && data?.months && data?.smallStats) {
          setAnalytics(data);
        }
      } catch (error) {
        console.error('Error fetching finance analytics:', error);
      }
    };

    fetchAnalytics();

    return () => {
      isCancelled = true;
    };
  }, [purchasedProducts.length]);

  return (
    <div className="w-full min-h-[calc(100vh-5rem)] bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.12),transparent_42%),linear-gradient(180deg,#f8fafc_0%,#fff7ed_100%)] text-neutral-900 pb-24 xl:pb-0">
    <main className="max-w-7xl mx-auto px-4 sm:px-5 xl:pr-20 w-full flex-1 my-5 space-y-4">
      <button
        type="button"
        onClick={() => navigateTo('dashboard')}
        className="flex items-center gap-2 text-neutral-900 hover:text-neutral-600 font-black text-[11px] uppercase tracking-wider transition cursor-pointer"
      >
        &larr; Kembali ke Studio
      </button>

      <div className="rounded-xl border-3 border-neutral-950 bg-white px-4 py-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <h2 className="text-lg font-black uppercase tracking-wider text-neutral-900">Data Pendapatan</h2>
        <p className="text-[12px] text-neutral-600">Ringkasan pendapatan, statistik, dan transaksi terbaru.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white border-4 border-neutral-950 p-3.5 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider">Grafik Penjualan (12 Bulan)</h3>
              <p className="text-[11px] text-neutral-500">Rekap tren penjualan berdasarkan data koleksi pembeli.</p>
            </div>
            <div className="text-[11px] font-mono text-neutral-600">
              Total: <span className="font-black">{analytics.smallStats.totalRevenue} {marketCurrencySymbol}</span>
            </div>
          </div>

          <div className="w-full h-48 bg-neutral-50 border-2 border-neutral-200 p-2 rounded-md">
            <svg viewBox="0 0 120 40" preserveAspectRatio="none" className="w-full h-full">
              <defs>
                <linearGradient id="financeGrad" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#fde68a" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#f97316" stopOpacity="0.1" />
                </linearGradient>
              </defs>
              <polyline
                fill="url(#financeGrad)"
                stroke="none"
                points={analytics.months
                  .map((m, i) => `${(i / (analytics.months.length - 1)) * 120},${40 - (m.value / (Math.max(...analytics.months.map((x) => x.value), 1))) * 36}`)
                  .join(' ')}
              />
              <polyline
                fill="none"
                stroke="#111827"
                strokeWidth="0.8"
                points={analytics.months
                  .map((m, i) => `${(i / (analytics.months.length - 1)) * 120},${40 - (m.value / (Math.max(...analytics.months.map((x) => x.value), 1))) * 36}`)
                  .join(' ')}
              />
              {analytics.months.map((m, i) => (
                <circle
                  key={i}
                  cx={(i / (analytics.months.length - 1)) * 120}
                  cy={40 - (m.value / (Math.max(...analytics.months.map((x) => x.value), 1))) * 36}
                  r="0.8"
                  fill="#111827"
                />
              ))}
            </svg>
          </div>

          <div className="mt-3">
            <h4 className="text-xs font-black uppercase tracking-wider mb-2">Transaksi Terakhir</h4>
            <div className="bg-neutral-50 border-2 border-neutral-200 p-3 rounded-md">
              {analytics.recent.length === 0 ? (
                <div className="text-[11px] text-neutral-500">Belum ada transaksi untuk ditampilkan.</div>
              ) : (
                <ul className="space-y-2 text-[12px]">
                  {analytics.recent.map((tx) => (
                    <li key={tx.id} className="flex justify-between items-center">
                      <div className="truncate">
                        <div className="font-black text-sm truncate">{tx.title}</div>
                        <div className="text-[11px] text-neutral-500">Status: {tx.status}</div>
                      </div>
                      <div className="font-mono font-black">{tx.price.toFixed(3)} {marketCurrencySymbol}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        <aside className="bg-white border-4 border-neutral-950 p-3.5 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] rounded-xl space-y-3">
          <h4 className="text-xs text-neutral-600 uppercase tracking-widest">KPI Ringkas</h4>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 bg-amber-50 border border-amber-300 rounded-md">
              <div className="text-[10px] text-neutral-600">Total Pendapatan</div>
              <div className="text-lg font-black">{analytics.smallStats.totalRevenue} {marketCurrencySymbol}</div>
            </div>
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-md">
              <div className="text-[10px] text-neutral-600">Total Penjualan</div>
              <div className="text-lg font-black">{analytics.smallStats.totalSales}</div>
            </div>
            <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-md">
              <div className="text-[10px] text-neutral-600">Rata-rata Harga</div>
              <div className="text-lg font-black">{analytics.smallStats.avgPrice} {marketCurrencySymbol}</div>
            </div>
            <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-md">
              <div className="text-[10px] text-neutral-600">Top Bulan</div>
              <div className="text-lg font-black">{analytics.smallStats.topMonthValue} {marketCurrencySymbol}</div>
            </div>
          </div>
        </aside>
      </div>
    </main>
    </div>
  );
}
