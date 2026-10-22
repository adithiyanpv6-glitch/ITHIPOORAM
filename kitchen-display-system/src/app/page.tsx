'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  ChefHat, 
  Clock, 
  Volume2, 
  VolumeX, 
  CheckCircle2, 
  Flame, 
  RefreshCw,
  Settings,
  BellRing,
  Utensils,
  Check,
  ArrowRight,
  SplitSquareVertical,
  Columns,
  RotateCcw
} from 'lucide-react';

export interface KitchenTicket {
  id: string;
  orderId: string;
  customerCode: string;
  tableCode: string;
  tableName: string;
  station: 'MAIN_KITCHEN' | 'SEAFOOD_FRY' | 'BEVERAGE_COUNTER' | string;
  stationLabel: string;
  status: 'NEW' | 'ACCEPTED' | 'PREPARING' | 'READY' | 'SERVED';
  createdAtMs: number;
  acceptedAtMs?: number;
  deliveredAtMs?: number;
  tableNotes?: string;
  items: Array<{ id: string; name: string; malayalamName?: string; qty: number; notes?: string }>;
}

export default function KitchenDisplayPage() {
  // Fresh state: starts 100% empty with zero demo tickets
  const [tickets, setTickets] = useState<KitchenTicket[]>([]);
  const [stationFilter, setStationFilter] = useState<string>('ALL');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [now, setNow] = useState(Date.now());
  const [apiUrl, setApiUrl] = useState<string>('');
  const [showConfig, setShowConfig] = useState(false);
  const [isLiveConnected, setIsLiveConnected] = useState(true);
  const [lastTicketCount, setLastTicketCount] = useState(0);

  // User Friendly Navigation: 'new' | 'accepted' | 'delivered' | 'split'
  const [activeTab, setActiveTab] = useState<'new' | 'accepted' | 'delivered' | 'split'>('new');

  // Initialize API URL with intelligent origin detection
  useEffect(() => {
    const saved = localStorage.getItem('ithipooram_kds_api');
    if (saved) {
      setApiUrl(saved);
    } else {
      const defaultUrl = process.env.NEXT_PUBLIC_ADMIN_API_URL || 
        (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app') 
          ? 'https://admin-app-ithipooram.vercel.app' 
          : 'http://localhost:3000');
      setApiUrl(defaultUrl);
    }
  }, []);

  // Update elapsed time every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(timer);
  }, []);

  // Web Audio chime for incoming new kitchen orders
  const playChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.8);
    } catch (e) {}
  };

  // Poll Central API for live incoming orders every 2 seconds
  const fetchTickets = async () => {
    try {
      const base = apiUrl || '';
      const endpoint = `${base}/api/kitchen${stationFilter !== 'ALL' ? `?station=${stationFilter}` : ''}`;
      const res = await fetch(endpoint, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        const serverTickets: KitchenTicket[] = data.tickets || [];
        
        // Count new incoming tickets for audio alert
        const newCount = serverTickets.filter((t) => t.status === 'NEW').length;
        if (newCount > lastTicketCount) {
          if (soundEnabled) playChime();
        }
        setLastTicketCount(newCount);
        setTickets(serverTickets);
        setIsLiveConnected(true);
        return;
      }
    } catch (err) {
      // API unreachable, check local orders backup
    }

    // Fallback: check local storage orders if customer ordering is tested in the same browser session
    if (typeof window !== 'undefined') {
      try {
        const localKeys = Object.keys(localStorage).filter((k) => k.startsWith('ithipooram_active_order_'));
        if (localKeys.length > 0) {
          const localTickets: KitchenTicket[] = [];
          for (const key of localKeys) {
            const raw = localStorage.getItem(key);
            if (raw) {
              const order = JSON.parse(raw);
              if (order && order.paymentStatus === 'UNPAID') {
                localTickets.push({
                  id: `local-kt-${order.id}`,
                  orderId: order.id,
                  customerCode: order.customerCode || 'TQ1-01',
                  tableCode: order.tableCode || 'TQ1',
                  tableName: order.tableName || `Table ${order.tableCode}`,
                  station: 'MAIN_KITCHEN',
                  stationLabel: 'Main Kitchen',
                  status: order.fulfillmentStatus === 'PREPARING' || order.fulfillmentStatus === 'ACCEPTED' ? 'ACCEPTED' : order.fulfillmentStatus === 'SERVED' ? 'SERVED' : 'NEW',
                  createdAtMs: new Date(order.createdAt || Date.now()).getTime(),
                  tableNotes: order.notes,
                  items: (order.items || []).map((it: any) => ({
                    id: it.id || it.itemId,
                    name: it.name || it.itemName,
                    malayalamName: it.malayalamName || it.itemMalayalamName,
                    qty: it.qty || it.quantity || 1,
                    notes: it.notes,
                  })),
                });
              }
            }
          }
          if (localTickets.length > 0) {
            setTickets(localTickets);
            setIsLiveConnected(true);
            return;
          }
        }
      } catch (e) {}
    }

    setIsLiveConnected(false);
  };

  useEffect(() => {
    fetchTickets();
    const interval = setInterval(fetchTickets, 2500);
    return () => clearInterval(interval);
  }, [apiUrl, stationFilter, soundEnabled, lastTicketCount]);

  // Handle Pick Order
  const handlePickOrder = async (ticketId: string) => {
    // 1. Optimistic local update
    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, status: 'ACCEPTED', acceptedAtMs: Date.now() } : t))
    );

    // 2. Sync with server API
    try {
      const base = apiUrl || '';
      await fetch(`${base}/api/kitchen`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId, status: 'ACCEPTED' }),
      });
    } catch (e) {
      console.warn('Could not sync status with server:', e);
    }
  };

  // Handle Mark as Delivered
  const handleMarkDelivered = async (ticketId: string) => {
    // 1. Optimistic local update
    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, status: 'SERVED', deliveredAtMs: Date.now() } : t))
    );

    // 2. Sync with server API
    try {
      const base = apiUrl || '';
      await fetch(`${base}/api/kitchen`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId, status: 'SERVED' }),
      });
    } catch (e) {
      console.warn('Could not sync status with server:', e);
    }
  };

  // Group tickets into distinct sections
  const stationFilteredTickets = useMemo(() => {
    if (stationFilter === 'ALL') return tickets;
    return tickets.filter((t) => t.station === stationFilter);
  }, [tickets, stationFilter]);

  const newOrders = useMemo(() => {
    return stationFilteredTickets.filter((t) => t.status === 'NEW');
  }, [stationFilteredTickets]);

  const acceptedOrders = useMemo(() => {
    return stationFilteredTickets.filter((t) => t.status === 'ACCEPTED' || t.status === 'PREPARING' || t.status === 'READY');
  }, [stationFilteredTickets]);

  const deliveredOrders = useMemo(() => {
    return stationFilteredTickets.filter((t) => t.status === 'SERVED');
  }, [stationFilteredTickets]);

  // Render a Single Ticket Card in Crisp White Aesthetic
  const renderTicketCard = (t: KitchenTicket, sectionType: 'new' | 'accepted' | 'delivered') => {
    const elapsedMins = Math.floor((now - t.createdAtMs) / 60000);
    const isUrgent = elapsedMins >= 15;
    const isWarning = elapsedMins >= 10;

    return (
      <div
        key={t.id}
        className={`bg-white rounded-3xl border-2 transition-all flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md ${
          sectionType === 'new'
            ? 'border-amber-400 ring-2 ring-amber-400/20'
            : sectionType === 'accepted'
            ? 'border-blue-500/80 ring-2 ring-blue-500/10'
            : 'border-slate-200 opacity-90'
        }`}
      >
        {/* Card Header */}
        <div className={`p-4 border-b flex items-center justify-between ${
          sectionType === 'new'
            ? 'bg-amber-50/80 border-amber-200'
            : sectionType === 'accepted'
            ? 'bg-blue-50/80 border-blue-200'
            : 'bg-slate-100 border-slate-200'
        }`}>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-black font-mono text-slate-950 tracking-wider">
                {t.customerCode}
              </span>
              <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-white text-slate-900 border border-slate-300 shadow-2xs">
                {t.tableCode}
              </span>
            </div>
            <div className="text-xs text-slate-600 font-bold mt-0.5">
              {t.tableName}
            </div>
          </div>

          <div className="text-right flex flex-col items-end">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-black font-mono ${
              isUrgent
                ? 'bg-red-100 text-red-700 border border-red-300'
                : isWarning
                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                : 'bg-white text-slate-700 border border-slate-300'
            }`}>
              <Clock className="w-3 h-3 mr-1" />
              <span>{elapsedMins}m ago</span>
            </span>

            <span className="text-[10px] font-black text-slate-500 mt-1 uppercase">
              {t.stationLabel || 'Kitchen'}
            </span>
          </div>
        </div>

        {/* Items List */}
        <div className="p-4 flex-1 space-y-3 bg-white">
          <div className="text-[11px] font-black text-slate-400 uppercase tracking-wider flex justify-between border-b border-slate-100 pb-1.5">
            <span>Dish Name</span>
            <span>Qty</span>
          </div>

          <div className="divide-y divide-slate-100">
            {t.items.map((it) => (
              <div key={it.id} className="py-2.5 flex items-start justify-between">
                <div className="pr-2">
                  <div className="text-sm font-black text-slate-900 leading-snug">
                    {it.name}
                  </div>
                  {it.malayalamName && (
                    <div className="text-xs font-bold text-[#9E341D] font-malayalam mt-0.5">
                      {it.malayalamName}
                    </div>
                  )}
                  {it.notes && (
                    <p className="text-[11px] text-amber-700 font-bold italic mt-0.5 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-block">
                      Note: {it.notes}
                    </p>
                  )}
                </div>
                <span className="text-lg font-black font-mono text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-xl border border-slate-200 shrink-0">
                  x{it.qty}
                </span>
              </div>
            ))}
          </div>

          {t.tableNotes && (
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs font-bold mt-2">
              <strong>Order Note:</strong> {t.tableNotes}
            </div>
          )}
        </div>

        {/* Card Footer Actions */}
        <div className="p-3 bg-slate-50 border-t border-slate-200">
          {sectionType === 'new' && (
            <button
              onClick={() => handlePickOrder(t.id)}
              className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs sm:text-sm shadow-md transition active:scale-98 flex items-center justify-center space-x-2 cursor-pointer border border-amber-600"
            >
              <ChefHat className="w-4 h-4 stroke-[2.5]" />
              <span>🍳 Pick Order (Start Cooking)</span>
            </button>
          )}

          {sectionType === 'accepted' && (
            <button
              onClick={() => handleMarkDelivered(t.id)}
              className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm shadow-md transition active:scale-98 flex items-center justify-center space-x-2 cursor-pointer border border-emerald-700"
            >
              <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
              <span>🍽️ Mark as Delivered</span>
            </button>
          )}

          {sectionType === 'delivered' && (
            <div className="py-2.5 text-center text-xs font-black text-emerald-700 flex items-center justify-center space-x-1.5 bg-emerald-50 rounded-xl border border-emerald-200">
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Delivered to {t.tableCode}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans select-none pb-24">
      {/* Top White Header Bar */}
      <header className="bg-white border-b-2 border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center space-x-3.5">
          <img 
            src="/logo.png" 
            alt="Ithi Pooram Logo" 
            className="w-10 h-10 object-contain rounded-full shadow-xs shrink-0 border border-slate-200"
          />
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-950">
                KITCHEN DISPLAY SYSTEM (KDS)
              </h1>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#9E341D] text-white">
                ഇത്തിപ്പൂരം
              </span>
            </div>
            <div className="flex items-center space-x-2 text-xs text-slate-500 font-bold mt-0.5">
              <div className="flex items-center space-x-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${isLiveConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                <span className="text-[11px] font-bold text-slate-700">
                  {isLiveConnected ? 'Connected to Customer Ordering' : 'Offline / Standalone'}
                </span>
              </div>
              <span>•</span>
              <span className="text-[11px] font-mono text-slate-800">
                {stationFilteredTickets.length} Active Tickets
              </span>
            </div>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2.5 rounded-xl border-2 text-xs font-black transition flex items-center space-x-1.5 ${
              soundEnabled
                ? 'bg-emerald-50 border-emerald-400 text-emerald-800'
                : 'bg-slate-100 border-slate-300 text-slate-500'
            }`}
            title={soundEnabled ? 'Order Audio Chime Enabled' : 'Audio Chime Muted'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-700" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden sm:inline-block text-[11px]">{soundEnabled ? 'Chime ON' : 'Muted'}</span>
          </button>

          <button
            onClick={fetchTickets}
            className="p-2.5 rounded-xl bg-white border-2 border-slate-300 hover:bg-slate-100 text-slate-800 transition"
            title="Refresh Live Orders"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowConfig(!showConfig)}
            className="p-2.5 rounded-xl bg-white border-2 border-slate-300 hover:bg-slate-100 text-slate-800 transition"
            title="Configure Server API"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Config Drawer */}
      {showConfig && (
        <div className="bg-white border-b-2 border-slate-200 p-4 text-xs shadow-md">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div>
              <span className="text-slate-900 font-black block">
                Central Admin / Customer Order API Endpoint:
              </span>
              <span className="text-slate-500 text-[11px]">
                Connects KDS to real customer orders submitted from QR tables.
              </span>
            </div>
            <div className="flex space-x-2 sm:w-1/2">
              <input
                type="text"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                className="px-3.5 py-2 rounded-xl bg-slate-50 border-2 border-slate-300 text-xs font-mono font-bold text-slate-900 flex-1 outline-none"
                placeholder="https://admin-app-ithipooram.vercel.app"
              />
              <button
                onClick={() => {
                  localStorage.setItem('ithipooram_kds_api', apiUrl);
                  setShowConfig(false);
                  fetchTickets();
                }}
                className="px-4 py-2 bg-[#9E341D] hover:bg-[#852B17] rounded-xl font-black text-white shrink-0 shadow-sm"
              >
                Save &amp; Connect
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Primary Section Switcher & Station Filter Bar */}
      <div className="bg-white border-b-2 border-slate-200 px-4 sm:px-6 py-3 sticky top-[59px] z-20 shadow-2xs">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Main User-Friendly Section Switcher */}
          <div className="flex space-x-2 overflow-x-auto no-scrollbar py-0.5">
            <button
              onClick={() => setActiveTab('new')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition flex items-center space-x-2 whitespace-nowrap border-2 ${
                activeTab === 'new'
                  ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
            >
              <BellRing className="w-4 h-4" />
              <span>New Orders</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-black ${
                activeTab === 'new' ? 'bg-slate-950 text-white' : 'bg-amber-100 text-amber-900'
              }`}>
                {newOrders.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('accepted')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition flex items-center space-x-2 whitespace-nowrap border-2 ${
                activeTab === 'accepted'
                  ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
            >
              <ChefHat className="w-4 h-4" />
              <span>Accepted Orders (Pending Delivery)</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-black ${
                activeTab === 'accepted' ? 'bg-white text-blue-800' : 'bg-blue-100 text-blue-900'
              }`}>
                {acceptedOrders.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('split')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center space-x-1.5 whitespace-nowrap border-2 ${
                activeTab === 'split'
                  ? 'bg-slate-900 text-white border-slate-950 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
              title="View New Orders and Accepted Orders side-by-side"
            >
              <Columns className="w-4 h-4" />
              <span className="hidden sm:inline">Split Screen</span>
            </button>

            <button
              onClick={() => setActiveTab('delivered')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center space-x-1.5 whitespace-nowrap border-2 ${
                activeTab === 'delivered'
                  ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Delivered ({deliveredOrders.length})</span>
            </button>
          </div>

          {/* Station Filters */}
          <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-0.5">
            <span className="text-xs font-black text-slate-500 shrink-0 mr-1">Station:</span>
            {[
              { id: 'ALL', label: 'All Stations' },
              { id: 'MAIN_KITCHEN', label: 'Main Meals' },
              { id: 'SEAFOOD_FRY', label: 'Tawa & Fry' },
              { id: 'BEVERAGE_COUNTER', label: 'Beverages' },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setStationFilter(st.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-black whitespace-nowrap transition border ${
                  stationFilter === st.id
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6 w-full flex-1">
        {/* VIEW 1: NEW ORDERS SECTION */}
        {activeTab === 'new' && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-slate-950 uppercase tracking-wide flex items-center space-x-2">
                  <span>🔔 New Incoming Orders Waiting to be Picked</span>
                </h2>
                <p className="text-xs font-bold text-slate-500 mt-0.5">
                  Click &quot;Pick Order&quot; on any ticket to accept it and start preparation.
                </p>
              </div>
              <span className="text-xs font-black font-mono bg-amber-100 text-amber-950 px-3 py-1 rounded-full border border-amber-300">
                {newOrders.length} New Orders
              </span>
            </div>

            {newOrders.length === 0 ? (
              <div className="py-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-300 p-8 shadow-xs my-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto mb-3 border border-amber-200">
                  <Utensils className="w-7 h-7" />
                </div>
                <h3 className="text-base font-black text-slate-900">No New Orders Right Now</h3>
                <p className="text-xs sm:text-sm font-bold text-slate-500 mt-1 max-w-md mx-auto">
                  When a customer scans a table QR code and submits an order from their phone, it will instantly chime and appear here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {newOrders.map((t) => renderTicketCard(t, 'new'))}
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: ACCEPTED ORDERS / PENDING DELIVERY */}
        {activeTab === 'accepted' && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-slate-950 uppercase tracking-wide flex items-center space-x-2">
                  <span>⏳ Accepted Orders (Preparation &amp; Pending Delivery)</span>
                </h2>
                <p className="text-xs font-bold text-slate-500 mt-0.5">
                  These tickets are currently cooking. Once food is served to the table, click &quot;Mark as Delivered&quot;.
                </p>
              </div>
              <span className="text-xs font-black font-mono bg-blue-100 text-blue-950 px-3 py-1 rounded-full border border-blue-300">
                {acceptedOrders.length} In Kitchen
              </span>
            </div>

            {acceptedOrders.length === 0 ? (
              <div className="py-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-300 p-8 shadow-xs my-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center mx-auto mb-3 border border-blue-200">
                  <ChefHat className="w-7 h-7" />
                </div>
                <h3 className="text-base font-black text-slate-900">No Orders Currently In Preparation</h3>
                <p className="text-xs sm:text-sm font-bold text-slate-500 mt-1 max-w-md mx-auto">
                  Go to &quot;New Orders&quot; and click &quot;Pick Order&quot; on any incoming customer order to start cooking.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {acceptedOrders.map((t) => renderTicketCard(t, 'accepted'))}
              </div>
            )}
          </div>
        )}

        {/* VIEW 3: SPLIT SCREEN (SIDE BY SIDE ON WIDE TABLETS / MONITORS) */}
        {activeTab === 'split' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: New Orders */}
            <div className="space-y-4 bg-amber-50/40 p-4 rounded-3xl border-2 border-amber-200">
              <div className="flex items-center justify-between pb-2 border-b border-amber-200">
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 rounded-full bg-amber-500 animate-ping" />
                  <h3 className="text-sm font-black text-slate-950 uppercase">New Orders ({newOrders.length})</h3>
                </div>
                <span className="text-[11px] font-bold text-slate-600">Waiting for Pick</span>
              </div>

              {newOrders.length === 0 ? (
                <div className="py-16 text-center text-slate-400 font-bold text-xs bg-white rounded-2xl border border-dashed border-amber-200 p-4">
                  No new customer orders waiting.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {newOrders.map((t) => renderTicketCard(t, 'new'))}
                </div>
              )}
            </div>

            {/* Right: Accepted Orders Pending Delivery */}
            <div className="space-y-4 bg-blue-50/40 p-4 rounded-3xl border-2 border-blue-200">
              <div className="flex items-center justify-between pb-2 border-b border-blue-200">
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
                  <h3 className="text-sm font-black text-slate-950 uppercase">Accepted &amp; Pending Delivery ({acceptedOrders.length})</h3>
                </div>
                <span className="text-[11px] font-bold text-slate-600">Ready to Deliver</span>
              </div>

              {acceptedOrders.length === 0 ? (
                <div className="py-16 text-center text-slate-400 font-bold text-xs bg-white rounded-2xl border border-dashed border-blue-200 p-4">
                  No accepted orders in kitchen.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {acceptedOrders.map((t) => renderTicketCard(t, 'accepted'))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 4: DELIVERED HISTORY */}
        {activeTab === 'delivered' && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-slate-950 uppercase tracking-wide flex items-center space-x-2">
                  <span>✅ Delivered Orders (Completed &amp; Served)</span>
                </h2>
                <p className="text-xs font-bold text-slate-500 mt-0.5">
                  List of orders that were prepared and delivered to dining tables.
                </p>
              </div>
              <span className="text-xs font-black font-mono bg-emerald-100 text-emerald-950 px-3 py-1 rounded-full border border-emerald-300">
                {deliveredOrders.length} Delivered
              </span>
            </div>

            {deliveredOrders.length === 0 ? (
              <div className="py-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-300 p-8 shadow-xs my-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-3 border border-emerald-200">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h3 className="text-base font-black text-slate-900">No Orders Delivered Yet</h3>
                <p className="text-xs sm:text-sm font-bold text-slate-500 mt-1 max-w-md mx-auto">
                  When you click &quot;Mark as Delivered&quot; on prepared food, it will be safely archived here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {deliveredOrders.map((t) => renderTicketCard(t, 'delivered'))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
