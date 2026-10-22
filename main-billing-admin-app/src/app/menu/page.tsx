'use client';

import React, { useEffect, useState, useMemo } from 'react';
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
  Minus,
  Calendar,
  FileSpreadsheet,
  Check,
  X,
  Trash2
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
  
  // Date Changer & Excel Archive State
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  // Price Edit Modal State
  const [priceEditItem, setPriceEditItem] = useState<any | null>(null);
  const [newPriceRupees, setNewPriceRupees] = useState('');
  const [priceChangeReason, setPriceChangeReason] = useState('');

  // Add Item Modal State (High-Contrast Black Typography, Zero Image Clutter)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addName, setAddName] = useState('');
  const [addMalayalamName, setAddMalayalamName] = useState('');
  const [addCategory, setAddCategory] = useState('Seafood Specials');
  const [customCategory, setCustomCategory] = useState('');
  const [addPriceRupees, setAddPriceRupees] = useState('');
  const [addQuantity, setAddQuantity] = useState('25');
  const [isUnlimitedStock, setIsUnlimitedStock] = useState(false);
  const [addDietary, setAddDietary] = useState<'SEAFOOD' | 'NON_VEG' | 'VEG'>('SEAFOOD');
  const [isSubmittingItem, setIsSubmittingItem] = useState(false);

  const loadMenu = async () => {
    try {
      setLoading(true);

      // 1. Sync custom dishes from localStorage to central server if needed
      if (typeof window !== 'undefined') {
        const savedDishes = localStorage.getItem('ithipooram_custom_menu_dishes');
        if (savedDishes) {
          try {
            const parsed = JSON.parse(savedDishes);
            if (Array.isArray(parsed) && parsed.length > 0) {
              // Ensure server has these items
              for (const dish of parsed) {
                await fetch('/api/menu', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(dish),
                }).catch(() => {});
              }
            }
          } catch (e) {}
        }
      }

      // 2. Fetch live menu from central API with no-store to always bypass any browser/Vercel caching
      const res = await fetch('/api/menu', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setCategories(Array.isArray(data) ? data : []);
      } else {
        setCategories([]);
      }
    } catch (err) {
      console.error('Failed to load menu:', err);
      setCategories([]);
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
      await fetch('/api/menu', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: item.id, isAvailable: !item.isAvailable }),
      });
      loadMenu();
    } catch (err: any) {
      alert(err.message || 'Failed to update');
    }
  };

  const handleStockAdjustment = async (item: any, delta: number) => {
    try {
      const nextStock = Math.max(0, (item.currentStock || 0) + delta);
      await fetch('/api/menu', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: item.id, currentStock: nextStock, isAvailable: nextStock > 0 }),
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
      await fetch('/api/menu', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          itemId: priceEditItem.id, 
          pricePaise: newPricePaise, 
          reason: priceChangeReason.trim() 
        }),
      });
      setPriceEditItem(null);
      setNewPriceRupees('');
      setPriceChangeReason('');
      loadMenu();
      alert('Price updated & synchronized with customer app.');
    } catch (err: any) {
      alert(err.message || 'Failed to update price');
    }
  };

  const handleAddNewItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName.trim()) {
      alert('Please enter dish name in English');
      return;
    }
    if (!addPriceRupees || parseFloat(addPriceRupees) <= 0) {
      alert('Please enter a valid price in rupees');
      return;
    }

    try {
      setIsSubmittingItem(true);
      const finalCategory = addCategory === 'CUSTOM' ? (customCategory.trim() || 'Chef Specials') : addCategory;
      const finalStock = isUnlimitedStock ? null : Math.max(0, parseInt(addQuantity, 10) || 0);

      const dishPayload = {
        name: addName.trim(),
        malayalamName: addMalayalamName.trim(),
        category: finalCategory,
        priceInr: parseFloat(addPriceRupees),
        currentStock: finalStock,
        dietary: addDietary,
        station: finalCategory.toLowerCase().includes('fry') || finalCategory.toLowerCase().includes('seafood')
          ? 'Seafood Fry' 
          : finalCategory.toLowerCase().includes('drink') 
          ? 'Beverage Counter' 
          : 'Main Kitchen',
      };

      // Save to server
      const res = await fetch('/api/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dishPayload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to add dish');
      }

      // Persist in localStorage so it is never lost on serverless resets
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('ithipooram_custom_menu_dishes');
        const list = saved ? JSON.parse(saved) : [];
        list.push(dishPayload);
        localStorage.setItem('ithipooram_custom_menu_dishes', JSON.stringify(list));
      }

      // Reset form
      setAddName('');
      setAddMalayalamName('');
      setAddPriceRupees('');
      setAddQuantity('25');
      setIsUnlimitedStock(false);
      setIsAddModalOpen(false);

      await loadMenu();
      alert(`"${addName}" added successfully and sent to customer ordering system!`);
    } catch (err: any) {
      alert(err.message || 'Error adding item');
    } finally {
      setIsSubmittingItem(false);
    }
  };

  const handleDownloadDailyMenuExcel = async (format: 'xls' | 'csv' = 'xls') => {
    try {
      setIsExportingExcel(true);
      const res = await fetch(`/api/menu/excel?date=${selectedDate}&format=${format}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const ext = format === 'xls' ? 'xls' : 'csv';
        a.download = `IthiPooram_Daily_Menu_${selectedDate}.${ext}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (e) {
      console.error('Download error:', e);
    } finally {
      setIsExportingExcel(false);
    }
  };

  const formatRupees = (paise: number = 0) => `₹${(paise / 100).toFixed(2)}`;

  // Summary Metrics
  const totalDishesCount = useMemo(() => {
    return categories.reduce((sum, c) => sum + (c.items?.length || 0), 0);
  }, [categories]);

  const activeDishesCount = useMemo(() => {
    return categories.reduce((sum, c) => sum + (c.items?.filter((it: any) => it.isAvailable)?.length || 0), 0);
  }, [categories]);

  return (
    <div className="min-h-screen bg-parchment-50 font-sans pb-32">
      {/* Top Header */}
      <header className="bg-slatepos-900 border-b border-slatepos-800 text-white px-4 sm:px-6 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-md">
        <div className="flex items-center space-x-3.5">
          <button 
            onClick={handleBack} 
            className="p-2 rounded-xl bg-slatepos-800 hover:bg-slatepos-700 text-slatepos-300 transition-colors"
            title="Back to Previous Page"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="w-9 h-9 rounded-xl bg-[#9E341D] flex items-center justify-center text-white font-bold shadow-md shrink-0">
            <UtensilsCrossed className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base sm:text-lg font-black tracking-wide text-white uppercase">
                LIVE MENU UPDATE
              </h1>
              <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider hidden sm:inline-block">
                Customer Synced
              </span>
            </div>
          </div>
        </div>

        <button 
          onClick={loadMenu} 
          className="p-2 rounded-xl bg-slatepos-800 hover:bg-slatepos-700 text-slatepos-300 hover:text-white transition-colors"
          title="Refresh Live Menu"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </header>

      {/* Clean Status & Date Control Bar (Top Add Item & Excel/CSV Options Removed as Requested) */}
      <div className="bg-white border-b border-parchment-200 px-4 sm:px-6 py-2.5 sticky top-[57px] z-20 shadow-xs">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-black font-black bg-parchment-100 border border-stone-800 px-3 py-1.5 rounded-xl">
              {activeDishesCount} / {totalDishesCount} Dishes Active
            </span>
            <span className="text-[11px] font-black text-emerald-800 bg-emerald-50 border border-emerald-300 px-2.5 py-1.5 rounded-xl flex items-center space-x-1">
              <span>📱</span>
              <span>Telegram Group Excel Database Live Sync</span>
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1.5 bg-parchment-100 border-2 border-stone-800 rounded-xl px-2.5 py-1">
              <Calendar className="w-3.5 h-3.5 text-black" />
              <span className="text-xs font-black text-black">Menu Date:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-xs font-black text-black border-none outline-none cursor-pointer"
              />
            </div>
            <button
              onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
              className={`px-3 py-1 rounded-lg text-xs font-black transition border-2 ${
                selectedDate === new Date().toISOString().split('T')[0]
                  ? 'bg-black text-white border-black'
                  : 'bg-white text-black border-stone-800 hover:bg-parchment-100'
              }`}
            >
              Today
            </button>
          </div>
        </div>
      </div>

      {/* Main Dishes Catalog Content */}
      <main className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
        {loading ? (
          <div className="py-24 text-center">
            <div className="w-8 h-8 border-3 border-[#9E341D] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-xs font-black text-black">Loading menu...</p>
          </div>
        ) : totalDishesCount === 0 ? (
          /* Empty State: Only visible after admin adds menu */
          <div className="py-20 text-center bg-white rounded-3xl border-2 border-dashed border-stone-300 p-8 shadow-xs my-6">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 text-[#9E341D] flex items-center justify-center mx-auto mb-4 border border-amber-200">
              <UtensilsCrossed className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-black text-black">No Menu Items Added Yet</h3>
            <p className="text-xs sm:text-sm font-bold text-stone-600 mt-1 mb-6 max-w-md mx-auto">
              Your menu is completely clean. Items will only appear here and on the customer mobile ordering app after you add them.
            </p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-6 py-3 rounded-2xl bg-[#9E341D] hover:bg-[#852B17] text-white font-black text-sm shadow-lg flex items-center justify-center space-x-2 mx-auto active:scale-98 transition"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>+ Add Your First Dish</span>
            </button>
          </div>
        ) : (
          categories.map((cat) => (
            cat.items && cat.items.length > 0 && (
              <div key={cat.id} className="bg-white rounded-3xl border-2 border-stone-800 overflow-hidden shadow-xs">
                <div className="p-4 bg-stone-100 border-b-2 border-stone-800 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm sm:text-base font-black text-black uppercase tracking-wide">{cat.name}</h2>
                    {cat.malayalamName && cat.malayalamName !== cat.name && (
                      <span className="text-xs font-bold text-[#9E341D] font-malayalam">{cat.malayalamName}</span>
                    )}
                  </div>
                  <span className="text-xs text-black font-black bg-white px-3 py-1 rounded-full border border-stone-400">
                    {cat.items.length} items
                  </span>
                </div>

                <div className="divide-y divide-stone-200">
                  {cat.items.map((item: any) => (
                    <div key={item.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 hover:bg-stone-50 transition">
                      {/* Dish Details (English + Malayalam + Dietary Badge) */}
                      <div className="flex items-center space-x-3.5 flex-1">
                        <span 
                          className={`w-3.5 h-3.5 rounded-full shrink-0 border-2 border-white shadow-xs ${
                            item.dietary === 'VEG' 
                              ? 'bg-emerald-600' 
                              : item.dietary === 'NON_VEG' 
                              ? 'bg-amber-600' 
                              : 'bg-blue-600'
                          }`}
                          title={item.dietary || 'SEAFOOD'}
                        />

                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm sm:text-base font-black text-black">{item.name}</span>
                            {item.malayalamName && (
                              <span className="text-xs font-extrabold text-[#9E341D] font-malayalam">{item.malayalamName}</span>
                            )}
                          </div>
                          <div className="text-[11px] font-bold text-stone-500 mt-0.5 flex items-center space-x-2">
                            <span className="uppercase text-black font-black">{item.dietary || 'SEAFOOD'}</span>
                            <span>•</span>
                            <span>Station: <strong className="text-black">{item.station || 'Main Kitchen'}</strong></span>
                          </div>
                        </div>
                      </div>

                      {/* Stock Stepper */}
                      <div className="flex items-center space-x-2 bg-stone-100 border border-stone-300 rounded-xl p-1">
                        <button 
                          onClick={() => handleStockAdjustment(item, -5)} 
                          className="w-7 h-7 rounded-lg bg-white text-black flex items-center justify-center font-black hover:bg-stone-200 shadow-2xs active:scale-95"
                          title="Reduce stock by 5"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-xs font-black text-black font-mono px-2 min-w-[75px] text-center">
                          {item.currentStock !== null && item.currentStock !== undefined ? `${item.currentStock} left` : 'Unlimited'}
                        </span>
                        <button 
                          onClick={() => handleStockAdjustment(item, 5)} 
                          className="w-7 h-7 rounded-lg bg-white text-black flex items-center justify-center font-black hover:bg-stone-200 shadow-2xs active:scale-95"
                          title="Increase stock by 5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Price with Edit Button */}
                      <div className="flex items-center space-x-2 min-w-[100px] justify-end">
                        <span className="text-base font-black text-black font-mono">{formatRupees(item.pricePaise)}</span>
                        <button 
                          onClick={() => {
                            setPriceEditItem(item);
                            setNewPriceRupees((item.pricePaise / 100).toString());
                            setPriceChangeReason('');
                          }} 
                          className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-black transition"
                          title="Update Price"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* In-Stock / Sold-Out Toggle */}
                      <button
                        onClick={() => handleToggleAvailability(item)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-black transition flex items-center space-x-1.5 cursor-pointer ${
                          item.isAvailable
                            ? 'bg-emerald-100 text-emerald-950 border border-emerald-300 hover:bg-emerald-200'
                            : 'bg-red-100 text-red-950 border border-red-300 hover:bg-red-200'
                        }`}
                      >
                        {item.isAvailable ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                            <span>In Stock (Live)</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5 text-red-700" />
                            <span>Sold Out</span>
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )
          ))
        )}

        {/* Small button to add next menu item (appears below added items) */}
        {totalDishesCount > 0 && (
          <div className="pt-2 pb-6 flex flex-col items-center justify-center space-y-2">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-5 py-2.5 rounded-2xl bg-[#9E341D] hover:bg-[#852B17] text-white font-black text-xs sm:text-sm shadow-md flex items-center justify-center space-x-2 active:scale-98 transition cursor-pointer border-2 border-stone-900"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>+ Add Next Menu Item</span>
            </button>
            <p className="text-[11px] font-bold text-stone-600">
              Dishes automatically sync to Customer Ordering and Datewise Excel in Telegram
            </p>
          </div>
        )}
      </main>

      {/* Modal: + Add Item (High-Contrast Black Font Typography, Image Removed) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border-2 border-stone-900 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b-2 border-stone-800">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-[#9E341D] flex items-center justify-center text-white">
                  <Plus className="w-5 h-5 stroke-[3]" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-black uppercase">
                    {totalDishesCount === 0 ? 'Add Your First Dish' : 'Add Next Menu Item'}
                  </h3>
                  <p className="text-xs font-bold text-stone-700">Syncs directly to customer ordering &amp; Telegram Excel</p>
                </div>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg text-black hover:bg-stone-100 transition"
              >
                <X className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>

            <form onSubmit={handleAddNewItem} className="mt-5 space-y-4">
              {/* Dish Name (English) */}
              <div>
                <label className="block text-xs font-black text-black mb-1">
                  Dish Name (English) *
                </label>
                <input
                  type="text"
                  required
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  placeholder="e.g. Karimeen Pollichathu, Neymeen Fry, Beef Roast, Meals..."
                  className="w-full text-sm p-3 rounded-xl border-2 border-stone-800 font-black text-black placeholder:text-stone-400 bg-white focus:border-[#9E341D] outline-none"
                />
              </div>

              {/* Malayalam Script */}
              <div>
                <label className="block text-xs font-black text-black mb-1">
                  Malayalam Name (Optional)
                </label>
                <input
                  type="text"
                  value={addMalayalamName}
                  onChange={(e) => setAddMalayalamName(e.target.value)}
                  placeholder="e.g. കരിമീൻ പൊള്ളിച്ചത്..."
                  className="w-full text-sm p-3 rounded-xl border-2 border-stone-800 font-black text-black placeholder:text-stone-400 bg-white font-malayalam focus:border-[#9E341D] outline-none"
                />
              </div>

              {/* Dietary Type Selection */}
              <div>
                <label className="block text-xs font-black text-black mb-1.5">
                  Dietary Type *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'SEAFOOD', label: '🐟 Seafood' },
                    { id: 'NON_VEG', label: '🍗 Non-Veg' },
                    { id: 'VEG', label: '🥬 Vegetarian' },
                  ].map((d) => (
                    <button
                      type="button"
                      key={d.id}
                      onClick={() => setAddDietary(d.id as any)}
                      className={`py-2.5 px-2 text-xs font-black rounded-xl border-2 transition ${
                        addDietary === d.id
                          ? 'bg-black text-white border-black shadow-sm'
                          : 'bg-white text-black border-stone-800 hover:bg-stone-100'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price & Quantity Available */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-black text-black mb-1">
                    Final Price (₹ INR) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-sm font-black text-black">₹</span>
                    <input
                      type="number"
                      step="any"
                      required
                      min="1"
                      value={addPriceRupees}
                      onChange={(e) => setAddPriceRupees(e.target.value)}
                      placeholder="280.00"
                      className="w-full text-sm pl-8 pr-3 py-2.5 rounded-xl border-2 border-stone-800 font-mono font-black text-black bg-white focus:border-[#9E341D] outline-none"
                    />
                  </div>
                  <span className="text-[10px] font-bold text-stone-600 block mt-1">
                    Final price (inclusive of GST). No extra tax will be added to the customer.
                  </span>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-black text-black">Quantity Available</label>
                    <label className="flex items-center space-x-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isUnlimitedStock}
                        onChange={(e) => setIsUnlimitedStock(e.target.checked)}
                        className="rounded text-black focus:ring-0 cursor-pointer"
                      />
                      <span className="text-[11px] font-black text-black">Unlimited</span>
                    </label>
                  </div>
                  <input
                    type="number"
                    disabled={isUnlimitedStock}
                    value={isUnlimitedStock ? '' : addQuantity}
                    onChange={(e) => setAddQuantity(e.target.value)}
                    placeholder={isUnlimitedStock ? 'Unlimited' : 'e.g. 25'}
                    className="w-full text-sm p-2.5 rounded-xl border-2 border-stone-800 font-mono font-black text-black bg-white disabled:bg-stone-200 disabled:text-stone-500 outline-none"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-black text-black mb-1">
                  Category
                </label>
                <select
                  value={addCategory}
                  onChange={(e) => setAddCategory(e.target.value)}
                  className="w-full text-xs font-black text-black p-3 rounded-xl border-2 border-stone-800 bg-white outline-none cursor-pointer"
                >
                  <option value="Seafood Specials">Seafood Specials</option>
                  <option value="Kerala Meals & Rice">Kerala Meals & Rice</option>
                  <option value="Kerala Meats & Gravies">Kerala Meats & Gravies</option>
                  <option value="Breads & Starters">Breads & Starters</option>
                  <option value="Drinks & Desserts">Drinks & Desserts</option>
                  <option value="CUSTOM">+ Custom Category</option>
                </select>
              </div>

              {addCategory === 'CUSTOM' && (
                <div>
                  <label className="block text-xs font-black text-black mb-1">
                    Custom Category Name
                  </label>
                  <input
                    type="text"
                    required
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="e.g. Claypot Curries, Chef Specials..."
                    className="w-full text-sm p-2.5 rounded-xl border-2 border-stone-800 font-black text-black bg-white outline-none"
                  />
                </div>
              )}

              {/* Buttons */}
              <div className="pt-3 flex space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-3 rounded-2xl text-xs sm:text-sm font-black bg-stone-200 hover:bg-stone-300 text-black transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingItem}
                  className="flex-1 py-3 rounded-2xl text-xs sm:text-sm font-black bg-[#9E341D] hover:bg-[#852B17] text-white shadow-md flex items-center justify-center space-x-1.5 transition active:scale-98 disabled:opacity-50"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>{isSubmittingItem ? 'Adding Dish...' : 'Add to Menu & Sync'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Update Price */}
      {priceEditItem && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border-2 border-stone-900">
            <h3 className="text-base font-black text-black">Update Price for {priceEditItem.name}</h3>
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-black text-black mb-1">Final Price (INR ₹) - Inclusive of GST:</label>
                <input
                  type="number"
                  value={newPriceRupees}
                  onChange={(e) => setNewPriceRupees(e.target.value)}
                  className="w-full text-sm p-2.5 rounded-xl border-2 border-stone-800 font-mono font-black text-black bg-white"
                />
                <span className="text-[10px] font-bold text-stone-600 block mt-1">
                  Net final price. No additional GST is charged at billing.
                </span>
              </div>
              <div>
                <label className="block text-xs font-black text-black mb-1">Audit Reason:</label>
                <textarea
                  value={priceChangeReason}
                  onChange={(e) => setPriceChangeReason(e.target.value)}
                  placeholder="e.g. Market auction rate change..."
                  rows={2}
                  className="w-full text-xs p-2.5 rounded-xl border-2 border-stone-800 font-bold text-black bg-white"
                ></textarea>
              </div>
            </div>
            <div className="mt-5 flex space-x-2">
              <button 
                onClick={() => setPriceEditItem(null)} 
                className="flex-1 py-2 rounded-xl text-xs font-black bg-stone-200 text-black"
              >
                Cancel
              </button>
              <button
                disabled={!newPriceRupees || !priceChangeReason.trim()}
                onClick={handleSubmitPriceUpdate}
                className="flex-1 py-2 rounded-xl text-xs font-black bg-[#9E341D] hover:bg-[#852B17] text-white disabled:opacity-50"
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
