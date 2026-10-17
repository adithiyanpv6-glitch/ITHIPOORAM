'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { 
  UtensilsCrossed, 
  ShoppingBag, 
  Plus, 
  Minus, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Fish, 
  Flame, 
  Leaf, 
  Sparkles,
  ArrowRight,
  RefreshCw,
  X,
  ChefHat
} from 'lucide-react';
import { apiRequest } from '../../../../lib/api';
import { getSocket } from '../../../../lib/socket';

interface MenuItem {
  id: string;
  name: string;
  malayalamName?: string;
  description?: string;
  pricePaise: number;
  dietary: 'VEG' | 'NON_VEG' | 'SEAFOOD';
  imageUrl?: string;
  isAvailable: boolean;
  currentStock: number | null;
}

interface MenuCategory {
  id: string;
  name: string;
  malayalamName?: string;
  slug: string;
  items: MenuItem[];
}

interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  notes: string;
}

export default function CustomerOrderPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const tableCode = String(params.tableCode || '').toUpperCase();
  const token = searchParams.get('token');

  // State
  const [isValidating, setIsValidating] = useState(true);
  const [tableData, setTableData] = useState<any>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [loadingMenu, setLoadingMenu] = useState(true);

  // Cart
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [customerNotes, setCustomerNotes] = useState('');
  const [orderError, setOrderError] = useState<string | null>(null);

  // Completed / Active Order state
  const [latestOrder, setLatestOrder] = useState<any>(null);
  const [tableOrders, setTableOrders] = useState<any[]>([]);

  // 1. Validate QR Token on server
  useEffect(() => {
    async function validate() {
      if (!tableCode) {
        setValidationError('Invalid table URL. No table code detected.');
        setIsValidating(false);
        return;
      }

      try {
        setIsValidating(true);
        // If testing without token in dev, fetch table token
        let qrToken = token;
        if (!qrToken) {
          // Check if table exists
          const res = await apiRequest(`/tables/validate-token?tableCode=${tableCode}&token=lookup_attempt`).catch(async () => {
            // Fetch first table token for direct URL test convenience
            const qrAsset = await apiRequest(`/tables/${tableCode}/qr`).catch(() => null);
            return qrAsset ? { valid: true, table: { tableCode, displayName: qrAsset.displayName }, token: qrAsset.qrToken } : null;
          });

          if (res?.valid) {
            setTableData(res.table);
            setIsValidating(false);
            return;
          }
          setValidationError('Please scan the official QR code printed at your table to order.');
          setIsValidating(false);
          return;
        }

        const res = await apiRequest(`/tables/validate-token?tableCode=${tableCode}&token=${qrToken}`);
        if (res.valid) {
          setTableData(res.table);
        } else {
          setValidationError(res.error || 'Invalid or expired QR token.');
        }
      } catch (err: any) {
        setValidationError(err.message || 'QR code validation failed. Please contact the counter.');
      } finally {
        setIsValidating(false);
      }
    }

    validate();
  }, [tableCode, token]);

  // 2. Load today's menu
  const fetchMenu = async () => {
    try {
      setLoadingMenu(true);
      const data = await apiRequest<MenuCategory[]>('/menu/today');
      setCategories(data);
    } catch (err) {
      console.error('Failed to load menu:', err);
    } finally {
      setLoadingMenu(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  // 3. Setup WebSockets for live table order status
  useEffect(() => {
    if (!tableCode) return;
    const socket = getSocket();
    socket.emit('join:table', tableCode);

    socket.on('order:created', (newOrder: any) => {
      if (newOrder.table?.tableCode === tableCode) {
        setTableOrders((prev) => [newOrder, ...prev.filter((o) => o.id !== newOrder.id)]);
      }
    });

    socket.on('order:status_updated', (data: { order: any; change: any }) => {
      if (data.order?.table?.tableCode === tableCode) {
        setLatestOrder((prev: any) => (prev?.id === data.order.id ? data.order : prev));
        setTableOrders((prev) =>
          prev.map((o) => (o.id === data.order.id ? data.order : o))
        );
      }
    });

    socket.on('order:paid', (data: { order: any }) => {
      if (data.order?.table?.tableCode === tableCode) {
        setTableOrders((prev) =>
          prev.map((o) => (o.id === data.order.id ? data.order : o))
        );
      }
    });

    socket.on('menu:updated', () => {
      fetchMenu();
    });

    return () => {
      socket.off('order:created');
      socket.off('order:status_updated');
      socket.off('order:paid');
      socket.off('menu:updated');
    };
  }, [tableCode]);

  // Cart operations
  const addToCart = (item: MenuItem) => {
    if (!item.isAvailable) return;
    setCart((prev) => {
      const idx = prev.findIndex((c) => c.menuItem.id === item.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx].quantity += 1;
        return next;
      }
      return [...prev, { menuItem: item, quantity: 1, notes: '' }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => {
      const idx = prev.findIndex((c) => c.menuItem.id === itemId);
      if (idx < 0) return prev;
      if (prev[idx].quantity > 1) {
        const next = [...prev];
        next[idx].quantity -= 1;
        return next;
      }
      return prev.filter((c) => c.menuItem.id !== itemId);
    });
  };

  const updateItemNotes = (itemId: string, notes: string) => {
    setCart((prev) =>
      prev.map((c) => (c.menuItem.id === itemId ? { ...c, notes } : c))
    );
  };

  // Calculations
  const subtotalPaise = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.menuItem.pricePaise * item.quantity, 0);
  }, [cart]);

  // 5% GST (2.5% CGST + 2.5% SGST)
  const cgstPaise = Math.round((subtotalPaise * 2.5) / 100);
  const sgstPaise = Math.round((subtotalPaise * 2.5) / 100);
  const totalTaxPaise = cgstPaise + sgstPaise;
  const grandTotalPaise = subtotalPaise + totalTaxPaise;

  const totalCartCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  // Submit Order with Idempotency Key
  const handlePlaceOrder = async () => {
    if (cart.length === 0 || isPlacingOrder) return;

    try {
      setIsPlacingOrder(true);
      setOrderError(null);

      // Unique idempotency key per submission attempt
      const idempotencyKey = `idem_${tableCode}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

      const payload = {
        tableCode,
        qrToken: token || tableData?.qrToken || 'auto_session',
        items: cart.map((c) => ({
          menuItemId: c.menuItem.id,
          quantity: c.quantity,
          itemNotes: c.notes ? c.notes.trim() : undefined,
        })),
        customerNotes: customerNotes ? customerNotes.trim() : undefined,
        idempotencyKey,
      };

      const res = await apiRequest('/orders', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      // Clear cart on success
      setCart([]);
      setIsCartOpen(false);
      setLatestOrder(res.order);
      setTableOrders((prev) => [res.order, ...prev]);
    } catch (err: any) {
      setOrderError(err.message || 'Failed to place order. Please try again or call staff.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  // Filter items by category
  const filteredItems = useMemo(() => {
    if (activeCategory === 'all') {
      return categories.flatMap((c) => c.items);
    }
    const cat = categories.find((c) => c.slug === activeCategory);
    return cat ? cat.items : [];
  }, [categories, activeCategory]);

  // Formatting helpers
  const formatRupees = (paise: number) => `₹${(paise / 100).toFixed(2)}`;

  // Loading state
  if (isValidating) {
    return (
      <div className="min-h-screen bg-parchment-50 flex items-center justify-center p-4">
        <div className="text-center max-w-sm bg-white p-8 rounded-2xl shadow-sm border border-parchment-200">
          <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-lg font-bold text-slatepos-900">Verifying Table QR...</h2>
          <p className="text-xs text-slatepos-500 mt-1">Connecting to Ithi Pooram kitchen session</p>
        </div>
      </div>
    );
  }

  // Error state (Invalid or tampered QR)
  if (validationError) {
    return (
      <div className="min-h-screen bg-parchment-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md bg-white p-8 rounded-2xl shadow-sm border border-red-200">
          <div className="w-14 h-14 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slatepos-950 mb-2">Invalid Table Link</h2>
          <p className="text-sm text-slatepos-600 mb-6">{validationError}</p>
          <div className="bg-parchment-50 p-4 rounded-xl border border-parchment-200 text-xs text-slatepos-700 text-left mb-6">
            <p className="font-semibold mb-1">How to Order:</p>
            <ol className="list-decimal list-inside space-y-1 text-slatepos-600">
              <li>Locate the permanent acrylic QR stand on your dining table.</li>
              <li>Open your phone camera or Google Lens and scan the code.</li>
              <li>Do not use old saved bookmarks or shared links.</li>
            </ol>
          </div>
          <p className="text-xs text-slatepos-400">Need assistance? Please contact our counter staff.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-parchment-50 pb-28">
      {/* Top Banner / Table Header */}
      <header className="bg-white border-b border-parchment-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-brand-600 flex items-center justify-center text-white font-bold text-xl shadow-xs">
              ഇ
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-slatepos-900 tracking-tight text-base font-sans">
                  ITHI POORAM
                </span>
                <span className="text-[10px] font-bold bg-brand-50 text-brand-700 px-1.5 py-0.5 rounded border border-brand-200">
                  ഇത്തിപ്പൂരം
                </span>
              </div>
              {/* Permanent Table Identifier */}
              <div className="flex items-center space-x-1.5 text-xs text-slatepos-600">
                <span className="font-semibold text-slatepos-900">
                  {tableData?.displayName || `Table ${tableCode}`}
                </span>
                <span className="inline-block w-1 h-1 rounded-full bg-slatepos-300"></span>
                <span className="font-mono font-bold text-brand-700 bg-brand-50 px-1.5 py-0.2 rounded text-[11px]">
                  {tableCode}
                </span>
              </div>
            </div>
          </div>

          {/* Table Verification Pill (Strictly no ability to change table) */}
          <div className="flex items-center space-x-2">
            <div className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-semibold flex items-center border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mr-1.5 animate-pulse"></span>
              <span>Table Verified</span>
            </div>
          </div>
        </div>

        {/* Category Navigation Tabs */}
        <div className="max-w-3xl mx-auto px-4 overflow-x-auto no-scrollbar flex space-x-2 py-2 border-t border-parchment-100">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${
              activeCategory === 'all'
                ? 'bg-slatepos-900 text-white shadow-xs'
                : 'bg-parchment-100 text-slatepos-700 hover:bg-parchment-200'
            }`}
          >
            All Today&apos;s Specials
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.slug)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                activeCategory === cat.slug
                  ? 'bg-slatepos-900 text-white shadow-xs'
                  : 'bg-parchment-100 text-slatepos-700 hover:bg-parchment-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-3xl mx-auto px-4 py-4">
        {/* Latest Active Order Status Card (If customer just ordered) */}
        {latestOrder && (
          <div className="mb-6 bg-white rounded-2xl p-5 border border-brand-200 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-parchment-200">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slatepos-400">
                  Current Table Order
                </span>
                <div className="text-xl font-black text-slatepos-900 font-mono">
                  {latestOrder.customerCode}
                </div>
              </div>
              <div className="text-right">
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-extrabold tracking-wide uppercase ${
                    latestOrder.fulfillmentStatus === 'READY'
                      ? 'bg-emerald-100 text-emerald-800'
                      : latestOrder.fulfillmentStatus === 'PREPARING'
                      ? 'bg-amber-100 text-amber-800'
                      : latestOrder.fulfillmentStatus === 'ACCEPTED'
                      ? 'bg-blue-100 text-blue-800'
                      : latestOrder.fulfillmentStatus === 'SERVED'
                      ? 'bg-slatepos-100 text-slatepos-700'
                      : 'bg-brand-100 text-brand-800'
                  }`}
                >
                  {latestOrder.fulfillmentStatus === 'NEW' && 'Sent to Kitchen'}
                  {latestOrder.fulfillmentStatus === 'ACCEPTED' && 'Chef Accepted'}
                  {latestOrder.fulfillmentStatus === 'PREPARING' && 'On the Tawa / Pan'}
                  {latestOrder.fulfillmentStatus === 'READY' && 'Sizzling Hot & Ready!'}
                  {latestOrder.fulfillmentStatus === 'SERVED' && 'Served'}
                  {latestOrder.fulfillmentStatus === 'CANCELLED' && 'Cancelled'}
                </span>
                <div className="text-[11px] text-slatepos-500 mt-0.5">
                  Total: {formatRupees(latestOrder.grandTotalPaise)}
                </div>
              </div>
            </div>

            {/* Stepper */}
            <div className="mt-4 flex items-center justify-between text-xs text-slatepos-600">
              <div className="flex flex-col items-center">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs mb-1 ${
                    latestOrder.fulfillmentStatus !== 'CANCELLED'
                      ? 'bg-brand-600 text-white'
                      : 'bg-slatepos-200 text-slatepos-500'
                  }`}
                >
                  ✓
                </div>
                <span className="text-[10px]">Received</span>
              </div>
              <div className="h-0.5 flex-1 bg-parchment-300 mx-1"></div>
              <div className="flex flex-col items-center">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs mb-1 ${
                    ['ACCEPTED', 'PREPARING', 'READY', 'SERVED'].includes(latestOrder.fulfillmentStatus)
                      ? 'bg-brand-600 text-white'
                      : 'bg-parchment-200 text-slatepos-400'
                  }`}
                >
                  2
                </div>
                <span className="text-[10px]">Accepted</span>
              </div>
              <div className="h-0.5 flex-1 bg-parchment-300 mx-1"></div>
              <div className="flex flex-col items-center">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs mb-1 ${
                    ['PREPARING', 'READY', 'SERVED'].includes(latestOrder.fulfillmentStatus)
                      ? 'bg-brand-600 text-white'
                      : 'bg-parchment-200 text-slatepos-400'
                  }`}
                >
                  3
                </div>
                <span className="text-[10px]">Cooking</span>
              </div>
              <div className="h-0.5 flex-1 bg-parchment-300 mx-1"></div>
              <div className="flex flex-col items-center">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs mb-1 ${
                    ['READY', 'SERVED'].includes(latestOrder.fulfillmentStatus)
                      ? 'bg-emerald-600 text-white'
                      : 'bg-parchment-200 text-slatepos-400'
                  }`}
                >
                  4
                </div>
                <span className="text-[10px]">Ready</span>
              </div>
            </div>

            <p className="mt-4 text-xs text-slatepos-500 bg-parchment-50 p-2.5 rounded-lg border border-parchment-200 text-center">
              Need help? Please visit the billing counter and quote Table Code{' '}
              <strong className="text-slatepos-900 font-mono">{tableCode}</strong>.
            </p>
          </div>
        )}

        {/* Menu Items List */}
        <div className="space-y-3">
          {loadingMenu ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-xs text-slatepos-500">Loading today&apos;s fresh menu...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-parchment-200">
              <UtensilsCrossed className="w-10 h-10 text-slatepos-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slatepos-700">No items available in this category</p>
            </div>
          ) : (
            filteredItems.map((item) => {
              const inCart = cart.find((c) => c.menuItem.id === item.id);
              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-2xl p-4 border transition ${
                    item.isAvailable
                      ? 'border-parchment-200 hover:border-parchment-300 shadow-2xs'
                      : 'border-slatepos-200 opacity-60 bg-slatepos-50'
                  }`}
                >
                  <div className="flex items-start justify-between space-x-3">
                    <div className="flex-1">
                      {/* Dietary & Category Indicator */}
                      <div className="flex items-center space-x-2 mb-1">
                        {item.dietary === 'VEG' && (
                          <span className="w-3.5 h-3.5 border border-emerald-600 rounded-sm flex items-center justify-center">
                            <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full"></span>
                          </span>
                        )}
                        {item.dietary === 'NON_VEG' && (
                          <span className="w-3.5 h-3.5 border border-red-600 rounded-sm flex items-center justify-center">
                            <span className="w-1.5 h-1.5 bg-red-600 rounded-full"></span>
                          </span>
                        )}
                        {item.dietary === 'SEAFOOD' && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-cyan-50 text-cyan-800 border border-cyan-200 flex items-center">
                            <Fish className="w-2.5 h-2.5 mr-1 text-cyan-700" />
                            Fresh Seafood
                          </span>
                        )}
                      </div>

                      {/* Item Title & Malayalam Subheading */}
                      <h3 className="text-sm font-bold text-slatepos-950 leading-tight">
                        {item.name}
                      </h3>
                      {item.malayalamName && (
                        <p className="text-xs font-medium text-brand-700 font-malayalam mt-0.5">
                          {item.malayalamName}
                        </p>
                      )}

                      {/* Description */}
                      {item.description && (
                        <p className="text-xs text-slatepos-500 mt-1 line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>
                      )}

                      {/* Price & Stock info */}
                      <div className="mt-2.5 flex items-center space-x-2">
                        <span className="text-sm font-extrabold text-slatepos-900">
                          {formatRupees(item.pricePaise)}
                        </span>
                        {item.currentStock !== null && item.currentStock <= 10 && item.isAvailable && (
                          <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                            Only {item.currentStock} left
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Controls */}
                    <div className="flex flex-col items-end justify-between self-stretch">
                      {!item.isAvailable ? (
                        <span className="px-2.5 py-1 text-xs font-semibold text-slatepos-500 bg-slatepos-200 rounded-lg">
                          Sold Out
                        </span>
                      ) : inCart ? (
                        <div className="flex items-center space-x-2 bg-brand-50 border border-brand-200 rounded-xl p-1">
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="w-7 h-7 rounded-lg bg-white text-brand-700 flex items-center justify-center font-bold shadow-2xs hover:bg-brand-100 transition"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-5 text-center text-xs font-bold text-brand-950">
                            {inCart.quantity}
                          </span>
                          <button
                            onClick={() => addToCart(item)}
                            className="w-7 h-7 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold shadow-2xs hover:bg-brand-700 transition"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => addToCart(item)}
                          className="px-4 py-2 rounded-xl text-xs font-bold text-brand-700 bg-brand-50 hover:bg-brand-600 hover:text-white border border-brand-200 transition shadow-2xs"
                        >
                          ADD
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* Floating Bottom Cart Bar */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-parchment-200 p-4 shadow-lg">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <div>
              <div className="text-xs text-slatepos-500 font-medium">
                {totalCartCount} item{totalCartCount > 1 ? 's' : ''} in cart
              </div>
              <div className="text-base font-extrabold text-slatepos-900">
                {formatRupees(grandTotalPaise)}{' '}
                <span className="text-[11px] font-normal text-slatepos-500">incl. 5% GST</span>
              </div>
            </div>

            <button
              onClick={() => setIsCartOpen(true)}
              className="px-6 py-3 rounded-xl font-bold text-sm text-white bg-brand-600 hover:bg-brand-700 flex items-center space-x-2 shadow-md shadow-brand-900/10 transition active:scale-98"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Review Cart & Order</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Cart Modal / Review Sheet */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-200">
            {/* Sheet Header */}
            <div className="p-4 border-b border-parchment-200 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slatepos-950">Review Your Order</h3>
                <p className="text-xs text-brand-700 font-semibold">
                  Ordering for {tableData?.displayName || `Table ${tableCode}`}
                </p>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="w-8 h-8 rounded-full bg-slatepos-100 text-slatepos-600 flex items-center justify-center hover:bg-slatepos-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="p-4 overflow-y-auto flex-1 space-y-3">
              {orderError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{orderError}</span>
                </div>
              )}

              {cart.map((c) => (
                <div
                  key={c.menuItem.id}
                  className="bg-parchment-50 p-3 rounded-xl border border-parchment-200 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slatepos-900">{c.menuItem.name}</h4>
                      <p className="text-[11px] text-slatepos-500 font-medium">
                        {formatRupees(c.menuItem.pricePaise)} each
                      </p>
                    </div>

                    <div className="flex items-center space-x-2 bg-white border border-parchment-300 rounded-lg p-1">
                      <button
                        onClick={() => removeFromCart(c.menuItem.id)}
                        className="w-6 h-6 rounded bg-slatepos-100 flex items-center justify-center text-slatepos-700 hover:bg-slatepos-200"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-5 text-center text-xs font-bold text-slatepos-900">
                        {c.quantity}
                      </span>
                      <button
                        onClick={() => addToCart(c.menuItem)}
                        className="w-6 h-6 rounded bg-brand-600 text-white flex items-center justify-center hover:bg-brand-700"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Special instruction notes */}
                  <input
                    type="text"
                    value={c.notes}
                    onChange={(e) => updateItemNotes(c.menuItem.id, e.target.value)}
                    placeholder="Preparation note (e.g. Less spicy, no onion)"
                    className="w-full text-[11px] px-2.5 py-1.5 rounded-lg border border-parchment-200 bg-white focus:outline-none focus:border-brand-500 text-slatepos-800 placeholder:text-slatepos-400"
                  />
                </div>
              ))}

              {/* Kitchen Note */}
              <div className="mt-3">
                <label className="block text-xs font-semibold text-slatepos-700 mb-1">
                  Overall Table Notes (Optional)
                </label>
                <textarea
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  placeholder="Any special instructions for the kitchen..."
                  rows={2}
                  className="w-full text-xs p-2.5 rounded-xl border border-parchment-200 bg-white focus:outline-none focus:border-brand-500 text-slatepos-800 placeholder:text-slatepos-400"
                ></textarea>
              </div>

              {/* Bill Estimate Breakup */}
              <div className="pt-3 border-t border-parchment-200 space-y-1.5 text-xs text-slatepos-600">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-slatepos-900">{formatRupees(subtotalPaise)}</span>
                </div>
                <div className="flex justify-between text-slatepos-500 text-[11px]">
                  <span>CGST (2.5%):</span>
                  <span>{formatRupees(cgstPaise)}</span>
                </div>
                <div className="flex justify-between text-slatepos-500 text-[11px]">
                  <span>SGST (2.5%):</span>
                  <span>{formatRupees(sgstPaise)}</span>
                </div>
                <div className="flex justify-between text-sm font-extrabold text-slatepos-950 pt-1 border-t border-parchment-200">
                  <span>Estimated Total:</span>
                  <span>{formatRupees(grandTotalPaise)}</span>
                </div>
              </div>
            </div>

            {/* Submit Action */}
            <div className="p-4 border-t border-parchment-200 bg-parchment-50">
              <button
                disabled={isPlacingOrder || cart.length === 0}
                onClick={handlePlaceOrder}
                className="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-md shadow-brand-900/10 transition"
              >
                {isPlacingOrder ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Sending to Kitchen...</span>
                  </>
                ) : (
                  <>
                    <ChefHat className="w-4 h-4" />
                    <span>Confirm & Send to Kitchen ({formatRupees(grandTotalPaise)})</span>
                  </>
                )}
              </button>
              <p className="text-[10px] text-center text-slatepos-400 mt-2">
                Order will be transmitted instantly to the kitchen display screen.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
