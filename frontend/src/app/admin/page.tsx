'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  Clock, 
  AlertTriangle, 
  FileSpreadsheet, 
  Download, 
  Users, 
  QrCode, 
  UtensilsCrossed, 
  ShieldCheck, 
  Receipt,
  LogOut,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { apiRequest, getCurrentUser } from '../../lib/api';

export default function AdminDashboardPage() {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  const loadOverview = async () => {
    try {
      setLoading(true);
      const res = await apiRequest('/admin/overview');
      setData(res);
    } catch (err) {
      console.error('Failed to load admin overview:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setUser(getCurrentUser());
    loadOverview();
  }, []);

  const formatRupees = (paise: number = 0) => `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  const handleExportCsv = (type: 'sales' | 'items' | 'audit') => {
    const token = localStorage.getItem('ithipooram_token');
    const url = `http://localhost:5000/api/admin/reports/export-csv?reportType=${type}`;
    
    // Trigger direct download with bearer token via fetch blob
    fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.blob())
      .then((blob) => {
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = `ithipooram_${type}_report_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
      })
      .catch((e) => alert('Export failed: ' + e.message));
  };

  return (
    <div className="min-h-screen bg-parchment-50 flex flex-col font-sans">
      {/* Admin Header */}
      <header className="bg-slatepos-900 border-b border-slatepos-800 text-white px-6 py-3.5 sticky top-0 z-30 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center text-white font-bold shadow-md">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-extrabold tracking-tight">EXECUTIVE MANAGEMENT CONSOLE</h1>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-900/60 text-purple-300 border border-purple-700">
                MAIN_ADMIN
              </span>
            </div>
            <p className="text-xs text-slatepos-400">
              Ithi Pooram • Live Financials, Stock & Audit Control
            </p>
          </div>
        </div>

        {/* Navigation & Logout */}
        <div className="flex items-center space-x-3">
          <Link
            href="/billing"
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slatepos-800 hover:bg-slatepos-700 text-slatepos-200"
          >
            Counter POS
          </Link>
          <Link
            href="/kitchen"
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slatepos-800 hover:bg-slatepos-700 text-slatepos-200"
          >
            Kitchen Display
          </Link>
          <button
            onClick={loadOverview}
            className="p-1.5 rounded-lg bg-slatepos-800 text-slatepos-300 hover:text-white"
            title="Refresh analytics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Link
            href="/login"
            className="p-1.5 rounded-lg bg-slatepos-800 hover:bg-red-950/60 text-slatepos-400 hover:text-red-300"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* Sub-navigation tabs */}
      <div className="bg-white border-b border-parchment-200 px-6 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <nav className="flex space-x-4">
            <Link
              href="/admin"
              className="text-xs font-bold text-brand-700 border-b-2 border-brand-600 pb-1 flex items-center space-x-1"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Overview & KPIs</span>
            </Link>
            <Link
              href="/admin/qr-manager"
              className="text-xs font-medium text-slatepos-600 hover:text-slatepos-900 pb-1 flex items-center space-x-1"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Table QR Stands</span>
            </Link>
            <Link
              href="/admin/menu-manager"
              className="text-xs font-medium text-slatepos-600 hover:text-slatepos-900 pb-1 flex items-center space-x-1"
            >
              <UtensilsCrossed className="w-3.5 h-3.5" />
              <span>Menu & Live Stock</span>
            </Link>
            <Link
              href="/admin/audit-logs"
              className="text-xs font-medium text-slatepos-600 hover:text-slatepos-900 pb-1 flex items-center space-x-1"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Security Audit Trail</span>
            </Link>
            <Link
              href="/admin/users"
              className="text-xs font-medium text-slatepos-600 hover:text-slatepos-900 pb-1 flex items-center space-x-1"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Staff Accounts & PINs</span>
            </Link>
          </nav>

          {/* Quick CSV Export Actions */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleExportCsv('sales')}
              className="px-3 py-1 rounded-lg text-xs font-semibold bg-parchment-100 hover:bg-parchment-200 text-slatepos-700 flex items-center space-x-1 border border-parchment-200"
            >
              <Download className="w-3 h-3 text-brand-600" />
              <span>Sales CSV</span>
            </button>
            <button
              onClick={() => handleExportCsv('items')}
              className="px-3 py-1 rounded-lg text-xs font-semibold bg-parchment-100 hover:bg-parchment-200 text-slatepos-700 flex items-center space-x-1 border border-parchment-200"
            >
              <Download className="w-3 h-3 text-brand-600" />
              <span>Items CSV</span>
            </button>
            <button
              onClick={() => handleExportCsv('audit')}
              className="px-3 py-1 rounded-lg text-xs font-semibold bg-parchment-100 hover:bg-parchment-200 text-slatepos-700 flex items-center space-x-1 border border-parchment-200"
            >
              <Download className="w-3 h-3 text-brand-600" />
              <span>Audit CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Body */}
      <main className="max-w-7xl mx-auto px-6 py-6 w-full flex-1">
        {loading && !data ? (
          <div className="py-24 text-center">
            <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-sm font-semibold text-slatepos-500">Computing real-time executive analytics...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* KPI Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Gross Sales */}
              <div className="bg-white p-5 rounded-2xl border border-parchment-200 shadow-2xs">
                <span className="text-xs font-bold text-slatepos-400 uppercase tracking-wider">
                  Today&apos;s Gross Sales
                </span>
                <div className="text-2xl font-black text-slatepos-950 mt-1 font-mono">
                  {formatRupees(data?.kpis?.grossSalesPaise)}
                </div>
                <div className="flex items-center text-xs text-emerald-600 font-semibold mt-2">
                  <TrendingUp className="w-3.5 h-3.5 mr-1" />
                  <span>{data?.kpis?.paidOrdersCount} bills paid</span>
                </div>
              </div>

              {/* Total Orders */}
              <div className="bg-white p-5 rounded-2xl border border-parchment-200 shadow-2xs">
                <span className="text-xs font-bold text-slatepos-400 uppercase tracking-wider">
                  Total Orders Placed
                </span>
                <div className="text-2xl font-black text-slatepos-950 mt-1 font-mono">
                  {data?.kpis?.totalOrdersCount}
                </div>
                <div className="text-xs text-slatepos-500 mt-2">
                  {data?.kpis?.unpaidOrdersCount} currently open / dining
                </div>
              </div>

              {/* Average Order Value */}
              <div className="bg-white p-5 rounded-2xl border border-parchment-200 shadow-2xs">
                <span className="text-xs font-bold text-slatepos-400 uppercase tracking-wider">
                  Avg. Order Value (AOV)
                </span>
                <div className="text-2xl font-black text-slatepos-950 mt-1 font-mono">
                  {formatRupees(data?.kpis?.averageOrderValuePaise)}
                </div>
                <div className="text-xs text-slatepos-500 mt-2">
                  Per settled dining check
                </div>
              </div>

              {/* Unpaid / Active Order Liability */}
              <div className="bg-white p-5 rounded-2xl border border-parchment-200 shadow-2xs">
                <span className="text-xs font-bold text-slatepos-400 uppercase tracking-wider">
                  Cancelled / Discounts
                </span>
                <div className="text-2xl font-black text-slatepos-950 mt-1 font-mono">
                  {formatRupees(data?.kpis?.discountPaise)}
                </div>
                <div className="text-xs text-slatepos-500 mt-2">
                  {data?.kpis?.cancelledOrdersCount} cancelled tickets
                </div>
              </div>
            </div>

            {/* Split Row: Payment Breakdown & Stock Alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Payment Mode Share */}
              <div className="bg-white p-5 rounded-2xl border border-parchment-200 shadow-2xs">
                <h3 className="text-sm font-bold text-slatepos-900 mb-3">
                  Sales by Payment Method
                </h3>
                <div className="space-y-3">
                  {Object.entries(data?.salesByPaymentType || {}).length === 0 ? (
                    <p className="text-xs text-slatepos-400 py-4 text-center">No payment data yet today</p>
                  ) : (
                    Object.entries(data?.salesByPaymentType || {}).map(([mode, paise]: [string, any]) => {
                      const totalGross = data?.kpis?.grossSalesPaise || 1;
                      const percent = Math.round((paise / totalGross) * 100);
                      return (
                        <div key={mode} className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-slatepos-700">{mode.replace('_', ' ')}</span>
                            <span className="text-slatepos-950 font-mono">
                              {formatRupees(paise)} ({percent}%)
                            </span>
                          </div>
                          <div className="w-full bg-parchment-200 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-brand-600 h-full rounded-full transition-all duration-300"
                              style={{ width: `${percent}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Low Stock Alerts */}
              <div className="bg-white p-5 rounded-2xl border border-parchment-200 shadow-2xs lg:col-span-2">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-slatepos-900 flex items-center space-x-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span>Inventory & Out-of-Stock Watch</span>
                  </h3>
                  <Link
                    href="/admin/menu-manager"
                    className="text-xs font-bold text-brand-700 hover:underline"
                  >
                    Manage Stock →
                  </Link>
                </div>

                {data?.stockAlerts?.length === 0 ? (
                  <p className="text-xs text-slatepos-500 py-6 text-center">
                    All lunch items are sufficiently stocked and available.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {data?.stockAlerts?.map((item: any) => (
                      <div
                        key={item.id}
                        className="p-3 rounded-xl border border-amber-200 bg-amber-50/50 flex items-center justify-between"
                      >
                        <div>
                          <div className="text-xs font-bold text-slatepos-900">{item.name}</div>
                          <div className="text-[11px] text-slatepos-500">{item.category}</div>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-200 text-amber-900">
                          {item.isAvailable ? `${item.currentStock} left` : 'Sold Out'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Split Row: Top Selling Items & Table-Wise Sales */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Selling Items */}
              <div className="bg-white p-5 rounded-2xl border border-parchment-200 shadow-2xs">
                <h3 className="text-sm font-bold text-slatepos-900 mb-3">
                  Today&apos;s Top Performing Dishes
                </h3>
                {data?.topSellingItems?.length === 0 ? (
                  <p className="text-xs text-slatepos-400 py-6 text-center">No sales registered yet today</p>
                ) : (
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
                          <div className="text-[10px] text-slatepos-500">
                            {it.quantity} orders fulfilled
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Table-Wise Sales */}
              <div className="bg-white p-5 rounded-2xl border border-parchment-200 shadow-2xs">
                <h3 className="text-sm font-bold text-slatepos-900 mb-3">
                  Table-Wise Revenue Breakdown
                </h3>
                {data?.tableWiseSales?.length === 0 ? (
                  <p className="text-xs text-slatepos-400 py-6 text-center">No table sales data yet today</p>
                ) : (
                  <div className="divide-y divide-parchment-100">
                    {data?.tableWiseSales?.map((t: any) => (
                      <div key={t.tableCode} className="py-2.5 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-0.5 rounded bg-brand-50 text-brand-700 font-mono font-bold text-xs border border-brand-200">
                            {t.tableCode}
                          </span>
                          <span className="text-xs text-slatepos-600 font-medium">
                            {t.orderCount} check{t.orderCount > 1 ? 's' : ''}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-slatepos-900 font-mono">
                          {formatRupees(t.totalPaise)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Staff Billing Activity */}
            <div className="bg-white p-5 rounded-2xl border border-parchment-200 shadow-2xs">
              <h3 className="text-sm font-bold text-slatepos-900 mb-3">
                Cashier Performance & Settlement Audit
              </h3>
              {data?.staffBillingActivity?.length === 0 ? (
                <p className="text-xs text-slatepos-400 py-4 text-center">No cashier billing activity yet today</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {data?.staffBillingActivity?.map((st: any) => (
                    <div key={st.name} className="p-3.5 rounded-xl border border-parchment-200 bg-parchment-50/50">
                      <div className="text-xs font-bold text-slatepos-950">{st.name}</div>
                      <div className="text-base font-extrabold text-brand-700 mt-1 font-mono">
                        {formatRupees(st.totalPaise)}
                      </div>
                      <div className="text-[11px] text-slatepos-500 mt-0.5">
                        {st.invoiceCount} invoices authorized
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
