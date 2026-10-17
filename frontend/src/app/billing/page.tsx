'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  Receipt, 
  CreditCard, 
  QrCode, 
  Banknote, 
  Printer, 
  RefreshCw, 
  Lock, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  LogOut, 
  ChevronRight,
  Split,
  Percent,
  Search,
  FileText
} from 'lucide-react';
import { apiRequest, getCurrentUser } from '../../lib/api';
import { getSocket } from '../../lib/socket';

interface TableSummary {
  id: string;
  tableCode: string;
  displayName: string;
  status: 'AVAILABLE' | 'ACTIVE_ORDER' | 'BILL_PENDING' | 'CLOSED' | 'DISABLED';
  unpaidCount: number;
  unpaidTotalPaise: number;
  latestOrderTime: string | null;
  latestOrders: any[];
}

export default function BillingTerminalPage() {
  const [tables, setTables] = useState<TableSummary[]>([]);
  const [selectedTableCode, setSelectedTableCode] = useState<string>('TQ1');
  const [unpaidOrders, setUnpaidOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [billPreview, setBillPreview] = useState<any | null>(null);

  // Cashier state
  const [cashier, setCashier] = useState<any>(null);
  const [loadingTables, setLoadingTables] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Payment states
  const [paymentMode, setPaymentMode] = useState<string>('UPI');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [splitCashPaise, setSplitCashPaise] = useState<number>(0);
  const [splitUpiPaise, setSplitUpiPaise] = useState<number>(0);

  // PIN re-auth modal
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  // Receipt Print modal
  const [printedInvoice, setPrintedInvoice] = useState<any | null>(null);
  const [thermalReceiptText, setThermalReceiptText] = useState<string>('');
  const [printerErrorNotice, setPrinterErrorNotice] = useState<boolean>(false);

  // Reprint modal
  const [isReprintModalOpen, setIsReprintModalOpen] = useState(false);
  const [reprintReason, setReprintReason] = useState('');
  const [reprintPin, setReprintPin] = useState('');

  // Discount modal (Manager)
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [discountAmountRupees, setDiscountAmountRupees] = useState('');
  const [discountReason, setDiscountReason] = useState('');

  // Helper
  const formatRupees = (paise: number) => `₹${(paise / 100).toFixed(2)}`;

  // Load all tables
  const loadTables = async () => {
    try {
      setLoadingTables(true);
      const data = await apiRequest<TableSummary[]>('/tables');
      setTables(data);
    } catch (err) {
      console.error('Failed to load tables:', err);
    } finally {
      setLoadingTables(false);
    }
  };

  // Load unpaid orders for selected table
  const loadUnpaidOrders = async (tCode: string) => {
    try {
      setLoadingOrders(true);
      const res = await apiRequest(`/billing/tables/${tCode}/unpaid`);
      setUnpaidOrders(res.unpaidOrders || []);
      if (res.unpaidOrders && res.unpaidOrders.length > 0) {
        selectOrderForBilling(res.unpaidOrders[0]);
      } else {
        setSelectedOrder(null);
        setBillPreview(null);
      }
    } catch (err) {
      console.error('Failed to load unpaid orders:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  // Select an order & load preview
  const selectOrderForBilling = async (order: any) => {
    setSelectedOrder(order);
    try {
      const preview = await apiRequest(`/billing/orders/${order.id}/preview`);
      setBillPreview(preview);
      // Pre-set split amounts if needed
      setSplitCashPaise(Math.floor(preview.calculation.grandTotalPaise / 2));
      setSplitUpiPaise(preview.calculation.grandTotalPaise - Math.floor(preview.calculation.grandTotalPaise / 2));
    } catch (err) {
      console.error('Failed to fetch bill preview:', err);
    }
  };

  useEffect(() => {
    setCashier(getCurrentUser());
    loadTables();

    // Sockets
    const socket = getSocket();
    socket.emit('join:billing');

    socket.on('order:created', () => {
      loadTables();
      if (selectedTableCode) loadUnpaidOrders(selectedTableCode);
    });

    socket.on('order:paid', () => {
      loadTables();
      if (selectedTableCode) loadUnpaidOrders(selectedTableCode);
    });

    socket.on('order:status_updated', () => {
      loadTables();
      if (selectedTableCode) loadUnpaidOrders(selectedTableCode);
    });

    return () => {
      socket.off('order:created');
      socket.off('order:paid');
      socket.off('order:status_updated');
    };
  }, []);

  useEffect(() => {
    if (selectedTableCode) {
      loadUnpaidOrders(selectedTableCode);
    }
  }, [selectedTableCode]);

  // Open PIN modal
  const handleInitiatePayment = () => {
    if (!selectedOrder) return;
    setEnteredPin('');
    setPinError(null);
    setIsPinModalOpen(true);
  };

  // Confirm payment with PIN re-auth
  const handleConfirmPaymentWithPin = async () => {
    if (!enteredPin || enteredPin.length < 4) {
      setPinError('Enter your 4-digit cashier PIN');
      return;
    }

    try {
      setIsSubmittingPayment(true);
      setPinError(null);

      const payload: any = {
        paymentMode,
        referenceNumber: referenceNumber ? referenceNumber.trim() : undefined,
        cashierPin: enteredPin,
      };

      if (paymentMode === 'SPLIT_PAYMENT') {
        payload.splitPayments = [
          { mode: 'CASH', amountPaise: splitCashPaise },
          { mode: 'UPI', amountPaise: splitUpiPaise, ref: referenceNumber || 'SPLIT-UPI' },
        ];
      }

      const res = await apiRequest(`/billing/orders/${selectedOrder.id}/confirm-payment`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setIsPinModalOpen(false);
      setPrintedInvoice(res.invoice);
      setThermalReceiptText(res.thermalReceipt);
      setPrinterErrorNotice(res.printerStatus === 'PRINTER_ERROR');

      // Refresh list
      loadTables();
      loadUnpaidOrders(selectedTableCode);
    } catch (err: any) {
      setPinError(err.message || 'Payment confirmation failed');
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  // Submit Reprint
  const handleConfirmReprint = async () => {
    if (!printedInvoice || !reprintReason.trim() || !reprintPin) return;

    try {
      const res = await apiRequest(`/billing/invoices/${printedInvoice.id}/reprint`, {
        method: 'POST',
        body: JSON.stringify({
          reason: reprintReason.trim(),
          cashierPin: reprintPin,
        }),
      });

      setThermalReceiptText(res.thermalReceipt);
      setIsReprintModalOpen(false);
      setReprintReason('');
      setReprintPin('');
      alert(`Duplicate invoice reprinted (Copy #${res.printCount}).`);
    } catch (err: any) {
      alert(err.message || 'Reprint failed');
    }
  };

  // Apply Discount (Manager)
  const handleApplyDiscount = async () => {
    if (!selectedOrder || !discountAmountRupees || !discountReason.trim()) return;

    try {
      const discountPaise = Math.round(parseFloat(discountAmountRupees) * 100);
      const res = await apiRequest(`/billing/orders/${selectedOrder.id}/discount`, {
        method: 'POST',
        body: JSON.stringify({
          discountPaise,
          reason: discountReason.trim(),
        }),
      });

      setIsDiscountModalOpen(false);
      setDiscountAmountRupees('');
      setDiscountReason('');
      selectOrderForBilling(res.order);
      alert('Discount applied successfully.');
    } catch (err: any) {
      alert(err.message || 'Failed to apply discount');
    }
  };

  return (
    <div className="min-h-screen bg-parchment-50 flex flex-col font-sans">
      {/* Top POS Header */}
      <header className="bg-slatepos-900 border-b border-slatepos-800 text-white px-6 py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white font-bold shadow-md">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-extrabold tracking-tight">BILLING & COUNTER POS</h1>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-brand-900 text-brand-300 border border-brand-700">
                ഇത്തിപ്പൂരം
              </span>
            </div>
            <p className="text-xs text-slatepos-400">
              Terminal: Cashier 1 • Shift Shift Cutoff: 03:00 AM IST
            </p>
          </div>
        </div>

        {/* Cashier Badge & Nav */}
        <div className="flex items-center space-x-4">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-bold text-white">
              {cashier?.fullName || 'Logged In Cashier'}
            </div>
            <div className="text-[11px] text-slatepos-400 font-mono">
              Role: {cashier?.role || 'CASHIER'}
            </div>
          </div>

          <Link
            href="/admin"
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slatepos-800 hover:bg-slatepos-700 text-slatepos-200"
          >
            Admin Reports
          </Link>

          <Link
            href="/login"
            className="p-2 rounded-lg bg-slatepos-800 hover:bg-red-950/60 text-slatepos-400 hover:text-red-300"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* Main 3-Column Split View for High-Volume Counter Work */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Column: Table Selector Grid */}
        <section className="w-full lg:w-80 border-r border-parchment-200 bg-white p-4 flex flex-col flex-shrink-0 overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slatepos-500">
              Floor Tables (10)
            </h2>
            <button
              onClick={loadTables}
              className="text-xs text-brand-700 hover:text-brand-800 font-semibold flex items-center space-x-1"
            >
              <RefreshCw className={`w-3 h-3 ${loadingTables ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {tables.map((t) => {
              const isSelected = selectedTableCode === t.tableCode;
              const isBillPending = t.status === 'BILL_PENDING';
              const isActive = t.status === 'ACTIVE_ORDER';

              return (
                <button
                  key={t.id}
                  onClick={() => setSelectedTableCode(t.tableCode)}
                  className={`p-3 rounded-2xl border text-left transition relative flex flex-col justify-between h-24 ${
                    isSelected
                      ? 'border-brand-600 bg-brand-50/60 ring-2 ring-brand-500/30'
                      : isBillPending
                      ? 'border-brand-300 bg-brand-50/30 hover:border-brand-400'
                      : isActive
                      ? 'border-amber-300 bg-amber-50/30 hover:border-amber-400'
                      : 'border-parchment-200 bg-parchment-50/50 hover:border-parchment-300'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-base font-black text-slatepos-950 font-mono">
                      {t.tableCode}
                    </span>
                    {t.unpaidCount > 0 && (
                      <span className="w-5 h-5 rounded-full bg-brand-600 text-white text-[10px] font-bold flex items-center justify-center">
                        {t.unpaidCount}
                      </span>
                    )}
                  </div>

                  <div>
                    <div className="text-[11px] font-medium text-slatepos-500 truncate">
                      {t.displayName.split('(')[0]}
                    </div>
                    <div className="text-xs font-extrabold text-slatepos-900 mt-0.5">
                      {t.unpaidTotalPaise > 0 ? formatRupees(t.unpaidTotalPaise) : 'Free'}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Middle Column: Latest 3 to 5 Unpaid Orders for Selected Table */}
        <section className="w-full lg:w-96 border-r border-parchment-200 bg-parchment-50 p-4 flex flex-col flex-shrink-0 overflow-y-auto">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-parchment-200">
            <div>
              <h2 className="text-sm font-bold text-slatepos-900 flex items-center space-x-1.5">
                <span>Orders for</span>
                <span className="font-mono text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                  {selectedTableCode}
                </span>
              </h2>
              <p className="text-[11px] text-slatepos-500">
                Latest 3 to 5 unpaid customer orders
              </p>
            </div>
            <button
              onClick={() => loadUnpaidOrders(selectedTableCode)}
              className="p-1.5 rounded-lg bg-white border border-parchment-200 text-slatepos-600 hover:text-slatepos-900"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingOrders ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {loadingOrders ? (
            <div className="py-12 text-center">
              <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-xs text-slatepos-500">Checking open orders...</p>
            </div>
          ) : unpaidOrders.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-white rounded-2xl border border-parchment-200">
              <CheckCircle2 className="w-12 h-12 text-emerald-500/60 mb-2" />
              <h3 className="text-sm font-bold text-slatepos-900">No Unpaid Orders</h3>
              <p className="text-xs text-slatepos-500 mt-1">
                Table {selectedTableCode} has no outstanding balance.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {unpaidOrders.map((order) => {
                const isSelected = selectedOrder?.id === order.id;
                return (
                  <button
                    key={order.id}
                    onClick={() => selectOrderForBilling(order)}
                    className={`w-full p-4 rounded-2xl border text-left transition shadow-2xs ${
                      isSelected
                        ? 'border-brand-600 bg-white ring-2 ring-brand-500/20'
                        : 'border-parchment-200 bg-white hover:border-parchment-300'
                    }`}
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-parchment-100">
                      <div>
                        <span className="text-base font-black text-slatepos-950 font-mono">
                          {order.customerCode}
                        </span>
                        <div className="text-[10px] text-slatepos-400">
                          {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-sm font-black text-brand-700">
                          {formatRupees(order.grandTotalPaise)}
                        </span>
                        <div>
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              order.fulfillmentStatus === 'READY'
                                ? 'bg-emerald-100 text-emerald-800'
                                : order.fulfillmentStatus === 'PREPARING'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slatepos-100 text-slatepos-600'
                            }`}
                          >
                            {order.fulfillmentStatus}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Items preview */}
                    <div className="mt-2.5 space-y-1">
                      {order.items.map((it: any) => (
                        <div key={it.id} className="flex justify-between text-xs text-slatepos-700">
                          <span className="truncate pr-2">
                            {it.quantity}x {it.itemNameSnapshot}
                          </span>
                          <span className="font-semibold text-slatepos-900">
                            {formatRupees(it.lineTotalPaise)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Right Column: Full Bill Preview & Payment Confirmation */}
        <section className="flex-1 bg-white p-6 flex flex-col justify-between overflow-y-auto">
          {!selectedOrder || !billPreview ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-slatepos-400 p-8">
              <Receipt className="w-16 h-16 text-slatepos-200 mb-3" />
              <h3 className="text-base font-bold text-slatepos-700">Select an Order to Settle</h3>
              <p className="text-xs text-slatepos-400 mt-1 max-w-xs">
                Pick a table and select the customer order ticket to review the bill and record payment.
              </p>
            </div>
          ) : (
            <div className="max-w-xl mx-auto w-full flex flex-col h-full justify-between">
              <div>
                {/* Bill Header */}
                <div className="pb-4 border-b border-parchment-200 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slatepos-400">
                      BILL PREVIEW
                    </span>
                    <h2 className="text-2xl font-black text-slatepos-950 font-mono">
                      {selectedOrder.customerCode}
                    </h2>
                    <p className="text-xs text-slatepos-500">
                      Table: {selectedOrder.table?.displayName || selectedTableCode} • Time:{' '}
                      {new Date(selectedOrder.createdAt).toLocaleTimeString()}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-800">
                      UNPAID
                    </span>
                    {cashier?.role === 'MANAGER' || cashier?.role === 'MAIN_ADMIN' ? (
                      <div className="mt-1.5">
                        <button
                          onClick={() => setIsDiscountModalOpen(true)}
                          className="text-xs font-semibold text-brand-700 hover:text-brand-800 flex items-center space-x-1 ml-auto"
                        >
                          <Percent className="w-3.5 h-3.5" />
                          <span>Apply Discount</span>
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* Items Breakdown */}
                <div className="py-4 border-b border-parchment-200 space-y-2">
                  <div className="text-xs font-bold text-slatepos-400 uppercase tracking-wider flex justify-between">
                    <span>Item & Qty</span>
                    <span>Total (INR)</span>
                  </div>
                  {selectedOrder.items.map((it: any) => (
                    <div key={it.id} className="flex justify-between text-sm text-slatepos-800">
                      <div>
                        <span className="font-semibold text-slatepos-950">{it.itemNameSnapshot}</span>
                        <span className="text-xs text-slatepos-500 ml-2">
                          ({it.quantity} x {formatRupees(it.itemPriceSnapshotPaise)})
                        </span>
                      </div>
                      <span className="font-mono font-bold text-slatepos-900">
                        {formatRupees(it.lineTotalPaise)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Totals & Tax Breakup */}
                <div className="py-4 border-b border-parchment-200 space-y-1.5 text-xs text-slatepos-600">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-semibold text-slatepos-900">
                      {formatRupees(billPreview.calculation.subtotalPaise)}
                    </span>
                  </div>
                  {billPreview.calculation.discountPaise > 0 && (
                    <div className="flex justify-between text-brand-700 font-semibold">
                      <span>Manager Discount:</span>
                      <span>-{formatRupees(billPreview.calculation.discountPaise)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slatepos-500 text-[11px]">
                    <span>CGST (2.5%):</span>
                    <span>{formatRupees(billPreview.calculation.cgstPaise)}</span>
                  </div>
                  <div className="flex justify-between text-slatepos-500 text-[11px]">
                    <span>SGST (2.5%):</span>
                    <span>{formatRupees(billPreview.calculation.sgstPaise)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-black text-slatepos-950 pt-2 border-t border-parchment-200">
                    <span>Grand Total:</span>
                    <span className="font-mono text-brand-700">
                      {formatRupees(billPreview.calculation.grandTotalPaise)}
                    </span>
                  </div>
                </div>

                {/* Payment Mode Selector */}
                <div className="py-4 space-y-3">
                  <label className="block text-xs font-bold text-slatepos-700 uppercase tracking-wider">
                    Select Payment Mode:
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {['UPI', 'CASH', 'CARD', 'SPLIT_PAYMENT'].map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setPaymentMode(mode)}
                        className={`py-3 px-2 rounded-xl text-xs font-bold flex flex-col items-center justify-center transition border ${
                          paymentMode === mode
                            ? 'border-brand-600 bg-brand-50 text-brand-800 shadow-2xs ring-1 ring-brand-500/30'
                            : 'border-parchment-200 bg-white text-slatepos-700 hover:bg-parchment-50'
                        }`}
                      >
                        {mode === 'UPI' && <QrCode className="w-5 h-5 mb-1 text-brand-600" />}
                        {mode === 'CASH' && <Banknote className="w-5 h-5 mb-1 text-emerald-600" />}
                        {mode === 'CARD' && <CreditCard className="w-5 h-5 mb-1 text-blue-600" />}
                        {mode === 'SPLIT_PAYMENT' && <Split className="w-5 h-5 mb-1 text-purple-600" />}
                        <span>{mode.replace('_', ' ')}</span>
                      </button>
                    ))}
                  </div>

                  {/* Mode specific fields */}
                  {paymentMode === 'UPI' && (
                    <input
                      type="text"
                      value={referenceNumber}
                      onChange={(e) => setReferenceNumber(e.target.value)}
                      placeholder="UPI Transaction ID / Ref (e.g. 2381290312)"
                      className="w-full text-xs p-2.5 rounded-xl border border-parchment-300 bg-parchment-50 focus:outline-none focus:border-brand-500"
                    />
                  )}

                  {paymentMode === 'CARD' && (
                    <input
                      type="text"
                      value={referenceNumber}
                      onChange={(e) => setReferenceNumber(e.target.value)}
                      placeholder="POS Terminal Approval Code / RRN"
                      className="w-full text-xs p-2.5 rounded-xl border border-parchment-300 bg-parchment-50 focus:outline-none focus:border-brand-500"
                    />
                  )}

                  {paymentMode === 'SPLIT_PAYMENT' && (
                    <div className="grid grid-cols-2 gap-2 bg-parchment-50 p-3 rounded-xl border border-parchment-200">
                      <div>
                        <label className="block text-[11px] font-semibold text-slatepos-600 mb-1">
                          Cash Amount (₹):
                        </label>
                        <input
                          type="number"
                          value={splitCashPaise / 100}
                          onChange={(e) => {
                            const rupees = parseFloat(e.target.value) || 0;
                            const paise = Math.round(rupees * 100);
                            setSplitCashPaise(paise);
                            setSplitUpiPaise(Math.max(0, billPreview.calculation.grandTotalPaise - paise));
                          }}
                          className="w-full text-xs p-2 rounded-lg border border-parchment-300 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slatepos-600 mb-1">
                          UPI Amount (₹):
                        </label>
                        <input
                          type="number"
                          value={splitUpiPaise / 100}
                          readOnly
                          className="w-full text-xs p-2 rounded-lg border border-parchment-300 bg-slatepos-100 text-slatepos-600 font-bold"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Confirm & Settle Button */}
              <div className="pt-4 border-t border-parchment-200">
                <button
                  onClick={handleInitiatePayment}
                  className="w-full py-4 rounded-2xl font-black text-sm text-white bg-brand-600 hover:bg-brand-700 shadow-lg shadow-brand-900/15 flex items-center justify-center space-x-2 transition active:scale-98"
                >
                  <Lock className="w-4 h-4" />
                  <span>Authorize & Settle Bill ({formatRupees(billPreview.calculation.grandTotalPaise)})</span>
                </button>
                <p className="text-[10px] text-center text-slatepos-400 mt-2">
                  Requires personal Cashier PIN verification. Triggers row-level lock and generates invoice snapshot.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Cashier Personal PIN Re-Authentication Modal */}
      {isPinModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-parchment-200 text-center animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-3">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slatepos-950">Cashier Authorization</h3>
            <p className="text-xs text-slatepos-500 mt-0.5">
              Enter your personal PIN to authorize payment settlement for{' '}
              <strong className="text-slatepos-900 font-mono">{selectedOrder?.customerCode}</strong>.
            </p>

            {pinError && (
              <div className="mt-3 p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                {pinError}
              </div>
            )}

            {/* PIN Input Display */}
            <div className="my-5">
              <input
                type="password"
                maxLength={6}
                value={enteredPin}
                onChange={(e) => setEnteredPin(e.target.value)}
                placeholder="••••"
                className="w-36 text-center text-2xl tracking-[0.5em] font-mono p-2.5 rounded-xl border-2 border-brand-500 focus:outline-none bg-parchment-50 font-black"
                autoFocus
              />
              <p className="text-[11px] text-slatepos-400 mt-1">Default Cashier PIN: 5566 or 7788</p>
            </div>

            {/* Quick Keypad */}
            <div className="grid grid-cols-3 gap-2 mb-5 max-w-[200px] mx-auto">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, '←'].map((btn) => (
                <button
                  key={btn}
                  onClick={() => {
                    if (btn === 'C') setEnteredPin('');
                    else if (btn === '←') setEnteredPin((p) => p.slice(0, -1));
                    else if (enteredPin.length < 6) setEnteredPin((p) => p + btn);
                  }}
                  className="h-10 rounded-xl bg-parchment-100 hover:bg-parchment-200 text-sm font-bold text-slatepos-800 transition active:scale-95"
                >
                  {btn}
                </button>
              ))}
            </div>

            <div className="flex space-x-2">
              <button
                disabled={isSubmittingPayment}
                onClick={() => setIsPinModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-slatepos-100 text-slatepos-700 hover:bg-slatepos-200"
              >
                Cancel
              </button>
              <button
                disabled={isSubmittingPayment || enteredPin.length < 4}
                onClick={handleConfirmPaymentWithPin}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white disabled:opacity-50 flex items-center justify-center space-x-1"
              >
                {isSubmittingPayment ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <span>Confirm & Print</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 80mm ESC/POS Thermal Receipt Preview & Print Modal */}
      {printedInvoice && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] flex flex-col shadow-2xl border border-parchment-200 overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-parchment-200 flex items-center justify-between bg-parchment-50">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="text-sm font-bold text-slatepos-950">Payment Settled</h3>
                  <p className="text-[11px] text-slatepos-500 font-mono">
                    {printedInvoice.invoiceNumber}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setPrintedInvoice(null);
                  setThermalReceiptText('');
                }}
                className="px-3 py-1 rounded-lg text-xs font-bold bg-slatepos-200 text-slatepos-700 hover:bg-slatepos-300"
              >
                Close
              </button>
            </div>

            {/* Printer Failure Notice if simulated */}
            {printerErrorNotice && (
              <div className="p-3 bg-amber-50 border-b border-amber-200 text-xs text-amber-800 flex items-center justify-between">
                <span>Printer offline or paper jam detected. Invoice remains safely saved.</span>
                <button
                  onClick={() => setIsReprintModalOpen(true)}
                  className="font-bold text-brand-700 underline ml-2"
                >
                  Retry Print
                </button>
              </div>
            )}

            {/* Thermal Receipt Visual Preview */}
            <div className="p-6 overflow-y-auto flex-1 bg-parchment-100 flex justify-center">
              <pre
                id="printable-receipt"
                className="bg-white text-slatepos-950 p-4 rounded-xl shadow-xs border border-parchment-200 font-mono text-[11px] leading-tight whitespace-pre max-w-[340px] w-full"
              >
                {thermalReceiptText}
              </pre>
            </div>

            {/* Modal Actions */}
            <div className="p-4 border-t border-parchment-200 bg-white flex space-x-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-3 rounded-xl text-xs font-bold bg-slatepos-900 hover:bg-slatepos-800 text-white flex items-center justify-center space-x-1.5 shadow-md"
              >
                <Printer className="w-4 h-4" />
                <span>Send to 80mm Printer</span>
              </button>

              <button
                onClick={() => setIsReprintModalOpen(true)}
                className="px-4 py-3 rounded-xl text-xs font-bold bg-parchment-100 hover:bg-parchment-200 text-slatepos-700"
              >
                Reprint Bill
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reprint Bill Modal with Mandatory Audit Reason */}
      {isReprintModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-parchment-200">
            <h3 className="text-base font-bold text-slatepos-950">Reprint Bill Copy</h3>
            <p className="text-xs text-slatepos-500 mt-1">
              Every reprint is stamped &ldquo;DUPLICATE REPRINT&rdquo; and recorded in the audit trail.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slatepos-700 mb-1">
                  Reason for Reprint:
                </label>
                <textarea
                  value={reprintReason}
                  onChange={(e) => setReprintReason(e.target.value)}
                  placeholder="e.g. Customer requested copy, paper roll ran out..."
                  rows={2}
                  className="w-full text-xs p-2.5 rounded-xl border border-parchment-300 focus:outline-none focus:border-brand-500"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slatepos-700 mb-1">
                  Cashier PIN:
                </label>
                <input
                  type="password"
                  value={reprintPin}
                  onChange={(e) => setReprintPin(e.target.value)}
                  placeholder="Enter PIN"
                  className="w-full text-xs p-2 rounded-xl border border-parchment-300 focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div className="mt-5 flex space-x-2">
              <button
                onClick={() => setIsReprintModalOpen(false)}
                className="flex-1 py-2 rounded-xl text-xs font-bold bg-slatepos-100 text-slatepos-700"
              >
                Cancel
              </button>
              <button
                disabled={!reprintReason.trim() || !reprintPin}
                onClick={handleConfirmReprint}
                className="flex-1 py-2 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white disabled:opacity-50"
              >
                Confirm Reprint
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Apply Discount Modal (Manager) */}
      {isDiscountModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-parchment-200">
            <h3 className="text-base font-bold text-slatepos-950">Manager Discount</h3>
            <p className="text-xs text-slatepos-500 mt-1">
              Apply authorized discount to {selectedOrder?.customerCode}.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slatepos-700 mb-1">
                  Discount Amount (₹):
                </label>
                <input
                  type="number"
                  value={discountAmountRupees}
                  onChange={(e) => setDiscountAmountRupees(e.target.value)}
                  placeholder="e.g. 50"
                  className="w-full text-xs p-2.5 rounded-xl border border-parchment-300 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slatepos-700 mb-1">
                  Reason for Discount:
                </label>
                <textarea
                  value={discountReason}
                  onChange={(e) => setDiscountReason(e.target.value)}
                  placeholder="e.g. Regular patron courtesy, minor service delay..."
                  rows={2}
                  className="w-full text-xs p-2.5 rounded-xl border border-parchment-300 focus:outline-none focus:border-brand-500"
                ></textarea>
              </div>
            </div>

            <div className="mt-5 flex space-x-2">
              <button
                onClick={() => setIsDiscountModalOpen(false)}
                className="flex-1 py-2 rounded-xl text-xs font-bold bg-slatepos-100 text-slatepos-700"
              >
                Cancel
              </button>
              <button
                disabled={!discountAmountRupees || !discountReason.trim()}
                onClick={handleApplyDiscount}
                className="flex-1 py-2 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white disabled:opacity-50"
              >
                Apply Discount
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
