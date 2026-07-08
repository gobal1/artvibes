import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Wallet, User, Bell, X, ShieldCheck, LogOut, Mail, Lock, ChevronDown } from 'lucide-react';
import RhombusButton from './RhombusButton'; 
import WalletModal from './WalletModal';
import { connectWallet as connectWalletUtil } from '../Utils/artVibesMarket';

const GoogleLogo = ({ className }) => (
  <svg viewBox="0 0 533.5 544.3" className={className} aria-hidden="true">
    <path fill="#4285F4" d="M533.5 278.4c0-18.1-1.5-36.4-4.6-53.9H272.1v102h146.3c-6.3 34-25.3 62.8-54.1 82.1v68.3h87.5c51.1-47 80.7-116.3 80.7-198.5z"/>
    <path fill="#34A853" d="M272.1 544.3c73.7 0 135.6-24.5 180.7-66.4l-87.5-68.3c-24.3 16.3-55.4 26-93.1 26-71.6 0-132.4-48.3-154.1-113.1H28.8v70.8c45.7 90.4 139.9 150.9 243.3 150.9z"/>
    <path fill="#FBBC04" d="M118 321.5c-10.9-32.4-10.9-67.5 0-99.9V150.8H28.8c-39.8 79.2-39.8 173.6 0 252.8l89.2-82.1z"/>
    <path fill="#EA4335" d="M272.1 108.7c39.7 0 75.4 13.6 103.5 40.4l77.7-77.7C406.8 23.7 345 0 272.1 0 168.7 0 74.5 60.5 28.8 150.8l89.2 70.8c21.8-64.8 82.6-113.1 154.1-113.1z"/>
  </svg>
);

export default function Header({ toggleSidebar, sidebarOpen, sidebarPanelOpen, navigateTo, globalAddress, setGlobalAddress, isChatOpen, setIsChatOpen, auth, onLogout, onLoginSuccess }) {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || window.location.origin;
  // --- STATE ---
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [localChatOpen, setLocalChatOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userAddress, setUserAddress] = useState(globalAddress || '');
  
  // State baru untuk form login
  const [isLoginForm, setIsLoginForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);

  const [notifications, setNotifications] = useState([
    { id: 1, text: "Transaksi baru sukses dikonfirmasi.", type: "success", read: false },
    { id: 2, text: "Pesan baru masuk dari kolektor.", type: "info", read: false },
  ]);
  const [chatMessages, setChatMessages] = useState([
    { id: 1, sender: 'support', text: "Halo! Ada yang bisa dibantu hari ini?", time: "14:32" },
  ]);

  useEffect(() => {
    if (globalAddress && globalAddress !== userAddress) setUserAddress(globalAddress);
  }, [globalAddress, userAddress]);

  useEffect(() => {
    if (typeof window.ethereum === 'undefined') return;

    const handleAccountsChanged = (accounts) => {
      if (Array.isArray(accounts) && accounts.length > 0) {
        const walletAddress = accounts[0].toLowerCase();
        setUserAddress(walletAddress);
        if (typeof setGlobalAddress === 'function') setGlobalAddress(walletAddress);
      } else {
        setUserAddress('');
        if (typeof setGlobalAddress === 'function') setGlobalAddress('');
      }
    };

    const handleChainChanged = () => {
      const walletAddress = window.ethereum.selectedAddress || userAddress || globalAddress;
      if (walletAddress && typeof setGlobalAddress === 'function') {
        setGlobalAddress(walletAddress.toLowerCase());
      }
    };

    const initializeWallet = async () => {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        handleAccountsChanged(accounts);
      } catch (error) {
        console.warn('MetaMask account init warning:', error);
      }
    };

    initializeWallet();
    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, [setGlobalAddress, userAddress, globalAddress]);

  // Debug auth prop
  useEffect(() => {
    console.log('🔍 Header received auth prop:', auth);
    if (auth?.user) {
      console.log('✅ User found in Header:', auth.user.name || auth.user.email);
    }
  }, [auth]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('[data-profile-menu]')) {
        setIsProfileDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // --- LOGIKA ---
  const isOpen = sidebarOpen || sidebarPanelOpen;
  const chatOpen = typeof isChatOpen === 'boolean' ? isChatOpen : localChatOpen;
  const setChatOpen = typeof setIsChatOpen === 'function' ? setIsChatOpen : setLocalChatOpen;
  const walletAddress = globalAddress || userAddress;
  const unreadNotifCount = notifications.filter(n => !n.read).length;
  const hasLinkedGoogle = Boolean(
    auth?.user?.google_id &&
    !['wallet_login', 'email_login', 'internal_auth'].includes(auth.user.google_id) &&
    auth?.user?.email &&
    !String(auth.user.email).endsWith('@artvibes.local')
  );

  const toggleNotifications = () => {
    setIsNotifOpen(!isNotifOpen);
    setChatOpen(false);
    setIsProfileDropdownOpen(false);
    if (!isNotifOpen) setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleWalletSelection = async (walletType) => {
    setIsWalletModalOpen(false);

    try {
      const walletAddress = await connectWalletUtil({ walletType });
      if (!walletAddress) {
        // Wallet selection redirected the browser to a mobile wallet app.
        return;
      }

      const chainHex = await window.ethereum.request({ method: 'eth_chainId' });
      const chainId = parseInt(chainHex, 16);

      const challengeResponse = await fetch('/api/wallet/challenge', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        body: JSON.stringify({ wallet_address: walletAddress }),
      });

      const challengeData = await challengeResponse.json();
      if (!challengeResponse.ok || !challengeData?.message) {
        throw new Error(challengeData?.message || 'Gagal membuat challenge wallet');
      }

      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [challengeData.message, walletAddress],
      });

      const verifyResponse = await fetch('/api/wallet/verify', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        body: JSON.stringify({
          wallet_address: walletAddress,
          signature,
          chain_id: chainId,
        }),
      });

      const verifyData = await verifyResponse.json();
      if (!verifyResponse.ok || !verifyData?.success) {
        throw new Error(verifyData?.message || 'Verifikasi wallet gagal');
      }

      setUserAddress(walletAddress);
      if (typeof setGlobalAddress === 'function') setGlobalAddress(walletAddress);
      if (verifyData?.user && typeof onLoginSuccess === 'function') {
        onLoginSuccess(verifyData.user);
      }
      setIsAccountModalOpen(false);
      alert('Wallet berhasil terhubung.');
    } catch (error) {
      console.error('Wallet connect error:', error);
      alert(error?.message || 'Gagal menghubungkan wallet.');
    }
  };

  const connectWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      setIsWalletModalOpen(true);
      return;
    }

    await handleWalletSelection('metamask');
  };

  // Fungsi Login Manual ke Backend Laravel
  const handleLogin = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      
      if (data.success && data.user) {
        // Call callback untuk update parent component
        if (typeof onLoginSuccess === 'function') {
          onLoginSuccess(data.user);
        }
        setIsLoggedIn(true);
        setIsAccountModalOpen(false);
        setIsLoginForm(false);
        setEmail('');
        setPassword('');
        // Small delay sebelum redirect untuk ensure state update
        setTimeout(() => {
          window.location.href = data.redirect || '/studio';
        }, 500);
      } else {
        alert(data.message || 'Login gagal');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Gagal menghubungi server');
    }
  };

  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    setChatMessages([...chatMessages, { id: Date.now(), sender: 'you', text: chatInput.trim(), time: 'Baru saja' }]);
    setChatInput('');
  };

  const formatAddress = (address) => `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;

  // Debug auth state
  React.useEffect(() => {
    console.log('📍 Header render - auth:', auth, 'user:', auth?.user?.name);
  }, [auth]);

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-[60] bg-slate-950/95 backdrop-blur-xl border-b border-slate-900/50 w-full h-20">
        <div className="flex items-center justify-between h-full px-4 md:px-8">
          <div className="flex items-center gap-4">
            <RhombusButton isOpen={isOpen} onClick={toggleSidebar} />
            <span className="text-white font-black tracking-wide text-lg">ART VIBES CREATIVE</span>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={toggleNotifications} className="p-2.5 rounded-xl bg-slate-900/70 border border-white/10 text-white relative">
              <Bell className="h-4 w-4" />
              {unreadNotifCount > 0 && <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-rose-500 text-[9px] flex items-center justify-center">{unreadNotifCount}</span>}
            </button>
            <button onClick={() => { setChatOpen(true); setIsProfileDropdownOpen(false); }} className="p-2.5 rounded-xl bg-slate-900/70 border border-white/10 text-white">💬</button>
            
            {auth?.user ? (
              <div className="relative" data-profile-menu>
                <button 
                  onClick={() => {
                    console.log('📍 Profile button clicked');
                    setIsProfileDropdownOpen(!isProfileDropdownOpen);
                  }}
                  className="flex items-center gap-2 rounded-xl bg-slate-900/70 border border-white/10 px-4 py-2.5 text-xs text-white hover:bg-slate-900/90 transition"
                  title={`Profile: ${auth.user.name}`}
                >
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline truncate max-w-[150px]">{auth.user.name}</span>
                  <ChevronDown className={`h-3.5 w-3.5 transition ${isProfileDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isProfileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-white/10 rounded-xl shadow-lg z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-white/10">
                      <p className="text-white font-bold text-sm truncate">{auth.user.name}</p>
                      <p className="text-white/60 text-xs truncate">{auth.user.email}</p>
                      <div className="mt-2 rounded-lg bg-slate-950/80 border border-white/10 px-2 py-2">
                        <p className="text-[10px] uppercase tracking-widest text-white/40">Google</p>
                        <p className="text-[11px] text-sky-300 break-all font-mono mt-1">
                          {hasLinkedGoogle ? auth.user.email : 'Belum terhubung'}
                        </p>
                      </div>
                      <div className="mt-2 rounded-lg bg-slate-950/80 border border-white/10 px-2 py-2">
                        <p className="text-[10px] uppercase tracking-widest text-white/40">Wallet</p>
                        <p className="text-[11px] text-emerald-400 break-all font-mono mt-1">
                          {auth.user.wallet_address || globalAddress || 'Belum terhubung'}
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        navigateTo('dashboard');
                        setIsProfileDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-white text-sm hover:bg-white/10 transition flex items-center gap-2"
                    >
                      👤 Profil Saya
                    </button>
                    <button 
                      onClick={async () => {
                        setIsProfileDropdownOpen(false);
                        await connectWallet();
                      }}
                      className="w-full text-left px-4 py-2 text-white text-sm hover:bg-emerald-500/20 transition flex items-center gap-2 border-t border-white/10"
                    >
                      <Wallet className="h-4 w-4" />
                      {auth.user.wallet_address || globalAddress ? 'Ganti / Sinkronkan Wallet' : 'Connect Wallet'}
                    </button>
                    <button 
                      onClick={() => {
                        const confirmed = window.confirm(
                          hasLinkedGoogle
                            ? 'Sinkronkan ulang atau ganti akun Google untuk profil, chat, dan notifikasi?'
                            : 'Tautkan akun Google ke akun ArtVibes ini untuk profil, chat, dan notifikasi?'
                        );

                        if (!confirmed) {
                          return;
                        }

                        setIsProfileDropdownOpen(false);
                        window.location.href = `${apiBaseUrl}/auth/google/redirect?action=link`;
                      }}
                      className="w-full text-left px-4 py-2 text-white text-sm hover:bg-sky-500/20 transition flex items-center gap-2 border-t border-white/10"
                    >
                      <Mail className="h-4 w-4" />
                      {hasLinkedGoogle ? 'Ganti / Sinkronkan Google' : 'Connect Google'}
                    </button>
                    <button 
                      onClick={() => {
                        console.log('📍 Logout button clicked');
                        setIsProfileDropdownOpen(false);
                        if (typeof onLogout === 'function') {
                          onLogout();
                        }
                      }}
                      className="w-full text-left px-4 py-2 text-white text-sm hover:bg-red-500/20 transition flex items-center gap-2 border-t border-white/10"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button onClick={() => setIsAccountModalOpen(true)} className="flex items-center gap-2 rounded-xl bg-slate-900/70 border border-white/10 px-4 py-2.5 text-xs text-white hover:bg-slate-900/90">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">{walletAddress ? formatAddress(walletAddress) : 'Login/Sig-in'}</span>
              </button>
            )}
            
          </div>
        </div>
      </div>

      <WalletModal isOpen={isWalletModalOpen} onClose={() => setIsWalletModalOpen(false)} onSelectWallet={handleWalletSelection} />

      {/* --- MODAL ACCOUNT (Dinamis) --- */}
      {isAccountModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xl transition-opacity">
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.96 }}
            transition={{ duration: 0.35, ease: [0.25, 0.8, 0.25, 1] }}
            className="relative w-full max-w-2xl rounded-[1.75rem] overflow-hidden border border-white/10 bg-slate-950/95 shadow-2xl shadow-slate-950/50 max-h-[calc(100vh-1.5rem)]"
          >
            <div className="grid grid-cols-1 md:grid-cols-[1.25fr_0.85fr] min-h-[20rem] md:min-h-[22rem]">
              <div className="hidden md:block relative overflow-hidden">
                <img src="/images/popmig.jpg" alt="Visual" className="absolute inset-0 h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-br from-slate-950/80 via-transparent to-slate-950/95" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.12),transparent_40%)]" />
              </div>

              <div className="relative p-5 sm:p-6 md:p-7 flex flex-col justify-center bg-slate-950/95">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.35em] text-emerald-300/80 mb-2">Wallet Access</p>
                    <h2 className="text-3xl font-black text-white tracking-tight leading-tight">{isLoginForm ? 'Register' : 'Wallet Account'}</h2>
                  </div>
                  <button onClick={() => { setIsAccountModalOpen(false); setIsLoginForm(false); }} className="p-2 rounded-2xl bg-white/5 hover:bg-white/10 transition">
                    <X className="text-white" />
                  </button>
                </div>

                {!isLoginForm && (
                  <p className="mb-5 text-sm leading-6 text-slate-300 max-w-xl">
                    Gunakan wallet untuk mint, list, dan buy. Atau login Google untuk akses profil, chat, dan notifikasi.
                  </p>
                )}

                <div className="space-y-3">
                  {!isLoginForm ? (
                    <>
                      <button onClick={connectWallet} className="w-full bg-gradient-to-r from-emerald-400 to-emerald-500 py-3 rounded-2xl font-semibold text-slate-950 shadow-xl shadow-emerald-600/20 hover:brightness-110 transition">Connect Wallet</button>
                      <button onClick={() => setIsLoginForm(true)} className="w-full bg-slate-900 border border-white/10 py-3 rounded-2xl text-white font-semibold hover:bg-slate-800 transition">Register</button>
                      <a href={`${apiBaseUrl}/auth/google/redirect`} className="w-full inline-flex items-center justify-center gap-3 bg-white text-slate-950 py-3 rounded-2xl font-semibold hover:brightness-95 transition border border-slate-200/20">
                        <GoogleLogo className="h-5 w-5" />
                        <span className="text-sm">Login dengan Google</span>
                      </a>
                    </>
                  ) : (
                    <>
                      <input type="email" placeholder="Email" onChange={(e) => setEmail(e.target.value)} className="w-full p-3 bg-slate-950 border border-white/10 rounded-2xl text-white text-sm" />
                      <input type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} className="w-full p-3 bg-slate-950 border border-white/10 rounded-2xl text-white text-sm" />
                      <button onClick={handleLogin} className="w-full bg-indigo-600 py-3 rounded-2xl text-white font-semibold hover:bg-indigo-700 transition">Login Admin</button>
                      <div className="relative my-2">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
                        <div className="relative flex justify-center text-[11px] text-slate-500"><span className="bg-slate-950 px-2">ATAU</span></div>
                      </div>
                      <a href={`${apiBaseUrl}/auth/google/redirect`} className="w-full inline-flex items-center justify-center gap-3 bg-white text-slate-950 py-3 rounded-2xl font-semibold hover:brightness-95 transition border border-slate-200/20">
                        <GoogleLogo className="h-5 w-5" />
                        <span className="text-sm">Login menggunakan Google</span>
                      </a>
                      <button onClick={() => setIsLoginForm(false)} className="w-full text-[11px] text-slate-400 hover:text-white mt-2">Kembali</button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* --- RENDER NOTIFIKASI DROPDOWN --- */}
      {isNotifOpen && (
        <div className="absolute right-4 top-20 w-80 bg-slate-950 border border-white/10 p-4 rounded-2xl z-[70]">
          {notifications.map(n => <div key={n.id} className="text-white text-xs mb-2 p-2 bg-white/5 rounded">{n.text}</div>)}
        </div>
      )}

      {/* --- RENDER CHAT SIDEBAR --- */}
      {chatOpen && (
        <div className="fixed inset-0 z-[80] flex justify-end">
          <div className="w-80 bg-slate-950 border-l border-white/10 h-full p-4 flex flex-col">
            <div className="flex justify-between mb-4">
              <h3 className="text-white font-bold">Tevex 8.0</h3>
              <button onClick={() => setChatOpen(false)}><X className="text-white" /></button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {chatMessages.map(m => <div key={m.id} className="text-white text-xs mb-2 p-2 bg-slate-800 rounded">{m.text}</div>)}
            </div>
            <form onSubmit={handleSendChat} className="mt-4">
              <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} className="w-full p-2 bg-slate-900 text-white rounded" placeholder="Ketik pesan..." />
            </form>
          </div>
        </div>
      )}
    </>
  );
}