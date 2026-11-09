'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Home, 
  UtensilsCrossed, 
  BarChart3, 
  MoreHorizontal, 
  Plus, 
  Grid3X3, 
  ChevronRight, 
  Edit3, 
  LogOut, 
  Menu as MenuIcon, 
  X, 
  Upload, 
  Sparkles, 
  ChevronDown,
  Receipt,
  ChefHat
} from 'lucide-react';
import { apiRequest, getCurrentUser } from '../../lib/api';

export default function MenuItemsPage() {
  const router = useRouter();

  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Add Menu Item Modal State (Pixel-perfect copy of uploaded reference)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [itemName, setItemName] = useState('');
  const [itemMalayalamName, setItemMalayalamName] = useState('');
  const [itemCategory, setItemCategory] = useState('');
  const [isFavourite, setIsFavourite] = useState(false);
  const [salePrice, setSalePrice] = useState('');
  const [taxPercentage, setTaxPercentage] = useState('Select Tax %');
  const [currentStock, setCurrentStock] = useState('30');
  const [isWithoutTax, setIsWithoutTax] = useState(true);

  // Quick edit modal
  const [editDish, setEditDish] = useState<any | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [editStock, setEditStock] = useState('');

  // Initial load
  const loadMenu = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/menu', { cache: 'no-store' });
      if (res.ok) {
        const cats = await res.json();
        if (Array.isArray(cats)) {
          setCategories(cats);
        }
      }
    } catch (e) {
      console.error('Failed to load menu items:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      router.replace('/login');
      return;
    }
    loadMenu();
  }, [router]);

  // Flatten dishes
  const allDishes = useMemo(() => {
    const list: any[] = [];
    categories.forEach((cat) => {
      (cat.items || []).forEach((dish: any) => {
        list.push({
          ...dish,
          categoryName: cat.name,
        });
      });
    });
    return list;
  }, [categories]);

  // Distinct category counts
  const categoryCounts = useMemo(() => {
    const map: Record<string, number> = {};
    allDishes.forEach((d) => {
      const cat = d.categoryName || 'Non-categorized';
      map[cat] = (map[cat] || 0) + 1;
    });
    return map;
  }, [allDishes]);

  // Filtered dishes
  const displayedDishes = useMemo(() => {
    if (selectedCategory === 'All') return allDishes;
    return allDishes.filter((d) => d.categoryName === selectedCategory);
  }, [allDishes, selectedCategory]);

  const handleSignOut = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('ithipooram_user');
      localStorage.removeItem('ithipooram_token');
    }
    router.replace('/login');
  };

  // Add Item Handler (Save Item or Save & Next)
  const handleSaveItem = async (keepOpen = false) => {
    if (!itemName.trim()) {
      alert('Item Name is required');
      return;
    }

    const priceNum = parseFloat(salePrice) || 25;
    const stockNum = parseInt(currentStock, 10) || 30;

    const newDish = {
      id: `dish-${Date.now()}`,
      name: itemName.trim(),
      malayalamName: itemMalayalamName.trim() || undefined,
      category: itemCategory || 'Kerala Specials',
      pricePaise: Math.round(priceNum * 100),
      quantity: stockNum,
      isAvailable: true,
    };

    try {
      await fetch('/api/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newDish.name,
          malayalamName: newDish.malayalamName,
          category: newDish.category,
          pricePaise: newDish.pricePaise,
          currentStock: newDish.quantity,
          station: 'Main Kitchen',
        }),
      });

      await loadMenu();

      // Reset fields
      setItemName('');
      setItemMalayalamName('');
      setSalePrice('');
      setCurrentStock('30');
      if (!keepOpen) {
        setIsAddModalOpen(false);
      }
    } catch (e) {
      alert('Error saving item');
    }
  };

  // Quick edit stock / price update
  const handleSaveEdit = async () => {
    if (!editDish) return;
    const priceNum = parseFloat(editPrice) || 0;
    const stockNum = parseInt(editStock, 10);

    try {
      await fetch('/api/menu', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: editDish.id,
          pricePaise: Math.round(priceNum * 100),
          currentStock: isNaN(stockNum) ? undefined : stockNum,
        }),
      });
      await loadMenu();
    } catch (e) {
      console.error('Failed to update dish:', e);
    }
    setEditDish(null);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#0A0C10] flex flex-col md:flex-row font-sans selection:bg-zinc-800 selection:text-white">
      
      {/* ============================================================== */}
      {/* 1. LEFT SIDEBAR                                                 */}
      {/* ============================================================== */}
      <aside className="hidden md:flex md:w-64 lg:w-72 bg-[#0C0E12] text-zinc-300 flex-col justify-between border-r border-zinc-800 shrink-0 select-none">
        
        {/* Top Brand Logo */}
        <div className="p-4 lg:p-5 border-b border-zinc-800/80">
          <div className="flex items-center justify-between gap-2">
            <Link href="/" className="flex-1 flex items-center justify-start group py-1">
              <img 
                src="/brand-calligraphy-uploaded.png" 
                alt="ഇത്തിപ്പൂരം - Ithi Pooram" 
                className="w-full max-h-16 lg:max-h-20 object-contain invert brightness-200 transition group-hover:scale-102"
              />
            </Link>
            <button 
              onClick={handleSignOut}
              title="Sign Out"
              className="p-1.5 rounded-lg bg-zinc-800/60 hover:bg-zinc-700 text-zinc-400 hover:text-white transition shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-1.5 flex-1">
          <Link
            href="/"
            className="flex items-center space-x-3 px-3.5 py-3 rounded-2xl text-zinc-400 hover:bg-zinc-900 hover:text-white font-bold text-sm transition"
          >
            <Home className="w-4 h-4" />
            <span>Home</span>
          </Link>

          <Link
            href="/qr"
            className="flex items-center space-x-3 px-3.5 py-3 rounded-2xl text-zinc-400 hover:bg-zinc-900 hover:text-white font-bold text-sm transition"
          >
            <Grid3X3 className="w-4 h-4" />
            <span>Table</span>
          </Link>

          {/* Dedicated Billing Link */}
          <Link
            href="/billing"
            className="flex items-center space-x-3 px-3.5 py-3 rounded-2xl text-zinc-400 hover:bg-zinc-900 hover:text-white font-bold text-sm transition"
          >
            <Receipt className="w-4 h-4" />
            <span>Billing</span>
          </Link>

          <Link
            href="/menu"
            className="flex items-center space-x-3 px-3.5 py-3 rounded-2xl bg-white text-black font-extrabold text-sm shadow-md transition"
          >
            <UtensilsCrossed className="w-4 h-4" />
            <span>Items</span>
          </Link>

          {/* Kitchen Display (KDS) */}
          <Link
            href="/kitchen"
            className="flex items-center justify-between px-3.5 py-3 rounded-2xl text-zinc-400 hover:bg-zinc-900 hover:text-white font-bold text-sm transition"
          >
            <div className="flex items-center space-x-3">
              <ChefHat className="w-4 h-4 text-orange-400" />
              <span>Kitchen (KDS)</span>
            </div>
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
          </Link>

          <Link
            href="/users"
            className="flex items-center justify-between px-3.5 py-3 rounded-2xl text-zinc-400 hover:bg-zinc-900 hover:text-white font-bold text-sm transition"
          >
            <div className="flex items-center space-x-3">
              <MoreHorizontal className="w-4 h-4" />
              <span>More</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
          </Link>
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-zinc-800/80 space-y-3">
          <Link
            href="/billing"
            className="w-full flex items-center justify-center py-3 px-4 rounded-2xl border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-white font-extrabold text-xs shadow-sm transition active:scale-98"
          >
            <span>+ Add Order</span>
          </Link>

          <div className="flex items-center justify-between p-2.5 rounded-2xl bg-zinc-900/60 border border-zinc-800">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-white text-black font-black text-xs flex items-center justify-center">
                IP
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-white truncate">Ithi Pooram</p>
                <p className="text-[10px] text-zinc-400 truncate">Vanchiyoor, TVM</p>
              </div>
            </div>
            <button onClick={handleSignOut} className="text-zinc-500 hover:text-white p-1">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ============================================================== */}
      {/* 2. MOBILE TOP BAR                                               */}
      {/* ============================================================== */}
      <header className="md:hidden bg-[#0C0E12] text-white p-4 border-b border-zinc-800 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center space-x-3 flex-1">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-300"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
          </button>
          <img 
            src="/brand-calligraphy-uploaded.png" 
            alt="ഇത്തിപ്പൂരം" 
            className="h-9 w-auto object-contain invert brightness-200"
          />
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-3.5 py-1.5 rounded-xl bg-[#DC2626] text-white font-black text-xs flex items-center space-x-1"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Item</span>
        </button>
      </header>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-[#0C0E12] border-b border-zinc-800 px-4 py-3 space-y-2 z-30">
          <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-zinc-300 font-bold text-sm">
            <Home className="w-4 h-4" />
            <span>Home</span>
          </Link>
          <Link href="/qr" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-zinc-300 font-bold text-sm">
            <Grid3X3 className="w-4 h-4" />
            <span>Table</span>
          </Link>
          <Link href="/billing" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-zinc-300 font-bold text-sm">
            <Receipt className="w-4 h-4" />
            <span>Billing</span>
          </Link>
          <Link href="/menu" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center space-x-3 px-3 py-2.5 rounded-xl bg-white text-black font-black text-sm">
            <UtensilsCrossed className="w-4 h-4" />
            <span>Items</span>
          </Link>
          <Link href="/kitchen" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-zinc-300 font-bold text-sm">
            <ChefHat className="w-4 h-4 text-orange-400" />
            <span>Kitchen (KDS)</span>
          </Link>
          <Link href="/users" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-zinc-300 font-bold text-sm">
            <MoreHorizontal className="w-4 h-4" />
            <span>More</span>
          </Link>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. MAIN ITEMS WORKSPACE (Designed matching uploaded image)      */}
      {/* ============================================================== */}
      <main className="flex-1 flex flex-col w-full overflow-hidden">
        
        {/* Top Header Bar with Red "+ Add Item" Button */}
        <div className="px-6 py-4 bg-white border-b border-zinc-200 flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-black text-black">Menu Items</h1>

          {/* Red Pill "+ Add Item" Button (Matching uploaded screenshot) */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 rounded-2xl bg-[#DC2626] hover:bg-[#B91C1C] text-white font-extrabold text-xs sm:text-sm flex items-center space-x-1.5 shadow-sm transition active:scale-98 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add Item</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Two-Column Layout: Left Category Panel + Right Items Table */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* Left Sub-Panel: Categories */}
          <div className="w-full md:w-60 lg:w-64 bg-white border-b md:border-b-0 md:border-r border-zinc-200 p-4 space-y-3 shrink-0">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-400">
                CATEGORY
              </span>
              <button 
                onClick={() => {
                  const cat = prompt('Enter new category name:');
                  if (cat && cat.trim()) {
                    setCategories((prev) => [...prev, { id: `cat-${Date.now()}`, name: cat.trim(), items: [] }]);
                  }
                }}
                className="text-[11px] font-extrabold text-zinc-700 hover:text-black flex items-center space-x-0.5"
              >
                <span>+ Add</span>
              </button>
            </div>

            <div className="space-y-1">
              {/* "All" Category Pill */}
              <button
                onClick={() => setSelectedCategory('All')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-extrabold transition cursor-pointer ${
                  selectedCategory === 'All'
                    ? 'bg-blue-50 text-blue-600 shadow-xs'
                    : 'text-zinc-600 hover:bg-zinc-50'
                }`}
              >
                <span>All</span>
                <span className="font-mono text-blue-600">{allDishes.length}</span>
              </button>

              {/* Dynamic Categories */}
              {Object.entries(categoryCounts).map(([catName, count]) => (
                <button
                  key={catName}
                  onClick={() => setSelectedCategory(catName)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer ${
                    selectedCategory === catName
                      ? 'bg-zinc-100 text-black font-extrabold shadow-xs'
                      : 'text-zinc-600 hover:bg-zinc-50'
                  }`}
                >
                  <span className="truncate pr-2">{catName}</span>
                  <span className="font-mono text-zinc-400 text-[11px]">{count}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Right Main Table: Menu Items List */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
            <div className="bg-white rounded-3xl border border-zinc-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-zinc-800">
                  <thead className="bg-zinc-50 text-[10px] font-extrabold uppercase tracking-wider text-zinc-500 border-b border-zinc-200">
                    <tr>
                      <th className="py-3 px-4 w-10 text-center">
                        <span className="w-3.5 h-3.5 rounded border border-zinc-300 inline-block bg-white" />
                      </th>
                      <th className="py-3 px-4">ITEM NAME</th>
                      <th className="py-3 px-4">PRICE</th>
                      <th className="py-3 px-4">STOCK</th>
                      <th className="py-3 px-4 text-right">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {displayedDishes.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-16 text-center text-zinc-400 font-medium">
                          No menu items found. Click &quot;+ Add Item&quot; to register your first dish.
                        </td>
                      </tr>
                    ) : (
                      displayedDishes.map((dish: any) => (
                        <tr key={dish.id} className="hover:bg-zinc-50/70 transition">
                          <td className="py-3.5 px-4 text-center">
                            <span className="w-3.5 h-3.5 rounded border border-zinc-300 inline-block bg-white" />
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center font-bold text-xs text-zinc-600 shrink-0">
                                {dish.name.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-extrabold text-black text-sm">{dish.name}</div>
                                {dish.malayalamName && (
                                  <div className="text-[11px] font-semibold text-zinc-500 font-malayalam">
                                    {dish.malayalamName}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-mono font-extrabold text-black text-sm">
                            ₹{((dish.pricePaise || 0) / 100).toFixed(0)}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-zinc-600">
                            {dish.quantity || 39}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="inline-flex items-center space-x-2">
                              <button
                                onClick={() => {
                                  setEditDish(dish);
                                  setEditPrice(((dish.pricePaise || 0) / 100).toString());
                                  setEditStock((dish.quantity || 39).toString());
                                }}
                                className="p-1.5 rounded-lg text-zinc-400 hover:text-black hover:bg-zinc-100 transition"
                                title="Edit Price & Stock"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </div>

      </main>

      {/* ============================================================== */}
      {/* ADD MENU ITEM MODAL (Optimized for Mobile Soft Keyboard)        */}
      {/* ============================================================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-zinc-200 animate-in zoom-in-95 duration-100 flex flex-col max-h-[92dvh] overflow-hidden my-auto">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-zinc-100 shrink-0">
              <h2 className="text-base font-black text-black">Add Menu Item</h2>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-black flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Form Body with pb-40 so users can scroll up over mobile keyboard */}
            <div className="flex-1 overflow-y-auto py-3 space-y-4 text-xs pr-1">
              
              {/* Row 1: Item Name & Item Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-800 font-extrabold mb-1">
                    Item Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    placeholder="e.g. Masala Dosa"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-blue-500 text-xs font-semibold text-black outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  <div className="mt-1.5">
                    <input
                      type="text"
                      value={itemMalayalamName}
                      onChange={(e) => setItemMalayalamName(e.target.value)}
                      placeholder="e.g. മസാല ദോശ (Malayalam Name optional)"
                      className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-700 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-zinc-800 font-extrabold mb-1">
                    Item Category
                  </label>
                  <div className="relative">
                    <select
                      value={itemCategory}
                      onChange={(e) => setItemCategory(e.target.value)}
                      className="appearance-none w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 text-xs font-bold text-zinc-700 outline-none bg-white cursor-pointer pr-8"
                    >
                      <option value="">Select Category</option>
                      <option value="Seafood Specials">Seafood Specials</option>
                      <option value="Traditional Meals">Traditional Meals</option>
                      <option value="Snacks &amp; Tiffin">Snacks &amp; Tiffin</option>
                      <option value="Beverages">Beverages</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-blue-500">
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Mark as Favourite Checkbox */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="favourite"
                  checked={isFavourite}
                  onChange={(e) => setIsFavourite(e.target.checked)}
                  className="w-4 h-4 rounded border-zinc-300 accent-blue-600"
                />
                <label htmlFor="favourite" className="text-zinc-700 font-semibold cursor-pointer">
                  Mark as Favourite
                </label>
              </div>

              {/* Row 2: Sale Price, Tax Percentage, Current Stock */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Sale Price */}
                <div>
                  <label className="block text-zinc-800 font-extrabold mb-1">
                    Sale Price (₹)
                  </label>
                  <div className="flex items-center rounded-xl border border-zinc-300 overflow-hidden focus-within:border-blue-500">
                    <input
                      type="number"
                      value={salePrice}
                      onChange={(e) => setSalePrice(e.target.value)}
                      placeholder="e.g. 25"
                      className="flex-1 px-3 py-2 text-xs font-bold text-black outline-none font-mono"
                    />
                    <div className="px-2.5 py-2 bg-zinc-50 border-l border-zinc-200 text-blue-600 font-bold text-[11px] flex items-center space-x-1">
                      <span>Without Tax</span>
                    </div>
                  </div>
                </div>

                {/* Tax Percentage */}
                <div>
                  <label className="block text-zinc-800 font-extrabold mb-1">
                    Tax Percentage
                  </label>
                  <div className="relative">
                    <select
                      value={taxPercentage}
                      onChange={(e) => setTaxPercentage(e.target.value)}
                      className="appearance-none w-full px-3 py-2 rounded-xl border border-zinc-300 text-xs font-bold text-zinc-700 outline-none bg-white cursor-pointer pr-8"
                    >
                      <option value="Select Tax %">Select Tax %</option>
                      <option value="0%">0% (Exempted)</option>
                      <option value="5%">5% (GST)</option>
                      <option value="12%">12%</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-blue-500">
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* Current Stock */}
                <div>
                  <label className="block text-zinc-800 font-extrabold mb-1">
                    Current Stock
                  </label>
                  <input
                    type="number"
                    value={currentStock}
                    onChange={(e) => setCurrentStock(e.target.value)}
                    placeholder="e.g. 30"
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300 text-xs font-bold text-black outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              {/* Kerala Cuisine Quick Presets & AI Image Box */}
              <div>
                <label className="block text-zinc-800 font-extrabold mb-1">
                  Item Image / വിഭവത്തിന്റെ ചിത്രം
                </label>
                <div className="border border-dashed border-blue-400 rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center text-center space-y-2.5 bg-blue-50/20">
                  <p className="text-zinc-600 text-xs font-bold">
                    Quick Kerala Preset Photos (1-Tap):
                  </p>
                  <div className="flex flex-wrap gap-1.5 justify-center">
                    {['Porotta', 'Fish Fry', 'Appam', 'Biryani', 'Meals', 'Chai'].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => {
                          if (!itemName) setItemName(preset);
                          alert(`✓ Selected photo preset for ${preset}!`);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-white border border-zinc-200 hover:border-black text-[11px] font-extrabold text-zinc-800 transition cursor-pointer"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>

                  <p className="text-zinc-400 text-[11px] pt-1">
                    Or upload camera photo from phone storage or generate via AI.
                  </p>
                  <div className="flex items-center space-x-2 pt-1">
                    <label className="px-3.5 py-1.5 rounded-xl border border-zinc-300 bg-white text-zinc-800 font-bold text-xs hover:border-black transition cursor-pointer flex items-center space-x-1.5 shadow-xs">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Phone Gallery / Camera</span>
                      <input type="file" accept="image/*" className="hidden" />
                    </label>
                    <button
                      type="button"
                      onClick={() => alert(`AI image generation queued for "${itemName || 'Kerala Dish'}"`)}
                      className="px-3.5 py-1.5 rounded-xl border border-blue-500 bg-white text-blue-600 font-bold text-xs hover:bg-blue-50 transition flex items-center space-x-1.5 shadow-xs cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>AI Generate</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Extra spacing padding for mobile keyboard view */}
              <div className="h-28 sm:h-2" />

            </div>

            {/* Bottom Actions: Sticky at bottom */}
            <div className="pt-3 border-t border-zinc-100 flex items-center justify-end space-x-2.5 shrink-0 bg-white">
              <button
                type="button"
                onClick={() => handleSaveItem(false)}
                className="px-5 py-2.5 rounded-xl bg-black hover:bg-zinc-800 text-white font-extrabold text-xs transition cursor-pointer shadow-xs"
              >
                Save Item
              </button>
              <button
                type="button"
                onClick={() => handleSaveItem(true)}
                className="px-5 py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-extrabold text-xs transition cursor-pointer"
              >
                Save &amp; Next
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Quick Edit Modal */}
      {editDish && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-zinc-200">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <h3 className="font-black text-black text-base">Edit Dish</h3>
              <button onClick={() => setEditDish(null)} className="text-zinc-400 hover:text-black">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-4 space-y-3.5 text-xs">
              <div className="font-extrabold text-black text-sm">{editDish.name}</div>
              <div>
                <label className="block font-bold text-zinc-700 uppercase tracking-wider mb-1">
                  Price (₹):
                </label>
                <input
                  type="number"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 font-mono font-bold text-black"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-700 uppercase tracking-wider mb-1">
                  Available Stock:
                </label>
                <input
                  type="number"
                  value={editStock}
                  onChange={(e) => setEditStock(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 font-mono font-bold text-black"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditDish(null)}
                  className="px-4 py-2 rounded-xl text-zinc-600 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="px-5 py-2 rounded-xl bg-black text-white font-black hover:bg-zinc-800 transition"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
