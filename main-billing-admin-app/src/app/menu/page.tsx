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
  Download,
  Image as ImageIcon,
  Sparkles,
  Search,
  Check,
  X
} from 'lucide-react';
import { apiRequest, getCurrentUser } from '../../lib/api';
import { autoFetchFoodImage } from '../../lib/foodImageHelper';

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

  // Add Item Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addName, setAddName] = useState('');
  const [addMalayalamName, setAddMalayalamName] = useState('');
  const [addCategory, setAddCategory] = useState('Seafood Fry & Roasts');
  const [customCategory, setCustomCategory] = useState('');
  const [addPriceRupees, setAddPriceRupees] = useState('');
  const [addQuantity, setAddQuantity] = useState('25');
  const [isUnlimitedStock, setIsUnlimitedStock] = useState(false);
  const [addDietary, setAddDietary] = useState<'SEAFOOD' | 'NON_VEG' | 'VEG'>('SEAFOOD');
  const [addImageUrl, setAddImageUrl] = useState('');
  const [isSubmittingItem, setIsSubmittingItem] = useState(false);

  // Auto-fetch image when item name changes
  useEffect(() => {
    if (addName.trim().length >= 2) {
      const fetched = autoFetchFoodImage(addName);
      setAddImageUrl(fetched);
    }
  }, [addName]);

  const loadMenu = async () => {
    try {
      setLoading(true);
      // Fetch directly from live central API
      const res = await fetch('/api/menu');
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      } else {
        const fallback = await apiRequest('/menu/staff');
        setCategories(fallback);
      }
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
      alert('Please enter dish name');
      return;
    }
    if (!addPriceRupees || parseFloat(addPriceRupees) <= 0) {
      alert('Please enter a valid price in rupees');
      return;
    }

    try {
      setIsSubmittingItem(true);
      const finalCategory = addCategory === 'CUSTOM' ? (customCategory.trim() || 'Special Delicacies') : addCategory;
      const finalStock = isUnlimitedStock ? null : Math.max(0, parseInt(addQuantity, 10) || 0);

      const res = await fetch('/api/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: addName.trim(),
          malayalamName: addMalayalamName.trim(),
          category: finalCategory,
          priceInr: parseFloat(addPriceRupees),
          currentStock: finalStock,
          dietary: addDietary,
          image: addImageUrl.trim(),
          station: finalCategory.toLowerCase().includes('fry') || finalCategory.toLowerCase().includes('seafood')
            ? 'Seafood Fry' 
            : finalCategory.toLowerCase().includes('drink') 
            ? 'Beverage Counter' 
            : 'Main Kitchen',
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to add dish');
      }

      // Reset form
      setAddName('');
      setAddMalayalamName('');
      setAddPriceRupees('');
      setAddQuantity('25');
      setIsUnlimitedStock(false);
      setAddImageUrl('');
      setIsAddModalOpen(false);

      await loadMenu();
      alert(`"${addName}" added successfully and synced to the customer ordering system!`);
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
            <p className="text-[11px] text-slatepos-400">
              Real-time stock quantities, pricing adjustments & customer catalog sync
            </p>
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

      {/* Action & Date Control Ribbon */}
      <div className="bg-white border-b border-parchment-200 px-4 sm:px-6 py-3 sticky top-[57px] z-20 shadow-xs">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Left: + Add Item Primary Option */}
          <div className="flex items-center space-x-2.5">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#9E341D] hover:bg-[#852B17] text-white font-bold text-xs shadow-md flex items-center justify-center space-x-2 active:scale-98 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Item</span>
            </button>

            <span className="text-xs text-slatepos-500 font-semibold hidden sm:inline-block">
              {activeDishesCount} / {totalDishesCount} dishes live
            </span>
          </div>

          {/* Right: Date Changer & Excel Database Export */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center space-x-1.5 bg-parchment-100 border border-parchment-300 rounded-xl px-2.5 py-1">
              <Calendar className="w-3.5 h-3.5 text-slatepos-600" />
              <span className="text-xs font-bold text-slatepos-700">Date:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-xs font-bold text-slatepos-900 border-none outline-none cursor-pointer"
              />
            </div>

            <button
              onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition border ${
                selectedDate === new Date().toISOString().split('T')[0]
                  ? 'bg-slatepos-900 text-white border-slatepos-900'
                  : 'bg-white text-slatepos-700 border-parchment-300 hover:bg-parchment-100'
              }`}
            >
              Today
            </button>

            <button
              onClick={() => handleDownloadDailyMenuExcel('xls')}
              disabled={isExportingExcel}
              className="px-3.5 py-1.5 rounded-xl bg-slatepos-900 hover:bg-slatepos-800 text-white font-bold text-xs shadow-sm flex items-center space-x-1.5 active:scale-98 transition disabled:opacity-50"
              title="Download Master Excel database for the selected date"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-amber-300" />
              <span>{isExportingExcel ? 'Exporting...' : 'Menu Excel (.xls)'}</span>
            </button>

            <button
              onClick={() => handleDownloadDailyMenuExcel('csv')}
              disabled={isExportingExcel}
              className="px-2.5 py-1.5 rounded-xl bg-white border border-parchment-300 hover:bg-parchment-100 text-slatepos-700 font-bold text-xs shadow-2xs active:scale-98 transition disabled:opacity-50"
              title="Download CSV format for Google Sheets"
            >
              CSV
            </button>
          </div>
        </div>
      </div>

      {/* Main Dishes Catalog Content */}
      <main className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
        {loading ? (
          <div className="py-24 text-center">
            <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-xs text-slatepos-500">Loading live dishes catalog...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-3xl border border-parchment-200 p-8 shadow-xs">
            <UtensilsCrossed className="w-12 h-12 text-slatepos-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slatepos-900">No Dishes in Menu</h3>
            <p className="text-xs text-slatepos-500 mt-1 mb-4 max-w-sm mx-auto">
              Click "+ Add Item" above to add your first dish with real-time stock and auto-fetched food images.
            </p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-[#9E341D] hover:bg-[#852B17] text-white font-bold text-xs shadow-md"
            >
              + Add Item
            </button>
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
                <span className="text-xs text-slatepos-500 font-semibold bg-white px-2.5 py-0.5 rounded-full border border-parchment-300">
                  {cat.items?.length || 0} items
                </span>
              </div>

              <div className="divide-y divide-parchment-100">
                {cat.items?.map((item: any) => (
                  <div key={item.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 hover:bg-parchment-50/50 transition">
                    {/* Item Thumbnail & Name */}
                    <div className="flex items-center space-x-3.5 flex-1">
                      <div className="w-14 h-14 rounded-2xl overflow-hidden bg-parchment-200 shrink-0 border border-parchment-300 relative shadow-2xs">
                        <img 
                          src={item.image || autoFetchFoodImage(item.name)} 
                          alt={item.name}
                          className="w-full h-full object-cover"
                          onError={(e: any) => {
                            e.target.onerror = null;
                            e.target.src = autoFetchFoodImage(item.name);
                          }}
                        />
                        <span className={`absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full border border-white shadow-xs ${
                          item.dietary === 'VEG' ? 'bg-emerald-500' : item.dietary === 'NON_VEG' ? 'bg-amber-600' : 'bg-blue-600'
                        }`} />
                      </div>

                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-bold text-slatepos-900">{item.name}</span>
                          {item.malayalamName && (
                            <span className="text-xs text-brand-700 font-malayalam font-semibold">{item.malayalamName}</span>
                          )}
                        </div>
                        <div className="text-[11px] text-slatepos-500 mt-0.5 flex items-center space-x-2">
                          <span>Station: <strong>{item.station || 'Main Kitchen'}</strong></span>
                          <span>•</span>
                          <span className="font-semibold text-slatepos-600">{item.dietary || 'SEAFOOD'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Stock Stepper */}
                    <div className="flex items-center space-x-2 bg-parchment-100/70 border border-parchment-200 rounded-xl p-1">
                      <button 
                        onClick={() => handleStockAdjustment(item, -5)} 
                        className="w-7 h-7 rounded-lg bg-white text-slatepos-700 flex items-center justify-center font-bold hover:bg-parchment-200 shadow-2xs active:scale-95"
                        title="Reduce stock by 5"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-bold text-slatepos-950 font-mono px-2 min-w-[70px] text-center">
                        {item.currentStock !== null && item.currentStock !== undefined ? `${item.currentStock} left` : 'Unlimited'}
                      </span>
                      <button 
                        onClick={() => handleStockAdjustment(item, 5)} 
                        className="w-7 h-7 rounded-lg bg-white text-slatepos-700 flex items-center justify-center font-bold hover:bg-parchment-200 shadow-2xs active:scale-95"
                        title="Increase stock by 5"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Price with Edit Button */}
                    <div className="flex items-center space-x-2 min-w-[100px] justify-end">
                      <span className="text-sm font-black text-slatepos-900 font-mono">{formatRupees(item.pricePaise)}</span>
                      <button 
                        onClick={() => {
                          setPriceEditItem(item);
                          setNewPriceRupees((item.pricePaise / 100).toString());
                          setPriceChangeReason('');
                        }} 
                        className="p-1.5 rounded-lg bg-parchment-100 hover:bg-parchment-200 text-slatepos-600 hover:text-slatepos-900 transition"
                        title="Update Price"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* In-Stock / Sold-Out Toggle */}
                    <button
                      onClick={() => handleToggleAvailability(item)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                        item.isAvailable
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : 'bg-red-100 text-red-800 hover:bg-red-200'
                      }`}
                    >
                      {item.isAvailable ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>In Stock (Live)</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5 text-red-600" />
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

      {/* Modal: + Add Item with Auto-Fetched Food Image */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-parchment-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-parchment-200">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#9E341D] flex items-center justify-center text-white">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slatepos-950">Add New Dish to Live Menu</h3>
                  <p className="text-xs text-slatepos-500">Synchronizes live to customer ordering app</p>
                </div>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg text-slatepos-400 hover:text-slatepos-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddNewItem} className="mt-4 space-y-4">
              {/* Item Name (English) */}
              <div>
                <label className="block text-xs font-bold text-slatepos-700 mb-1">Dish Name (English) *</label>
                <input
                  type="text"
                  required
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  placeholder="e.g. Karimeen Pollichathu, Neymeen Fry, Beef Roast..."
                  className="w-full text-xs p-3 rounded-xl border border-parchment-300 font-bold focus:ring-2 focus:ring-[#9E341D]/30 focus:border-[#9E341D] outline-none"
                />
              </div>

              {/* Malayalam Script */}
              <div>
                <label className="block text-xs font-bold text-slatepos-700 mb-1">Malayalam Name (Optional)</label>
                <input
                  type="text"
                  value={addMalayalamName}
                  onChange={(e) => setAddMalayalamName(e.target.value)}
                  placeholder="e.g. കരിമീൻ പൊള്ളിച്ചത്..."
                  className="w-full text-xs p-3 rounded-xl border border-parchment-300 font-malayalam focus:ring-2 focus:ring-[#9E341D]/30 focus:border-[#9E341D] outline-none"
                />
              </div>

              {/* Category & Dietary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slatepos-700 mb-1">Category</label>
                  <select
                    value={addCategory}
                    onChange={(e) => setAddCategory(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-parchment-300 font-bold bg-white outline-none"
                  >
                    <option value="Seafood Fry & Roasts">Seafood Fry & Roasts</option>
                    <option value="Kerala Meals & Rice">Kerala Meals & Rice</option>
                    <option value="Kerala Meats & Gravies">Kerala Meats & Gravies</option>
                    <option value="Drinks & Desserts">Drinks & Desserts</option>
                    <option value="Starters & Snacks">Starters & Snacks</option>
                    <option value="CUSTOM">+ Custom Category</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slatepos-700 mb-1">Dietary Type</label>
                  <div className="flex space-x-1.5">
                    {[
                      { id: 'SEAFOOD', label: '🐟 Seafood' },
                      { id: 'NON_VEG', label: '🍗 Non-Veg' },
                      { id: 'VEG', label: '🥬 Veg' },
                    ].map((d) => (
                      <button
                        type="button"
                        key={d.id}
                        onClick={() => setAddDietary(d.id as any)}
                        className={`flex-1 py-2 text-[11px] font-bold rounded-xl border transition ${
                          addDietary === d.id
                            ? 'bg-slatepos-900 text-white border-slatepos-900'
                            : 'bg-white text-slatepos-600 border-parchment-300 hover:bg-parchment-100'
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {addCategory === 'CUSTOM' && (
                <div>
                  <label className="block text-xs font-bold text-slatepos-700 mb-1">Custom Category Name</label>
                  <input
                    type="text"
                    required
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="e.g. Claypot Curries, Chef Specials..."
                    className="w-full text-xs p-2.5 rounded-xl border border-parchment-300 font-bold outline-none"
                  />
                </div>
              )}

              {/* Price & Quantity Available */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slatepos-700 mb-1">Price (₹ INR) *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs font-bold text-slatepos-500">₹</span>
                    <input
                      type="number"
                      step="any"
                      required
                      min="1"
                      value={addPriceRupees}
                      onChange={(e) => setAddPriceRupees(e.target.value)}
                      placeholder="280.00"
                      className="w-full text-xs pl-7 pr-3 py-2.5 rounded-xl border border-parchment-300 font-mono font-bold outline-none"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slatepos-700">Quantity Available</label>
                    <label className="flex items-center space-x-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isUnlimitedStock}
                        onChange={(e) => setIsUnlimitedStock(e.target.checked)}
                        className="rounded text-[#9E341D] focus:ring-0 cursor-pointer"
                      />
                      <span className="text-[10px] font-bold text-slatepos-500">Unlimited</span>
                    </label>
                  </div>
                  <input
                    type="number"
                    disabled={isUnlimitedStock}
                    value={isUnlimitedStock ? '' : addQuantity}
                    onChange={(e) => setAddQuantity(e.target.value)}
                    placeholder={isUnlimitedStock ? 'Unlimited' : 'e.g. 25'}
                    className="w-full text-xs p-2.5 rounded-xl border border-parchment-300 font-mono font-bold disabled:bg-parchment-100 disabled:text-slatepos-400 outline-none"
                  />
                </div>
              </div>

              {/* Auto-Fetched Food Image Section */}
              <div className="p-3.5 bg-parchment-100/70 border border-parchment-300 rounded-2xl">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span className="text-xs font-bold text-slatepos-800">
                      Internet Food Image (Auto-Fetched)
                    </span>
                  </div>
                  {addImageUrl && (
                    <button
                      type="button"
                      onClick={() => setAddImageUrl(autoFetchFoodImage(addName + ' special'))}
                      className="text-[10px] text-[#9E341D] font-bold hover:underline"
                    >
                      Re-fetch Photo
                    </button>
                  )}
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-white border border-parchment-300 shrink-0 shadow-xs relative">
                    {addImageUrl ? (
                      <img 
                        src={addImageUrl} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                        onError={(e: any) => {
                          e.target.onerror = null;
                          e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slatepos-400">
                        <ImageIcon className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="url"
                      value={addImageUrl}
                      onChange={(e) => setAddImageUrl(e.target.value)}
                      placeholder="Image URL auto-resolves or paste custom URL..."
                      className="w-full text-[11px] p-2 rounded-xl border border-parchment-300 bg-white font-mono"
                    />
                    <p className="text-[10px] text-slatepos-500 mt-1">
                      Attracts customers scanning QR menus by showing high-res food presentation.
                    </p>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex space-x-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-3 rounded-2xl text-xs font-bold bg-parchment-100 hover:bg-parchment-200 text-slatepos-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingItem}
                  className="flex-1 py-3 rounded-2xl text-xs font-bold bg-[#9E341D] hover:bg-[#852B17] text-white shadow-md flex items-center justify-center space-x-1.5 transition active:scale-98 disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSubmittingItem ? 'Adding Dish...' : 'Add to Menu & Sync'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Update Price */}
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
                  placeholder="e.g. Seafood market auction rate change..."
                  rows={2}
                  className="w-full text-xs p-2.5 rounded-xl border border-parchment-300"
                ></textarea>
              </div>
            </div>
            <div className="mt-5 flex space-x-2">
              <button 
                onClick={() => setPriceEditItem(null)} 
                className="flex-1 py-2 rounded-xl text-xs font-bold bg-slatepos-100 text-slatepos-700"
              >
                Cancel
              </button>
              <button
                disabled={!newPriceRupees || !priceChangeReason.trim()}
                onClick={handleSubmitPriceUpdate}
                className="flex-1 py-2 rounded-xl text-xs font-bold bg-[#9E341D] hover:bg-[#852B17] text-white disabled:opacity-50"
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
