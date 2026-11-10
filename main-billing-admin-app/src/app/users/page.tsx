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
  LogOut, 
  Menu as MenuIcon, 
  X, 
  Bluetooth, 
  CheckCircle2, 
  Loader2, 
  RefreshCw, 
  Receipt,
  ShieldCheck,
  AlertTriangle,
  Trash2,
  FolderDown,
  FileSpreadsheet,
  Plus,
  Lock,
  Unlock,
  Key,
  Check,
  Calendar,
  HardDrive,
  ArrowLeft
} from 'lucide-react';
import { getCurrentUser } from '../../lib/api';
import { printDirectToBluetoothThermalPrinter } from '../../lib/thermalPrinter';

export default function MorePage() {
  const router = useRouter();

  // Active sub-tab in More: 1. printer, 2. staff, 3. reports, 4. storage, 5. reset (null = 5 options landing)
  const [activeTab, setActiveTab] = useState<'printer' | 'staff' | 'reports' | 'storage' | 'reset' | null>(null);
  
  // Printer Configuration (SEZNIK 58mm default)
  const [pageSize, setPageSize] = useState<'2-inch' | '3-inch'>('2-inch');
  const [extraLines, setExtraLines] = useState<number>(6);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isBluetoothPrinting, setIsBluetoothPrinting] = useState(false);
  const [btStatus, setBtStatus] = useState<string | null>(null);

  // Staff Section State (Admin Password Protected)
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [adminPinInput, setAdminPinInput] = useState('');
  const [adminPinError, setAdminPinError] = useState<string | null>(null);
  const [isAddStaffModalOpen, setIsAddStaffModalOpen] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState('CASHIER');
  const [newStaffPin, setNewStaffPin] = useState('');
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffMessage, setStaffMessage] = useState<string | null>(null);
  const [staffList, setStaffList] = useState<any[]>([
    { id: '1', fullName: 'Main Administrator', role: 'MAIN_ADMIN', pin: '5566', status: 'ACTIVE' },
    { id: '2', fullName: 'Counter Cashier', role: 'CASHIER', pin: '7788', status: 'ACTIVE' },
    { id: '3', fullName: 'Kitchen Chef Head', role: 'KITCHEN_STAFF', pin: '1122', status: 'ACTIVE' },
  ]);

  // Factory Reset State (Admin Sensitive)
  const [resetPinInput, setResetPinInput] = useState('');
  const [resetWipeAll, setResetWipeAll] = useState(true);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState(false);

  // Storage and Archives State
  const [phoneStoragePath, setPhoneStoragePath] = useState(
    typeof window !== 'undefined' && /android/i.test(navigator.userAgent)
      ? 'Internal Storage/Download/IthiPooram_POS/reports_archive/'
      : typeof window !== 'undefined' && /iphone|ipad/i.test(navigator.userAgent)
      ? 'Files App > On My iPhone > IthiPooram_POS/reports_archive/'
      : 'Downloads/IthiPooram_POS/reports_archive/'
  );

  // Mock latest 10 reports for inspection & audit
  const [latestReports] = useState([
    { id: 'rep-1', date: '08 Nov 2026', shift: 'Night Z-Report', totalSales: 24850, orders: 42, cash: 14200, upi: 10650, file: 'Z_Report_2026_11_08.xlsx' },
    { id: 'rep-2', date: '07 Nov 2026', shift: 'Night Z-Report', totalSales: 28400, orders: 51, cash: 15300, upi: 13100, file: 'Z_Report_2026_11_07.xlsx' },
    { id: 'rep-3', date: '06 Nov 2026', shift: 'Night Z-Report', totalSales: 21900, orders: 38, cash: 11000, upi: 10900, file: 'Z_Report_2026_11_06.xlsx' },
    { id: 'rep-4', date: '05 Nov 2026', shift: 'Night Z-Report', totalSales: 31200, orders: 59, cash: 18400, upi: 12800, file: 'Z_Report_2026_11_05.xlsx' },
    { id: 'rep-5', date: '04 Nov 2026', shift: 'Night Z-Report', totalSales: 19800, orders: 34, cash: 9500, upi: 10300, file: 'Z_Report_2026_11_04.xlsx' },
    { id: 'rep-6', date: '03 Nov 2026', shift: 'Night Z-Report', totalSales: 26500, orders: 48, cash: 13800, upi: 12700, file: 'Z_Report_2026_11_03.xlsx' },
    { id: 'rep-7', date: '02 Nov 2026', shift: 'Night Z-Report', totalSales: 23400, orders: 40, cash: 12000, upi: 11400, file: 'Z_Report_2026_11_02.xlsx' },
    { id: 'rep-8', date: '01 Nov 2026', shift: 'Night Z-Report', totalSales: 33500, orders: 62, cash: 19100, upi: 14400, file: 'Z_Report_2026_11_01.xlsx' },
    { id: 'rep-9', date: '31 Oct 2026', shift: 'Night Z-Report', totalSales: 29800, orders: 54, cash: 16200, upi: 13600, file: 'Z_Report_2026_10_31.xlsx' },
    { id: 'rep-10', date: '30 Oct 2026', shift: 'Night Z-Report', totalSales: 25100, orders: 45, cash: 13500, upi: 11600, file: 'Z_Report_2026_10_30.xlsx' },
  ]);

  // Daily Reports State (5 Essential Daily Reports)
  const [activeReportSubTab, setActiveReportSubTab] = useState<'sales' | 'menu' | 'tables' | 'staff' | 'billing'>('sales');
  const [dailyReports, setDailyReports] = useState<any | null>(null);
  const [loadingDailyReports, setLoadingDailyReports] = useState(false);

  const fetchDailyReports = async () => {
    try {
      setLoadingDailyReports(true);
      const res = await fetch('/api/admin/daily-reports');
      if (res.ok) {
        const d = await res.json();
        setDailyReports(d.reports);
      }
    } catch (e) {
      console.error('Failed to load daily reports:', e);
    } finally {
      setLoadingDailyReports(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'reports') {
      fetchDailyReports();
    }
  }, [activeTab]);

  const handleDownloadFullDailyWorkbook = () => {
    const today = new Date().toISOString().slice(0, 10);
    const link = document.createElement('a');
    link.href = `/api/admin/daily-reports?format=excel&date=${today}`;
    link.download = `IthiPooram_Daily_Reports_${today}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      router.replace('/login');
    }
    // Load persisted extraLines for printer tear-off
    if (typeof window !== 'undefined') {
      const savedLines = localStorage.getItem('ithipooram_printer_extra_lines');
      if (savedLines) {
        setExtraLines(Number(savedLines));
      }
    }
  }, [router]);

  const updateExtraLines = (val: number) => {
    const clamped = Math.max(0, val);
    setExtraLines(clamped);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ithipooram_printer_extra_lines', String(clamped));
    }
  };

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

  // Admin PIN Unlock Handler
  const handleUnlockAdmin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (adminPinInput === '5566') {
      setIsAdminUnlocked(true);
      setAdminPinError(null);
    } else {
      setAdminPinError('Invalid Admin PIN. Please enter 5566.');
    }
  };

  // Add Staff Handler
  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim() || newStaffPin.length !== 4) {
      alert('Please enter staff name and a 4-digit PIN');
      return;
    }
    setStaffLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newStaffName.trim(),
          pin: newStaffPin.trim(),
          role: newStaffRole,
        }),
      });

      if (res.ok) {
        setStaffList((prev) => [
          ...prev,
          {
            id: String(Date.now()),
            fullName: newStaffName.trim(),
            role: newStaffRole,
            pin: newStaffPin.trim(),
            status: 'ACTIVE',
          },
        ]);
        setStaffMessage(`✓ Staff "${newStaffName}" registered successfully!`);
        setNewStaffName('');
        setNewStaffPin('');
        setIsAddStaffModalOpen(false);
        setTimeout(() => setStaffMessage(null), 3000);
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to register staff');
      }
    } catch (err: any) {
      alert('Error registering staff: ' + err.message);
    } finally {
      setStaffLoading(false);
    }
  };

  // Factory Reset Execution
  const handleExecuteFactoryReset = async () => {
    if (resetPinInput !== '5566') {
      setResetError('Unauthorized. Enter Admin PIN 5566 to confirm factory reset.');
      return;
    }

    if (!confirm('FINAL WARNING: This will completely erase all orders, sales data, and reset all tables to 0. Are you 100% sure?')) {
      return;
    }

    setResetLoading(true);
    setResetError(null);
    try {
      const res = await fetch('/api/admin/factory-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminPin: resetPinInput,
          resetMode: resetWipeAll ? 'FULL_WIPE' : 'CLEAN_START',
        }),
      });

      if (res.ok) {
        setResetSuccess(true);
        setStaffList([]);
        if (typeof window !== 'undefined') {
          localStorage.clear();
        }
        setTimeout(() => {
          router.replace('/login');
        }, 1500);
      } else {
        const d = await res.json();
        setResetError(d.error || 'Factory reset failed');
      }
    } catch (err: any) {
      setResetError('Reset failed: ' + err.message);
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#0A0C10] flex flex-col md:flex-row font-sans selection:bg-zinc-800 selection:text-white">
      
      {/* ============================================================== */}
      {/* 1. LEFT SIDEBAR                                                 */}
      {/* ============================================================== */}
      <aside className="hidden md:flex md:w-64 lg:w-72 bg-[#0C0E12] text-zinc-300 flex-col justify-between border-r border-zinc-800 shrink-0 select-none">
        
        {/* Top Brand Logo */}
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
              className="p-1.5 rounded-lg bg-zinc-800/60 hover:bg-zinc-700 text-zinc-400 hover:text-white transition shrink-0 cursor-pointer"
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
            href="/"
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
            <button onClick={handleSignOut} className="text-zinc-500 hover:text-white p-1 cursor-pointer">
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
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-300 cursor-pointer"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
          </button>
          <img 
            src="/brand-calligraphy-uploaded.png" 
            alt="ഇത്തിപ്പൂരം" 
            className="h-9 w-auto object-contain invert brightness-200"
          />
        </div>
        <Link href="/" className="px-3.5 py-1.5 rounded-xl bg-white text-black font-black text-xs">
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
      {/* 3. MAIN WORKSPACE (SEZNIK PRINTER, STAFF, REPORTS, STORAGE, RESET) */}
      {/* Downscroll is completely unrestricted with pb-64 sm:pb-48     */}
      {/* ============================================================== */}
      <main className="flex-1 flex flex-col w-full min-h-screen overflow-y-auto pb-64 sm:pb-48">
        
        {/* ========================================================== */}
        {/* LANDING PAGE: HEADING "MORE OPTION" & EXACTLY 5 OPTIONS    */}
        {/* ========================================================== */}
        {activeTab === null && (
          <div className="flex-1 flex flex-col w-full">
            {/* Top Header: Only heading "More Option", no subtitles, no badges */}
            <div className="px-4 sm:px-6 py-4 sm:py-5 bg-white border-b border-zinc-200 shrink-0">
              <h1 className="text-xl sm:text-2xl font-black text-black tracking-tight">More Option</h1>
            </div>

            {/* Exactly 5 Options on the First Page: Flat Clean List without curved rectangle boxes */}
            <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 py-2 pb-60">
              <div className="divide-y divide-zinc-200">
                {/* 1. Printer */}
                <button
                  type="button"
                  onClick={() => setActiveTab('printer')}
                  className="w-full text-left py-4 sm:py-5 px-2 flex items-center justify-between hover:bg-zinc-100/60 active:bg-zinc-100 transition cursor-pointer group"
                >
                  <div className="flex items-start space-x-3.5 pr-2">
                    <span className="font-mono font-bold text-xs text-zinc-400 mt-1">01</span>
                    <div>
                      <h2 className="text-base sm:text-lg font-black text-black group-hover:text-zinc-700 transition">
                        1. Printer Setup
                      </h2>
                      <p className="text-xs text-zinc-500 font-medium mt-0.5 leading-relaxed">
                        SEZNIK 58mm POS printer setup, paper width (2-inch / 3-inch), test print &amp; feed lines
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-zinc-400 group-hover:text-black group-hover:translate-x-1 transition-all shrink-0" />
                </button>

                {/* 2. Staff */}
                <button
                  type="button"
                  onClick={() => setActiveTab('staff')}
                  className="w-full text-left py-4 sm:py-5 px-2 flex items-center justify-between hover:bg-zinc-100/60 active:bg-zinc-100 transition cursor-pointer group"
                >
                  <div className="flex items-start space-x-3.5 pr-2">
                    <span className="font-mono font-bold text-xs text-zinc-400 mt-1">02</span>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h2 className="text-base sm:text-lg font-black text-black group-hover:text-zinc-700 transition">
                          2. Staff Access &amp; PINs
                        </h2>
                        <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      </div>
                      <p className="text-xs text-zinc-500 font-medium mt-0.5 leading-relaxed">
                        Staff management, designated roles (Cashier, Chef, Manager) and 4-digit PIN access (Admin PIN 5566)
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-zinc-400 group-hover:text-black group-hover:translate-x-1 transition-all shrink-0" />
                </button>

                {/* 3. Reports */}
                <button
                  type="button"
                  onClick={() => setActiveTab('reports')}
                  className="w-full text-left py-4 sm:py-5 px-2 flex items-center justify-between hover:bg-zinc-100/60 active:bg-zinc-100 transition cursor-pointer group"
                >
                  <div className="flex items-start space-x-3.5 pr-2">
                    <span className="font-mono font-bold text-xs text-zinc-400 mt-1">03</span>
                    <div>
                      <h2 className="text-base sm:text-lg font-black text-black group-hover:text-zinc-700 transition">
                        3. Reports &amp; Analytics
                      </h2>
                      <p className="text-xs text-zinc-500 font-medium mt-0.5 leading-relaxed">
                        Total Sales of the Day, Remaining Menu Stock, Daily Table Revenue, Staff Login Audit &amp; 5-in-1 Excel export
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-zinc-400 group-hover:text-black group-hover:translate-x-1 transition-all shrink-0" />
                </button>

                {/* 4. Storage */}
                <button
                  type="button"
                  onClick={() => setActiveTab('storage')}
                  className="w-full text-left py-4 sm:py-5 px-2 flex items-center justify-between hover:bg-zinc-100/60 active:bg-zinc-100 transition cursor-pointer group"
                >
                  <div className="flex items-start space-x-3.5 pr-2">
                    <span className="font-mono font-bold text-xs text-zinc-400 mt-1">04</span>
                    <div>
                      <h2 className="text-base sm:text-lg font-black text-black group-hover:text-zinc-700 transition">
                        4. Storage &amp; Archives
                      </h2>
                      <p className="text-xs text-zinc-500 font-medium mt-0.5 leading-relaxed">
                        Phone storage folder path for reports archive, latest 10 saved daily reports &amp; export history
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-zinc-400 group-hover:text-black group-hover:translate-x-1 transition-all shrink-0" />
                </button>

                {/* 5. Reset */}
                <button
                  type="button"
                  onClick={() => setActiveTab('reset')}
                  className="w-full text-left py-4 sm:py-5 px-2 flex items-center justify-between hover:bg-red-50/60 active:bg-red-50 transition cursor-pointer group"
                >
                  <div className="flex items-start space-x-3.5 pr-2">
                    <span className="font-mono font-bold text-xs text-red-400 mt-1">05</span>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h2 className="text-base sm:text-lg font-black text-red-600 group-hover:text-red-700 transition">
                          5. Factory Reset (Handover)
                        </h2>
                        <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                      </div>
                      <p className="text-xs text-red-500/80 font-medium mt-0.5 leading-relaxed">
                        Reset app to start fresh as new with all values 0, no menu, no tables for clean handover (Admin PIN 5566)
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-red-400 group-hover:text-red-600 group-hover:translate-x-1 transition-all shrink-0" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================== */}
        {/* DRILL-DOWN FUNCTION VIEW (WHEN AN OPTION IS OPENED)        */}
        {/* ========================================================== */}
        {activeTab !== null && (
          <div className="flex-1 flex flex-col w-full">
            {/* Top Navigation Bar with Back Button & Pills */}
            <div className="px-4 sm:px-6 py-3.5 bg-white border-b border-zinc-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setActiveTab(null)}
                  className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-extrabold text-xs transition cursor-pointer active:scale-95 shadow-xs"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>More Option</span>
                </button>
                <span className="text-zinc-300 font-bold">/</span>
                <h1 className="text-base sm:text-lg font-black text-black truncate max-w-[200px] sm:max-w-none">
                  {activeTab === 'printer' && '1. Printer (SEZNIK 58mm)'}
                  {activeTab === 'staff' && '2. Staff Access & PINs'}
                  {activeTab === 'reports' && '3. Reports & Analytics'}
                  {activeTab === 'storage' && '4. Storage & Local Archives'}
                  {activeTab === 'reset' && '5. Factory Reset (Handover)'}
                </h1>
              </div>

              {/* Quick pills to switch between the 5 options */}
              <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-full">
                <button
                  type="button"
                  onClick={() => setActiveTab('printer')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer whitespace-nowrap ${
                    activeTab === 'printer' ? 'bg-black text-white shadow-xs' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  }`}
                >
                  1. Printer
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('staff')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer whitespace-nowrap ${
                    activeTab === 'staff' ? 'bg-black text-white shadow-xs' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  }`}
                >
                  2. Staff
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('reports')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer whitespace-nowrap ${
                    activeTab === 'reports' ? 'bg-black text-white shadow-xs' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  }`}
                >
                  3. Reports
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('storage')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer whitespace-nowrap ${
                    activeTab === 'storage' ? 'bg-black text-white shadow-xs' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  }`}
                >
                  4. Storage
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('reset')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer whitespace-nowrap ${
                    activeTab === 'reset' ? 'bg-red-600 text-white shadow-xs' : 'bg-red-50 text-red-700 hover:bg-red-100'
                  }`}
                >
                  5. Reset
                </button>
              </div>
            </div>

            {/* Right Main Panel with Full Scroll */}
            <div className="flex-1 p-4 sm:p-6 space-y-6 pb-64 sm:pb-48">
            
            {/* ========================================================== */}
            {/* 1. PRINTER SETTINGS PANEL                                   */}
            {/* ========================================================== */}
            {activeTab === 'printer' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start max-w-5xl">
                
                {/* Left 7 cols: Printer Configuration */}
                <div className="lg:col-span-7 space-y-6">
                  
                  {/* Connected Hardware Card */}
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
                      <p className="text-[11px] text-zinc-400 mb-2">Provides clean tear-off margin space for SEZNIK paper cutter.</p>
                      <div className="inline-flex items-center space-x-3 bg-zinc-100 p-1 rounded-xl">
                        <button
                          type="button"
                          onClick={() => updateExtraLines(extraLines - 1)}
                          className="w-7 h-7 rounded-lg bg-white text-black font-bold flex items-center justify-center shadow-xs cursor-pointer"
                        >
                          -
                        </button>
                        <span className="font-mono font-bold text-xs px-2">{extraLines} lines</span>
                        <button
                          type="button"
                          onClick={() => updateExtraLines(extraLines + 1)}
                          className="w-7 h-7 rounded-lg bg-white text-black font-bold flex items-center justify-center shadow-xs cursor-pointer"
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
                    SEZNIK 58mm Slip Preview
                  </span>
                  
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

                    {/* Visual Feed lines preview */}
                    <div className="pt-2 text-center text-[9px] text-zinc-300 font-mono">
                      {Array.from({ length: extraLines }).map((_, i) => (
                        <div key={i} className="h-2 border-b border-dotted border-zinc-200" />
                      ))}
                      <span className="block mt-1 text-[8px] text-zinc-400">--- Tear Off Margin ---</span>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* ========================================================== */}
            {/* 2. STAFF ACCESS & PINS (ADMIN PASSWORD PROTECTED)          */}
            {/* ========================================================== */}
            {activeTab === 'staff' && (
              <div className="max-w-3xl space-y-6">
                {!isAdminUnlocked ? (
                  /* Admin Password Challenge Form */
                  <div className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200 shadow-xs max-w-md mx-auto text-center space-y-5">
                    <div className="w-14 h-14 rounded-2xl bg-zinc-100 flex items-center justify-center mx-auto text-zinc-800">
                      <Lock className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-black">Admin Access Required</h3>
                      <p className="text-xs text-zinc-500 mt-1">
                        Staff PINs &amp; credential configurations are protected. Enter the primary Admin PIN to unlock.
                      </p>
                    </div>

                    <form onSubmit={handleUnlockAdmin} className="space-y-3">
                      <div>
                        <input
                          type="password"
                          inputMode="numeric"
                          maxLength={6}
                          value={adminPinInput}
                          onChange={(e) => {
                            setAdminPinInput(e.target.value);
                            setAdminPinError(null);
                          }}
                          placeholder="Enter Admin PIN (5566)"
                          className="w-full text-center text-xl font-mono font-black tracking-widest py-3 px-4 rounded-2xl bg-zinc-50 border border-zinc-300 focus:outline-none focus:border-black text-black"
                        />
                        {adminPinError && (
                          <p className="text-xs text-red-600 font-bold mt-1.5">{adminPinError}</p>
                        )}
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3 px-4 rounded-2xl bg-black hover:bg-zinc-800 text-white font-black text-xs transition shadow-sm cursor-pointer"
                      >
                        Unlock Staff Management
                      </button>
                    </form>
                  </div>
                ) : (
                  /* Unlocked Staff Management Interface */
                  <div className="bg-white rounded-3xl p-6 border border-zinc-200 shadow-xs space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-100">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                          <h3 className="text-base font-black text-black">Staff Credentials &amp; Access Controls</h3>
                        </div>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          Admin PIN authorized. Configure rapid 4-digit PINs for counter tablets and phones.
                        </p>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setIsAddStaffModalOpen(true)}
                          className="px-4 py-2.5 rounded-2xl bg-black hover:bg-zinc-800 text-white font-black text-xs flex items-center space-x-1.5 transition shadow-xs cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ Add Staff</span>
                        </button>
                        <button
                          onClick={() => {
                            setIsAdminUnlocked(false);
                            setAdminPinInput('');
                          }}
                          className="p-2.5 rounded-2xl border border-zinc-200 hover:bg-zinc-100 text-zinc-600 cursor-pointer"
                          title="Lock Section"
                        >
                          <Lock className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {staffMessage && (
                      <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center space-x-2">
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span>{staffMessage}</span>
                      </div>
                    )}

                    {/* Staff Credentials Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-zinc-700">
                        <thead className="bg-zinc-50 text-[10px] font-extrabold uppercase tracking-wider text-zinc-500 border-y border-zinc-200">
                          <tr>
                            <th className="py-3 px-4">Staff Member</th>
                            <th className="py-3 px-4">Designated Role</th>
                            <th className="py-3 px-4">4-Digit Fast PIN</th>
                            <th className="py-3 px-4">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                          {staffList.map((st) => (
                            <tr key={st.id} className="hover:bg-zinc-50/70">
                              <td className="py-3.5 px-4 font-bold text-zinc-900">{st.fullName}</td>
                              <td className="py-3.5 px-4">
                                <span className="px-2.5 py-1 rounded-xl bg-zinc-100 border border-zinc-200 font-mono text-[10px] font-black text-zinc-800">
                                  {st.role}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 font-mono font-black text-black">
                                •••• ({st.pin})
                              </td>
                              <td className="py-3.5 px-4">
                                <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                  <span>Active</span>
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ========================================================== */}
            {/* 3. REPORTS & ANALYTICS TAB (5 ESSENTIAL DAILY REPORTS)     */}
            {/* ========================================================== */}
            {activeTab === 'reports' && (
              <div className="max-w-5xl space-y-6">
                <div className="bg-white rounded-3xl p-6 border border-zinc-200 shadow-xs space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-100">
                    <div>
                      <h3 className="text-base sm:text-lg font-black text-black">Daily Business Audits &amp; Compliance Reports</h3>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        Saved automatically datewise into <span className="font-mono text-black font-bold">{phoneStoragePath}</span>
                      </p>
                    </div>

                    <button
                      onClick={handleDownloadFullDailyWorkbook}
                      className="px-4 py-2.5 rounded-2xl bg-black hover:bg-zinc-800 text-white font-black text-xs flex items-center space-x-2 transition shadow-xs cursor-pointer shrink-0"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                      <span>Export Today's 5-in-1 Daily Folder (.xls)</span>
                    </button>
                  </div>

                  {/* 5 Daily Reports Navigation Pills */}
                  <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 border-b border-zinc-100">
                    <button
                      onClick={() => setActiveReportSubTab('sales')}
                      className={`px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer shrink-0 ${
                        activeReportSubTab === 'sales'
                          ? 'bg-black text-white shadow-xs'
                          : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                      }`}
                    >
                      1. Total Sales of the Day
                    </button>
                    <button
                      onClick={() => setActiveReportSubTab('menu')}
                      className={`px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer shrink-0 ${
                        activeReportSubTab === 'menu'
                          ? 'bg-black text-white shadow-xs'
                          : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                      }`}
                    >
                      2. Menu &amp; Remaining Stock
                    </button>
                    <button
                      onClick={() => setActiveReportSubTab('tables')}
                      className={`px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer shrink-0 ${
                        activeReportSubTab === 'tables'
                          ? 'bg-black text-white shadow-xs'
                          : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                      }`}
                    >
                      3. Table-wise Revenue
                    </button>
                    <button
                      onClick={() => setActiveReportSubTab('staff')}
                      className={`px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer shrink-0 ${
                        activeReportSubTab === 'staff'
                          ? 'bg-black text-white shadow-xs'
                          : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                      }`}
                    >
                      4. Staff Login Audit
                    </button>
                    <button
                      onClick={() => setActiveReportSubTab('billing')}
                      className={`px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer shrink-0 ${
                        activeReportSubTab === 'billing'
                          ? 'bg-black text-white shadow-xs'
                          : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                      }`}
                    >
                      5. Billing Authorization
                    </button>
                  </div>

                  {/* SUB-REPORT 1: TOTAL SALES OF THE DAY */}
                  {activeReportSubTab === 'sales' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200">
                          <span className="text-[10px] font-extrabold uppercase text-zinc-400 block">Gross Sales</span>
                          <span className="text-lg font-black text-black">
                            ₹{(dailyReports?.totalSales?.grossSalesRupees || 0).toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200">
                          <span className="text-[10px] font-extrabold uppercase text-zinc-400 block">Bills Settled</span>
                          <span className="text-lg font-black text-black">
                            {dailyReports?.totalSales?.totalBillsSettled || 0}
                          </span>
                        </div>
                        <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200">
                          <span className="text-[10px] font-extrabold uppercase text-zinc-400 block">Cash Collected</span>
                          <span className="text-lg font-black text-emerald-700">
                            ₹{(dailyReports?.totalSales?.cashRupees || 0).toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200">
                          <span className="text-[10px] font-extrabold uppercase text-zinc-400 block">UPI Transfers</span>
                          <span className="text-lg font-black text-blue-700">
                            ₹{(dailyReports?.totalSales?.upiRupees || 0).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>

                      <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200 space-y-2 text-xs font-semibold">
                        <div className="flex justify-between">
                          <span className="text-zinc-600">Average Order Value (AOV):</span>
                          <span className="font-mono font-bold text-black">₹{dailyReports?.totalSales?.aovRupees || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-600">CGST (2.5% Tax):</span>
                          <span className="font-mono font-bold text-black">₹{dailyReports?.totalSales?.cgstRupees || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-600">SGST (2.5% Tax):</span>
                          <span className="font-mono font-bold text-black">₹{dailyReports?.totalSales?.sgstRupees || 0}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SUB-REPORT 2: MENU OF THE DAY & REMAINING STOCK */}
                  {activeReportSubTab === 'menu' && (
                    <div className="space-y-3">
                      <p className="text-xs text-zinc-500 font-semibold">
                        Quantity sold today, active prices, and remaining available kitchen stock.
                      </p>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-zinc-700">
                          <thead className="bg-zinc-50 text-[10px] font-extrabold uppercase tracking-wider text-zinc-500 border-y border-zinc-200">
                            <tr>
                              <th className="py-2.5 px-3">Dish Name</th>
                              <th className="py-2.5 px-3">Category</th>
                              <th className="py-2.5 px-3 text-right">Price</th>
                              <th className="py-2.5 px-3 text-right">Sold Today</th>
                              <th className="py-2.5 px-3 text-right">Remaining Stock</th>
                              <th className="py-2.5 px-3 text-right">Total Revenue</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-100">
                            {(!dailyReports?.menuAndRemainingStock || dailyReports.menuAndRemainingStock.length === 0) ? (
                              <tr>
                                <td colSpan={6} className="py-6 text-center text-zinc-400 font-semibold">
                                  No dishes logged for today yet.
                                </td>
                              </tr>
                            ) : (
                              dailyReports.menuAndRemainingStock.map((it: any, idx: number) => (
                                <tr key={it.name || idx} className="hover:bg-zinc-50/70">
                                  <td className="py-2.5 px-3 font-bold text-zinc-900">
                                    {it.name}
                                    {it.malayalamName && <span className="block text-[10px] text-zinc-400">{it.malayalamName}</span>}
                                  </td>
                                  <td className="py-2.5 px-3 text-zinc-500">{it.category}</td>
                                  <td className="py-2.5 px-3 font-mono text-right font-bold">₹{it.priceRupees}</td>
                                  <td className="py-2.5 px-3 font-mono text-right font-black text-black">{it.soldQty}</td>
                                  <td className="py-2.5 px-3 font-mono text-right font-bold text-emerald-700">{it.currentStock}</td>
                                  <td className="py-2.5 px-3 font-mono text-right font-black text-black">₹{it.revenueRupees}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* SUB-REPORT 3: DAILY TABLE-WISE ORDER & REVENUE */}
                  {activeReportSubTab === 'tables' && (
                    <div className="space-y-3">
                      <p className="text-xs text-zinc-500 font-semibold">
                        Total dining checks served and revenue collected per table today.
                      </p>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-zinc-700">
                          <thead className="bg-zinc-50 text-[10px] font-extrabold uppercase tracking-wider text-zinc-500 border-y border-zinc-200">
                            <tr>
                              <th className="py-2.5 px-3">Table Code</th>
                              <th className="py-2.5 px-3">Dining Area / Name</th>
                              <th className="py-2.5 px-3 text-right">Orders Served</th>
                              <th className="py-2.5 px-3 text-right">Total Revenue</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-100">
                            {(!dailyReports?.tablewiseRevenue || dailyReports.tablewiseRevenue.length === 0) ? (
                              <tr>
                                <td colSpan={4} className="py-6 text-center text-zinc-400 font-semibold">
                                  No dining tables settled today yet.
                                </td>
                              </tr>
                            ) : (
                              dailyReports.tablewiseRevenue.map((t: any) => (
                                <tr key={t.tableCode} className="hover:bg-zinc-50/70">
                                  <td className="py-2.5 px-3 font-mono font-black text-black">{t.tableCode}</td>
                                  <td className="py-2.5 px-3 font-semibold text-zinc-700">{t.displayName}</td>
                                  <td className="py-2.5 px-3 font-mono text-right font-bold">{t.ordersCount}</td>
                                  <td className="py-2.5 px-3 font-mono text-right font-black text-black">₹{t.totalRevenueRupees}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* SUB-REPORT 4: STAFF LOGIN AUDIT */}
                  {activeReportSubTab === 'staff' && (
                    <div className="space-y-3">
                      <p className="text-xs text-zinc-500 font-semibold">
                        Staff shift logins, operational stations, and session active states.
                      </p>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-zinc-700">
                          <thead className="bg-zinc-50 text-[10px] font-extrabold uppercase tracking-wider text-zinc-500 border-y border-zinc-200">
                            <tr>
                              <th className="py-2.5 px-3">Staff Member</th>
                              <th className="py-2.5 px-3">Role</th>
                              <th className="py-2.5 px-3">Station</th>
                              <th className="py-2.5 px-3">Login Time</th>
                              <th className="py-2.5 px-3">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-100">
                            {(!dailyReports?.staffLoginAudit || dailyReports.staffLoginAudit.length === 0) ? (
                              <tr>
                                <td colSpan={5} className="py-6 text-center text-zinc-400 font-semibold">
                                  No staff login sessions recorded yet today.
                                </td>
                              </tr>
                            ) : (
                              dailyReports.staffLoginAudit.map((s: any, idx: number) => (
                                <tr key={s.sessionId || idx} className="hover:bg-zinc-50/70">
                                  <td className="py-2.5 px-3 font-bold text-black">{s.staffName}</td>
                                  <td className="py-2.5 px-3 font-mono text-xs">{s.role}</td>
                                  <td className="py-2.5 px-3 text-zinc-600">{s.station}</td>
                                  <td className="py-2.5 px-3 font-mono">{s.loginTime || s.loginDate}</td>
                                  <td className="py-2.5 px-3">
                                    <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                      <span>{s.status || 'Active'}</span>
                                    </span>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* SUB-REPORT 5: BILLING AUTHORIZATION & PRINT REPORT */}
                  {activeReportSubTab === 'billing' && (
                    <div className="space-y-3">
                      <p className="text-xs text-zinc-500 font-semibold">
                        Verification of which registered staff member authorized and printed each bill.
                      </p>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-zinc-700">
                          <thead className="bg-zinc-50 text-[10px] font-extrabold uppercase tracking-wider text-zinc-500 border-y border-zinc-200">
                            <tr>
                              <th className="py-2.5 px-3">Bill Number</th>
                              <th className="py-2.5 px-3">Table</th>
                              <th className="py-2.5 px-3 text-right">Amount</th>
                              <th className="py-2.5 px-3">Payment Mode</th>
                              <th className="py-2.5 px-3">Authorized &amp; Printed By</th>
                              <th className="py-2.5 px-3">Timestamp</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-100">
                            {(!dailyReports?.billingAuthorization || dailyReports.billingAuthorization.length === 0) ? (
                              <tr>
                                <td colSpan={6} className="py-6 text-center text-zinc-400 font-semibold">
                                  No bills settled today yet.
                                </td>
                              </tr>
                            ) : (
                              dailyReports.billingAuthorization.map((b: any, idx: number) => (
                                <tr key={b.billNumber || idx} className="hover:bg-zinc-50/70">
                                  <td className="py-2.5 px-3 font-mono font-bold text-black">{b.billNumber}</td>
                                  <td className="py-2.5 px-3 font-mono font-bold text-zinc-800">{b.tableCode}</td>
                                  <td className="py-2.5 px-3 font-mono text-right font-black text-black">₹{b.grandTotalRupees}</td>
                                  <td className="py-2.5 px-3 font-semibold text-zinc-700">{b.paymentMode}</td>
                                  <td className="py-2.5 px-3 font-bold text-indigo-900 bg-indigo-50/50 rounded-lg">
                                    {b.authorizedByStaffName}
                                  </td>
                                  <td className="py-2.5 px-3 font-mono text-[11px] text-zinc-500">
                                    {new Date(b.printedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            )}

            {/* ========================================================== */}
            {/* 4. STORAGE & LOCAL ARCHIVES                                */}
            {/* ========================================================== */}
            {activeTab === 'storage' && (
              <div className="max-w-4xl space-y-6">
                
                {/* Storage Path Card */}
                <div className="bg-white rounded-3xl p-6 border border-zinc-200 shadow-xs space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center">
                      <HardDrive className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-black">Phone Storage &amp; Database Archive Folder</h3>
                      <p className="text-xs text-zinc-500">
                        All daily sales, staff records, and menu edits are preserved locally on this device.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200 space-y-2">
                    <span className="text-[10px] font-extrabold uppercase text-zinc-500 tracking-wider block">
                      Active Storage Folder Path on Device:
                    </span>
                    <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-zinc-200 font-mono text-xs font-bold text-zinc-900 overflow-x-auto">
                      <span>{phoneStoragePath}</span>
                      <button
                        onClick={() => {
                          const customPath = prompt('Enter your phone storage folder path:', phoneStoragePath);
                          if (customPath) setPhoneStoragePath(customPath);
                        }}
                        className="ml-3 px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-black hover:text-white text-zinc-700 text-[11px] font-black transition cursor-pointer shrink-0"
                      >
                        Change Path
                      </button>
                    </div>
                    <p className="text-[11px] text-zinc-500 leading-relaxed pt-1">
                      💡 <strong>How to view on Android:</strong> Open the "Files" app &gt; Internal Storage &gt; Download &gt; <span className="font-mono text-black font-bold">IthiPooram_POS</span>. All Excel daily spreadsheets and JSON database ledgers are saved here automatically.
                    </p>
                  </div>
                </div>

                {/* Latest 10 Saved Reports Table */}
                <div className="bg-white rounded-3xl p-6 border border-zinc-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                    <div>
                      <h3 className="text-sm font-black text-black">Latest 10 Saved Daily Reports (Archived Locally)</h3>
                      <p className="text-xs text-zinc-500">Multi-sheet Excel audits generated at shift close</p>
                    </div>
                    <button
                      onClick={() => alert(`All 10 daily reports are saved in: ${phoneStoragePath}`)}
                      className="px-3.5 py-1.5 rounded-xl border border-zinc-300 hover:border-black text-black text-xs font-extrabold transition cursor-pointer"
                    >
                      Export All (.zip)
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-zinc-700">
                      <thead className="bg-zinc-50 text-[10px] font-extrabold uppercase tracking-wider text-zinc-500 border-y border-zinc-200">
                        <tr>
                          <th className="py-3 px-4">Date</th>
                          <th className="py-3 px-4">Shift Type</th>
                          <th className="py-3 px-4 text-right">Bills Settled</th>
                          <th className="py-3 px-4 text-right">Total Revenue</th>
                          <th className="py-3 px-4 text-right">Cash / UPI</th>
                          <th className="py-3 px-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {latestReports.map((rep) => (
                          <tr key={rep.id} className="hover:bg-zinc-50/70">
                            <td className="py-3 px-4 font-mono font-bold text-black">{rep.date}</td>
                            <td className="py-3 px-4 font-medium text-zinc-600">{rep.shift}</td>
                            <td className="py-3 px-4 font-mono font-bold text-zinc-800 text-right">{rep.orders}</td>
                            <td className="py-3 px-4 font-mono font-black text-black text-right">₹{rep.totalSales.toLocaleString('en-IN')}</td>
                            <td className="py-3 px-4 font-mono text-[11px] text-zinc-500 text-right">
                              ₹{rep.cash} / ₹{rep.upi}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => alert(`Report downloaded: ${rep.file}`)}
                                className="px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-black hover:text-white text-zinc-800 font-extrabold text-[11px] transition inline-flex items-center space-x-1 cursor-pointer"
                              >
                                <FolderDown className="w-3 h-3" />
                                <span>Download</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}

            {/* ========================================================== */}
            {/* 5. FACTORY RESET (SENSITIVE SHOP HANDOVER BUTTON)           */}
            {/* ========================================================== */}
            {activeTab === 'reset' && (
              <div className="max-w-2xl space-y-6">
                <div className="bg-red-50/50 rounded-3xl p-6 sm:p-8 border-2 border-red-300 shadow-sm space-y-5">
                  <div className="flex items-start space-x-3">
                    <div className="w-12 h-12 rounded-2xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-red-950">Factory Reset / Shop Handover Wipe</h3>
                      <p className="text-xs text-red-800 font-semibold mt-1 leading-relaxed">
                        This action is intended for handover to the shop. It wipes the entire staff database (no staffs), clears all test sales and orders, and resets all menu and tables to 0 so the restaurant owner starts with a brand new app showing full zeros everywhere.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-white rounded-2xl border border-red-200 space-y-3">
                    <div className="space-y-2">
                      <label className="flex items-center space-x-2 text-xs font-bold text-zinc-900 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={resetWipeAll}
                          onChange={(e) => setResetWipeAll(e.target.checked)}
                          className="accent-red-600 w-4 h-4 rounded"
                        />
                        <span>Complete Clean Wipe: Reset all tables &amp; menu to zero state</span>
                      </label>
                    </div>

                    <div>
                      <label className="block text-xs font-black text-zinc-900 uppercase tracking-wider mb-1">
                        Enter Admin PIN (5566) to Authorize Reset:
                      </label>
                      <input
                        type="password"
                        inputMode="numeric"
                        maxLength={6}
                        value={resetPinInput}
                        onChange={(e) => {
                          setResetPinInput(e.target.value);
                          setResetError(null);
                        }}
                        placeholder="Admin PIN 5566"
                        className="w-full py-2.5 px-4 rounded-xl bg-zinc-50 border border-zinc-300 text-sm font-mono font-black focus:outline-none focus:border-red-600 text-black"
                      />
                      {resetError && (
                        <p className="text-xs text-red-600 font-bold mt-1.5">{resetError}</p>
                      )}
                      {resetSuccess && (
                        <p className="text-xs text-emerald-700 font-bold mt-1.5">
                          ✓ App reset to factory state! Redirecting to setup...
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleExecuteFactoryReset}
                      disabled={resetLoading || resetPinInput.length === 0}
                      className="w-full py-3.5 px-4 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-xs flex items-center justify-center space-x-2 transition shadow-md cursor-pointer disabled:opacity-50"
                    >
                      {resetLoading ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                      <span>Execute Factory Reset &amp; Start As Fresh App</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            </div>
          </div>
        )}

      </main>

      {/* Add Staff Modal */}
      {isAddStaffModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-zinc-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-black" />
                <h3 className="text-base font-black text-black">Register New Staff Member</h3>
              </div>
              <button
                onClick={() => setIsAddStaffModalOpen(false)}
                className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-black flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-zinc-800 uppercase tracking-wider mb-1">
                  Full Name / ജീവനക്കാരന്റെ പേര്
                </label>
                <input
                  type="text"
                  required
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  placeholder="e.g. Rahul Nair"
                  className="w-full py-2.5 px-4 rounded-xl bg-zinc-50 border border-zinc-200 text-xs font-semibold focus:outline-none focus:border-black text-zinc-900"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-zinc-800 uppercase tracking-wider mb-1">
                  Designated Role / ജോലി
                </label>
                <select
                  value={newStaffRole}
                  onChange={(e) => setNewStaffRole(e.target.value)}
                  className="w-full py-2.5 px-4 rounded-xl bg-zinc-50 border border-zinc-200 text-xs font-semibold focus:outline-none focus:border-black text-zinc-900"
                >
                  <option value="CASHIER">Cashier (Billing &amp; Settlement Desk)</option>
                  <option value="KITCHEN_STAFF">Kitchen Chef (KDS Station)</option>
                  <option value="MANAGER">Floor Manager (Shift &amp; Table Control)</option>
                  <option value="MAIN_ADMIN">Administrator (Full Access)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-zinc-800 uppercase tracking-wider mb-1">
                  4-Digit Login PIN / 4 അക്ക പിൻ
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  required
                  value={newStaffPin}
                  onChange={(e) => setNewStaffPin(e.target.value)}
                  placeholder="e.g. 7788"
                  className="w-full py-2.5 px-4 rounded-xl bg-zinc-50 border border-zinc-200 text-sm font-mono font-black focus:outline-none focus:border-black text-zinc-900 text-center tracking-widest"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddStaffModalOpen(false)}
                  className="flex-1 py-3 rounded-2xl border border-zinc-200 text-xs font-bold text-zinc-600 hover:bg-zinc-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={staffLoading}
                  className="flex-1 py-3 rounded-2xl bg-black hover:bg-zinc-800 text-white font-black text-xs transition cursor-pointer shadow-md disabled:opacity-50"
                >
                  {staffLoading ? 'Registering...' : 'Save Staff Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
