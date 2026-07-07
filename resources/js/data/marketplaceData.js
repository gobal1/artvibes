import { Shield, TrendingUp, Lock, Users, Compass, Layers, Music, Image, Camera, Palette } from 'lucide-react';

export const artworks = [
  {
    url: 'https://images.unsplash.com/photo-1654183818269-22495f928eb1?w=400',
    alt: 'Digital Art 1'
  },
  {
    url: 'https://images.unsplash.com/photo-1663603846231-16fb004c2fae?w=400',
    alt: 'Digital Art 2'
  },
  {
    url: 'https://images.unsplash.com/photo-1663603846241-f29ca8b98622?w=400',
    alt: 'Digital Art 3'
  },
  {
    url: 'https://images.unsplash.com/photo-1654183621855-8fd86fd79d6f?w=400',
    alt: 'Digital Art 4'
  },
  {
    url: 'https://images.unsplash.com/photo-1635377090186-036bca445c6b?w=400',
    alt: 'Digital Art 5'
  },
  {
    url: 'https://images.unsplash.com/photo-1663603847412-1121ef5f5c0a?w=400',
    alt: 'Digital Art 6'
  }
];

export const latestWorks = [
  {
    title: 'Genesis Polygon',
    creator: 'Alya Dewi',
    price: '2.3 ETH',
    image: 'https://images.unsplash.com/photo-1519999482648-25049ddd37b1?w=640'
  },
  {
    title: 'Neon Dreamscape',
    creator: 'Raka Putra',
    price: '1.8 ETH',
    image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=640'
  },
  {
    title: 'Luminous Pulse',
    creator: 'Nadia Lestari',
    price: '3.1 ETH',
    image: 'https://images.unsplash.com/photo-1499084732479-de2c02d45fcc?w=640'
  },
  {
    title: 'Astral Canvas',
    creator: 'Faris Kurnia',
    price: '2.9 ETH',
    image: 'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?w=640'
  },
  {
    title: 'Cyber Bloom',
    creator: 'Intan Sari',
    price: '1.5 ETH',
    image: 'https://images.unsplash.com/photo-1520639836793-5cd16d0c7fb9?w=640'
  }
];

export const features = [
  {
    icon: Shield,
    title: 'Keamanan Blockchain',
    description: 'Setiap transaksi tercatat aman di blockchain'
  },
  {
    icon: Lock,
    title: 'Kepemilikan Terverifikasi',
    description: 'Bukti kepemilikan digital yang tidak dapat dipalsukan'
  },
  {
    icon: TrendingUp,
    title: 'Nilai Investasi',
    description: 'Karya seni digital dengan potensi nilai jangka panjang'
  },
  {
    icon: Users,
    title: 'Komunitas Global',
    description: 'Terhubung dengan seniman dan kolektor worldwide'
  }
];

export const navItems = [
  { id: 'home', label: 'Beranda', icon: Compass },
  { id: 'categories', label: 'Kategori', icon: Layers },
  { id: 'features', label: 'Fitur', icon: Shield },
  { id: 'howItWorks', label: 'Cara Kerja', icon: TrendingUp },
  { id: 'trending', label: 'Trending', icon: Image }
];

export const sidebarLinks = [
  { icon: Compass, label: 'Discover' },
  { icon: Layers, label: 'Collections' },
  { icon: Music, label: 'Tokens' },
  { icon: Image, label: 'Swap' },
  { icon: Camera, label: 'Drops' },
  { icon: Palette, label: 'Activity' }
];

export const categories = [
  'Video',
  'Suara / Musik',
  'Gambar',
  'Logo',
  'Fotografi',
  'Desain'
];

export const stats = [
  { value: '10K+', label: 'Karya Terjual' },
  { value: '5K+', label: 'Seniman Aktif' },
  { value: '50K+', label: 'Kolektor' },
  { value: '100%', label: 'Aman' }
];
