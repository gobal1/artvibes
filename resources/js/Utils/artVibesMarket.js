import { ethers } from 'ethers';
import { EthereumProvider } from '@walletconnect/ethereum-provider';

const DEFAULT_CHAIN_ID = 137; // Polygon Mainnet
let activeProvider = null; // Menyimpan provider yang sedang aktif (Injected atau WalletConnect)

const CHAIN_METADATA = {
  137: { name: 'Polygon Mainnet', symbol: 'POL', explorer: 'https://polygonscan.com', rpcUrl: 'https://polygon-rpc.com', isTestnet: false },
  1: { name: 'Ethereum Mainnet', symbol: 'ETH', explorer: 'https://etherscan.io', isTestnet: false },
  11155111: { name: 'Ethereum Sepolia Testnet', symbol: 'ETH', explorer: 'https://sepolia.etherscan.io', isTestnet: true },
  10143: { name: 'Monad Testnet', symbol: 'MON', explorer: 'https://testnet.monadexplorer.com', isTestnet: true },
  43114: { name: 'Avalanche C-Chain', symbol: 'AVAX', explorer: 'https://snowtrace.io', isTestnet: false },
  42161: { name: 'Arbitrum One', symbol: 'ETH', explorer: 'https://arbiscan.io', isTestnet: false },
};

function isMobileDevice() {
  if (typeof navigator === 'undefined') return false;
  return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
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

  // Jika sudah terhubung lewat WalletConnect di mobile, pakai session aktifnya
  if (activeProvider) {
    return activeProvider;
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
  let provider = getEthereumProvider();

  // JIKA TIDAK ADA INJECTED PROVIDER (Skenario Browser Chrome HP Mobile)
  if (!provider) {
    try {
      const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;
      if (!projectId) {
        throw new Error('VITE_WALLETCONNECT_PROJECT_ID belum di-set di file .env');
      }

      // Inisialisasi koneksi jembatan aman untuk perangkat mobile
      const wcProvider = await EthereumProvider.init({
        projectId: projectId,
        chains: [getConfiguredChainId()],
        showQrModal: true, 
        qrModalOptions: { themeMode: 'dark' }
      });

      // Buka modul wallet eksternal
      await wcProvider.connect();
      
      activeProvider = wcProvider;
      provider = wcProvider;
    } catch (error) {
      throw new Error(`Gagal terhubung ke Mobile Wallet: ${error.message}`);
    }
  }

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
    throw error;
  }
}

export async function ensureCorrectNetwork(expectedChainId = getConfiguredChainId()) {
  const provider = getEthereumProvider();
  if (!provider) {
    throw new Error('Wallet belum terpasang atau belum aktif di browser ini.');
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
    throw new Error('Saldo POL di MetaMask kosong. Isi POL Mainnet dulu sebelum transaksi on-chain.');
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
  if (!provider) return {};
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
  const { provider, contract } = await getMarketContractWithSigner(expectedChainId);
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
  if (!metadataURI) throw new Error('metadataURI wajib diisi');
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
  if (priceWei <= 0n) throw new Error('Harga listing harus lebih besar dari 0');

  const txOptions = await getGasOptions(provider);
  const tx = await contract.listToken(tokenId, priceWei, txOptions);
  const receipt = await tx.wait();
  return { txHash: tx.hash, receipt };
}

// Menjaga kompatibilitas sisa fungsi lama agar tidak break di halaman lain
export function getMobileWalletRedirectUrl() { return null; }
export function isReturningFromMobileWallet() { return false; }
export function clearMobileWalletMarkers() { }