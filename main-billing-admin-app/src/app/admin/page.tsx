'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  BarChart3, 
  TrendingUp, 
  ArrowLeft,
  Lock,
  Utensils,
  KeyRound
} from 'lucide-react';
import { apiRequest, getCurrentUser } from '../../lib/api';

export default function AdminOverviewPage() {
  const router = useRouter();
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Admin Password Protection State
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  // Check session unlock status on mount
  useEffect(() => {
    if (!getCurrentUser()) {
      router.replace('/login');
      return;
    }
    if (typeof window !== 'undefined') {
      const unlocked = sessionStorage.getItem('ithi_executive_admin_unlocked');
      if (unlocked === 'true') {
        setIsUnlocked(true);
      }
    }
  }, [router]);

  const loadOverview = async () => {
    try {
      setLoading(true);
      const res = await apiRequest(`/admin/overview?range=today`);
      setData(res);
    } catch (err) {
      console.error('Failed to load overview:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isUnlocked) {
      loadOverview();
      const interval = setInterval(loadOverview, 4000);
      return () => clearInterval(interval);
    }
  }, [isUnlocked]);

  // Handle Admin Password Verification
  const handleVerifyPassword = (e: React.FormEvent) => {
    e.preventDefault();
    const entered = passwordInput.trim();

    // Check universal master PIN (1111), standard admin passwords, or registered MAIN_ADMIN PINs
    let isValid = entered === '1111' || entered.toLowerCase() === 'admin' || entered === 'admin123';

    if (!isValid && typeof window !== 'undefined') {
      const savedUsers = localStorage.getItem('ithipooram_registered_users');
      if (savedUsers) {
        try {
          const list = JSON.parse(savedUsers);
          if (Array.isArray(list)) {
            const admin = list.find((u: any) => u.role === 'MAIN_ADMIN' && (u.pin === entered || u.password === entered));
            if (admin) isValid = true;
          }
        } catch (e) {}
      }

      const currentUser = getCurrentUser();
      if (currentUser && (currentUser.pin === entered || currentUser.role === 'MAIN_ADMIN' && entered === currentUser.pin)) {
        isValid = true;
      }
    }

    if (isValid) {
      setIsUnlocked(true);
      setPasswordError('');
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('ithi_executive_admin_unlocked', 'true');
      }
    } else {
      setPasswordError('Incorrect Admin Password. Access restricted to Admin only.');
    }
  };

  const formatRupees = (paise: number = 0) => `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  // If password locked: show clean Admin Password verification screen
  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-parchment-50 flex items-center justify-center p-4 font-sans">
        <div className="bg-white rounded-3xl max-w-sm w-full p-6 sm:p-8 shadow-xl border border-parchment-300 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#9E341D] text-white flex items-center justify-center mx-auto mb-4 shadow-md">
            <Lock className="w-7 h-7" />
          </div>

          <h2 className="text-lg font-black text-slatepos-950 tracking-tight">Executive Admin Console</h2>
          <p className="text-xs font-semibold text-slatepos-500 mt-1 mb-6">Enter Admin Password to enter</p>

          <form onSubmit={handleVerifyPassword} className="space-y-4">
            <div>
              <input
                type="password"
                required
                autoFocus
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  setPasswordError('');
                }}
                placeholder="Enter Admin Password"
                className="w-full px-4 py-3 rounded-2xl border-2 border-stone-800 text-sm font-bold text-center text-black bg-parchment-50 focus:bg-white focus:outline-none focus:border-[#9E341D] transition"
              />
            </div>

            {passwordError && (
              <p className="text-xs font-bold text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200">
                {passwordError}
              </p>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-[#9E341D] hover:bg-[#852B17] text-white font-black text-xs uppercase tracking-wider shadow-md active:scale-98 transition cursor-pointer"
            >
              Enter Console
            </button>

            <button
              type="button"
              onClick={handleBack}
              className="w-full py-2 text-xs font-bold text-slatepos-500 hover:text-slatepos-900 transition"
            >
              Cancel &amp; Return
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-parchment-50 flex flex-col font-sans">
      {/* Top Header - Kept only Back button and Heading as requested */}
      <header className="bg-slatepos-900 border-b border-slatepos-800 text-white px-4 sm:px-6 py-4 sticky top-0 z-30 flex items-center">
        <div className="flex items-center space-x-3.5">
          <button 
            onClick={handleBack} 
            className="p-2 rounded-xl bg-slatepos-800 hover:bg-slatepos-700 text-slatepos-300 transition-colors"
            title="Back to Previous Page"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center text-white font-bold shadow-md shrink-0">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-extrabold tracking-tight">Executive Admin Console</h1>
          </div>
        </div>
      </header>

      {/* Main Analytics Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full flex-1 space-y-6 pb-28">
        {loading && !data ? (
          <div className="py-24 text-center">
            <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-xs text-slatepos-500">Loading live analytics...</p>
          </div>
        ) : (
          <>
            {/* KPI Summary Cards - Today's Total Sale & Total Orders */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-parchment-200 shadow-2xs">
                <span className="text-xs font-bold text-slatepos-400 uppercase tracking-wider">Today's Total Sale</span>
                <div className="text-3xl font-black mt-1.5 font-mono text-[#9E341D]">
                  {formatRupees(data?.kpis?.grossSalesPaise)}
                </div>
                <div className="flex items-center text-xs text-emerald-600 font-semibold mt-2.5">
                  <TrendingUp className="w-3.5 h-3.5 mr-1" />
                  <span>{data?.kpis?.paidOrdersCount || 0} checks settled in billing database</span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-parchment-200 shadow-2xs">
                <span className="text-xs font-bold text-slatepos-400 uppercase tracking-wider">Total Orders</span>
                <div className="text-3xl font-black text-slatepos-950 mt-1.5 font-mono">
                  {data?.kpis?.totalOrdersCount || 0}
                </div>
                <div className="text-xs text-slatepos-500 mt-2.5">{data?.kpis?.unpaidOrdersCount || 0} open tickets currently active</div>
              </div>
            </div>

            {/* Tables & Rankings - Top Dishes connected to Customer Ordering System */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Selling Dishes - Synced with Customer Ordering System */}
              <div className="bg-white p-5 rounded-2xl border border-parchment-200 shadow-2xs">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-parchment-100">
                  <div className="flex items-center space-x-2">
                    <Utensils className="w-4 h-4 text-[#9E341D]" />
                    <h3 className="text-sm font-bold text-slatepos-900">Top Dishes</h3>
                  </div>
                  <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full uppercase">
                    Customer Ordering Synced
                  </span>
                </div>

                <div className="divide-y divide-parchment-100">
                  {!data?.topSellingItems || data.topSellingItems.length === 0 ? (
                    <div className="py-8 text-center text-slatepos-400 text-xs">
                      No customer orders placed yet. Dishes ordered by customers will automatically rank here live.
                    </div>
                  ) : (
                    data.topSellingItems.map((it: any, idx: number) => (
                      <div key={it.name || idx} className="py-2.5 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold font-mono ${
                            idx === 0 ? 'bg-[#9E341D] text-white' : idx === 1 ? 'bg-amber-500 text-slatepos-950' : 'bg-parchment-100 text-slatepos-700'
                          }`}>
                            {idx + 1}
                          </span>
                          <div>
                            <span className="text-xs font-bold text-slatepos-900">{it.name}</span>
                            <div className="text-[10px] text-emerald-700 font-semibold">{it.quantity} {it.quantity === 1 ? 'order' : 'orders'} placed by customers</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold text-slatepos-950 font-mono">
                            {formatRupees(it.totalPaise)}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Table Revenue */}
              <div className="bg-white p-5 rounded-2xl border border-parchment-200 shadow-2xs">
                <h3 className="text-sm font-bold text-slatepos-900 mb-3 pb-2 border-b border-parchment-100">Table-Wise Revenue</h3>
                <div className="divide-y divide-parchment-100">
                  {!data?.tableWiseSales || data.tableWiseSales.length === 0 ? (
                    <div className="py-8 text-center text-slatepos-400 text-xs">
                      No table revenue recorded yet.
                    </div>
                  ) : (
                    data.tableWiseSales.map((t: any) => (
                      <div key={t.tableCode} className="py-2.5 flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded bg-brand-50 text-brand-700 font-mono font-bold text-xs border border-brand-200">
                          {t.tableCode}
                        </span>
                        <span className="text-xs font-bold text-slatepos-900 font-mono">
                          {formatRupees(t.totalPaise)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
