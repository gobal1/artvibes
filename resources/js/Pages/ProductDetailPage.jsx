import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  Wallet, 
  ExternalLink, 
  ShieldCheck, 
  Tag, 
  History, 
  FileText, 
  Layers, 
  Share2, 
  Check,
  Info,
  Heart
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Sidebar from '../components/Sidebar';
import { buyListedToken, getConfiguredChainMetadata, getExplorerBaseUrl, getListingState, getNativeCurrencySymbol, requireWalletAccess, shortenAddress } from '../Utils/artVibesMarket';

export default function ProductDetailPage({ product, navigateTo, auth, onProductPurchased }) {
  const chainMeta = getConfiguredChainMetadata();
  const explorerBaseUrl = getExplorerBaseUrl();
  const nativeSymbol = getNativeCurrencySymbol();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarPanelOpen, setSidebarPanelOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('description');
  const [copied, setCopied] = useState(false);
  const [bidAmount, setBidAmount] = useState('');
  const [productData, setProductData] = useState(product);
  const [loadingProduct, setLoadingProduct] = useState(false);
  const [productError, setProductError] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isBuying, setIsBuying] = useState(false);
  const [listingState, setListingState] = useState(null);

  // State baru untuk fitur Suka
  const [liked, setLiked] = useState(false);

  const playVoiceScript = (text) => {
    if (!text) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('Speech synthesis tidak didukung di browser ini.');
      return;
    }

    const getIndonesianVoice = () => {
      const voices = window.speechSynthesis.getVoices() || [];
      let v = voices.find(v => v.lang && v.lang.toLowerCase().startsWith('id'));
      if (v) return v;
      v = voices.find(v => /indonesia|indonesian/i.test(v.name));
      if (v) return v;
      return voices[0] || null;
    };

    const speak = () => {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'id-ID';
      const voice = getIndonesianVoice();
      if (voice) utterance.voice = voice;
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    };

    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) {
      window.speechSynthesis.onvoiceschanged = () => {
        speak();
        window.speechSynthesis.onvoiceschanged = null;
      };
    } else {
      speak();
    }
  };

  const stopVoiceScript = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  // Sync product prop into local state so we can fetch detail when needed
  useEffect(() => {
    setProductData(product);
  }, [product]);

  useEffect(() => {
    const shouldFetchDetail = productData && productData.idproduk && !productData.deskripsi;
    if (!shouldFetchDetail) {
      return;
    }

    const fetchProductDetail = async () => {
      setLoadingProduct(true);
      setProductError(null);

      try {
        const response = await fetch(`/api/produk/${productData.idproduk}`);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        if (data && data.idproduk) {
          setProductData(data);
        }
      } catch (err) {
        console.error('Error fetching full product detail:', err);
        setProductError('Gagal memuat detail tambahan produk.');
      } finally {
        setLoadingProduct(false);
      }
    };

    fetchProductDetail();
  }, [productData]);

  useEffect(() => {
    let cancelled = false;
    const tokenId = Number(productData?.nft?.token_id ?? productData?.token_id);

    if (!Number.isInteger(tokenId) || tokenId <= 0) {
      setListingState({ status: 'unlinked', active: false });
      return;
    }

    const loadListingState = async () => {
      try {
        const listing = await getListingState(tokenId);
        if (!cancelled) {
          setListingState({
            status: listing.active ? 'active' : 'inactive',
            active: Boolean(listing.active),
            seller: listing.seller,
            priceWei: listing.priceWei?.toString?.() ?? String(listing.priceWei ?? ''),
          });
        }
      } catch (error) {
        if (!cancelled) {
          setListingState({
            status: 'inactive',
            active: false,
            error: error?.message || 'Gagal membaca listing on-chain',
          });
        }
      }
    };

    loadListingState();

    return () => {
      cancelled = true;
    };
  }, [productData]);

  // Gunakan product data yang dikirim dari exploration page
  const currentProduct = productData || {
    title: "Digital Art Premium",
    image_url: "/storage/default-art.jpg",
    price_crypto: 0.45,
    idproduk: 0,
    user: { name: "Unknown", avatar: "", idUser: 0 },
    deskripsi: "Karya seni digital mengeksplorasi kontradiksi dualitas internal manusia.",
  };

  // Format image URL
  let finalImageUrl = '/images/default-art.jpg';
  if (currentProduct.image_url && currentProduct.image_url !== 'default.jpg') {
    finalImageUrl = currentProduct.image_url.startsWith('/storage/') 
      ? currentProduct.image_url 
      : `/storage/${currentProduct.image_url}`;
  }

  // Ambil data kreator dari product.user
  const creatorData = {
    name: currentProduct.user?.name || "Unknown Creator",
    avatar: currentProduct.user?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80",
    bio: currentProduct.user?.bio || "Creator di Art Vibes",
    walletAddress: currentProduct.user?.wallet_address || "0x0000000000000000000000000000000000000000",
    userId: currentProduct.user?.idUser || 0
  };
  const nftData = currentProduct.nft || null;
  const contractAddress = nftData?.contract_address || '';
  const tokenId = nftData?.token_id || '';
  const tokenIdDisplay = tokenId ? `#${tokenId}` : 'Belum ada token';
  const tokenExplorerLink = contractAddress && tokenId ? `${explorerBaseUrl}/nft/${contractAddress}/${tokenId}` : null;
  const metadataUrl = nftData?.metadata_url || '';
  const provenanceRows = [
    nftData?.token_id ? {
      event: 'Minted (Dicetak)',
      price: '-',
      from: '0x0000...0000',
      to: creatorData.walletAddress ? shortenAddress(creatorData.walletAddress) : creatorData.name,
      date: 'Tersinkron dari data NFT',
    } : null,
    currentProduct.status === 'listing' ? {
      event: 'Listed',
      price: `${currentProduct.price_crypto || 0} ${nativeSymbol}`,
      from: creatorData.name,
      to: 'Marketplace',
      date: 'Status listing aktif',
    } : null,
    metadataUrl ? {
      event: 'Metadata',
      price: '-',
      from: 'IPFS',
      to: 'Stored',
      date: 'Metadata terhubung',
    } : null,
  ].filter(Boolean);

  // Related products carousel
  const [relatedProducts, setRelatedProducts] = useState([]);
  const carouselRef = useRef(null);
  const [relatedLoading, setRelatedLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const loadRelated = async () => {
      setRelatedLoading(true);
      try {
        const resp = await fetch('/api/produk');
        if (!resp.ok) return;
        const data = await resp.json();
        const currentId = currentProduct?.idproduk || currentProduct?.id || null;
        const filtered = (Array.isArray(data) ? data : []).filter(
          (p) => String(p.idproduk || p.id || '') !== String(currentId)
        );
        if (!cancelled) setRelatedProducts(filtered);
      } catch (err) {
        console.error('Error loading related products:', err);
      } finally {
        if (!cancelled) setRelatedLoading(false);
      }
    };

    loadRelated();
    return () => {
      cancelled = true;
    };
  }, [currentProduct]);

  const toggleSidebar = () => {
    if (window.innerWidth >= 1024) {
      setSidebarPanelOpen((prev) => !prev);
    } else {
      setSidebarOpen((prev) => !prev);
    }
  };

  const handleCopyAddress = (value) => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePlaceBid = (e) => {
    e.preventDefault();
    if (!bidAmount) return alert(`Masukkan jumlah ${nativeSymbol} untuk melakukan penawaran!`);
    alert(`Penawaran sebesar ${bidAmount} ${nativeSymbol} untuk "${currentProduct.title}" berhasil dikirim ke blockchain smart contract.`);
    setBidAmount('');
  };

  const handleBuyNow = async () => {
    const tokenIdRaw = currentProduct.nft?.token_id ?? currentProduct.token_id ?? currentProduct.idproduk;
    const tokenId = Number(tokenIdRaw);

    try {
      setIsBuying(true);
      if (!window.ethereum) {
        alert('MetaMask tidak ditemukan. Silakan install MetaMask terlebih dahulu.');
        return;
      }

      // Pastikan user ter-login di aplikasi sebelum melakukan pembelian
      const productId = currentProduct.idproduk || currentProduct.id || currentProduct.id_produk;
      const buyerId = auth?.user?.idUser || auth?.user?.id || null;

      if (!productId) {
        alert('❌ Gagal: ID Produk tidak ditemukan. Pastikan produk terload dengan benar.');
        console.error('Product missing idproduk:', currentProduct);
        return;
      }
      if (!buyerId) {
          alert('Silahkan login terlebih dahulu, setelah itu baru bisa melakukan pembelian.');
        return;
      }

      await requireWalletAccess();

      if (!Number.isInteger(tokenId) || tokenId <= 0) {
        alert('NFT ini belum di-mint ke blockchain. Mint dulu dari dashboard creator agar transaksi buy bisa diproses.');
        return;
      }

      const result = await buyListedToken(tokenId, currentProduct.price_crypto);
      alert(`Pembelian sukses. Tx hash: ${result.txHash}`);

      // Sinkronisasi frontend/backend lewat callback yang sama seperti di ExplorationPage
      if (typeof onProductPurchased === 'function') {
        const purchased = await onProductPurchased(currentProduct, {
          txHash: result.txHash,
          amount: currentProduct.price_crypto,
        });
        if (purchased) {
          navigateTo('dashboard', { tab: 'koleksi' });
        }
      }
    } catch (error) {
      console.error('Buy transaction failed:', error);

      const rawError = String(error?.message || error?.reason || '').toLowerCase();
      const errorCode = String(error?.code || error?.info?.error?.code || '').toLowerCase();
      const isInsufficientFunds = rawError.includes('insufficient funds') || rawError.includes('insufficient_funds') || errorCode.includes('insufficient_funds');
      const isUserRejected = rawError.includes('user rejected') || rawError.includes('user denied') || errorCode.includes('action_rejected');
      const isCallException = rawError.includes('call exception') || errorCode.includes('call_exception');

      const friendlyMsg = isInsufficientFunds
        ? `⚠️ Saldo wallet tidak cukup untuk membeli NFT ini.\n\nSilakan isi saldo ${nativeSymbol} terlebih dahulu, lalu coba lagi.`
        : isUserRejected
        ? '⚠️ Transaksi dibatalkan di MetaMask.'
        : isCallException
        ? '⚠️ Transaksi ditolak smart contract. NFT mungkin sudah tidak aktif atau sudah dibeli pengguna lain.'
        : '⚠️ Transaksi pembelian gagal. Silakan coba lagi.';

      alert(friendlyMsg);
    } finally {
      setIsBuying(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-white text-neutral-900 flex flex-col justify-between font-sans antialiased relative">
      <Header toggleSidebar={toggleSidebar} sidebarOpen={sidebarOpen} sidebarPanelOpen={sidebarPanelOpen} navigateTo={navigateTo} auth={auth} />
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} sidebarPanelOpen={sidebarPanelOpen} setSidebarPanelOpen={setSidebarPanelOpen} navigateTo={navigateTo} currentPage="explore" />

      <main className="max-w-7xl mx-auto px-4 sm:px-5 lg:px-6 w-full flex-1 my-4 sm:my-6 space-y-6">
        
        {/* TOMBOL KEMBALI */}
        <button 
          onClick={() => navigateTo('explore')} 
          className="flex items-center gap-2 text-neutral-900 hover:text-neutral-600 font-black text-xs uppercase tracking-wider transition cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4 stroke-3" /> Kembali ke Galeri Eksplorasi
        </button>

        {/* CONTAINER UTAMA: GRID SPLIT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* SISI KIRI: DISPLAY ARTWORK (Porsi 5 Kolom) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white border-4 border-neutral-950 p-2.5 sm:p-3 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative">
              <div className="border-2 border-neutral-950 aspect-4/3 sm:aspect-square overflow-hidden bg-neutral-50">
                <img 
                  src={finalImageUrl} 
                  alt={currentProduct.title} 
                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-105" 
                />
              </div>
            </div>

            {/* TAB PANEL INFORMASI TAMBAHAN */}
            <div className="border-4 border-neutral-950 bg-white">
              <div className="flex border-b-4 border-neutral-950 bg-neutral-50">
                <button 
                  onClick={() => setActiveTab('description')}
                  className={`flex-1 py-2.5 px-3 text-[11px] font-black uppercase tracking-wider transition border-r-2 border-neutral-950 last:border-r-0 cursor-pointer ${activeTab === 'description' ? 'bg-white text-neutral-900' : 'text-neutral-500 hover:text-neutral-900'}`}
                >
                  <span className="flex items-center justify-center gap-2"><FileText className="h-3.5 w-3.5" /> Deskripsi Seni</span>
                </button>
                <button 
                  onClick={() => setActiveTab('details')}
                  className={`flex-1 py-2.5 px-3 text-[11px] font-black uppercase tracking-wider transition border-r-2 border-neutral-950 last:border-r-0 cursor-pointer ${activeTab === 'details' ? 'bg-white text-neutral-900' : 'text-neutral-500 hover:text-neutral-900'}`}
                >
                  <span className="flex items-center justify-center gap-2"><Layers className="h-3.5 w-3.5" /> Spek Chain</span>
                </button>
              </div>

              <div className="p-3 text-sm leading-relaxed">
                {activeTab === 'description' ? (
                  <div className="space-y-2">
                    <p className="font-bold text-neutral-800 uppercase text-xs tracking-wider">Konsep & Filosofi Karya:</p>
                    <div className="space-y-3">
                      <p className="text-neutral-600 text-xs">
                        {currentProduct.deskripsi || 'Deskripsi tidak tersedia untuk produk ini.'}
                      </p>

                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 font-mono text-[11px]">
                    <div className="flex justify-between py-1 border-b border-neutral-100"><span className="text-neutral-400">ID Standar</span><span className="text-neutral-800 font-bold">ERC-721 Token</span></div>
                    <div className="flex justify-between py-1 border-b border-neutral-100"><span className="text-neutral-400">Jaringan Jual</span><span className="text-neutral-800 font-bold">{chainMeta.name}</span></div>
                    <div className="flex justify-between py-1 border-b border-neutral-100"><span className="text-neutral-400">Token ID</span><span className="text-neutral-800 font-bold">{tokenIdDisplay}</span></div>
                    <div className="flex justify-between py-1 border-b border-neutral-100"><span className="text-neutral-400">Owner</span><span className="text-neutral-800 font-bold">{creatorData.name}</span></div>
                    <div className="flex justify-between py-1 border-b border-neutral-100"><span className="text-neutral-400">Owner Link</span><span className="text-neutral-800 font-bold"><a href={creatorData.walletAddress ? `${explorerBaseUrl}/address/${creatorData.walletAddress}` : '#'} target="_blank" rel="noreferrer" className="underline hover:text-neutral-600">Lihat Owner</a></span></div>
                    <div className="flex justify-between py-1 border-b border-neutral-100"><span className="text-neutral-400">Contract</span><span className="text-neutral-800 font-bold">{contractAddress ? <a href={`${explorerBaseUrl}/address/${contractAddress}`} target="_blank" rel="noreferrer" className="underline hover:text-neutral-600">{shortenAddress(contractAddress)}</a> : 'Belum terhubung'}</span></div>
                    <div className="flex justify-between py-1 border-b border-neutral-100"><span className="text-neutral-400">Token Link</span><span className="text-neutral-800 font-bold">{tokenExplorerLink ? <a href={tokenExplorerLink} target="_blank" rel="noreferrer" className="underline hover:text-neutral-600">Lihat Token</a> : 'Tidak tersedia'}</span></div>
                    <div className="flex justify-between py-1 border-b border-neutral-100"><span className="text-neutral-400">Royalti Kreator</span><span className="text-neutral-800 font-bold">7.5% Per Transaksi</span></div>
                    <div className="flex justify-between py-1"><span className="text-neutral-400">Metadata IPFS</span>{metadataUrl ? <a href={metadataUrl} target="_blank" rel="noreferrer" className="text-green-600 font-bold flex items-center gap-1 hover:text-green-700">Tersimpan <ShieldCheck className="h-3 w-3 inline" /></a> : <span className="text-neutral-500 font-bold">Belum ada</span>}</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SISI KANAN: DETAIL PANEL & TRANSAKSI (Porsi 7 Kolom) */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Bagian Judul Utama & Pemilik */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="bg-neutral-950 text-white font-black text-[10px] uppercase tracking-widest px-2.5 py-1">Koleksi Terverifikasi</span>
                
                {/* GROUP TOMBOL INTERAKSI (Suka, Bagikan) */}
                <div className="flex items-center gap-1.5 ml-auto">
                  {/* Tombol Suka (Heart) */}
                  <button 
                    onClick={() => setLiked(!liked)} 
                    className={`p-1 border transition rounded cursor-pointer ${liked ? 'bg-red-50 border-red-500 text-red-500 shadow-[2px_2px_0px_0px_rgba(239,68,68,0.2)]' : 'border-neutral-300 hover:border-neutral-950 text-neutral-600'}`}
                    title={liked ? "Batal Suka" : "Sukai Karya Ini"}
                  >
                    <Heart className={`h-3 w-3 ${liked ? 'fill-red-500 text-red-500' : ''}`} />
                  </button>

                  {/* Tombol Bagikan (Share2) */}
                  <button 
                    onClick={() => alert("Tautan berhasil disalin ke papan klip!")} 
                    className="p-1 border border-neutral-300 hover:border-neutral-950 transition rounded cursor-pointer text-neutral-600"
                    title="Bagikan Aset"
                  >
                    <Share2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
              
              <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-neutral-900 leading-tight">
                {currentProduct.title}
              </h1>

              {/* Status Pemilik Aset */}
              <div className="flex flex-wrap items-center gap-2.5 text-xs font-medium pt-1">
                
                {/* ===================== PROFIL OWNER SEKARANG BISA DIKLIK ===================== */}
                <div 
                  onClick={() => navigateTo('public-profile', currentProduct.user)}
                  className="flex items-center gap-2 bg-white px-2.5 py-1.5 border-2 border-neutral-950 cursor-pointer hover:bg-neutral-50 active:translate-x-0.5 active:translate-y-0.5 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] selection:bg-transparent"
                  title={`Kunjungi Profil Publik ${creatorData.name}`}
                >
                  <div className="w-5 h-5 rounded-full bg-neutral-300 overflow-hidden shrink-0 border border-neutral-950">
                    <img src={creatorData.avatar} alt="avatar" className="w-full h-full object-cover" />
                  </div>
                  <span>Owner: <span className="font-extrabold text-neutral-900 underline decoration-2">{creatorData.name}</span></span>
                  <ShieldCheck className="h-4 w-4 text-blue-500 ml-1" />
                </div>
                {/* ============================================================================ */}

                <div onClick={() => handleCopyAddress(creatorData.walletAddress)} className="flex items-center gap-2 bg-neutral-50 px-2.5 py-1.5 border border-neutral-300 hover:border-neutral-900 cursor-pointer font-mono text-[10px] sm:text-[11px] text-neutral-600 transition">
                  <span>Owner Wallet: {shortenAddress(creatorData.walletAddress)}</span>
                  {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <ExternalLink className="h-3.5 w-3.5 text-neutral-400" />}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-3">
                  <a
                    href={creatorData.walletAddress ? `${explorerBaseUrl}/address/${creatorData.walletAddress}` : '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="block rounded border border-neutral-300 bg-white px-3 py-2 text-[11px] font-black uppercase tracking-wider text-neutral-900 hover:border-neutral-950 hover:bg-neutral-50 transition"
                  >
                    Owner Verified
                  </a>
                  <a
                    href={contractAddress ? `${explorerBaseUrl}/address/${contractAddress}` : '#'}
                    target="_blank"
                    rel="noreferrer"
                    className={`block rounded border px-3 py-2 text-[11px] font-black uppercase tracking-wider transition ${contractAddress ? 'border-neutral-300 bg-white text-neutral-900 hover:border-neutral-950 hover:bg-neutral-50' : 'border-neutral-200 bg-neutral-100 text-neutral-400 cursor-not-allowed'}`}
                  >
                    Contract Verified
                  </a>
                  <a
                    href={tokenExplorerLink ? tokenExplorerLink : '#'}
                    target="_blank"
                    rel="noreferrer"
                    className={`block rounded border px-3 py-2 text-[11px] font-black uppercase tracking-wider transition ${tokenExplorerLink ? 'border-neutral-300 bg-white text-neutral-900 hover:border-neutral-950 hover:bg-neutral-50' : 'border-neutral-200 bg-neutral-100 text-neutral-400 cursor-not-allowed'}`}
                  >
                    Token Verified
                  </a>
                </div>
              </div>
            </div>

            {/* BOX HARGA & PEMBELIAN INSTAN */}
            <div className="bg-white border-4 border-neutral-950 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase font-bold text-neutral-500 tracking-wider">Harga Beli Instan Sekarang</p>
                  <p className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-neutral-900 mt-1">{currentProduct.price_crypto} {nativeSymbol}</p>
                </div>
                <div className="bg-neutral-100 p-2.5 border-2 border-neutral-950">
                  <Wallet className="h-5 w-5 text-neutral-900" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <button 
                  onClick={handleBuyNow}
                    disabled={isBuying || !listingState?.active}
                    className={`w-full font-black text-xs uppercase tracking-widest py-3 border-2 transition shadow-[4px_4px_0px_0px_rgba(0,0,0,0.15)] ${(isBuying || !listingState?.active) ? 'bg-neutral-200 border-neutral-300 text-neutral-500 cursor-not-allowed' : 'bg-neutral-950 hover:bg-neutral-800 text-white border-neutral-950 cursor-pointer'}`}
                >
                  {isBuying ? 'Memproses...' : listingState?.active ? 'Beli Sekarang' : listingState?.status === 'unlinked' ? 'Belum Mint' : 'Belum Listed'}
                </button>
                <div className="flex items-center gap-1 text-[11px] text-neutral-500 font-medium px-2 justify-center sm:justify-start">
                  <Info className="h-3.5 w-3.5 text-neutral-400 shrink-0" /> { !auth?.user ? 'Login diperlukan untuk membeli. Tampilan listing tetap publik.' : (listingState?.active ? 'Transaksi diamankan secara kriptografis via smart contract.' : 'Buy dinonaktifkan sampai listing on-chain token ini benar-benar aktif.') }
                </div>
              </div>
            </div>

            {/* FORMULIR PENAWARAN (BIDDING MANAGEMENT) */}
            <div className="bg-neutral-50 border-4 border-neutral-950 p-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-neutral-900 flex items-center gap-2 mb-3">
                <Tag className="h-4 w-4" /> Ajukan Penawaran Baru (Place a Bid)
              </h3>
              
              <form onSubmit={handlePlaceBid} className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <input 
                    type="number" 
                    step="0.01"
                    placeholder="Masukkan jumlah nominal (Misal: 0.50)" 
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    className="w-full bg-white text-neutral-900 border-2 border-neutral-950 py-2.5 px-3.5 font-mono text-sm focus:outline-none placeholder-neutral-400"
                  />
                  <span className="absolute right-4 inset-y-0 flex items-center font-black text-xs text-neutral-500 font-mono">{nativeSymbol}</span>
                </div>
                <button 
                  type="submit"
                  className="bg-white hover:bg-neutral-100 text-neutral-950 font-black text-xs uppercase tracking-widest py-2.5 px-5 border-2 border-neutral-950 whitespace-nowrap transition cursor-pointer"
                >
                  Kirim Bid
                </button>
              </form>
            </div>

            {/* TABEL LEDGER: PROVENANCE / BLOCKCHAIN HISTORY */}
            <div className="border-4 border-neutral-950 bg-white overflow-hidden">
              <div className="bg-neutral-950 text-white px-3.5 py-2.5 flex items-center gap-2 font-black text-xs uppercase tracking-wider">
                <History className="h-4 w-4 text-neutral-400" /> Riwayat Transaksi Item (Provenance)
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-[10px] sm:text-[11px]">
                  <thead>
                    <tr className="bg-neutral-50 border-b-2 border-neutral-950 text-neutral-500 font-bold uppercase text-[10px]">
                      <th className="p-2.5">Aksi</th>
                      <th className="p-2.5">Harga</th>
                      <th className="p-2.5">Dari</th>
                      <th className="p-2.5">Ke</th>
                      <th className="p-2.5 text-right">Waktu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {provenanceRows.length === 0 ? (
                      <tr>
                        <td className="p-2.5 text-neutral-500" colSpan="5">Belum ada data provenance on-chain yang tersinkron untuk item ini.</td>
                      </tr>
                    ) : provenanceRows.map((hist, idx) => (
                      <tr key={idx} className="hover:bg-neutral-50/70 transition">
                        <td className="p-2.5 font-bold text-neutral-900">{hist.event}</td>
                        <td className="p-2.5 text-neutral-800 font-extrabold">{hist.price}</td>
                        <td className="p-2.5 text-neutral-500">{hist.from}</td>
                        <td className="p-2.5 text-neutral-500">{hist.to}</td>
                        <td className="p-2.5 text-right text-neutral-400">{hist.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>

        {/* Related products carousel */}
        {relatedProducts && relatedProducts.length > 0 && (
          <section className="max-w-7xl mx-auto px-0 w-full my-3 sm:my-4">
            <h3 className="text-lg font-black uppercase tracking-wider mb-4">Produk Lainnya</h3>
            <div className="relative">
              <button
                aria-label="Scroll left"
                onClick={() => {
                  if (!carouselRef.current) return;
                  carouselRef.current.scrollBy({ left: -400, behavior: 'smooth' });
                }}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white border-2 border-neutral-950 p-1.5 rounded shadow cursor-pointer"
              >
                ◀
              </button>

              <div ref={carouselRef} className="overflow-x-auto scrollbar-none scroll-smooth snap-x snap-mandatory space-x-3 py-1">
                <div className="flex gap-3 sm:gap-4">
                  {relatedProducts.map((p) => {
                    const img = p.image_url ? (p.image_url.startsWith('/storage/') || p.image_url.startsWith('http') ? p.image_url : `/storage/${p.image_url}`) : '/images/default-art.jpg';
                    return (
                      <div key={p.idproduk || p.id} className="min-w-48 max-w-48 sm:min-w-52 sm:max-w-52 bg-white border-2 border-neutral-950 p-2.5 snap-start rounded-lg">
                        <div onClick={() => navigateTo('product-detail', p)} className="cursor-pointer border-2 border-neutral-950 aspect-4/3 overflow-hidden bg-neutral-100">
                          <img src={img} alt={p.title || 'Karya'} className="w-full h-full object-cover" width="220" height="220" loading="lazy" />
                        </div>
                        <h4 className="font-bold text-sm mt-1.5 truncate">{p.title || 'Untitled'}</h4>
                        <div className="mt-1 flex items-center justify-between text-[11px]">
                          <span className="font-mono font-extrabold">{p.price_crypto || '0'} {nativeSymbol}</span>
                          <span className={`text-[10px] font-black px-2 py-0.5 ${p.status === 'listing' ? 'bg-emerald-400 text-neutral-900' : 'bg-amber-300 text-neutral-900'}`}>{p.status === 'listing' ? 'LISTING' : 'UNLISTED'}</span>
                        </div>
                        <div className="mt-2 flex gap-2">
                          <button onClick={() => navigateTo('product-detail', p)} className="flex-1 bg-neutral-950 text-white font-black text-[11px] uppercase py-1.5 border-2 border-neutral-950">About➤</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <button
                aria-label="Scroll right"
                onClick={() => {
                  if (!carouselRef.current) return;
                  carouselRef.current.scrollBy({ left: 400, behavior: 'smooth' });
                }}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white border-2 border-neutral-950 p-1.5 rounded shadow cursor-pointer"
              >
                ▶
              </button>
            </div>
          </section>
        )}

      </main>

      <div className="bg-white text-neutral-900 border-t border-neutral-200">
        <Footer />
      </div>
    </div>
  ); 
}