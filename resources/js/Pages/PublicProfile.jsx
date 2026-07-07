import React, { useMemo, useState } from 'react';
import ChatSidebar from '../Components/ChatSidebar';

// targetUser: Data profile orang lain yang diklik/sedang dilihat
// products: Semua produk untuk di-filter berdasarkan creator
export default function PublicProfile({ navigateTo, targetUser, products = [], auth }) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const profileBackgroundUrl = targetUser?.profile_background || '';
  
  // Normalize ID - handle both 'id' dan 'idUser' fields
  const getCurrentUserId = () => auth?.user?.id || auth?.user?.idUser;
  const getTargetUserId = () => targetUser?.idUser || targetUser?.id;
  
  // Check if current user is the profile owner
  const isOwnProfile = () => {
    const currentId = getCurrentUserId();
    const targetId = getTargetUserId();
    return currentId && targetId && currentId === targetId;
  };
  
  // Filter produk hanya milik creator yang sedang dilihat
  const creatorProducts = useMemo(() => {
    if (!targetUser) return [];
    
    const creatorId = getTargetUserId();
    if (!creatorId) return [];
    
    return products.filter(product => {
      const productCreatorId = product.user?.idUser || product.user?.id;
      return productCreatorId === creatorId;
    });
  }, [targetUser, products]);

  return (
    <div className="w-full min-h-screen bg-white text-neutral-900 flex flex-col justify-between">
      {/* Header Publik */}
      <header className="bg-neutral-950 text-white p-4 flex justify-between items-center border-b-4 border-neutral-950">
        <div onClick={() => navigateTo('explore')} className="font-black tracking-wider text-sm uppercase cursor-pointer">ART VIBES CREATIVE</div>
        <button onClick={() => navigateTo('explore')} className="bg-white text-neutral-950 font-black px-4 py-1.5 text-xs uppercase border-2 border-white hover:bg-neutral-100 transition cursor-pointer">Jelajahi Karya</button>
      </header>

      <main className="max-w-7xl mx-auto px-6 w-full flex-1 my-8 space-y-6">
        
        <button 
          onClick={() => navigateTo('explore')} 
          className="flex items-center gap-2 text-neutral-900 hover:text-neutral-600 font-black text-xs uppercase tracking-wider transition cursor-pointer"
        >
          ← Kembali ke Galeri Utama
        </button>

        {/* CONTAINER HERO / PUBLIC PROFILE INFO */}
        <div className="relative overflow-hidden rounded-3xl">
          {profileBackgroundUrl && (
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url('${profileBackgroundUrl}')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                opacity: 0.92,
                filter: 'brightness(0.92)',
              }}
            />
          )}
          <div className={`relative border-4 border-neutral-950 p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] space-y-4 ${profileBackgroundUrl ? 'bg-white/80' : 'bg-white'}`}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-5 flex-1">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-neutral-950 shrink-0 bg-neutral-200">
                <img src={targetUser?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"} alt="avatar" className="w-full h-full object-cover" />
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-black uppercase tracking-tight">{targetUser?.name || 'FAHMI'}</h1>
                  <span className="bg-emerald-600 text-white text-[9px] font-black uppercase tracking-widest px-2 py-0.5">Verified Creator</span>
                </div>
                <div className="bg-neutral-100 border border-neutral-300 px-2 py-1 font-mono text-xs text-neutral-600 inline-block">
                  Wallet: {targetUser?.walletAddress || '0x0000...0000'}
                </div>
                {targetUser?.bio && (
                  <div className="bg-amber-50 border-2 border-amber-200 p-3 rounded space-y-1">
                    <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-amber-900">📝 Tentang Kreator</div>
                    <p className="text-xs text-neutral-700 italic line-clamp-3">
                      "{targetUser.bio}"
                    </p>
                  </div>
                )}
                {!targetUser?.bio && (
                  <p className="text-xs text-neutral-500 italic max-w-xl">
                    "{targetUser?.bio || '"Mengintegrasikan estetika fisik museum klasik ke dalam mahakarya digital blockchain eksklusif."'}"
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2 shrink-0 w-full md:w-auto">
              <div className="bg-blue-50 text-blue-700 border-2 border-blue-400 font-mono px-4 py-2 text-xs font-black uppercase tracking-wider rounded text-center">
                👀 Galeri Publik Kreator
              </div>
              {/* TOMBOL CHAT MINI */}
              {getCurrentUserId() && !isOwnProfile() ? (
                <button
                  onClick={() => setIsChatOpen(true)}
                  className="bg-neutral-950 hover:bg-neutral-800 text-white border-2 border-neutral-950 font-black px-3 py-2 text-xs uppercase tracking-widest transition cursor-pointer shadow-[2px_2px_0px_0px_rgba(16,185,129,1)]"
                  title="Buka chat dengan owner"
                >
                  💬 Chat
                </button>
              ) : getCurrentUserId() && isOwnProfile() ? (
                <div className="bg-neutral-200 text-neutral-600 border-2 border-neutral-300 font-black px-3 py-2 text-xs uppercase tracking-widest text-center cursor-not-allowed">
                  👤 Profile Anda
                </div>
              ) : (
                <button
                  onClick={() => navigateTo('login')}
                  className="bg-amber-400 hover:bg-amber-500 text-neutral-950 border-2 border-neutral-950 font-black px-3 py-2 text-xs uppercase tracking-widest transition cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                >
                  🔐 Login
                </button>
              )}
            </div>
          </div>
        </div>

        {/* KARYA ETALASE */}
        <div className="space-y-4 pt-4">
          <h2 className="font-black text-sm uppercase tracking-wider border-b-2 border-neutral-950 pb-2">Koleksi Karya Seni</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {creatorProducts.length > 0 ? (
              creatorProducts.map((p, idx) => {
                let imageUrl = '/images/default-art.jpg';
                if (p.image_url && p.image_url !== 'default.jpg') {
                  imageUrl = p.image_url.startsWith('/storage/') 
                    ? p.image_url 
                    : `/storage/${p.image_url}`;
                }
                
                return (
                  <div key={idx} className="bg-white border-4 border-neutral-950 p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between cursor-pointer hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition">
                    <div 
                      onClick={() => navigateTo('product-detail', p)}
                      className="border-2 border-neutral-950 aspect-4/3 bg-neutral-100 overflow-hidden relative"
                    >
                      <img src={imageUrl} alt={p.title} className="w-full h-full object-cover hover:scale-105 transition" />
                    </div>
                    <div className="pt-3 flex justify-between items-center gap-2">
                      <h3 className="font-extrabold text-xs truncate uppercase flex-1">{p.title}</h3>
                      <button 
                        onClick={() => navigateTo('product-detail', p)}
                        className="border-2 border-neutral-950 bg-white hover:bg-neutral-950 hover:text-white px-3 py-1 text-[10px] font-black uppercase tracking-wider transition cursor-pointer shrink-0"
                      >
                        Detail
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-neutral-500 font-medium">Belum ada karya yang dipublikasikan oleh creator ini.</p>
              </div>
            )}
          </div>
        </div>

      </