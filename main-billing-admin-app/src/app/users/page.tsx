'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ChefHat, 
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
  Bluetooth,
  CheckCircle2, 
  Loader2,
  RefreshCw,
  Receipt
} from 'lucide-react';
import { getCurrentUser } from '../../lib/api';
import { printDirectToBluetoothThermalPrinter } from '../../lib/thermalPrinter';

export default function MorePage() {
  const router = useRouter();

  // Active sub-tab in More (Support and Customers removed)
  const [activeTab, setActiveTab] = useState<'printer' | 'staff'>('printer');
  const [defaultPrinter, setDefaultPrinter] = useState<string>('SEZNIK 58mm Thermal Printer');
  const [pageSize, setPageSize] = useState<'2-inch' | '3-inch'>('2-inch'); // 2-inch for SEZNIK 58mm
  const [extraLines, setExtraLines] = useState<number>(6);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isBluetoothPrinting, setIsBluetoothPrinting] = useState(false);
  const [btStatus, setBtStatus] = useState<string | null>(null);

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

  // Direct Bluetooth Test Print for SEZNIK 58mm
  const handleBluetoothTestPrint = async () => {
    setIsBluetoothPrinting(true);
    setBtStatus(null);
    try {
      await printDirectToBluetoothThermalPrinter({
        restaurantName: 'ഇത്തിപ്പൂരം',
        restaurantLocation: 'Vanchiyoor, Trivandrum',
        phone: '+91 94470 00000',
        invoiceNumber: '1001',
        orderCode: '#01',
        tableCode: 'T1',
        dateTime: '04/11/2026',
        items: [
          { name: 'Aavoli fry', qty: 1, price: 120, total: 120 },
        ],
        grandTotal: 120,
        paymentMode: 'Cash',
        extraLines: extraLines,
      }, 'bitmap');
      setBtStatus('Test print sent successfully to SEZNIK!');
    } catch (err: any) {
      setBtStatus(`Bluetooth Error: ${err.message || 'Device disconnected or cancelled'}`);
    } finally {
      setIsBluetoothPrinting(false);
    }
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

          {/* Dedicated Billing Link */}
          <Link
            href="/billing"
            className="flex items-center space-x-3 px-3.5 py-3 rounded-2xl text-zinc-400 hover:bg-zinc-900 hover:text-white font-bold text-sm transition"
          >
            <Receipt className="w-4 h-4" />
            <span>Billing</span>
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

          {/* Kitchen Display (KDS) */}
          <Link
            href="/kitchen"
            className="flex items-center justify-between px-3.5 py-3 rounded-2xl text-zinc-400 hover:bg-zinc-900 hover:text-white font-bold text-sm transition"
          >
            <div className="flex items-center space-x-3">
              <ChefHat className="w-4 h-4 text-orange-400" />
              <span>Kitchen (KDS)</span>
            </div>
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
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
          <Link href="/billing" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-zinc-300 font-bold text-sm">
            <Receipt className="w-4 h-4" />
            <span>Billing</span>
          </Link>
          <Link href="/menu" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-zinc-300 font-bold text-sm">
            <UtensilsCrossed className="w-4 h-4" />
            <span>Items</span>
          </Link>
          <Link href="/reports" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-zinc-300 font-bold text-sm">
            <BarChart3 className="w-4 h-4" />
            <span>Reports</span>
          </Link>
          <Link href="/kitchen" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-zinc-300 font-bold text-sm">
            <ChefHat className="w-4 h-4 text-orange-400" />
            <span>Kitchen (KDS)</span>
          </Link>
          <Link href="/users" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center space-x-3 px-3 py-2.5 rounded-xl bg-white text-black font-black text-sm">
            <MoreHorizontal className="w-4 h-4" />
            <span>More</span>
          </Link>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. MAIN WORKSPACE (SEZNIK PRINTER INTEGRATED)                   */}
      {/* ============================================================== */}
      <main className="flex-1 flex flex-col w-full overflow-hidden">
        
        {/* Top Header */}
        <div className="px-6 py-4 bg-white border-b border-zinc-200 flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-black text-black">More Options</h1>
          <span className="text-[10px] font-black uppercase tracking-wider bg-zinc-100 text-zinc-800 px-2.5 py-1 rounded-full border border-zinc-300">
            SEZNIK 58mm Enabled
          </span>
        </div>

        {/* Two-Column Layout */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* Left Sub-Nav (SEZNIK Printer, Staff Access) */}
          <div className="w-full md:w-56 lg:w-60 bg-white border-b md:border-b-0 md:border-r border-zinc-200 p-4 space-y-1.5 shrink-0">
            <button
              onClick={() => setActiveTab('printer')}
              className={`w-full text-left px-3.5 py-2.5 rounded-2xl text-xs font-extrabold transition cursor-pointer ${
                activeTab === 'printer'
                  ? 'bg-zinc-100 text-black shadow-xs'
                  : 'text-zinc-600 hover:bg-zinc-50'
              }`}
            >
              SEZNIK 58mm Printer
            </button>
            <button
              onClick={() => setActiveTab('staff')}
              className={`w-full text-left px-3.5 py-2.5 rounded-2xl text-xs font-extrabold transition cursor-pointer ${
                activeTab === 'staff'
                  ? 'bg-zinc-100 text-black shadow-xs'
                  : 'text-zinc-600 hover:bg-zinc-50'
              }`}
            >
              Staff Access &amp; PINs
            </button>
          </div>

          {/* Right Main Panel */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
            
            {/* PRINTER SETTINGS PANEL (SINGLE WORKING PRINTER: SEZNIK 58MM) */}
            {activeTab === 'printer' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start max-w-5xl">
                
                {/* Left 7 cols: Printer Configuration */}
                <div className="lg:col-span-7 space-y-6">
                  
                  {/* Single Working Printer Card */}
                  <div className="bg-white rounded-3xl p-5 border border-zinc-200 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-wider text-zinc-500">Connected Printer Hardware</span>
                      <span className="inline-flex items-center space-x-1.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span>Configured &amp; Active</span>
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl border-2 border-black bg-zinc-50 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                            <Printer className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-black">SEZNIK 58mm Thermal POS Printer</h4>
                            <p className="text-[11px] font-bold text-zinc-600 mt-0.5">Model: POS-5802 / ESC-POS Standard</p>
                            <p className="text-[10px] text-zinc-500">Dual Connection: Wireless Bluetooth (BLE/SPP) + USB Cable</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono font-bold bg-zinc-200 text-black px-2 py-0.5 rounded-md">
                          58mm (2-inch)
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-200 text-center text-[10px]">
                        <div className="p-2 bg-white rounded-xl border border-zinc-200">
                          <span className="text-zinc-400 block font-bold">Paper Width</span>
                          <span className="font-black text-black">58 mm (2-Inch)</span>
                        </div>
                        <div className="p-2 bg-white rounded-xl border border-zinc-200">
                          <span className="text-zinc-400 block font-bold">Columns</span>
                          <span className="font-black text-black">32 Characters</span>
                        </div>
                        <div className="p-2 bg-white rounded-xl border border-zinc-200">
                          <span className="text-zinc-400 block font-bold">Resolution</span>
                          <span className="font-black text-black">203 DPI / 8 dots/mm</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bluetooth Direct Connect Button */}
                  <div className="bg-white rounded-3xl p-5 border border-zinc-200 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Bluetooth className="w-4 h-4 text-blue-600" />
                        <span className="text-xs font-black text-black">SEZNIK Bluetooth Direct Connect</span>
                      </div>
                      <span className="text-[10px] font-mono font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md">
                        ESC/POS 58mm
                      </span>
                    </div>

                    <p className="text-xs text-zinc-500">
                      Print bills straight from your tablet or laptop browser directly to your SEZNIK Bluetooth printer without any cables.
                    </p>

                    {btStatus && (
                      <div className={`p-2.5 rounded-xl text-xs font-bold ${
                        btStatus.includes('Error') 
                          ? 'bg-red-50 text-red-700 border border-red-200' 
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {btStatus}
                      </div>
                    )}

                    <div className="pt-1 flex items-center gap-2">
                      <button
                        onClick={handleBluetoothTestPrint}
                        disabled={isBluetoothPrinting}
                        className="px-4 py-2.5 rounded-xl bg-black hover:bg-zinc-800 text-white text-xs font-black flex items-center space-x-2 transition disabled:opacity-50 cursor-pointer shadow-xs active:scale-98"
                      >
                        {isBluetoothPrinting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Printer className="w-3.5 h-3.5" />}
                        <span>Print Test Bill (SEZNIK Bluetooth)</span>
                      </button>

                      <button
                        onClick={() => window.print()}
                        className="px-3.5 py-2.5 rounded-xl border border-zinc-300 hover:border-black text-black text-xs font-bold transition cursor-pointer"
                      >
                        System Print (USB)
                      </button>
                    </div>
                  </div>

                  {/* Page Size & Extra Lines for SEZNIK 58mm */}
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
                          <span>2-inch (58mm - SEZNIK Default)</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            name="pagesize"
                            checked={pageSize === '3-inch'}
                            onChange={() => setPageSize('3-inch')}
                            className="accent-black"
                          />
                          <span>3-inch (80mm)</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <span className="text-xs font-extrabold text-black block mb-1">Extra lines at the end</span>
                      <p className="text-[11px] text-zinc-400 mb-2">Provides tear-off margin space for SEZNIK paper cutter.</p>
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

                {/* Right 5 cols: Live Bill Preview Optimized for SEZNIK 58mm */}
                <div className="lg:col-span-5 space-y-2">
                  <span className="text-xs font-bold text-zinc-500 block text-center lg:text-left">
                    SEZNIK 58mm Preview
                  </span>
                  
                  {/* SEZNIK 58mm Narrow Slip Preview */}
                  <div 
                    id="printable-receipt"
                    className="bg-white rounded-3xl p-4 sm:p-5 border border-zinc-200 shadow-md font-mono text-[11px] text-black space-y-3 max-w-[280px] mx-auto"
                  >
                    {/* Header */}
                    <div className="text-center space-y-0.5">
                      <div className="flex justify-center mb-1">
                        <img 
                          src="/brand-calligraphy-uploaded.png" 
                          alt="ഇത്തിപ്പൂരം" 
                          className="h-8 w-auto object-contain"
                        />
                      </div>
                      <p className="text-[9px] text-zinc-600 font-sans font-bold">Vanchiyoor, Trivandrum</p>
                      <p className="text-[9px] text-zinc-400 font-sans">Ph: +91 94470 00000</p>
                      <div className="border-b border-dashed border-zinc-400 pt-1.5" />
                      <p className="text-[10px] font-black uppercase tracking-wider font-sans pt-1">BILL OF SUPPLY</p>
                    </div>

                    {/* Metadata */}
                    <div className="text-[10px] space-y-0.5">
                      <div className="flex justify-between">
                        <span>Inv: 1001</span>
                        <span>04/11/2026</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Table: T1</span>
                        <span>Mode: Cash</span>
                      </div>
                      <div className="border-b border-dashed border-zinc-400 pt-1" />
                    </div>

                    {/* Items for 58mm */}
                    <div className="space-y-1 text-[10px]">
                      <div className="flex justify-between font-bold text-zinc-500 uppercase">
                        <span>ITEM</span>
                        <div className="flex space-x-2">
                          <span>QTY</span>
                          <span>AMT</span>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-bold truncate max-w-[120px]">Aavoli fry</span>
                        <div className="flex space-x-3 font-mono">
                          <span>1</span>
                          <span className="font-bold">120.00</span>
                        </div>
                      </div>
                      <div className="border-b border-dashed border-zinc-400 pt-1" />
                    </div>

                    {/* Totals */}
                    <div className="space-y-0.5 pt-0.5">
                      <div className="flex justify-between font-black text-xs">
                        <span>TOTAL:</span>
                        <span>Rs.120.00</span>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="text-center pt-2 border-t border-dashed border-zinc-400 text-[9px] text-zinc-500 font-sans space-y-0.5">
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
                <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200 space-y-2 text-xs">
                  <div className="flex justify-between font-bold text-zinc-700">
                    <span>Default Cashier PIN:</span>
                    <span className="font-mono text-black">5566</span>
                  </div>
                  <div className="flex justify-between font-bold text-zinc-700">
                    <span>Manager Settlement PIN:</span>
                    <span className="font-mono text-black">7788</span>
                  </div>
                  <div className="flex justify-between font-bold text-zinc-700">
                    <span>Admin PIN:</span>
                    <span className="font-mono text-black">1122</span>
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>

      </main>

    </div>
  );
}
