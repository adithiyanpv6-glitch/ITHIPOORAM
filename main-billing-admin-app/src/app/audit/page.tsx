'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ShieldCheck, 
  ArrowLeft, 
  RefreshCw, 
  CheckCircle2, 
  XCircle 
} from 'lucide-react';
import { apiRequest, getCurrentUser } from '../../lib/api';

export default function AuditTrailPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [moduleFilter, setModuleFilter] = useState('');

  const loadLogs = async () => {
    try {
      setLoading(true);
      const data = await apiRequest('/audit/logs');
      setLogs(data.logs || []);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!getCurrentUser()) {
      router.replace('/login');
      return;
    }
    loadLogs();
  }, [router]);

  const filteredLogs = moduleFilter
    ? logs.filter((l) => l.module === moduleFilter)
    : logs;

  return (
    <div className="min-h-screen bg-parchment-50 font-sans">
      <header className="bg-slatepos-900 border-b border-slatepos-800 text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link href="/" className="p-2 rounded-xl bg-slatepos-800 hover:bg-slatepos-700 text-slatepos-300">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="w-10 h-10 rounded-xl bg-amber-600 flex items-center justify-center text-white font-bold shadow-md">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-tight">SECURITY AUDIT TRAIL</h1>
            <p className="text-xs text-slatepos-400">Append-Only Immutable Event & Financial Settlement Audit</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className="text-xs bg-slatepos-800 border border-slatepos-700 text-slatepos-200 px-3 py-2 rounded-xl focus:outline-none"
          >
            <option value="">All Operational Modules</option>
            <option value="AUTH">Authentication (AUTH)</option>
            <option value="BILLING">Billing & Settlements (BILLING)</option>
            <option value="ORDER">Orders (ORDER)</option>
            <option value="KITCHEN">Kitchen (KITCHEN)</option>
            <option value="MENU">Menu (MENU)</option>
            <option value="TABLE_QR">Table QR (TABLE_QR)</option>
          </select>
          <button onClick={loadLogs} className="p-2 rounded-xl bg-slatepos-800 text-slatepos-300">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 sm:p-6 pb-28">
        <div className="bg-white rounded-3xl border border-parchment-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slatepos-700">
              <thead className="bg-parchment-100 text-[11px] font-bold uppercase tracking-wider text-slatepos-500 border-b border-parchment-200">
                <tr>
                  <th className="py-3 px-4">Time (Kolkata)</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Module</th>
                  <th className="py-3 px-4">Staff User</th>
                  <th className="py-3 px-4">Reference</th>
                  <th className="py-3 px-4">Audit Reason</th>
                  <th className="py-3 px-4 text-right">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-parchment-100">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-parchment-50/60 transition">
                    <td className="py-3 px-4 font-mono text-slatepos-900 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="py-3 px-4 font-bold text-slatepos-950 font-mono">
                      {log.actionType}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slatepos-100 text-slatepos-700">
                        {log.module}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slatepos-900">
                      {log.usernameSnapshot || 'System'}
                    </td>
                    <td className="py-3 px-4 font-mono text-brand-700 font-bold">
                      {log.orderCode || log.tableCode || log.invoiceNumber || '-'}
                    </td>
                    <td className="py-3 px-4 text-slatepos-600">
                      {log.reason || '-'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="w-3 h-3 mr-0.5" />
                        <span>SUCCESS</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
