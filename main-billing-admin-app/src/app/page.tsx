'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Receipt, 
  BarChart3, 
  UtensilsCrossed, 
  ShieldCheck, 
  Users, 
  QrCode, 
  ArrowRight
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '../lib/api';

export default function OperationalGateway() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fadeLoading, setFadeLoading] = useState(false);

  // Authentication Guard: Web app always begins with sign in if not authenticated
  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      router.replace('/login');
      return;
    }
    setCurrentUser(user);

    // Only show splash once per browser session; subsequent returns to dashboard are instant with zero transition
    const hasSeenSplash = typeof window !== 'undefined' ? sessionStorage.getItem('ithi_splash_shown') : true;
    if (!hasSeenSplash) {
      setIsLoading(true);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('ithi_splash_shown', 'true');
      }
      const timer1 = setTimeout(() => {
        setFadeLoading(true);
      }, 700);

      const timer2 = setTimeout(() => {
        setIsLoading(false);
      }, 1000);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [router]);

  const handleSignOut = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('ithipooram_user');
      localStorage.removeItem('ithipooram_token');
    }
    router.replace('/login');
  };

  const sections = [
    {
      title: 'Billing POS Counter',
      subtitle: 'Cashier Tablet Terminal',
      badge: 'CASHIER TERMINAL',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      description: 'Instant table lookup (TQ1..TQ10), open ticket inspection, cash/UPI settlement, mandatory cashier PIN authorization, and 80mm thermal receipt printing.',
      link: '/billing',
      linkText: 'Open POS Terminal',
      image: '/sections/billing-pos.jpg',
      icon: Receipt,
      accentGlow: 'hover:border-amber-500/40 hover:shadow-amber-950/30',
    },
    {
      title: 'Executive Admin Console',
      subtitle: 'Financial & Shift Control',
      badge: 'EXECUTIVE SUITE',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      description: 'Real-time gross and net revenue, 03:00 AM shift cutoff ledger, average ticket size, dish sales volume, UPI vs Cash breakdown, and CSV data exports.',
      link: '/admin',
      linkText: 'Launch Admin Console',
      image: '/sections/admin-analytics.jpg',
      icon: BarChart3,
      accentGlow: 'hover:border-purple-500/40 hover:shadow-purple-950/30',
    },
    {
      title: 'LIVE MENU UPDATE',
      subtitle: 'Stock Control & Customer Sync',
      badge: 'LIVE MENU & EXCEL',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      description: 'Add new dishes with Malayalam & English names, adjust daily stock & prices, sync customer mobile ordering, and export the Daily Menu Excel database.',
      link: '/menu',
      linkText: 'Open Live Menu Update',
      image: '/sections/menu-stock.jpg',
      icon: UtensilsCrossed,
      accentGlow: 'hover:border-emerald-500/40 hover:shadow-emerald-950/30',
    },
    {
      title: 'Staff Accounts & PINs',
      subtitle: 'Google Workspace Linked',
      badge: 'GOOGLE WORKSPACE & EXCEL',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      description: 'Manage staff credentials, 4-digit PINs, and maintain the live Staff & Session Database linked directly to Google Workspace (adithiyanpv6@gmail.com).',
      link: '/users',
      linkText: 'Staff Database & Google Workspace',
      image: '/sections/staff-team.jpg',
      icon: Users,
      accentGlow: 'hover:border-emerald-500/40 hover:shadow-emerald-950/30',
    },
    {
      title: 'Table QR Stands',
      subtitle: 'Acrylic Tent Card Printables',
      badge: 'HIGH-RES ASSETS',
      badgeColor: 'bg-stone-500/20 text-stone-300 border-stone-500/30',
      description: 'Generate high-resolution PNG & SVG QR codes for physical tables TQ1 to TQ10 with visible table numbers and ready-to-print acrylic stand templates.',
      link: '/qr',
      linkText: 'Generate Table Stands',
      image: '/sections/table-qr.jpg',
      icon: QrCode,
      accentGlow: 'hover:border-stone-400/40 hover:shadow-stone-950/30',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0C0E12] text-stone-100 flex flex-col justify-between font-sans relative selection:bg-[#9E341D] selection:text-white">
      {/* 1. Smooth Loading Screen Overlay with Name & Logo */}
      {isLoading && (
        <div 
          className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0C0E12] transition-opacity duration-700 ease-in-out ${
            fadeLoading ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        >
          {/* Subtle Ambient Radial Glow */}
          <div className="absolute inset-0 bg-radial from-[#9E341D]/30 via-transparent to-transparent pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center text-center px-6">
            {/* Logo with gentle pulse & glowing ring */}
            <div className="relative mb-6">
              <div className="absolute -inset-3 rounded-full bg-[#9E341D]/40 blur-xl animate-pulse" />
              <img 
                src="/logo.png" 
                alt="ഇത്തിപൂരം (Ithi Pooram)" 
                className="relative w-28 h-28 object-contain drop-shadow-2xl rounded-full transform transition duration-500 hover:scale-105"
              />
            </div>

            {/* Brand Calligraphy script in crisp white */}
            <div className="mb-2">
              <img 
                src="/brand-calligraphy-white.png" 
                alt="ഇത്തിപൂരം" 
                className="h-14 sm:h-16 w-auto object-contain mx-auto drop-shadow-md"
              />
            </div>

            {/* Subtitle */}
            <p className="text-xs uppercase tracking-widest text-amber-200/90 font-medium mb-8">
              Vanchiyoor, Trivandrum • Operational Gateway
            </p>

            {/* Sleek Animated Loading Bar */}
            <div className="w-56 h-1 bg-stone-900 rounded-full overflow-hidden shadow-inner mb-3">
              <div className="w-full h-full bg-gradient-to-r from-amber-500 via-[#9E341D] to-amber-500 animate-[shimmer_1.5s_infinite_linear] bg-[length:200%_100%]" />
            </div>

            <div className="flex items-center space-x-2 text-[11px] font-mono text-stone-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>INITIALIZING SYSTEM GATEWAY...</span>
            </div>
          </div>
        </div>
      )}

      {/* 2. Black-Faded 4K Kerala Sadhya Feast Background (55-60% Visibility) */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <img 
          src="/sadhya-dark-bg.jpg" 
          alt="Authentic Kerala Sadhya on Dark Wood" 
          className="w-full h-full object-cover opacity-55 filter blur-[0.2px] contrast-110 scale-105"
        />
        {/* Black-Faded Gradient Vignette for high contrast & 50-60% visual depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0C0E12]/80 via-[#0C0E12]/65 to-[#0C0E12]/85" />
      </div>

      {/* 3. Top Header Bar */}
      <header className="relative z-20 border-b border-stone-800/80 bg-[#12161E]/90 backdrop-blur-md shadow-lg sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-0 min-h-[4.5rem] sm:h-20 flex items-center justify-between gap-2">
          {/* Logo & Calligraphy Brand */}
          <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
            <img 
              src="/logo.png" 
              alt="Ithi Pooram Logo" 
              className="w-10 h-10 sm:w-12 sm:h-12 object-contain drop-shadow-md rounded-full transition-transform hover:scale-105 shrink-0"
            />
            <div className="min-w-0">
              {/* Name in Exact Calligraphy Font Style */}
              <div className="flex items-center">
                <img 
                  src="/brand-calligraphy-white.png" 
                  alt="ഇത്തിപൂരം" 
                  className="h-7 sm:h-10 w-auto object-contain drop-shadow-sm"
                />
              </div>
              {/* Location: Vanchiyoor, Trivandrum */}
              <p className="text-[10px] sm:text-xs text-stone-400 font-medium tracking-wide truncate">
                Vanchiyoor, Trivandrum • Main Console
              </p>
            </div>
          </div>

          {/* Shift Status & User Actions */}
          <div className="flex items-center space-x-3">
            <div className="hidden sm:flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-stone-900/90 border border-stone-800 text-xs font-semibold text-stone-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400/50" />
              <span>Shift Active (Cutoff: 03:00 AM IST)</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-[11px] sm:text-xs font-semibold text-stone-200 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl bg-stone-900/90 border border-stone-800 max-w-[130px] sm:max-w-none truncate">
                {currentUser?.fullName || currentUser?.username || 'Staff'} ({currentUser?.role || 'STAFF'})
              </span>
              <button
                onClick={handleSignOut}
                className="px-3 py-1 sm:px-3.5 sm:py-1.5 text-xs font-bold text-white bg-[#9E341D] hover:bg-[#B33C22] rounded-xl shadow-md transition"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 4. Main Gateway Hub */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full pb-20">
        {/* Gateway Heading */}
        <div className="mb-8">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Central Operational Gateway
          </h2>
        </div>

        {/* 6 Core Functional Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sections.map((sec) => {
            const Icon = sec.icon;
            return (
              <Link
                key={sec.title}
                href={sec.link}
                className={`bg-[#141821]/85 backdrop-blur-md rounded-3xl overflow-hidden border border-stone-800/90 shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col justify-between group ${sec.accentGlow}`}
              >
                {/* Visual Image Header */}
                <div className="relative h-44 w-full overflow-hidden bg-stone-900">
                  <img 
                    src={sec.image} 
                    alt={sec.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-95"
                  />
                  {/* Subtle Gradient Over Image */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#141821] via-transparent to-black/30" />

                  {/* Badge on Top Right */}
                  <div className="absolute top-3.5 right-3.5">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border backdrop-blur-md ${sec.badgeColor}`}>
                      {sec.badge}
                    </span>
                  </div>

                  {/* Floating Icon */}
                  <div className="absolute bottom-3 left-4 w-10 h-10 rounded-xl bg-[#0C0E12]/90 border border-stone-700/80 text-amber-400 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <Icon className="w-5 h-5" />
                  </div>
                </div>

                {/* Card Content Body - Simplified and Clean */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-amber-300 transition-colors">
                      {sec.title}
                    </h3>
                    <p className="text-xs text-stone-400 leading-relaxed mt-2 mb-4">
                      {sec.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-stone-800/80 flex items-center justify-between text-xs font-bold text-amber-400 group-hover:text-amber-300">
                    <span>{sec.linkText}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </main>

      {/* 5. Footer */}
      <footer className="relative z-10 border-t border-stone-800/80 bg-[#12161E]/90 backdrop-blur-md py-4 px-6 text-xs text-stone-400 flex flex-col sm:flex-row items-center justify-between">
        <div>Ithi Pooram (ഇത്തിപൂരം) • Vanchiyoor, Trivandrum</div>
        <div className="font-mono mt-1 sm:mt-0 text-stone-500">GSTIN: 32AAAAI0000A1Z5 | FSSAI: 11324007000890</div>
      </footer>
    </div>
  );
}
