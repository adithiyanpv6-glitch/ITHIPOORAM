'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Home, 
  UtensilsCrossed, 
  BarChart3, 
  MoreHorizontal, 
  Grid3X3, 
  ChevronRight, 
  Printer, 
  Users, 
  HelpCircle, 
  LogOut, 
  Menu as MenuIcon, 
  X, 
  Plus, 
  Check, 
  FileText
} from 'lucide-react';
import { getCurrentUser } from '../../lib/api';

export default function MorePage() {
  const router = useRouter();

  // Active sub-tab in More (Customers option completely skipped as requested)
  const [activeTab, setActiveTab] = useState<'staff' | 'printer' | 'support'>('printer');
  const [defaultPrinter, setDefaultPrinter] = useState<string>('Microsoft Print to PDF');
  const [pageSize, setPageSize] = useState<'2-inch' | '3-inch'>('3-inch');
  const [extraLines, setExtraLines] = useState<number>(2);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      router.replace('/login');
    }
  }, [router]);

  const handleSignOut = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('ithipooram_user');
      localStorage.removeItem('ithipooram_token');
    }
    router.replace('/login');
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#0A0C10] flex flex-col md:flex-row font-sans selection:bg-zinc-800 selection:text-white">
      
      {/* ============================================================== */}
      {/* 1. LEFT SIDEBAR                                                 */}
      {/* ============================================================== */}
      <aside className="hidden md:flex md:w-64 lg:w-72 bg-[#0C0E12] text-zinc-300 flex-col justify-between border-r border-zinc-800 shrink-0 select-none">
        
        {/* Top Brand Logo - Occupies Maximum Space */}
        <div className="p-4 lg:p-5 border-b border-zinc-800/80">
          <div className="flex items-center justify-between gap-2">
            <Link href="/" className="flex-1 flex items-center justify-start group py-1">
              <img 
                src="/brand-calligraphy-uploaded.png" 
                alt="ഇത്തിപ്പൂരം - Ithi Pooram" 
                className="w-full max-h-16 lg:max-h-20 object-contain invert brightness-200 transition group-hover:scale-102"
              />
            </Link>
            <button 
              onClick={handleSignOut}
              title="Sign Out"
              className="p-1.5 rounded-lg bg-zinc-800/60 hover:bg-zinc-700 text-zinc-400 hover:text-white transition shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-1.5 flex-1">
          <Link
            href="/"
            className="flex items-center space-x-3 px-3.5 py-3 rounded-2xl text-zinc-400 hover:bg-zinc-900 hover:text-white font-bold text-sm transition"
          >
            <Home className="w-4 h-4" />
            <span>Home</span>
          </Link>

          <Link
            href="/qr"
            className="flex items-center space-x-3 px-3.5 py-3 rounded-2xl text-zinc-400 hover:bg-zinc-900 hover:text-white font-bold text-sm transition"
          >
            <Grid3X3 className="w-4 h-4" />
            <span>Table</span>
          </Link>

          <Link
            href="/menu"
            className="flex items-center space-x-3 px-3.5 py-3 rounded-2xl text-zinc-400 hover:bg-zinc-900 hover:text-white font-bold text-sm transition"
          >
            <UtensilsCrossed className="w-4 h-4" />
            <span>Items</span>
          </Link>

          <Link
            href="/reports"
            className="flex items-center justify-between px-3.5 py-3 rounded-2xl text-zinc-400 hover:bg-zinc-900 hover:text-white font-bold text-sm transition"
          >
            <div className="flex items-center space-x-3">
              <BarChart3 className="w-4 h-4" />
              <span>Reports</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
          </Link>

          <Link
            href="/users"
            className="flex items-center justify-between px-3.5 py-3 rounded-2xl bg-white text-black font-extrabold text-sm shadow-md transition"
          >
            <div className="flex items-center space-x-3">
              <MoreHorizontal className="w-4 h-4" />
              <span>More</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
          </Link>
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-zinc-800/80 space-y-3">
          <Link
            href="/billing"
            className="w-full flex items-center justify-center py-3 px-4 rounded-2xl border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-white font-extrabold text-xs shadow-sm transition active:scale-98"
          >
            <span>+ Add Order</span>
          </Link>

          <div className="flex items-center justify-between p-2.5 rounded-2xl bg-zinc-900/60 border border-zinc-800">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-white text-black font-black text-xs flex items-center justify-center">
                IP
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-white truncate">Ithi Pooram</p>
                <p className="text-[10px] text-zinc-400 truncate">Vanchiyoor, TVM</p>
              </div>
            </div>
            <button onClick={handleSignOut} className="text-zinc-500 hover:text-white p-1">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ============================================================== */}
      {/* 2. MOBILE TOP BAR                                               */}
      {/* ============================================================== */}
      <header className="md:hidden bg-[#0C0E12] text-white p-4 border-b border-zinc-800 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center space-x-3 flex-1">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-300"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
          </button>
          <img 
            src="/brand-calligraphy-uploaded.png" 
            alt="ഇത്തിപ്പൂരം" 
            className="h-9 w-auto object-contain invert brightness-200"
          />
        </div>
        <Link href="/billing" className="px-3.5 py-1.5 rounded-xl bg-white text-black font-black text-xs">
          <span>+ Add Order</span>
        </Link>
      </header>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-[#0C0E12] border-b border-zinc-800 px-4 py-3 space-y-2 z-30">
          <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-zinc-300 font-bold text-sm">
            <Home className="w-4 h-4" />
            <span>Home</span>
          </Link>
          <Link href="/qr" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-zinc-300 font-bold text-sm">
            <Grid3X3 className="w-4 h-4" />
            <span>Table</span>
          </Link>
          <Link href="/menu" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-zinc-300 font-bold text-sm">
            <UtensilsCrossed className="w-4 h-4" />
            <span>Items</span>
          </Link>
          <Link href="/reports" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-zinc-300 font-bold text-sm">
            <BarChart3 className="w-4 h-4" />
            <span>Reports</span>
          </Link>
          <Link href="/users" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center space-x-3 px-3 py-2.5 rounded-xl bg-white text-black font-black text-sm">
            <MoreHorizontal className="w-4 h-4" />
            <span>More</span>
          </Link>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. MAIN MORE WORKSPACE (Customers option completely skipped)    */}
      {/* ============================================================== */}
      <main className="flex-1 flex flex-col w-full overflow-hidden">
        
        {/* Top Header */}
        <div className="px-6 py-4 bg-white border-b border-zinc-200">
          <h1 className="text-xl sm:text-2xl font-black text-black">More Options</h1>
        </div>

        {/* Two-Column Layout: Left Sub-Nav + Right Configuration Panel */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* Left Sub-Nav (Customers skipped -> Staff Access, Printer, Support) */}
          <div className="w-full md:w-56 lg:w-60 bg-white border-b md:border-b-0 md:border-r border-zinc-200 p-4 space-y-1.5 shrink-0">
            <button
              onClick={() => setActiveTab('printer')}
              className={`w-full text-left px-3.5 py-2.5 rounded-2xl text-xs font-extrabold transition cursor-pointer ${
                activeTab === 'printer'
                  ? 'bg-zinc-100 text-black shadow-xs'
                  : 'text-zinc-600 hover:bg-zinc-50'
              }`}
            >
              Printer
            </button>
            <button
              onClick={() => setActiveTab('staff')}
              className={`w-full text-left px-3.5 py-2.5 rounded-2xl text-xs font-extrabold transition cursor-pointer ${
                activeTab === 'staff'
                  ? 'bg-zinc-100 text-black shadow-xs'
                  : 'text-zinc-600 hover:bg-zinc-50'
              }`}
            >
              Staff Access
            </button>
            <button
              onClick={() => setActiveTab('support')}
              className={`w-full text-left px-3.5 py-2.5 rounded-2xl text-xs font-extrabold transition cursor-pointer ${
                activeTab === 'support'
                  ? 'bg-zinc-100 text-black shadow-xs'
                  : 'text-zinc-600 hover:bg-zinc-50'
              }`}
            >
              Support
            </button>
          </div>

          {/* Right Main Panel */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
            
            {/* PRINTER SETTINGS PANEL (Designed matching uploaded image with custom bill preview) */}
            {activeTab === 'printer' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start max-w-5xl">
                
                {/* Left 7 cols: Printer Configuration */}
                <div className="lg:col-span-7 space-y-6">
                  
                  {/* Select default printer card */}
                  <div className="bg-white rounded-3xl p-5 border border-zinc-200 shadow-xs space-y-4">
                    <span className="text-xs font-extrabold text-black block">Select default printer</span>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3.5 rounded-2xl border-2 border-black bg-zinc-50">
                        <span className="text-xs font-bold text-black">Microsoft Print to PDF</span>
                        <div className="w-10 h-5 bg-black rounded-full p-0.5 flex items-center justify-end">
                          <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3.5 rounded-2xl border border-zinc-200 bg-white">
                        <span className="text-xs font-semibold text-zinc-600">Standard 80mm Thermal (USB / LAN)</span>
                        <div className="w-10 h-5 bg-zinc-200 rounded-full p-0.5 flex items-center justify-start">
                          <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Connect new printer banner */}
                  <div className="border border-dashed border-zinc-300 rounded-3xl p-6 text-center space-y-3 bg-white">
                    <h4 className="text-xs font-black text-black uppercase tracking-wider">Connect new printer</h4>
                    <p className="text-xs text-zinc-500">Install the printer setup &amp; connect your printer via USB or Bluetooth.</p>
                    <div className="flex items-center justify-center gap-2 pt-1">
                      <button className="px-3.5 py-2 rounded-xl border border-zinc-300 hover:border-black text-black font-extrabold text-xs transition">
                        ↓ 2-inch printer setup
                      </button>
                      <button className="px-3.5 py-2 rounded-xl border border-zinc-300 hover:border-black text-black font-extrabold text-xs transition">
                        ↓ 3-inch printer setup
                      </button>
                    </div>
                  </div>

                  {/* Page Size & Extra Lines */}
                  <div className="bg-white rounded-3xl p-5 border border-zinc-200 shadow-xs space-y-5">
                    <div>
                      <span className="text-xs font-extrabold text-black block mb-2">Page Size</span>
                      <div className="flex items-center space-x-6 text-xs font-bold text-black">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            name="pagesize"
                            checked={pageSize === '2-inch'}
                            onChange={() => setPageSize('2-inch')}
                            className="accent-black"
                          />
                          <span>2-inch</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            name="pagesize"
                            checked={pageSize === '3-inch'}
                            onChange={() => setPageSize('3-inch')}
                            className="accent-black"
                          />
                          <span>3-inch</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <span className="text-xs font-extrabold text-black block mb-1">Extra lines at the end</span>
                      <p className="text-[11px] text-zinc-400 mb-2">Provides extra spacing at the end of the invoice.</p>
                      <div className="inline-flex items-center space-x-3 bg-zinc-100 p-1 rounded-xl">
                        <button
                          onClick={() => setExtraLines(Math.max(0, extraLines - 1))}
                          className="w-7 h-7 rounded-lg bg-white text-black font-bold flex items-center justify-center shadow-xs"
                        >
                          -
                        </button>
                        <span className="font-mono font-bold text-xs px-2">{extraLines}</span>
                        <button
                          onClick={() => setExtraLines(extraLines + 1)}
                          className="w-7 h-7 rounded-lg bg-white text-black font-bold flex items-center justify-center shadow-xs"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Right 5 cols: Live Bill Preview (Custom Designed for Ithi Pooram) */}
                <div className="lg:col-span-5 space-y-2">
                  <span className="text-xs font-bold text-zinc-500 block text-center lg:text-left">Preview</span>
                  
                  {/* Minimal Awesome Receipt Preview */}
                  <div className="bg-white rounded-3xl p-5 border border-zinc-200 shadow-md font-mono text-xs text-black space-y-3 max-w-sm mx-auto">
                    {/* Header */}
                    <div className="text-center space-y-1">
                      <div className="flex justify-center mb-1">
                        <img 
                          src="/brand-calligraphy-uploaded.png" 
                          alt="ഇത്തിപ്പൂരം" 
                          className="h-9 w-auto object-contain"
                        />
                      </div>
                      <p className="text-[10px] text-zinc-500 font-sans">Phone: +91 94470 00000</p>
                      <div className="border-b border-dashed border-zinc-300 pt-2" />
                      <p className="text-[11px] font-black uppercase tracking-wider font-sans pt-1">BILL OF SUPPLY</p>
                    </div>

                    {/* Metadata */}
                    <div className="text-[11px] space-y-0.5">
                      <div className="flex justify-between">
                        <span>Payment: Cash</span>
                        <span>Date: 04/11/2026</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Table: T1</span>
                        <span>Invoice: 1001</span>
                      </div>
                      <div className="border-b border-dashed border-zinc-300 pt-1" />
                    </div>

                    {/* Table items */}
                    <div className="space-y-1 text-[11px]">
                      <div className="flex justify-between font-bold text-zinc-500 text-[10px] uppercase">
                        <span>Item Name</span>
                        <div className="flex space-x-4">
                          <span>Price</span>
                          <span>Amount</span>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between">
                          <span className="font-bold">Aavoli fry</span>
                          <div className="flex space-x-4 font-mono">
                            <span>120.00</span>
                            <span className="font-bold">120.00</span>
                          </div>
                        </div>
                        <span className="text-[10px] text-zinc-400">x1</span>
                      </div>
                      <div className="border-b border-dashed border-zinc-300 pt-1" />
                    </div>

                    {/* Totals */}
                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between font-black text-sm">
                        <span>Grand Total:</span>
                        <span>₹120.00</span>
                      </div>
                    </div>

                    {/* Malayalam Minimal Footer */}
                    <div className="text-center pt-3 border-t border-dashed border-zinc-300 text-[10px] text-zinc-500 font-sans space-y-0.5">
                      <p className="font-bold text-black font-malayalam">നന്ദി, വീണ്ടും വരിക</p>
                      <p>Thank you! Visit again.</p>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* STAFF ACCESS TAB */}
            {activeTab === 'staff' && (
              <div className="bg-white rounded-3xl p-6 border border-zinc-200 shadow-xs max-w-2xl space-y-4">
                <h3 className="text-base font-black text-black">Staff Credentials &amp; Access</h3>
                <p className="text-xs text-zinc-500">Configure 4-digit rapid tablet PINs for Cashier, Chef, and Manager accounts.</p>
                <Link
                  href="/users"
                  className="inline-flex items-center space-x-2 px-5 py-3 rounded-2xl bg-black hover:bg-zinc-800 text-white font-extrabold text-xs transition"
                >
                  <span>Open Staff Accounts &rarr;</span>
                </Link>
              </div>
            )}

            {/* SUPPORT TAB */}
            {activeTab === 'support' && (
              <div className="bg-white rounded-3xl p-6 border border-zinc-200 shadow-xs max-w-2xl space-y-3">
                <h3 className="text-base font-black text-black">Ithi Pooram Operational Support</h3>
                <p className="text-xs text-zinc-500">For hardware printer setup, tablet deployment, or cloud sync inquiries, contact technical support directly.</p>
                <div className="pt-2 text-xs font-mono font-bold text-zinc-800">
                  support@ithipooram.in | +91 94470 00000
                </div>
              </div>
            )}

          </div>

        </div>

      </main>

    </div>
  );
}
