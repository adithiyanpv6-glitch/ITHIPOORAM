'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  ChefHat, 
  Clock, 
  Volume2, 
  VolumeX, 
  Wifi, 
  WifiOff, 
  CheckCircle2, 
  Flame, 
  AlertTriangle, 
  XCircle, 
  ArrowRight,
  Filter,
  RefreshCw,
  LogOut
} from 'lucide-react';
import { apiRequest, getCurrentUser, clearAuthToken } from '../../lib/api';
import { getSocket } from '../../lib/socket';
import { playOrderChime } from '../../lib/sound';

interface KitchenOrder {
  id: string;
  internalId: string;
  customerCode: string;
  table: {
    tableCode: string;
    displayName: string;
  };
  fulfillmentStatus: 'NEW' | 'ACCEPTED' | 'PREPARING' | 'READY' | 'SERVED' | 'CANCELLED';
  customerNotes?: string | null;
  items: Array<{
    id: string;
    itemNameSnapshot: string;
    quantity: number;
    itemNotes?: string | null;
  }>;
  createdAt: string;
  station?: {
    id: string;
    code: string;
    name: string;
  };
}

export default function KitchenDisplayPage() {
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [stationFilter, setStationFilter] = useState<string>('ALL');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Cancellation modal
  const [cancelModalOrder, setCancelModalOrder] = useState<KitchenOrder | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  // Current time ticker for elapsed order timers
  const [now, setNow] = useState<number>(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(timer);
  }, []);

  // Fetch active kitchen orders
  const loadActiveOrders = async () => {
    try {
      setLoading(true);
      const data = await apiRequest<KitchenOrder[]>('/kitchen/active');
      setOrders(data);
      setIsOnline(true);
    } catch (err) {
      console.error('Failed to load active kitchen orders:', err);
      setIsOnline(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setUser(getCurrentUser());
    loadActiveOrders();

    // Sockets
    const socket = getSocket();
    socket.emit('join:kitchen');

    socket.on('connect', () => setIsOnline(true));
    socket.on('disconnect', () => setIsOnline(false));

    socket.on('order:created', (newOrder: KitchenOrder) => {
      setOrders((prev) => {
        if (prev.some((o) => o.id === newOrder.id)) return prev;
        return [newOrder, ...prev];
      });
      if (soundEnabled) {
        playOrderChime();
      }
    });

    socket.on('order:status_updated', (data: { order: KitchenOrder }) => {
      setOrders((prev) => {
        // If served or cancelled, remove after brief grace or immediately
        if (data.order.fulfillmentStatus === 'SERVED' || data.order.fulfillmentStatus === 'CANCELLED') {
          return prev.filter((o) => o.id !== data.order.id);
        }
        return prev.map((o) => (o.id === data.order.id ? data.order : o));
      });
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('order:created');
      socket.off('order:status_updated');
    };
  }, [soundEnabled]);

  // Update status bump
  const handleUpdateStatus = async (orderId: string, nextStatus: string) => {
    try {
      await apiRequest(`/kitchen/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      });
    } catch (err: any) {
      alert(err.message || 'Failed to update order status');
    }
  };

  // Submit cancellation
  const handleConfirmCancel = async () => {
    if (!cancelModalOrder || !cancelReason.trim()) return;

    try {
      setIsCancelling(true);
      await apiRequest(`/kitchen/orders/${cancelModalOrder.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'CANCELLED',
          reason: cancelReason.trim(),
        }),
      });
      setCancelModalOrder(null);
      setCancelReason('');
    } catch (err: any) {
      alert(err.message || 'Failed to cancel order');
    } finally {
      setIsCancelling(false);
    }
  };

  // Filtered orders
  const filteredOrders = useMemo(() => {
    if (stationFilter === 'ALL') return orders;
    return orders.filter((o) => o.station?.code === stationFilter);
  }, [orders, stationFilter]);

  // Elapsed time calculation
  const getElapsedMinutes = (createdAt: string) => {
    const elapsedMs = now - new Date(createdAt).getTime();
    return Math.max(0, Math.floor(elapsedMs / (1000 * 60)));
  };

  return (
    <div className="min-h-screen bg-slatepos-950 text-slatepos-100 flex flex-col font-sans select-none">
      {/* KDS Top Bar */}
      <header className="bg-slatepos-900 border-b border-slatepos-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white font-bold shadow-md">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold tracking-tight text-white">
                KITCHEN DISPLAY (KDS)
              </h1>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-brand-900/60 text-brand-300 border border-brand-700">
                ഇത്തിപ്പൂരം
              </span>
            </div>
            <p className="text-xs text-slatepos-400">
              Station Display • Android Tablet Ready
            </p>
          </div>
        </div>

        {/* Station Filters */}
        <div className="flex items-center space-x-2 bg-slatepos-950 p-1 rounded-xl border border-slatepos-800">
          <button
            onClick={() => setStationFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              stationFilter === 'ALL'
                ? 'bg-brand-600 text-white shadow-xs'
                : 'text-slatepos-400 hover:text-white'
            }`}
          >
            All Stations ({orders.length})
          </button>
          <button
            onClick={() => setStationFilter('MAIN_KITCHEN')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              stationFilter === 'MAIN_KITCHEN'
                ? 'bg-brand-600 text-white shadow-xs'
                : 'text-slatepos-400 hover:text-white'
            }`}
          >
            Main Meals
          </button>
          <button
            onClick={() => setStationFilter('SEAFOOD_FRY')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              stationFilter === 'SEAFOOD_FRY'
                ? 'bg-brand-600 text-white shadow-xs'
                : 'text-slatepos-400 hover:text-white'
            }`}
          >
            Tawa & Fry
          </button>
          <button
            onClick={() => setStationFilter('BEVERAGE_COUNTER')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              stationFilter === 'BEVERAGE_COUNTER'
                ? 'bg-brand-600 text-white shadow-xs'
                : 'text-slatepos-400 hover:text-white'
            }`}
          >
            Drinks & Dessert
          </button>
        </div>

        {/* Audio, Network Status & Reload */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl border text-xs font-semibold flex items-center space-x-1.5 transition ${
              soundEnabled
                ? 'bg-emerald-950/60 border-emerald-700 text-emerald-400'
                : 'bg-slatepos-800 border-slatepos-700 text-slatepos-400'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden sm:inline">{soundEnabled ? 'Chime ON' : 'Muted'}</span>
          </button>

          <div
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center space-x-1.5 ${
              isOnline
                ? 'bg-emerald-950/60 border-emerald-700 text-emerald-400'
                : 'bg-red-950/60 border-red-700 text-red-400 animate-pulse'
            }`}
          >
            {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            <span>{isOnline ? 'Online' : 'Reconnecting...'}</span>
          </div>

          <button
            onClick={loadActiveOrders}
            className="p-2 rounded-xl bg-slatepos-800 hover:bg-slatepos-700 text-slatepos-300"
            title="Refresh order queue"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <Link
            href="/login"
            className="p-2 rounded-xl bg-slatepos-800 hover:bg-red-900/40 text-slatepos-400 hover:text-red-300"
            title="Switch User / Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* Main KDS Grid */}
      <main className="flex-1 p-6 overflow-y-auto">
        {loading && orders.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-sm font-semibold text-slatepos-400">Loading active kitchen tickets...</p>
            </div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="h-96 flex flex-col items-center justify-center text-center bg-slatepos-900/50 rounded-3xl border border-slatepos-800 p-8">
            <CheckCircle2 className="w-16 h-16 text-emerald-500/40 mb-3" />
            <h2 className="text-xl font-bold text-white">All Clear, Chef!</h2>
            <p className="text-sm text-slatepos-400 mt-1">
              No orders waiting in this station queue right now.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredOrders.map((order) => {
              const elapsedMins = getElapsedMinutes(order.createdAt);
              const isUrgent = elapsedMins >= 25;
              const isWarning = elapsedMins >= 15 && elapsedMins < 25;
              const isNew = order.fulfillmentStatus === 'NEW';

              return (
                <div
                  key={order.id}
                  className={`flex flex-col justify-between rounded-2xl bg-slatepos-900 border overflow-hidden shadow-lg transition-all ${
                    isNew
                      ? 'border-brand-500 ring-2 ring-brand-500/40'
                      : isUrgent
                      ? 'border-red-600 ring-1 ring-red-600/30'
                      : isWarning
                      ? 'border-amber-600'
                      : 'border-slatepos-800'
                  }`}
                >
                  {/* Ticket Header */}
                  <div
                    className={`px-4 py-3 flex items-center justify-between border-b ${
                      isNew
                        ? 'bg-brand-950/80 border-brand-800/80 text-brand-200'
                        : isUrgent
                        ? 'bg-red-950/80 border-red-800/80 text-red-200'
                        : 'bg-slatepos-850 border-slatepos-800 text-slatepos-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xl font-black font-mono tracking-tight text-white">
                          {order.table.tableCode}
                        </span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slatepos-950/80 text-slatepos-300 font-mono">
                          {order.customerCode}
                        </span>
                      </div>
                      <p className="text-[11px] text-slatepos-400 truncate max-w-[150px]">
                        {order.table.displayName}
                      </p>
                    </div>

                    <div className="text-right">
                      <div
                        className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-extrabold ${
                          isUrgent
                            ? 'bg-red-900 text-red-200 animate-pulse'
                            : isWarning
                            ? 'bg-amber-900/80 text-amber-200'
                            : 'bg-slatepos-800 text-slatepos-300'
                        }`}
                      >
                        <Clock className="w-3 h-3" />
                        <span>{elapsedMins}m ago</span>
                      </div>
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="p-4 flex-1 space-y-3">
                    {order.customerNotes && (
                      <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-800/60 text-xs text-amber-300">
                        <span className="font-bold">Table Note:</span> {order.customerNotes}
                      </div>
                    )}

                    <div className="space-y-2.5 divide-y divide-slatepos-800/60">
                      {order.items.map((it) => (
                        <div key={it.id} className="pt-2.5 first:pt-0 flex items-start justify-between">
                          <div className="flex-1 pr-2">
                            <span className="text-sm font-bold text-white leading-snug">
                              {it.itemNameSnapshot}
                            </span>
                            {it.itemNotes && (
                              <p className="text-xs text-brand-400 font-semibold mt-0.5">
                                Note: &ldquo;{it.itemNotes}&rdquo;
                              </p>
                            )}
                          </div>
                          <span className="w-8 h-8 rounded-lg bg-slatepos-800 border border-slatepos-700 flex items-center justify-center text-sm font-black text-white flex-shrink-0">
                            {it.quantity}x
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Workflow Button Footer */}
                  <div className="p-3 bg-slatepos-950/60 border-t border-slatepos-800 flex items-center space-x-2">
                    {/* Status Bump Buttons */}
                    {order.fulfillmentStatus === 'NEW' && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'ACCEPTED')}
                        className="flex-1 py-3 px-3 rounded-xl font-bold text-xs bg-brand-600 hover:bg-brand-500 text-white shadow-md transition active:scale-98"
                      >
                        Accept Ticket
                      </button>
                    )}

                    {order.fulfillmentStatus === 'ACCEPTED' && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'PREPARING')}
                        className="flex-1 py-3 px-3 rounded-xl font-bold text-xs bg-amber-600 hover:bg-amber-500 text-white shadow-md transition active:scale-98 flex items-center justify-center space-x-1"
                      >
                        <Flame className="w-3.5 h-3.5" />
                        <span>Start Cooking</span>
                      </button>
                    )}

                    {order.fulfillmentStatus === 'PREPARING' && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'READY')}
                        className="flex-1 py-3 px-3 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition active:scale-98 flex items-center justify-center space-x-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Mark Ready</span>
                      </button>
                    )}

                    {order.fulfillmentStatus === 'READY' && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'SERVED')}
                        className="flex-1 py-3 px-3 rounded-xl font-bold text-xs bg-slatepos-700 hover:bg-slatepos-600 text-white shadow-md transition active:scale-98 flex items-center justify-center space-x-1"
                      >
                        <span>Mark Served (Done)</span>
                      </button>
                    )}

                    {/* Cancel Button */}
                    <button
                      onClick={() => {
                        setCancelModalOrder(order);
                        setCancelReason('');
                      }}
                      className="p-3 rounded-xl bg-slatepos-800 hover:bg-red-950/50 hover:text-red-400 text-slatepos-400 transition"
                      title="Cancel Order"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Cancellation Modal with Mandatory Reason */}
      {cancelModalOrder && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slatepos-900 border border-slatepos-700 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <span>Cancel Order {cancelModalOrder.customerCode}?</span>
            </h3>
            <p className="text-xs text-slatepos-400 mt-1">
              Table: {cancelModalOrder.table.tableCode} ({cancelModalOrder.table.displayName}).
              A cancellation reason is strictly required for the audit log.
            </p>

            <div className="mt-4">
              <label className="block text-xs font-semibold text-slatepos-300 mb-1">
                Reason for Cancellation:
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g., Customer requested change, fish out of stock, guest left..."
                rows={3}
                className="w-full text-xs p-3 rounded-xl bg-slatepos-950 border border-slatepos-700 text-white placeholder:text-slatepos-500 focus:outline-none focus:border-red-500"
              ></textarea>
            </div>

            <div className="mt-6 flex space-x-3">
              <button
                disabled={isCancelling}
                onClick={() => setCancelModalOrder(null)}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-slatepos-800 hover:bg-slatepos-700 text-slatepos-300"
              >
                Go Back
              </button>
              <button
                disabled={isCancelling || !cancelReason.trim()}
                onClick={handleConfirmCancel}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white flex items-center justify-center space-x-1"
              >
                {isCancelling ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
