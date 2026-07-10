import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { ethers } from 'ethers';
import { Mail, Lock, ArrowRight, X, ShieldCheck, Plus, MessageSquare, Trash2, Edit3, DollarSign, Bell, Heart, ChevronDown, Music2, Video } from 'lucide-react';
import ChatSidebar from '../Components/ChatSidebar';
import DashboardActivityPage from './DashboardActivityPage';
import { uploadAssetToIpfs, uploadMetadataToIpfs, linkNftToProduct } from '../Utils/ipfsApi';
import { getConfiguredChainId, getEthereumProvider, mintNftOnChain, listTokenOnChain, updateListingPriceOnChain, cancelListingOnChain, getNativeCurrencySymbol } from '../Utils/artVibesMarket';

const createEmptyFinanceAnalytics = () => ({
  months: Array.from({ length: 12 }, (_, index) => ({ label: `Tx ${index + 1}`, value: 0 })),
  smallStats: {
    totalRevenue: 0,
    totalSales: 0,
    avgPrice: 0,
    topMonthValue: 0,
    activeBuyers: 0,
  },
  recent: [],
});

export default function ProfileDashboard({ 
  navigateTo, 
  globalAddress, 
  auth, 
  myProducts = [], 
  purchasedProducts = [],
  initialSubTab = 'karya',
  onProductAdded, 
  onProductDeleted,
  onAuthUpdate,
}) {
  const marketCurrencySymbol = getNativeCurrencySymbol();
  // ========== ALL STATE DECLARATIONS FIRST ==========
  
  // State Navigasi Tab Utama
  const [activeSubTab, setActiveSubTab] = useState(initialSubTab || 'karya');

  useEffect(() => {
    setActiveSubTab(initialSubTab || 'karya');
  }, [initialSubTab]);

  // State untuk Kategori
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [loadingCategories, setLoadingCategories] = useState(true);

  const profileCategoryMap = [
    { label: 'Musik & Suara', aliases: ['musik & suara', 'musik', 'audio'] },
    { label: 'Image', aliases: ['image', 'seni digital', 'desain grafis', 'gift', 'art', 'gambar'] },
    { label: 'Item Game', aliases: ['item game', 'game', 'gaming'] },
    { label: 'Fotografi', aliases: ['fotografi', 'photograph'] },
  ];

  // Chain networks yang tersedia untuk mint
  const CHAIN_OPTIONS = [
    { id: 137,     name: 'Polygon Mainnet',          symbol: 'POL',  short: 'Polygon',  hexId: '0x89',    rpc: 'https://polygon-rpc.com',            explorer: 'https://polygonscan.com',      testnet: false, logoBg: 'bg-violet-100', logoText: 'text-violet-700' },
    { id: 1,       name: 'Ethereum Mainnet',         symbol: 'ETH',  short: 'Ethereum', hexId: '0x1',     rpc: '',                                    explorer: 'https://etherscan.io',          testnet: false, logoBg: 'bg-slate-100',  logoText: 'text-slate-700' },
    { id: 11155111,name: 'Ethereum Sepolia (Testnet)', symbol:'ETH', short: 'Ethereum', hexId: '0xaa36a7',rpc: 'https://rpc.sepolia.org',             explorer: 'https://sepolia.etherscan.io', testnet: true,  logoBg: 'bg-slate-100',  logoText: 'text-slate-700' },
    { id: 10143,   name: 'Monad Testnet',            symbol: 'MON',  short: 'Monad',    hexId: '0x279f',  rpc: 'https://testnet-rpc.monad.xyz',      explorer: 'https://testnet.monadexplorer.com', testnet: true, logoBg: 'bg-fuchsia-100', logoText: 'text-fuchsia-700' },
    { id: 43114,   name: 'Avalanche C-Chain',        symbol: 'AVAX', short: 'Avalanche',hexId: '0xa86a',  rpc: 'https://api.avax.network/ext/bc/C/rpc', explorer: 'https://snowtrace.io',      testnet: false, logoBg: 'bg-rose-100', logoText: 'text-rose-700' },
    { id: 42161,   name: 'Arbitrum One',             symbol: 'ETH',  short: 'Arbitrum', hexId: '0xa4b1',  rpc: 'https://arb1.arbitrum.io/rpc',       explorer: 'https://arbiscan.io',          testnet: false, logoBg: 'bg-cyan-100', logoText: 'text-cyan-700' },
  ];

  // State untuk Pop-up Modal Upload
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newVoiceScript, setNewVoiceScript] = useState('');
  const [newStatus, setNewStatus] = useState('listing');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [selectedChain, setSelectedChain] = useState(getConfiguredChainId());
  const [walletNativeBalance, setWalletNativeBalance] = useState(null);
  const [walletUsdBalance, setWalletUsdBalance] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [recentSort, setRecentSort] = useState('newest');
  const [showProductSortMenu, setShowProductSortMenu] = useState(false);
  const [productSortMenuPosition, setProductSortMenuPosition] = useState({ top: 0, left: 0 });
  const [collectionSort, setCollectionSort] = useState('newest');
  const [showCollectionSortMenu, setShowCollectionSortMenu] = useState(false);
  const [collectionSortMenuPosition, setCollectionSortMenuPosition] = useState({ top: 0, left: 0 });
  const [activePanelAction, setActivePanelAction] = useState('add-art');
  const productSortMenuRef = useRef(null);
  const productSortTriggerRef = useRef(null);
  const productSortDropdownRef = useRef(null);
  const collectionSortMenuRef = useRef(null);
  const collectionSortTriggerRef = useRef(null);
  const collectionSortDropdownRef = useRef(null);

  // State untuk Fitur Notifikasi
  const [notifications, setNotifications] = useState([
    { id: 1, text: "Sistem Otentikasi Dashboard Terhubung Terenkripsi.", type: "success", read: false },
  ]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  // State untuk Fitur Chat - Conversations List (MOVED UP - MUST BE BEFORE useEffect)
  const [conversations, setConversations] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedConversationUser, setSelectedConversationUser] = useState(null);
  const [isChatSidebarOpen, setIsChatSidebarOpen] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [likedProductsData, setLikedProductsData] = useState([]);
  const [loadingLikedProducts, setLoadingLikedProducts] = useState(false);
  const [financeAnalytics, setFinanceAnalytics] = useState(createEmptyFinanceAnalytics);
  const selectedChainInfo = CHAIN_OPTIONS.find((chain) => chain.id === selectedChain) || CHAIN_OPTIONS[0];

  const TOKEN_CONFIG_BY_CHAIN = {
    137: {
      address: import.meta.env.VITE_WALLET_TOKEN_ADDRESS_POLYGON || '',
      coingeckoId: import.meta.env.VITE_WALLET_TOKEN_COINGECKO_ID_POLYGON || 'wmatic',
      symbol: import.meta.env.VITE_WALLET_TOKEN_SYMBOL_POLYGON || 'POL',
    },
  };

  useEffect(() => {
    if (!auth?.user) return;

    let isCancelled = false;

    const fetchFinanceAnalytics = async () => {
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
          setFinanceAnalytics(data);
        }
      } catch (error) {
        console.error('Error fetching finance analytics:', error);
      }
    };

    fetchFinanceAnalytics();

    return () => {
      isCancelled = true;
    };
  }, [auth?.user?.idUser, auth?.user?.id, myProducts.length, purchasedProducts.length]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showProductSortMenu) {
        const clickedProductTrigger = productSortMenuRef.current && productSortMenuRef.current.contains(event.target);
        const clickedProductDropdown = productSortDropdownRef.current && productSortDropdownRef.current.contains(event.target);

        if (!clickedProductTrigger && !clickedProductDropdown) {
          setShowProductSortMenu(false);
        }
      }

      if (showCollectionSortMenu) {
        const clickedCollectionTrigger = collectionSortMenuRef.current && collectionSortMenuRef.current.contains(event.target);
        const clickedCollectionDropdown = collectionSortDropdownRef.current && collectionSortDropdownRef.current.contains(event.target);

        if (!clickedCollectionTrigger && !clickedCollectionDropdown) {
          setShowCollectionSortMenu(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showProductSortMenu, showCollectionSortMenu]);

  useEffect(() => {
    if (!showProductSortMenu || !productSortTriggerRef.current) return;

    const updateMenuPosition = () => {
      const rect = productSortTriggerRef.current.getBoundingClientRect();
      setProductSortMenuPosition({
        top: rect.bottom + 6,
        left: rect.left,
      });
    };

    updateMenuPosition();
    window.addEventListener('resize', updateMenuPosition);
    window.addEventListener('scroll', updateMenuPosition, true);

    return () => {
      window.removeEventListener('resize', updateMenuPosition);
      window.removeEventListener('scroll', updateMenuPosition, true);
    };
  }, [showProductSortMenu]);

  useEffect(() => {
    if (!showCollectionSortMenu || !collectionSortTriggerRef.current) return;

    const updateCollectionMenuPosition = () => {
      const rect = collectionSortTriggerRef.current.getBoundingClientRect();
      setCollectionSortMenuPosition({
        top: rect.bottom + 6,
        left: rect.left,
      });
    };

    updateCollectionMenuPosition();
    window.addEventListener('resize', updateCollectionMenuPosition);
    window.addEventListener('scroll', updateCollectionMenuPosition, true);

    return () => {
      window.removeEventListener('resize', updateCollectionMenuPosition);
      window.removeEventListener('scroll', updateCollectionMenuPosition, true);
    };
  }, [showCollectionSortMenu]);

  // ========== ALL useEffect HOOKS AFTER STATE DECLARATIONS ==========

  // Fetch Categories dari Backend
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/kategori');
        if (response.ok) {
          const data = await response.json();

          const visibleCategories = data
            .map((cat) => {
              const name = (cat.name || cat.nama || '').toString().toLowerCase();
              const matchedMap = profileCategoryMap.find((map) =>
                map.aliases.some((alias) => name.includes(alias))
              );
              if (!matchedMap) return null;
              return {
                ...cat,
                canonicalLabel: matchedMap.label,
              };
            })
            .filter(Boolean);

          const uniqueCategoriesByLabel = Object.values(
            visibleCategories.reduce((acc, cat) => {
              if (!acc[cat.canonicalLabel]) {
                acc[cat.canonicalLabel] = cat;
              }
              return acc;
            }, {})
          ).sort((a, b) => {
            const order = profileCategoryMap.map((map) => map.label);
            return order.indexOf(a.canonicalLabel) - order.indexOf(b.canonicalLabel);
          });

          setCategories(uniqueCategoriesByLabel);
          if (uniqueCategoriesByLabel.length > 0 && !newCategory) {
            setNewCategory(uniqueCategoriesByLabel[0].idkategori);
          }
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  // Fetch Conversations dari Backend
  useEffect(() => {
    const fetchConversations = async () => {
      const userId = auth?.user?.idUser || auth?.user?.id;
      if (!userId) {
        console.warn('No user ID available');
        return;
      }
      try {
        setLoadingConversations(true);
        const response = await fetch('/api/messages/conversations', {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
          },
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          console.log('Conversations fetched:', data);
          setConversations(data);
        } else {
          console.warn('Failed to fetch conversations:', response.status);
        }
      } catch (err) {
        console.error('Error fetching conversations:', err);
      } finally {
        setLoadingConversations(false);
      }
    };

    // Fetch unread count
    const fetchUnreadCount = async () => {
      const userId = auth?.user?.idUser || auth?.user?.id;
      if (!userId) return;
      try {
        const response = await fetch('/api/messages/unread-count', {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
          },
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          setUnreadCount(data.unread_count || 0);
        }
      } catch (err) {
        console.error('Error fetching unread count:', err);
      }
    };

    fetchConversations();
    fetchUnreadCount();

    // Poll untuk pesan baru setiap 5 detik
    const interval = setInterval(() => {
      fetchConversations();
      fetchUnreadCount();
    }, 5000);

    return () => clearInterval(interval);
  }, [auth?.user?.idUser, auth?.user?.id]);

  useEffect(() => {
    const fetchFollowersCount = async () => {
      const userId = auth?.user?.idUser || auth?.user?.id;
      if (!userId) {
        setFollowersCount(0);
        return;
      }

      try {
        const response = await fetch(`/api/user/${userId}/followers`, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
          },
          credentials: 'include',
        });

        if (!response.ok) {
          setFollowersCount(0);
          return;
        }

        const data = await response.json();
        setFollowersCount(typeof data.count === 'number' ? data.count : 0);
      } catch (err) {
        console.error('Error fetching followers count:', err);
        setFollowersCount(0);
      }
    };

    fetchFollowersCount();
  }, [auth?.user?.idUser, auth?.user?.id]);

  useEffect(() => {
    const fetchLikedProductsForDashboard = async () => {
      const userId = auth?.user?.idUser || auth?.user?.id;
      if (!userId) {
        setLikedProductsData([]);
        return;
      }

      try {
        setLoadingLikedProducts(true);

        const likesResponse = await fetch(`/api/likes/user/${userId}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
          },
          credentials: 'include',
        });

        if (!likesResponse.ok) {
          setLikedProductsData([]);
          return;
        }

        const likesData = await likesResponse.json();
        const likedIds = new Set(
          (Array.isArray(likesData) ? likesData : [])
            .map((like) => Number(like?.id_produk || like?.idproduk || like?.produk_id || like?.product_id || 0))
            .filter((id) => Number.isInteger(id) && id > 0)
        );

        let likedProducts = (Array.isArray(likesData) ? likesData : [])
          .map((like) => like?.produk || like?.product || null)
          .filter((item) => item && (item.idproduk || item.id));

        if (likedProducts.length === 0 && likedIds.size > 0) {
          const productsResponse = await fetch('/api/produk', {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
            },
            credentials: 'include',
          });

          if (productsResponse.ok) {
            const allProducts = await productsResponse.json();
            likedProducts = (Array.isArray(allProducts) ? allProducts : []).filter((product) =>
              likedIds.has(Number(product?.idproduk || product?.id || 0))
            );
          }
        }

        const dedupedLikedProducts = likedProducts.filter((item, index, array) => {
          const itemId = String(item.idproduk || item.id || '');
          return array.findIndex((candidate) => String(candidate.idproduk || candidate.id || '') === itemId) === index;
        });

        setLikedProductsData(dedupedLikedProducts);
      } catch (error) {
        console.error('Error fetching liked products for dashboard:', error);
        setLikedProductsData([]);
      } finally {
        setLoadingLikedProducts(false);
      }
    };

    fetchLikedProductsForDashboard();
  }, [auth?.user?.idUser, auth?.user?.id]);

  // Fetch Wallet Balance in USD
  const mapChainIdToCoinGeckoId = useCallback((chainId) => {
    if ([1, 11155111, 42161].includes(chainId)) return 'ethereum';
    if (chainId === 137) return 'wmatic';
    if (chainId === 43114) return 'avalanche-2';
    if (chainId === 10143) return 'monad';
    return 'ethereum';
  }, []);

  const parseCoinGeckoPrice = useCallback((priceData, coinId) => {
    if (!priceData || typeof priceData !== 'object') return 0;
    const coinEntry = priceData[coinId];
    if (!coinEntry) {
      return 0;
    }

    if (typeof coinEntry === 'number') {
      return coinEntry;
    }

    if (Array.isArray(coinEntry)) {
      for (const item of coinEntry) {
        if (item && typeof item === 'object' && typeof item.usd === 'number') {
          return item.usd;
        }
      }
      return 0;
    }

    if (typeof coinEntry === 'object') {
      return Number(coinEntry.usd) || 0;
    }

    return 0;
  }, []);

  const fetchCryptoPrice = useCallback(async (coinId) => {
    const safeFetchPrice = async (url) => {
      const resp = await fetch(url);
      if (!resp.ok) {
        const body = await resp.text().catch(() => 'unable to read body');
        throw new Error(`Fetch failed ${resp.status}: ${body}`);
      }
      const data = await resp.json();
      return parseCoinGeckoPrice(data, coinId);
    };

    try {
      const backendUrl = `/api/crypto/price?id=${encodeURIComponent(coinId)}&vs_currency=usd`;
      const backendPrice = await safeFetchPrice(backendUrl);
      if (backendPrice > 0) return backendPrice;
      console.warn('Backend price fetch returned zero, falling back to CoinGecko directly for', coinId);
    } catch (backendError) {
      console.warn('Backend price fetch failed for', coinId, backendError);
    }

    try {
      const directUrl = `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(coinId)}&vs_currencies=usd`;
      return await safeFetchPrice(directUrl);
    } catch (directError) {
      console.warn('Direct CoinGecko price fetch failed for', coinId, directError);
      return 0;
    }
  }, [parseCoinGeckoPrice]);

  const getPreferredWalletAddress = useCallback(() => {
    if (globalAddress) return globalAddress.toLowerCase();
    if (auth?.user?.wallet_address) return auth.user.wallet_address.toLowerCase();
    const provider = getEthereumProvider();
    if (provider?.selectedAddress) return provider.selectedAddress.toLowerCase();
    if (typeof window !== 'undefined' && window.ethereum?.selectedAddress) return window.ethereum.selectedAddress.toLowerCase();
    return null;
  }, [globalAddress, auth?.user?.wallet_address]);

  const fetchWalletBalance = useCallback(async (walletAddress) => {
    try {
      const provider = getEthereumProvider();
      if (!walletAddress || !provider) {
        setWalletUsdBalance(null);
        setWalletNativeBalance(null);
        return;
      }

      const chainHex = await provider.request({ method: 'eth_chainId' });
      const chainId = parseInt(chainHex, 16);
      if (chainId && chainId !== selectedChain) {
        setSelectedChain(chainId);
      }
      const tokenConfig = TOKEN_CONFIG_BY_CHAIN[chainId];
      const coinId = mapChainIdToCoinGeckoId(chainId);

      let balanceEth = 0;
      try {
        const ethersProvider = new ethers.BrowserProvider(provider);
        const balanceWei = await ethersProvider.getBalance(walletAddress);
        balanceEth = Number(ethers.formatEther(balanceWei));
      } catch (providerError) {
        console.warn('BrowserProvider balance failed, fallback to eth_getBalance', providerError);
        const balanceWeiHex = await provider.request({
          method: 'eth_getBalance',
          params: [walletAddress, 'latest'],
        });
        balanceEth = parseInt(balanceWeiHex, 16) / 1e18;
      }

      setWalletNativeBalance(balanceEth);

      let usdValue = 0;
      try {
        const nativePrice = await fetchCryptoPrice(coinId);
        if (!nativePrice) {
          console.warn('Native price returned zero for', coinId);
        }
        usdValue = Number((balanceEth * nativePrice).toFixed(2));
      } catch (priceError) {
        console.warn('Failed to fetch native crypto price:', priceError);
      }

      if (tokenConfig?.address) {
        try {
          const erc20Provider = new ethers.BrowserProvider(getEthereumProvider());
          const erc20Abi = [
            'function balanceOf(address owner) view returns (uint256)',
            'function decimals() view returns (uint8)',
          ];
          const tokenContract = new ethers.Contract(tokenConfig.address, erc20Abi, erc20Provider);
          const tokenBalanceRaw = await tokenContract.balanceOf(walletAddress);
          const tokenDecimals = await tokenContract.decimals();
          const tokenBalance = Number(ethers.formatUnits(tokenBalanceRaw, tokenDecimals));

          const tokenPrice = await fetchCryptoPrice(tokenConfig.coingeckoId);
          const tokenUsdValue = Number((tokenBalance * tokenPrice).toFixed(2));
          if (tokenUsdValue > usdValue) {
            usdValue = tokenUsdValue;
          }
        } catch (tokenError) {
          console.warn('Token balance fetch failed:', tokenError);
        }
      }

      console.log('Profile fetchWalletBalance', { walletAddress, chainId, balanceEth, usdValue, tokenConfig });
      setWalletUsdBalance(usdValue);
    } catch (error) {
      console.error('Failed to fetch wallet balance:', error);
      setWalletUsdBalance(null);
    }
  }, [mapChainIdToCoinGeckoId, selectedChain, fetchCryptoPrice]);

  useEffect(() => {
    const initBalance = async () => {
      let wallet = getPreferredWalletAddress();
      const provider = getEthereumProvider();

      if (!wallet && provider) {
        try {
          const accounts = await provider.request({ method: 'eth_accounts' });
          if (Array.isArray(accounts) && accounts.length > 0) {
            wallet = accounts[0].toLowerCase();
          }
        } catch (error) {
          console.warn('Unable to read wallet accounts on init:', error);
        }
      }

      fetchWalletBalance(wallet);
    };

    initBalance();
  }, [getPreferredWalletAddress, fetchWalletBalance]);

  useEffect(() => {
    const provider = getEthereumProvider();
    if (!provider || typeof provider.on !== 'function') return;

    const handleAccountsChanged = (accounts) => {
      if (Array.isArray(accounts) && accounts.length > 0) {
        const wallet = accounts[0].toLowerCase();
        fetchWalletBalance(wallet);
      } else {
        setWalletUsdBalance(null);
        setWalletNativeBalance(null);
      }
    };

    const handleChainChanged = () => {
      const wallet = getPreferredWalletAddress();
      if (wallet) fetchWalletBalance(wallet);
    };

    provider.on('accountsChanged', handleAccountsChanged);
    provider.on('chainChanged', handleChainChanged);

    return () => {
      provider.removeListener('accountsChanged', handleAccountsChanged);
      provider.removeListener('chainChanged', handleChainChanged);
    };
  }, [fetchWalletBalance, getPreferredWalletAddress]);

  useEffect(() => {
    const provider = getEthereumProvider();
    const wallet = getPreferredWalletAddress();
    if (!wallet || !provider) return;

    const interval = setInterval(() => {
      fetchWalletBalance(wallet);
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchWalletBalance, getPreferredWalletAddress]);

  // Handler Pilih File Gambar
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };


  // Mengaktifkan Mode Edit & Mengisi Form dengan Data Lama
  const openEditProduct = (product) => {
    setEditingProduct(product);
    setNewTitle(product.title || '');
    setNewPrice(product.price_crypto || '');
    setNewDesc(product.deskripsi || '');
    setNewVoiceScript(product.voice_script || '');
    setNewStatus(product.status || 'listing');
    setNewCategory(product.kategori_idkategori || (categories.length > 0 ? categories[0].idkategori : ''));
    // Format image URL dengan /storage/ prefix
    const imageUrl = product.image_url 
      ? (product.image_url.startsWith('/storage/') || product.image_url.startsWith('http') ? product.image_url : `/storage/${product.image_url}`)
      : '';
    setImagePreview(imageUrl);
    setSelectedImage(null);
    setIsModalOpen(true);
  };

  // ------------------------------------------------------------------
  // 🛠️ PERBAIKAN LOGIKA HANDLE SUBMIT PRODUK DI SINI
  // ------------------------------------------------------------------
  const handleCreateProduct = async (e) => {
    e.preventDefault();
    if (!newTitle || !newPrice || !newCategory) {
      alert("Judul, Harga, dan Kategori wajib diisi!");
      return;
    }

    setSubmitError('');
    setSubmitSuccess(false);
    setUploading(true);

    const formData = new FormData();
    formData.append('title', newTitle);
    formData.append('price_crypto', newPrice);
    formData.append('deskripsi', newDesc || '');
    formData.append('voice_script', newVoiceScript || '');
    formData.append('status', newStatus);
    formData.append('kategori_idkategori', newCategory);

    // Pastikan key file gambar sesuai dengan yang diminta Laravel (biasanya 'gambar' atau 'image')
    if (selectedImage) {
      formData.append('gambar', selectedImage); 
    }

    // Perbaikan: Deteksi format ID User (sesuaikan dengan tabel Laravelmu, ini fallback aman)
    if (auth && auth.user) {
      const userId = auth.user.idUser || auth.user.id;
      formData.append('user_idUser', userId);
    }

    const isUpdate = Boolean(editingProduct && editingProduct.idproduk);
    const url = isUpdate ? `/api/produk/${editingProduct.idproduk}` : '/api/produk';
    
    if (isUpdate) {
      formData.append('_method', 'PUT'); // Spoofing method Laravel untuk form multipart
    }

    try {
      // Setup Headers: Tambahkan Authorization jika menggunakan token (Sanctum/Passport)
      const requestHeaders = {
        'Accept': 'application/json',
      };
      
      // Mengambil CSRF dari meta tag jika ada (untuk web session Laravel)
      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
      if (csrfToken) {
        requestHeaders['X-CSRF-TOKEN'] = csrfToken;
      }

      // Jika auth kamu menyimpan token (misal auth.token), wajib dilampirkan agar tidak ditolak backend (401)
      if (auth && auth.token) {
        requestHeaders['Authorization'] = `Bearer ${auth.token}`;
      }

      const response = await fetch(url, {
        method: 'POST', // WAJIB POST jika bawa file (FormData)
        credentials: 'include',
        headers: requestHeaders, // JANGAN set Content-Type secara manual, biar browser yang atur boundary-nya!
        body: formData,
      });

      // Perbaikan: Tangkap kemungkinan error parsing (misal server error return HTML 500)
      let data;
      try {
        data = await response.json();
      } catch (err) {
        throw new Error("Server tidak merespon dalam format JSON (Cek Terminal/Log Laravel).");
      }

      if (response.ok) {
        const successMessage = isUpdate ? `Karya "${newTitle}" berhasil diperbarui.` : `Karya baru "${newTitle}" sukses dicetak & masuk database!`;
        let savedProduct = data.produk || data.data || data;

        if (!isUpdate && selectedImage && savedProduct?.idproduk) {
          try {
            setNotifications([
              { id: Date.now(), text: 'Mengunggah file ke IPFS...', type: 'info', read: false },
              ...notifications,
            ]);

            // Switch ke chain yang dipilih user sebelum mint
            const chosenChain = CHAIN_OPTIONS.find(c => c.id === selectedChain);
            if (chosenChain && typeof window.ethereum !== 'undefined') {
              try {
                await window.ethereum.request({
                  method: 'wallet_switchEthereumChain',
                  params: [{ chainId: chosenChain.hexId }],
                });
              } catch (switchErr) {
                if (switchErr?.code === 4902 && chosenChain.rpc) {
                  await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [{
                      chainId: chosenChain.hexId,
                      chainName: chosenChain.name,
                      nativeCurrency: { name: chosenChain.symbol, symbol: chosenChain.symbol, decimals: 18 },
                      rpcUrls: [chosenChain.rpc],
                      blockExplorerUrls: [chosenChain.explorer],
                    }],
                  });
                } else {
                  throw new Error(`Gagal switch ke ${chosenChain.name}: ${switchErr?.message}`);
                }
              }
            }

            const assetUpload = await uploadAssetToIpfs(selectedImage, newTitle);
            const metadataUpload = await uploadMetadataToIpfs({
              name: newTitle,
              description: newDesc || '',
              image_cid: assetUpload.cid,
              attributes: [
                { trait_type: 'category_id', value: String(newCategory) },
                { trait_type: 'status', value: String(newStatus) },
                { trait_type: 'chain_id', value: String(selectedChain) },
                { trait_type: 'chain_name', value: chosenChain?.name ?? 'unknown' },
              ],
            });

            const shouldListOnMint = String(newStatus || '').toLowerCase() === 'listing';
            const mintResult = await mintNftOnChain(metadataUpload.ipfs_uri, newPrice, shouldListOnMint, selectedChain);

            const linkedNftResponse = await linkNftToProduct({
              produk_idproduk: savedProduct.idproduk,
              token_id: String(mintResult.tokenId ?? ''),
              contract_address: mintResult.contractAddress,
              metadata_url: metadataUpload.ipfs_uri,
            });

            savedProduct = {
              ...savedProduct,
              nft: linkedNftResponse?.nft || {
                token_id: String(mintResult.tokenId ?? ''),
                contract_address: mintResult.contractAddress,
                metadata_url: metadataUpload.ipfs_uri,
                produk_idproduk: savedProduct.idproduk,
              },
            };

            setNotifications((prev) => [
              {
                id: Date.now() + 1,
                text: `NFT on-chain berhasil di-mint${shouldListOnMint ? ' dan langsung di-list' : ''}. Token ID: ${mintResult.tokenId ?? 'N/A'}`,
                type: 'success',
                read: false,
              },
              ...prev,
            ]);
          } catch (chainError) {
            console.error('On-chain mint flow error:', chainError);
            setNotifications((prev) => [
              {
                id: Date.now() + 2,
                text: `Produk tersimpan, tetapi mint on-chain gagal: ${chainError.message}`,
                type: 'warning',
                read: false,
              },
              ...prev,
            ]);
            alert(`Produk tersimpan, tetapi mint on-chain gagal: ${chainError.message}`);
          }
        } else if (isUpdate && editingProduct?.nft?.token_id) {
          try {
            const tokenId = editingProduct.nft.token_id;
            const oldStatus = String(editingProduct.status || 'listing').toLowerCase();
            const newStatusValue = String(newStatus || oldStatus).toLowerCase();

            if (oldStatus === 'listing' && newStatusValue === 'listing') {
              await updateListingPriceOnChain(tokenId, newPrice, selectedChain);
              setNotifications((prev) => [
                {
                  id: Date.now() + 3,
                  text: `Listing on-chain berhasil diperbarui untuk token #${tokenId}.`,
                  type: 'success',
                  read: false,
                },
                ...prev,
              ]);
            } else if (oldStatus === 'unlisted' && newStatusValue === 'listing') {
              await listTokenOnChain(tokenId, newPrice, selectedChain);
              setNotifications((prev) => [
                {
                  id: Date.now() + 3,
                  text: `Token #${tokenId} berhasil di-list lagi on-chain.`,
                  type: 'success',
                  read: false,
                },
                ...prev,
              ]);
            } else if (oldStatus === 'listing' && newStatusValue === 'unlisted') {
              await cancelListingOnChain(tokenId, selectedChain);
              setNotifications((prev) => [
                {
                  id: Date.now() + 3,
                  text: `Token #${tokenId} berhasil di-unlist on-chain.`,
                  type: 'success',
                  read: false,
                },
                ...prev,
              ]);
            }
          } catch (chainError) {
            console.error('Chain update failed:', chainError);
            setNotifications((prev) => [
              {
                id: Date.now() + 4,
                text: `Data produk tersimpan, tapi update on-chain gagal: ${chainError.message}`,
                type: 'warning',
                read: false,
              },
              ...prev,
            ]);
            alert(`Data produk tersimpan, tapi update on-chain gagal: ${chainError.message}`);
          }
        }
        
        if (typeof onProductAdded === 'function') {
          onProductAdded(savedProduct);
        }

        setNotifications([
          { id: Date.now(), text: successMessage, type: "success", read: false },
          ...notifications
        ]);

        setSubmitSuccess(true);
        setNewTitle('');
        setNewPrice('');
        setNewDesc('');
        setNewVoiceScript('');
        setNewStatus('listing');
        setNewCategory(categories.length > 0 ? categories[0].idkategori : '');
        setSelectedImage(null);
        setImagePreview('');
        setEditingProduct(null);
        alert(successMessage);

      } else {
        // Perbaikan: Tangkap pesan error spesifik dari Laravel (Error 422 Validation)
        if (response.status === 422 && data.errors) {
          const errorMessages = Object.values(data.errors).flat().join('\n- ');
          alert(`GAGAL MENYIMPAN! Cek input form Anda:\n- ${errorMessages}`);
        } else {
          alert(data.message || "Gagal menyimpan produk ke backend.");
        }
      }
    } catch (err) {
      console.error("Error upload produk:", err);
      const message = err?.message || 'Terjadi error sistem saat mengunggah aset.';
      setSubmitError(message);
      setSubmitSuccess(false);
      alert(`Terjadi error sistem: ${message}`);
    } finally {
      setUploading(false);
    }
  };

  const unreadNotifCount = notifications.filter(n => !n.read).length;

  const sidebarActions = [
    {
      id: 'add-art',
      label: 'Tambah Karya',
      icon: Plus,
      onClick: () => {
        setEditingProduct(null);
        setNewTitle('');
        setNewPrice('');
        setNewDesc('');
        setNewVoiceScript('');
        setImagePreview('');
        setSelectedImage(null);
        setIsModalOpen(true);
      },
    },
    {
      id: 'chat',
      label: 'Chat',
      icon: MessageSquare,
      onClick: () => {
        setIsChatSidebarOpen(true);
      },
    },
    {
      id: 'liked',
      label: 'Disukai',
      icon: Heart,
      onClick: () => {
        navigateTo('dashboard-liked');
      },
    },
    {
      id: 'activity',
      label: 'Aktivitas',
      icon: Bell,
      onClick: () => {
        navigateTo('dashboard-activity');
        setShowProductSortMenu(false);
        setShowCollectionSortMenu(false);
      },
    },
    {
      id: 'finance',
      label: 'Pendapatan',
      icon: DollarSign,
      onClick: () => {
        navigateTo('dashboard-finance');
        setShowProductSortMenu(false);
        setShowCollectionSortMenu(false);
      },
    },
  ];

  const sortedMyProducts = useMemo(() => {
    const getSortValue = (item, mode = 'product') => {
      const dateCandidates = mode === 'purchase'
        ? [item?.purchased_at, item?.created_at, item?.updated_at, item?.tanggal]
        : [item?.updated_at, item?.created_at, item?.tanggal];

      for (const candidate of dateCandidates) {
        const parsed = new Date(candidate || 0).getTime();
        if (Number.isFinite(parsed) && parsed > 0) {
          return parsed;
        }
      }

      const numericCandidates = mode === 'purchase'
        ? [item?.transaction_sequence, item?.transaction_id, item?.idtransaksi, item?.idproduk, item?.id]
        : [item?.idproduk, item?.id];

      for (const candidate of numericCandidates) {
        const numeric = Number(candidate || 0);
        if (Number.isFinite(numeric) && numeric > 0) {
          return numeric;
        }
      }

      return 0;
    };

    return [...(myProducts || [])].sort((a, b) => {
      const aValue = getSortValue(a, 'product');
      const bValue = getSortValue(b, 'product');
      return recentSort === 'oldest' ? aValue - bValue : bValue - aValue;
    });
  }, [myProducts, recentSort]);

  const sortedPurchasedProducts = useMemo(() => {
    const getPurchaseSortValue = (item) => {
      const dateCandidates = [item?.purchased_at, item?.created_at, item?.updated_at, item?.tanggal];
      for (const candidate of dateCandidates) {
        const parsed = new Date(candidate || 0).getTime();
        if (Number.isFinite(parsed) && parsed > 0) {
          return parsed;
        }
      }

      const numericCandidates = [item?.transaction_sequence, item?.transaction_id, item?.idtransaksi, item?.idproduk, item?.id];
      for (const candidate of numericCandidates) {
        const numeric = Number(candidate || 0);
        if (Number.isFinite(numeric) && numeric > 0) {
          return numeric;
        }
      }

      return 0;
    };

    return [...(purchasedProducts || [])].sort((a, b) => {
      const aValue = getPurchaseSortValue(a);
      const bValue = getPurchaseSortValue(b);
      return collectionSort === 'oldest' ? aValue - bValue : bValue - aValue;
    });
  }, [purchasedProducts, collectionSort]);

  const normalizeText = (value) => (value || '').toString().toLowerCase();

  const getProductCategoryText = (product) => {
    const candidates = [
      product?.canonicalLabel,
      product?.kategori?.canonicalLabel,
      product?.category?.canonicalLabel,
      product?.kategori?.name,
      product?.kategori?.nama,
      product?.category_name,
      product?.category,
      product?.nama_kategori,
      product?.kategori_name,
    ];

    return candidates.find((text) => typeof text === 'string' && text.trim()) || '';
  };

  const musicProducts = useMemo(() => {
    return sortedMyProducts.filter((product) => {
      const haystack = [
        getProductCategoryText(product),
        product?.voice_script,
        product?.title,
        product?.deskripsi,
      ]
        .map(normalizeText)
        .join(' ');

      return haystack.includes('musik') || haystack.includes('suara') || haystack.includes('audio');
    });
  }, [sortedMyProducts]);

  const videoProducts = useMemo(() => {
    return sortedMyProducts.filter((product) => {
      const haystack = [
        getProductCategoryText(product),
        product?.title,
        product?.deskripsi,
        product?.video_url,
        product?.asset_type,
        product?.mime_type,
      ]
        .map(normalizeText)
        .join(' ');

      return (
        haystack.includes('video') ||
        haystack.includes('mp4') ||
        haystack.includes('mov') ||
        haystack.includes('webm')
      );
    });
  }, [sortedMyProducts]);

  const renderOwnedProductGrid = (products, emptyMessage) => {
    if (products.length === 0) {
      return (
        <div className="p-12 text-center border-4 border-dashed border-neutral-300 text-neutral-400 font-black text-xs uppercase tracking-widest bg-neutral-50 rounded-xl">
          {emptyMessage}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pt-1">
        {products.map((p, idx) => (
          <div key={p.idproduk || idx} className="bg-white border-3 border-neutral-950 p-2.5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between group hover:-translate-y-1 hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-all rounded-xl">
            <div className="border-2 border-neutral-950 aspect-4/3 bg-neutral-100 overflow-hidden relative">
              <img
                src={
                  p.image_url
                    ? (p.image_url.startsWith('/storage/') || p.image_url.startsWith('http') ? p.image_url : `/storage/${p.image_url}`)
                    : 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=400&q=80'
                }
                alt={p.title || 'Karya'}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <span className="absolute bottom-2 right-2 border-2 border-neutral-950 bg-emerald-400 px-2 py-0.5 text-[10px] font-black text-neutral-950 uppercase tracking-wider shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                {p.status || 'listing'}
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
                  onClick={() => openEditProduct(p)}
                  className="border border-neutral-950 px-2 py-1 text-[10px] font-black uppercase bg-neutral-50 hover:bg-neutral-200 cursor-pointer"
                >
                  Update
                </button>
                <button
                  onClick={() => onProductDeleted && onProductDeleted(p)}
                  className="border-2 border-red-500 text-red-500 px-2 py-0.5 text-[10px] font-black uppercase bg-white hover:bg-red-50 cursor-pointer"
                >
                  Cancel + Hapus
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="w-full min-h-screen bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.12),transparent_45%),linear-gradient(180deg,#f8fafc_0%,#f1f5f9_60%,#ecfeff_100%)] text-neutral-900 flex flex-col justify-between relative selection:bg-neutral-900 selection:text-white">
      
      {/* HEADER DASHBOARD */}
      <header className="bg-[linear-gradient(90deg,#020617_0%,#0b132b_45%,#111827_100%)] text-white px-4 py-2.5 md:px-6 flex justify-between items-center border-b-4 border-neutral-950 sticky top-0 z-40">
        <div onClick={() => navigateTo('marketplace')} className="font-black tracking-wider text-sm uppercase cursor-pointer hover:text-amber-400 transition">
          ART VIBES CREATIVE
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <button 
              onClick={() => {
                setShowNotifDropdown(!showNotifDropdown);
                setNotifications(notifications.map(n => ({ ...n, read: true })));
              }} 
              className="bg-neutral-800 hover:bg-neutral-700 text-white p-2 border-2 border-white text-xs font-mono font-bold flex items-center gap-1 cursor-pointer transition"
            >
              🔔 NOTIF {unreadNotifCount > 0 && <span className="bg-red-500 text-white px-1.5 rounded-full text-[10px]">{unreadNotifCount}</span>}
            </button>

            {showNotifDropdown && (
              <div className="absolute right-0 mt-3 w-80 bg-white text-neutral-950 border-4 border-neutral-950 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-2 z-50 font-mono text-xs">
                <div className="font-black border-b-2 border-neutral-950 pb-1 mb-2 uppercase tracking-tight">Pemberitahuan Sistem</div>
                <div className="space-y-1 max-h-60 overflow-y-auto">
                  {notifications.map(n => (
                    <div key={n.id} className="p-2 border border-neutral-200 bg-amber-50 text-neutral-900 text-[11px]">
                      {n.text}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <span className="bg-red-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 border-2 border-white">
            🔒 PANEL PRIVAT SAYA
          </span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-5 xl:pr-20 w-full flex-1 my-5 space-y-4 pb-36 md:pb-28 xl:pb-0">
        <aside className="hidden xl:flex fixed inset-y-0 right-0 z-30 h-dvh min-h-dvh w-14 flex-col items-center justify-between border-l border-white/10 bg-slate-950 p-3 shadow-[0_35px_60px_-30px_rgba(0,0,0,0.8)]">
          <div className="space-y-2 text-center pt-6">
            <div className="text-[9px] uppercase tracking-[0.45em] text-emerald-400 font-mono">Aksi</div>
            <div className="h-px w-full bg-white/10" />
          </div>

          <div className="flex flex-col items-center gap-3">
            {sidebarActions.map((item) => {
              const Icon = item.icon;
              const isActive = activePanelAction === item.id || (item.id === 'liked' && activeSubTab === 'disukai') || (item.id === 'activity' && activeSubTab === 'aktivitas');
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    item.onClick();
                    setActivePanelAction(item.id);
                  }}
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

        </aside>

        <div className="xl:hidden fixed bottom-3 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-1rem)] max-w-md rounded-2xl border-2 border-neutral-950 bg-white/95 backdrop-blur p-1.5 shadow-[0_8px_20px_rgba(0,0,0,0.25)]">
          <div className="grid grid-cols-5 gap-1.5">
            {sidebarActions.map((item) => {
              const Icon = item.icon;
              const isActive = activePanelAction === item.id;
              const mobileLabelMap = {
                'add-art': 'Tambah',
                'chat': 'Chat',
                'liked': 'Disuka',
                'activity': 'Aktiv',
                'finance': 'Dana',
              };
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    item.onClick();
                    setActivePanelAction(item.id);
                  }}
                  className={`inline-flex flex-col items-center justify-center gap-1 rounded-xl border px-1 py-1.5 text-[9px] font-black uppercase tracking-wider transition ${isActive ? 'border-neutral-950 bg-neutral-950 text-white' : 'border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-50'}`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="leading-none truncate max-w-full">{mobileLabelMap[item.id] || item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <button 
          onClick={() => navigateTo('marketplace')} 
          className="flex items-center gap-2 text-neutral-900 hover:text-neutral-600 font-black text-[11px] uppercase tracking-wider transition cursor-pointer"
        >
          &larr; Kembali ke Galeri Utama
        </button>

        {/* HERO CONTAINER DINAMIS */}
        <div className="relative overflow-hidden border-4 border-neutral-950 p-3 md:p-4 bg-[linear-gradient(135deg,#fefce8_0%,#ecfccb_46%,#d1fae5_100%)] shadow-[7px_7px_0px_0px_rgba(0,0,0,1)] rounded-2xl">
          <div
            className="pointer-events-none absolute inset-0 opacity-35"
            style={{
              backgroundImage: auth?.user?.profile_background
                ? `url('${auth.user.profile_background}')`
                : "url('https://images.unsplash.com/photo-1517292987719-0369a794ec0f?auto=format&fit=crop&w=1600&q=80')",
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.35)_0%,rgba(236,253,245,0.84)_60%,rgba(236,254,255,0.94)_100%)]" />
          <div className="pointer-events-none absolute -top-10 -left-10 h-28 w-28 rounded-full border-2 border-emerald-300/70 bg-emerald-100/60" />
          <div className="pointer-events-none absolute -bottom-12 -right-8 h-36 w-36 rounded-full border-2 border-cyan-300/70 bg-cyan-100/50" />

          <button
            type="button"
            onClick={() => navigateTo('profile')}
            className="absolute top-2.5 right-2.5 md:top-4 md:right-4 z-30 h-9 w-9 md:h-10 md:w-10 rounded-full border-2 border-neutral-950 bg-white text-neutral-900 flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-neutral-100 transition cursor-pointer"
            title="Edit Profil"
          >
            <Edit3 className="h-4 w-4" />
          </button>

          <div className="grid gap-3 md:gap-0 md:grid-cols-[minmax(0,1fr)_280px] items-stretch">
            <div className="relative z-10 border-2 border-neutral-950 bg-white/45 backdrop-blur-[1px] rounded-2xl md:rounded-r-none p-3.5 pr-12 md:p-4 md:pr-12">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 w-full min-w-0">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-4 border-neutral-950 shrink-0 bg-neutral-200 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] relative ring-2 ring-emerald-500/40">
                  <img
                    src={(auth && auth.user && auth.user.avatar) ? auth.user.avatar : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80"}
                    alt="avatar"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-lg sm:text-xl md:text-2xl font-black uppercase tracking-tight leading-tight">
                      {auth && auth.user ? auth.user.name : "KREATOR ART VIBES"}
                    </h1>
                    <span className="bg-neutral-950 text-white text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full">Studio Owner</span>
                  </div>
                  <p className="text-[11px] text-neutral-700 line-clamp-2">
                    {auth && auth.user ? auth.user.bio || 'Selamat datang di studio kreatif saya.' : 'Kreator seni digital profesional'}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-1.5">
                    <div className={`px-2 py-1 font-mono text-[10px] inline-block max-w-full truncate border-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${globalAddress || auth?.user?.wallet_address ? 'bg-emerald-50 border-emerald-600 text-emerald-800' : 'bg-neutral-100 border-neutral-950 text-neutral-700'}`}>
                      {globalAddress || auth?.user?.wallet_address
                        ? `Wallet: ${(globalAddress || auth.user.wallet_address).slice(0,8)}...${(globalAddress || auth.user.wallet_address).slice(-6)}`
                        : 'Wallet belum terhubung. Sambungkan dari menu profil kanan atas.'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pointer-events-none absolute right-0 top-0 hidden h-full w-16 border-l-2 border-neutral-950/20 bg-[linear-gradient(145deg,transparent_25%,rgba(15,23,42,0.1)_26%,rgba(15,23,42,0.1)_34%,transparent_35%)] md:block" />
            </div>

            <div className="relative z-10 rounded-2xl md:rounded-l-none p-3 md:p-4 flex flex-col items-center justify-center gap-3">
              <div className="pointer-events-none absolute -left-7 top-0 hidden h-full w-14 rotate-30 border-l-2 border-r-2 border-neutral-950/30 bg-white/30 md:block" />
              
              {walletNativeBalance !== null ? (
                <div className="text-center">
                  <p className="text-sm text-neutral-600 uppercase tracking-widest font-semibold mb-1">Saldo Wallet</p>
                  <div className="flex flex-col items-center gap-0.5">
                    {walletUsdBalance !== null ? (
                      <p className="text-3xl font-black text-neutral-950">${walletUsdBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    ) : (
                      <p className="text-xs uppercase tracking-widest text-neutral-500">Memuat nilai USD...</p>
                    )}
                    <p className="text-sm font-semibold text-neutral-700">{Number(walletNativeBalance).toFixed(3)} {selectedChainInfo?.id === 137 ? 'MATIC' : (selectedChainInfo?.symbol || '')}</p>
                  </div>
                </div>
              ) : null}
              
              <button
                onClick={() => {
                  setEditingProduct(null);
                  setNewTitle(''); setNewPrice(''); setNewDesc(''); setNewVoiceScript(''); setImagePreview(''); setSelectedImage(null);
                  setIsModalOpen(true);
                }}
                className="relative w-full md:w-auto rounded-full border-2 border-neutral-950 bg-neutral-950 hover:bg-neutral-800 text-white font-black text-xs uppercase tracking-[0.2em] transition cursor-pointer shadow-[4px_4px_0px_0px_rgba(16,185,129,1)] px-5 py-3 inline-flex items-center justify-center gap-2"
              >
                <span className="text-lg leading-none">+</span>
                <span>Tambah Karya</span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          <div className="rounded-xl border-2 border-neutral-950 bg-white px-3 py-2.5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <p className="text-[10px] uppercase tracking-widest text-neutral-500 font-black">Total Karya</p>
            <p className="text-lg font-black text-neutral-950">{myProducts.length}</p>
          </div>
          <div className="rounded-xl border-2 border-neutral-950 bg-white px-3 py-2.5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <p className="text-[10px] uppercase tracking-widest text-neutral-500 font-black">Koleksi</p>
            <p className="text-lg font-black text-neutral-950">{purchasedProducts.length}</p>
          </div>
          <div className="rounded-xl border-2 border-neutral-950 bg-white px-3 py-2.5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <p className="text-[10px] uppercase tracking-widest text-neutral-500 font-black">Pesan Baru</p>
            <p className="text-lg font-black text-neutral-950">{unreadCount}</p>
          </div>
          <div className="rounded-xl border-2 border-neutral-950 bg-white px-3 py-2.5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <p className="text-[10px] uppercase tracking-widest text-neutral-500 font-black">Status Studio</p>
            <p className="text-sm font-black text-emerald-700 uppercase">{followersCount} FOLLOWER</p>
          </div>
        </div>

        {/* TAB NAVIGATION */}
        <div className="relative z-20 border-b-2 border-neutral-300 pb-2">
          <div className="flex gap-2 overflow-x-auto">
            <div ref={productSortMenuRef} className="relative inline-flex shrink-0 items-stretch">
            <button 
              onClick={() => {
                setActiveSubTab('karya');
                setShowCollectionSortMenu(false);
              }}
              className={`w-52 px-4 py-2 border-2 border-neutral-950 font-black text-xs uppercase transition cursor-pointer text-center rounded-lg ${activeSubTab === 'karya' ? 'bg-neutral-950 text-white' : 'bg-white text-neutral-950 hover:bg-neutral-50'}`}
            >
              PRODUK SAYA ({myProducts.length})
            </button>
            <button
              ref={productSortTriggerRef}
              type="button"
              onClick={() => {
                setActiveSubTab('karya');
                setShowCollectionSortMenu(false);
                setShowProductSortMenu((prev) => !prev);
              }}
                className={`-ml-px inline-flex w-12 items-center justify-center px-2 py-2 border-2 border-neutral-950 transition cursor-pointer rounded-r-lg ${activeSubTab === 'karya' ? 'bg-neutral-950 text-white' : 'bg-white text-neutral-950 hover:bg-neutral-50'}`}
            >
              <ChevronDown className={`h-3.5 w-3.5 transition ${showProductSortMenu ? 'rotate-180' : ''}`} />
            </button>
            </div>
            <div ref={collectionSortMenuRef} className="relative inline-flex shrink-0 items-stretch">
              <button 
                onClick={() => {
                  setActiveSubTab('koleksi');
                  setShowProductSortMenu(false);
                }}
                className={`px-4 py-2 border-2 border-neutral-950 font-black text-xs uppercase transition cursor-pointer shrink-0 rounded-lg ${activeSubTab === 'koleksi' ? 'bg-neutral-950 text-white' : 'bg-white text-neutral-950 hover:bg-neutral-50'}`}
              >
                KOLEKSI PEMBELI
              </button>
              <button
                ref={collectionSortTriggerRef}
                type="button"
                onClick={() => {
                  setActiveSubTab('koleksi');
                  setShowProductSortMenu(false);
                  setShowCollectionSortMenu((prev) => !prev);
                }}
                className={`-ml-px inline-flex w-12 items-center justify-center px-2 py-2 border-2 border-neutral-950 transition cursor-pointer rounded-r-lg ${activeSubTab === 'koleksi' ? 'bg-neutral-950 text-white' : 'bg-white text-neutral-950 hover:bg-neutral-50'}`}
              >
                <ChevronDown className={`h-3.5 w-3.5 transition ${showCollectionSortMenu ? 'rotate-180' : ''}`} />
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setActiveSubTab('musik');
                setShowProductSortMenu(false);
                setShowCollectionSortMenu(false);
              }}
              className={`inline-flex items-center gap-1.5 px-4 py-2 border-2 border-neutral-950 font-black text-xs uppercase transition cursor-pointer shrink-0 rounded-lg ${activeSubTab === 'musik' ? 'bg-neutral-950 text-white' : 'bg-white text-neutral-950 hover:bg-neutral-50'}`}
            >
              <Music2 className="h-3.5 w-3.5" />
              MUSIK/SUARA ({musicProducts.length})
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveSubTab('video');
                setShowProductSortMenu(false);
                setShowCollectionSortMenu(false);
              }}
              className={`inline-flex items-center gap-1.5 px-4 py-2 border-2 border-neutral-950 font-black text-xs uppercase transition cursor-pointer shrink-0 rounded-lg ${activeSubTab === 'video' ? 'bg-neutral-950 text-white' : 'bg-white text-neutral-950 hover:bg-neutral-50'}`}
            >
              <Video className="h-3.5 w-3.5" />
              VIDEO ({videoProducts.length})
            </button>
          </div>
        </div>

        {showProductSortMenu && (
          <div
            ref={productSortDropdownRef}
            className="fixed z-9999 flex w-44 flex-col border-2 border-neutral-950 bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
            style={{ top: `${productSortMenuPosition.top}px`, left: `${productSortMenuPosition.left}px` }}
          >
            <button
              type="button"
              onClick={() => {
                setActiveSubTab('karya');
                setRecentSort('newest');
                setShowCollectionSortMenu(false);
                setShowProductSortMenu(false);
              }}
              className={`px-3 py-2 text-left text-[10px] font-black uppercase tracking-wider transition cursor-pointer ${recentSort === 'newest' ? 'bg-neutral-950 text-white' : 'bg-white text-neutral-950 hover:bg-neutral-50'}`}
            >
              Row Terbaru
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveSubTab('karya');
                setRecentSort('oldest');
                setShowCollectionSortMenu(false);
                setShowProductSortMenu(false);
              }}
              className={`border-t-2 border-neutral-950 px-3 py-2 text-left text-[10px] font-black uppercase tracking-wider transition cursor-pointer ${recentSort === 'oldest' ? 'bg-neutral-950 text-white' : 'bg-white text-neutral-950 hover:bg-neutral-50'}`}
            >
              Row Terlama
            </button>
          </div>
        )}

        {showCollectionSortMenu && (
          <div
            ref={collectionSortDropdownRef}
            className="fixed z-9999 flex w-44 flex-col border-2 border-neutral-950 bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
            style={{ top: `${collectionSortMenuPosition.top}px`, left: `${collectionSortMenuPosition.left}px` }}
          >
            <button
              type="button"
              onClick={() => {
                setActiveSubTab('koleksi');
                setCollectionSort('newest');
                setShowProductSortMenu(false);
                setShowCollectionSortMenu(false);
              }}
              className={`px-3 py-2 text-left text-[10px] font-black uppercase tracking-wider transition cursor-pointer ${collectionSort === 'newest' ? 'bg-neutral-950 text-white' : 'bg-white text-neutral-950 hover:bg-neutral-50'}`}
            >
              Row Terbaru
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveSubTab('koleksi');
                setCollectionSort('oldest');
                setShowProductSortMenu(false);
                setShowCollectionSortMenu(false);
              }}
              className={`border-t-2 border-neutral-950 px-3 py-2 text-left text-[10px] font-black uppercase tracking-wider transition cursor-pointer ${collectionSort === 'oldest' ? 'bg-neutral-950 text-white' : 'bg-white text-neutral-950 hover:bg-neutral-50'}`}
            >
              Row Terlama
            </button>
          </div>
        )}

        {/* TAB CONTENT: KARYA */}
        {activeSubTab === 'karya' && (
          renderOwnedProductGrid(sortedMyProducts, 'Studio Anda masih kosong. Silakan tambahkan karya NFT pertama Anda!')
        )}

        {/* TAB MUSIK/SUARA */}
        {activeSubTab === 'musik' && (
          renderOwnedProductGrid(musicProducts, 'Belum ada karya kategori musik/suara di studio Anda.')
        )}

        {/* TAB VIDEO */}
        {activeSubTab === 'video' && (
          renderOwnedProductGrid(videoProducts, 'Belum ada karya kategori video di studio Anda.')
        )}

        {/* TAB KOLEKSI PEMBELI */}
        {activeSubTab === 'koleksi' && (
          purchasedProducts.length === 0 ? (
            <div className="p-12 text-center border-4 border-dashed border-neutral-300 text-neutral-400 font-black text-xs uppercase tracking-widest bg-neutral-50">
              Belum ada koleksi terjual yang ditransfer.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pt-1">
              {sortedPurchasedProducts.map((p, idx) => (
                <div key={p.idproduk || idx} className="bg-white border-3 border-neutral-950 p-2.5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between rounded-xl hover:-translate-y-1 hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-all">
                  <div className="border-2 border-neutral-950 aspect-4/3 bg-neutral-100 overflow-hidden relative">
                    <img
                      src={
                        p.image_url
                          ? (p.image_url.startsWith('/storage/') || p.image_url.startsWith('http') ? p.image_url : `/storage/${p.image_url}`)
                          : 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=400&q=80'
                      }
                      alt={p.title || 'Koleksi'}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-2 right-2 border-2 border-neutral-950 bg-amber-300 px-2 py-0.5 text-[10px] font-black text-neutral-950 uppercase tracking-wider shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                      {p.status || 'unlisted'}
                    </span>
                  </div>
                  <div className="pt-2.5 space-y-1.5">
                    <div className="flex justify-between items-start gap-1">
                      <h3 className="font-black text-[13px] truncate uppercase tracking-tight w-3/4">{p.title || 'Karya Digital'}</h3>
                      <span className="font-mono text-xs bg-neutral-950 text-amber-400 px-1.5 py-0.5 shrink-0 font-bold">{p.transaction_amount || p.price_crypto || '0'} {marketCurrencySymbol}</span>
                    </div>
                    <p className="text-[11px] text-neutral-500 line-clamp-1 italic">"{p.deskripsi || 'No description available.'}"</p>
                    <div className="border-t-2 border-dashed border-neutral-200 pt-2 flex justify-end gap-1">
                      <button
                        onClick={() => openEditProduct(p)}
                        className="border border-neutral-950 px-2 py-1 text-[10px] font-black uppercase bg-amber-300 hover:bg-amber-400 cursor-pointer"
                      >
                        Jual Kembali
                      </button>
                      <button
                        onClick={() => navigateTo('product-detail', p)}
                        className="border border-neutral-950 px-2 py-1 text-[10px] font-black uppercase bg-neutral-50 hover:bg-neutral-200 cursor-pointer"
                      >
                        Detail
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* TAB DISUKAI */}
        {activeSubTab === 'disukai' && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 pb-3 mb-4">
              <div>
                <h3 className="text-lg font-black uppercase tracking-wider text-neutral-900">Disukai Saya</h3>
                <p className="text-[12px] text-neutral-600">Pilih antara produk favorit dan karya yang sudah disematkan.</p>
              </div>
              <div className="inline-flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setFavoritesView('liked')}
                  className={`px-4 py-2 border-2 font-black text-xs uppercase tracking-wider rounded-lg transition ${favoritesView === 'liked' ? 'bg-neutral-950 text-white border-neutral-950' : 'bg-white text-neutral-950 border-neutral-950 hover:bg-neutral-50'}`}
                >
                  Disukai ({likedProductsData.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFavoritesView('pinned')}
                  className={`px-4 py-2 border-2 font-black text-xs uppercase tracking-wider rounded-lg transition ${favoritesView === 'pinned' ? 'bg-neutral-950 text-white border-neutral-950' : 'bg-white text-neutral-950 border-neutral-950 hover:bg-neutral-50'}`}
                >
                  Disematkan ({pinnedProductsData.length})
                </button>
              </div>
            </div>

            {favoritesView === 'liked' ? (
              loadingLikedProducts ? (
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
                              ? (p.image_url.startsWith('/storage/') || p.image_url.startsWith('http') ? p.image_url : `/storage/${p.image_url}`)
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
                            onClick={() => navigateTo('product-detail', p)}
                            className="border border-neutral-950 px-2 py-1 text-[10px] font-black uppercase bg-neutral-50 hover:bg-neutral-200 cursor-pointer"
                          >
                            Detail
                          </button>
                          <button
                            onClick={() => setFavoritesView('pinned')}
                            className="border border-neutral-950 px-2 py-1 text-[10px] font-black uppercase bg-emerald-100 hover:bg-emerald-200 cursor-pointer"
                          >
                            Lihat Disematkan
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              loadingPinnedProducts ? (
                <div className="p-12 text-center border-4 border-dashed border-neutral-300 text-neutral-500 font-black text-xs uppercase tracking-widest bg-neutral-50 rounded-xl">
                  Memuat produk yang disematkan...
                </div>
              ) : pinnedProductsData.length === 0 ? (
                <div className="p-12 text-center border-4 border-dashed border-neutral-300 text-neutral-400 font-black text-xs uppercase tracking-widest bg-neutral-50 rounded-xl">
                  Belum ada produk yang disematkan. Gunakan tombol sematkan di Explore untuk menambahkan.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pt-1">
                  {pinnedProductsData.map((p, idx) => (
                    <div key={p.idproduk || p.id || idx} className="bg-white border-3 border-neutral-950 p-2.5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between rounded-xl hover:-translate-y-1 hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-all">
                      <div className="border-2 border-neutral-950 aspect-4/3 bg-neutral-100 overflow-hidden relative">
                        <img
                          src={
                            p.image_url
                              ? (p.image_url.startsWith('/storage/') || p.image_url.startsWith('http') ? p.image_url : `/storage/${p.image_url}`)
                              : 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=400&q=80'
                          }
                          alt={p.title || 'Produk Disematkan'}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute bottom-2 right-2 border-2 border-neutral-950 bg-emerald-200 px-2 py-0.5 text-[10px] font-black text-neutral-950 uppercase tracking-wider shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                          Disematkan
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
                            onClick={() => navigateTo('product-detail', p)}
                            className="border border-neutral-950 px-2 py-1 text-[10px] font-black uppercase bg-neutral-50 hover:bg-neutral-200 cursor-pointer"
                          >
                            Detail
                          </button>
                          <button
                            onClick={() => setFavoritesView('liked')}
                            className="border border-neutral-950 px-2 py-1 text-[10px] font-black uppercase bg-neutral-50 hover:bg-neutral-200 cursor-pointer"
                          >
                            Lihat Disukai
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </>
        )}

        {/* TAB DATA PENDAPATAN */}
        {activeSubTab === 'keuangan' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 bg-white border-4 border-neutral-950 p-3.5 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider">Grafik Penjualan (12 Bulan)</h3>
                  <p className="text-[11px] text-neutral-500">Rekap mockup tren penjualan berdasarkan data koleksi pembeli.</p>
                </div>
                    <div className="text-[11px] font-mono text-neutral-600">Total: <span className="font-black">{financeAnalytics.smallStats.totalRevenue} {marketCurrencySymbol}</span></div>
              </div>

              {/* Simple SVG line chart */}
              <div className="w-full h-48 bg-neutral-50 border-2 border-neutral-200 p-2">
                <svg viewBox="0 0 120 40" preserveAspectRatio="none" className="w-full h-full">
                  <defs>
                    <linearGradient id="grad" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#fde68a" stopOpacity="0.6" />
                      <stop offset="100%" stopColor="#f97316" stopOpacity="0.1" />
                    </linearGradient>
                  </defs>
                  {/* area */}
                  <polyline fill="url(#grad)" stroke="none" points={financeAnalytics.months.map((m, i) => `${(i/(Math.max(financeAnalytics.months.length - 1, 1)))*120},${40 - (m.value / (Math.max(...financeAnalytics.months.map(x=>x.value),1)))*36}`).join(' ')} />
                  {/* line */}
                  <polyline fill="none" stroke="#111827" strokeWidth="0.8" points={financeAnalytics.months.map((m, i) => `${(i/(Math.max(financeAnalytics.months.length - 1, 1)))*120},${40 - (m.value / (Math.max(...financeAnalytics.months.map(x=>x.value),1)))*36}`).join(' ')} />
                  {/* markers */}
                  {financeAnalytics.months.map((m, i) => (
                    <circle key={i} cx={(i/(Math.max(financeAnalytics.months.length - 1, 1)))*120} cy={40 - (m.value / (Math.max(...financeAnalytics.months.map(x=>x.value),1)))*36} r="0.8" fill="#111827" />
                  ))}
                </svg>
              </div>

              {/* Recent transactions */}
              <div className="mt-3">
                <h4 className="text-xs font-black uppercase tracking-wider mb-2">Transaksi Terakhir</h4>
                <div className="bg-neutral-50 border-2 border-neutral-200 p-3">
                  {financeAnalytics.recent.length === 0 ? (
                    <div className="text-[11px] text-neutral-500">Belum ada transaksi untuk ditampilkan di mockup ini.</div>
                  ) : (
                    <ul className="space-y-2 text-[12px]">
                      {financeAnalytics.recent.map(tx => (
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

            <aside className="bg-white border-4 border-neutral-950 p-3.5 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] space-y-3">
              <div>
                <h4 className="text-xs text-neutral-600 uppercase tracking-widest">KPI Ringkas</h4>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <div className="p-3 bg-amber-50 border border-amber-300">
                    <div className="text-[10px] text-neutral-600">Total Pendapatan</div>
                    <div className="text-lg font-black">{financeAnalytics.smallStats.totalRevenue} {marketCurrencySymbol}</div>
                  </div>
                  <div className="p-3 bg-emerald-50 border border-emerald-300">
                    <div className="text-[10px] text-neutral-600">Total Penjualan</div>
                    <div className="text-lg font-black">{financeAnalytics.smallStats.totalSales}</div>
                  </div>
                  <div className="p-3 bg-neutral-50 border border-neutral-200">
                    <div className="text-[10px] text-neutral-600">Rata-rata Harga</div>
                    <div className="text-lg font-black">{financeAnalytics.smallStats.avgPrice} {marketCurrencySymbol}</div>
                  </div>
                  <div className="p-3 bg-neutral-50 border border-neutral-200">
                    <div className="text-[10px] text-neutral-600">Top Bulan</div>
                    <div className="text-lg font-black">{financeAnalytics.smallStats.topMonthValue} {marketCurrencySymbol}</div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs text-neutral-600 uppercase tracking-widest">Distribusi Kategori (Mock)</h4>
                <div className="flex items-center justify-center py-2">
                  {/* simple donut */}
                  <svg viewBox="0 0 32 32" className="w-28 h-28">
                    <circle r="10" cx="16" cy="16" fill="transparent" stroke="#fde68a" strokeWidth="10" strokeDasharray="25 75" transform="rotate(-90 16 16)"/>
                    <circle r="10" cx="16" cy="16" fill="transparent" stroke="#f97316" strokeWidth="10" strokeDasharray="15 85" transform="rotate(-90 16 16)"/>
                  </svg>
                </div>
                <div className="text-[11px] mt-2">
                  <div className="flex items-center gap-2"><span className="w-3 h-3 bg-amber-300 inline-block" /> <span>Image / Digital</span></div>
                  <div className="flex items-center gap-2 mt-1"><span className="w-3 h-3 bg-orange-500 inline-block" /> <span>Musik / Suara</span></div>
                </div>
              </div>
            </aside>
          </div>
        )}

        {/* TAB AKTIVITAS */}
        {activeSubTab === 'aktivitas' && (
          <DashboardActivityPage
            unreadCount={unreadNotifCount}
            notifications={[...notifications].sort((a, b) => Number(b.id || 0) - Number(a.id || 0))}
            myProductsCount={myProducts.length}
            purchasedCount={purchasedProducts.length}
            recentProducts={sortedMyProducts.slice(0, 6)}
            recentPurchases={sortedPurchasedProducts.slice(0, 6)}
            onOpenChat={() => setIsChatSidebarOpen(true)}
            onGoExplore={() => navigateTo('explore')}
            walletAddress={globalAddress || auth?.user?.wallet_address || ''}
          />
        )}

      </main>

      {/* POP-UP MODAL TAMBAH & EDIT KARYA */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-neutral-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          {uploading ? (
            <div className="relative h-48 w-48 overflow-visible">
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-20 w-20 rounded-full bg-sky-400/10 blur-2xl animate-pulse" />

              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-sky-300 shadow-[0_0_22px_rgba(125,211,252,0.95)]" />

              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-18 w-18 rounded-full border border-cyan-300/45 animate-spin [animation-duration:3.4s]">
                <span className="absolute -top-1 left-1/2 -translate-x-1/2 h-2.5 w-2.5 rounded-full bg-sky-300 shadow-[0_0_12px_rgba(125,211,252,0.9)]" />
              </div>

              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-28 w-28 rounded-full border border-sky-400/30 animate-spin [animation-duration:5.2s] [animation-direction:reverse]">
                <span className="absolute -top-1 left-1/2 -translate-x-1/2 h-2.5 w-2.5 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,0.9)]" />
              </div>

              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-36 w-36 rounded-full border border-blue-400/25 animate-spin [animation-duration:8s]">
                <span className="absolute -top-1 left-1/2 -translate-x-1/2 h-2.5 w-2.5 rounded-full bg-blue-300 shadow-[0_0_14px_rgba(147,197,253,0.95)]" />
              </div>
            </div>
          ) : (
          <div className="bg-white border-4 border-neutral-950 w-full max-w-4xl p-4 sm:p-5 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative my-auto max-h-[88vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 bg-red-500 text-white border-2 border-neutral-950 font-black p-1.5 text-xs uppercase hover:bg-red-600 transition cursor-pointer z-50"
            >
              ✕ Tutup
            </button>

            <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight mb-3 border-b-4 border-neutral-950 pb-2 bg-neutral-950 text-white -mx-4 sm:-mx-5 -mt-4 sm:-mt-5 p-3.5">
              {editingProduct ? "📝 PERBARUI METADATA MAHA KARYA" : "🆕 UNGGAH MAHA KARYA BARU KE CLOUD & NFT"}
            </h2>

            {submitSuccess ? (
              <div className="bg-emerald-50 border-4 border-emerald-600 p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-neutral-950">
                <div className="text-2xl font-black uppercase mb-4">Berhasil!</div>
                <p className="text-[12px] mb-6">Aset Anda telah berhasil disimpan dan diproses. Silakan tutup jendela ini untuk kembali ke dashboard.</p>
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setSubmitSuccess(false);
                  }}
                  className="w-full bg-neutral-950 text-white font-black uppercase text-xs tracking-widest py-3 border-2 border-neutral-950"
                >
                  Tutup
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateProduct} className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-1">
                {submitError && (
                  <div className="lg:col-span-2 bg-red-50 border-2 border-red-400 text-red-800 p-2.5 text-xs rounded-md">
                    <div className="font-black uppercase tracking-wider mb-1">Terjadi Kesalahan</div>
                    <div>{submitError}</div>
                  </div>
                )}

                <div className="space-y-2.5">
                  <label className="block text-[11px] font-black uppercase tracking-wider">Step 1: File Media Digital</label>
                  <div className="border-2 border-dashed border-neutral-400 p-3 bg-[linear-gradient(180deg,#f7f7f7_0%,#f1f1f1_100%)] rounded-lg flex flex-col items-center justify-center min-h-52 text-center relative group">
                    {imagePreview ? (
                      <div className="w-full h-full space-y-1.5 z-10 pointer-events-none">
                        <img src={imagePreview} alt="Preview" className="max-h-44 mx-auto border-2 border-neutral-950 object-contain bg-white" />
                        <p className="text-[10px] text-emerald-600 font-bold uppercase">✓ File Gambar Ter-inject</p>
                      </div>
                    ) : (
                      <div className="space-y-2 pointer-events-none">
                        <div className="w-14 h-14 rounded-full border-2 border-neutral-950 flex items-center justify-center mx-auto bg-amber-100 group-hover:bg-amber-200 transition">
                          <span className="text-xl font-black">+</span>
                        </div>
                        <div className="space-y-1">
                          <p className="font-extrabold text-xs uppercase">Pilih Gambar / Desain</p>
                          <p className="text-[10px] text-neutral-400 font-mono">PNG, JPG, JPEG, WEBP (Max 10MB)</p>
                        </div>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="absolute inset-0 opacity-0 cursor-pointer z-20"
                      required={!imagePreview}
                    />
                  </div>
                  {imagePreview && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedImage(null);
                        setImagePreview('');
                      }}
                      className="w-full bg-neutral-100 hover:bg-neutral-200 text-neutral-950 text-[10px] font-black uppercase py-1.5 border border-neutral-400 transition"
                    >
                      Ganti Gambar
                    </button>
                  )}

                  <div className="border-2 border-neutral-950 bg-white p-2.5 rounded-lg shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                    <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-2">Chain Target Mint</p>
                    <div className="flex items-center gap-2.5">
                      <div className={`w-12 h-12 rounded-full border-2 border-neutral-950 flex items-center justify-center font-black text-[11px] ${selectedChainInfo.logoBg} ${selectedChainInfo.logoText}`}>
                        {selectedChainInfo.symbol}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-black uppercase tracking-wide text-neutral-900 truncate">{selectedChainInfo.short}</p>
                        <p className="text-[10px] text-neutral-600 font-mono truncate">{selectedChainInfo.name}</p>
                      </div>
                    </div>
                    <div className="mt-2 border-t border-dashed border-neutral-300 pt-2 text-[10px] font-mono space-y-1 text-neutral-700">
                      <p>Chain ID: {selectedChainInfo.id} ({selectedChainInfo.hexId})</p>
                      <p>Explorer: {selectedChainInfo.explorer}</p>
                      <p className={selectedChainInfo.testnet ? 'text-amber-700' : 'text-emerald-700'}>
                        {selectedChainInfo.testnet ? 'Testnet aktif: biaya murah untuk testing.' : 'Mainnet aktif: transaksi bernilai nyata.'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col justify-between space-y-3">
                  <div className="space-y-2.5">
                    <label className="block text-[11px] font-black uppercase tracking-wider">Step 2: Atribut & Naskah Suara</label>

                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase text-neutral-500">Judul Karya *</span>
                      <input
                        type="text"
                        placeholder="CONTOH: SKETSA NAFSU DAN AKAL"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        className="w-full border-2 border-neutral-950 px-2.5 py-1.5 font-mono text-xs focus:bg-amber-50 outline-none"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase text-neutral-500">Kategori Karya *</span>
                      <select
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        className="w-full border-2 border-neutral-950 px-2.5 py-1.5 font-mono text-xs bg-white outline-none focus:bg-amber-50"
                        required
                        disabled={loadingCategories}
                      >
                        <option value="">-- Pilih Kategori --</option>
                        {categories.map((cat) => {
                          const optionLabel = cat.canonicalLabel || cat.name || cat.nama;
                          return (
                            <option key={cat.idkategori} value={cat.idkategori}>
                              {optionLabel}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase text-neutral-500">Harga (Crypto {marketCurrencySymbol}) *</span>
                        <input
                          type="number"
                          step="0.001"
                          placeholder="0.5"
                          value={newPrice}
                          onChange={(e) => setNewPrice(e.target.value)}
                          className="w-full border-2 border-neutral-950 px-2.5 py-1.5 font-mono text-xs focus:bg-amber-50 outline-none"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase text-neutral-500">Status Awal</span>
                        <select
                          value={newStatus}
                          onChange={(e) => setNewStatus(e.target.value)}
                          className="w-full border-2 border-neutral-950 px-2.5 py-1.5 font-mono text-xs bg-white outline-none"
                        >
                          <option value="listing">listing</option>
                          <option value="unlisted">unlisted</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase text-neutral-500">Deskripsi Filosofi Aset</span>
                      <textarea
                        placeholder="Ceritakan makna visual karya ini..."
                        rows="2"
                        value={newDesc}
                        onChange={(e) => setNewDesc(e.target.value)}
                        className="w-full border-2 border-neutral-950 px-2.5 py-1.5 font-mono text-xs focus:bg-amber-50 outline-none"
                      ></textarea>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase text-neutral-500">Naskah Suara (Voice Script untuk AI Salesman)</span>
                      <textarea
                        placeholder="Teks ucapan otomatis saat calon pembeli melihat karya ini..."
                        rows="2"
                        value={newVoiceScript}
                        onChange={(e) => setNewVoiceScript(e.target.value)}
                        className="w-full border-2 border-neutral-950 px-2.5 py-1.5 font-mono text-xs focus:bg-amber-50 outline-none bg-neutral-50"
                      ></textarea>
                    </div>

                    <div className="space-y-1 border-2 border-amber-400 bg-amber-50 p-2.5 rounded-lg">
                      <span className="text-[10px] font-bold uppercase text-neutral-700">⛓️ Network Blockchain untuk Mint</span>
                      <select
                        value={selectedChain}
                        onChange={(e) => setSelectedChain(Number(e.target.value))}
                        className="w-full border-2 border-neutral-950 px-2.5 py-1.5 font-mono text-xs bg-white outline-none focus:bg-amber-50"
                      >
                        {CHAIN_OPTIONS.map((chain) => (
                          <option key={chain.id} value={chain.id}>
                            {chain.name} ({chain.symbol}) {chain.testnet ? 'Testnet' : 'Mainnet'}
                          </option>
                        ))}
                      </select>
                      <p className="text-[9px] text-neutral-500 font-mono">
                        {CHAIN_OPTIONS.find((c) => c.id === selectedChain)?.testnet
                          ? 'Testnet aktif: biaya murah untuk testing.'
                          : 'Mainnet: Transaksi nyata, pastikan saldo cukup.'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={uploading}
                    className="w-full bg-neutral-950 hover:bg-neutral-800 text-white font-black text-xs uppercase tracking-widest py-2.5 border-2 border-neutral-950 transition cursor-pointer shadow-[4px_4px_0px_0px_rgba(16,185,129,1)] text-center rounded-md disabled:opacity-50"
                  >
                    {uploading ? "SEDANG MENGUNGGAH KE SERVER..." : editingProduct ? "💾 PERBARUI ASET" : `🚀 MINT DI ${CHAIN_OPTIONS.find((c) => c.id === selectedChain)?.name?.split(' ')[0] ?? 'BLOCKCHAIN'}`}
                  </button>
                </div>
              </form>
            )}
          </div>
          )}
        </div>
      )}
      {/* CHAT SIDEBAR FOR CONVERSATIONS */}
      {isChatSidebarOpen && (
        <ChatSidebar
          auth={auth}
          isOpen={isChatSidebarOpen}
          conversations={conversations}
          loadingConversations={loadingConversations}
          targetUser={selectedConversationUser}
          onClose={() => {
            setIsChatSidebarOpen(false);
            setSelectedConversationUser(null);
          }}
          onConversationSelect={(user) => {
            setSelectedConversationUser(user);
          }}
          onMessageSent={() => {
            // Refresh conversations after message sent
            const refreshConversations = async () => {
              const response = await fetch('/api/messages/conversations', {
                method: 'GET',
                headers: {
                  'Accept': 'application/json',
                  'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                credentials: 'include',
              });
              if (response.ok) {
                const data = await response.json();
                setConversations(data);
              }
            };
            refreshConversations();
          }}
        />
      )}
    </div>
  );
}