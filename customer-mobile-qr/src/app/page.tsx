'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams, useParams } from 'next/navigation';
import { 
  ShoppingBag, 
  Plus, 
  Minus, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Fish, 
  ChefHat, 
  ArrowRight, 
  X, 
  Sparkles,
  Flame,
  Receipt,
  Settings,
  ChevronRight,
  Utensils,
  History,
  RotateCcw,
  Smartphone,
  Info,
  Check,
  Search,
  ArrowLeft
} from 'lucide-react';

export interface MenuItem {
  id: string;
  name: string;
  malayalamName?: string;
  description?: string;
  pricePaise: number;
  dietary: 'VEG' | 'NON_VEG' | 'SEAFOOD';
  isAvailable: boolean;
  currentStock?: number | null;
  station?: string;
  category: string;
}

export interface MenuCategory {
  id: string;
  name: string;
  malayalamName?: string;
  items: MenuItem[];
}

export interface PlacedOrderItem {
  id: string;
  itemId: string;
  itemName: string;
  itemMalayalamName?: string;
  quantity: number;
  pricePaise: number;
  lineTotalPaise: number;
  station?: string;
  notes?: string;
  round?: number;
}

export interface PlacedOrder {
  id: string;
  customerCode: string; // e.g. TQ1B-01
  tableCode: string;
  tableName: string;
  deviceSessionId?: string;
  roundCount?: number;
  items: PlacedOrderItem[];
  subtotalPaise: number;
  cgstPaise: number;
  sgstPaise: number;
  grandTotalPaise: number;
  fulfillmentStatus: 'NEW' | 'ACCEPTED' | 'PREPARING' | 'READY' | 'SERVED' | 'CANCELLED';
  paymentStatus: 'UNPAID' | 'PAID' | 'REFUNDED';
  createdAt: string;
  updatedAt?: string;
}

// Fallback daily menu if admin server is not reachable
const FALLBACK_CATEGORIES: MenuCategory[] = [];

function CustomerOrderingContent() {
  const searchParams = useSearchParams();
  const params = useParams();
  // Table identifier from route param (e.g. /t/TQ1B) or query param (?table=TQ1B)
  const routeTable = (params?.tableCode as string) || '';
  const rawTable = routeTable || searchParams.get('table') || 'TQ1B';
  const tableCode = rawTable.toUpperCase();
  const rawName = searchParams.get('name') || '';
  const tableDisplayName = rawName || `Table ${tableCode}`;

  // View state: 'welcome' (first scan / landing) | 'menu' (browsing dishes) | 'status' (order tracker)
  const [currentView, setCurrentView] = useState<'welcome' | 'menu' | 'status'>('welcome');

  // Device session identifier (Phone 1, Phone 2, etc.)
  const [deviceSessionId, setDeviceSessionId] = useState<string>('');
  const [phoneLabel, setPhoneLabel] = useState<string>('Phone 1');
  const [activeExistingOrder, setActiveExistingOrder] = useState<PlacedOrder | null>(null);

  // Live Menu state fetched from admin API
  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>(FALLBACK_CATEGORIES);
  const [activeCategoryTab, setActiveCategoryTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dietaryFilter, setDietaryFilter] = useState<'ALL' | 'VEG' | 'NON_VEG' | 'SEAFOOD'>('ALL');

  // Cart state
  const [cart, setCart] = useState<Array<{ item: MenuItem; qty: number; notes: string }>>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isOrdering, setIsOrdering] = useState(false);
  const [showSessionDrawer, setShowSessionDrawer] = useState(false);

  // Central API Configuration
  const [apiUrl, setApiUrl] = useState<string>('');
  const [showConfig, setShowConfig] = useState(false);
  const [orderNotification, setOrderNotification] = useState<string | null>(null);

  // 1. Initialize API endpoint
  useEffect(() => {
    const saved = localStorage.getItem('ithipooram_api_endpoint');
    if (saved) {
      setApiUrl(saved);
    } else {
      const defaultUrl = process.env.NEXT_PUBLIC_ADMIN_API_URL || 'https://admin-app-ithipooram.vercel.app';
      setApiUrl(defaultUrl);
    }
  }, []);

  // 2. Manage Phone Session Identification & Check for Existing Active Order on Table
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Load or generate Device Session ID
    let currentSession = localStorage.getItem('ithipooram_device_session_id');
    let label = localStorage.getItem('ithipooram_phone_label') || 'Phone 1';

    if (!currentSession) {
      currentSession = `dev_phone1_${Math.random().toString(36).substring(2, 8)}`;
      localStorage.setItem('ithipooram_device_session_id', currentSession);
      localStorage.setItem('ithipooram_phone_label', 'Phone 1');
      label = 'Phone 1';
    }

    setDeviceSessionId(currentSession);
    setPhoneLabel(label);

    // Check if this specific phone session already has an active unpaid order on this table
    checkActiveTableOrder(currentSession, tableCode);
  }, [tableCode]);

  const checkActiveTableOrder = async (sessionId: string, tCode: string) => {
    // 1. Check local device memory first
    const storageKey = `ithipooram_active_order_${tCode}_${sessionId}`;
    const rawLocalOrder = localStorage.getItem(storageKey);
    let activeLocal: PlacedOrder | null = null;

    if (rawLocalOrder) {
      try {
        const parsed = JSON.parse(rawLocalOrder);
        if (parsed && parsed.paymentStatus === 'UNPAID') {
          activeLocal = parsed;
          setActiveExistingOrder(parsed);
        }
      } catch (e) {
        // ignore parse error
      }
    }

    // 2. Query Central Server if API URL is available
    if (apiUrl) {
      try {
        const res = await fetch(`${apiUrl}/api/orders?tableCode=${tCode}&deviceSessionId=${sessionId}&unpaidOnly=true`);
        if (res.ok) {
          const orders = await res.json();
          if (Array.isArray(orders) && orders.length > 0) {
            // Found existing active unpaid order for this exact phone session!
            const serverOrder = orders[0];
            setActiveExistingOrder(serverOrder);
            localStorage.setItem(storageKey, JSON.stringify(serverOrder));
            return;
          } else {
            // Server confirmed no active unpaid order for this phone session
            if (!activeLocal) {
              setActiveExistingOrder(null);
            }
          }
        }
      } catch (err) {
        // network fallback to local storage check
      }
    }
  };

  // 3. Fetch Live Menu uploaded/managed by Admin (Real-time live sync)
  useEffect(() => {
    const fetchLiveMenu = async () => {
      try {
        const endpoint = apiUrl ? `${apiUrl}/api/menu` : '/api/menu';
        const res = await fetch(endpoint, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            if (data.length === 0) {
              setMenuCategories([]);
              return;
            }
            // Transform data into categories if required
            const validCategories: MenuCategory[] = data.map((cat: any) => ({
              id: cat.id || `cat-${Math.random()}`,
              name: cat.name || 'Dishes',
              malayalamName: cat.malayalamName,
              items: (cat.items || []).map((it: any) => ({
                id: it.id,
                name: it.name,
                malayalamName: it.malayalamName,
                description: it.description || it.notes || '',
                pricePaise: it.pricePaise || 12000,
                dietary: it.dietary || (it.category?.toLowerCase().includes('sea') || it.name?.toLowerCase().includes('fish') ? 'SEAFOOD' : it.category?.toLowerCase().includes('veg') ? 'VEG' : 'NON_VEG'),
                isAvailable: it.isAvailable !== false,
                currentStock: it.currentStock,
                station: it.station || 'Main Kitchen',
                category: cat.id,
              }))
            })).filter(cat => cat.items.length > 0);
            setMenuCategories(validCategories);
            return;
          }
        }
      } catch (e) {
        // Network fallback
      }

      // Local storage fallback for instant sync across tabs in same browser
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('ithipooram_custom_menu_dishes');
        if (saved) {
          try {
            const list = JSON.parse(saved);
            if (Array.isArray(list) && list.length > 0) {
              const grouped: Record<string, MenuItem[]> = {};
              for (const it of list) {
                const catName = it.category || 'Dishes';
                if (!grouped[catName]) grouped[catName] = [];
                grouped[catName].push({
                  id: it.id || `m-${Math.random()}`,
                  name: it.name,
                  malayalamName: it.malayalamName,
                  description: '',
                  pricePaise: Math.round(Number(it.priceInr || 0) * 100),
                  dietary: it.dietary || 'SEAFOOD',
                  isAvailable: it.isAvailable !== false,
                  currentStock: it.currentStock,
                  station: it.station || 'Main Kitchen',
                  category: catName,
                });
              }
              const cats: MenuCategory[] = Object.entries(grouped).map(([name, items]) => ({
                id: `cat-${name}`,
                name,
                items,
              }));
              setMenuCategories(cats);
            }
          } catch (err) {}
        }
      }
    };

    fetchLiveMenu();
    // Live polling every 4 seconds to sync menu changes made by Admin instantly
    const interval = setInterval(fetchLiveMenu, 4000);
    return () => clearInterval(interval);
  }, [apiUrl]);

  // Flatten all menu items for quick filtering and lookups
  const allMenuItems = useMemo(() => {
    return menuCategories.flatMap((cat) => cat.items);
  }, [menuCategories]);

  // Filter items based on active category tab, search query, and dietary selection
  const displayedItems = useMemo(() => {
    let items = allMenuItems;

    if (activeCategoryTab !== 'all') {
      items = items.filter((it) => it.category === activeCategoryTab);
    }

    if (dietaryFilter !== 'ALL') {
      items = items.filter((it) => it.dietary === dietaryFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter((it) => 
        it.name.toLowerCase().includes(q) || 
        (it.malayalamName && it.malayalamName.toLowerCase().includes(q)) ||
        (it.description && it.description.toLowerCase().includes(q))
      );
    }

    return items;
  }, [allMenuItems, activeCategoryTab, dietaryFilter, searchQuery]);

  // Cart operations
  const addToCart = (item: MenuItem) => {
    if (!item.isAvailable) return;
    setCart((prev) => {
      const idx = prev.findIndex((c) => c.item.id === item.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx].qty += 1;
        return next;
      }
      return [...prev, { item, qty: 1, notes: '' }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => {
      const idx = prev.findIndex((c) => c.item.id === id);
      if (idx < 0) return prev;
      if (prev[idx].qty > 1) {
        const next = [...prev];
        next[idx].qty -= 1;
        return next;
      }
      return prev.filter((c) => c.item.id !== id);
    });
  };

  const formatRupees = (paise: number = 0) => `₹${(paise / 100).toFixed(2)}`;

  // Price calculations (Net final prices set by Admin, no GST added)
  const subtotalPaise = useMemo(() => cart.reduce((s, c) => s + c.item.pricePaise * c.qty, 0), [cart]);
  const cgstPaise = 0;
  const sgstPaise = 0;
  const grandTotalPaise = subtotalPaise;
  const totalItemCount = useMemo(() => cart.reduce((s, c) => s + c.qty, 0), [cart]);

  // Combined totals when adding items to an existing order
  const combinedGrandTotalPaise = (activeExistingOrder?.grandTotalPaise || 0) + grandTotalPaise;

  // Handle Placing Order (Supports both Brand New Orders and Continuation Re-Orders)
  const handlePlaceOrder = async () => {
    if (cart.length === 0 || isOrdering) return;
    setIsOrdering(true);

    const isReOrderContinuation = Boolean(activeExistingOrder);

    const payload = {
      tableCode,
      deviceSessionId,
      parentOrderId: activeExistingOrder?.id,
      isAddOn: isReOrderContinuation,
      notes: '',
      items: cart.map((c) => ({
        id: c.item.id,
        name: c.item.name,
        malayalamName: c.item.malayalamName,
        pricePaise: c.item.pricePaise,
        qty: c.qty,
        category: c.item.category,
        station: c.item.station,
        notes: c.notes || '',
      })),
    };

    try {
      const endpoint = `${apiUrl}/api/orders`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        const updatedOrder = data.order;
        setActiveExistingOrder(updatedOrder);

        const storageKey = `ithipooram_active_order_${tableCode}_${deviceSessionId}`;
        localStorage.setItem(storageKey, JSON.stringify(updatedOrder));

        setCart([]);
        setIsCartOpen(false);
        setCurrentView('status');
        setOrderNotification(
          isReOrderContinuation 
            ? `Dishes added to your active Table ${tableCode} order! Kitchen has started preparing round ${updatedOrder.roundCount || 2}.`
            : `Order successfully placed for Table ${tableCode}!`
        );
      } else {
        // Fallback simulation for local/preview
        simulateLocalOrderSubmission(payload, isReOrderContinuation);
      }
    } catch (err) {
      console.warn('Network error placing order, using local ticket simulation:', err);
      simulateLocalOrderSubmission(payload, isReOrderContinuation);
    } finally {
      setIsOrdering(false);
    }
  };

  const simulateLocalOrderSubmission = (payload: any, isReOrderContinuation: boolean) => {
    const formattedNewItems: PlacedOrderItem[] = payload.items.map((it: any, idx: number) => ({
      id: `it-${Date.now()}-${idx}`,
      itemId: it.id,
      itemName: it.name,
      itemMalayalamName: it.malayalamName,
      quantity: it.qty,
      pricePaise: it.pricePaise,
      lineTotalPaise: it.pricePaise * it.qty,
      station: it.station,
      round: isReOrderContinuation ? (activeExistingOrder?.roundCount || 1) + 1 : 1,
    }));

    let resultingOrder: PlacedOrder;

    if (isReOrderContinuation && activeExistingOrder) {
      const nextRound = (activeExistingOrder.roundCount || 1) + 1;
      const combinedItems = [...activeExistingOrder.items, ...formattedNewItems];
      const newSub = combinedItems.reduce((acc, it) => acc + it.lineTotalPaise, 0);

      resultingOrder = {
        ...activeExistingOrder,
        roundCount: nextRound,
        items: combinedItems,
        subtotalPaise: newSub,
        cgstPaise: 0,
        sgstPaise: 0,
        grandTotalPaise: newSub, // Net final price (GST inclusive)
        fulfillmentStatus: 'PREPARING',
        updatedAt: new Date().toISOString(),
      };
    } else {
      resultingOrder = {
        id: `ord-${Date.now()}`,
        customerCode: `${tableCode}-01`,
        tableCode,
        tableName: tableDisplayName,
        deviceSessionId,
        roundCount: 1,
        items: formattedNewItems,
        subtotalPaise,
        cgstPaise: 0,
        sgstPaise: 0,
        grandTotalPaise: subtotalPaise,
        fulfillmentStatus: 'PREPARING',
        paymentStatus: 'UNPAID',
        createdAt: new Date().toISOString(),
      };
    }

    setActiveExistingOrder(resultingOrder);
    const storageKey = `ithipooram_active_order_${tableCode}_${deviceSessionId}`;
    localStorage.setItem(storageKey, JSON.stringify(resultingOrder));

    setCart([]);
    setIsCartOpen(false);
    setCurrentView('status');
  };

  // Device Session Switcher (to test Phone 1 vs Phone 2 in one browser)
  const switchDeviceSession = (type: 'phone1' | 'phone2' | 'new') => {
    let newSessionId = '';
    let newLabel = '';

    if (type === 'phone1') {
      newSessionId = 'dev_phone1_session';
      newLabel = 'Phone 1 (Customer A)';
    } else if (type === 'phone2') {
      newSessionId = 'dev_phone2_session';
      newLabel = 'Phone 2 (Customer B)';
    } else {
      newSessionId = `dev_phone_${Date.now()}`;
      newLabel = `New Phone (${newSessionId.slice(-4)})`;
    }

    localStorage.setItem('ithipooram_device_session_id', newSessionId);
    localStorage.setItem('ithipooram_phone_label', newLabel);
    setDeviceSessionId(newSessionId);
    setPhoneLabel(newLabel);
    setCart([]);
    setIsCartOpen(false);
    setCurrentView('welcome');
    setShowSessionDrawer(false);

    // Refresh active order check for the new phone session
    checkActiveTableOrder(newSessionId, tableCode);
  };

  // Reset/Start fresh order on current phone
  const handleStartFreshOrder = () => {
    if (confirm('Start a separate new order ticket for this table?')) {
      setActiveExistingOrder(null);
      const storageKey = `ithipooram_active_order_${tableCode}_${deviceSessionId}`;
      localStorage.removeItem(storageKey);
      setCart([]);
      setCurrentView('welcome');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-stone-900 font-sans pb-28">
      {/* Top Brand Notification Header */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center justify-between relative">
          {currentView !== 'welcome' ? (
            <button 
              onClick={() => setCurrentView('welcome')}
              className="flex items-center space-x-1 text-xs font-bold text-stone-600 hover:text-stone-950 p-1.5 rounded-xl hover:bg-stone-100 transition z-10"
              title="Back to Welcome"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Home</span>
            </button>
          ) : (
            <div className="w-8" />
          )}

          {/* Centered Brand Name & Logo */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <button
              onClick={() => setCurrentView('welcome')}
              className="flex items-center space-x-2.5 pointer-events-auto active:opacity-80 transition"
            >
              <img 
                src="/logo.png" 
                alt="Ithi Pooram Logo" 
                className="w-9 h-9 object-contain rounded-full shadow-xs shrink-0 bg-stone-50 border border-stone-100"
              />
              <span className="font-extrabold text-stone-950 text-base tracking-tight font-brand-title">
                ITHI POORAM
              </span>
            </button>
          </div>

          <div className="flex items-center space-x-1.5 z-10">
            {activeExistingOrder && currentView === 'menu' ? (
              <button
                onClick={() => setCurrentView('status')}
                className="px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-900 border border-amber-300 text-[11px] font-bold flex items-center space-x-1 animate-pulse"
              >
                <Flame className="w-3 h-3 text-amber-600" />
                <span>Cooking</span>
              </button>
            ) : (
              <div className="w-8" />
            )}
          </div>
        </div>

        {/* Re-order Continuation Active Banner when browsing menu */}
        {activeExistingOrder && currentView === 'menu' && (
          <div className="bg-amber-500/15 border-t border-amber-300/80 px-4 py-2">
            <div className="max-w-xl mx-auto flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-amber-600 animate-ping" />
                <span className="text-xs font-extrabold text-amber-950">
                  Adding new dishes to Order #{activeExistingOrder.customerCode}
                </span>
              </div>
              <button
                onClick={() => setCurrentView('status')}
                className="text-[11px] font-bold text-[#9E341D] underline hover:text-[#832B18]"
              >
                View Kitchen Status
              </button>
            </div>
          </div>
        )}
      </header>

      {/* VIEW 1: WELCOME SCREEN (Landing Screen when QR is scanned) */}
      {currentView === 'welcome' && (
        <main className="max-w-xl mx-auto px-4 pt-6 pb-12 space-y-6 animate-in fade-in duration-300">
          {/* Brand Welcome Banner with Calligraphy Logo */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-sm text-center relative overflow-hidden">
            {/* Subtle background motif */}
            <div className="absolute -top-12 -right-12 w-36 h-36 bg-amber-100/50 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-[#9E341D]/5 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center">
              {/* Calligraphy Logo using uploaded authentic brand calligraphy */}
              <div className="my-2 py-1 px-4">
                <img 
                  src="/brand-calligraphy-dark.png" 
                  alt="ഇത്തിപ്പൂരം - Ithi Pooram" 
                  className="h-20 sm:h-24 object-contain mx-auto mix-blend-multiply transition-transform hover:scale-105"
                />
              </div>

              {/* English Brand typography */}
              <h1 className="text-xl sm:text-2xl font-black text-stone-950 tracking-wider font-brand-title mt-2">
                ITHI POORAM
              </h1>
              <p className="text-xs sm:text-sm font-semibold text-[#9E341D] tracking-wide mt-1">
                Authentic Kerala Lunch & Fresh Coastal Seafood
              </p>
              <p className="text-xs font-medium text-stone-500 mt-1 tracking-wide">
                Vanchiyoor, Trivandrum
              </p>

              {/* Table Identification Card */}
              <div className="w-full mt-6 py-6 px-4 rounded-3xl bg-[#FAF7F2] border border-amber-200/80 text-center shadow-2xs flex flex-col items-center justify-center">
                <span className="text-xs font-bold uppercase tracking-widest text-stone-500">
                  You are ordering through
                </span>
                <div className="text-4xl sm:text-5xl font-black text-[#9E341D] tracking-wider font-mono my-2.5 px-6 py-2 rounded-2xl bg-amber-500/10 border border-amber-300 shadow-xs inline-block">
                  {tableCode}
                </div>
              </div>

              {/* SPECIAL CASE: EXISTING RE-ORDER SESSION DETECTED */}
              {activeExistingOrder ? (
                <div className="w-full mt-5 p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-400 text-left animate-in slide-in-from-top duration-300">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-1.5 text-[#9E341D] font-black text-sm">
                        <Flame className="w-4 h-4 animate-bounce" />
                        <span>Welcome Back! Active Order in Kitchen</span>
                      </div>
                      <p className="text-xs text-stone-700 mt-1">
                        Your previous order <strong className="font-mono text-stone-950">#{activeExistingOrder.customerCode}</strong> is currently cooking. 
                        You can add more dishes to this ongoing order!
                      </p>
                    </div>
                  </div>

                  {/* Summary of what's already cooking */}
                  <div className="mt-3 pt-2.5 border-t border-amber-200/80 text-xs">
                    <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Already Ordered:</span>
                    <div className="mt-1 space-y-1">
                      {activeExistingOrder.items.slice(0, 3).map((it, idx) => (
                        <div key={idx} className="flex justify-between text-stone-800 text-[11px] font-medium">
                          <span>{it.quantity}x {it.itemName}</span>
                          <span className="font-mono font-bold">{formatRupees(it.lineTotalPaise)}</span>
                        </div>
                      ))}
                      {activeExistingOrder.items.length > 3 && (
                        <div className="text-[10px] text-stone-500 italic">
                          + {activeExistingOrder.items.length - 3} more dishes
                        </div>
                      )}
                    </div>
                    <div className="mt-2 text-right font-mono font-bold text-xs text-stone-900">
                      Current Total: {formatRupees(activeExistingOrder.grandTotalPaise)}
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={() => setCurrentView('menu')}
                      className="flex-1 py-3 px-4 rounded-xl bg-[#9E341D] hover:bg-[#832B18] text-white font-extrabold text-xs shadow-md flex items-center justify-center space-x-2 transition active:scale-98"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add More Items to This Order</span>
                    </button>
                    <button
                      onClick={() => setCurrentView('status')}
                      className="py-3 px-4 rounded-xl bg-white border border-amber-300 text-stone-800 font-bold text-xs hover:bg-amber-50 flex items-center justify-center space-x-1"
                    >
                      <span>View Kitchen Status</span>
                    </button>
                  </div>

                  <div className="mt-3 text-center">
                    <button
                      onClick={handleStartFreshOrder}
                      className="text-[11px] text-stone-500 hover:text-stone-800 underline font-medium"
                    >
                      Starting fresh or separate bill? Click here
                    </button>
                  </div>
                </div>
              ) : (
                /* NEW CUSTOMER ORDER BUTTON */
                <div className="w-full mt-6 space-y-3">
                  <button
                    onClick={() => setCurrentView('menu')}
                    className="w-full py-4 px-6 rounded-2xl bg-[#9E341D] hover:bg-[#832B18] text-white font-black text-base shadow-lg shadow-[#9E341D]/25 flex items-center justify-center space-x-3 transition active:scale-98 group"
                  >
                    <Utensils className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                    <span>View Today&apos;s Menu</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>

                  <p className="text-sm font-semibold text-stone-600 font-malayalam-serif">
                    ഇന്നത്തെ സ്പെഷ്യൽ വിഭവങ്ങളും തത്സമയ നിരക്കുകളും കാണുക
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>
      )}

      {/* VIEW 2: MENU BROWSING SCREEN */}
      {currentView === 'menu' && (
        <div>
          {/* Menu Navigation & Search Subheader */}
          <div className="bg-white border-b border-stone-200 sticky top-[57px] z-20 shadow-xs">
            <div className="max-w-xl mx-auto px-4 py-2 space-y-2">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setCurrentView('welcome')}
                  className="flex items-center space-x-1 text-xs font-bold text-stone-600 hover:text-stone-950 py-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Table {tableCode}</span>
                </button>
                <div className="text-xs font-bold text-stone-500">
                  {displayedItems.length} {displayedItems.length === 1 ? 'Dish' : 'Dishes'} Available
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search meals, fish fry, roasts, drinks..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-stone-100 border border-stone-200/80 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-[#9E341D]/20 focus:border-[#9E341D]"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Category Filter Tabs (What admin uploads that day's menu) */}
              <div className="overflow-x-auto no-scrollbar flex space-x-1.5 pt-1 pb-1">
                <button
                  onClick={() => setActiveCategoryTab('all')}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition ${
                    activeCategoryTab === 'all'
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  All Specials
                </button>
                {menuCategories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategoryTab(cat.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition ${
                      activeCategoryTab === cat.id
                        ? 'bg-stone-900 text-white shadow-xs'
                        : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Dishes List */}
          <main className="max-w-xl mx-auto px-4 py-4 space-y-3">
            {allMenuItems.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border-2 border-dashed border-stone-200 p-8 shadow-xs">
                <Utensils className="w-12 h-12 text-[#9E341D] mx-auto mb-3 opacity-60" />
                <h3 className="text-base font-black text-black">Menu Being Updated</h3>
                <p className="text-xs font-bold text-stone-600 mt-1 max-w-xs mx-auto">
                  Our chef &amp; staff are currently setting today&apos;s live menu. Dishes will appear here instantly once added.
                </p>
              </div>
            ) : displayedItems.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-stone-200 p-8">
                <Utensils className="w-10 h-10 text-stone-300 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-stone-800">No dishes match your filter</h3>
                <p className="text-xs text-stone-500 mt-1">Try clearing your search query or switching categories</p>
                <button
                  onClick={() => { setSearchQuery(''); setActiveCategoryTab('all'); setDietaryFilter('ALL'); }}
                  className="mt-4 px-4 py-2 rounded-xl bg-stone-100 text-stone-700 text-xs font-bold"
                >
                  Show All Menu Items
                </button>
              </div>
            ) : (
              displayedItems.map((item) => {
                const inCart = cart.find((c) => c.item.id === item.id);
                return (
                  <div
                    key={item.id}
                    className={`bg-white rounded-2xl p-4 border transition flex flex-col justify-between ${
                      !item.isAvailable 
                        ? 'opacity-65 border-stone-200 bg-stone-50/70' 
                        : inCart 
                        ? 'border-[#9E341D]/40 ring-1 ring-[#9E341D]/20 shadow-xs' 
                        : 'border-stone-200/90 shadow-2xs hover:shadow-xs'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm sm:text-base font-bold text-stone-950">{item.name}</span>
                            {/* Dietary badge */}
                            <span 
                              className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                                item.dietary === 'VEG' 
                                  ? 'bg-emerald-600' 
                                  : item.dietary === 'SEAFOOD' 
                                  ? 'bg-cyan-600' 
                                  : 'bg-red-600'
                              }`} 
                              title={item.dietary}
                            />
                          </div>

                          {item.malayalamName && (
                            <div className="text-xs font-semibold text-[#9E341D] mt-0.5 font-malayalam-serif">
                              {item.malayalamName}
                            </div>
                          )}
                        </div>

                        <span className="text-sm sm:text-base font-black text-stone-950 font-mono shrink-0">
                          {formatRupees(item.pricePaise)}
                        </span>
                      </div>

                      {item.description && (
                        <p className="text-xs text-stone-500 mt-2 leading-relaxed">
                          {item.description}
                        </p>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                          {item.dietary}
                        </span>
                        {!item.isAvailable && (
                          <span className="text-[10px] font-extrabold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                            Sold Out Today
                          </span>
                        )}
                        {item.isAvailable && item.currentStock !== null && item.currentStock !== undefined && item.currentStock <= 5 && (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                            Only {item.currentStock} left
                          </span>
                        )}
                      </div>

                      {/* Add to Cart Actions */}
                      {item.isAvailable ? (
                        inCart ? (
                          <div className="flex items-center space-x-2 bg-stone-100 rounded-xl p-1">
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="w-7 h-7 rounded-lg bg-white text-stone-900 font-bold flex items-center justify-center shadow-xs active:scale-95"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="font-mono font-bold text-xs px-2 text-stone-950">
                              {inCart.qty}
                            </span>
                            <button
                              onClick={() => addToCart(item)}
                              className="w-7 h-7 rounded-lg bg-white text-stone-900 font-bold flex items-center justify-center shadow-xs active:scale-95"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => addToCart(item)}
                            className="px-4 py-2 rounded-xl text-xs font-bold bg-[#9E341D] hover:bg-[#832B18] text-white shadow-xs flex items-center space-x-1.5 active:scale-95 transition"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>{activeExistingOrder ? 'Add to Order' : 'Add'}</span>
                          </button>
                        )
                      ) : (
                        <button
                          disabled
                          className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-stone-200 text-stone-400 cursor-not-allowed"
                        >
                          Sold Out
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </main>
        </div>
      )}

      {/* VIEW 3: LIVE ORDER STATUS & KITCHEN COOKING TRACKER */}
      {currentView === 'status' && activeExistingOrder && (
        <main className="max-w-xl mx-auto px-4 py-6 space-y-5 animate-in fade-in duration-300">
          {/* Main Hospitality Kitchen Message Card */}
          <div className="bg-white rounded-3xl p-6 border-2 border-amber-300/80 shadow-md relative overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                  Table Order Ticket
                </span>
                <div className="text-2xl font-black text-stone-950 font-mono">
                  {activeExistingOrder.customerCode}
                </div>
              </div>
              <div className="text-right">
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase inline-flex items-center space-x-1 bg-amber-100 text-amber-900 border border-amber-300">
                  <Flame className="w-3.5 h-3.5 mr-1 text-amber-600 animate-bounce" />
                  <span>Cooking in Kitchen</span>
                </span>
                <div className="text-xs text-stone-500 mt-1 font-mono font-bold">
                  Total Bill: {formatRupees(activeExistingOrder.grandTotalPaise)}
                </div>
              </div>
            </div>

            {/* THE MODIFIED POST-ORDER SENTENCE */}
            <div className="mt-5 p-4 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-1.5">
              <div className="flex items-center space-x-2 text-[#9E341D] font-black text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Order Received! Fresh cooking in progress</span>
              </div>
              <p className="text-xs text-stone-700 leading-relaxed font-medium">
                Your order is under cooking and will be prepared fresh with traditional spices, delivered hot to your table within <strong>10–15 minutes</strong>.
              </p>
              <p className="text-[11px] text-stone-500 font-malayalam-serif pt-1">
                നിങ്ങളുടെ ഓർഡർ അടുക്കളയിൽ തയ്യാറാക്കിക്കൊണ്ടിരിക്കുന്നു. ഏറ്റവും ഫ്രഷായി 10-15 മിനിറ്റിൽ മേശയിലെത്തും!
              </p>
            </div>

            {/* Stepper Dots */}
            <div className="mt-5 pt-3 border-t border-stone-100 flex items-center justify-between text-xs font-bold text-stone-500">
              <div className="flex items-center space-x-1 text-emerald-700">
                <CheckCircle2 className="w-4 h-4" />
                <span>Sent</span>
              </div>
              <span className="h-0.5 w-8 bg-emerald-400" />
              <div className="flex items-center space-x-1 text-amber-700 font-extrabold">
                <Flame className="w-4 h-4 text-amber-600 animate-pulse" />
                <span>Cooking</span>
              </div>
              <span className="h-0.5 w-8 bg-stone-200" />
              <div className="flex items-center space-x-1 text-stone-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>Serving</span>
              </div>
            </div>

            {/* Itemized List of Dishes Ordered */}
            <div className="mt-6 pt-4 border-t border-stone-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                  Dishes on Your Table Ticket
                </span>
                <span className="text-[11px] text-stone-400 font-mono">
                  {activeExistingOrder.items.length} {activeExistingOrder.items.length === 1 ? 'item' : 'items'}
                </span>
              </div>

              <div className="divide-y divide-stone-100 text-xs">
                {activeExistingOrder.items.map((it, idx) => (
                  <div key={idx} className="py-2 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-stone-900">{it.itemName}</div>
                      {it.itemMalayalamName && (
                        <div className="text-[11px] text-[#9E341D] font-malayalam-serif">{it.itemMalayalamName}</div>
                      )}
                      <div className="text-[10px] text-stone-400">
                        Qty: {it.quantity} {it.round ? `• Round ${it.round}` : ''}
                      </div>
                    </div>
                    <span className="font-mono font-bold text-stone-900">
                      {formatRupees(it.lineTotalPaise)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-3 border-t border-stone-200 flex justify-between text-sm font-black text-stone-950">
                <span>Grand Total:</span>
                <span className="font-mono text-[#9E341D]">{formatRupees(activeExistingOrder.grandTotalPaise || activeExistingOrder.subtotalPaise)}</span>
              </div>
              <div className="text-[10px] text-stone-500 font-semibold mt-1">
                Net final price inclusive of all taxes.
              </div>
            </div>

            {/* Quick Actions to Add More Dishes or Request Bill */}
            <div className="mt-6 pt-4 border-t border-stone-100 flex flex-col gap-2.5">
              <button
                onClick={() => setCurrentView('menu')}
                className="w-full py-3.5 px-4 rounded-2xl bg-[#9E341D] hover:bg-[#832B18] text-white font-extrabold text-xs shadow-md flex items-center justify-center space-x-2 transition active:scale-98"
              >
                <Plus className="w-4 h-4" />
                <span>Order More Food / Add Extra Dishes</span>
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentView('welcome')}
                  className="flex-1 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs"
                >
                  Table {tableCode} Details
                </button>
                <button
                  onClick={handleStartFreshOrder}
                  className="py-2.5 px-3 rounded-xl bg-white border border-stone-200 text-stone-600 hover:text-stone-900 text-xs font-semibold"
                >
                  Start New Bill
                </button>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* Floating Bottom Sticky Bar for Mobile Cart */}
      {cart.length > 0 && currentView === 'menu' && (
        <div className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-stone-200 p-3 shadow-2xl animate-in slide-in-from-bottom duration-200">
          <div className="max-w-xl mx-auto flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                {activeExistingOrder ? `Add-on: ${totalItemCount} dishes` : `${totalItemCount} selected`}
              </div>
              <div className="text-base font-black text-stone-950 font-mono">
                {formatRupees(grandTotalPaise)}
                {activeExistingOrder && (
                  <span className="text-[11px] text-stone-400 font-normal ml-1">
                    (Total: {formatRupees(combinedGrandTotalPaise)})
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={() => setIsCartOpen(true)}
              className="py-3 px-5 rounded-2xl bg-[#9E341D] hover:bg-[#832B18] text-white font-bold text-xs sm:text-sm shadow-md flex items-center space-x-2 active:scale-95 transition"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{activeExistingOrder ? 'Add to Existing Order' : 'Review & Place Order'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Cart & Order Review Modal Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl max-h-[85vh] flex flex-col justify-between animate-in slide-in-from-bottom duration-200">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-stone-950">
                    {activeExistingOrder ? `Add Dishes to Order #${activeExistingOrder.customerCode}` : 'Table Order Summary'}
                  </h3>
                  <p className="text-xs text-stone-500">
                    {tableDisplayName} • <strong className="font-mono text-[#9E341D]">{tableCode}</strong>
                  </p>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-2 rounded-xl text-stone-400 hover:bg-stone-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Re-order Continuation notice in Cart */}
              {activeExistingOrder && (
                <div className="my-2.5 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 flex items-center space-x-2">
                  <Flame className="w-4 h-4 text-amber-600 shrink-0" />
                  <p className="text-[11px] leading-tight">
                    These items will be sent to the kitchen as <strong>Round {(activeExistingOrder.roundCount || 1) + 1}</strong> of your table order.
                  </p>
                </div>
              )}

              {/* Cart Items List */}
              <div className="py-3 space-y-3 overflow-y-auto max-h-52 divide-y divide-stone-100">
                {cart.map((c) => (
                  <div key={c.item.id} className="pt-2 flex items-center justify-between">
                    <div>
                      <div className="text-xs sm:text-sm font-bold text-stone-900">{c.item.name}</div>
                      <div className="text-[11px] text-stone-400">
                        {c.qty} x {formatRupees(c.item.pricePaise)}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => removeFromCart(c.item.id)}
                        className="w-6 h-6 rounded-lg bg-stone-100 text-stone-700 flex items-center justify-center font-bold text-xs"
                      >
                        -
                      </button>
                      <span className="font-mono font-bold text-xs">{c.qty}</span>
                      <button
                        onClick={() => addToCart(c.item)}
                        className="w-6 h-6 rounded-lg bg-stone-100 text-stone-700 flex items-center justify-center font-bold text-xs"
                      >
                        +
                      </button>
                      <span className="font-mono font-bold text-xs w-16 text-right">
                        {formatRupees(c.item.pricePaise * c.qty)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bill Breakdown (Net Final Prices, No Extra GST) */}
              <div className="py-3 border-t border-stone-200 space-y-1 text-xs text-stone-600">
                <div className="flex justify-between">
                  <span>Cart Dishes Subtotal:</span>
                  <span className="font-mono font-bold">{formatRupees(subtotalPaise)}</span>
                </div>
                {activeExistingOrder && (
                  <div className="flex justify-between text-stone-500 text-[11px] pt-1">
                    <span>Previous Dishes Total:</span>
                    <span className="font-mono">{formatRupees(activeExistingOrder.grandTotalPaise)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm sm:text-base font-black text-stone-950 pt-2 border-t border-stone-200">
                  <span>{activeExistingOrder ? 'Updated Combined Total:' : 'Total Payable:'}</span>
                  <span className="font-mono text-[#9E341D]">
                    {formatRupees(activeExistingOrder ? combinedGrandTotalPaise : grandTotalPaise)}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={isOrdering}
              className="w-full mt-3 py-3.5 rounded-2xl bg-[#9E341D] hover:bg-[#832B18] text-white font-black text-xs sm:text-sm shadow-lg flex items-center justify-center space-x-2 transition active:scale-98 disabled:opacity-50"
            >
              <span>
                {isOrdering
                  ? 'Sending Ticket to Kitchen...'
                  : activeExistingOrder
                  ? `Send Add-on Items to Kitchen (+${formatRupees(grandTotalPaise)})`
                  : `Confirm & Send to Kitchen (${formatRupees(grandTotalPaise)})`}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CustomerMobileQrPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FAF7F2] flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-3 border-[#9E341D] border-t-transparent rounded-full animate-spin mb-2" />
        <p className="text-xs font-bold text-stone-600">Loading Ithi Pooram Menu...</p>
      </div>
    }>
      <CustomerOrderingContent />
    </Suspense>
  );
}
