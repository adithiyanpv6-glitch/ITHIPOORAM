'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  ArrowLeft, 
  Filter, 
  RefreshCw, 
  Search, 
  CheckCircle2, 
  XCircle, 
  FileText,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { apiRequest } from '../../../lib/api';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [moduleFilter, setModuleFilter] = useState('');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const query = moduleFilter ? `?module=${moduleFilter}` : '';
      const data = await apiRequest(`/audit/logs${query}`);
      setLogs(data.logs || []);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [moduleFilter]);

  return (
    <div className="min-h-screen bg-parchment-50 font-sans">
      {/* Top Header */}
      <header className="bg-slatepos-900 border-b border-slatepos-800 text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link
            href="/admin"
            className="p-2 rounded-xl bg-slatepos-800 hover:bg-slatepos-700 text-slatepos-300"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-base font-extrabold tracking-tight">IMMUTABLE SECURITY AUDIT TRAIL</h1>
            <p className="text-xs text-slatepos-400">
              Append-only tamper-proof log of logins, orders, billing, price edits & QR rotations
            </p>
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
            <option value="ORDER">Customer Orders (ORDER)</option>
            <option value="KITCHEN">Kitchen Operations (KITCHEN)</option>
            <option value="MENU">Menu & Stock (MENU)</option>
            <option value="TABLE_QR">Table & QR Tokens (TABLE_QR)</option>
            <option value="REPORT">Report Exports (REPORT)</option>
          </select>

          <button
            onClick={loadLogs}
            className="p-2 rounded-xl bg-slatepos-800 hover:bg-slatepos-700 text-slatepos-300"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      {/* Main Table */}
      <main className="max-w-7xl mx-auto p-6">
        <div className="bg-white rounded-3xl border border-parchment-200 overflow-hidden shadow-2xs">
          {loading ? (
            <div className="py-24 text-center">
              <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-sm font-semibold text-slatepos-500">Querying security audit records...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="py-16 text-center text-slatepos-500">
              No audit logs recorded for this criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slatepos-700">
                <thead className="bg-parchment-100 text-[11px] font-bold uppercase tracking-wider text-slatepos-500 border-b border-parchment-200">
                  <tr>
                    <th className="py-3 px-4">Time (Kolkata)</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Module</th>
                    <th className="py-3 px-4">User / Device</th>
                    <th className="py-3 px-4">Entity / Ref</th>
                    <th className="py-3 px-4">Reason / Notes</th>
                    <th className="py-3 px-4">Result</th>
                    <th className="py-3 px-4 text-right">Snapshots</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-parchment-100">
                  {logs.map((log) => {
                    const isExpanded = expandedLogId === log.id;
                    const dateStr = new Date(log.timestamp).toLocaleString('en-IN', {
                      timeZone: 'Asia/Kolkata',
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    });

                    return (
                      <React.Fragment key={log.id}>
                        <tr className="hover:bg-parchment-50/60 transition">
                          <td className="py-3 px-4 font-mono whitespace-nowrap text-slatepos-900">
                            {dateStr}
                          </td>
                          <td className="py-3 px-4 font-bold text-slatepos-950 font-mono">
                            {log.actionType}
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slatepos-100 text-slatepos-700">
                              {log.module}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slatepos-900">
                              {log.usernameSnapshot || 'System'}
                            </div>
                            <div className="text-[10px] text-slatepos-400">
                              {log.roleSnapshot || log.ipAddress || ''}
                            </div>
                          </td>
                          <td className="py-3 px-4 font-mono font-semibold text-brand-700">
                            {log.orderCode || log.tableCode || log.invoiceNumber || '-'}
                          </td>
                          <td className="py-3 px-4 max-w-xs truncate text-slatepos-600">
                            {log.reason || '-'}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                                log.result === 'SUCCESS'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {log.result === 'SUCCESS' ? (
                                <CheckCircle2 className="w-3 h-3" />
                              ) : (
                                <XCircle className="w-3 h-3" />
                              )}
                              <span>{log.result}</span>
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            {(log.beforeSnapshot || log.afterSnapshot) ? (
                              <button
                                onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                                className="text-brand-700 hover:text-brand-900 font-bold flex items-center space-x-0.5 ml-auto"
                              >
                                <span>{isExpanded ? 'Hide' : 'Diff'}</span>
                                {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              </button>
                            ) : (
                              <span className="text-slatepos-400">-</span>
                            )}
                          </td>
                        </tr>

                        {/* Expandable JSON Snapshot */}
                        {isExpanded && (
                          <tr className="bg-slatepos-950 text-slatepos-300">
                            <td colSpan={8} className="p-4 font-mono text-[11px]">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <div className="text-amber-400 font-bold mb-1">Before Snapshot:</div>
                                  <pre className="bg-slatepos-900 p-3 rounded-lg overflow-x-auto text-slatepos-300">
                                    {log.beforeSnapshot ? JSON.stringify(JSON.parse(log.beforeSnapshot), null, 2) : 'null'}
                                  </pre>
                                </div>
                                <div>
                                  <div className="text-emerald-400 font-bold mb-1">After Snapshot:</div>
                                  <pre className="bg-slatepos-900 p-3 rounded-lg overflow-x-auto text-slatepos-300">
                                    {log.afterSnapshot ? JSON.stringify(JSON.parse(log.afterSnapshot), null, 2) : 'null'}
                                  </pre>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
