import React, { useEffect, useRef, useState } from 'react';
import Hero from './Components/Hero';
import CategorySection from './Components/CategorySection';
import MarketplaceOverview from './Components/MarketplaceOverview';
import LatestWorks from './Components/LatestWorks';
import Features from './Components/Features';
import HowItWorks from './Components/HowItWorks';
import Stats from './Components/Stats';
import Trending from './Components/Trending';
import CTA from './Components/CTA';
import Footer from './Components/Footer';
import { artworks, latestWorks, features, sidebarLinks, categories, stats, navItems } from './data/marketplaceData';

export default function NFTMarketplace({ navigateTo }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarPanelOpen, setSidebarPanelOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');

  const homeRef = useRef(null);
  const categoriesRef = useRef(null);
  const featuresRef = useRef(null);
  const howRef = useRef(null);
  const trendingRef = useRef(null);
  const latestScrollRef = useRef(null);

  const navSections = navItems.map((item) => {
    const refMap = {
      home: homeRef,
      categories: categoriesRef,
      features: featuresRef,
      howItWorks: howRef,
      trending: trendingRef,
    };

    return {
      ...item,
      ref: refMap[item.id],
    };
  });

  const scrollToSection = (id) => {
    const target = navSections.find((section) => section.id === id);
    target?.ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setSidebarOpen(false);
    setSidebarPanelOpen(false);
  };

  useEffect(() => {
    const updateActiveSection = () => {
      const current = navSections.reduce((active, section) => {
        const el = section.ref.current;
        if (!el) return active;
        if (el.getBoundingClientRect().top <= 120) {
          return section.id;
        }
        return active;
      }, 'home');

      setActiveSection(current);
    };

    updateActiveSection();
    window.addEventListener('scroll', updateActiveSection, { passive: true });
    return () => window.removeEventListener('scroll', updateActiveSection);
  }, []);

  const toggleSidebar = () => {
    if (window.innerWidth >= 1024) {
      setSidebarPanelOpen((prev) => !prev);
    } else {
      setSidebarOpen((prev) => !prev);
    }
  };

  return (
    <div className="w-full min-h-screen overflow-y-auto bg-slate-950 text-slate-200">
      <main className="relative w-full">
        <Hero artworks={artworks} stats={stats} homeRef={homeRef} navigateTo={navigateTo} />
      </main>

      <CategorySection categories={categories} categoriesRef={categoriesRef} />

      {/* Place MarketplaceOverview above LatestWorks (Karya Terbaru) */}
      <MarketplaceOverview artworks={artworks} stats={stats} navigateTo={navigateTo} />

      <LatestWorks latestWorks={latestWorks} latestScrollRef={latestScrollRef} />
      <Features features={features} featuresRef={featuresRef} />
      <HowItWorks howRef={howRef} />
      <Stats stats={stats} />
      <Trending artworks={artworks} trendingRef={trendingRef} />
      <CTA />
      <Footer />
    </div>
  );
}
