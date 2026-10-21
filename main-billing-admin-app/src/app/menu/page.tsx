'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  UtensilsCrossed, 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  Edit3, 
  RefreshCw,
  Plus,
  Minus
} from 'lucide-react';
import { apiRequest, getCurrentUser } from '../../lib/api';

export default function MenuManagerPage() {
  const router = useRouter();

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [priceEditItem, setPriceEditItem] = useState<any | null>(null);
  const [newPriceRupees, setNewPriceRupees] = useState('');
  const [priceChangeReason, setPriceChangeReason] = useState('');

  const loadMenu = async () => {
    try {
      setLoading(true);
      const data = await apiRequest('/menu/staff');
      setCategories(data);
    } catch (err) {
      console.error('Failed to load menu:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!getCurrentUser()) {
      router.replace('/login');
      return;
    }
    loadMenu();
  }, [router]);

  const handleToggleAvailability = async (item: any) => {
    try {
      await apiRequest(`/menu/items/${item.id}/availability`, {
        method: 'PATCH',
        body: JSON.stringify({ isAvailable: !item.isAvailable }),
      });
      loadMenu();
    } catch (err: any) {
      alert(err.message || 'Failed to update');
    }
  };

  const handleStockAdjustment = async (item: any, delta: number) => {
    try {
      const nextStock = Math.max(0, (item.currentStock || 0) + delta);
      await apiRequest(`/menu/items/${item.id}/availability`, {
        method: 'PATCH',
        body: JSON.stringify({ currentStock: nextStock, isAvailable: nextStock > 0 }),
      });
      loadMenu();
    } catch (err: any) {
      alert(err.message || 'Failed to adjust stock');
    }
  };

  const handleSubmitPriceUpdate = async () => {
    if (!priceEditItem || !newPriceRupees || !priceChangeReason.trim()) return;

    try {
      const newPricePaise = Math.round(parseFloat(newPriceRupees) * 100);
      await apiRequest(`/menu/items/${priceEditItem.id}/price`, {
        method: 'PATCH',
        body: JSON.stringify({ newPricePaise, reason: priceChangeReason.trim() }),
      });
      setPriceEditItem(null);
      setNewPriceRupees('');
      setPriceChangeReason('');
      loadMenu();
      alert('Price updated & audited.');
    } catch (err: any) {
      alert(err.message || 'Failed to update price');
    }
  };

  const formatRupees = (paise: number = 0) => `₹${(paise / 100).toFixed(2)}`;

  return (
    <div className="min-h-screen bg-parchment-50 font-sans">
      <header className="bg-slatepos-900 border-b border-slatepos-800 text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button 
            onClick={handleBack} 
            className="p-2 rounded-xl bg-slatepos-800 hover:bg-slatepos-700 text-slatepos-300 transition-colors"
            title="Back to Previous Page"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold shadow-md">
            <UtensilsCrossed className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-tight">LIVE MENU & STOCK MANAGER</h1>
            <p className="text-xs text-slatepos-400">Real-Time In-Stock / Sold-Out Toggles & Price Auditing</p>
          </div>
        </div>

        <button onClick={loadMenu} className="p-2 rounded-xl bg-slatepos-800 text-slatepos-300">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </header>

      <main className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6 pb-28">
        {loading ? (
          <div className="py-24 text-center">
            <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-xs text-slatepos-500">Loading dishes...</p>
          </div>
        ) : (
          categories.map((cat) => (
            <div key={cat.id} className="bg-white rounded-3xl border border-parchment-200 overflow-hidden shadow-2xs">
              <div className="p-4 bg-parchment-100 border-b border-parchment-200 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slatepos-950">{cat.name}</h2>
                  {cat.malayalamName && (
                    <span className="text-xs font-semibold text-brand-700 font-malayalam">{cat.malayalamName}</span>
                  )}
                </div>
                <span className="text-xs text-slatepos-500 font-medium">{cat.items.length} items</span>
              </div>

              <div className="divide-y divide-parchment-100">
                {cat.items.map((item: any) => (
                  <div key={item.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-parchment-50/50 transition">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold text-slatepos-900">{item.name}</span>
                        {item.malayalamName && (
                          <span className="text-xs text-brand-700 font-malayalam font-semibold">{item.malayalamName}</span>
                        )}
                      </div>
                      <div className="text-xs text-slatepos-500 mt-0.5">
                        Station: <strong>{item.station || 'Main Kitchen'}</strong>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 bg-parchment-50 border border-parchment-200 rounded-xl p-1">
                      <button onClick={() => handleStockAdjustment(item, -5)} className="w-7 h-7 rounded-lg bg-white text-slatepos-700 flex items-center justify-center font-bold hover:bg-parchment-200 shadow-2xs">
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs font-bold text-slatepos-950 font-mono px-2">
                        {item.currentStock !== null ? `${item.currentStock} left` : 'Unlimited'}
                      </span>
                      <button onClick={() => handleStockAdjustment(item, 5)} className="w-7 h-7 rounded-lg bg-white text-slatepos-700 flex items-center justify-center font-bold hover:bg-parchment-200 shadow-2xs">
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-bold text-slatepos-900 font-mono">{formatRupees(item.pricePaise)}</span>
                      <button onClick={() => {
                        setPriceEditItem(item);
                        setNewPriceRupees((item.pricePaise / 100).toString());
                        setPriceChangeReason('');
                      }} className="p-1.5 rounded-lg bg-parchment-100 hover:bg-parchment-200 text-slatepos-600">
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      onClick={() => handleToggleAvailability(item)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition flex items-center space-x-1.5 ${
                        item.isAvailable
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : 'bg-red-100 text-red-800 hover:bg-red-200'
                      }`}
                    >
                      {item.isAvailable ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>In Stock (Live)</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Sold Out</span>
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </main>

      {priceEditItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-parchment-200">
            <h3 className="text-base font-bold text-slatepos-950">Update Price for {priceEditItem.name}</h3>
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slatepos-700 mb-1">New Price (INR ₹):</label>
                <input
                  type="number"
                  value={newPriceRupees}
                  onChange={(e) => setNewPriceRupees(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-parchment-300 font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slatepos-700 mb-1">Audit Reason:</label>
                <textarea
                  value={priceChangeReason}
                  onChange={(e) => setPriceChangeReason(e.target.value)}
                  placeholder="e.g. Seafood market rate change..."
                  rows={2}
                  className="w-full text-xs p-2.5 rounded-xl border border-parchment-300"
                ></textarea>
              </div>
            </div>
            <div className="mt-5 flex space-x-2">
              <button onClick={() => setPriceEditItem(null)} className="flex-1 py-2 rounded-xl text-xs font-bold bg-slatepos-100 text-slatepos-700">
                Cancel
              </button>
              <button
                disabled={!newPriceRupees || !priceChangeReason.trim()}
                onClick={handleSubmitPriceUpdate}
                className="flex-1 py-2 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
