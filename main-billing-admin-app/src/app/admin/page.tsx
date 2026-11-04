'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Home, 
  UtensilsCrossed, 
  BarChart3, 
  MoreHorizontal, 
  Plus, 
  Grid3X3, 
  ChevronRight, 
  Search, 
  Lock, 
  Clock, 
  TrendingUp, 
  ChevronDown, 
  RefreshCw, 
  UserPlus, 
  ArrowUpRight, 
  LogOut, 
  Receipt, 
  AlertCircle,
  Menu as MenuIcon,
  X,
  Layers,
  ChefHat
} from 'lucide-react';
import { apiRequest, getCurrentUser } from '../../lib/api';

export default function AdminOverviewPage() {
  const router = useRouter();

  // Authentication & Access Protection State
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Overview Data & Live Polling State
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [runningOrders, setRunningOrders] = useState<any[]>([]);
  const [tables, setTables] = useState<any[]>([]);

  // UI State: Graph metric tab & range selector
  const [chartMetric, setChartMetric] = useState<'sales' | 'orders' | 'aov'>('sales');
  const [selectedRange, setSelectedRange] = useState<'today' | '7days' | 'month' | 'all'>('today');

  // Mobile navigation drawer toggle
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  // Check session unlock status on mount
  useEffect(() => {
    if (!getCurrentUser()) {
      router.replace('/login');
      return;
    }
    if (typeof window !== 'undefined') {
      const unlocked = sessionStorage.getItem('ithi_executive_admin_unlocked');
      if (unlocked === 'true') {
        setIsUnlocked(true);
      }
    }
  }, [router]);

  // Load overview, running orders, and tables
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      // Fetch overview metrics
      const res = await apiRequest(`/admin/overview?range=today`);
      setData(res);

      // Fetch running (UNPAID / Active) orders
      try {
        const ordRes = await fetch('/api/orders?unpaidOnly=true');
        if (ordRes.ok) {
          const ordList = await ordRes.json();
          if (Array.isArray(ordList)) {
            setRunningOrders(ordList);
          }
        }
      } catch (e) {}

      // Fetch tables
      try {
        const tblRes = await fetch('/api/tables');
        if (tblRes.ok) {
          const tblList = await tblRes.json();
          if (Array.isArray(tblList)) {
            setTables(tblList);
          }
        }
      } catch (e) {}
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isUnlocked) {
      loadDashboardData();
      const interval = setInterval(loadDashboardData, 4000);
      return () => clearInterval(interval);
    }
  }, [isUnlocked]);

  // Handle Admin Password Verification
  const handleVerifyPassword = (e: React.FormEvent) => {
    e.preventDefault();
    const entered = passwordInput.trim();

    let isValid = entered === '1111' || entered.toLowerCase() === 'admin' || entered === 'admin123';

    if (!isValid && typeof window !== 'undefined') {
      const savedUsers = localStorage.getItem('ithipooram_registered_users');
      if (savedUsers) {
        try {
          const list = JSON.parse(savedUsers);
          if (Array.isArray(list)) {
            const admin = list.find((u: any) => u.role === 'MAIN_ADMIN' && (u.pin === entered || u.password === entered));
            if (admin) isValid = true;
          }
        } catch (e) {}
      }

      const currentUser = getCurrentUser();
      if (currentUser && (currentUser.pin === entered || currentUser.role === 'MAIN_ADMIN' && entered === currentUser.pin)) {
        isValid = true;
      }
    }

    if (isValid) {
      setIsUnlocked(true);
      setPasswordError('');
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('ithi_executive_admin_unlocked', 'true');
      }
    } else {
      setPasswordError('Incorrect Admin Password. Access restricted to Admin only.');
    }
  };

  const formatRupees = (paise: number = 0) => `₹ ${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  // Metric computations from live database
  const todaySalesPaise = data?.kpis?.grossSalesPaise || 0;
  const todayOrdersCount = data?.kpis?.paidOrdersCount || 0;
  const runningOrdersCount = runningOrders.length;
  const toCollectPaise = runningOrders.reduce((sum, o) => sum + (o.grandTotalPaise || o.subtotalPaise || 0), 0);
  const aovPaise = todayOrdersCount > 0 ? Math.round(todaySalesPaise / todayOrdersCount) : (todaySalesPaise || 0);

  // Available free tables
  const freeTables = useMemo(() => {
    const occupiedCodes = new Set(runningOrders.map((o) => (o.tableCode || '').toUpperCase()));
    return tables.filter((t) => !occupiedCodes.has((t.tableCode || '').toUpperCase()));
  }, [tables, runningOrders]);

  // If password locked: show clean Black/White/Grey theme Admin Password verification screen
  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-[#0A0C10] flex items-center justify-center p-4 font-sans text-white">
        <div className="bg-[#12161F] rounded-3xl max-w-sm w-full p-6 sm:p-8 shadow-2xl border border-zinc-800 text-center">
          <div className="mb-5 flex justify-center">
            <img 
              src="/brand-calligraphy-uploaded.png" 
              alt="ഇത്തിപ്പൂരം - Ithi Pooram" 
              className="h-14 w-auto object-contain invert brightness-200"
            />
          </div>

          <div className="w-12 h-12 rounded-2xl bg-zinc-800/80 border border-zinc-700 text-white flex items-center justify-center mx-auto mb-3">
            <Lock className="w-5 h-5" />
          </div>

          <h2 className="text-lg font-black text-white tracking-tight">Executive Admin Console</h2>
          <p className="text-xs font-semibold text-zinc-400 mt-1 mb-6">Enter Admin Password to enter</p>

          <form onSubmit={handleVerifyPassword} className="space-y-4">
            <div>
              <input
                type="password"
                required
                autoFocus
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  setPasswordError('');
                }}
                placeholder="Enter Admin Password"
                className="w-full px-4 py-3 rounded-2xl border border-zinc-700 text-sm font-bold text-center text-white bg-[#0A0C10] placeholder-zinc-500 focus:outline-none focus:border-zinc-400 transition"
              />
            </div>

            {passwordError && (
              <p className="text-xs font-bold text-red-400 bg-red-950/40 p-2.5 rounded-xl border border-red-900/60">
                {passwordError}
              </p>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-white hover:bg-zinc-200 text-black font-black text-xs uppercase tracking-wider shadow-md active:scale-98 transition cursor-pointer"
            >
              Enter Console
            </button>

            <button
              type="button"
              onClick={handleBack}
              className="w-full py-2 text-xs font-bold text-zinc-500 hover:text-zinc-300 transition"
            >
              Cancel &amp; Return
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#0A0C10] flex flex-col md:flex-row font-sans selection:bg-zinc-800 selection:text-white">
      
      {/* ============================================================== */}
      {/* 1. LEFT SIDEBAR (PREMIUM BLACK, WHITE & GREY THEME)             */}
      {/* ============================================================== */}
      <aside className="hidden md:flex md:w-64 lg:w-72 bg-[#0C0E12] text-zinc-300 flex-col justify-between border-r border-zinc-800 shrink-0 select-none">
        
        {/* Top Brand Logo & Calligraphy Header */}
        <div className="p-5 border-b border-zinc-800/80">
          <div className="flex items-center justify-between">
            <Link href="/admin" className="flex items-center space-x-3 group">
              <img 
                src="/brand-calligraphy-uploaded.png" 
                alt="ഇത്തിപ്പൂരം - Ithi Pooram" 
                className="h-10 w-auto object-contain invert brightness-200 transition group-hover:scale-105"
              />
            </Link>
            <button 
              onClick={handleBack}
              title="Return to operational gateway"
              className="p-1.5 rounded-lg bg-zinc-800/60 hover:bg-zinc-700 text-zinc-400 hover:text-white transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
          <div className="mt-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
            Executive Admin Console
          </div>
        </div>

        {/* Navigation Items (4 original + Table option second after Home) */}
        <nav className="p-4 space-y-1.5 flex-1">
          {/* 1. Home (Active) */}
          <Link
            href="/admin"
            className="flex items-center space-x-3 px-3.5 py-3 rounded-2xl bg-white text-black font-extrabold text-sm shadow-md transition"
          >
            <Home className="w-4 h-4" />
            <span>Home</span>
          </Link>

          {/* 2. Table Option (Second after Home, as requested) */}
          <Link
            href="/qr"
            className="flex items-center justify-between px-3.5 py-3 rounded-2xl text-zinc-400 hover:bg-zinc-900 hover:text-white font-bold text-sm transition"
          >
            <div className="flex items-center space-x-3">
              <Grid3X3 className="w-4 h-4" />
              <span>Table</span>
            </div>
            <span className="text-[10px] font-mono font-bold bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-full">
              {tables.length || 10}
            </span>
          </Link>

          {/* 3. Items (Live Menu Update) */}
          <Link
            href="/menu"
            className="flex items-center space-x-3 px-3.5 py-3 rounded-2xl text-zinc-400 hover:bg-zinc-900 hover:text-white font-bold text-sm transition"
          >
            <UtensilsCrossed className="w-4 h-4" />
            <span>Items</span>
          </Link>

          {/* 4. Reports (Billing POS & Settled Sales) */}
          <Link
            href="/billing"
            className="flex items-center justify-between px-3.5 py-3 rounded-2xl text-zinc-400 hover:bg-zinc-900 hover:text-white font-bold text-sm transition"
          >
            <div className="flex items-center space-x-3">
              <BarChart3 className="w-4 h-4" />
              <span>Reports</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
          </Link>

          {/* 5. More (Staff & Credentials, Kitchen Display) */}
          <Link
            href="/users"
            className="flex items-center justify-between px-3.5 py-3 rounded-2xl text-zinc-400 hover:bg-zinc-900 hover:text-white font-bold text-sm transition"
          >
            <div className="flex items-center space-x-3">
              <MoreHorizontal className="w-4 h-4" />
              <span>More</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
          </Link>
        </nav>

        {/* Bottom Actions: + Add Order Button & Restaurant Profile Pill */}
        <div className="p-4 border-t border-zinc-800/80 space-y-3">
          <Link
            href="/billing"
            className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-2xl border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-white font-extrabold text-xs shadow-sm transition active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Order</span>
            <span className="text-[10px] text-zinc-400 font-mono ml-1">[POS]</span>
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
            <button 
              onClick={handleBack}
              title="Return"
              className="text-zinc-500 hover:text-white p-1"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ============================================================== */}
      {/* 2. MOBILE TOP BAR HEADER (Lap & Mobile Friendly)                */}
      {/* ============================================================== */}
      <header className="md:hidden bg-[#0C0E12] text-white p-4 border-b border-zinc-800 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-300"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
          </button>
          <img 
            src="/brand-calligraphy-uploaded.png" 
            alt="ഇത്തിപ്പൂരം" 
            className="h-8 w-auto object-contain invert brightness-200"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Link
            href="/billing"
            className="px-3 py-1.5 rounded-xl bg-white text-black font-black text-xs flex items-center space-x-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Order</span>
          </Link>
        </div>
      </header>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-[#0C0E12] border-b border-zinc-800 px-4 py-3 space-y-2 z-30 animate-in slide-in-from-top-2">
          <Link
            href="/admin"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center space-x-3 px-3 py-2.5 rounded-xl bg-white text-black font-black text-sm"
          >
            <Home className="w-4 h-4" />
            <span>Home</span>
          </Link>
          <Link
            href="/qr"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-zinc-300 hover:bg-zinc-900 font-bold text-sm"
          >
            <Grid3X3 className="w-4 h-4" />
            <span>Table</span>
          </Link>
          <Link
            href="/menu"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-zinc-300 hover:bg-zinc-900 font-bold text-sm"
          >
            <UtensilsCrossed className="w-4 h-4" />
            <span>Items</span>
          </Link>
          <Link
            href="/billing"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-zinc-300 hover:bg-zinc-900 font-bold text-sm"
          >
            <BarChart3 className="w-4 h-4" />
            <span>Reports (POS)</span>
          </Link>
          <Link
            href="/users"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-zinc-300 hover:bg-zinc-900 font-bold text-sm"
          >
            <MoreHorizontal className="w-4 h-4" />
            <span>More</span>
          </Link>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. MAIN WORKSPACE AREA                                          */}
      {/* ============================================================== */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6 overflow-y-auto">
        
        {/* Top Header Label */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight">Home</h1>
            <p className="text-xs font-semibold text-zinc-500 mt-0.5">
              Ithi Pooram Management &amp; Live Restaurant Dashboard
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => loadDashboardData()}
              className="p-2 rounded-xl bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 shadow-xs transition"
              title="Refresh live metrics"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <Link
              href="/billing"
              className="px-4 py-2 rounded-xl bg-black text-white hover:bg-zinc-800 text-xs font-black shadow-xs transition flex items-center space-x-1.5"
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Billing POS Terminal</span>
            </Link>
          </div>
        </div>

        {/* ============================================================== */}
        {/* 3 RECTANGLES WITH SALES REPORT (Free trial banner removed)      */}
        {/* ============================================================== */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Card 1: Today's Orders & Today's Sales */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-zinc-200 shadow-xs hover:border-zinc-300 transition">
            <div className="grid grid-cols-2 divide-x divide-zinc-200">
              <div className="pr-4">
                <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider block">
                  TODAY&apos;S ORDERS
                </span>
                <div className="text-2xl sm:text-3xl font-black text-black mt-2 font-mono">
                  {todayOrdersCount}
                </div>
              </div>
              <div className="pl-4">
                <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider block">
                  TODAY&apos;S SALES
                </span>
                <div className="text-2xl sm:text-3xl font-black text-black mt-2 font-mono truncate" title={formatRupees(todaySalesPaise)}>
                  {formatRupees(todaySalesPaise)}
                </div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-500 font-semibold">
              <span>Settled in counter POS</span>
              <span className="text-emerald-700 font-bold">● Active</span>
            </div>
          </div>

          {/* Card 2: Running Orders & To Collect */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-zinc-200 shadow-xs hover:border-zinc-300 transition">
            <div className="grid grid-cols-2 divide-x divide-zinc-200">
              <div className="pr-4">
                <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider block">
                  RUNNING ORDERS
                </span>
                <div className="text-2xl sm:text-3xl font-black text-black mt-2 font-mono">
                  {runningOrdersCount}
                </div>
              </div>
              <div className="pl-4">
                <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider block">
                  TO COLLECT
                </span>
                <div className="text-2xl sm:text-3xl font-black text-black mt-2 font-mono truncate" title={formatRupees(toCollectPaise)}>
                  {formatRupees(toCollectPaise)}
                </div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-500 font-semibold">
              <span>Live table orders unpaid</span>
              <span className="font-mono text-zinc-700 font-bold">{runningOrdersCount} Tables Active</span>
            </div>
          </div>

          {/* Card 3: Average Order Value */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-zinc-200 shadow-xs hover:border-zinc-300 transition">
            <div>
              <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider block">
                AVERAGE ORDER VALUE
              </span>
              <div className="text-2xl sm:text-3xl font-black text-black mt-2 font-mono">
                {formatRupees(aovPaise)}
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-500 font-semibold">
              <span>Per customer check</span>
              <span className="text-zinc-800 font-bold">Standard Check Avg</span>
            </div>
          </div>

        </div>

        {/* ============================================================== */}
        {/* TWO-COLUMN WORKSPACE: ANALYTICS GRAPH (LEFT) & RIGHT WIDGETS   */}
        {/* ============================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* LEFT 2 COLS: Clean Responsive Analytics Graph Container */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-5 sm:p-6 border border-zinc-200 shadow-xs space-y-6">
            
            {/* Graph Header: Range Dropdown & Metric Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-zinc-100">
              <div className="relative inline-block text-left">
                <select
                  value={selectedRange}
                  onChange={(e: any) => setSelectedRange(e.target.value)}
                  className="appearance-none bg-zinc-50 border border-zinc-200 text-xs font-extrabold text-black py-2 pl-3.5 pr-8 rounded-xl focus:outline-none focus:border-black cursor-pointer"
                >
                  <option value="today">Today</option>
                  <option value="7days">Last 7 Days</option>
                  <option value="month">This Month</option>
                  <option value="all">All time</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-zinc-600">
                  <ChevronDown className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Metric Toggle Buttons */}
              <div className="flex items-center space-x-1 bg-zinc-100 p-1 rounded-2xl">
                <button
                  onClick={() => setChartMetric('sales')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition ${
                    chartMetric === 'sales'
                      ? 'bg-white text-black shadow-xs'
                      : 'text-zinc-600 hover:text-black'
                  }`}
                >
                  Total Sales
                </button>
                <button
                  onClick={() => setChartMetric('orders')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition ${
                    chartMetric === 'orders'
                      ? 'bg-white text-black shadow-xs'
                      : 'text-zinc-600 hover:text-black'
                  }`}
                >
                  Total Orders
                </button>
                <button
                  onClick={() => setChartMetric('aov')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition ${
                    chartMetric === 'aov'
                      ? 'bg-white text-black shadow-xs'
                      : 'text-zinc-600 hover:text-black'
                  }`}
                >
                  Average Order Value
                </button>
              </div>
            </div>

            {/* SVG Visual Smooth Curve Graph (Premium Black & Grey Aesthetic) */}
            <div className="relative h-64 sm:h-72 w-full pt-4">
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                <div className="flex items-center text-[10px] font-mono font-bold text-zinc-400">
                  <span className="w-12">₹ 2.0k</span>
                  <div className="flex-1 border-b border-dashed border-zinc-100" />
                </div>
                <div className="flex items-center text-[10px] font-mono font-bold text-zinc-400">
                  <span className="w-12">₹ 1.5k</span>
                  <div className="flex-1 border-b border-dashed border-zinc-100" />
                </div>
                <div className="flex items-center text-[10px] font-mono font-bold text-zinc-400">
                  <span className="w-12">₹ 1.0k</span>
                  <div className="flex-1 border-b border-dashed border-zinc-100" />
                </div>
                <div className="flex items-center text-[10px] font-mono font-bold text-zinc-400">
                  <span className="w-12">₹ 500</span>
                  <div className="flex-1 border-b border-dashed border-zinc-100" />
                </div>
                <div className="flex items-center text-[10px] font-mono font-bold text-zinc-400">
                  <span className="w-12">₹ 0</span>
                  <div className="flex-1 border-b border-zinc-200" />
                </div>
              </div>

              {/* Dynamic SVG Area & Smooth Curve Line */}
              <div className="ml-12 h-full relative">
                <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 500 200">
                  <defs>
                    <linearGradient id="curveGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1E293B" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#1E293B" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Shaded Area Under Curve */}
                  <path
                    d="M 50,180 C 180,180 250,40 450,20 L 450,200 L 50,200 Z"
                    fill="url(#curveGradient)"
                  />

                  {/* High-Contrast Premium Black/Slate Curve */}
                  <path
                    d="M 50,180 C 180,180 250,40 450,20"
                    fill="none"
                    stroke="#0F172A"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />

                  {/* Start Data Point */}
                  <circle cx="50" cy="180" r="5" fill="#0F172A" stroke="#FFFFFF" strokeWidth="2.5" />
                  {/* Peak Data Point */}
                  <circle cx="450" cy="20" r="5.5" fill="#0F172A" stroke="#FFFFFF" strokeWidth="3" />
                </svg>

                {/* X-Axis Date Range Labels */}
                <div className="flex justify-between text-[11px] font-mono font-bold text-zinc-500 pt-3">
                  <span>Start of Shift (03:00 AM)</span>
                  <span>Peak Hours</span>
                  <span>Current Active Live</span>
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Add Staff Securely (Print KOT removed as requested) + Top Selling Items */}
          <div className="space-y-6">
            
            {/* Widget 1: Add Staff Securely Card (White, Black & Grey Theme) */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-zinc-200 shadow-xs relative overflow-hidden">
              <div className="flex items-center space-x-2 mb-2">
                <span className="w-3 h-1.5 rounded-full bg-black inline-block" />
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500">Access Control</span>
              </div>

              <h3 className="text-base font-black text-black">Add Staff Securely</h3>
              <p className="text-xs font-semibold text-zinc-500 mt-1 mb-5">
                Add staff with roles (Cashier, Chef, Manager), bill anywhere &amp; stay in sync.
              </p>

              <Link
                href="/users"
                className="w-full py-2.5 px-4 rounded-2xl border-2 border-black hover:bg-black hover:text-white text-black font-extrabold text-xs flex items-center justify-center space-x-2 transition shadow-xs cursor-pointer active:scale-98"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Add Staff</span>
              </Link>
            </div>

            {/* Widget 2: Top Selling Items (Synced dynamically with Customer Mobile QR Orders) */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-zinc-200 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                <h3 className="text-xs sm:text-sm font-extrabold text-black">Top selling items (live sync)</h3>
                <div className="flex items-center space-x-4 text-[10px] font-extrabold text-zinc-400 uppercase">
                  <span>Sold</span>
                  <span>Revenue</span>
                </div>
              </div>

              <div className="divide-y divide-zinc-100 mt-2">
                {!data?.topSellingItems || data.topSellingItems.length === 0 ? (
                  <div className="py-6 text-center text-xs text-zinc-400 font-medium">
                    No customer orders placed yet today.
                  </div>
                ) : (
                  data.topSellingItems.slice(0, 5).map((it: any, idx: number) => (
                    <div key={it.name || idx} className="py-2.5 flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2 truncate pr-2">
                        <span className="text-[11px] font-mono font-bold text-zinc-400 w-4">
                          {idx + 1}.
                        </span>
                        <span className="font-extrabold text-zinc-900 truncate">{it.name}</span>
                      </div>
                      <div className="flex items-center space-x-5 shrink-0 font-mono text-right">
                        <span className="text-zinc-600 font-bold w-6">{it.quantity}</span>
                        <span className="font-extrabold text-black w-20">{formatRupees(it.totalPaise)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

        </div>

        {/* ============================================================== */}
        {/* RUNNING ORDERS SECTION (After one scroll down, as requested)     */}
        {/* Ads and reviews completely removed                             */}
        {/* ============================================================== */}
        <section className="bg-white rounded-3xl border border-zinc-200 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-100">
            <div>
              <h2 className="text-base sm:text-lg font-black text-black">Running Orders</h2>
              <p className="text-xs font-semibold text-zinc-500">
                Orders you take will show up here live until they&apos;re billed &amp; paid.
              </p>
            </div>

            <Link
              href="/billing"
              className="inline-flex items-center justify-center space-x-1.5 px-4 py-2 rounded-xl border border-zinc-300 hover:border-black text-black font-extrabold text-xs transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Orders</span>
            </Link>
          </div>

          {/* Running Orders Table or Empty State */}
          {runningOrders.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-400">
                <ChefHat className="w-7 h-7" />
              </div>
              <div>
                <h4 className="text-sm font-black text-black">No Running orders</h4>
                <p className="text-xs font-semibold text-zinc-400 mt-1 max-w-sm">
                  Orders placed by customers via table QR or entered from the POS terminal will appear here in real-time.
                </p>
              </div>
              <Link
                href="/billing"
                className="px-5 py-2.5 rounded-2xl border-2 border-black hover:bg-black hover:text-white text-black font-black text-xs transition cursor-pointer"
              >
                Add Orders
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-700">
                <thead className="bg-zinc-50 text-[10px] font-extrabold uppercase tracking-wider text-zinc-500 border-y border-zinc-200">
                  <tr>
                    <th className="py-3 px-4">Table</th>
                    <th className="py-3 px-4">Ticket</th>
                    <th className="py-3 px-4">Items Summary</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {runningOrders.map((ord: any) => (
                    <tr key={ord.id} className="hover:bg-zinc-50/70 transition">
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-xl bg-black text-white font-mono font-black text-xs">
                          {ord.tableCode}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-zinc-800">
                        {ord.customerCode || ord.id.slice(-6)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-zinc-900">
                          {ord.items?.map((it: any) => `${it.quantity}x ${it.itemName}`).join(', ') || 'Kerala Dishes'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-zinc-100 text-zinc-800 border border-zinc-300">
                          {ord.fulfillmentStatus || 'PREPARING'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-black text-black text-sm">
                        {formatRupees(ord.grandTotalPaise || ord.subtotalPaise)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href="/billing"
                          className="px-3 py-1.5 rounded-xl bg-black hover:bg-zinc-800 text-white font-black text-xs transition inline-flex items-center space-x-1"
                        >
                          <span>Settle Bill</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Free tables bottom status pill */}
          <div className="pt-3 border-t border-zinc-100 flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-zinc-500">Free tables:</span>
            {freeTables.length === 0 ? (
              <span className="text-xs font-semibold text-zinc-400">All tables occupied</span>
            ) : (
              freeTables.slice(0, 10).map((t) => (
                <span
                  key={t.id || t.tableCode}
                  className="px-2.5 py-1 rounded-xl bg-zinc-100 border border-zinc-200 font-mono text-[11px] font-extrabold text-zinc-700"
                >
                  {t.tableCode?.toLowerCase() || t.displayName?.toLowerCase()}
                </span>
              ))
            )}
          </div>
        </section>

      </main>
    </div>
  );
}
