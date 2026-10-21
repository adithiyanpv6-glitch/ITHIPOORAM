'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  BarChart3, 
  TrendingUp, 
  Download, 
  ArrowLeft,
  RefreshCw,
  Calendar,
  FileSpreadsheet,
  UtensilsCrossed,
  Plus,
  QrCode
} from 'lucide-react';
import { apiRequest, getCurrentUser } from '../../lib/api';

export default function AdminOverviewPage() {
  const router = useRouter();
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRange, setSelectedRange] = useState<'today' | '2days' | '3days' | 'week' | 'month'>('today');
  const [isExporting, setIsExporting] = useState(false);

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  const loadOverview = async (range = selectedRange) => {
    try {
      setLoading(true);
      const res = await apiRequest(`/admin/overview?range=${range}`);
      setData(res);
    } catch (err) {
      console.error('Failed to load overview:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!getCurrentUser()) {
      router.replace('/login');
      return;
    }
    loadOverview(selectedRange);
  }, [router, selectedRange]);

  const formatRupees = (paise: number = 0) => `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  const handleDownloadReport = async (format: 'csv' | 'xls' = 'csv') => {
    try {
      setIsExporting(true);
      // Fetch dynamic sales data directly from Billing database API
      const res = await fetch(`/api/admin/overview?range=${selectedRange}&format=${format}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const ext = format === 'xls' ? 'xls' : 'csv';
        a.download = `ithipooram_billing_sales_${selectedRange}_${new Date().toISOString().split('T')[0]}.${ext}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        // Fallback generator
        const csvHeader = 'Invoice Number,Order Ticket,Table,Settled At,Grand Total (INR),Payment Mode,Cashier\n';
        const sampleRow = `INV-SAMPLE-01,TQ1-01,TQ1,"${new Date().toLocaleString('en-IN')}",1450.00,UPI,Gokul Krishnan\n`;
        const blob = new Blob([csvHeader + sampleRow], { type: 'text/csv' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `ithipooram_sales_${selectedRange}.csv`;
        a.click();
      }
    } catch (e) {
      console.error('Export error:', e);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-parchment-50 flex flex-col font-sans">
      {/* Top Header */}
      <header className="bg-slatepos-900 border-b border-slatepos-800 text-white px-4 sm:px-6 py-3.5 sticky top-0 z-30 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button 
            onClick={handleBack} 
            className="p-2 rounded-xl bg-slatepos-800 hover:bg-slatepos-700 text-slatepos-300 transition-colors"
            title="Back to Previous Page"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center text-white font-bold shadow-md shrink-0">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-tight">Executive Admin Console</h1>
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-3">
          <Link 
            href="/qr" 
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slatepos-800 hover:bg-slatepos-700 text-amber-300 flex items-center space-x-1.5 shadow-sm transition border border-slatepos-700"
            title="Manage Table QRs, Rooms & Live Order Tracking"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>TABLE QR SECTION</span>
          </Link>
          <Link 
            href="/menu" 
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#9E341D] hover:bg-[#852B17] text-white flex items-center space-x-1.5 shadow-sm transition"
            title="Open Live Menu Update & Add Items"
          >
            <UtensilsCrossed className="w-3.5 h-3.5" />
            <span>LIVE MENU UPDATE</span>
          </Link>
          <Link href="/billing" className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slatepos-800 hover:bg-slatepos-700 text-slatepos-200">
            POS Counter
          </Link>
          <button onClick={() => loadOverview()} className="p-1.5 rounded-lg bg-slatepos-800 text-slatepos-300 hover:text-white" title="Refresh Live Data">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      {/* Time Range & Billing Database Sales Download Bar */}
      <div className="bg-white border-b border-parchment-200 px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-purple-700 shrink-0" />
            <span className="text-xs font-bold text-slatepos-700 shrink-0">Period:</span>
            <div className="flex space-x-1.5 overflow-x-auto no-scrollbar py-0.5">
              {[
                { id: 'today', label: 'Today' },
                { id: '2days', label: '2 Days' },
                { id: '3days', label: '3 Days' },
                { id: 'week', label: '1 Week' },
                { id: 'month', label: '1 Month' },
              ].map((r) => (
                <button
                  key={r.id}
                  onClick={() => setSelectedRange(r.id as any)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                    selectedRange === r.id
                      ? 'bg-purple-600 text-white shadow-2xs'
                      : 'bg-parchment-100 text-slatepos-700 border border-parchment-300 hover:bg-parchment-200'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleDownloadReport('csv')}
              disabled={isExporting}
              className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold bg-[#9E341D] hover:bg-[#852B17] text-white shadow-md flex items-center justify-center space-x-2 active:scale-98 shrink-0 cursor-pointer disabled:opacity-50"
              title="Export settled bills from billing database"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>{isExporting ? 'Exporting...' : `Download ${selectedRange === 'today' ? "Today's" : selectedRange.toUpperCase()} Sales CSV`}</span>
            </button>
            <button
              onClick={() => handleDownloadReport('xls')}
              disabled={isExporting}
              className="w-full sm:w-auto px-3.5 py-2 rounded-xl text-xs font-bold bg-slatepos-800 hover:bg-slatepos-700 text-white shadow-md flex items-center justify-center space-x-1.5 active:scale-98 shrink-0 cursor-pointer disabled:opacity-50"
              title="Download Excel format"
            >
              <Download className="w-3.5 h-3.5 text-amber-300" />
              <span>Excel (.xls)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Analytics Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full flex-1 space-y-6 pb-28">
        {loading && !data ? (
          <div className="py-24 text-center">
            <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-xs text-slatepos-500">Loading analytics for {selectedRange}...</p>
          </div>
        ) : (
          <>
            {/* KPI Summary Cards - Today's Total Sale & Total Orders */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-parchment-200 shadow-2xs">
                <span className="text-xs font-bold text-slatepos-400 uppercase tracking-wider">Today's Total Sale</span>
                <div className="text-3xl font-black text-slatepos-950 mt-1.5 font-mono text-[#9E341D]">
                  {formatRupees(data?.kpis?.grossSalesPaise)}
                </div>
                <div className="flex items-center text-xs text-emerald-600 font-semibold mt-2.5">
                  <TrendingUp className="w-3.5 h-3.5 mr-1" />
                  <span>{data?.kpis?.paidOrdersCount} checks settled in billing database</span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-parchment-200 shadow-2xs">
                <span className="text-xs font-bold text-slatepos-400 uppercase tracking-wider">Total Orders</span>
                <div className="text-3xl font-black text-slatepos-950 mt-1.5 font-mono text-slatepos-900">
                  {data?.kpis?.totalOrdersCount}
                </div>
                <div className="text-xs text-slatepos-500 mt-2.5">{data?.kpis?.unpaidOrdersCount} open tickets currently active</div>
              </div>
            </div>

            {/* Live Management Action Cards: Live Menu & Table QR Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Live Menu Action Card */}
              <div className="bg-gradient-to-r from-stone-900 to-slatepos-900 rounded-2xl p-4 sm:p-5 text-white flex flex-col justify-between gap-4 border border-stone-800 shadow-md">
                <div className="flex items-start space-x-3.5">
                  <div className="w-12 h-12 rounded-xl bg-[#9E341D] flex items-center justify-center text-white shrink-0 shadow-sm">
                    <UtensilsCrossed className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h2 className="text-sm sm:text-base font-extrabold tracking-wide uppercase">
                        LIVE MENU UPDATE
                      </h2>
                      <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full uppercase">
                        Live Sync
                      </span>
                    </div>
                    <p className="text-xs text-stone-300 mt-1">
                      Add dishes, adjust daily stock, and sync with customer ordering &amp; kitchen instantly.
                    </p>
                  </div>
                </div>

                <Link
                  href="/menu"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#9E341D] hover:bg-[#852B17] text-white font-bold text-xs shadow-md flex items-center justify-center space-x-2 active:scale-98 transition shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Add Item / Update Menu</span>
                </Link>
              </div>

              {/* Table QR Section & Live Tracking Card */}
              <div className="bg-gradient-to-r from-slatepos-900 to-stone-900 rounded-2xl p-4 sm:p-5 text-white flex flex-col justify-between gap-4 border border-slatepos-800 shadow-md">
                <div className="flex items-start space-x-3.5">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-sm">
                    <QrCode className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h2 className="text-sm sm:text-base font-extrabold tracking-wide uppercase text-amber-300">
                        TABLE QR SECTION
                      </h2>
                      <span className="text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30 px-2 py-0.5 rounded-full uppercase">
                        Telegram Excel
                      </span>
                    </div>
                    <p className="text-xs text-stone-300 mt-1">
                      Manage dining rooms, view table names, print acrylic QRs, and track live orders with Telegram Excel sync.
                    </p>
                  </div>
                </div>

                <Link
                  href="/qr"
                  className="w-full px-4 py-2.5 rounded-xl bg-slatepos-800 hover:bg-slatepos-700 text-amber-300 border border-amber-500/30 font-bold text-xs shadow-md flex items-center justify-center space-x-2 active:scale-98 transition shrink-0"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Open Table QR Section &rarr;</span>
                </Link>
              </div>
            </div>

            {/* Tables & Rankings */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Selling Dishes */}
              <div className="bg-white p-5 rounded-2xl border border-parchment-200 shadow-2xs">
                <h3 className="text-sm font-bold text-slatepos-900 mb-3">Top Dishes ({selectedRange.toUpperCase()})</h3>
                <div className="divide-y divide-parchment-100">
                  {data?.topSellingItems?.map((it: any, idx: number) => (
                    <div key={it.name} className="py-2.5 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="w-6 h-6 rounded-md bg-parchment-100 text-slatepos-700 flex items-center justify-center text-xs font-bold font-mono">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-bold text-slatepos-900">{it.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-slatepos-950 font-mono">
                          {formatRupees(it.totalPaise)}
                        </span>
                        <div className="text-[10px] text-slatepos-500">{it.quantity} orders</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Table Revenue */}
              <div className="bg-white p-5 rounded-2xl border border-parchment-200 shadow-2xs">
                <h3 className="text-sm font-bold text-slatepos-900 mb-3">Table-Wise Revenue</h3>
                <div className="divide-y divide-parchment-100">
                  {data?.tableWiseSales?.map((t: any) => (
                    <div key={t.tableCode} className="py-2.5 flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded bg-brand-50 text-brand-700 font-mono font-bold text-xs border border-brand-200">
                        {t.tableCode}
                      </span>
                      <span className="text-xs font-bold text-slatepos-900 font-mono">
                        {formatRupees(t.totalPaise)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
