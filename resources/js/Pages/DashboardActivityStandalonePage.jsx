import React, { useEffect, useMemo, useState } from 'react';
import DashboardActivityPage from './DashboardActivityPage';
import StudioNavigationPanel from '../Components/StudioNavigationPanel';

export default function DashboardActivityStandalonePage({ navigateTo, auth, myProducts = [], purchasedProducts = [] }) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      const userId = auth?.user?.idUser || auth?.user?.id;
      if (!userId) {
        setUnreadCount(0);
        return;
      }

      try {
        const response = await fetch('/api/messages/unread-count', {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
          },
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          setUnreadCount(Number(data.unread_count || 0));
        }
      } catch (error) {
        console.error('Error fetching unread count:', error);
      }
    };

    fetchUnreadCount();
  }, [auth?.user?.idUser, auth?.user?.id]);

  const notifications = useMemo(() => {
    const productNotifications = (myProducts || []).slice(0, 10).map((item, index) => ({
      id: `prod-${item.idproduk || item.id || index}`,
      text: `Karya "${item.title || 'Untitled'}" aktif di studio.`,
      read: true,
    }));

    const purchaseNotifications = (purchasedProducts || []).slice(0, 10).map((item, index) => ({
      id: `buy-${item.idproduk || item.id || index}`,
      text: `Koleksi "${item.title || 'Untitled'}" masuk ke riwayat akun.`,
      read: true,
    }));

    return [
      {
        id: 'sys-1',
        text: unreadCount > 0 ? `Ada ${unreadCount} pesan belum dibaca.` : 'Tidak ada pesan baru saat ini.',
        read: unreadCount === 0,
      },
      ...purchaseNotifications,
      ...productNotifications,
    ].slice(0, 24);
  }, [myProducts, purchasedProducts, unreadCount]);

  return (
    <div className="w-full min-h-[calc(100vh-5rem)] bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.08),transparent_30%),linear-gradient(180deg,#eef6ff_0%,#f8fafc_12%,#ecfeff_100%)] text-neutral-900 pb-24 xl:pb-0">
    <main className="w-full flex-1 px-0 xl:pr-14 space-y-4">
      <button
        type="button"
        onClick={() => navigateTo('dashboard')}
        className="mx-4 mt-5 flex items-center gap-2 text-neutral-900 hover:text-neutral-600 font-black text-[11px] uppercase tracking-wider transition cursor-pointer sm:mx-5"
      >
        &larr; Kembali ke Studio
      </button>

      <DashboardActivityPage
        unreadCount={unreadCount}
        notifications={notifications}
        myProductsCount={myProducts.length}
        purchasedCount={purchasedProducts.length}
        recentProducts={(myProducts || []).slice(0, 8)}
        recentPurchases={(purchasedProducts || []).slice(0, 8)}
        onOpenChat={() => navigateTo('dashboard')}
        onGoExplore={() => navigateTo('explore')}
        walletAddress={auth?.user?.wallet_address || auth?.user?.wallet || ''}
        fullPage={true}
      />
    </main>
    <StudioNavigationPanel navigateTo={navigateTo} active="activity" />
    </div>
  );
}
