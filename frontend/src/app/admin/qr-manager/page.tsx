'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  QrCode, 
  Download, 
  RotateCcw, 
  Printer, 
  ArrowLeft, 
  CheckCircle2, 
  ShieldAlert, 
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { apiRequest } from '../../../lib/api';

interface TableQrData {
  tableCode: string;
  displayName: string;
  qrToken: string;
  qrTargetUrl: string;
  qrDataUrl: string;
  qrSvg: string;
  lastRegeneratedAt: string;
}

export default function QrManagerPage() {
  const [tablesQr, setTablesQr] = useState<TableQrData[]>([]);
  const [loading, setLoading] = useState(true);
  const [regeneratingTable, setRegeneratingTable] = useState<string | null>(null);

  const tableCodes = ['TQ1', 'TQ2', 'TQ3', 'TQ4', 'TQ5', 'TQ6', 'TQ7', 'TQ8', 'TQ9', 'TQ10'];

  const loadAllQrAssets = async () => {
    try {
      setLoading(true);
      const results = await Promise.all(
        tableCodes.map((code) => apiRequest<TableQrData>(`/tables/${code}/qr`))
      );
      setTablesQr(results);
    } catch (err) {
      console.error('Failed to load table QR assets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllQrAssets();
  }, []);

  const handleRegenerateQr = async (tableCode: string) => {
    const confirmMsg = `Are you sure you want to regenerate the QR code for ${tableCode}?\n\nWARNING: The existing physical QR code on this table will stop working immediately!`;
    if (!window.confirm(confirmMsg)) return;

    try {
      setRegeneratingTable(tableCode);
      await apiRequest(`/tables/${tableCode}/regenerate-qr`, {
        method: 'POST',
        body: JSON.stringify({ reason: 'Admin rotated table security token' }),
      });
      await loadAllQrAssets();
      alert(`New secure QR code created for ${tableCode}. Previous token invalidated.`);
    } catch (err: any) {
      alert(err.message || 'Failed to regenerate QR');
    } finally {
      setRegeneratingTable(null);
    }
  };

  const handleDownloadPng = (table: TableQrData) => {
    const link = document.createElement('a');
    link.href = table.qrDataUrl;
    link.download = `ithipooram_qr_${table.tableCode}.png`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-parchment-50 font-sans">
      {/* Header */}
      <header className="bg-slatepos-900 border-b border-slatepos-800 text-white px-6 py-4 flex items-center justify-between print:hidden">
        <div className="flex items-center space-x-3">
          <Link
            href="/admin"
            className="p-2 rounded-xl bg-slatepos-800 hover:bg-slatepos-700 text-slatepos-300"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-base font-extrabold tracking-tight">TABLE QR STAND GENERATOR</h1>
            <p className="text-xs text-slatepos-400">
              Download and print permanent cryptographic QR stands for tables TQ1 through TQ10
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => window.print()}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white flex items-center space-x-1.5 shadow-md"
          >
            <Printer className="w-4 h-4" />
            <span>Print All Table Stands</span>
          </button>
        </div>
      </header>

      {/* Main Grid */}
      <main className="max-w-7xl mx-auto p-6">
        {loading ? (
          <div className="py-24 text-center">
            <div className="w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-sm font-semibold text-slatepos-500">Generating cryptographic QR codes...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {tablesQr.map((t) => (
              <div
                key={t.tableCode}
                className="bg-white rounded-3xl border border-parchment-200 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between"
              >
                {/* Printable Tent Stand Design */}
                <div className="p-6 text-center bg-white flex flex-col items-center">
                  {/* Restaurant Branding on Stand */}
                  <div className="mb-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white font-bold text-xl mx-auto shadow-xs">
                      ഇ
                    </div>
                    <div className="text-xs font-black tracking-widest text-slatepos-900 mt-1 uppercase font-sans">
                      ITHI POORAM
                    </div>
                    <div className="text-[11px] font-bold text-brand-700 font-malayalam">
                      ഇത്തിപ്പൂരം
                    </div>
                  </div>

                  {/* QR Image */}
                  <div className="p-3 bg-white border-2 border-slatepos-900 rounded-2xl shadow-inner mb-3">
                    <img
                      src={t.qrDataUrl}
                      alt={`QR Code for ${t.tableCode}`}
                      className="w-44 h-44 object-contain"
                    />
                  </div>

                  {/* Prominent Table Identifier below QR */}
                  <div className="w-full bg-slatepos-900 text-white py-2 px-3 rounded-xl">
                    <div className="text-xl font-black font-mono tracking-wider">
                      {t.tableCode}
                    </div>
                    <div className="text-[10px] text-slatepos-300 font-medium">
                      {t.displayName}
                    </div>
                  </div>

                  <p className="text-[10px] text-slatepos-500 mt-2 font-medium">
                    Scan with Phone Camera to View Today&apos;s Menu & Order
                  </p>
                </div>

                {/* Staff Actions (Hidden in print) */}
                <div className="p-3 bg-parchment-50 border-t border-parchment-200 flex items-center space-x-2 print:hidden">
                  <button
                    onClick={() => handleDownloadPng(t)}
                    className="flex-1 py-2 px-2.5 rounded-xl text-[11px] font-bold bg-white hover:bg-parchment-100 text-slatepos-800 border border-parchment-200 flex items-center justify-center space-x-1 shadow-2xs"
                  >
                    <Download className="w-3.5 h-3.5 text-brand-600" />
                    <span>Download PNG</span>
                  </button>

                  <button
                    disabled={regeneratingTable === t.tableCode}
                    onClick={() => handleRegenerateQr(t.tableCode)}
                    className="py-2 px-2.5 rounded-xl text-[11px] font-bold bg-white hover:bg-red-50 text-red-700 border border-red-200 flex items-center justify-center space-x-1"
                    title="Invalidate current link & regenerate new secret QR"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${regeneratingTable === t.tableCode ? 'animate-spin' : ''}`} />
                    <span>Regen</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
