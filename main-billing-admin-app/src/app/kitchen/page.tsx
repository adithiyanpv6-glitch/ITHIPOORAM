'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  Check,
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
  const [speakerEnabled, setSpeakerEnabled] = useState(true);
  const [now, setNow] = useState(Date.now());
  const [isLiveConnected, setIsLiveConnected] = useState(true);
  const [lastTicketCount, setLastTicketCount] = useState<number | null>(null);

  // Tab navigation: exactly 3 options as requested: 'new' (New Orders to Receive) | 'working' (Working Orders) | 'served' (Served Ones)
  const [activeTab, setActiveTab] = useState<'new' | 'working' | 'served'>('new');

  // Load persisted tickets on mount from local browser memory to prevent cold-start blanking
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ithipooram_kds_tickets');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setTickets(parsed);
          }
        } catch (e) {}
      }
    }
  }, []);

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

  // Automatic Text-To-Speech Voice Callout
  const speakNewOrder = (tableCode?: string) => {
    if (!speakerEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const text = tableCode 
        ? `New order received for Table ${tableCode}`
        : 'New order received in kitchen';
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis callout error:', e);
    }
  };

  // Poll Central API for live incoming orders every 2.5s with Resilient Merging (Zero Disappearing)
  const fetchTickets = async () => {
    try {
      const endpoint = `/api/kitchen${stationFilter !== 'ALL' ? `?station=${stationFilter}` : ''}`;
      const res = await fetch(endpoint, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        const serverTickets: KitchenTicket[] = data.tickets || [];
        
        // Intelligent Merge: Never wipe out an active ticket when hitting an ephemeral cold lambda
        setTickets((prev) => {
          if (serverTickets.length === 0 && prev.length > 0) {
            return prev; // Retain existing active tickets!
          }

          const ticketMap = new Map<string, KitchenTicket>();
          // Retain active tickets that haven't been explicitly cleared
          prev.forEach((t) => ticketMap.set(t.id, t));
          // Apply fresh server state
          serverTickets.forEach((t) => ticketMap.set(t.id, t));

          const merged = Array.from(ticketMap.values());
          if (typeof window !== 'undefined') {
            localStorage.setItem('ithipooram_kds_tickets', JSON.stringify(merged));
          }

          const currentNewCount = merged.filter((t) => t.status === 'NEW').length;
          // If brand new order arrived: play chime + call out over speaker automatically!
          if (lastTicketCount !== null && currentNewCount > lastTicketCount) {
            playChime();
            const latestNew = merged.find((t) => t.status === 'NEW');
            speakNewOrder(latestNew?.tableCode);
          }
          setLastTicketCount(currentNewCount);

          return merged;
        });

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
  }, [stationFilter, speakerEnabled, lastTicketCount]);

  // Handle Receive / Pick Order (moves to ACCEPTED / PREPARING immediately with zero lag)
  const handleReceiveOrder = async (ticketId: string) => {
    setTickets((prev) => {
      const next = prev.map((t) => (t.id === ticketId ? { ...t, status: 'ACCEPTED' as const } : t));
      if (typeof window !== 'undefined') {
        localStorage.setItem('ithipooram_kds_tickets', JSON.stringify(next));
      }
      return next;
    });

    try {
      await fetch('/api/kitchen', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId, status: 'ACCEPTED' }),
      });
      fetchTickets();
    } catch (err) {
      console.error('Failed to receive order:', err);
    }
  };

  // Handle Mark as Served (moves to SERVED immediately with zero lag)
  const handleMarkServed = async (ticketId: string) => {
    setTickets((prev) => {
      const next = prev.map((t) => (t.id === ticketId ? { ...t, status: 'SERVED' as const } : t));
      if (typeof window !== 'undefined') {
        localStorage.setItem('ithipooram_kds_tickets', JSON.stringify(next));
      }
      return next;
    });

    try {
      await fetch('/api/kitchen', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId, status: 'SERVED' }),
      });
      fetchTickets();
    } catch (err) {
      console.error('Failed to mark served:', err);
    }
  };

  // Filtered ticket groups
  const newOrders = useMemo(() => {
    return tickets.filter(t => t.status === 'NEW');
  }, [tickets]);

  const workingOrders = useMemo(() => {
    return tickets.filter(t => t.status === 'ACCEPTED' || t.status === 'PREPARING' || t.status === 'READY');
  }, [tickets]);

  const servedOrders = useMemo(() => {
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
      
      {/* Top Header: Clean Left-Aligned Heading & Top Navigation */}
      <header className="bg-white border-b border-zinc-200 px-4 sm:px-6 py-3.5 sticky top-0 z-30 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 max-w-7xl mx-auto w-full">
          
          {/* Left: Heading Starts from Left Perfectly */}
          <div className="flex items-center space-x-3">
            <Link
              href="/"
              className="p-2 rounded-xl border border-zinc-200 hover:border-black text-zinc-600 hover:text-black transition"
              title="Back to Admin Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>

            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg sm:text-xl font-black text-black">
                  Kitchen Display System (KDS)
                </h1>
                <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Live Sync</span>
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-semibold">
                Live food preparation queue &amp; order dispatch terminal
              </p>
            </div>
          </div>

          {/* Right: The 3 Main Options + Station Filter + Speaker Button */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Exactly 3 Tab Options: New Orders to Receive, Working Orders, Served Ones */}
            <div className="inline-flex items-center p-1 bg-zinc-100 rounded-2xl text-xs font-bold text-zinc-600">
              <button
                onClick={() => setActiveTab('new')}
                className={`px-3.5 py-1.5 rounded-xl transition flex items-center space-x-1.5 cursor-pointer ${
                  activeTab === 'new'
                    ? 'bg-black text-white shadow-xs font-black'
                    : 'hover:text-black'
                }`}
              >
                <span>New Orders to Receive</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                  newOrders.length > 0 ? 'bg-amber-400 text-black animate-pulse' : 'bg-zinc-200 text-zinc-700'
                }`}>
                  {newOrders.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('working')}
                className={`px-3.5 py-1.5 rounded-xl transition flex items-center space-x-1.5 cursor-pointer ${
                  activeTab === 'working'
                    ? 'bg-black text-white shadow-xs font-black'
                    : 'hover:text-black'
                }`}
              >
                <span>Working Orders</span>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-zinc-200 text-zinc-700">
                  {workingOrders.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('served')}
                className={`px-3.5 py-1.5 rounded-xl transition flex items-center space-x-1.5 cursor-pointer ${
                  activeTab === 'served'
                    ? 'bg-black text-white shadow-xs font-black'
                    : 'hover:text-black'
                }`}
              >
                <span>Served Ones</span>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-zinc-200 text-zinc-700">
                  {servedOrders.length}
                </span>
              </button>
            </div>

            {/* Station Dropdown */}
            <select
              value={stationFilter}
              onChange={(e) => setStationFilter(e.target.value)}
              className="text-xs font-bold bg-zinc-100 border border-zinc-200 rounded-xl px-2.5 py-1.5 text-black outline-none focus:border-black"
            >
              <option value="ALL">All Stations</option>
              <option value="MAIN_KITCHEN">Meals &amp; Curry</option>
              <option value="SEAFOOD_FRY">Tawa &amp; Fry</option>
              <option value="BEVERAGE_COUNTER">Beverages</option>
            </select>

            {/* Automatic Speaker Option */}
            <button
              onClick={() => {
                const next = !speakerEnabled;
                setSpeakerEnabled(next);
                if (next) speakNewOrder();
              }}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer ${
                speakerEnabled
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  : 'bg-zinc-100 border-zinc-200 text-zinc-400'
              }`}
              title={speakerEnabled ? 'Auto-Speaker is ACTIVE (Calls out new orders)' : 'Speaker is MUTED'}
            >
              {speakerEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-600 animate-pulse" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span>{speakerEnabled ? 'Speaker: Auto Call' : 'Speaker: Off'}</span>
            </button>

            {/* Refresh Button */}
            <button
              onClick={fetchTickets}
              className="p-1.5 rounded-xl border border-zinc-200 hover:border-black text-zinc-600 transition cursor-pointer"
              title="Refresh"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </header>

      {/* Main Workspace with Generous Bottom Padding for Smooth Scrolling */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-36 sm:pb-32 overflow-y-auto">
        
        {/* OPTION 1: NEW ORDERS TO RECEIVE TAB */}
        {activeTab === 'new' && (
          <div>
            {newOrders.length === 0 ? (
              <div className="py-24 text-center space-y-3 bg-white rounded-3xl border border-zinc-200 shadow-xs max-w-xl mx-auto">
                <div className="w-16 h-16 rounded-2xl bg-zinc-100 text-zinc-400 mx-auto flex items-center justify-center">
                  <ChefHat className="w-8 h-8" />
                </div>
                <h3 className="text-base font-black text-black">No New Kitchen Orders</h3>
                <p className="text-xs text-zinc-400 font-semibold max-w-sm mx-auto">
                  When confirmed orders arrive from QR codes or manual billing, the speaker automatically calls them out and they appear here for receiving.
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

                    {/* Action: Receive Order / Start Cooking */}
                    <button
                      onClick={() => handleReceiveOrder(t.id)}
                      className="w-full py-3 rounded-2xl bg-black hover:bg-zinc-800 text-white font-black text-xs flex items-center justify-center space-x-2 shadow-xs transition active:scale-98 cursor-pointer"
                    >
                      <Flame className="w-4 h-4 text-orange-400" />
                      <span>Receive Order &amp; Cook</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* OPTION 2: WORKING ORDERS (COOKING) TAB */}
        {activeTab === 'working' && (
          <div>
            {workingOrders.length === 0 ? (
              <div className="py-24 text-center space-y-3 bg-white rounded-3xl border border-zinc-200 shadow-xs max-w-xl mx-auto">
                <div className="w-16 h-16 rounded-2xl bg-zinc-100 text-zinc-400 mx-auto flex items-center justify-center">
                  <Flame className="w-8 h-8 text-orange-400" />
                </div>
                <h3 className="text-base font-black text-black">No Orders Currently Cooking</h3>
                <p className="text-xs text-zinc-400 font-semibold max-w-sm mx-auto">
                  Receive orders from the New Orders tab to move them into active preparation.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {workingOrders.map((t) => (
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

                    {/* Action: Mark Served to Table */}
                    <button
                      onClick={() => handleMarkServed(t.id)}
                      className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center space-x-2 shadow-xs transition active:scale-98 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>Mark as Served to Table</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* OPTION 3: SERVED ONES TAB */}
        {activeTab === 'served' && (
          <div className="bg-white rounded-3xl border border-zinc-200 p-5 sm:p-6 shadow-xs max-w-4xl mx-auto">
            <h3 className="text-sm font-black text-black mb-4">Served Orders History</h3>
            {servedOrders.length === 0 ? (
              <p className="text-xs text-zinc-400">No dishes served yet today.</p>
            ) : (
              <div className="divide-y divide-zinc-100">
                {servedOrders.map((t) => (
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
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center space-x-1">
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span>Served</span>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}
