'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Grid3X3, 
  Receipt, 
  UtensilsCrossed, 
  BarChart3, 
  MoreHorizontal,
  Download,
  X
} from 'lucide-react';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if running as installed standalone PWA
    if (typeof window !== 'undefined') {
      const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
      setIsStandalone(Boolean(isStandaloneMode));

      const handleBeforeInstall = (e: any) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setShowInstallBanner(true);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstall);
      return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    }
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowInstallBanner(false);
    }
    setDeferredPrompt(null);
  };

  if (pathname === '/login') {
    return null;
  }

  const navItems = [
    { label: 'Home', href: '/', icon: Home, match: pathname === '/' },
    { label: 'Tables', href: '/qr', icon: Grid3X3, match: pathname.startsWith('/qr') },
    { label: 'Billing', href: '/billing', icon: Receipt, match: pathname.startsWith('/billing') },
    { label: 'Items', href: '/menu', icon: UtensilsCrossed, match: pathname.startsWith('/menu') },
    { label: 'Reports', href: '/reports', icon: BarChart3, match: pathname.startsWith('/reports') },
    { label: 'More', href: '/users', icon: MoreHorizontal, match: pathname.startsWith('/users') },
  ];

  return (
    <>
      {/* Mobile Install App Banner (Shows once on phone browser to install directly to Home Screen) */}
      {showInstallBanner && !isStandalone && (
        <aside 
          aria-label="Install App Banner"
          className="md:hidden fixed top-2 left-3 right-3 z-50 bg-[#0C0E12]/95 backdrop-blur-md border border-zinc-700/80 p-3 rounded-2xl shadow-2xl flex items-center justify-between text-white animate-in slide-in-from-top-3"
        >
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-white text-black font-black text-xs flex items-center justify-center shrink-0">
              IP
            </div>
            <div>
              <p className="text-xs font-black">Install ഇത്തിപ്പൂരം POS</p>
              <p className="text-[10px] text-zinc-400">Add to home screen for native app view</p>
            </div>
          </div>
          <div className="flex items-center space-x-1.5">
            <button
              onClick={handleInstallClick}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-black flex items-center space-x-1 shadow-xs active:scale-95 transition"
            >
              <Download className="w-3 h-3" />
              <span>Install</span>
            </button>
            <button
              onClick={() => setShowInstallBanner(false)}
              className="p-1.5 text-zinc-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </aside>
      )}

      {/* Persistent Bottom Mobile Navigation Bar for Smartphones & Tablets */}
      <nav 
        aria-label="Mobile Bottom Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0C0E12]/95 backdrop-blur-lg border-t border-zinc-800/90 px-1 py-1 flex items-center justify-around select-none shadow-2xl no-print"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.match;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all duration-150 min-w-[52px] ${
                active 
                  ? 'text-white font-black scale-105' 
                  : 'text-zinc-500 hover:text-zinc-300 font-semibold'
              }`}
            >
              <div className={`p-1 rounded-xl transition ${active ? 'bg-white text-black shadow-md' : 'bg-transparent'}`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className={`text-[10px] mt-0.5 tracking-tight ${active ? 'text-white font-extrabold' : 'text-zinc-400'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
