import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import NFTMarketplace from './NFTMarketplace';
import ProfileDashboard from './Pages/ProfileDashboard';
import ProfileSettingsPage from './Pages/ProfileSettingsPage';
import ExplorationPage from './Pages/ExplorationPage';
import ProductDetailPage from './Pages/ProductDetailPage'; 
import PublicProfile from './Pages/PublicProfile'; 
import DashboardFinancePage from './Pages/DashboardFinancePage';
import DashboardLikedPage from './Pages/DashboardLikedPage';
import DashboardActivityStandalonePage from './Pages/DashboardActivityStandalonePage';
import Header from './Components/Header'; 
import Sidebar from './Components/Sidebar'; 
import { artworks } from './data/marketplaceData';
import { cancelListingOnChain } from './Utils/artVibesMarket';
import '../css/app.css';

function App() {
  const [currentPage, setCurrentPage] = useState('marketplace');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarPanelOpen, setSidebarPanelOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [globalAddress, setGlobalAddress] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedCreator, setSelectedCreator] = useState(null);

  const handleAuthUpdate = (user) => {
    setAuth({ user });
    window.user = user;

    if (selectedCreator && user?.idUser && (selectedCreator?.idUser === user.idUser || selectedCreator?.id === user.id)) {
      setSelectedCreator(user);
    }
  };

  // Mengambil data user dari 'window.user' yang disuntikkan oleh Blade
  const initialAuth = window.user ? { user: window.user } : null;
  console.log('🔍 App init - window.user:', window.user, 'initialAuth:', initialAuth);
  
  const [auth, setAuth] = useState(initialAuth);
  const [isLoading, setIsLoading] = useState(true);

  // Check user session dari backend saat mount DAN saat auth berubah
  useEffect(() => {
    console.log('🔍 App mounted - initial auth:', auth, 'window.user:', window.user);
    
    // Jika sudah ada auth, langsung set loading false
    if (auth?.user) {
      console.log('✅ Auth sudah ada:', auth.user.name);
      setIsLoading(false);
      return;
    }
    
    // Coba ambil dari window.user
    if (window.user) {
      console.log('✅ window.user ada:', window.user.name);
      setAuth({ user: window.user });
      setIsLoading(false);
      return;
    }
    
    // Jika tidak ada, cek ke API
    const checkUserSession = async () => {
      try {
        console.log('🔄 Checking /api/me...');
        const response = await fetch('/api/me');
        if (response.ok) {
          const data = await response.json();
          console.log('✅ /api/me response:', data);
          if (data.user) {
            setAuth({ user: data.user });
            window.user = data.user;
            console.log('✅ Auth updated from API:', data.user.name);
          } else {
            console.log('❌ /api/me returned null user');
          }
        } else {
          console.log('❌ /api/me status:', response.status);
        }
      } catch (error) {
        console.error('❌ Error checking session:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkUserSession();
  }, []);
  
  // State untuk produk dari database
  const [products, setProducts] = useState([]);
  const [myProducts, setMyProducts] = useState([]); 
  const [purchasedProducts, setPurchasedProducts] = useState([]);
  const [dashboardSubTab, setDashboardSubTab] = useState('karya');

  useEffect(() => {
    // Deteksi otomatis halaman saat pertama kali aplikasi dimuat
    const path = window.location.pathname;
    
    // Jika user mengakses /studio, paksa buka dashboard
    if (path === '/studio') {
      if (auth) {
        setCurrentPage('dashboard');
      } else {
        // Jika belum login, tendang ke home
        window.location.href = '/';
      }
    }
  }, [auth]);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/produk');
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Produk publik fetch berhasil:', data.length, 'items');
        setProducts(data);
      } else {
        console.error('❌ Error fetch produk:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('❌ Error fetching products:', error);
    }
  };

  const fetchMyProducts = async () => {
    if (!auth) return;
    try {
      const response = await fetch('/api/produk/user/my-products', {
        credentials: 'include',
      });
      console.log('🔍 Fetch response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Produk saya:', data);
        setMyProducts(data);
      } else {
        console.error('❌ Error fetch my-products:', response.status, response.statusText);
        const errData = await response.json().catch(() => ({}));
        console.error('❌ Error response:', errData);
      }
    } catch (error) {
      console.error('❌ Error fetching my products:', error);
    }
  };

  const fetchMyPurchases = async () => {
    if (!auth?.user) return;
    try {
      const response = await fetch('/api/transaksi/my-purchases', {
        headers: {
          'Accept': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        const uniquePurchases = Array.isArray(data)
          ? data.reduce((acc, item) => {
              const key = String(item.idproduk || item.id || '');
              if (!acc.seen.has(key)) {
                acc.seen.add(key);
                acc.items.push(item);
              }
              return acc;
            }, { seen: new Set(), items: [] }).items
          : [];
        setPurchasedProducts(uniquePurchases);
      } else {
        console.error('❌ Error fetch my purchases:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('❌ Error fetching purchased products:', error);
    }
  };

  const refreshAllUserData = async () => {
    await Promise.all([fetchProducts(), fetchMyProducts(), fetchMyPurchases()]);
  };

  useEffect(() => {
    console.log('🔄 App useEffect: Fetching products from /api/produk...');
    fetchProducts();
  }, []);

  // Fetch produk user (jika login)
  useEffect(() => {
    if (auth) {
      fetchMyProducts();
    }
  }, [auth]);

  useEffect(() => {
    if (!auth?.user) {
      setPurchasedProducts([]);
      return;
    }

    fetchMyPurchases();
  }, [auth]);

  const handleLoginSuccess = (userData) => {
    const wrappedAuth = { user: userData };
    setAuth(wrappedAuth);
    window.user = userData;
  };

  const handleLogout = async () => {
    try {
      console.log('🔄 Logout started...');
      // Call logout API to clear session di backend
      const response = await fetch('/api/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
      });
      
      console.log('📊 Logout API response status:', response.status);
      const data = await response.json();
      console.log('📊 Logout API response:', data);
      
      if (!response.ok) {
        console.error('❌ Logout API error:', data);
      }
    } catch (error) {
      console.error('❌ Error calling logout API:', error);
    }
    
    // Clear frontend state
    console.log('🧹 Clearing frontend state...');
    setAuth(null);
    window.user = null;
    console.log('✅ Logout complete, redirecting home');
    window.location.href = '/'; 
  };

  const handleProductSaved = (savedProduct) => {
    if (!savedProduct || !savedProduct.idproduk) return;

    setProducts((prevProducts) => {
      const exists = prevProducts.some(p => p.idproduk === savedProduct.idproduk);
      if (exists) {
        return prevProducts.map(p => p.idproduk === savedProduct.idproduk ? savedProduct : p);
      }
      return [...prevProducts, savedProduct];
    });

    setMyProducts((prevProducts) => {
      const exists = prevProducts.some(p => p.idproduk === savedProduct.idproduk);
      if (exists) {
        return prevProducts.map(p => p.idproduk === savedProduct.idproduk ? savedProduct : p);
      }
      return [...prevProducts, savedProduct];
    });

    setPurchasedProducts((prevProducts) => {
      const shouldRemove = savedProduct.status === 'listing' || savedProduct.status === 'unlisted';
      if (!shouldRemove) return prevProducts;
      return prevProducts.filter(p => p.idproduk !== savedProduct.idproduk);
    });

    setSelectedProduct((prev) => {
      if (prev?.idproduk === savedProduct.idproduk) {
        return savedProduct;
      }
      return prev;
    });
  };

  const handleNavigate = (page, data = null) => {
    if (page === 'dashboard' && !auth) {
      alert("Silakan login terlebih dahulu untuk mengakses studio.");
      return;
    }

    if (page === 'dashboard') {
      setDashboardSubTab(data?.tab || 'karya');
    }

    setCurrentPage(page);
    
    // Handle product data (can be wrapped or direct)
    if (data?.product) {
      setSelectedProduct(data.product);
    } else if (data?.idproduk) {
      // Direct product object passed from ExplorationPage
      setSelectedProduct(data);
    }
    
    // Handle creator data (can be wrapped or direct)
    if (data?.creator) {
      setSelectedCreator(data.creator);
    } else if (data?.idUser && data?.name && page === 'public-profile') {
      // Direct user object passed from ProductDetailPage
      setSelectedCreator(data);
    }
  };

  const handleProductPurchased = async (product, purchaseMeta = {}) => {
    if (!auth?.user) {
      throw new Error('Login aplikasi diperlukan agar pembelian bisa disimpan ke database.');
    }

    const response = await fetch('/api/transaksi/purchase', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
      },
      body: JSON.stringify({
        produk_id: product.idproduk,
        buyer_id: auth.user.idUser || auth.user.id,
        tx_hash: purchaseMeta.txHash,
        amount: purchaseMeta.amount ?? product.price_crypto ?? 0,
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data?.success) {
      throw new Error(data?.message || 'Sinkronisasi pembelian ke database gagal.');
    }

    const purchasedProduct = data.produk || product;
    const purchasedProductId = String(purchasedProduct.idproduk || purchasedProduct.id || '');

    setProducts((prev) => prev.filter((item) => String(item.idproduk || item.id || '') !== purchasedProductId));
    setMyProducts((prev) => prev.filter((item) => String(item.idproduk || item.id || '') !== purchasedProductId));
    setPurchasedProducts((prev) => {
      const filtered = prev.filter((item) => String(item.idproduk || item.id || '') !== purchasedProductId);
      return [purchasedProduct, ...filtered];
    });
    setSelectedProduct(purchasedProduct);
    setDashboardSubTab('koleksi');

    await fetchMyPurchases();
    await fetchProducts();

    return purchasedProduct;
  };

  const toggleSidebar = () => {
    if (window.innerWidth >= 1024) setSidebarPanelOpen(!sidebarPanelOpen);
    else setSidebarOpen(!sidebarOpen);
  };

  const handleDeleteProduct = async (product) => {
    const productId = product?.idproduk ?? product;
    if (!confirm("Apakah Anda yakin ingin menghapus produk ini?")) {
      return;
    }

    try {
      if (product?.nft?.token_id) {
        try {
          await cancelListingOnChain(Number(product.nft.token_id));
        } catch (chainError) {
          console.error('Cancel listing failed:', chainError);
          alert(`Cancel listing on-chain gagal: ${chainError.message}`);
          return;
        }
      }

      const response = await fetch(`/api/produk/${productId}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
      });

      if (response.ok) {
        setMyProducts(myProducts.filter(p => p.idproduk !== productId));
        setProducts(products.filter(p => p.idproduk !== productId));
        alert("Produk berhasil dihapus!");
      } else {
        alert("Gagal menghapus produk. Silakan coba lagi.");
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      alert("Terjadi error saat menghapus produk.");
    }
  };

  return (
    <div className="w-full min-h-screen bg-slate-950 text-slate-200 overflow-x-hidden">
      <Header
        toggleSidebar={toggleSidebar}
        sidebarOpen={sidebarOpen}
        sidebarPanelOpen={sidebarPanelOpen}
        navigateTo={handleNavigate}
        globalAddress={globalAddress}
        setGlobalAddress={setGlobalAddress}
        isChatOpen={isChatOpen}
        setIsChatOpen={setIsChatOpen}
        auth={auth} 
        onLogout={handleLogout}
        onLoginSuccess={handleLoginSuccess}
      />

      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        sidebarPanelOpen={sidebarPanelOpen}
        setSidebarPanelOpen={setSidebarPanelOpen}
        navigateTo={handleNavigate}
        currentPage={currentPage}
      />

      <div className={`w-full min-h-screen pt-20 transition-all duration-300 ease-in-out ${sidebarPanelOpen ? 'lg:pl-70' : 'lg:pl-0'}`}>
        {currentPage === 'marketplace' && <NFTMarketplace navigateTo={handleNavigate} />}
        {currentPage === 'dashboard' && auth && (
          <ProfileDashboard
            navigateTo={handleNavigate}
            auth={auth}
            globalAddress={globalAddress}
            myProducts={myProducts}
            purchasedProducts={purchasedProducts}
            initialSubTab={dashboardSubTab}
            onProductAdded={handleProductSaved}
            onProductDeleted={handleDeleteProduct}
            onAuthUpdate={handleAuthUpdate}
          />
        )}
        {currentPage === 'explore' && <ExplorationPage products={products} navigateTo={handleNavigate} auth={auth} onProductPurchased={handleProductPurchased} />}
        {currentPage === 'product-detail' && <ProductDetailPage product={selectedProduct} navigateTo={handleNavigate} auth={auth} onProductPurchased={handleProductPurchased} />}
        {currentPage === 'public-profile' && <PublicProfile targetUser={selectedCreator} navigateTo={handleNavigate} products={products} auth={auth} />}
        {currentPage === 'dashboard-finance' && auth && (
          <DashboardFinancePage
            navigateTo={handleNavigate}
            purchasedProducts={purchasedProducts}
          />
        )}
        {currentPage === 'dashboard-liked' && auth && (
          <DashboardLikedPage
            navigateTo={handleNavigate}
            auth={auth}
          />
        )}
        {currentPage === 'dashboard-activity' && auth && (
          <DashboardActivityStandalonePage
            navigateTo={handleNavigate}
            auth={auth}
            myProducts={myProducts}
            purchasedProducts={purchasedProducts}
          />
        )}
        {currentPage === 'profile' && auth && (
          <ProfileSettingsPage
            auth={auth}
            navigateTo={handleNavigate}
            onAuthUpdate={handleAuthUpdate}
          />
        )}
      </div>
    </div>
  );
}

// Prevent HMR from re-mounting the app
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    console.log('🔄 HMR dispose called');
  });
}

// Debug: Check if root already exists BEFORE creating new one
const appContainer = document.getElementById('app');
if (!appContainer) {
  console.error('❌ App container not found!');
} else {
  if (!window.__ARTVIBES_REACT_ROOT) {
    window.__ARTVIBES_REACT_ROOT = createRoot(appContainer);
    console.log('✅ React root created');
  } else {
    console.log('🔁 React root already exists, reusing it');
  }

  window.__ARTVIBES_REACT_ROOT.render(<App />);
}