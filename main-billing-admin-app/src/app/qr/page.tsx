'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Home, 
  UtensilsCrossed, 
  BarChart3, 
  MoreHorizontal, 
  Grid3X3, 
  Plus, 
  ChevronRight, 
  LogOut, 
  Menu as MenuIcon, 
  X, 
  Clock, 
  CheckCircle2, 
  ArrowUpRight,
  Trash2,
  Edit2
} from 'lucide-react';
import { apiRequest, getCurrentUser } from '../../lib/api';

export default function TablesManagementPage() {
  const router = useRouter();

  // Filter tab: 'all' | 'occupied' | 'empty'
  const [filterTab, setFilterTab] = useState<'all' | 'occupied' | 'empty'>('all');
  
  // Tables and Running Orders state
  const [tables, setTables] = useState<any[]>([]);
  const [runningOrders, setRunningOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Add Table Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTableCode, setNewTableCode] = useState('');
  const [newCapacity, setNewCapacity] = useState('4');

  // Load tables & running orders
  const loadData = async () => {
    try {
      setLoading(true);

      // Fetch tables
      const tblRes = await fetch('/api/tables');
      if (tblRes.ok) {
        const tblList = await tblRes.json();
        if (Array.isArray(tblList)) {
          setTables(tblList);
        }
      }

      // Fetch active running orders
      const ordRes = await fetch('/api/orders?unpaidOnly=true');
      if (ordRes.ok) {
        const ordList = await ordRes.json();
        if (Array.isArray(ordList)) {
          setRunningOrders(ordList);
        }
      }
    } catch (e) {
      console.error('Failed to load tables data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      router.replace('/login');
      return;
    }
    loadData();
    const interval = setInterval(loadData, 4000);
    return () => clearInterval(interval);
  }, [router]);

  const handleSignOut = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('ithipooram_user');
      localStorage.removeItem('ithipooram_token');
    }
    router.replace('/login');
  };

  // Add table handler
  const handleAddTable = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = newTableCode.trim().toLowerCase();
    if (!code) return;

    const newTbl = {
      tableCode: code,
      displayName: code.toUpperCase(),
      capacity: parseInt(newCapacity, 10) || 4,
    };

    try {
      const updatedList = [...tables, newTbl];
      await fetch('/api/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tables: updatedList }),
      });
      setTables(updatedList);
      setNewTableCode('');
      setIsAddModalOpen(false);
    } catch (err) {
      alert('Failed to add table');
    }
  };

  // Mapping active orders by tableCode
  const orderMap = useMemo(() => {
    const map: Record<string, any> = {};
    runningOrders.forEach((ord) => {
      const code = (ord.tableCode || '').toLowerCase();
      map[code] = ord;
    });
    return map;
  }, [runningOrders]);

  // Filtered tables computation
  const filteredTables = useMemo(() => {
    return tables.filter((t) => {
      const code = (t.tableCode || '').toLowerCase();
      const hasOrder = !!orderMap[code];
      if (filterTab === 'occupied') return hasOrder;
      if (filterTab === 'empty') return !hasOrder;
      return true; // 'all'
    });
  }, [tables, filterTab, orderMap]);

  const occupiedCount = useMemo(() => {
    return tables.filter((t) => !!orderMap[(t.tableCode || '').toLowerCase()]).length;
  }, [tables, orderMap]);

  const emptyCount = tables.length - occupiedCount;

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
            className="flex items-center space-x-3 px-3.5 py-3 rounded-2xl bg-white text-black font-extrabold text-sm shadow-md transition"
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
            className="flex items-center justify-between px-3.5 py-3 rounded-2xl text-zinc-400 hover:bg-zinc-900 hover:text-white font-bold text-sm transition"
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
          <Link href="/qr" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center space-x-3 px-3 py-2.5 rounded-xl bg-white text-black font-black text-sm">
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
          <Link href="/users" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-zinc-300 font-bold text-sm">
            <MoreHorizontal className="w-4 h-4" />
            <span>More</span>
          </Link>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. MAIN TABLES WORKSPACE (Designed matching uploaded image)     */}
      {/* ============================================================== */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6 overflow-y-auto">
        
        {/* Top Filter Bar: All (x), Occupied (y), Empty (z) */}
        <div className="inline-flex items-center bg-zinc-100 p-1 rounded-2xl">
          <button
            onClick={() => setFilterTab('all')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
              filterTab === 'all'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-zinc-600 hover:text-black'
            }`}
          >
            All ({tables.length})
          </button>
          <button
            onClick={() => setFilterTab('occupied')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
              filterTab === 'occupied'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-zinc-600 hover:text-black'
            }`}
          >
            Occupied ({occupiedCount})
          </button>
          <button
            onClick={() => setFilterTab('empty')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
              filterTab === 'empty'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-zinc-600 hover:text-black'
            }`}
          >
            Empty ({emptyCount})
          </button>
        </div>

        {/* Grid Display: [+ ADD TABLE] Box + Registered Table Dine-In Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          
          {/* 1. [+ ADD TABLE] Box (Dashed card matching uploaded screenshot) */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="h-28 rounded-3xl border border-dashed border-zinc-300 bg-white hover:border-black hover:bg-zinc-50 flex flex-col items-center justify-center space-y-2 p-3 transition group cursor-pointer shadow-xs"
          >
            <div className="w-8 h-8 rounded-full border border-zinc-300 group-hover:border-black flex items-center justify-center text-zinc-500 group-hover:text-black transition">
              <Plus className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-extrabold tracking-wider uppercase text-zinc-600 group-hover:text-black">
              ADD TABLE
            </span>
          </button>

          {/* 2. Registered Tables Cards (e.g. ac1, T1...) */}
          {filteredTables.map((t) => {
            const code = (t.tableCode || '').toLowerCase();
            const activeOrder = orderMap[code];

            return (
              <div
                key={t.id || code}
                className={`h-28 rounded-3xl p-4 flex flex-col justify-between border transition shadow-xs ${
                  activeOrder
                    ? 'bg-white border-blue-500 shadow-blue-500/10'
                    : 'bg-white border-dashed border-zinc-300 hover:border-zinc-400'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-base font-extrabold text-black font-mono">
                      {code}
                    </span>
                    {activeOrder && (
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" title="Active Order Present" />
                    )}
                  </div>
                  <span className="text-[10px] text-zinc-400 font-semibold block mt-0.5">
                    {activeOrder ? 'Active Order' : 'Empty Table'}
                  </span>
                </div>

                <div>
                  {activeOrder ? (
                    <Link
                      href="/billing"
                      className="text-xs font-bold text-blue-600 hover:underline flex items-center space-x-1"
                    >
                      <span>₹{((activeOrder.grandTotalPaise || 0) / 100).toFixed(0)} Settle &rarr;</span>
                    </Link>
                  ) : (
                    <Link
                      href="/billing"
                      className="text-xs font-bold text-blue-600 hover:underline flex items-center space-x-1"
                    >
                      <span>Assign here &rarr;</span>
                    </Link>
                  )}
                </div>
              </div>
            );
          })}

        </div>

      </main>

      {/* ADD TABLE MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-zinc-200">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <h3 className="font-black text-black text-base">Add New Table</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-zinc-400 hover:text-black">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddTable} className="my-4 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-zinc-700 uppercase tracking-wider mb-1">
                  Table Name / Code:
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newTableCode}
                  onChange={(e) => setNewTableCode(e.target.value)}
                  placeholder="e.g. ac1 / T1 / TQ1"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 font-mono font-bold text-black focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-700 uppercase tracking-wider mb-1">
                  Seating Capacity:
                </label>
                <input
                  type="number"
                  value={newCapacity}
                  onChange={(e) => setNewCapacity(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 font-mono font-bold text-black focus:outline-none focus:border-black"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-zinc-600 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-black text-white font-black hover:bg-zinc-800 transition"
                >
                  Add Table
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
