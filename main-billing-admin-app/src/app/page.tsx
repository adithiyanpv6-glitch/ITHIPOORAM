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
  ChevronDown, 
  RefreshCw, 
  UserPlus, 
  ArrowUpRight, 
  LogOut, 
  Menu as MenuIcon,
  X,
  ChefHat,
  Check,
  BellRing,
  FileSpreadsheet,
  AlertCircle,
  Calendar,
  Receipt,
  ShoppingBag,
  Minus,
  Search
} from 'lucide-react';
import { apiRequest, getCurrentUser } from '../lib/api';

export default function RootHomePage() {
  const router = useRouter();

  // Authentication state
  const [currentUser, setCurrentUser] = useState<any>(null);

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
  const [isDayCloseModalOpen, setIsDayCloseModalOpen] = useState(false);
  const [dayCloseLoading, setDayCloseLoading] = useState(false);
  const [dayCloseSummary, setDayCloseSummary] = useState<any | null>(null);

  // Waiter Manual Order Desk Modal State (for dine-in guests without smartphone/QR)
  const [isWaiterOrderModalOpen, setIsWaiterOrderModalOpen] = useState(false);
  const [waiterSelectedTable, setWaiterSelectedTable] = useState<string>('');
  const [waiterSearchQuery, setWaiterSearchQuery] = useState<string>('');
  const [waiterCart, setWaiterCart] = useState<Array<{ id: string; name: string; malayalamName?: string; pricePaise: number; qty: number }>>([]);
  const [menuCategories, setMenuCategories] = useState<any[]>([]);
  const [waiterSubmitting, setWaiterSubmitting] = useState(false);
  const [waiterNotice, setWaiterNotice] = useState<string | null>(null);

  const allDishes = useMemo(() => {
    if (!menuCategories || !Array.isArray(menuCategories)) return [];
    const list: any[] = [];
    for (const cat of menuCategories) {
      if (Array.isArray(cat.items)) {
        for (const item of cat.items) {
          list.push({ ...item, categoryName: cat.name });
        }
      }
    }
    return list;
  }, [menuCategories]);

  const filteredDishes = useMemo(() => {
    if (!waiterSearchQuery.trim()) return allDishes;
    const q = waiterSearchQuery.toLowerCase();
    return allDishes.filter((d: any) => 
      (d.name && d.name.toLowerCase().includes(q)) || 
      (d.malayalamName && d.malayalamName.toLowerCase().includes(q)) ||
      (d.categoryName && d.categoryName.toLowerCase().includes(q))
    );
  }, [allDishes, waiterSearchQuery]);

  const waiterCartTotalPaise = useMemo(() => {
    return waiterCart.reduce((acc, it) => acc + (it.pricePaise * it.qty), 0);
  }, [waiterCart]);

  // Auth Guard
  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      router.replace('/login');
      return;
    }
    setCurrentUser(user);
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
          if (Array.isArray(tblList) && tblList.length > 0) {
            setTables(tblList);
            if (typeof window !== 'undefined') {
              localStorage.setItem('ithipooram_custom_tables', JSON.stringify(tblList));
            }
          } else if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('ithipooram_custom_tables');
            if (saved) {
              try {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) {
                  setTables(parsed);
                  fetch('/api/tables', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ tables: parsed }),
                  }).catch(() => {});
                }
              } catch (e) {}
            }
          }
        }
      } catch (e) {}
      // Fetch active menu items for Waiter Order Desk
      try {
        const menuRes = await fetch('/api/menu');
        if (menuRes.ok) {
          const mData = await menuRes.json();
          if (Array.isArray(mData)) {
            setMenuCategories(mData);
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
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 4000);
    return () => clearInterval(interval);
  }, []);

  // Waiter Order Handlers
  const handleOpenWaiterOrderModal = () => {
    if (tables.length > 0 && !waiterSelectedTable) {
      setWaiterSelectedTable(tables[0].tableCode || 'T1');
    }
    setWaiterNotice(null);
    setIsWaiterOrderModalOpen(true);
  };

  const handleWaiterAddItem = (item: any) => {
    setWaiterCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) => (i.id === item.id ? { ...i, qty: i.qty + 1 } : i));
      }
      return [...prev, { id: item.id, name: item.name, malayalamName: item.malayalamName, pricePaise: item.pricePaise || 12000, qty: 1 }];
    });
  };

  const handleWaiterRemoveItem = (itemId: string) => {
    setWaiterCart((prev) => {
      const existing = prev.find((i) => i.id === itemId);
      if (existing && existing.qty > 1) {
        return prev.map((i) => (i.id === itemId ? { ...i, qty: i.qty - 1 } : i));
      }
      return prev.filter((i) => i.id !== itemId);
    });
  };

  const handleSubmitWaiterOrder = async () => {
    if (!waiterSelectedTable) {
      alert('Please select a registered table.');
      return;
    }
    if (waiterCart.length === 0) {
      alert('Please select at least one dish for the order.');
      return;
    }

    try {
      setWaiterSubmitting(true);
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableCode: waiterSelectedTable.toUpperCase(),
          items: waiterCart.map((i) => ({
            id: i.id,
            name: i.name,
            malayalamName: i.malayalamName,
            pricePaise: i.pricePaise,
            quantity: i.qty,
          })),
          notes: 'Waiter Counter Order',
        }),
      });

      if (res.ok) {
        setWaiterNotice(`✓ Order placed for Table ${waiterSelectedTable}! Sent to Kitchen (KDS) & Billing.`);
        setWaiterCart([]);
        await loadDashboardData();
        setTimeout(() => {
          setIsWaiterOrderModalOpen(false);
          setWaiterNotice(null);
        }, 1200);
      } else {
        alert('Failed to place order.');
      }
    } catch (e: any) {
      alert('Error placing order: ' + e.message);
    } finally {
      setWaiterSubmitting(false);
    }
  };

  const handleSignOut = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('ithipooram_user');
      localStorage.removeItem('ithipooram_token');
    }
    router.replace('/login');
  };

  
  // Confirm customer QR order (moves to ACCEPTED and sends to KDS)
  const handleConfirmOrder = async (orderId: string) => {
    try {
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, action: 'CONFIRM', cashierName: 'Cashier' }),
      });
      if (res.ok) {
        await loadDashboardData();
      }
    } catch (e) {
      alert('Failed to confirm order');
    }
  };

  // Reject fake QR order (discards with 0 food wasted)
  const handleRejectOrder = async (orderId: string) => {
    if (!confirm('Decline this order as unverified / fake table?')) return;
    try {
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, action: 'REJECT', cashierName: 'Cashier' }),
      });
      if (res.ok) {
        await loadDashboardData();
      }
    } catch (e) {
      alert('Failed to reject order');
    }
  };

  // Close Business Day (Generates Excel & Archives)
  const handleExecuteDayClose = async () => {
    try {
      setDayCloseLoading(true);
      const res = await fetch('/api/admin/day-close', { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setDayCloseSummary(data.summary);

        // Instant Excel Download directly in user browser
        if (data.summary?.excelContent) {
          const blob = new Blob([data.summary.excelContent], { type: 'application/vnd.ms-excel' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = data.summary.excelFileName || `Daily_Report_${new Date().toISOString().slice(0, 10)}.xls`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }

        await loadDashboardData();
      } else {
        alert(data.error || data.message || 'Failed to close day');
      }
    } catch (e: any) {
      alert(e.message || 'Error closing day');
    } finally {
      setDayCloseLoading(false);
    }
  };

  const formatRupees = (paise: number = 0) => `₹ ${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  // Metric computations from live database
  const todaySalesPaise = data?.kpis?.grossSalesPaise || 0;
  const todayOrdersCount = data?.kpis?.paidOrdersCount || 0;
  const pendingQrOrders = runningOrders.filter((o) => o.fulfillmentStatus === 'PENDING_CONFIRMATION');
  const runningOrdersCount = runningOrders.length;
  const toCollectPaise = runningOrders.reduce((sum, o) => sum + (o.grandTotalPaise || o.subtotalPaise || 0), 0);
  const aovPaise = todayOrdersCount > 0 ? Math.round(todaySalesPaise / todayOrdersCount) : (todaySalesPaise || 0);

  // Available free tables (only show table numbers/codes when admin adds tables)
  const freeTables = useMemo(() => {
    const occupiedCodes = new Set(runningOrders.map((o) => (o.tableCode || '').toUpperCase()));
    return tables.filter((t) => !occupiedCodes.has((t.tableCode || '').toUpperCase()));
  }, [tables, runningOrders]);

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#0A0C10] flex flex-col md:flex-row font-sans selection:bg-zinc-800 selection:text-white">
      
      {/* ============================================================== */}
      {/* 1. LEFT SIDEBAR (PREMIUM BLACK, WHITE & GREY THEME)             */}
      {/* ============================================================== */}
      <aside className="hidden md:flex md:w-64 lg:w-72 bg-[#0C0E12] text-zinc-300 flex-col justify-between border-r border-zinc-800 shrink-0 select-none">
        
        {/* Top Brand Logo - Occupies Maximum Space ("Executive Admin Console" text removed) */}
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
              title="Sign out of terminal"
              className="p-1.5 rounded-lg bg-zinc-800/60 hover:bg-zinc-700 text-zinc-400 hover:text-white transition shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Items (Home, Table, Items, Reports, More) */}
        <nav className="p-4 space-y-1.5 flex-1">
          {/* 1. Home (Active) */}
          <Link
            href="/"
            className="flex items-center space-x-3 px-3.5 py-3 rounded-2xl bg-white text-black font-extrabold text-sm shadow-md transition"
          >
            <Home className="w-4 h-4" />
            <span>Home</span>
          </Link>

          {/* 2. Table Option */}
          <Link
            href="/qr"
            className="flex items-center justify-between px-3.5 py-3 rounded-2xl text-zinc-400 hover:bg-zinc-900 hover:text-white font-bold text-sm transition"
          >
            <div className="flex items-center space-x-3">
              <Grid3X3 className="w-4 h-4" />
              <span>Table</span>
            </div>
            {tables.length > 0 && (
              <span className="text-[10px] font-mono font-bold bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-full">
                {tables.length}
              </span>
            )}
          </Link>

          {/* 3. Billing Option (Synced to Table Orders & POS Settlement) */}
          <Link
            href="/billing"
            className="flex items-center justify-between px-3.5 py-3 rounded-2xl text-zinc-400 hover:bg-zinc-900 hover:text-white font-bold text-sm transition"
          >
            <div className="flex items-center space-x-3">
              <Receipt className="w-4 h-4" />
              <span>Billing</span>
            </div>
            {runningOrdersCount > 0 && (
              <span className="text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                {runningOrdersCount}
              </span>
            )}
          </Link>

          {/* 4. Items (Live Menu) */}
          <Link
            href="/menu"
            className="flex items-center space-x-3 px-3.5 py-3 rounded-2xl text-zinc-400 hover:bg-zinc-900 hover:text-white font-bold text-sm transition"
          >
            <UtensilsCrossed className="w-4 h-4" />
            <span>Items</span>
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

          {/* 5. More */}
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

        {/* Bottom Actions: + Add Order Button & Restaurant Profile */}
        <div className="p-4 border-t border-zinc-800/80 space-y-3">
          <button
            onClick={handleOpenWaiterOrderModal}
            className="w-full flex items-center justify-center py-3 px-4 rounded-2xl border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-white font-extrabold text-xs shadow-sm transition active:scale-98 cursor-pointer"
          >
            <span>+ Add Order</span>
          </button>

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
              onClick={handleSignOut}
              title="Sign Out"
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
            className="h-10 w-auto object-contain invert brightness-200"
          />
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleOpenWaiterOrderModal}
            className="px-3.5 py-1.5 rounded-xl bg-white text-black font-black text-xs cursor-pointer shadow-xs active:scale-95"
          >
            <span>+ Add Order</span>
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-[#0C0E12] border-b border-zinc-800 px-4 py-3 space-y-2 z-30 animate-in slide-in-from-top-2">
          <Link
            href="/"
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
            href="/billing"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-zinc-300 hover:bg-zinc-900 font-bold text-sm"
          >
            <Receipt className="w-4 h-4" />
            <span>Billing</span>
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
            href="/kitchen"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-zinc-300 hover:bg-zinc-900 font-bold text-sm"
          >
            <ChefHat className="w-4 h-4 text-orange-400" />
            <span>Kitchen (KDS)</span>
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
        
        {/* Top Header Label with Large Home and English Date & Day */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-zinc-200/80">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl sm:text-4xl font-black text-black tracking-tight">Home</h1>
              {/* Prominent Day & Date Badge in English Only */}
              <div className="flex items-center space-x-2 text-xs font-extrabold text-zinc-800 bg-white px-3.5 py-1.5 rounded-2xl border border-zinc-300/80 shadow-xs">
                <Calendar className="w-4 h-4 text-black shrink-0" />
                <span>
                  {new Date().toLocaleDateString('en-US', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            <Link
              href="/kitchen"
              className="px-3.5 py-2.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-900 border border-orange-200 text-xs font-black flex items-center space-x-1.5 transition shadow-xs"
              title="Open Kitchen Display System"
            >
              <ChefHat className="w-3.5 h-3.5 text-orange-600" />
              <span className="hidden sm:inline">Kitchen (KDS)</span>
            </Link>

            <button
              onClick={() => {
                setDayCloseSummary(null);
                setIsDayCloseModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-black hover:bg-zinc-800 text-white text-xs font-black flex items-center space-x-2 transition shadow-md cursor-pointer active:scale-98"
              title="Close business day and export Excel document"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Close Day (End of Shift / Z-Report)</span>
            </button>

            <button
              onClick={() => loadDashboardData()}
              className="p-2 rounded-xl bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 shadow-xs transition"
              title="Refresh live metrics"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* 3 RECTANGLES WITH SALES REPORT                                  */}
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

            {/* SVG Visual Smooth Curve Graph (Fixed inside box with internal X-axis markings) */}
            <div className="flex flex-col h-64 sm:h-72 w-full pt-4 pb-2 justify-between">
              <div className="relative flex-1 w-full">
                {/* Horizontal dashed guide lines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-2">
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
                  <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 500 180">
                    <defs>
                      <linearGradient id="curveGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#1E293B" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#1E293B" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Shaded Area Under Curve */}
                    <path
                      d="M 50,160 C 180,160 250,30 450,15 L 450,175 L 50,175 Z"
                      fill="url(#curveGradient)"
                    />

                    {/* High-Contrast Premium Black/Slate Curve */}
                    <path
                      d="M 50,160 C 180,160 250,30 450,15"
                      fill="none"
                      stroke="#0F172A"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />

                    {/* Start Data Point */}
                    <circle cx="50" cy="160" r="4.5" fill="#0F172A" stroke="#FFFFFF" strokeWidth="2.5" />
                    {/* Peak Data Point */}
                    <circle cx="450" cy="15" r="5" fill="#0F172A" stroke="#FFFFFF" strokeWidth="3" />
                  </svg>
                </div>
              </div>

              {/* X-Axis Date Range Labels - cleanly contained inside the box */}
              <div className="flex justify-between text-[11px] font-mono font-bold text-zinc-500 pl-12 pt-2 border-t border-zinc-100 shrink-0">
                <span>Start Shift (03:00 AM)</span>
                <span>Peak Hours</span>
                <span>Live Active</span>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Add Staff Securely + Top Selling Items */}
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
        {/* RUNNING ORDERS SECTION (After one scroll down)                   */}
        {/* ============================================================== */}
        <section className="bg-white rounded-3xl border border-zinc-200 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-100">
            <div>
              <h2 className="text-base sm:text-lg font-black text-black">Running Orders</h2>
              <p className="text-xs font-semibold text-zinc-500">
                Orders you take will show up here live until they&apos;re billed &amp; paid.
              </p>
            </div>

            <button
              onClick={handleOpenWaiterOrderModal}
              className="inline-flex items-center justify-center py-2 px-4 rounded-xl border border-zinc-300 hover:border-black text-black font-extrabold text-xs transition cursor-pointer"
            >
              <span>+ Add Order</span>
            </button>
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
              <button
                onClick={handleOpenWaiterOrderModal}
                className="px-5 py-2.5 rounded-2xl border-2 border-black hover:bg-black hover:text-white text-black font-black text-xs transition cursor-pointer"
              >
                + Add Order
              </button>
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

          {/* Free tables bottom status pill (Only visible when admin adds tables) */}
          {tables.length > 0 && (
            <div className="pt-3 border-t border-zinc-100 flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-zinc-500">Free tables:</span>
              {freeTables.length === 0 ? (
                <span className="text-xs font-semibold text-zinc-400">All tables occupied</span>
              ) : (
                freeTables.map((t) => (
                  <span
                    key={t.id || t.tableCode}
                    className="px-2.5 py-1 rounded-xl bg-zinc-100 border border-zinc-200 font-mono text-[11px] font-extrabold text-zinc-700"
                  >
                    {t.tableCode?.toLowerCase() || t.displayName?.toLowerCase()}
                  </span>
                ))
              )}
            </div>
          )}
        </section>

      </main>

      {/* Day Close Modal */}
      {isDayCloseModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-zinc-200 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center space-x-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-black text-black">End Shift &amp; Close Business Day</h3>
              </div>
              <button
                onClick={() => setIsDayCloseModalOpen(false)}
                className="text-zinc-400 hover:text-black p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!dayCloseSummary ? (
              <div className="space-y-4">
                <p className="text-xs text-zinc-500 font-semibold leading-relaxed">
                  Closing the business day will reconcile today&apos;s cash &amp; UPI revenue, generate the permanent multi-sheet Excel spreadsheet in <span className="font-mono text-black font-bold">reports_archive/</span>, and reset active tables for tomorrow morning.
                </p>

                <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200 space-y-2 text-xs font-semibold">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Gross Sales Today:</span>
                    <span className="font-mono font-bold text-black">{formatRupees(todaySalesPaise)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Total Settled Bills:</span>
                    <span className="font-mono font-bold text-black">{todayOrdersCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Active Unpaid Tables:</span>
                    <span className="font-mono font-bold text-black">{runningOrdersCount}</span>
                  </div>
                </div>

                <div className="flex space-x-2 pt-2">
                  <button
                    onClick={() => setIsDayCloseModalOpen(false)}
                    className="flex-1 py-3 rounded-2xl border border-zinc-200 text-xs font-bold text-zinc-600 hover:bg-zinc-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleExecuteDayClose}
                    disabled={dayCloseLoading}
                    className="flex-1 py-3 rounded-2xl bg-black hover:bg-zinc-800 text-white font-black text-xs flex items-center justify-center space-x-1.5 shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {dayCloseLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    <span>Confirm &amp; Export Excel</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-black text-black">Business Day Closed Successfully!</h4>
                  <p className="text-xs text-zinc-500 mt-1">
                    Excel report archived as <span className="font-mono font-bold text-black">{dayCloseSummary.excelFileName}</span>
                  </p>
                </div>

                <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200 text-xs space-y-1 text-left">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Total Sales:</span>
                    <span className="font-mono font-bold text-black">{formatRupees(dayCloseSummary.totalSalesPaise)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Cash:</span>
                    <span className="font-mono font-bold text-black">{formatRupees(dayCloseSummary.cashPaise)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">UPI:</span>
                    <span className="font-mono font-bold text-black">{formatRupees(dayCloseSummary.upiPaise)}</span>
                  </div>
                </div>

                <button
                  onClick={() => setIsDayCloseModalOpen(false)}
                  className="w-full py-3 rounded-2xl bg-black text-white font-black text-xs hover:bg-zinc-800"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Waiter Manual Order Desk Modal (For Dine-in Guests without QR Code) */}
      {isWaiterOrderModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-zinc-200 flex flex-col max-h-[92dvh] overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-zinc-100 shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-black text-white flex items-center justify-center shadow-xs">
                  <ChefHat className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-base font-black text-black">Waiter Manual Order Desk</h3>
                  <p className="text-[11px] font-semibold text-zinc-500">
                    Take orders directly for guests who do not use smartphone QR code
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsWaiterOrderModalOpen(false)}
                className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-black flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body: Scrollable */}
            <div className="flex-1 overflow-y-auto py-3 space-y-4 pr-1">
              {/* Notice Banner */}
              {waiterNotice && (
                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center space-x-2">
                  <Check className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{waiterNotice}</span>
                </div>
              )}

              {/* 1. Select Registered Table */}
              <div>
                <label className="block text-xs font-black text-zinc-900 uppercase tracking-wider mb-2">
                  1. Select Registered Table (ലഭ്യമായ ടേബിളുകൾ)
                </label>
                <div className="flex flex-wrap gap-2">
                  {(tables && tables.length > 0 ? tables : [
                    { id: 't1', tableCode: 'T1', displayName: 'Table 1' },
                    { id: 't2', tableCode: 'T2', displayName: 'Table 2' },
                    { id: 't3', tableCode: 'T3', displayName: 'Table 3' },
                    { id: 't4', tableCode: 'T4', displayName: 'Table 4' },
                    { id: 't5', tableCode: 'T5', displayName: 'Table 5' },
                    { id: 't6', tableCode: 'T6', displayName: 'Table 6' },
                  ]).map((t: any) => {
                    const code = t.tableCode || t.id;
                    const isSelected = waiterSelectedTable?.toUpperCase() === code?.toUpperCase();
                    return (
                      <button
                        key={code}
                        type="button"
                        onClick={() => setWaiterSelectedTable(code)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                          isSelected
                            ? 'bg-black text-white shadow-sm ring-2 ring-zinc-900 ring-offset-1'
                            : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-200'
                        }`}
                      >
                        {code} {t.displayName && t.displayName !== code ? `(${t.displayName})` : ''}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Search Dishes */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-black text-zinc-900 uppercase tracking-wider">
                    2. Select Dishes (ഭക്ഷണങ്ങൾ തിരഞ്ഞെടുക്കുക)
                  </label>
                  <span className="text-[11px] font-mono text-zinc-400 font-bold">
                    {filteredDishes.length} items
                  </span>
                </div>

                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-400 pointer-events-none" />
                  <input
                    type="text"
                    value={waiterSearchQuery}
                    onChange={(e) => setWaiterSearchQuery(e.target.value)}
                    placeholder="Search porotta, biryani, fish, tea..."
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-xs font-semibold focus:outline-none focus:border-black text-zinc-900"
                  />
                  {waiterSearchQuery && (
                    <button
                      onClick={() => setWaiterSearchQuery('')}
                      className="absolute right-3 top-2.5 text-zinc-400 hover:text-black text-xs"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Dish Selection Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto p-1 border border-zinc-100 rounded-2xl bg-zinc-50/50">
                {filteredDishes.length === 0 ? (
                  <div className="col-span-full py-8 text-center text-xs text-zinc-400 font-semibold">
                    No dishes found. Go to Menu to add or activate items.
                  </div>
                ) : (
                  filteredDishes.map((dish: any) => {
                    const inCart = waiterCart.find((c) => c.id === dish.id);
                    return (
                      <div
                        key={dish.id}
                        className="p-2.5 rounded-xl bg-white border border-zinc-200 flex items-center justify-between hover:border-zinc-400 transition"
                      >
                        <div className="truncate pr-2">
                          <p className="text-xs font-extrabold text-zinc-900 truncate">{dish.name}</p>
                          {dish.malayalamName && (
                            <p className="text-[10px] text-zinc-500 truncate">{dish.malayalamName}</p>
                          )}
                          <p className="text-[11px] font-mono font-bold text-black mt-0.5">
                            ₹{Math.round((dish.pricePaise || dish.priceInr * 100 || 12000) / 100)}
                          </p>
                        </div>

                        {inCart ? (
                          <div className="flex items-center space-x-1.5 bg-black text-white px-2 py-1 rounded-lg shrink-0">
                            <button
                              type="button"
                              onClick={() => handleWaiterRemoveItem(dish.id)}
                              className="w-5 h-5 flex items-center justify-center hover:bg-zinc-800 rounded font-black text-sm"
                            >
                              -
                            </button>
                            <span className="text-xs font-mono font-black px-1">{inCart.qty}</span>
                            <button
                              type="button"
                              onClick={() => handleWaiterAddItem(dish)}
                              className="w-5 h-5 flex items-center justify-center hover:bg-zinc-800 rounded font-black text-sm"
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleWaiterAddItem(dish)}
                            className="px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-black hover:text-white text-zinc-800 font-extrabold text-xs transition cursor-pointer shrink-0"
                          >
                            + Add
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Order Cart Drawer */}
              {waiterCart.length > 0 && (
                <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-200 space-y-2">
                  <div className="flex items-center justify-between text-xs font-extrabold text-zinc-800 pb-1 border-b border-zinc-200">
                    <span className="flex items-center space-x-1.5">
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Order Items ({waiterCart.reduce((a, b) => a + b.qty, 0)})</span>
                    </span>
                    <span className="font-mono font-black text-black">
                      Total: ₹{Math.round(waiterCartTotalPaise / 100)}
                    </span>
                  </div>

                  <div className="max-h-28 overflow-y-auto space-y-1 text-xs">
                    {waiterCart.map((item) => (
                      <div key={item.id} className="flex items-center justify-between text-zinc-700">
                        <span className="truncate pr-2 font-medium">
                          {item.qty}x {item.name}
                        </span>
                        <div className="flex items-center space-x-2 shrink-0 font-mono">
                          <span className="font-bold">₹{Math.round((item.pricePaise * item.qty) / 100)}</span>
                          <button
                            type="button"
                            onClick={() => handleWaiterRemoveItem(item.id)}
                            className="text-zinc-400 hover:text-red-600 p-0.5"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-zinc-100 flex items-center space-x-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setWaiterCart([]);
                  setIsWaiterOrderModalOpen(false);
                }}
                className="flex-1 py-3 rounded-2xl border border-zinc-200 text-xs font-bold text-zinc-600 hover:bg-zinc-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitWaiterOrder}
                disabled={waiterSubmitting || waiterCart.length === 0}
                className="flex-2 py-3 rounded-2xl bg-black hover:bg-zinc-800 text-white font-black text-xs flex items-center justify-center space-x-2 shadow-md cursor-pointer disabled:opacity-50"
              >
                {waiterSubmitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4 text-emerald-400" />
                )}
                <span>
                  Send to Kitchen &amp; Counter (Table {waiterSelectedTable || 'T1'})
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
