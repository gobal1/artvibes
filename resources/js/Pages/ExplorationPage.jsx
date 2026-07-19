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
  SlidersHorizontal,
  CalendarDays
} from 'lucide-react';
import Footer from '../Components/Footer';
import { buyListedToken, getConfiguredChainMetadata, getExplorerBaseUrl, getListingState, getNativeCurrencySymbol, requireWalletAccess, shortenAddress } from '../Utils/artVibesMarket';

// Menerima props 'products' sesuai kiriman data dari backend
export default function ExplorationPage({ products = [], isLoading = false, productsError = '', auth = null, onSelectProduct, onProductPurchased, navigateTo }) {
  const chainMeta = getConfiguredChainMetadata();
  const explorerBaseUrl = getExplorerBaseUrl();
  const nativeSymbol = getNativeCurrencySymbol();
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarPanelOpen, setSidebarPanelOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedPanelCategory, setSelectedPanelCategory] = useState('Digital Art');
  const [buyNow, setBuyNow] = useState(false);
  const [onAuction, setOnAuction] = useState(false);
  const [notForSale, setNotForSale] = useState(false);
  const [minPol, setMinPol] = useState('');
  const [maxPol, setMaxPol] = useState('');
  const [assetType, setAssetType] = useState('pure');
  const [orientationFilters, setOrientationFilters] = useState({
    square: false,
    portrait: false,
    landscape: false,
    panoramic: false,
  });
  const [resolution, setResolution] = useState('all');
  const [sortOption, setSortOption] = useState('Terbaru');
  
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

  const normalizeProductId = (value) => {
    if (value === undefined || value === null) return '';
    return String(value);
  };

  const resolveProductImageUrl = (imageUrl) => {
    if (!imageUrl || typeof imageUrl !== 'string') return '/images/default-art.jpg';
    const trimmed = imageUrl.trim();
    if (!trimmed) return '/images/default-art.jpg';
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    if (trimmed.startsWith('/storage/') || trimmed.startsWith('/images/')) return trimmed;
    if (trimmed.startsWith('storage/')) return `/${trimmed}`;
    if (trimmed.startsWith('produk/')) return `/storage/${trimmed}`;
    if (/^ipfs:\/\//i.test(trimmed)) return trimmed.replace(/^ipfs:\/\//i, 'https://ipfs.io/ipfs/');
    return `/storage/${trimmed}`;
  };

  const getBuyStateLabel = (product) => {
    const key = product.idproduk ?? product.id ?? '';
    const listingState = key ? listingStateByProduct[key] : null;
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
        .map((pin) => normalizeProductId(pin.produk_idproduk ?? pin.id_produk ?? pin.produk?.idproduk ?? pin.produk?.id))
        .filter((id) => id);
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
      const normalizedProductId = normalizeProductId(productId);
      const isPinned = pinnedProducts.includes(normalizedProductId);
      if (isPinned) {
        const response = await fetch(`/api/pins/${userId}/${normalizedProductId}`, {
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
        const key = product.idproduk ?? product.id ?? '';
        const tokenId = getProductTokenId(product);
        if (!tokenId || !key) {
          if (key) {
            nextState[key] = { status: 'unlinked', active: false };
          }
          continue;
        }

        try {
          const listing = await getListingState(tokenId);
          nextState[key] = {
            status: listing.active ? 'active' : 'inactive',
            active: Boolean(listing.active),
            seller: listing.seller,
            priceWei: listing.priceWei?.toString?.() ?? String(listing.priceWei ?? ''),
          };
        } catch (error) {
          nextState[key] = {
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
        const likedIds = (Array.isArray(data) ? data : []).map((like) => normalizeProductId(like.id_produk ?? like.produk_idproduk ?? like.produk?.idproduk ?? like.produk?.id)).filter((id) => id);
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
      const normalizedProductId = normalizeProductId(productId);
      const isLiked = likedProducts.includes(normalizedProductId);

      if (isLiked) {
        const response = await fetch(`/api/likes/${userId}/${normalizedProductId}`, {
          method: 'DELETE',
          headers: {
            'Accept': 'application/json',
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
          },
          credentials: 'include',
        });
        if (response.ok) {
          setLikedProducts((prev) => prev.filter((id) => id !== normalizedProductId));
        }
      } else {
        const response = await fetch('/api/likes', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
          },
          credentials: 'include',
          body: JSON.stringify({
            id_produk: Number(normalizedProductId),
            user_idUser: userId,
          }),
        });
        if (response.ok) {
          setLikedProducts((prev) => [...new Set([...prev, normalizedProductId])]);
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

  const panelCategories = [
    { label: 'Digital Art', count: 1204 },
    { label: 'Photography', count: 843 },
    { label: '3D Object', count: 124 },
    { label: 'Music & Audio', count: 55 },
    { label: 'Game Items', count: 89 },
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
    if (!isLoggedIn) {
      alert('Silakan login terlebih dahulu untuk membeli NFT ini.');
      return;
    }

    console.log('📦 === PRODUK DIPILIH ===');
    console.log('Struktur nft:', JSON.stringify(nft, null, 2));
    
    const tokenIdRaw = nft.nft?.token_id ?? nft.token_id ?? nft.idproduk;
    const tokenId = Number(tokenIdRaw);
    const priceRaw = nft.price_crypto ?? nft.price ?? nft.nft?.price;

    console.log(`🔍 Data yang di-extract:`);
    console.log(`   - Token ID Raw: ${tokenIdRaw}`);
    console.log(`   - Token ID Number: ${tokenId}`);
    console.log(`   - Price: ${priceRaw}`);

    try {
      if (!Number.isInteger(tokenId) || tokenId <= 0) {
        alert('NFT ini belum di-mint ke blockchain. Mint dulu dari dashboard creator agar transaksi buy bisa diproses.');
        return;
      }

      // 1. CARI TAHU ID PRODUK DAN ID PEMBELI YANG BENAR
      // Coba tangkap berbagai kemungkinan nama variabel dari object nft
      const productId = nft.idproduk || nft.id || nft.id_produk;
      
      // Sesuaikan dengan state user yang kamu pakai (auth atau currentUser)
      // Kita pakai opsional chaining (?.) agar aplikasi tidak error jika undefined
      const buyerId = typeof auth !== 'undefined' ? (auth?.user?.idUser || auth?.user?.id) : (typeof currentUser !== 'undefined' ? currentUser?.id : null);

      // 2. JARING PENGAMAN: Jangan lanjut kalau ID kosong agar tidak buang-buang gas fee!
      if (!productId) {
          alert('❌ Gagal: ID Produk tidak ditemukan di data frontend. Cek log console.');
          console.error("Data NFT tidak memiliki idproduk:", nft);
          return;
      }
      if (!buyerId) {
          alert('Silahkan login terlebih dahulu, setelah itu baru bisa melakukan pembelian.');
          return;
      }

      console.log('🔄 === MEMULAI PROSES PEMBELIAN DI BLOCKCHAIN ===');
      await requireWalletAccess();
      // 3. Jalankan transaksi via MetaMask
      const result = await buyListedToken(tokenId, priceRaw);
      
      console.log('🔄 === BLOCKCHAIN SUKSES! SINKRONISASI DATABASE LARAVEL ===');
      
      // 4. Kirim data ke Laravel dengan ID yang sudah divalidasi dan pasti tidak null
      const response = await fetch('/api/transaksi/purchase', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        credentials: 'include',
        body: JSON.stringify({
          produk_id: productId,
          buyer_id: buyerId,
          tx_hash: result.txHash,
          amount: priceRaw,
        }),
      });

      // Cek respon detail jika Laravel melempar error
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        console.error('Detail Error Laravel:', errData);
        throw new Error(errData.message || 'Transaksi Blockchain sukses, tetapi gagal memperbarui database lokal.');
      }

      const resData = await response.json();
      console.log('Response dari Laravel:', resData);

      // 5. Jalankan callback bawaan jika ada
      if (typeof onProductPurchased === 'function') {
        await onProductPurchased(nft, {
          txHash: result.txHash,
          amount: priceRaw,
        });
      }

      console.log('✅ === SEMUA SINKRONISASI SELESAI ===');
      alert(`✅ Pembelian Sukses!\n\nDatabase otomatis diperbarui.\nNFT telah berpindah ke Dashboard Koleksi Anda.`);
      
      // Pindah ke dashboard koleksi
      navigateTo('dashboard', { tab: 'koleksi' });

    } catch (error) {
      console.error('❌ === BUY OR SYNC FAILED ===');
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
    <div className="w-full min-h-screen bg-white text-neutral-900 flex flex-col justify-start lg:justify-between font-sans antialiased relative">
      <main className="w-full px-0 sm:px-5 lg:px-0 flex-1 min-h-0 space-y-7 my-4 sm:my-6 pb-0">
        
        {/* AREA ATAS: Navigasi Premium & Search Bar */}
        <div className="flex flex-col gap-2 border-b border-neutral-200/80 pb-2.5 sm:pb-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <a 
              href="/"
              className="self-start rounded-full border border-neutral-200/80 bg-white/80 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.28em] text-neutral-700 transition hover:border-neutral-300 hover:text-neutral-900 no-underline sm:self-auto"
            >
              ← Kembali ke Beranda
            </a>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
              <div className="w-full sm:w-[28rem]">
                <div className="flex overflow-hidden rounded-full border border-neutral-200 bg-white shadow-[0_6px_20px_-12px_rgba(15,23,42,0.45)]">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveCategory('all');
                      setActiveImageSubCategory('row-image');
                      setSelectedYear('all');
                      scrollToProductsSection();
                    }}
                    className={`shrink-0 border-r border-neutral-200 px-3.5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.24em] transition ${activeCategory === 'all' ? 'bg-neutral-200 text-neutral-900' : 'bg-neutral-50 text-neutral-700 hover:bg-neutral-100'}`}
                  >
                    All
                  </button>
                  <input
                    type="text"
                    placeholder="Cari maha karya digital..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      scrollToProductsSection();
                    }}
                    className="flex-1 bg-transparent px-3 py-2.5 text-sm text-neutral-900 placeholder-neutral-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => scrollToProductsSection()}
                    className="flex h-11 w-11 shrink-0 items-center justify-center bg-blue-600 text-white transition hover:bg-blue-700"
                    aria-label="Cari"
                  >
                    <Search className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="flex w-full items-center gap-2 sm:w-auto">
                <div className="relative flex-1 min-w-0" ref={yearFilterRef}>
                  <button
                    type="button"
                    onClick={() => setYearFilterOpen((prev) => !prev)}
                    className={`inline-flex h-9 w-full items-center justify-between rounded-full border px-3 text-[11px] font-semibold uppercase tracking-[0.2em] transition ${yearFilterOpen ? 'border-neutral-950 bg-neutral-950 text-white' : 'border-neutral-200/80 bg-white text-neutral-900 hover:border-neutral-900'}`}
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

                <div className="relative flex-1 min-w-0">
                  <button
                    type="button"
                    onClick={() => setVoiceSettingsOpen((prev) => !prev)}
                    className={`inline-flex items-center justify-between h-9 w-full px-3 border-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition ${voiceSettingsOpen ? 'bg-neutral-950 text-white border-neutral-950' : 'bg-white text-neutral-900 border-neutral-300 hover:border-neutral-900'}`}
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
                <button
                  type="button"
                  onClick={() => setPanelOpen((prev) => !prev)}
                  className={`inline-flex items-center justify-center h-9 px-3 border-2 rounded-xl text-[11px] font-black uppercase tracking-wider gap-2 transition ${panelOpen ? 'bg-neutral-950 text-white border-neutral-950' : 'bg-white text-neutral-900 border-neutral-300 hover:border-neutral-900 hover:bg-neutral-50'}`}
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  {panelOpen ? 'Sembunyikan' : 'Tampilkan'} Panel
                </button>
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
          <div className="flex-1 min-h-0 flex flex-col gap-6 lg:flex-row lg:overflow-hidden transition-all duration-500 ease-in-out">
            <section className={`w-full transition-all duration-500 ease-in-out ${panelOpen ? 'lg:w-3/4' : 'lg:w-full'} flex flex-col h-full min-h-0 overflow-hidden`}>
              <div className="flex-1 h-full min-h-0 overflow-y-auto space-y-6 pr-0 lg:pr-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
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

                              const productKey = normalizeProductId(item.idproduk ?? item.id);
                              const uniqueId = item.uniqueId || `${itemRowId}-${productKey}`;
                              const computedPrice = item.computedPrice || `${item.price_crypto || 0} ${nativeSymbol}`;
                              const titleText = item.titleText || item.title || `Digital Art ${itemIndex + 1}`;

                              let finalImageUrl = resolveProductImageUrl(item.image_url || item.gambar || item.nft?.metadata_url || '');

                              const normalizedItemId = productKey;
                              const isLiked = likedProducts.includes(normalizedItemId);
                              const listingState = listingStateByProduct[productKey];
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
                                        className="flex-1 font-black text-[10px] uppercase tracking-wider py-1.5 px-2 border-2 bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700 cursor-pointer transition-transform duration-150 transform active:scale-95 active:shadow-inner"
                                      >
                                        Go buy
                                      </button>

                                      <button
                                        onClick={(e) => toggleLike(e, item.idproduk ?? item.id)}
                                        className={`p-1.5 border-2 border-neutral-950 transition cursor-pointer flex items-center justify-center h-7 w-7 shrink-0 ${isLiked ? 'bg-red-50 text-red-600 border-neutral-950' : 'bg-white text-neutral-400 hover:text-neutral-900'}`}
                                      >
                                        <Heart className={`h-3.5 w-3.5 ${isLiked ? 'fill-current' : ''}`} />
                                      </button>
                                      <button
                                        onClick={(e) => togglePin(e, item.idproduk ?? item.id)}
                                        className={`p-1.5 border-2 transition cursor-pointer flex items-center justify-center h-7 w-7 shrink-0 ${pinnedProducts.includes(normalizedItemId) ? 'bg-emerald-50 text-emerald-700 border-emerald-700' : 'bg-white text-neutral-400 border-neutral-950 hover:text-neutral-900'}`}
                                        title={pinnedProducts.includes(normalizedItemId) ? 'Batal sematkan' : 'Sematkan'}
                                      >
                                        <Bookmark className={`h-3.5 w-3.5 ${pinnedProducts.includes(normalizedItemId) ? 'fill-current' : ''}`} />
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
              <div className="pt-3 flex justify-center">
                <button
                  type="button"
                  onClick={handleLoadMoreAndScroll}
                  className="w-full sm:w-auto min-w-64 text-black text-[11px]"
                >
                  Tampilkan Lebih Banyak
                </button>
              </div>
            )}
          </div>
        </section>

          <aside className={`overflow-hidden transition-all duration-500 ease-in-out fixed inset-x-0 bottom-0 z-40 h-[55vh] w-full ${panelOpen ? 'translate-y-0 opacity-100 pointer-events-auto' : 'translate-y-full opacity-0 pointer-events-none'} lg:static lg:inset-auto lg:bottom-auto lg:z-auto lg:h-auto ${panelOpen ? 'lg:block lg:w-1/4 lg:opacity-100 lg:pointer-events-auto lg:translate-y-0' : 'lg:hidden'}`}>
            <div className={`h-full overflow-hidden rounded-t-[1.75rem] border-t border-neutral-200 bg-white shadow-[0_-20px_60px_rgba(0,0,0,0.16)] lg:rounded-4xl lg:border lg:border-neutral-200 lg:shadow-[6px_6px_0_rgba(0,0,0,0.08)] transition duration-500 ease-in-out ${panelOpen ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'} lg:translate-y-0 lg:opacity-100`}>
              <div className="h-full overflow-y-auto p-5 space-y-4">
                <div className="pb-4 border-b border-neutral-200 flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-black uppercase tracking-tight text-neutral-900">Saring Karya</h2>
                    <p className="text-sm text-neutral-500 leading-relaxed">Gunakan filter ini untuk mempersempit tampilan pasar sesuai preferensi aset digitalmu.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPanelOpen(false)}
                    className="h-10 w-10 rounded-full border border-neutral-300 bg-neutral-100 text-neutral-700 hover:bg-neutral-200 transition flex items-center justify-center"
                    aria-label="Tutup panel filter"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-sm font-black uppercase tracking-wide text-neutral-900 mt-4">Kategori Utama</p>

                <div className="space-y-2">
                  {panelCategories.map((cat) => (
                    <button
                      key={cat.label}
                      type="button"
                      onClick={() => setSelectedPanelCategory(cat.label)}
                      className={`w-full flex items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${selectedPanelCategory === cat.label ? 'bg-neutral-950 text-white' : 'bg-neutral-50 text-neutral-800 hover:bg-neutral-100'}`}
                    >
                      <span>{cat.label}</span>
                      <span className="text-xs text-neutral-500">{cat.count}</span>
                    </button>
                  ))}
                </div>

                <div className="space-y-4 pb-4 border-b border-neutral-200">
                  <p className="text-sm font-black uppercase tracking-wide text-neutral-900">Status Penjualan</p>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 text-sm text-neutral-800">
                      <input type="checkbox" checked={buyNow} onChange={(e) => setBuyNow(e.target.checked)} className="h-4 w-4 rounded border-neutral-300 text-emerald-700 focus:ring-emerald-700" />
                      <span>Buy Now (Beli Langsung)</span>
                    </label>
                    <label className="flex items-center gap-3 text-sm text-neutral-800">
                      <input type="checkbox" checked={onAuction} onChange={(e) => setOnAuction(e.target.checked)} className="h-4 w-4 rounded border-neutral-300 text-emerald-700 focus:ring-emerald-700" />
                      <span>On Auction (Sedang Dilelang)</span>
                    </label>
                    <label className="flex items-center gap-3 text-sm text-neutral-800">
                      <input type="checkbox" checked={notForSale} onChange={(e) => setNotForSale(e.target.checked)} className="h-4 w-4 rounded border-neutral-300 text-emerald-700 focus:ring-emerald-700" />
                      <span>Not for Sale (Hanya Pameran)</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-4 pb-4 border-b border-neutral-200">
                  <p className="text-sm font-black uppercase tracking-wide text-neutral-900">Rentang Harga</p>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={minPol}
                      onChange={(e) => setMinPol(e.target.value)}
                      placeholder="Min POL"
                      className="w-full rounded-2xl border border-neutral-300 bg-neutral-50 px-4 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
                    />
                    <input
                      type="text"
                      value={maxPol}
                      onChange={(e) => setMaxPol(e.target.value)}
                      placeholder="Max POL"
                      className="w-full rounded-2xl border border-neutral-300 bg-neutral-50 px-4 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
                    />
                  </div>
                  <button type="button" className="w-full rounded-2xl bg-neutral-950 py-3 text-sm font-black uppercase tracking-wider text-white transition hover:bg-neutral-800">Terapkan Harga</button>
                </div>

                <div className="space-y-4 pb-4 border-b border-neutral-200">
                  <p className="text-sm font-black uppercase tracking-wide text-neutral-900">Tipe Aset</p>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 text-sm text-neutral-800">
                      <input type="radio" name="assetType" value="pure" checked={assetType === 'pure'} onChange={() => setAssetType('pure')} className="h-4 w-4 text-emerald-700 focus:ring-emerald-700" />
                      <span>Pure Digital (Hanya NFT)</span>
                    </label>
                    <label className="flex items-center gap-3 text-sm text-neutral-800">
                      <input type="radio" name="assetType" value="physical" checked={assetType === 'physical'} onChange={() => setAssetType('physical')} className="h-4 w-4 text-emerald-700 focus:ring-emerald-700" />
                      <span>Physical-Backed (NFT + Barang Fisik)</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-4 pb-4 border-b border-neutral-200">
                  <p className="text-sm font-black uppercase tracking-wide text-neutral-900">Orientasi & Rasio Gambar</p>
                  <div className="space-y-3">
                    {[
                      { key: 'square', label: 'Square (1:1) - PFP Ready' },
                      { key: 'portrait', label: 'Portrait (9:16) - Mobile' },
                      { key: 'landscape', label: 'Landscape (16:9) - Desktop' },
                      { key: 'panoramic', label: 'Panoramic / Ultrawide' },
                    ].map((option) => (
                      <label key={option.key} className="flex items-center gap-3 text-sm text-neutral-800">
                        <input
                          type="checkbox"
                          checked={orientationFilters[option.key]}
                          onChange={(e) => setOrientationFilters((prev) => ({ ...prev, [option.key]: e.target.checked }))}
                          className="h-4 w-4 rounded border-neutral-300 text-emerald-700 focus:ring-emerald-700"
                        />
                        <span>{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-4 pb-4 border-b border-neutral-200">
                  <p className="text-sm font-black uppercase tracking-wide text-neutral-900">Kualitas & Resolusi</p>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 text-sm text-neutral-800">
                      <input type="radio" name="resolution" value="all" checked={resolution === 'all'} onChange={() => setResolution('all')} className="h-4 w-4 text-emerald-700 focus:ring-emerald-700" />
                      <span>Semua Resolusi</span>
                    </label>
                    <label className="flex items-center gap-3 text-sm text-neutral-800">
                      <input type="radio" name="resolution" value="hd" checked={resolution === 'hd'} onChange={() => setResolution('hd')} className="h-4 w-4 text-emerald-700 focus:ring-emerald-700" />
                      <span>HD & Full HD (Min. 1080p)</span>
                    </label>
                    <label className="flex items-center gap-3 text-sm text-neutral-800">
                      <input type="radio" name="resolution" value="ultra" checked={resolution === 'ultra'} onChange={() => setResolution('ultra')} className="h-4 w-4 text-emerald-700 focus:ring-emerald-700" />
                      <span>Ultra HD / Print Ready (4K+)</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-sm font-black uppercase tracking-wide text-neutral-900">Urutkan Berdasarkan</p>
                  <select
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value)}
                    className="w-full rounded-2xl border border-neutral-300 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
                  >
                    <option>Terbaru</option>
                    <option>Harga Tertinggi</option>
                    <option>Harga Terendah</option>
                    <option>Paling Disukai</option>
                  </select>
                </div>
              </div>
            </div>
          </aside>
        </div>
        )}
      </main>

      <button
        type="button"
        onClick={() => setPanelOpen((prev) => !prev)}
        className={`lg:hidden fixed bottom-4 right-4 z-50 h-11 w-11 rounded-full border border-neutral-950 bg-white text-neutral-900 shadow-[0_10px_30px_rgba(0,0,0,0.18)] flex items-center justify-center transition hover:bg-neutral-100 ${panelOpen ? 'hidden' : 'flex'}`}
        aria-label={panelOpen ? 'Sembunyikan panel filter' : 'Tampilkan panel filter'}
        title={panelOpen ? 'Sembunyikan panel filter' : 'Tampilkan panel filter'}
      >
        <SlidersHorizontal className="h-5 w-5" />
      </button>

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
                  if (selectedNft.image_url || selectedNft.gambar || selectedNft.nft?.metadata_url) {
                    imgUrl = resolveProductImageUrl(selectedNft.image_url || selectedNft.gambar || selectedNft.nft?.metadata_url);
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
