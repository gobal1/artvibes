import { ethers } from 'ethers';

const DEFAULT_CHAIN_ID = 137; // Polygon Mainnet

const CHAIN_METADATA = {
  137: { name: 'Polygon Mainnet', symbol: 'POL', explorer: 'https://polygonscan.com', rpcUrl: 'https://polygon-rpc.com', isTestnet: false },
  1: { name: 'Ethereum Mainnet', symbol: 'ETH', explorer: 'https://etherscan.io', isTestnet: false },
  11155111: { name: 'Ethereum Sepolia Testnet', symbol: 'ETH', explorer: 'https://sepolia.etherscan.io', isTestnet: true },
  10143: { name: 'Monad Testnet', symbol: 'MON', explorer: 'https://testnet.monadexplorer.com', isTestnet: true },
  43114: { name: 'Avalanche C-Chain', symbol: 'AVAX', explorer: 'https://snowtrace.io', isTestnet: false },
  42161: { name: 'Arbitrum One', symbol: 'ETH', explorer: 'https://arbiscan.io', isTestnet: false },
};

const MOBILE_WALLET_DEEP_LINKS = {
  // Do NOT use /dapp/ for MetaMask — that forces the dApp to open inside MetaMask in-app browser.
  // We intentionally return null here so the code prefers WalletConnect WC flow instead.
  metamask: () => null,
  'coinbase-wallet': (dappUrl) => `https://go.cb-w.com/dapp?uri=${encodeURIComponent(dappUrl)}`,
  trust: (dappUrl) => `https://link.trustwallet.com/open_url?uri=${encodeURIComponent(dappUrl)}`,
};

function isMobileDevice() {
  if (typeof navigator === 'undefined') return false;
  return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function isAndroidDevice() {
  if (typeof navigator === 'undefined') return false;
  return /Android/i.test(navigator.userAgent);
}

function isIosDevice() {
  if (typeof navigator === 'undefined') return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function isMetaMaskMobile() {
  if (typeof navigator === 'undefined') return false;
  return /MetaMask/.test(navigator.userAgent) && isMobileDevice();
}

function buildCurrentDappUrl() {
  if (typeof window === 'undefined') return '';
  
  const url = new URL(window.location.href);
  
  // Jika localhost/127.0.0.1, replace dengan domain dari .env atau ngrok/public URL
  if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
    // Try to get public URL dari environment atau use ngrok
    const publicUrl = import.meta.env.VITE_APP_URL || import.meta.env.VITE_PUBLIC_URL;
    if (publicUrl) {
      return publicUrl + window.location.pathname + window.location.search;
    }
    // Fallback: gunakan current pathname tapi bisa di-override di mobile
    // Untuk mobile testing, Anda perlu setup ngrok atau use public domain
  }
  
  return window.location.href;
}

function openDeepLink(link) {
  if (typeof window === 'undefined' || !link) return;
  try {
    window.location.href = link;
  } catch (navErr) {
    console.info('window.location.href navigation failed', navErr);
  }

  try {
    const anchor = document.createElement('a');
    anchor.href = link;
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  } catch (clickErr) {
    console.info('Anchor click navigation failed', clickErr);
  }
}

async function tryOpenDeepLinkCandidates(links = []) {
  if (!Array.isArray(links) || links.length === 0) return false;

  for (const link of links) {
    if (!link) continue;

    let resolved = false;
    const openedPromise = new Promise((resolve) => {
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'hidden') {
          resolved = true;
          document.removeEventListener('visibilitychange', handleVisibilityChange);
          resolve(true);
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          document.removeEventListener('visibilitychange', handleVisibilityChange);
          resolve(false);
        }
      }, 1200);
    });

    openDeepLink(link);
    const opened = await openedPromise;
    if (opened) {
      return true;
    }
  }

  return false;
}

function buildMetaMaskWalletConnectLink(uri) {
  if (!uri || typeof uri !== 'string') return null;
  const redirectUrl = encodeURIComponent(buildCurrentDappUrl());
  const native = `metamask://wc?uri=${encodeURIComponent(uri)}&redirectUrl=${redirectUrl}`;
  const androidIntent = `intent://wc?uri=${encodeURIComponent(uri)}&redirectUrl=${redirectUrl}#Intent;package=io.metamask;scheme=metamask;end`;
  const universal = `https://metamask.app.link/wc?uri=${encodeURIComponent(uri)}&redirectUrl=${redirectUrl}`;

  if (isAndroidDevice()) {
    return [androidIntent, native, universal];
  }

  if (isIosDevice()) {
    return [native, universal];
  }

  return [universal];
}

export function getMobileWalletRedirectUrl(walletType = 'metamask') {
  const builder = MOBILE_WALLET_DEEP_LINKS[walletType?.toLowerCase().replace(/\s+/g, '-')] || null;
  if (!builder) return null;
  return builder(buildCurrentDappUrl());
}

/**
 * Check if we're returning from a mobile wallet deep link
 * This helps auto-continue the connection flow
 */
export function isReturningFromMobileWallet() {
  if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') {
    return false;
  }
  const connectingWallet = sessionStorage.getItem('_wallet_connecting');
  const connectTime = sessionStorage.getItem('_wallet_connect_time');
  
  if (!connectingWallet || !connectTime) return false;
  
  // Check if it's been less than 2 minutes since we initiated connection
  const elapsed = Date.now() - parseInt(connectTime, 10);
  return elapsed < 120000; // 2 minutes
}

/**
 * Clear mobile wallet session markers
 */
export function clearMobileWalletMarkers() {
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.removeItem('_wallet_connecting');
    sessionStorage.removeItem('_wallet_connect_time');
  }
}

export const ART_VIBES_MARKET_ABI = [
  'event Minted(uint256 indexed tokenId, address indexed creator, string tokenURI)',
  'function mintNFT(string metadataURI, uint256 initialPrice, bool listNow) returns (uint256 tokenId)',
  'function listToken(uint256 tokenId, uint256 price)',
  'function updateListingPrice(uint256 tokenId, uint256 newPrice)',
  'function cancelListing(uint256 tokenId)',
  'function buy(uint256 tokenId) payable',
  'function getListing(uint256 tokenId) view returns (address seller, uint256 price, bool active)',
  'function ownerOf(uint256 tokenId) view returns (address)',
];

function getConfiguredAddress(chainId) {
  if (typeof chainId !== 'undefined' && chainId !== null) {
    const chainKey = `VITE_ARTVIBES_MARKET_ADDRESS_${chainId}`;
    const chainAddress = import.meta.env[chainKey];
    if (chainAddress) {
      return chainAddress;
    }
  }

  const address = import.meta.env.VITE_ARTVIBES_MARKET_ADDRESS;
  if (!address) {
    throw new Error('VITE_ARTVIBES_MARKET_ADDRESS belum di-set di .env');
  }
  return address;
}

function getEthereumProvider() {
  if (typeof window === 'undefined') {
    return null;
  }

  const injected = window.ethereum;
  if (injected?.request) {
    return injected;
  }

  if (Array.isArray(injected?.providers)) {
    return injected.providers.find((provider) => provider?.request) || null;
  }

  return null;
}

export function getConfiguredChainId() {
  const raw = import.meta.env.VITE_WEB3_CHAIN_ID;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_CHAIN_ID;
}

export function getConfiguredChainMetadata() {
  return CHAIN_METADATA[getConfiguredChainId()] || CHAIN_METADATA[DEFAULT_CHAIN_ID];
}

export function getExplorerBaseUrl() {
  return getConfiguredChainMetadata().explorer;
}

export function getNativeCurrencySymbol() {
  return getConfiguredChainMetadata().symbol;
}

export function shortenAddress(address, leading = 6, trailing = 4) {
  if (!address || typeof address !== 'string') {
    return '-';
  }

  if (address.length <= leading + trailing + 2) {
    return address;
  }

  return `${address.slice(0, leading)}...${address.slice(-trailing)}`;
}

export function hasEthereumProvider() {
  return Boolean(getEthereumProvider());
}

export async function connectWallet({ walletType = 'metamask' } = {}) {
  const provider = getEthereumProvider();
  const isMobile = isMobileDevice();

  // SCENARIO 1: Provider sudah tersedia (Browser extension atau in-app browser di wallet mobile)
  if (provider && provider?.request) {
    try {
      const accounts = await provider.request({ method: 'eth_requestAccounts' });
      if (!accounts || accounts.length === 0) {
        throw new Error('Gagal mengambil akun wallet. Pastikan wallet sudah terhubung.');
      }
      return accounts[0];
    } catch (error) {
      if (error?.code === 4001) {
        throw new Error('Anda membatalkan permintaan koneksi wallet.');
      }
      // Jika error lain, fallback ke deep link pada mobile
      if (isMobile) {
        const redirectUrl = getMobileWalletRedirectUrl(walletType);
        if (redirectUrl) {
          console.log('📱 Redirecting ke wallet mobile app:', walletType);
          window.location.href = redirectUrl;
          return null;
        }
      }
      throw error;
    }
  }

  // SCENARIO 2: Tidak ada provider, coba deep link ke mobile wallet app
  if (isMobile) {
    // Try WalletConnect Web3 provider first (provides a WC URI we can deep-link to MetaMask mobile)
    try {
      const wcModule = await import('@walletconnect/web3-provider');
      const WalletConnectProvider = wcModule?.default || wcModule;

      const rpc = {};
      const chainId = getConfiguredChainId();
      rpc[chainId] = getConfiguredChainMetadata().rpcUrl;

      const wcProvider = new WalletConnectProvider({ rpc, qrcode: false });

      // When the provider emits a display URI (WalletConnect URI), open MetaMask app via universal link
      wcProvider.on('display_uri', (uri) => {
        try {
          const deepLinks = buildMetaMaskWalletConnectLink(uri);
          if (!deepLinks || !Array.isArray(deepLinks) || deepLinks.length === 0) {
            throw new Error('WC URI tidak valid');
          }
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('_wallet_connecting', walletType);
            sessionStorage.setItem('_wallet_connect_time', Date.now().toString());
          }
          console.log('📱 Opening MetaMask with WC URI (attempts):', deepLinks);

          // Try candidates in order; stop after first assignment (navigation likely occurs)
          for (const link of deepLinks) {
            try {
              openDeepLink(link);
              // give short pause — navigation will usually take over
              break;
            } catch (navErr) {
              console.info('Navigation attempt failed for link', link, navErr);
            }
          }

          // Safety: copy URI to clipboard silently for manual paste fallback
          setTimeout(async () => {
            try {
              if (typeof navigator !== 'undefined' && navigator.clipboard) {
                await navigator.clipboard.writeText(uri);
                console.info('WC URI copied to clipboard as fallback');
              }
            } catch (copyErr) {
              console.info('Clipboard copy failed', copyErr);
            }
          }, 1200);
        } catch (e) {
          console.warn('Gagal membuka deep link, fallback ke universal link', e);
          const fallbackLink = `https://metamask.app.link/wc?uri=${encodeURIComponent(uri)}`;
          try {
            window.location.assign(fallbackLink);
          } catch (assignErr) {
            console.info('Fallback assign failed', assignErr);
          }
        }
      });

      // Request enable -> will trigger display_uri event and resolve once connected
      const accounts = await wcProvider.enable();
      if (accounts && accounts.length) {
        // Expose provider as window.ethereum so existing code paths continue to work
        window.ethereum = wcProvider;
        window.wcProvider = wcProvider;
        return accounts[0];
      }
      // If no accounts returned, throw so outer handler shows fallback guidance
      throw new Error('No accounts returned from WalletConnect enable');
      } catch (wcError) {
      // If WalletConnect provider import or flow fails, do NOT fallback to /dapp/ deep-link (it opens the dApp inside MetaMask).
      console.warn('WalletConnect fallback failed or not installed:', wcError);
      const redirectUrl = getMobileWalletRedirectUrl(walletType);
      if (redirectUrl) {
        // For non-MetaMask wallets we can still attempt a deep link
        console.log('📱 Opening other wallet mobile app (deep link fallback)...');
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('_wallet_connecting', walletType);
          sessionStorage.setItem('_wallet_connect_time', Date.now().toString());
        }
        window.location.assign(redirectUrl);
        return null;
      }

      // If no redirect URL available (MetaMask case), silently copy last WC URI to clipboard for manual paste fallback
      try {
        const lastUri = wcProvider && wcProvider.connector && wcProvider.connector.uri ? wcProvider.connector.uri : null;
        if (lastUri && typeof navigator !== 'undefined' && navigator.clipboard) {
          await navigator.clipboard.writeText(lastUri);
          console.info('WC URI copied to clipboard for manual paste into MetaMask.');
        }
      } catch (e) {
        console.info('Failed to copy WC URI to clipboard', e);
      }
      return null;
    }
  }

  // SCENARIO 3: Provider tidak ada dan bukan mobile
  throw new Error(
    'Wallet tidak ditemukan. Silakan:\n' +
    '1. Install MetaMask extension untuk desktop\n' +
    '2. Atau buka di browser MetaMask mobile app\n' +
    '3. Atau gunakan wallet lain (Coinbase, Trust Wallet)'
  );
}

/**
 * Open MetaMask mobile app with a WalletConnect URI for sign-only flow.
 * This creates a WalletConnect provider, listens for the display_uri event,
 * then opens MetaMask via the universal wc link including redirect back to the dApp.
 */
export async function openMetaMaskSignOnly() {
  if (typeof window === 'undefined') {
    throw new Error('Function must be called in a browser environment');
  }

  if (!isMobileDevice()) {
    throw new Error('Open MetaMask (sign only) hanya didukung di perangkat mobile');
  }

  try {
    const wcModule = await import('@walletconnect/web3-provider');
    const WalletConnectProvider = wcModule?.default || wcModule;

    const rpc = {};
    const chainId = getConfiguredChainId();
    rpc[chainId] = getConfiguredChainMetadata().rpcUrl;

    const wcProvider = new WalletConnectProvider({ rpc, qrcode: false });

    wcProvider.on('display_uri', async (uri) => {
      try {
        const deepLinks = buildMetaMaskWalletConnectLink(uri);
        if (!deepLinks || !Array.isArray(deepLinks) || deepLinks.length === 0) throw new Error('WC URI tidak valid');
        // Save markers so the page knows we're returning from wallet
        sessionStorage.setItem('_wallet_connecting', 'metamask');
        sessionStorage.setItem('_wallet_connect_time', Date.now().toString());
        // Keep provider around for later use
        window.wcProvider = wcProvider;
        console.log('📱 Opening MetaMask (sign only) attempts:', deepLinks);

        const opened = await tryOpenDeepLinkCandidates(deepLinks);
        if (!opened) {
          console.warn('MetaMask deep links did not open, falling back to universal link');
          const fallbackLink = `https://metamask.app.link/wc?uri=${encodeURIComponent(uri)}`;
          try {
            window.location.assign(fallbackLink);
          } catch (assignErr) {
            console.info('Fallback assign failed', assignErr);
          }
        }

        // Silent clipboard fallback
        setTimeout(async () => {
          try {
            if (typeof navigator !== 'undefined' && navigator.clipboard) {
              await navigator.clipboard.writeText(uri);
              console.info('WC URI copied to clipboard as manual fallback');
            }
          } catch (copyErr) {
            console.info('Clipboard copy failed', copyErr);
          }
        }, 1200);
      } catch (e) {
        console.warn('Gagal membangun deep link MetaMask:', e);
      }
    });

    // Trigger session creation which should emit display_uri
    await wcProvider.enable();

    return true;
  } catch (err) {
    console.warn('openMetaMaskSignOnly error:', err);
    throw err;
  }
}

export async function ensureCorrectNetwork(expectedChainId = getConfiguredChainId()) {
  const provider = getEthereumProvider();
  if (!provider) {
    throw new Error('MetaMask belum terpasang atau belum aktif di browser ini.');
  }

  const currentHex = await provider.request({ method: 'eth_chainId' });
  const currentDec = Number.parseInt(currentHex, 16);

  if (currentDec !== expectedChainId) {
    const targetHex = `0x${expectedChainId.toString(16)}`;

    try {
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: targetHex }],
      });
      return;
    } catch (switchError) {
      throw new Error(`Network salah. Ganti ke chain ID ${expectedChainId}.`);
    }
  }
}

export async function requireWalletAccess(expectedChainId) {
  if (!hasEthereumProvider()) {
    throw new Error('MetaMask belum terpasang atau belum aktif di browser ini.');
  }

  await connectWallet();
  await ensureCorrectNetwork(expectedChainId);
}

export async function getMarketContractWithSigner(expectedChainId) {
  await requireWalletAccess(expectedChainId);

  const provider = new ethers.BrowserProvider(getEthereumProvider());
  const signer = await provider.getSigner();
  const account = await signer.getAddress();

  const balance = await provider.getBalance(account);
  if (balance <= 0n) {
    throw new Error('Saldo POL di MetaMask kosong. Isi POL Mainnet dulu sebelum mint atau transaksi on-chain.');
  }

  const contractAddress = getConfiguredAddress(expectedChainId);
  const contract = new ethers.Contract(contractAddress, ART_VIBES_MARKET_ABI, signer);

  return { provider, signer, account, contractAddress, contract };
}

export async function getMarketContractReadOnly() {
  let provider;
  const ethereumProvider = getEthereumProvider();

  if (ethereumProvider) {
    provider = new ethers.BrowserProvider(ethereumProvider);
  } else {
    const rpcUrl = getConfiguredChainMetadata().rpcUrl;
    if (!rpcUrl) {
      throw new Error('RPC URL untuk read-only provider tidak tersedia.');
    }
    provider = new ethers.JsonRpcProvider(rpcUrl);
  }

  const contractAddress = getConfiguredAddress();
  const contract = new ethers.Contract(contractAddress, ART_VIBES_MARKET_ABI, provider);

  return { provider, contractAddress, contract };
}

async function getGasOptions(provider) {
  if (!provider) {
    return {};
  }

  const feeData = await provider.getFeeData();
  const options = {};

  if (feeData.maxPriorityFeePerGas && feeData.maxFeePerGas) {
    options.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas;
    options.maxFeePerGas = feeData.maxFeePerGas;
  } else if (feeData.gasPrice) {
    options.gasPrice = feeData.gasPrice;
  }

  return options;
}

export async function getListingState(tokenId) {
  const { contract } = await getMarketContractReadOnly();
  const listing = await contract.getListing(tokenId);

  return {
    seller: listing.seller ?? listing[0],
    priceWei: listing.price ?? listing[1],
    active: listing.active ?? listing[2],
  };
}

export async function getTokenOwner(tokenId) {
  const { contract } = await getMarketContractReadOnly();
  return contract.ownerOf(tokenId);
}

export async function buyListedToken(tokenId, fallbackPricePol, expectedChainId) {
  const { provider, contract, account } = await getMarketContractWithSigner(expectedChainId);

  console.log('🛒 Memulai pembelian NFT...');
  
  let valueWei;
  try {
    const listing = await contract.getListing(tokenId);
    if (!listing[2]) {
      throw new Error('Listing on-chain untuk token ini tidak aktif.');
    }
    valueWei = listing[1];
  } catch (listingError) {
    if (fallbackPricePol === undefined || fallbackPricePol === null || fallbackPricePol === '') {
      throw new Error('Listing on-chain tidak ditemukan dan harga fallback tidak tersedia.');
    }
    valueWei = ethers.parseEther(String(fallbackPricePol));
  }

  let tx;
  try {
    const txOptions = { value: valueWei, ...(await getGasOptions(provider)) };
    tx = await contract.buy(tokenId, txOptions);
  } catch (txError) {
    const code = txError?.code ? ` [code=${txError.code}]` : '';
    throw new Error(`❌ Transaksi gagal${code}: ${txError?.reason || txError?.message || 'Unknown error'}`);
  }

  const receipt = await tx.wait();
  return { txHash: tx.hash, receipt };
}

export async function updateListingPriceOnChain(tokenId, newPricePol, expectedChainId) {
  const { provider, contract } = await getMarketContractWithSigner(expectedChainId);
  const newPriceWei = ethers.parseEther(String(newPricePol || 0));
  const txOptions = await getGasOptions(provider);
  const tx = await contract.updateListingPrice(tokenId, newPriceWei, txOptions);
  const receipt = await tx.wait();
  return { txHash: tx.hash, receipt };
}

export async function cancelListingOnChain(tokenId, expectedChainId) {
  const { provider, contract } = await getMarketContractWithSigner(expectedChainId);
  const txOptions = await getGasOptions(provider);
  const tx = await contract.cancelListing(tokenId, txOptions);
  const receipt = await tx.wait();
  return { txHash: tx.hash, receipt };
}

export async function mintNftOnChain(metadataURI, initialPricePol, listNow = false, expectedChainId) {
  if (!metadataURI) {
    throw new Error('metadataURI wajib diisi');
  }

  const startingPrice = Number(initialPricePol);
  if (!Number.isFinite(startingPrice) || startingPrice <= 0) {
    throw new Error('Harga mint harus lebih besar dari 0. Masukkan harga dalam POL.');
  }

  const { provider, contract, contractAddress } = await getMarketContractWithSigner(expectedChainId);
  const initialPriceWei = ethers.parseEther(String(initialPricePol));

  const txOptions = await getGasOptions(provider);
  let tx;
  try {
    tx = await contract.mintNFT(metadataURI, initialPriceWei, Boolean(listNow), txOptions);
  } catch (txError) {
    const reason = txError?.reason || txError?.message || 'Unknown error';
    const data = txError?.data || txError?.error?.data || null;
    throw new Error(`Transaksi mint gagal: ${reason}${data ? ` | data: ${JSON.stringify(data)}` : ''}`);
  }
  const receipt = await tx.wait();

  let tokenId = null;
  for (const log of receipt.logs || []) {
    try {
      const parsed = contract.interface.parseLog(log);
      if (parsed?.name === 'Minted') {
        tokenId = Number(parsed.args?.tokenId);
        break;
      }
    } catch {
      // Ignore unrelated logs
    }
  }

  return { txHash: tx.hash, receipt, tokenId, contractAddress };
}

export async function listTokenOnChain(tokenId, pricePol, expectedChainId) {
  const { provider, contract } = await getMarketContractWithSigner(expectedChainId);
  const priceWei = ethers.parseEther(String(pricePol || 0));

  if (priceWei <= 0n) {
    throw new Error('Harga listing harus lebih besar dari 0');
  }

  const txOptions = await getGasOptions(provider);
  const tx = await contract.listToken(tokenId, priceWei, txOptions);
  const receipt = await tx.wait();
  return { txHash: tx.hash, receipt };
}
