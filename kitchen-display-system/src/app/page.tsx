'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  ChefHat, 
  Clock, 
  Volume2, 
  VolumeX, 
  Wifi, 
  CheckCircle2, 
  Flame, 
  AlertTriangle, 
  XCircle, 
  RefreshCw,
  Settings,
  BellRing
} from 'lucide-react';

interface KitchenTicket {
  id: string;
  orderId: string;
  customerCode: string;
  tableCode: string;
  tableName: string;
  station: 'MAIN_KITCHEN' | 'SEAFOOD_FRY' | 'BEVERAGE_COUNTER';
  stationLabel: string;
  status: 'NEW' | 'ACCEPTED' | 'PREPARING' | 'READY' | 'SERVED';
  createdAtMs: number;
  tableNotes?: string;
  items: Array<{ id: string; name: string; qty: number; notes?: string }>;
}

const INITIAL_TICKETS: KitchenTicket[] = [
  {
    id: 'k1',
    orderId: 'ord-1',
    customerCode: 'TQ1-01',
    tableCode: 'TQ1',
    tableName: 'Table 1 (Verandah)',
    station: 'SEAFOOD_FRY',
    stationLabel: 'Tawa & Fry',
    status: 'NEW',
    createdAtMs: Date.now() - 3 * 60000,
    tableNotes: 'Serve sizzling hot with lime',
    items: [
      { id: 'i1', name: 'Karimeen Pollichathu (Banana Leaf)', qty: 1, notes: 'Medium spice' },
      { id: 'i2', name: 'Ayala Fry (Mackerel Sizzle)', qty: 2 },
    ]
  },
  {
    id: 'k2',
    orderId: 'ord-2',
    customerCode: 'TQ3-01',
    tableCode: 'TQ3',
    tableName: 'Table 3 (Courtyard AC)',
    station: 'MAIN_KITCHEN',
    stationLabel: 'Main Meals',
    status: 'ACCEPTED',
    createdAtMs: Date.now() - 8 * 60000,
    items: [
      { id: 'i3', name: 'Special Kerala Seafood Oonu', qty: 2 },
      { id: 'i4', name: 'Kerala Beef Fry (Ularthiyathu)', qty: 1, notes: 'Extra coconut slices' },
    ]
  }
];

export default function KitchenDisplayPage() {
  const [tickets, setTickets] = useState<KitchenTicket[]>(INITIAL_TICKETS);
  const [stationFilter, setStationFilter] = useState<string>('ALL');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [now, setNow] = useState(Date.now());
  const [apiUrl, setApiUrl] = useState<string>('');
  const [showConfig, setShowConfig] = useState(false);
  const [isLiveConnected, setIsLiveConnected] = useState(true);
  const [lastTicketCount, setLastTicketCount] = useState(INITIAL_TICKETS.length);

  // Initialize API URL
  useEffect(() => {
    const saved = localStorage.getItem('ithipooram_kds_api');
    if (saved) {
      setApiUrl(saved);
    } else {
      const defaultUrl = process.env.NEXT_PUBLIC_ADMIN_API_URL || (typeof window !== 'undefined' && window.location.port === '3000' ? '' : 'http://localhost:3000');
      setApiUrl(defaultUrl);
    }
  }, []);

  // Update elapsed time every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(timer);
  }, []);

  // Web Audio chime for new kitchen orders
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

  // Poll Central API for live incoming orders every 2.5 seconds
  useEffect(() => {
    const pollKitchen = async () => {
      try {
        const endpoint = `${apiUrl}/api/kitchen${stationFilter !== 'ALL' ? `?station=${stationFilter}` : ''}`;
        const res = await fetch(endpoint);
        if (res.ok) {
          const data = await res.json();
          const serverTickets = data.tickets || [];
          
          if (serverTickets.length > lastTicketCount) {
            if (soundEnabled) playChime();
          }
          setLastTicketCount(serverTickets.length);
          setTickets(serverTickets.length > 0 ? serverTickets : INITIAL_TICKETS);
          setIsLiveConnected(true);
        } else {
          setIsLiveConnected(false);
        }
      } catch (err) {
        setIsLiveConnected(false);
      }
    };

    pollKitchen();
    const interval = setInterval(pollKitchen, 2500);
    return () => clearInterval(interval);
  }, [apiUrl, stationFilter, soundEnabled, lastTicketCount]);

  // Handle Chef Status Changes (calls real API)
  const handleBumpStatus = async (id: string, nextStatus: 'ACCEPTED' | 'PREPARING' | 'READY' | 'SERVED') => {
    // Optimistic UI update
    if (nextStatus === 'SERVED') {
      setTickets((prev) => prev.filter((t) => t.id !== id));
    } else {
      setTickets((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status: nextStatus } : t))
      );
    }

    try {
      await fetch(`${apiUrl}/api/kitchen`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId: id, status: nextStatus }),
      });
    } catch (e) {
      console.warn('Could not sync status with server:', e);
    }
  };

  const filteredTickets = useMemo(() => {
    if (stationFilter === 'ALL') return tickets;
    return tickets.filter((t) => t.station === stationFilter);
  }, [tickets, stationFilter]);

  return (
    <div className="min-h-screen bg-[#0E1218] text-stone-100 flex flex-col font-sans select-none pb-24">
      {/* Top KDS Header */}
      <header className="bg-[#141922] border-b border-stone-800 px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-30 shadow-md">
        <div className="flex items-center space-x-3">
          <img 
            src="/logo.png" 
            alt="Logo" 
            className="w-10 h-10 object-contain rounded-full shadow-md shrink-0"
          />
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-black tracking-tight text-white">KITCHEN DISPLAY (KDS)</h1>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800/80">
                ഇത്തിപ്പൂരം
              </span>
            </div>
            <div className="flex items-center space-x-2 text-xs text-stone-400">
              <div className="flex items-center space-x-1">
                <span className={`w-2 h-2 rounded-full ${isLiveConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                <span className="text-[11px]">{isLiveConnected ? 'Live Real-Time Sync' : 'Standalone Mode'}</span>
              </div>
              <span>•</span>
              <span className="text-[11px] font-mono text-stone-300">
                {filteredTickets.length} Active Tickets
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl border text-xs font-bold transition flex items-center space-x-1 ${
              soundEnabled
                ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                : 'bg-stone-800 border-stone-700 text-stone-400'
            }`}
            title={soundEnabled ? 'Order Audio Chime Enabled' : 'Audio Chime Muted'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setShowConfig(!showConfig)}
            className="p-2 rounded-xl bg-stone-800 border border-stone-700 text-stone-300 hover:text-white"
            title="Configure Server API"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Config Drawer */}
      {showConfig && (
        <div className="bg-stone-900 border-b border-stone-800 p-3 text-xs">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
            <span className="text-stone-300 font-bold">
              Central Admin/POS API URL (e.g. https://admin-app-ithipooram.vercel.app or http://localhost:3000):
            </span>
            <div className="flex space-x-2">
              <input
                type="text"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-stone-800 border border-stone-700 text-xs text-white flex-1"
                placeholder="Central API URL"
              />
              <button
                onClick={() => {
                  localStorage.setItem('ithipooram_kds_api', apiUrl);
                  setShowConfig(false);
                }}
                className="px-3 py-1.5 bg-[#9E341D] rounded-lg font-bold text-white shrink-0"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Station Selector Bar (Mobile Friendly Horizontal Scroller) */}
      <div className="bg-[#141922] border-b border-stone-800 px-4 sm:px-6 py-2">
        <div className="max-w-7xl mx-auto flex space-x-2 overflow-x-auto no-scrollbar">
          {[
            { id: 'ALL', label: 'All Stations' },
            { id: 'MAIN_KITCHEN', label: 'Main Meals & Sadhya' },
            { id: 'SEAFOOD_FRY', label: 'Seafood Tawa & Fry' },
            { id: 'BEVERAGE_COUNTER', label: 'Beverages & Sweets' },
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setStationFilter(st.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                stationFilter === st.id
                  ? 'bg-[#9E341D] text-white shadow-md'
                  : 'bg-stone-800/80 text-stone-300 hover:bg-stone-700'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Ticket Grid for Kitchen Chefs */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6 w-full flex-1">
        {filteredTickets.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center text-stone-400">
            <CheckCircle2 className="w-14 h-14 text-emerald-500/60 mb-2" />
            <h3 className="text-base font-bold text-white">All Kitchen Orders Cleared</h3>
            <p className="text-xs text-stone-500 mt-1">
              No pending orders for station: {stationFilter.replace('_', ' ')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {filteredTickets.map((t) => {
              const elapsedMins = Math.floor((now - t.createdAtMs) / 60000);
              const isUrgent = elapsedMins >= 15;
              const isWarning = elapsedMins >= 10;

              return (
                <div
                  key={t.id}
                  className={`bg-[#161C26] rounded-3xl border overflow-hidden shadow-lg flex flex-col justify-between transition ${
                    t.status === 'NEW'
                      ? 'border-amber-500/60 ring-2 ring-amber-500/30'
                      : t.status === 'PREPARING'
                      ? 'border-orange-500/50'
                      : t.status === 'READY'
                      ? 'border-emerald-500/50'
                      : 'border-stone-800'
                  }`}
                >
                  {/* Card Header */}
                  <div className="p-4 bg-[#121620] border-b border-stone-800/80 flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xl font-black font-mono text-white tracking-wider">
                          {t.customerCode}
                        </span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          {t.tableCode}
                        </span>
                      </div>
                      <div className="text-[11px] text-stone-400 font-medium mt-0.5">
                        {t.tableName}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                        isUrgent
                          ? 'bg-red-950 text-red-300 border border-red-800'
                          : isWarning
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-stone-800 text-stone-300'
                      }`}>
                        <Clock className="w-3 h-3 mr-1" />
                        <span>{elapsedMins}m ago</span>
                      </span>
                    </div>
                  </div>

                  {/* Items list */}
                  <div className="p-4 flex-1 space-y-3">
                    <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider flex justify-between">
                      <span>Dish Name</span>
                      <span>Qty</span>
                    </div>

                    <div className="divide-y divide-stone-800/80">
                      {t.items.map((it) => (
                        <div key={it.id} className="py-2 flex items-start justify-between">
                          <div>
                            <span className="text-sm font-bold text-white leading-snug">
                              {it.name}
                            </span>
                            {it.notes && (
                              <p className="text-[11px] text-amber-300/90 font-medium italic mt-0.5">
                                Note: {it.notes}
                              </p>
                            )}
                          </div>
                          <span className="text-lg font-black font-mono text-amber-400 pl-3">
                            x{it.qty}
                          </span>
                        </div>
                      ))}
                    </div>

                    {t.tableNotes && (
                      <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-800/50 text-amber-200 text-xs">
                        <strong>Chef Note:</strong> {t.tableNotes}
                      </div>
                    )}
                  </div>

                  {/* Chef Status Action Buttons (Large Touch Target) */}
                  <div className="p-3 bg-[#11151E] border-t border-stone-800">
                    {t.status === 'NEW' && (
                      <button
                        onClick={() => handleBumpStatus(t.id, 'ACCEPTED')}
                        className="w-full py-3 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs shadow-md transition active:scale-98 flex items-center justify-center space-x-1.5"
                      >
                        <ChefHat className="w-4 h-4" />
                        <span>Accept Order</span>
                      </button>
                    )}

                    {t.status === 'ACCEPTED' && (
                      <button
                        onClick={() => handleBumpStatus(t.id, 'PREPARING')}
                        className="w-full py-3 rounded-2xl bg-orange-600 hover:bg-orange-500 text-white font-extrabold text-xs shadow-md transition active:scale-98 flex items-center justify-center space-x-1.5"
                      >
                        <Flame className="w-4 h-4" />
                        <span>Start Cooking</span>
                      </button>
                    )}

                    {t.status === 'PREPARING' && (
                      <button
                        onClick={() => handleBumpStatus(t.id, 'READY')}
                        className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md transition active:scale-98 flex items-center justify-center space-x-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Mark Ready to Serve</span>
                      </button>
                    )}

                    {t.status === 'READY' && (
                      <button
                        onClick={() => handleBumpStatus(t.id, 'SERVED')}
                        className="w-full py-3 rounded-2xl bg-stone-700 hover:bg-stone-600 text-stone-200 font-extrabold text-xs transition active:scale-98 flex items-center justify-center space-x-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Order Served (Clear)</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
