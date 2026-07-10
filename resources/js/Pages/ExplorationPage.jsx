import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown,
  Search, 
  X, 
  Image, 
  Music, 
  Gamepad2, 
  Camera, 
  ExternalLink, 
  Wallet, 
  Tag, 
  ShieldCheck,
  Heart,
  Bookmark,
  Share2,
  Volume2,
  CalendarDays
} from 'lucide-react';
import Footer from '../Components/Footer';
import { buyListedToken, getConfiguredChainMetadata, getExplorerBaseUrl, getEthereumProvider, getListingState, getNativeCurrencySymbol, requireWalletAccess, shortenAddress } from '../Utils/artVibesMarket';

// Menerima props 'products' sesuai kiriman data dari backend
export default function ExplorationPage({ products = [], isLoading = false, productsError = '', auth = null, onSelectProduct, onProductPurchased, navigateTo }) {
  const chainMeta = getConfiguredChainMetadata();
  const explorerBaseUrl = getExplorerBaseUrl();
  const nativeSymbol = getNativeCurrencySymbol();
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarPanelOpen, setSidebarPanelOpen] = useState(false);
  
  const [selectedNft, setSelectedNft] = useState(null);
  const [likedProducts, setLikedProducts] = useState([]); // Store liked product IDs from database
  const [pinnedProducts, setPinnedProducts] = useState([]); // Store pinned product IDs from database
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeImageSubCategory, setActiveImageSubCategory] = useState('row-image');
  const [loadingLikes, setLoadingLikes] = useState(false);
  const [loadingPins, setLoadingPins] = useState(false);
  const [voiceSettingsOpen, setVoiceSettingsOpen] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [autoPlayVoice, setAutoPlayVoice] = useState(false);
  const [listingStateByProduct, setListingStateByProduct] = useState({});
  const [selectedYear, setSelectedYear] = useState('all');
  const [visibleProductCount, setVisibleProductCount] = useState(25);
  const [yearFilterOpen, setYearFilterOpen] = useState(false);
  const autoRowFrameRef = useRef(null);
  const autoRowLastTimeRef = useRef(0);

  const isLoggedIn = auth && auth.user;
  const rowRefs = useRef({});
  const yearFilterRef = useRef(null);
  const productsSectionRef = useRef(null);

  const getProductTokenId = (product) => {
    const tokenIdRaw = product?.nft?.token_id ?? product?.token_id;
    const tokenId = Number(tokenIdRaw);
    return Number.isInteger(tokenId) && tokenId > 0 ? tokenId : null;
  };

  const getBuyStateLabel = (product) => {
    const listingState = listingStateByProduct[product.idproduk];
    if (!listingState) return 'Cek Listing...';
    if (listingState.active) return 'Go buy';
    if (listingState.status === 'unlinked') return 'Belum Mint';
    if (listingState.status === 'inactive') return 'Belum Listed';
    return 'Tidak Tersedia';
  };

  // Fetch liked products from database when component mounts and user is logged in
  useEffect(() => {
    if (isLoggedIn) {
      fetchLikedProducts();
      fetchPinnedProducts();
    }
  }, [isLoggedIn]);

  const fetchPinnedProducts = async () => {
    if (!isLoggedIn) return;
    try {
      setLoadingPins(true);
      const userId = auth.user?.idUser || auth.user?.id;
      const response = await fetch(`/api/pins/user/${userId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        credentials: 'include',
      });
      if (!response.ok) {
        setPinnedProducts([]);
        return;
      }
      const data = await response.json();
      const pinnedIds = (Array.isArray(data) ? data : [])
        .map((pin) => pin.produk_idproduk || pin.id_produk || pin.produk?.idproduk || pin.produk?.id)
        .filter(Boolean);
      setPinnedProducts(pinnedIds);
    } catch (err) {
      console.error('Error fetching pinned products:', err);
      setPinnedProducts([]);
    } finally {
      setLoadingPins(false);
    }
  };

  const togglePin = async (e, productId) => {
    e.stopPropagation();
    if (!isLoggedIn) {
      alert('Silakan login terlebih dahulu untuk menyematkan produk');
      return;
    }

    try {
      const userId = auth.user?.idUser || auth.user?.id;
      const isPinned = pinnedProducts.includes(productId);
      if (isPinned) {
        const response = await fetch(`/api/pins/${userId}/${productId}`, {
          method: 'DELETE',
          headers: {
            'Accept': 'application/json',
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
          },
          credentials: 'include',
        });
        if (response.ok) {
          setPinnedProducts((prev) => prev.filter((id) => id !== productId));
        }
      } else {
        const response = await fetch('/api/pins', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
          },
          credentials: 'include',
          body: JSON.stringify({
            id_produk: productId,
            user_idUser: userId,
          }),
        });
        if (response.ok) {
          setPinnedProducts((prev) => [...new Set([...prev, productId])]);
        }
      }
    } catch (err) {
      console.error('Error toggling pin:', err);
      alert('Error menyimpan sematan ke database');
    }
  };

  useEffect(() => {
    let cancelled = false;

    const loadListingStates = async () => {
      const nextState = {};

      for (const product of products) {
        const tokenId = getProductTokenId(product);
        if (!tokenId) {
          nextState[product.idproduk] = { status: 'unlinked', active: false };
          continue;
        }

        try {
          const listing = await getListingState(tokenId);
          nextState[product.idproduk] = {
            status: listing.active ? 'active' : 'inactive',
            active: Boolean(listing.active),
            seller: listing.seller,
            priceWei: listing.priceWei?.toString?.() ?? String(listing.priceWei ?? ''),
          };
        } catch (error) {
          nextState[product.idproduk] = {
            status: 'inactive',
            active: false,
            error: error?.message || 'Gagal membaca listing on-chain',
          };
        }
      }

      if (!cancelled) {
        setListingStateByProduct(nextState);
      }
    };

    loadListingStates();

    return () => {
      cancelled = true;
    };
  }, [products]);

  const fetchLikedProducts = async () => {
    if (!isLoggedIn) return;
    try {
      setLoadingLikes(true);
      const userId = auth.user?.idUser || auth.user?.id;
      const response = await fetch(`/api/likes/user/${userId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        // Extract just the product IDs
        const likedIds = data.map(like => like.id_produk);
        setLikedProducts(likedIds);
      }
    } catch (err) {
      console.error('Error fetching liked products:', err);
    } finally {
      setLoadingLikes(false);
    }
  };

  const toggleSidebar = () => {
    if (window.innerWidth >= 1024) {
      setSidebarPanelOpen((prev) => !prev);
    } else {
      setSidebarOpen((prev) => !prev);
    }
  };

  const scrollRow = (rowId, direction) => {
    const row = rowRefs.current[rowId] || document.getElementById(rowId);
    if (row) {
      const scrollAmount = 340;
      row.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const setRowRef = (rowId) => (element) => {
    if (element) {
      rowRefs.current[rowId] = element;
    }
  };

  const scrollToProductsSection = () => {
    if (!productsSectionRef.current) return;
    productsSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleLoadMoreAndScroll = () => {
    setVisibleProductCount((prev) => {
      const remaining = yearFilteredProducts.length - prev;
      if (remaining <= 0) return prev;

      const baseBump = 25;
      const remainderAfterBase = remaining - baseBump;
      // Hindari kondisi sisa terlalu kecil (misalnya sisa 1) pada klik berikutnya.
      const bump = remainderAfterBase > 0 && remainderAfterBase < 8 ? remaining : baseBump;

      return prev + bump;
    });
  };

  const extractProductYear = (item) => {
    const rawDate = item?.created_at || item?.tanggal_upload || item?.tanggal || item?.minted_at || item?.updated_at;
    if (rawDate) {
      const dateObj = new Date(rawDate);
      if (!Number.isNaN(dateObj.getTime())) {
        return dateObj.getFullYear();
      }
    }
    return new Date().getFullYear();
  };

  const toggleLike = async (e, productId) => {
    e.stopPropagation();
    if (!isLoggedIn) {
      alert('Silakan login terlebih dahulu untuk menyukai produk');
      return;
    }
    
    try {
      const userId = auth.user?.idUser || auth.user?.id;
      const isLiked = likedProducts.includes(productId);
      
      if (isLiked) {
        // Unlike - DELETE from database
        const response = await fetch(`/api/likes/${userId}/${productId}`, {
          method: 'DELETE',
          headers: {
            'Accept': 'application/json',
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
          },
          credentials: 'include',
        });
        if (response.ok) {
          setLikedProducts(prev => prev.filter(id => id !== productId));
        }
      } else {
        // Like - POST to database
        const response = await fetch('/api/likes', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
          },
          credentials: 'include',
          body: JSON.stringify({
            id_produk: productId,
            user_idUser: userId,
          }),
        });
        if (response.ok) {
          setLikedProducts(prev => [...prev, productId]);
        }
      }
    } catch (err) {
      console.error('Error toggling like:', err);
      alert('Error menyimpan like ke database');
    }
  };

  const getIndonesianVoice = () => {
    const voices = window.speechSynthesis.getVoices() || [];
    // Prefer voices with explicit id locale
    let v = voices.find(v => v.lang && v.lang.toLowerCase().startsWith('id'));
    if (v) return v;
    // Try matching by name containing 'indonesia' or 'indonesian'
    v = voices.find(v => /indonesia|indonesian/i.test(v.name));
    if (v) return v;
    return voices[0] || null;
  };

  const playTextVoice = (text) => {
    if (!text) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('Speech synthesis tidak didukung di browser ini.');
      return;
    }

    const speak = () => {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'id-ID';
      const voice = getIndonesianVoice();
      if (voice) utterance.voice = voice;
      utterance.rate = 1;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
    };

    // Some browsers populate voices asynchronously
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) {
      const handler = () => {
        speak();
        window.speechSynthesis.onvoiceschanged = null;
      };
      window.speechSynthesis.onvoiceschanged = handler;
    } else {
      speak();
    }
  };

  const openQuickView = async (item) => {
    setSelectedNft(item);
    setAutoPlayVoice(false);

    let detal = item;
    if (!item.voice_script) {
      try {
        const response = await fetch(`/api/produk/${item.idproduk}`);
        if (response.ok) {
          detal = await response.json();
          setSelectedNft(detal);
        } else {
          console.warn('Gagal mengambil detail produk:', response.status);
        }
      } catch (err) {
        console.error('Error fetching product detail:', err);
      }
    }

    if (voiceEnabled && detal?.voice_script) {
      setAutoPlayVoice(true);
    }
  };

  useEffect(() => {
    if (autoPlayVoice && selectedNft?.voice_script) {
      playTextVoice(selectedNft.voice_script);
      setAutoPlayVoice(false);
    }
  }, [autoPlayVoice, selectedNft]);

  const handleShareNft = (e, title) => {
    e.stopPropagation();
    navigator.clipboard.writeText(window.location.href);
    alert(`Tautan bagikan untuk "${title}" berhasil disalin ke papan klip!`);
  };

  // Filter pencarian dan kategori berdasarkan array 'products' dari database
  let filteredProducts = products.filter((item) => {
    const title = item.title ? item.title.toLowerCase() : '';
    const matchesSearch = title.includes(searchQuery.toLowerCase());
    
    // Filter berdasarkan kategori
    if (activeCategory === 'all') {
      return matchesSearch;
    } else if (activeCategory === 'liked') {
      // Show products that are liked
      return matchesSearch && likedProducts.includes(item.idproduk);
    } else {
      // Filter by category dari database (row-audio, row-photography, etc.)
      // Mapping kategori: musik -> row-audio, fotografi -> row-photography, etc.
      const categoryMap = {
        'row-trending': [''],
        'row-audio': ['Musik & Suara', 'musik', 'audio'],
        'row-image': ['Image', 'image', 'gift', 'art', 'gift art', 'gambar'],
        'row-design': ['Design', 'design', 'desain', 'desain grafis', 'design grafis'],
        'row-art-vertical': ['Art Vertical', 'art vertical', 'vertical art', 'vertical', 'vertikal'],
        'row-gaming': ['Item Game', 'game', 'gaming'],
        'row-photography': ['Fotografi', 'fotografi', 'photograph'],
      };
      
      const effectiveCategory = activeCategory === 'row-image' ? activeImageSubCategory : activeCategory;
      const allowedCategories = categoryMap[effectiveCategory] || [];
      const itemCategory = item.kategori?.name?.toLowerCase() || item.kategori || '';
      
      return matchesSearch && allowedCategories.some(cat => 
        cat === '' || itemCategory.includes(cat.toLowerCase())
      );
    }
  });

  const availableYears = Array.from(new Set(filteredProducts.map((item) => extractProductYear(item))))
    .sort((a, b) => b - a)
    .map((year) => String(year));

  const yearFilteredProducts = selectedYear === 'all'
    ? filteredProducts
    : filteredProducts.filter((item) => String(extractProductYear(item)) === selectedYear);

  const visibleProducts = yearFilteredProducts.slice(0, visibleProductCount);
  const canLoadMore = visibleProducts.length < yearFilteredProducts.length;

  const categories = [
    { id: 'all', label: '✨ Semua Karya', icon: Image },
    { id: 'liked', label: '❤️ Disukai', icon: Heart },
    { id: 'row-trending', label: '🔥 Populer', icon: Image },
    { id: 'row-audio', label: '🎵 Musik & Suara', icon: Music },
    { id: 'row-image', label: '🖼️ Image', icon: Image },
    { id: 'row-gaming', label: '🎮 Item Game', icon: Gamepad2 },
    { id: 'row-photography', label: '📸 Fotografi', icon: Camera },
  ];
  
  const imageSubCategories = [
    { id: 'row-image', label: '🖼️ Semua Image' },
    { id: 'row-design', label: '🎨 Design' },
    { id: 'row-art-vertical', label: '🧱 Art Vertical' },
  ];

  const allRows = [
    { id: 'row-new', title: '⚡ Baru Dirilis', desc: 'Karya seni digital terhangat yang baru saja dicetak' },
    { id: 'row-trending', title: '🔥 Karya Paling Populer', desc: 'Karya seni digital yang paling banyak dicari minggu ini' },
    { id: 'row-recom', title: '✨ Rekomendasi Kreatif', desc: 'Disesuaikan berdasarkan gaya seni pilihanmu' },
    { id: 'row-audio', title: '🎵 Musik & Audio NFT', desc: 'Koleksi aset suara dan musik blockchain eksklusif' },
    { id: 'row-image', title: '🖼️ Image & Gift', desc: 'Koleksi gift, art, dan karya gambar visual kreatif' },
    { id: 'row-gaming', title: '🎮 Item Game & Metaverse', desc: 'Aset digital, tanah virtual, dan skin game langka' },
    { id: 'row-photography', title: '📸 Fotografi Digital', desc: 'Karya potret dan lensa terbaik dari fotografer dunia' },
  ];

  const baseRows = isLoggedIn ? allRows : allRows.slice(0, 5);
  const isSpecialFilter = activeCategory === 'liked';
  const useYearRows = !isSpecialFilter && activeCategory === 'all';

  const yearRows = selectedYear === 'all'
    ? availableYears.map((year) => ({
        id: `year-${year}`,
        title: `🗓️ Karya Tahun ${year}`,
        desc: `Koleksi rilisan tahun ${year} dengan gaya visual yang terus berkembang.`,
        year,
      }))
    : [{
        id: `year-${selectedYear}`,
        title: `🗓️ Karya Tahun ${selectedYear}`,
        desc: `Semua karya yang terbit pada tahun ${selectedYear}.`,
        year: selectedYear,
      }];
  
  const effectiveDisplayCategory = activeCategory === 'row-image' ? activeImageSubCategory : activeCategory;
  const rowToDisplay = activeCategory === 'row-image' ? 'row-image' : effectiveDisplayCategory;
  const displayRows = useYearRows
    ? yearRows
    : (isSpecialFilter 
    ? [{ id: activeCategory, title: '❤️ Koleksi Seni Yang Kamu Sukai', desc: 'Kumpulan kurasi pribadi aset digital pilihanmu.' }]
    : (rowToDisplay === 'all' ? baseRows : baseRows.filter(row => row.id === rowToDisplay)));

  const rowsToRender = useYearRows
    ? displayRows.filter((row) => visibleProducts.some((item) => String(extractProductYear(item)) === String(row.year)))
    : displayRows;

  useEffect(() => {
    setVisibleProductCount(25);
  }, [searchQuery, activeCategory, activeImageSubCategory, selectedYear, products.length]);

  useEffect(() => {
    if (autoRowFrameRef.current) {
      window.cancelAnimationFrame(autoRowFrameRef.current);
      autoRowFrameRef.current = null;
    }
    autoRowLastTimeRef.current = 0;

    const animateRows = (timestamp) => {
      if (!autoRowLastTimeRef.current) autoRowLastTimeRef.current = timestamp;
      const deltaMs = Math.min(timestamp - autoRowLastTimeRef.current, 34);
      autoRowLastTimeRef.current = timestamp;

      const rows = document.querySelectorAll('[data-auto-row="true"]');
      if (!rows.length) {
        autoRowFrameRef.current = window.requestAnimationFrame(animateRows);
        return;
      }

      const speedPxPerSecond = 20;
      const step = (speedPxPerSecond * deltaMs) / 1000;

      rows.forEach((row) => {
        if (!(row instanceof HTMLElement)) return;
        if (row.matches(':hover')) return;

        const maxScroll = row.scrollWidth - row.clientWidth;
        if (maxScroll <= 0) return;

        const rowIndex = Number(row.dataset.autoIndex || 0);
        const isForward = rowIndex % 2 === 0;

        if (isForward) {
          const next = row.scrollLeft + step;
          if (next >= maxScroll - 1) {
            row.scrollLeft = 0;
          } else {
            row.scrollLeft = next;
          }
        } else {
          const next = row.scrollLeft - step;
          if (next <= 1) {
            row.scrollLeft = maxScroll;
          } else {
            row.scrollLeft = next;
          }
        }
      });

      autoRowFrameRef.current = window.requestAnimationFrame(animateRows);
    };

    autoRowFrameRef.current = window.requestAnimationFrame(animateRows);

    return () => {
      if (autoRowFrameRef.current) {
        window.cancelAnimationFrame(autoRowFrameRef.current);
        autoRowFrameRef.current = null;
      }
      autoRowLastTimeRef.current = 0;
    };
  }, [activeCategory, selectedYear, visibleProducts.length, isSpecialFilter]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!yearFilterOpen) return;
      if (yearFilterRef.current && !yearFilterRef.current.contains(event.target)) {
        setYearFilterOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [yearFilterOpen]);

  const handleBuyNft = async (nft) => {
    console.log('📦 === PRODUK DIPILIH ===');
    console.log('Struktur nft:', JSON.stringify(nft, null, 2));

    const tokenIdRaw = nft.nft?.token_id ?? nft.token_id;
    const tokenId = Number(tokenIdRaw);
    const priceRaw = nft.price_crypto ?? nft.price ?? nft.nft?.price;
    const productId = nft.idproduk || nft.id || nft.id_produk;
    const buyerId = auth?.user?.idUser || auth?.user?.id || null;

    console.log(`🔍 Data yang di-extract:`);
    console.log(`   - Token ID Raw: ${tokenIdRaw}`);
    console.log(`   - Token ID Number: ${tokenId}`);
    console.log(`   - Price: ${priceRaw}`);
    console.log(`   - Product ID: ${productId}`);
    console.log(`   - Buyer ID: ${buyerId}`);

    if (!buyerId) {
      alert('Silahkan login terlebih dahulu, setelah itu baru bisa melakukan pembelian.');
      return;
    }

    if (!productId) {
      alert('❌ Gagal: ID Produk tidak ditemukan di data frontend. Cek log console.');
      console.error('Data NFT tidak memiliki idproduk:', nft);
      return;
    }

    const provider = getEthereumProvider();
    if (!provider) {
      alert('Wallet belum terhubung. Silakan gunakan tombol Connect Wallet terlebih dahulu.');
      return;
    }

    if (!Number.isInteger(tokenId) || tokenId <= 0) {
      alert('NFT ini belum di-mint ke blockchain. Mint dulu dari dashboard creator agar transaksi buy bisa diproses.');
      return;
    }

    try {
      await requireWalletAccess();
      console.log('🔄 === MEMULAI PROSES PEMBELIAN DI BLOCKCHAIN ===');
      const result = await buyListedToken(tokenId, priceRaw);

      console.log('🔄 === BLOCKCHAIN SUKSES ===');
      if (typeof onProductPurchased === 'function') {
        await onProductPurchased({ ...nft, idproduk: productId }, {
          txHash: result.txHash,
          amount: priceRaw,
        });
      } else {
        const response = await fetch('/api/transaksi/purchase', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
          },
          body: JSON.stringify({
            produk_id: productId,
            buyer_id: buyerId,
            tx_hash: result.txHash,
            amount: priceRaw,
          }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.message || 'Sinkronisasi pembelian ke database lokal gagal.');
        }
      }

      console.log('✅ === SEMUA SINKRONISASI SELESAI ===');
      alert(`✅ Pembelian Sukses!\n\nDatabase otomatis diperbarui.\nNFT telah berpindah ke Dashboard Koleksi Anda.`);
      navigateTo('dashboard', { tab: 'koleksi' });
    } catch (error) {
      console.error('❌ === BUY FAILED ===');
      console.error('Error object:', error);

      const rawError = String(error?.message || error?.reason || '').toLowerCase();
      const errorCode = String(error?.code || error?.info?.error?.code || '').toLowerCase();
      const isInsufficientFunds = rawError.includes('insufficient funds') || rawError.includes('insufficient_funds') || errorCode.includes('insufficient_funds');
      const isUserRejected = rawError.includes('user rejected') || rawError.includes('user denied') || errorCode.includes('action_rejected');
      const isCallException = rawError.includes('call exception') || errorCode.includes('call_exception');

      const friendlyMsg = isInsufficientFunds
        ? `⚠️ Saldo wallet tidak cukup untuk membeli NFT ini.\n\nSilakan isi saldo ${nativeSymbol} terlebih dahulu, lalu coba lagi.`
        : isUserRejected
        ? `⚠️ Transaksi dibatalkan di MetaMask.`
        : isCallException
        ? `⚠️ Transaksi ditolak smart contract.\n\nNFT mungkin sudah dibeli orang lain atau status listing tidak aktif.`
        : `⚠️ Pembelian belum berhasil. Silakan coba lagi dalam beberapa saat.`;

      alert(friendlyMsg);
    }
};

  return (
    <div className="w-full min-h-screen bg-white text-neutral-900 flex flex-col justify-between font-sans antialiased relative">
      <main className="max-w-7xl mx-auto px-4 sm:px-5 lg:px-6 w-full flex-1 space-y-7 my-4 sm:my-6">
        
        {/* AREA ATAS: Navigasi Premium & Search Bar */}
        <div className="flex flex-col gap-4 border-b border-neutral-200 pb-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            
            <a 
              href="/"
              className="text-neutral-900 hover:text-neutral-600 cursor-pointer text-xs sm:text-sm font-bold tracking-wide uppercase transition self-start md:self-auto no-underline"
            >
              ← Kembali ke Beranda Utama
            </a>

            <div className="w-full md:w-auto md:ml-auto flex flex-col sm:flex-row sm:items-center gap-2">
              {/* SEARCH BAR */}
              <div className="relative w-full sm:w-85 lg:w-105">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-400">
                  <Search className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  placeholder="Cari maha karya digital..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    scrollToProductsSection();
                  }}
                  className="w-full pl-10 pr-9 py-2.5 bg-neutral-50 text-neutral-900 placeholder-neutral-500 border border-neutral-300 rounded-xl focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition text-sm"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-neutral-400 hover:text-neutral-900 cursor-pointer border-none bg-transparent"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* YEAR FILTER: SINGLE DROPDOWN BUTTON */}
              <div className="relative" ref={yearFilterRef}>
                <button
                  type="button"
                  onClick={() => setYearFilterOpen((prev) => !prev)}
                  className={`inline-flex items-center justify-between h-10 min-w-40 px-3 border-2 rounded-xl text-xs font-bold uppercase tracking-wider transition ${yearFilterOpen ? 'bg-neutral-950 text-white border-neutral-950' : 'bg-white text-neutral-900 border-neutral-300 hover:border-neutral-900'}`}
                >
                  <span className="inline-flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" />
                    {selectedYear === 'all' ? 'Semua Tahun' : selectedYear}
                  </span>
                  <ChevronDown className={`h-3.5 w-3.5 transition ${yearFilterOpen ? 'rotate-180' : ''}`} />
                </button>
                {yearFilterOpen && (
                  <div className="absolute right-0 mt-2 w-44 bg-white border-2 border-neutral-950 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] rounded-lg z-30 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedYear('all');
                        setYearFilterOpen(false);
                        scrollToProductsSection();
                      }}
                      className={`w-full text-left px-3 py-2 text-[11px] font-black uppercase tracking-wider transition ${selectedYear === 'all' ? 'bg-neutral-950 text-white' : 'text-neutral-800 hover:bg-neutral-50'}`}
                    >
                      Semua Tahun
                    </button>
                    {availableYears.map((year) => (
                      <button
                        key={year}
                        type="button"
                        onClick={() => {
                          setSelectedYear(year);
                          setYearFilterOpen(false);
                          scrollToProductsSection();
                        }}
                        className={`w-full text-left px-3 py-2 text-[11px] font-black uppercase tracking-wider border-t border-neutral-200 transition ${selectedYear === year ? 'bg-emerald-700 text-white border-emerald-700' : 'text-neutral-800 hover:bg-neutral-50'}`}
                      >
                        {year}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* VOICE ON/OFF TOGGLE */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setVoiceSettingsOpen((prev) => !prev)}
                  className={`inline-flex items-center justify-between h-10 min-w-28 px-3.5 border-2 rounded-xl text-sm transition ${voiceSettingsOpen ? 'bg-neutral-950 text-white border-neutral-950' : 'bg-white text-neutral-900 border-neutral-300 hover:border-neutral-900'}`}
                >
                  <span className="inline-flex items-center gap-2">
                    <Volume2 className="h-4 w-4" />
                    Voice {voiceEnabled ? 'On' : 'Off'}
                  </span>
                  <ChevronDown className={`h-3.5 w-3.5 transition ${voiceSettingsOpen ? 'rotate-180' : ''}`} />
                </button>
                {voiceSettingsOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-neutral-200 shadow-lg rounded-xl z-20">
                    <div className="p-3 text-xs uppercase tracking-widest text-neutral-500 border-b border-neutral-200">Voice Settings</div>
                    <button
                      type="button"
                      onClick={() => setVoiceEnabled(true)}
                      className={`w-full text-left px-4 py-3 text-sm ${voiceEnabled ? 'bg-neutral-950 text-white' : 'text-neutral-800 hover:bg-neutral-50'}`}
                    >
                      On
                    </button>
                    <button
                      type="button"
                      onClick={() => setVoiceEnabled(false)}
                      className={`w-full text-left px-4 py-3 text-sm ${!voiceEnabled ? 'bg-neutral-950 text-white' : 'text-neutral-800 hover:bg-neutral-50'}`}
                    >
                      Off
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* BARIS SELEKSI KATEGORI */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
            {categories.map((cat) => {
              const IconComponent = cat.icon;
              const isSelected = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveCategory(cat.id);
                    scrollToProductsSection();
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wide uppercase transition duration-200 whitespace-nowrap border cursor-pointer ${
                    isSelected
                      ? 'bg-neutral-950 border-neutral-950 text-white shadow-md'
                      : 'bg-neutral-50 border-neutral-200 text-neutral-600 hover:border-neutral-400 hover:text-neutral-900'
                  }`}
                >
                  <IconComponent className={`h-3 w-3 ${isSelected ? 'text-white' : 'text-neutral-400'}`} />
                  {cat.label}
                </button>
              );
            })}
          </div>

          <div className="mt-2 flex items-center justify-between gap-3 border border-neutral-200 rounded-xl px-3 py-2 bg-neutral-50">
            <p className="text-[12px] text-neutral-600">
              Menampilkan <span className="font-black text-neutral-900">{visibleProducts.length}</span> dari <span className="font-black text-neutral-900">{yearFilteredProducts.length}</span> produk
            </p>
            {canLoadMore && (
              <button
                type="button"
                onClick={handleLoadMoreAndScroll}
                className="bg-neutral-950 hover:bg-neutral-800 text-white text-[11px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg border-2 border-neutral-950 transition cursor-pointer"
              >
                Tampilkan Lebih Banyak
              </button>
            )}
          </div>
          {activeCategory === 'row-image' && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1 mt-1">
              {imageSubCategories.map((subCat) => {
                const isSelected = activeImageSubCategory === subCat.id;
                return (
                  <button
                    key={subCat.id}
                    onClick={() => setActiveImageSubCategory(subCat.id)}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wide uppercase transition duration-200 whitespace-nowrap border cursor-pointer ${
                      isSelected
                        ? 'bg-neutral-950 border-neutral-950 text-white shadow-md'
                        : 'bg-neutral-50 border-neutral-200 text-neutral-600 hover:border-neutral-400 hover:text-neutral-900'
                    }`}
                  >
                    {subCat.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div ref={productsSectionRef} className="h-0" />

        {/* KONDISI LOADING / ERROR / KOSONG */}
        {isLoading ? (
          <div className="text-center py-14 bg-neutral-50 border border-dashed border-neutral-300 rounded-2xl">
            <Search className="h-12 w-12 text-neutral-300 mx-auto mb-4 animate-pulse" />
            <p className="text-lg text-neutral-800 font-semibold">Memuat produk...</p>
            <p className="text-sm text-neutral-500 mt-1">Tunggu sebentar atau refresh halaman.</p>
          </div>
        ) : productsError ? (
          <div className="text-center py-14 bg-red-50 border border-red-200 rounded-2xl">
            <p className="text-lg text-red-700 font-semibold">Terjadi kesalahan saat memuat data.</p>
            <p className="text-sm text-red-500 mt-1">{productsError}</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-14 bg-neutral-50 border border-dashed border-neutral-300 rounded-2xl">
            <Search className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
            <p className="text-lg text-neutral-800 font-semibold">Karya seni tidak ditemukan</p>
            <p className="text-sm text-neutral-500 mt-1">Coba kata kunci lain untuk "{searchQuery}"</p>
          </div>
        ) : (
          <>
            {rowsToRender.map((row, rowIndex) => {
              // Distribusi produk ke setiap row agar tidak ada duplikat saat kategori 'all'
              let rowItems = visibleProducts;

              if (useYearRows && row.year) {
                rowItems = visibleProducts.filter((item) => String(extractProductYear(item)) === String(row.year));
              }
              
              if (!useYearRows && activeCategory === 'all' && displayRows.length > 1) {
                // Hitung berapa produk per row
                const productsPerRow = Math.ceil(visibleProducts.length / displayRows.length);
                const startIdx = rowIndex * productsPerRow;
                rowItems = visibleProducts.slice(startIdx, startIdx + productsPerRow);
              }
              
              // Untuk row dengan index ganjil, balik urutan untuk variasi visual
              if (rowIndex % 2 === 1) {
                rowItems = [...rowItems].reverse();
              }
              
              if (isSpecialFilter) {
                const targetList = likedProducts;
                const tempItems = [];
                
                filteredProducts.forEach((art, idx) => {
                  // For liked, check if product ID is in likedProducts
                  if (targetList.includes(art.idproduk)) {
                    tempItems.push({
                      ...art,
                      uniqueId: `${row.id}-${art.idproduk}`,
                      computedPrice: `${art.price_crypto || 0} ${nativeSymbol}`,
                      titleText: art.title || `Digital Art ${idx + 1}`,
                      rowId: row.id,
                      index: idx
                    });
                  }
                });
                
                rowItems = tempItems.filter((v, i, a) => a.findIndex(t => t.uniqueId === v.uniqueId) === i);
                
                if (rowItems.length === 0) {
                  return (
                    <div key={row.id} className="text-center py-12 bg-neutral-50 border border-neutral-200 rounded-xl">
                      <p className="text-sm font-bold text-neutral-500 uppercase tracking-wider">Belum Ada Item Di Sini</p>
                      <p className="text-xs text-neutral-400 mt-1">Gunakan ikon hati di bawah kartu produk untuk menambahkan.</p>
                    </div>
                  );
                }
              }

              return (
                <div key={row.id} className="relative pb-5 border-b border-neutral-200 last:border-none">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h2 className="text-lg sm:text-xl font-black tracking-tight text-neutral-900 uppercase">{row.title}</h2>
                      <p className="text-[11px] text-neutral-500 italic mt-0.5">{row.desc}</p>
                    </div>
                    {!isSpecialFilter && !useYearRows && (
                      <div className="flex gap-2">
                        <button onClick={() => scrollRow(row.id, 'left')} className="p-1.5 rounded-lg border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-800 transition shadow-sm cursor-pointer">
                          <ChevronLeft className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => scrollRow(row.id, 'right')} className="p-1.5 rounded-lg border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-800 transition shadow-sm cursor-pointer">
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {(() => {
                    const stripSize = 8;
                    const segmentIndexes = useYearRows
                      ? Array.from({ length: Math.ceil(rowItems.length / stripSize) }, (_, i) => i)
                      : [0];

                    return segmentIndexes.map((segmentIndex) => {
                      const segmentId = useYearRows ? `${row.id}-strip-${segmentIndex}` : row.id;
                      const segmentItems = useYearRows
                        ? rowItems.slice(segmentIndex * stripSize, segmentIndex * stripSize + stripSize)
                        : rowItems;

                      return (
                        <div key={segmentId} className={useYearRows ? 'mb-4 last:mb-0' : ''}>
                          {useYearRows && (
                            <div className="mb-2 flex justify-end gap-2">
                              <button onClick={() => scrollRow(segmentId, 'left')} className="p-1.5 rounded-lg border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-800 transition shadow-sm cursor-pointer">
                                <ChevronLeft className="h-3.5 w-3.5" />
                              </button>
                              <button onClick={() => scrollRow(segmentId, 'right')} className="p-1.5 rounded-lg border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-800 transition shadow-sm cursor-pointer">
                                <ChevronRight className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}

                          <div
                            id={segmentId}
                            ref={setRowRef(segmentId)}
                            data-auto-row={!isSpecialFilter ? 'true' : 'false'}
                            data-auto-index={rowIndex * 100 + segmentIndex}
                            className={`flex w-full gap-3 sm:gap-4 pb-3 pt-1 ${isSpecialFilter ? 'flex-wrap' : 'overflow-x-auto scrollbar-none'}`}
                            style={!isSpecialFilter ? { scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' } : {}}
                          >
                            {segmentItems.map((item, idx) => {
                      const itemRowId = item.rowId || row.id;
                      const itemIndex = item.index !== undefined ? item.index : idx;
                      
                      const uniqueId = item.uniqueId || `${itemRowId}-${item.idproduk}`;
                      const computedPrice = item.computedPrice || `${item.price_crypto || 0} ${nativeSymbol}`;
                      const titleText = item.titleText || item.title || `Digital Art ${itemIndex + 1}`;
                      
                      // Format image URL dengan /storage/ prefix
                      let finalImageUrl = '/images/default-art.jpg';
                      if (item.image_url && item.image_url !== 'default.jpg') {
                        finalImageUrl = item.image_url.startsWith('/storage/') 
                          ? item.image_url 
                          : `/storage/${item.image_url}`;
                      }

                      const isLiked = likedProducts.includes(item.idproduk);
                      const listingState = listingStateByProduct[item.idproduk];
                      const buyDisabled = !listingState || !listingState.active;

                      return (
                        <div 
                          key={`${uniqueId}-${segmentId}-${idx}`} 
                          className="min-w-55 max-w-55 sm:min-w-59 sm:max-w-59 bg-white border-2 border-neutral-950 p-2.5 sm:p-3 snap-start hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition duration-300 transform shadow-md relative group flex flex-col justify-between rounded-lg"
                        >
                          {/* KLIK KARTU UNTUK MEMBUKA MODAL QUICK VIEW */}
                          <div 
                            onClick={() => openQuickView(item)}
                            className="overflow-hidden bg-neutral-100 border border-neutral-200 aspect-4/3 relative cursor-pointer"
                          >
                            <img 
                              src={finalImageUrl} 
                              alt={titleText} 
                              className="w-full h-full object-cover transition duration-500 group-hover:scale-105" 
                            />
                            <div className="absolute inset-0 bg-neutral-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                              <span className="bg-white border-2 border-neutral-950 font-black text-[10px] px-2.5 py-1 uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                Detail Singkat
                              </span>
                            </div>
                          </div>
                          
                          <div className="mt-3 border-t border-neutral-200 pt-2.5 flex flex-col justify-between flex-1">
                            <div>
                              <h3 className="font-bold text-neutral-900 text-sm truncate tracking-wide">
                                {titleText}
                              </h3>
                              <div className="mt-1 flex items-center justify-between text-[11px] mb-2.5">
                                <span className="text-neutral-500 font-medium">Value</span>
                                <span className="text-neutral-900 font-extrabold font-mono tracking-tight">{computedPrice}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 border-t border-neutral-100 pt-2 w-full mb-1.5">
                              <div className="text-[11px] text-neutral-600 flex-1 truncate">
                                <span className="text-neutral-500">By: </span>
                                <span className="font-bold text-neutral-900">{item.user?.name || 'Anonymous'}</span>
                              </div>
                              <span className={`text-[10px] font-black uppercase tracking-wide ${listingState?.active ? 'text-emerald-700' : 'text-amber-700'}`}>
                                {listingState?.active ? 'Listed Aktif' : getBuyStateLabel(item)}
                              </span>
                            </div>

                            <div className="flex items-center gap-1 border-t border-neutral-100 pt-2 w-full">
                              <button 
                                onClick={() => navigateTo('product-detail', item)}
                                className="flex-1 bg-neutral-950 hover:bg-neutral-800 text-white font-black text-[10px] uppercase tracking-wider py-1.5 px-2 border-2 border-neutral-950 text-center transition cursor-pointer"
                              >
                                About➤ 
                              </button>
                              <button 
                                onClick={() => handleBuyNft(item)}
                                disabled={buyDisabled}
                                className={`flex-1 font-black text-[10px] uppercase tracking-wider py-1.5 px-2 border-2 text-center transition ${buyDisabled ? 'bg-neutral-200 border-neutral-300 text-neutral-500 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700 cursor-pointer'}`}
                              >
                                {getBuyStateLabel(item)}
                              </button>
                              
                              <button 
                                onClick={(e) => toggleLike(e, item.idproduk)}
                                className={`p-1.5 border-2 border-neutral-950 transition cursor-pointer flex items-center justify-center h-7 w-7 shrink-0 ${
                                  isLiked ? 'bg-red-50 text-red-600 border-neutral-950' : 'bg-white text-neutral-400 hover:text-neutral-900'
                                }`}
                              >
                                <Heart className={`h-3.5 w-3.5 ${isLiked ? 'fill-current' : ''}`} />
                              </button>
                              <button 
                                onClick={(e) => togglePin(e, item.idproduk)}
                                className={`p-1.5 border-2 transition cursor-pointer flex items-center justify-center h-7 w-7 shrink-0 ${
                                  pinnedProducts.includes(item.idproduk) ? 'bg-emerald-50 text-emerald-700 border-emerald-700' : 'bg-white text-neutral-400 border-neutral-950 hover:text-neutral-900'
                                }`}
                                title={pinnedProducts.includes(item.idproduk) ? 'Batal sematkan' : 'Sematkan'}
                              >
                                <Bookmark className={`h-3.5 w-3.5 ${pinnedProducts.includes(item.idproduk) ? 'fill-current' : ''}`} />
                              </button>
                            </div>
                          </div>

                        </div>
                            );
                          })}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              );
            })}

            {canLoadMore && (
              <div className="pt-2 flex justify-center">
                <button
                  type="button"
                  onClick={handleLoadMoreAndScroll}
                  className="w-full sm:w-auto min-w-64 bg-emerald-700 hover:bg-emerald-800 text-white font-black uppercase tracking-wider py-3 px-8 border-2 border-emerald-800 rounded-xl shadow-[4px_4px_0px_0px_rgba(6,78,59,0.4)] transition cursor-pointer"
                >
                  Muat Scroll Berikutnya
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <Footer />

      {/* POP-UP MODAL QUICK VIEW */}
      {selectedNft && (
        <div className="fixed inset-0 z-70 bg-neutral-950/60 backdrop-blur-sm flex items-start md:items-center justify-center p-2 sm:p-4 pt-20 sm:pt-0 overflow-y-auto">
          <div className="bg-white border-4 border-neutral-950 p-3 sm:p-5 max-w-3xl sm:max-w-xl w-full mx-2 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] relative flex flex-col md:flex-row gap-3 sm:gap-4 max-h-[calc(100vh-96px)] overflow-auto rounded-xl">
            <button 
              onClick={() => {
                setSelectedNft(null);
                setAutoPlayVoice(false);
                if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                  window.speechSynthesis.cancel();
                }
              }} 
              className="absolute top-4 right-4 p-1.5 border-2 border-neutral-950 bg-white text-neutral-950 cursor-pointer z-10"
            >
              <X className="h-5 w-5 stroke-[2.5]" />
            </button>

            <div className="flex-1 min-w-0">
              <div className="border-4 border-neutral-950 p-1 bg-neutral-50 overflow-hidden max-h-56 sm:max-h-72 w-full sm:w-auto flex-none">
                {(() => {
                  let imgUrl = '/images/default-art.jpg';
                  if (selectedNft.image_url && selectedNft.image_url !== 'default.jpg') {
                    imgUrl = selectedNft.image_url.startsWith('/storage/') 
                      ? selectedNft.image_url 
                      : `/storage/${selectedNft.image_url}`;
                  }
                  return <img src={imgUrl} alt={selectedNft.title} className="w-full h-full object-cover max-h-56 sm:max-h-72" />;
                })()}
              </div>
            </div>

              <div className="flex-1 flex flex-col justify-between space-y-3 min-w-0 overflow-auto">
              <div className="space-y-3">
                <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-neutral-500">
                  <Tag className="h-3 w-3" /> Quick View
                </div>
                <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight text-neutral-900 wrap-break-word leading-tight">
                  {selectedNft.title}
                </h2>

                {selectedNft.deskripsi && (
                  <p className="text-xs text-neutral-600 line-clamp-3 sm:line-clamp-4">
                    {selectedNft.deskripsi}
                  </p>
                )}


                <a 
                  href={selectedNft.user ? `/#/profile/${selectedNft.user.idUser}` : "/"}
                  onClick={(e) => {
                    if (selectedNft.user) {
                      e.preventDefault();
                      navigateTo('public-profile', selectedNft.user);
                      setSelectedNft(null);
                    }
                  }}
                  className="flex items-center gap-2 bg-white hover:bg-neutral-50 px-2.5 py-1.5 border-2 border-neutral-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer text-xs font-medium text-neutral-600 no-underline"
                >
                  <div className="w-5 h-5 rounded-full bg-neutral-300 overflow-hidden shrink-0 border border-neutral-950">
                    <img src={selectedNft.user?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"} className="w-full h-full object-cover" alt="avatar" />
                  </div>
                  <span>Owner: <span className="font-black text-neutral-900 underline decoration-2">{selectedNft.user?.name || 'Unknown'}</span></span>
                  <ShieldCheck className="h-4 w-4 text-blue-500 ml-auto" />
                </a>

                <div className="border border-neutral-300 p-2 sm:p-2.5 font-mono text-[10px] sm:text-[11px] space-y-1 bg-neutral-50/50">
                  <div className="flex justify-between gap-3">
                    <span className="text-neutral-400">Owner</span>
                    <a
                      href={selectedNft.user?.wallet_address ? `${explorerBaseUrl}/address/${selectedNft.user.wallet_address}` : '#'}
                      target="_blank"
                      rel="noreferrer"
                      className="text-neutral-800 font-bold flex items-center gap-1 hover:text-neutral-600"
                    >
                      {selectedNft.user?.name || 'Unknown'} <ExternalLink className="h-3 w-3 inline text-neutral-400" />
                    </a>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-neutral-400">Contract</span>
                    {selectedNft.nft?.contract_address ? (
                      <a
                        href={`${explorerBaseUrl}/address/${selectedNft.nft.contract_address}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-neutral-800 font-bold flex items-center gap-1 hover:text-neutral-600"
                      >
                        {shortenAddress(selectedNft.nft.contract_address)} <ExternalLink className="h-3 w-3 inline text-neutral-400" />
                      </a>
                    ) : (
                      <span className="text-neutral-500 font-bold">Belum terhubung</span>
                    )}
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-neutral-400">Token ID</span>
                    {selectedNft.nft?.contract_address && selectedNft.nft?.token_id ? (
                      <a
                        href={`${explorerBaseUrl}/nft/${selectedNft.nft.contract_address}/${selectedNft.nft.token_id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-neutral-800 font-bold flex items-center gap-1 hover:text-neutral-600"
                      >
                        #{selectedNft.nft.token_id} <ExternalLink className="h-3 w-3 inline text-neutral-400" />
                      </a>
                    ) : (
                      <span className="text-neutral-800 font-bold">{selectedNft.nft?.token_id ? `#${selectedNft.nft.token_id}` : 'Belum ada'}</span>
                    )}
                  </div>
                  <div className="flex justify-between"><span className="text-neutral-400">Jaringan</span><span className="text-neutral-800 font-bold">{chainMeta.name}</span></div>
                  <div className="flex justify-between"><span className="text-neutral-400">Token Standard</span><span className="text-neutral-800 font-bold">ERC-721</span></div>
                </div>
              </div>

              <div className="pt-2 border-t border-neutral-200 space-y-2">
                <div className="bg-neutral-950 text-white p-2 flex justify-between items-center border-2 border-neutral-950">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Current Valuasi Price</p>
                    <p className="text-sm sm:text-base font-black font-mono tracking-tight text-white">{selectedNft.price_crypto || selectedNft.price || '0.00'} {nativeSymbol}</p>
                  </div>
                  <Wallet className="h-5 w-5 text-neutral-400" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button onClick={() => { navigateTo('product-detail', selectedNft); setSelectedNft(null); setAutoPlayVoice(false); if (typeof window !== 'undefined' && 'speechSynthesis' in window) { window.speechSynthesis.cancel(); } }} className="bg-neutral-950 hover:bg-neutral-800 text-white font-black text-[11px] uppercase tracking-widest py-2.5 border-2 border-neutral-950 transition shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] cursor-pointer">Lihat Lengkap</button>
                  <button onClick={() => alert("Fitur Penawaran/Bid Mandiri berhasil terpicu untuk antrean Web3.")} className="bg-white hover:bg-neutral-50 text-neutral-950 font-black text-[11px] uppercase tracking-widest py-2.5 border-2 border-neutral-950 transition cursor-pointer">Place a Bid</button>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
