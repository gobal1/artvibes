import React, { useMemo, useState } from 'react';
import ChatSidebar from '../Components/ChatSidebar';

export default function PublicProfile({ navigateTo, targetUser, products = [], auth }) {
  const [isChatOpen, setIsChatOpen] = useState(false);

  const profileBackgroundUrl = useMemo(() => {
    return (
      targetUser?.profile_background ||
      targetUser?.profileBackground ||
      targetUser?.user?.profile_background ||
      targetUser?.user?.profileBackground ||
      ''
    );
  }, [targetUser]);

  const currentUserId = auth?.user?.idUser || auth?.user?.id;
  const targetUserId = targetUser?.idUser || targetUser?.id;
  const isOwnProfile = Boolean(currentUserId && targetUserId && currentUserId === targetUserId);

  const creatorProducts = useMemo(() => {
    if (!targetUser) return [];

    const creatorId = targetUserId;
    if (!creatorId) return [];

    return products.filter((product) => {
      const productCreatorId = product?.user?.idUser || product?.user?.id;
      return productCreatorId === creatorId;
    });
  }, [products, targetUser, targetUserId]);

  return (
    <div className="flex min-h-screen w-full flex-col justify-between bg-white text-neutral-900">
      <header className="flex items-center justify-between border-b-4 border-neutral-950 bg-neutral-950 p-4 text-white">
        <div onClick={() => navigateTo('explore')} className="cursor-pointer text-sm font-black uppercase tracking-wider">
          ART VIBES CREATIVE
        </div>
        <button
          onClick={() => navigateTo('explore')}
          className="cursor-pointer border-2 border-white bg-white px-4 py-1.5 text-xs font-black uppercase text-neutral-950 transition hover:bg-neutral-100"
        >
          Jelajahi Karya
        </button>
      </header>

      <main className="mx-auto mt-0 mb-8 flex w-full max-w-7xl flex-1 flex-col space-y-6 px-6">
        

        <div className="relative overflow-hidden" style={{ marginLeft: 'calc(50% - 50vw)', marginRight: 'calc(50% - 50vw)', marginTop: '-4px' }}>
          <div className="relative w-full">
            {profileBackgroundUrl && (
              <div
                className="absolute left-0 right-0 top-0 h-48 sm:h-64 md:h-72 bg-cover bg-center"
                style={{
                  backgroundImage: `url('${profileBackgroundUrl}')`,
                }}
              />
            )}
            <div className="absolute left-0 right-0 top-0 h-48 sm:h-64 md:h-72 bg-linear-to-t from-black/65 via-black/10 to-transparent" />

            <div className="relative h-48 sm:h-64 md:h-72" />

            <div className="relative mx-auto -mt-14 w-full max-w-7xl rounded-4xl border border-neutral-200 bg-white px-6 pt-20 pb-8 shadow-[0_35px_90px_-45px_rgba(15,23,42,0.25)] sm:px-10 sm:pt-10 sm:pb-10">
              <div className="absolute z-30 top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 sm:left-8 sm:translate-x-0 sm:-translate-y-1/2">
                <div className="h-20 w-20 sm:h-28 sm:w-28 overflow-hidden rounded-full border-8 border-white shadow-[0_0_0_4px_rgba(0,0,0,0.12)]">
                  <img
                    src={targetUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                    alt="avatar"
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
              <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr] lg:gap-8">
                <div className="space-y-6">
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                    <div className="flex items-center gap-5 pl-12 sm:pl-28">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-3">
                          <h1 className="text-3xl font-black uppercase tracking-tight text-neutral-950">{targetUser?.name || 'FAHMI'}</h1>
                          <span className="rounded-full bg-emerald-600 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white shadow-[0_6px_20px_-14px_rgba(16,185,129,0.8)]">
                            Verified Creator
                          </span>
                        </div>
                        <div className="inline-flex flex-wrap items-center gap-2 rounded-full border border-neutral-300 bg-neutral-100 px-3 py-1 text-[11px] font-mono text-neutral-600">
                          Wallet: {targetUser?.wallet_address || targetUser?.walletAddress || '0x0000...0000'}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => navigateTo('login')}
                        className="min-w-35 rounded-3xl border-2 border-neutral-950 bg-amber-400 px-4 py-2 text-[11px] font-black uppercase tracking-widest text-neutral-950 transition hover:bg-amber-500"
                      >
                        🔐 Login
                      </button>
                      {currentUserId && !isOwnProfile ? (
                        <button
                          onClick={() => setIsChatOpen(true)}
                          className="min-w-35 rounded-3xl border-2 border-neutral-950 bg-neutral-950 px-4 py-2 text-[11px] font-black uppercase tracking-widest text-white transition hover:bg-neutral-800"
                          title="Buka chat dengan owner"
                        >
                          💬 Chat
                        </button>
                      ) : currentUserId && isOwnProfile ? (
                        <div className="min-w-35 rounded-3xl border-2 border-neutral-300 bg-neutral-200 px-4 py-2 text-center text-[11px] font-black uppercase tracking-widest text-neutral-600">
                          👤 Profile Anda
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-[1.75rem] border border-neutral-200 bg-slate-50/90 p-4 text-sm shadow-[0_20px_45px_-30px_rgba(15,23,42,0.7)]">
                      <div className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Status</div>
                      <div className="mt-2 text-sm font-black uppercase text-neutral-950">Creator Aktif</div>
                    </div>
                    <div className="rounded-[1.75rem] border border-neutral-200 bg-slate-50/90 p-4 text-sm shadow-[0_20px_45px_-30px_rgba(15,23,42,0.7)]">
                      <div className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Koleksi</div>
                      <div className="mt-2 text-sm font-black uppercase text-neutral-950">{creatorProducts.length} karya</div>
                    </div>
                    <div className="rounded-[1.75rem] border border-neutral-200 bg-slate-50/90 p-4 text-sm shadow-[0_20px_45px_-30px_rgba(15,23,42,0.7)]">
                      <div className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Profil</div>
                      <div className="mt-2 text-sm font-black uppercase text-neutral-950">Publik Eksklusif</div>
                    </div>
                  </div>

                  <div className="rounded-4xl border border-neutral-200 bg-amber-50/95 p-5 text-sm text-neutral-700 shadow-[0_24px_80px_-50px_rgba(245,158,11,0.75)]">
                    <div className="font-mono text-[10px] font-black uppercase tracking-widest text-amber-800">📝 Tentang Kreator</div>
                    <p className="mt-3 text-xs leading-6 text-neutral-700">
                      {targetUser?.bio || 'Mengintegrasikan estetika fisik museum klasik ke dalam mahakarya digital blockchain eksklusif.'}
                    </p>
                  </div>
                </div>

                <div className="rounded-[2.5rem] border border-neutral-200 bg-white p-6 shadow-[0_24px_90px_-60px_rgba(0,0,0,0.55)]">
                  <div className="flex items-center justify-between gap-3 text-xs uppercase tracking-widest text-neutral-500">
                    <span className="font-black">Galeri Publik</span>
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">Live</span>
                  </div>
                  <div className="mt-6 space-y-4">
                    <div className="rounded-3xl border border-neutral-200 bg-slate-50 p-4">
                      <div className="text-[10px] uppercase tracking-widest text-neutral-500">Viewer</div>
                      <div className="mt-2 text-lg font-black text-neutral-950">34.8K</div>
                    </div>
                    <div className="rounded-3xl border border-neutral-200 bg-slate-50 p-4">
                      <div className="text-[10px] uppercase tracking-widest text-neutral-500">Karya Hits</div>
                      <div className="mt-2 text-lg font-black text-neutral-950">{creatorProducts.length > 0 ? creatorProducts.length : 0}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-4">
          <h2 className="border-b-2 border-neutral-950 pb-2 text-sm font-black uppercase tracking-wider">
            Koleksi Karya Seni
          </h2>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {creatorProducts.length > 0 ? (
              creatorProducts.map((p, idx) => {
                let imageUrl = '/images/default-art.jpg';
                if (p.image_url && p.image_url !== 'default.jpg') {
                  imageUrl = p.image_url.startsWith('/storage/') ? p.image_url : `/storage/${p.image_url}`;
                }

                return (
                  <div key={idx} className="flex flex-col justify-between border-4 border-neutral-950 bg-white p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                    <div
                      onClick={() => navigateTo('product-detail', p)}
                      className="relative aspect-4/3 overflow-hidden border-2 border-neutral-950 bg-neutral-100"
                    >
                      <img src={imageUrl} alt={p.title} className="h-full w-full object-cover transition hover:scale-105" />
                    </div>
                    <div className="flex items-center justify-between gap-2 pt-3">
                      <h3 className="flex-1 truncate text-xs font-extrabold uppercase">{p.title}</h3>
                      <button
                        onClick={() => navigateTo('product-detail', p)}
                        className="shrink-0 border-2 border-neutral-950 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-wider transition hover:bg-neutral-950 hover:text-white"
                      >
                        Detail
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full py-12 text-center">
                <p className="font-medium text-neutral-500">Belum ada karya yang dipublikasikan oleh creator ini.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="mt-12 border-t-4 border-neutral-950 p-4 text-center text-xs font-mono text-neutral-500">
        © 2026 Art Vibes Creative. Public Profile View.
      </footer>

      {isChatOpen && (
        <ChatSidebar
          targetUser={targetUser}
          auth={auth}
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          onMessageSent={() => {}}
        />
      )}
    </div>
  );
}
