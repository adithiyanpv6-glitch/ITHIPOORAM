'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  UtensilsCrossed, 
  ChefHat, 
  Receipt, 
  ShieldCheck, 
  QrCode, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  Sparkles,
  Smartphone
} from 'lucide-react';
import { apiRequest } from '../lib/api';

export default function HomePage() {
  const [tables, setTables] = useState<any[]>([]);
  const [systemOnline, setSystemOnline] = useState<boolean | null>(null);

  useEffect(() => {
    // Check backend health & fetch sample QR token
    apiRequest('/tables/validate-token?tableCode=TQ1&token=demo')
      .catch(() => {})
      .finally(() => {
        fetch('http://localhost:5000/health')
          .then((res) => res.json())
          .then(() => setSystemOnline(true))
          .catch(() => setSystemOnline(false));
      });

    // Fetch tables for direct QR testing
    fetch('http://localhost:5000/api/menu/today')
      .then(() => {
        // Can read tables if logged in or use direct sample token
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-parchment-50 flex flex-col justify-between">
      {/* Top Header */}
      <header className="border-b border-parchment-200 bg-white shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-brand-600 flex items-center justify-center text-white font-bold shadow-md shadow-brand-900/10">
              <span className="text-2xl font-serif">ഇ</span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold tracking-tight text-slatepos-900 font-sans">
                  ITHI POORAM
                </h1>
                <span className="text-sm font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                  ഇത്തിപ്പൂരം
                </span>
              </div>
              <p className="text-xs text-slatepos-500 font-medium">
                Authentic Kerala Lunch & Coastal Seafood • Statue, Trivandrum
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slatepos-100 text-xs font-medium text-slatepos-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Kolkata Shift Active (UTC+05:30)</span>
            </div>
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-semibold text-white bg-slatepos-800 hover:bg-slatepos-900 rounded-lg shadow-sm transition"
            >
              Staff Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-brand-100 text-brand-800 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>High-Speed No-Waiter Dining Engine</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slatepos-950 tracking-tight leading-tight">
            Integrated QR Ordering, Kitchen Display & Counter Billing
          </h2>
          <p className="mt-3 text-base sm:text-lg text-slatepos-600">
            Engineered for high-volume lunch spot rushes in Trivandrum. Customers order directly via permanent table QRs, orders arrive in the kitchen instantly, and billing is confirmed securely with personal cashier PINs.
          </p>
        </div>

        {/* Operational Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Customer QR Ordering */}
          <div className="bg-white rounded-2xl p-6 border border-parchment-200 shadow-sm hover:shadow-md transition flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-4 group-hover:scale-105 transition">
                <Smartphone className="w-6 h-6" />
              </div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-lg font-bold text-slatepos-900">Customer Mobile QR</h3>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                  No App Needed
                </span>
              </div>
              <p className="text-sm text-slatepos-600 mb-4">
                Mobile-first ordering for customers scanning their permanent table QR. Category browsing, fresh catch specials, custom notes, and instant kitchen transmission.
              </p>
              <div className="text-xs text-slatepos-500 space-y-1 mb-6 bg-parchment-50 p-3 rounded-lg border border-parchment-200">
                <div className="font-semibold text-slatepos-700 mb-1">Permanent Table Stand Flow:</div>
                <div className="flex items-center text-[11px] text-slatepos-600">
                  <CheckCircle2 className="w-3 h-3 text-brand-600 mr-1.5" />
                  Table locked cryptographically
                </div>
                <div className="flex items-center text-[11px] text-slatepos-600">
                  <CheckCircle2 className="w-3 h-3 text-brand-600 mr-1.5" />
                  Idempotent double-tap prevention
                </div>
              </div>
            </div>

            <Link
              href="/order/table/TQ1"
              className="w-full inline-flex items-center justify-center px-4 py-2.5 rounded-xl font-semibold text-sm text-brand-700 bg-brand-50 hover:bg-brand-100 transition group-hover:bg-brand-600 group-hover:text-white"
            >
              <span>Test Table TQ1 Order</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Link>
          </div>

          {/* Card 2: Kitchen Display System (KDS) */}
          <div className="bg-white rounded-2xl p-6 border border-parchment-200 shadow-sm hover:shadow-md transition flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4 group-hover:scale-105 transition">
                <ChefHat className="w-6 h-6" />
              </div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-lg font-bold text-slatepos-900">Kitchen Display (KDS)</h3>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                  Android Tablets
                </span>
              </div>
              <p className="text-sm text-slatepos-600 mb-4">
                Full-screen touchscreen display for chefs. Audio alerts on new orders, live elapsed timers (normal/warning/late), station filters (Main, Tawa Fry, Beverages), and quick status bumps.
              </p>
              <div className="text-xs text-slatepos-500 space-y-1 mb-6 bg-parchment-50 p-3 rounded-lg border border-parchment-200">
                <div className="font-semibold text-slatepos-700 mb-1">Workflow Statuses:</div>
                <div className="text-[11px] text-slatepos-600 font-mono">
                  NEW → ACCEPTED → PREPARING → READY → SERVED
                </div>
              </div>
            </div>

            <Link
              href="/kitchen"
              className="w-full inline-flex items-center justify-center px-4 py-2.5 rounded-xl font-semibold text-sm text-emerald-800 bg-emerald-50 hover:bg-emerald-100 transition group-hover:bg-emerald-700 group-hover:text-white"
            >
              <span>Open Kitchen Screen</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Link>
          </div>

          {/* Card 3: Billing & POS Tablet */}
          <div className="bg-white rounded-2xl p-6 border border-parchment-200 shadow-sm hover:shadow-md transition flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center mb-4 group-hover:scale-105 transition">
                <Receipt className="w-6 h-6" />
              </div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-lg font-bold text-slatepos-900">Billing Counter POS</h3>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-brand-100 text-brand-800 px-2 py-0.5 rounded">
                  Cashier Tablet
                </span>
              </div>
              <p className="text-sm text-slatepos-600 mb-4">
                Counter terminal for table lookups (TQ1..TQ10), displaying latest 3 to 5 unpaid orders. Cash, UPI, Card, Split payments with Cashier PIN re-auth and 80mm thermal receipts.
              </p>
              <div className="text-xs text-slatepos-500 space-y-1 mb-6 bg-parchment-50 p-3 rounded-lg border border-parchment-200">
                <div className="font-semibold text-slatepos-700 mb-1">Security & Print Controls:</div>
                <div className="flex items-center text-[11px] text-slatepos-600">
                  <CheckCircle2 className="w-3 h-3 text-brand-600 mr-1.5" />
                  Cashier PIN confirmation (5566)
                </div>
                <div className="flex items-center text-[11px] text-slatepos-600">
                  <CheckCircle2 className="w-3 h-3 text-brand-600 mr-1.5" />
                  Row-level lock prevents double-billing
                </div>
              </div>
            </div>

            <Link
              href="/billing"
              className="w-full inline-flex items-center justify-center px-4 py-2.5 rounded-xl font-semibold text-sm text-slatepos-800 bg-slatepos-100 hover:bg-slatepos-200 transition group-hover:bg-slatepos-900 group-hover:text-white"
            >
              <span>Open Billing Terminal</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Link>
          </div>

          {/* Card 4: Executive Admin & QR Manager */}
          <div className="bg-white rounded-2xl p-6 border border-parchment-200 shadow-sm hover:shadow-md transition flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center mb-4 group-hover:scale-105 transition">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-lg font-bold text-slatepos-900">Admin & Analytics</h3>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                  Owner / Manager
                </span>
              </div>
              <p className="text-sm text-slatepos-600 mb-4">
                Executive dashboard for gross sales, top items, table sales, stock toggles, user accounts, and immutable audit logs. Generate & download printable table QR tent stands.
              </p>
              <div className="text-xs text-slatepos-500 space-y-1 mb-6 bg-parchment-50 p-3 rounded-lg border border-parchment-200">
                <div className="font-semibold text-slatepos-700 mb-1">Key Admin Features:</div>
                <div className="flex items-center text-[11px] text-slatepos-600">
                  <CheckCircle2 className="w-3 h-3 text-purple-600 mr-1.5" />
                  Printable Table QR Generator
                </div>
                <div className="flex items-center text-[11px] text-slatepos-600">
                  <CheckCircle2 className="w-3 h-3 text-purple-600 mr-1.5" />
                  Live Menu Stock & Price Auditing
                </div>
              </div>
            </div>

            <Link
              href="/admin"
              className="w-full inline-flex items-center justify-center px-4 py-2.5 rounded-xl font-semibold text-sm text-purple-800 bg-purple-50 hover:bg-purple-100 transition group-hover:bg-purple-800 group-hover:text-white"
            >
              <span>Open Admin Portal</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Link>
          </div>
        </div>

        {/* Operational Highlights */}
        <div className="mt-12 bg-white rounded-2xl border border-parchment-200 p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-parchment-200">
            <div>
              <h3 className="text-lg font-bold text-slatepos-900">
                Kerala Lunch Rush Optimization Standards
              </h3>
              <p className="text-sm text-slatepos-500">
                Strict adherence to Indian restaurant tax rules, security tokens, and hardware resilience
              </p>
            </div>
            <div className="mt-3 sm:mt-0 flex items-center space-x-2 text-xs font-medium text-slatepos-600 bg-parchment-100 px-3 py-1.5 rounded-lg border border-parchment-200">
              <Clock className="w-4 h-4 text-brand-600" />
              <span>Shift Cutoff: 03:00 AM IST</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
            <div className="flex space-x-3.5">
              <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center flex-shrink-0 font-bold text-sm">
                1
              </div>
              <div>
                <h4 className="text-sm font-bold text-slatepos-900">Cryptographic Table QRs</h4>
                <p className="text-xs text-slatepos-600 mt-0.5">
                  Tables TQ1 to TQ10 carry permanent randomized secret tokens. Customer links resolve server-side and lock table context permanently to prevent order tampering.
                </p>
              </div>
            </div>

            <div className="flex space-x-3.5">
              <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center flex-shrink-0 font-bold text-sm">
                2
              </div>
              <div>
                <h4 className="text-sm font-bold text-slatepos-900">Row-Locked Billing & PIN</h4>
                <p className="text-xs text-slatepos-600 mt-0.5">
                  Cashiers select the table, review the latest 3-5 orders, and confirm via personal PIN. Row-level transaction locks prevent race conditions and duplicate invoices.
                </p>
              </div>
            </div>

            <div className="flex space-x-3.5">
              <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center flex-shrink-0 font-bold text-sm">
                3
              </div>
              <div>
                <h4 className="text-sm font-bold text-slatepos-900">80mm ESC/POS Thermal Printing</h4>
                <p className="text-xs text-slatepos-600 mt-0.5">
                  Built-in 5% GST calculation (2.5% CGST + 2.5% SGST), FSSAI, GSTIN, and reprint tracking with reason logs for accounting audit compliance.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-parchment-200 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slatepos-500">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slatepos-800">Ithi Pooram (ഇത്തിപ്പൂരം)</span>
            <span>•</span>
            <span>Opp. Old Secretariat Gate, MG Road, Statue, Trivandrum 695001</span>
          </div>
          <div className="mt-2 sm:mt-0 font-medium">
            GSTIN: 32AAAAI0000A1Z5 | FSSAI: 11324007000890
          </div>
        </div>
      </footer>
    </div>
  );
}
