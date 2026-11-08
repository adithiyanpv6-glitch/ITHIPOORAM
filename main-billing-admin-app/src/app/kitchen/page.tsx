'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  ChefHat, 
  Clock, 
  Volume2, 
  VolumeX, 
  CheckCircle2, 
  Flame, 
  RefreshCw,
  BellRing,
  ArrowLeft,
  Columns,
  Check,
  SplitSquareVertical,
  Utensils
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
  const [tickets, setTickets] = useState<KitchenTicket[]>([]);
  const [stationFilter, setStationFilter] = useState<string>('ALL');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [now, setNow] = useState(Date.now());
  const [isLiveConnected, setIsLiveConnected] = useState(true);
  const [lastTicketCount, setLastTicketCount] = useState(0);

  // Tab navigation: 'new' | 'accepted' | 'delivered' | 'split'
  const [activeTab, setActiveTab] = useState<'new' | 'accepted' | 'delivered' | 'split'>('new');

  // Update clock every 5 seconds for elapsed times
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(timer);
  }, []);

  // Web Audio chime for incoming kitchen tickets
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

  // Poll Central API for live incoming orders every 2.5s
  const fetchTickets = async () => {
    try {
      const endpoint = `/api/kitchen${stationFilter !== 'ALL' ? `?station=${stationFilter}` : ''}`;
      const res = await fetch(endpoint, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        const serverTickets: KitchenTicket[] = data.tickets || [];
        
        // Trigger chime if new orders arrived
        const currentNewCount = serverTickets.filter(t => t.status === 'NEW').length;
        if (soundEnabled && currentNewCount > lastTicketCount) {
          playChime();
        }
        setLastTicketCount(currentNewCount);
        setTickets(serverTickets);
        setIsLiveConnected(true);
      } else {
        setIsLiveConnected(false);
      }
    } catch (err) {
      setIsLiveConnected(false);
    }
  };

  useEffect(() => {
    fetchTickets();
    const interval = setInterval(fetchTickets, 2500);
    return () => clearInterval(interval);
  }, [stationFilter, soundEnabled, lastTicketCount]);

  // Handle Pick Order (moves to ACCEPTED / PREPARING)
  const handlePickOrder = async (ticketId: string) => {
    try {
      await fetch('/api/kitchen', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId, status: 'ACCEPTED' }),
      });
      fetchTickets();
    } catch (err) {
      console.error('Failed to pick order:', err);
    }
  };

  // Handle Mark as Delivered (moves to SERVED)
  const handleMarkDelivered = async (ticketId: string) => {
    try {
      await fetch('/api/kitchen', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId, status: 'SERVED' }),
      });
      fetchTickets();
    } catch (err) {
      console.error('Failed to mark delivered:', err);
    }
  };

  // Filtered tickets
  const newOrders = useMemo(() => {
    return tickets.filter(t => t.status === 'NEW');
  }, [tickets]);

  const acceptedOrders = useMemo(() => {
    return tickets.filter(t => t.status === 'ACCEPTED' || t.status === 'PREPARING' || t.status === 'READY');
  }, [tickets]);

  const deliveredOrders = useMemo(() => {
    return tickets.filter(t => t.status === 'SERVED');
  }, [tickets]);

  // Elapsed time format
  const formatElapsed = (createdMs: number) => {
    const elapsedSec = Math.floor((now - createdMs) / 1000);
    if (elapsedSec < 60) return `${elapsedSec}s`;
    const min = Math.floor(elapsedSec / 60);
    return `${min}m`;
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#0A0C10] flex flex-col font-sans selection:bg-zinc-800 selection:text-white">
      
      {/* Top Header */}
      <header className="bg-white border-b border-zinc-200 px-4 sm:px-6 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center space-x-3">
          <Link
            href="/"
            className="p-2 rounded-xl border border-zinc-200 hover:border-black text-zinc-600 hover:text-black transition"
            title="Back to Admin Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-black text-white flex items-center justify-center font-black">
              <ChefHat className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black text-black leading-tight">
                Kitchen Display System (KDS)
              </h1>
              <span className="text-[10px] text-zinc-500 font-bold">
                ഇത്തിപ്പൂരം ലൈവ് അടുക്കള കൺസോൾ
              </span>
            </div>
          </div>
        </div>

        {/* Station Filter & Audio Chime */}
        <div className="flex items-center space-x-2.5">
          <select
            value={stationFilter}
            onChange={(e) => setStationFilter(e.target.value)}
            className="text-xs font-bold bg-zinc-100 border border-zinc-300 rounded-xl px-3 py-1.5 text-black outline-none focus:border-black"
          >
            <option value="ALL">All Stations</option>
            <option value="MAIN_KITCHEN">Main Meals &amp; Curries</option>
            <option value="SEAFOOD_FRY">Tawa &amp; Seafood Fry</option>
            <option value="BEVERAGE_COUNTER">Beverages &amp; Sweets</option>
          </select>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl border transition ${
              soundEnabled 
                ? 'bg-zinc-100 border-zinc-300 text-black' 
                : 'bg-zinc-50 border-zinc-200 text-zinc-400'
            }`}
            title={soundEnabled ? 'Mute Chime' : 'Enable Chime'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            onClick={fetchTickets}
            className="p-2 rounded-xl border border-zinc-200 hover:border-black text-zinc-600 transition"
            title="Refresh Tickets"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Navigation Sub-Tabs: New Orders (x) | Accepted Orders (y) | Delivered (z) | Split View */}
      <div className="bg-white border-b border-zinc-200 px-4 sm:px-6 py-2 flex items-center justify-between overflow-x-auto">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('new')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center space-x-2 transition cursor-pointer ${
              activeTab === 'new'
                ? 'bg-black text-white shadow-xs'
                : 'text-zinc-600 hover:bg-zinc-100'
            }`}
          >
            <BellRing className="w-3.5 h-3.5 text-amber-400" />
            <span>New Orders</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              newOrders.length > 0 ? 'bg-amber-400 text-black animate-pulse' : 'bg-zinc-800 text-white'
            }`}>
              {newOrders.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('accepted')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center space-x-2 transition cursor-pointer ${
              activeTab === 'accepted'
                ? 'bg-black text-white shadow-xs'
                : 'text-zinc-600 hover:bg-zinc-100'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-orange-500" />
            <span>Accepted Orders (Cooking)</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-zinc-200 text-black">
              {acceptedOrders.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('delivered')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center space-x-2 transition cursor-pointer ${
              activeTab === 'delivered'
                ? 'bg-black text-white shadow-xs'
                : 'text-zinc-600 hover:bg-zinc-100'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Delivered History</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-zinc-100 text-zinc-600">
              {deliveredOrders.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('split')}
            className={`px-3 py-2 rounded-xl text-xs font-extrabold flex items-center space-x-1.5 transition cursor-pointer ${
              activeTab === 'split'
                ? 'bg-black text-white shadow-xs'
                : 'text-zinc-600 hover:bg-zinc-100'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span>Split Screen</span>
          </button>
        </div>

        {/* Live sync indicator */}
        <div className="hidden sm:flex items-center space-x-2 text-[11px] font-mono font-bold text-emerald-700">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span>Live Synced</span>
        </div>
      </div>

      {/* Main Workspace */}
      <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
        
        {/* VIEW 1: NEW ORDERS TAB */}
        {activeTab === 'new' && (
          <div>
            {newOrders.length === 0 ? (
              <div className="py-24 text-center space-y-3 bg-white rounded-3xl border border-zinc-200 shadow-xs max-w-xl mx-auto">
                <div className="w-16 h-16 rounded-2xl bg-zinc-100 text-zinc-400 mx-auto flex items-center justify-center">
                  <ChefHat className="w-8 h-8" />
                </div>
                <h3 className="text-base font-black text-black">No New Kitchen Orders</h3>
                <p className="text-xs text-zinc-400 font-semibold max-w-sm mx-auto">
                  When confirmed orders arrive from table QR or POS counter, they will instantly chime and appear here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {newOrders.map((t) => (
                  <div
                    key={t.id}
                    className="bg-white rounded-3xl p-5 border-2 border-amber-400 shadow-md flex flex-col justify-between space-y-4 hover:shadow-lg transition relative overflow-hidden"
                  >
                    <div className="space-y-3">
                      {/* Ticket Header */}
                      <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                        <div className="flex items-center space-x-2">
                          <span className="px-3 py-1 rounded-xl bg-black text-white font-mono font-black text-sm">
                            {t.tableCode}
                          </span>
                          <span className="text-xs font-mono font-bold text-zinc-500">
                            {t.customerCode}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1 font-mono text-xs font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{formatElapsed(t.createdAtMs)}</span>
                        </div>
                      </div>

                      {/* Station Label */}
                      <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block">
                        {t.stationLabel}
                      </span>

                      {/* Dish Items */}
                      <div className="space-y-2">
                        {t.items.map((it) => (
                          <div key={it.id} className="flex items-center justify-between text-xs py-1 border-b border-dashed border-zinc-100">
                            <div>
                              <span className="font-extrabold text-black block">{it.name}</span>
                              {it.malayalamName && (
                                <span className="text-[10px] text-zinc-400 font-malayalam block">{it.malayalamName}</span>
                              )}
                              {it.notes && (
                                <span className="text-[10px] text-amber-700 font-semibold block">Note: {it.notes}</span>
                              )}
                            </div>
                            <span className="px-2 py-1 rounded-lg bg-zinc-100 font-mono font-black text-sm text-black">
                              x{it.qty}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action: Pick Order */}
                    <button
                      onClick={() => handlePickOrder(t.id)}
                      className="w-full py-3 rounded-2xl bg-black hover:bg-zinc-800 text-white font-black text-xs flex items-center justify-center space-x-2 shadow-xs transition active:scale-98 cursor-pointer"
                    >
                      <Flame className="w-4 h-4 text-orange-400" />
                      <span>Pick Order &amp; Cook</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: ACCEPTED / COOKING ORDERS TAB */}
        {activeTab === 'accepted' && (
          <div>
            {acceptedOrders.length === 0 ? (
              <div className="py-24 text-center space-y-3 bg-white rounded-3xl border border-zinc-200 shadow-xs max-w-xl mx-auto">
                <div className="w-16 h-16 rounded-2xl bg-zinc-100 text-zinc-400 mx-auto flex items-center justify-center">
                  <Flame className="w-8 h-8 text-orange-400" />
                </div>
                <h3 className="text-base font-black text-black">No Orders Currently Cooking</h3>
                <p className="text-xs text-zinc-400 font-semibold max-w-sm mx-auto">
                  Pick orders from the New Orders tab to move them here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {acceptedOrders.map((t) => (
                  <div
                    key={t.id}
                    className="bg-white rounded-3xl p-5 border border-zinc-200 shadow-xs flex flex-col justify-between space-y-4 hover:border-black transition"
                  >
                    <div className="space-y-3">
                      {/* Header */}
                      <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                        <div className="flex items-center space-x-2">
                          <span className="px-3 py-1 rounded-xl bg-orange-600 text-white font-mono font-black text-sm">
                            {t.tableCode}
                          </span>
                          <span className="text-xs font-mono font-bold text-zinc-500">
                            {t.customerCode}
                          </span>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-orange-100 text-orange-800">
                          Cooking
                        </span>
                      </div>

                      {/* Items */}
                      <div className="space-y-2">
                        {t.items.map((it) => (
                          <div key={it.id} className="flex items-center justify-between text-xs py-1 border-b border-dashed border-zinc-100">
                            <span className="font-extrabold text-black">{it.name}</span>
                            <span className="px-2 py-1 rounded-lg bg-zinc-100 font-mono font-black text-sm text-black">
                              x{it.qty}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action: Delivered */}
                    <button
                      onClick={() => handleMarkDelivered(t.id)}
                      className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center space-x-2 shadow-xs transition active:scale-98 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>Mark as Delivered</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW 3: DELIVERED HISTORY TAB */}
        {activeTab === 'delivered' && (
          <div className="bg-white rounded-3xl border border-zinc-200 p-5 sm:p-6 shadow-xs max-w-4xl mx-auto">
            <h3 className="text-sm font-black text-black mb-4">Delivered Orders History</h3>
            {deliveredOrders.length === 0 ? (
              <p className="text-xs text-zinc-400">No dishes delivered yet today.</p>
            ) : (
              <div className="divide-y divide-zinc-100">
                {deliveredOrders.map((t) => (
                  <div key={t.id} className="py-3 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-3">
                      <span className="px-2.5 py-1 rounded-xl bg-zinc-100 font-mono font-black text-black">
                        {t.tableCode}
                      </span>
                      <div>
                        <span className="font-bold text-black">{t.customerCode}</span>
                        <p className="text-[11px] text-zinc-400">
                          {t.items.map(it => `${it.qty}x ${it.name}`).join(', ')}
                        </p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Delivered
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW 4: SPLIT SCREEN VIEW */}
        {activeTab === 'split' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: New Orders */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-200">
                <h3 className="text-sm font-black text-black flex items-center space-x-2">
                  <BellRing className="w-4 h-4 text-amber-500" />
                  <span>Incoming New Orders ({newOrders.length})</span>
                </h3>
              </div>
              <div className="space-y-3">
                {newOrders.map((t) => (
                  <div key={t.id} className="bg-white rounded-2xl p-4 border-2 border-amber-400 shadow-xs flex items-center justify-between">
                    <div>
                      <span className="font-mono font-black text-xs bg-black text-white px-2 py-0.5 rounded-md mr-2">
                        {t.tableCode}
                      </span>
                      <span className="font-bold text-xs text-black">
                        {t.items.map(it => `${it.qty}x ${it.name}`).join(', ')}
                      </span>
                    </div>
                    <button
                      onClick={() => handlePickOrder(t.id)}
                      className="px-3 py-1.5 rounded-xl bg-black text-white font-black text-xs hover:bg-zinc-800"
                    >
                      Pick &amp; Cook
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Cooking Orders */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-200">
                <h3 className="text-sm font-black text-black flex items-center space-x-2">
                  <Flame className="w-4 h-4 text-orange-500" />
                  <span>Cooking / Preparing ({acceptedOrders.length})</span>
                </h3>
              </div>
              <div className="space-y-3">
                {acceptedOrders.map((t) => (
                  <div key={t.id} className="bg-white rounded-2xl p-4 border border-zinc-200 shadow-xs flex items-center justify-between">
                    <div>
                      <span className="font-mono font-black text-xs bg-orange-600 text-white px-2 py-0.5 rounded-md mr-2">
                        {t.tableCode}
                      </span>
                      <span className="font-bold text-xs text-black">
                        {t.items.map(it => `${it.qty}x ${it.name}`).join(', ')}
                      </span>
                    </div>
                    <button
                      onClick={() => handleMarkDelivered(t.id)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-black text-xs hover:bg-emerald-700"
                    >
                      Delivered
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
