import React, { useState } from 'react';
import Header from '../components/Header'; 
import Sidebar from '../components/Sidebar'; 

export default function Layout({ children, auth }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarPanelOpen, setSidebarPanelOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [globalAddress, setGlobalAddress] = useState('');

  const toggleSidebar = () => {
    if (window.innerWidth >= 1024) {
      setSidebarPanelOpen((prev) => !prev);
    } else {
      setSidebarOpen((prev) => !prev);
    }
  };

  return (
    <div className="w-full min-h-screen bg-slate-950 text-slate-200 overflow-x-hidden">
      {/* Header Global */}
      <Header
        toggleSidebar={toggleSidebar}
        sidebarOpen={sidebarOpen}
        sidebarPanelOpen={sidebarPanelOpen}
        globalAddress={globalAddress}
        setGlobalAddress={setGlobalAddress}
        isChatOpen={isChatOpen}
        setIsChatOpen={setIsChatOpen}
      />

      {/* Sidebar Global */}
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        sidebarPanelOpen={sidebarPanelOpen}
        setSidebarPanelOpen={setSidebarPanelOpen}
      />

      {/* Konten Utama dari Halaman yang Sedang Aktif */}
      <div className={`w-full min-h-screen pt-20 transition-all duration-300 ease-in-out ${
        sidebarPanelOpen ? 'lg:pl-[280px]' : 'lg:pl-0'
      }`}>
        {children}
      </div>
    </div>
  );
}