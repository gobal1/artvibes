import React, { useEffect, useState } from 'react';
import StudioNavigationPanel from '../Components/StudioNavigationPanel';

export default function DashboardLikedPage({ navigateTo, auth, marketCurrencySymbol = 'POL' }) {
  const [likedProductsData, setLikedProductsData] = useState([]);
  const [loadingLikedProducts, setLoadingLikedProducts] = useState(false);

  useEffect(() => {
    const fetchLikedProductsForDashboard = async () => {
      const userId = auth?.user?.idUser || auth?.user?.id;
      if (!userId) {
        setLikedProductsData([]);
        return;
      }

      try {
        setLoadingLikedProducts(true);
        const likesRes = await fetch(`/api/likes/user/${userId}`, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
          },
          credentials: 'include',
        });

        if (!likesRes.ok) {
          setLikedProductsData([]);
          return;
        }

        const likesData = await likesRes.json();
        if (!Array.isArray(likesData) || likesData.length === 0) {
          setLikedProductsData([]);
          return;
        }

        const normalizedProducts = likesData
          .map((item) => item?.produk || item?.product || item)
          .filter((item) => item && (item.idproduk || item.id));

        if (normalizedProducts.length > 0) {
          setLikedProductsData(normalizedProducts);
          return;
        }

        const likedIds = likesData
          .map((item) => item.id_produk || item.idproduk || item.product_id)
          .filter(Boolean)
          .map((id) => String(id));

        if (likedIds.length === 0) {
          setLikedProductsData([]);
          return;
        }

        const productsRes = await fetch('/api/produk', {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
          },
          credentials: 'include',
        });

        if (!productsRes.ok) {
          setLikedProductsData([]);
          return;
        }

        const allProducts = await productsRes.json();
        const likedProducts = (Array.isArray(allProducts) ? allProducts : []).filter((product) =>
          likedIds.includes(String(product.idproduk || product.id))
        );

        setLikedProductsData(likedProducts);
      } catch (error) {
        console.error('Error fetching liked products for dashboard:', error);
        setLikedProductsData([]);
      } finally {
        setLoadingLikedProducts(false);
      }
    };

    fetchLikedProductsForDashboard();
  }, [auth?.user?.idUser, auth?.user?.id]);

  return (
    <div className="w-full min-h-[calc(100vh-5rem)] bg-[radial-gradient(circle_at_top,rgba(239,68,68,0.1),transparent_42%),linear-gradient(180deg,#f8fafc_0%,#fdf2f8_100%)] text-neutral-900 pb-24 xl:pb-0">
    <main className="max-w-7xl mx-auto px-4 sm:px-5 xl:pr-20 w-full flex-1 my-5 space-y-4">
      <button
        type="button"
        onClick={() => navigateTo('dashboard')}
        className="flex items-center gap-2 text-neutral-900 hover:text-neutral-600 font-black text-[11px] uppercase tracking-wider transition cursor-pointer"
      >
        &larr; Kembali ke Studio
      </button>

      <div className="rounded-xl border-3 border-neutral-950 bg-white px-4 py-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <h2 className="text-lg font-black uppercase tracking-wider text-neutral-900">Disukai Saya</h2>
        <p className="text-[12px] text-neutral-600">Semua karya favorit yang Anda tandai dengan hati.</p>
      </div>

      {loadingLikedProducts ? (
        <div className="p-12 text-center border-4 border-dashed border-neutral-300 text-neutral-500 font-black text-xs uppercase tracking-widest bg-neutral-50 rounded-xl">
          Memuat produk yang Anda sukai...
        </div>
      ) : likedProductsData.length === 0 ? (
        <div className="p-12 text-center border-4 border-dashed border-neutral-300 text-neutral-400 font-black text-xs uppercase tracking-widest bg-neutral-50 rounded-xl">
          Belum ada produk disukai. Buka Explore lalu tekan ikon hati pada produk favorit Anda.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pt-1">
          {likedProductsData.map((p, idx) => (
            <div key={p.idproduk || p.id || idx} className="bg-white border-3 border-neutral-950 p-2.5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between rounded-xl hover:-translate-y-1 hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-all">
              <div className="border-2 border-neutral-950 aspect-4/3 bg-neutral-100 overflow-hidden relative">
                <img
                  src={
                    p.image_url
                      ? p.image_url.startsWith('/storage/') || p.image_url.startsWith('http')
                        ? p.image_url
                        : `/storage/${p.image_url}`
                      : 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=400&q=80'
                  }
                  alt={p.title || 'Produk Disukai'}
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-2 right-2 border-2 border-neutral-950 bg-rose-200 px-2 py-0.5 text-[10px] font-black text-neutral-950 uppercase tracking-wider shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                  Disukai
                </span>
              </div>
              <div className="pt-2.5 space-y-1.5">
                <div className="flex justify-between items-start gap-1">
                  <h3 className="font-black text-[13px] truncate uppercase tracking-tight w-3/4">{p.title || 'Karya Digital'}</h3>
                  <span className="font-mono text-xs bg-neutral-950 text-amber-400 px-1.5 py-0.5 shrink-0 font-bold">{p.price_crypto || '0'} {marketCurrencySymbol}</span>
                </div>
                <p className="text-[11px] text-neutral-500 line-clamp-1 italic">"{p.deskripsi || 'No description available.'}"</p>
                <div className="border-t-2 border-dashed border-neutral-200 pt-2 flex justify-end gap-1">
                  <button
                    type="button"
                    onClick={() => navigateTo('product-detail', p)}
                    className="border border-neutral-950 px-2 py-1 text-[10px] font-black uppercase bg-neutral-50 hover:bg-neutral-200 cursor-pointer"
                  >
                    Detail
                  </button>
                  <button
                    type="button"
                    onClick={() => navigateTo('explore')}
                    className="border border-neutral-950 px-2 py-1 text-[10px] font-black uppercase bg-rose-100 hover:bg-rose-200 cursor-pointer"
                  >
                    Explore
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
    <StudioNavigationPanel navigateTo={navigateTo} active="liked" />
    </div>
  );
}
