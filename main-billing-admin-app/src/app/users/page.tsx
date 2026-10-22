'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  ArrowLeft, 
  Plus, 
  CheckCircle2, 
  Download, 
  FileSpreadsheet,
  Send,
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Lock, 
  Sparkles,
  KeyRound,
  Trash2,
  X,
  ExternalLink
} from 'lucide-react';
import { getCurrentUser } from '../../lib/api';
import { 
  StaffRecord, 
  DEFAULT_MASTER_STAFF_DATABASE, 
  generateMasterStaffExcelXml, 
  generateStaffCsv 
} from '../../lib/userExcelDatabase';

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<StaffRecord[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [revealedPins, setRevealedPins] = useState<{ [id: string]: boolean }>({});
  
  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isTelegramModalOpen, setIsTelegramModalOpen] = useState(false);
  
  // New user form state
  const [newName, setNewName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPin, setNewPin] = useState('');
  const [newRole, setNewRole] = useState<'CASHIER' | 'MANAGER' | 'KITCHEN_STAFF' | 'MENU_EDITOR' | 'MAIN_ADMIN'>('CASHIER');
  const [newStation, setNewStation] = useState('Billing Counter POS 1');
  const [newNotes, setNewNotes] = useState('');
  
  // Telegram Bot state
  const [telegramBotToken, setTelegramBotToken] = useState('');
  const [telegramChatId, setTelegramChatId] = useState('');
  const [telegramStatus, setTelegramStatus] = useState<string | null>(null);
  const [isSendingTelegram, setIsSendingTelegram] = useState(false);

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  // Load staff records from server / state
  const loadStaffDatabase = () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ithipooram_registered_users');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0 && !parsed.some((u: any) => u.id?.startsWith('IP-USR-001'))) {
            setUsers(parsed);
            return;
          }
        } catch (e) {}
      }
    }
    setUsers([]);
  };

  useEffect(() => {
    if (!getCurrentUser()) {
      router.replace('/login');
      return;
    }
    loadStaffDatabase();

    const fetchLiveSessions = async () => {
      try {
        const res = await fetch('/api/staff/sessions');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.sessions)) {
            setSessions(data.sessions);
          }
          if (Array.isArray(data.staff)) {
            setUsers(data.staff);
          }
        }
      } catch (e) {}
    };

    fetchLiveSessions();
    const interval = setInterval(fetchLiveSessions, 5000);
    
    // Check saved telegram config
    const savedToken = localStorage.getItem('ithipooram_tg_token');
    const savedChatId = localStorage.getItem('ithipooram_tg_chat_id');
    if (savedToken) setTelegramBotToken(savedToken);
    if (savedChatId) setTelegramChatId(savedChatId);

    return () => clearInterval(interval);
  }, [router]);

  const saveDatabaseState = (updatedList: StaffRecord[]) => {
    setUsers(updatedList);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ithipooram_registered_users', JSON.stringify(updatedList));
    }
  };

  // Toggle PIN visibility for admin security audit
  const togglePinReveal = (id: string) => {
    setRevealedPins((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Toggle active state
  const handleToggleActive = (id: string) => {
    const updated = users.map((u) => (u.id === id ? { ...u, isActive: !u.isActive } : u));
    saveDatabaseState(updated);
  };

  // Delete staff record
  const handleDeleteStaff = (id: string, name: string) => {
    if (id === 'IP-USR-001') {
      alert('The Master Admin account cannot be deleted for security integrity.');
      return;
    }
    if (!confirm(`Are you sure you want to remove staff credentials for "${name}"?`)) return;
    const updated = users.filter((u) => u.id !== id);
    saveDatabaseState(updated);
  };

  // Add new staff member
  const handleAddNewStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    if (!newPin.trim() || newPin.length !== 4) {
      alert('Security PIN must be exactly 4 digits.');
      return;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim(),
          pin: newPin.trim(),
          role: newRole,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        // Refresh live data
        const sessRes = await fetch('/api/staff/sessions');
        if (sessRes.ok) {
          const sessData = await sessRes.json();
          if (Array.isArray(sessData.staff)) setUsers(sessData.staff);
          if (Array.isArray(sessData.sessions)) setSessions(sessData.sessions);
        }
      } else {
        alert(data.error || 'Failed to register staff');
      }
    } catch (e: any) {
      alert(e.message || 'Error adding staff');
    }

    // Reset form
    setNewName('');
    setNewUsername('');
    setNewPin('');
    setNewNotes('');
    setIsAddModalOpen(false);
  };

  // Download Master Staff & Sessions Excel (.xls XML)
  const handleDownloadExcel = () => {
    window.location.href = '/api/staff/database/excel';
  };

  // Download CSV for Google Sheets
  const handleDownloadCsv = () => {
    const csvContent = generateStaffCsv(users);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `IthiPooram_Staff_Database_GoogleSheets_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Dispatch to Telegram Group
  const handleSendToTelegram = async () => {
    setIsSendingTelegram(true);
    setTelegramStatus(null);

    try {
      const res = await fetch('/api/staff/database/telegram-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: 'Manual Admin Request from Staff & Sessions Console',
        }),
      });

      const data = await res.json();
      if (data.success) {
        setTelegramStatus(data.message || 'Staff & sessions Excel database successfully delivered to Telegram!');
      } else {
        setTelegramStatus(`Notice: ${data.message || data.error || 'Sync request submitted'}`);
      }
    } catch (e: any) {
      setTelegramStatus(`Network error: ${e.message}`);
    } finally {
      setIsSendingTelegram(false);
    }
  };

  return (
    <div className="min-h-screen bg-parchment-50 font-sans pb-32">
      {/* Top Header */}
      <header className="bg-slatepos-900 border-b border-slatepos-800 text-white px-4 sm:px-6 py-3.5 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <button 
              onClick={handleBack} 
              className="p-2 rounded-xl bg-slatepos-800 hover:bg-slatepos-700 text-slatepos-300 transition-colors"
              title="Back to Previous Page"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <img 
              src="/ithipooram-logo.png" 
              alt="Ithi Pooram" 
              className="w-10 h-10 rounded-xl object-contain shadow-sm shrink-0 border border-slatepos-700 bg-white/10"
            />

            <div>
              <div className="flex items-center space-x-2">
                <span className="text-base font-extrabold tracking-wide text-white">STAFF &amp; ADMIN CREDENTIALS</span>
                <span className="text-[10px] font-bold bg-[#0088cc] text-white px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Telegram Live Database
                </span>
              </div>
              <p className="text-xs text-slatepos-400">
                Ithi Pooram • Single Master File with In-Place Live Updates
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-black bg-[#9E341D] hover:bg-[#832B18] text-white flex items-center space-x-1.5 shadow-md active:scale-95 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Staff Member</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        {/* KPI & Database Sync Banner */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-3xl border border-parchment-200 shadow-2xs">
            <span className="text-[11px] font-bold text-slatepos-500 uppercase tracking-wider block mb-1">
              Registered Accounts
            </span>
            <div className="text-2xl font-black text-slatepos-950 flex items-center space-x-2">
              <span>{users.length}</span>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                {users.filter((u) => u.isActive).length} Active
              </span>
            </div>
            <p className="text-[11px] text-slatepos-400 mt-1">Cashier, Chef &amp; Manager Accounts</p>
          </div>

          <div className="bg-white p-4 rounded-3xl border border-parchment-200 shadow-2xs">
            <span className="text-[11px] font-bold text-slatepos-500 uppercase tracking-wider block mb-1">
              Live Login Sessions
            </span>
            <div className="text-2xl font-black text-emerald-600 font-mono flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span>{sessions.filter((s) => s.status === 'ACTIVE').length} Online</span>
            </div>
            <p className="text-[11px] text-slatepos-400 mt-1">Real-time Connected Staff Devices</p>
          </div>

          <div className="bg-white p-4 rounded-3xl border border-parchment-200 shadow-2xs">
            <span className="text-[11px] font-bold text-slatepos-500 uppercase tracking-wider block mb-1">
              Database Format
            </span>
            <div className="text-lg font-black text-slatepos-900 flex items-center space-x-1.5">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              <span>Excel &amp; Sheets</span>
            </div>
            <p className="text-[11px] text-slatepos-400 mt-1">Direct Google Sheets Import</p>
          </div>

          <div className="bg-white p-4 rounded-3xl border border-parchment-200 shadow-2xs">
            <span className="text-[11px] font-bold text-slatepos-500 uppercase tracking-wider block mb-1">
              Google Workspace
            </span>
            <div className="text-sm font-black text-blue-600 flex items-center space-x-1.5">
              <ExternalLink className="w-4 h-4 text-blue-500" />
              <span className="truncate">adithiyanpv6@gmail.com</span>
            </div>
            <p className="text-[11px] text-slatepos-400 mt-1">Continuous Live Cloud Sync</p>
          </div>
        </div>

        {/* Database Action Strip: Single Permanent Excel File in Telegram */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-parchment-200 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-black text-slatepos-950 flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Telegram Central Master Database (Single File)</span>
            </h3>
            <p className="text-xs text-slatepos-500 mt-0.5">
              1 pinned file in group • In-place live edits (No multiple files) • Contains Staff, Sessions &amp; Table Orders
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* 1. Send / Sync in-place to Telegram */}
            <button
              onClick={handleSendToTelegram}
              disabled={isSendingTelegram}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0088cc] hover:bg-[#0077b5] text-white flex items-center space-x-1.5 shadow-sm active:scale-95 transition cursor-pointer disabled:opacity-50"
            >
              {isSendingTelegram ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span>Update Telegram Excel</span>
            </button>

            {/* 2. Open Telegram Group */}
            <a
              href="https://t.me/+9eJM_DO7vyUxMjE9"
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slatepos-800 hover:bg-slatepos-700 text-white flex items-center space-x-1.5 shadow-sm active:scale-95 transition"
            >
              <span>Open Group ↗</span>
            </a>

            {/* 3. Download Master Excel (.xls) */}
            <button
              onClick={handleDownloadExcel}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white flex items-center space-x-1.5 shadow-sm active:scale-95 transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download Master (.xls)</span>
            </button>
          </div>
        </div>

        {/* Master Credentials Data Table */}
        <div className="bg-white rounded-3xl border border-parchment-200 overflow-hidden shadow-2xs">
          <div className="p-4 sm:px-6 py-4 border-b border-parchment-200 flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-slatepos-950">Active Personnel &amp; Access Control Registry</h2>
              <p className="text-xs text-slatepos-500">Live synchronized with POS Terminals &amp; Mobile Tablet Gateways</p>
            </div>
            <span className="text-xs font-mono font-bold text-slatepos-400">
              {users.length} Records
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slatepos-700">
              <thead className="bg-slatepos-900 text-[11px] font-bold uppercase tracking-wider text-white border-b border-slatepos-800">
                <tr>
                  <th className="py-3.5 px-4">Staff ID</th>
                  <th className="py-3.5 px-4">Employee Name</th>
                  <th className="py-3.5 px-4">4-Digit Security PIN</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Registration Date &amp; Time</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-parchment-100">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slatepos-400 font-medium">
                      Database is clean and ready. No staff registered yet.
                    </td>
                  </tr>
                ) : (
                  users.map((staff, idx) => {
                    const isPinShown = revealedPins[staff.id];
                    const isZebra = idx % 2 === 1;

                    return (
                      <tr 
                        key={staff.id} 
                        className={`hover:bg-amber-50/40 transition ${isZebra ? 'bg-parchment-50/50' : 'bg-white'}`}
                      >
                        {/* Staff ID */}
                        <td className="py-3 px-4 font-mono font-bold text-slatepos-600">
                          {staff.id}
                        </td>

                        {/* Employee Name */}
                        <td className="py-3 px-4">
                          <div className="font-extrabold text-slatepos-950 text-sm">{staff.fullName}</div>
                        </td>

                        {/* 4-Digit Security PIN (Masked with Eye reveal) */}
                        <td className="py-3 px-4">
                          <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-200">
                            <span className="font-mono font-black text-sm text-[#9E341D] tracking-wider">
                              {isPinShown ? staff.pin : '••••'}
                            </span>
                            <button
                              type="button"
                              onClick={() => togglePinReveal(staff.id)}
                              className="p-1 rounded-lg text-slatepos-400 hover:text-slatepos-800 cursor-pointer"
                              title={isPinShown ? 'Hide PIN' : 'Reveal PIN for Verification'}
                            >
                              {isPinShown ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </td>

                        {/* Role Pill */}
                        <td className="py-3 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            staff.role === 'MAIN_ADMIN' 
                              ? 'bg-[#9E341D] text-white' 
                              : staff.role === 'MANAGER'
                              ? 'bg-slatepos-800 text-white'
                              : staff.role === 'KITCHEN_STAFF'
                              ? 'bg-amber-500 text-slatepos-950 font-black'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {staff.role}
                          </span>
                        </td>

                        {/* Registration Date */}
                        <td className="py-3 px-4 text-slatepos-600 font-medium">
                          {staff.registeredAt || 'Today'}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleDeleteStaff(staff.id, staff.fullName)}
                            className="p-1.5 rounded-lg text-slatepos-400 hover:text-red-600 transition cursor-pointer"
                            title="Remove Staff Access"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Staff Login Sessions Registry Table */}
        <div className="bg-white rounded-3xl border border-parchment-200 overflow-hidden shadow-2xs">
          <div className="p-4 sm:px-6 py-4 border-b border-parchment-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center space-x-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <div>
                <h2 className="text-base font-extrabold text-slatepos-950">Live Staff Login Sessions Database</h2>
                <p className="text-xs text-slatepos-500">Real-time session monitoring • Synchronized to Excel &amp; Telegram every 30 mins and on every sign-in</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                {sessions.filter((s) => s.status === 'ACTIVE').length} Online Now
              </span>
              <button
                onClick={handleSendToTelegram}
                disabled={isSendingTelegram}
                className="px-3 py-1 rounded-xl text-xs font-bold bg-[#9E341D] text-white hover:bg-[#852B17] transition flex items-center space-x-1 cursor-pointer"
                title="Send updated session Excel to Telegram"
              >
                <Send className="w-3 h-3" />
                <span>{isSendingTelegram ? 'Syncing...' : 'Sync to Telegram'}</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slatepos-700">
              <thead className="bg-slatepos-900 text-[11px] font-bold uppercase tracking-wider text-white border-b border-slatepos-800">
                <tr>
                  <th className="px-4 py-3">Session ID</th>
                  <th className="px-4 py-3">Staff ID</th>
                  <th className="px-4 py-3">Employee Name</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Login Date &amp; Time</th>
                  <th className="px-4 py-3 text-center">Session Status</th>
                  <th className="px-4 py-3 text-right">Last Active Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-parchment-100">
                {sessions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slatepos-400 font-medium">
                      No active sessions recorded yet today. Fresh database ready for testing.
                    </td>
                  </tr>
                ) : (
                  sessions.map((ses) => (
                    <tr key={ses.sessionId} className="hover:bg-parchment-50 transition">
                      <td className="px-4 py-3 font-mono font-bold text-slatepos-850">{ses.sessionId}</td>
                      <td className="px-4 py-3 font-mono font-bold text-slatepos-600">{ses.staffId || '-'}</td>
                      <td className="px-4 py-3 font-bold text-slatepos-950">{ses.fullName}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold text-[10px] border border-indigo-200">
                          {ses.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slatepos-600">{ses.loginDate} {ses.loginTime}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          ses.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {ses.status === 'ACTIVE' ? '🟢 ACTIVE' : '⚪ LOGGED OUT'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slatepos-500">{ses.lastActive || ses.loginTime}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Security & Password Protection Policy Box */}
        <div className="bg-amber-50 rounded-3xl border border-amber-200 p-5 text-amber-950 text-xs space-y-2">
          <div className="flex items-center space-x-2 font-bold text-sm text-[#9E341D]">
            <Lock className="w-4 h-4" />
            <span>Confidentiality &amp; Google Sheets Master Sync Policy</span>
          </div>
          <p className="leading-relaxed">
            All user credentials generated here adhere to the 4-digit rapid tablet authentication standard. 
            The Excel file exported from this portal is formatted with full OpenXML schemas ready to open inside Microsoft Excel or Google Workspace Sheets without any conversion loss.
            All active login sessions and new registrations automatically dispatch live to your Telegram group as an Excel database.
          </p>
        </div>
      </main>

      {/* MODAL 1: ADD NEW STAFF MEMBER */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-parchment-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-parchment-200">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-[#9E341D] text-white flex items-center justify-center font-bold">
                  <KeyRound className="w-4 h-4" />
                </div>
                <h3 className="text-base font-extrabold text-slatepos-950">Add Staff Account &amp; Access PIN</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg text-slatepos-400 hover:bg-parchment-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddNewStaff} className="my-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slatepos-700 uppercase tracking-wider mb-1">
                    Employee Name:
                  </label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Rahul / Adhithiyan"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-parchment-300 text-sm font-semibold text-black bg-white focus:outline-none focus:border-[#9E341D]"
                  />
                  <p className="text-[11px] text-slatepos-400 mt-1">Used for both login &amp; staff records.</p>
                </div>

                <div>
                  <label className="block font-bold text-slatepos-700 uppercase tracking-wider mb-1">
                    4-Digit Security PIN:
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    required
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="4 Digits (e.g. 1234)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-parchment-300 text-sm font-mono font-bold text-[#9E341D] bg-white focus:outline-none focus:border-[#9E341D]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slatepos-700 uppercase tracking-wider mb-1">
                  Staff Role:
                </label>
                <select
                  value={newRole}
                  onChange={(e: any) => setNewRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-parchment-300 text-xs font-bold text-black bg-white focus:outline-none focus:border-[#9E341D]"
                >
                  <option value="CASHIER">CASHIER (Counter POS)</option>
                  <option value="MANAGER">MANAGER (Floor &amp; Audit)</option>
                  <option value="KITCHEN_STAFF">KITCHEN_STAFF (KDS Chef)</option>
                  <option value="MENU_EDITOR">MENU_EDITOR (Menu &amp; QR)</option>
                  <option value="MAIN_ADMIN">MAIN_ADMIN (Full Access)</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl font-bold text-slatepos-600 hover:bg-parchment-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl font-black bg-[#9E341D] hover:bg-[#832B18] text-white shadow-md active:scale-95 transition"
                >
                  Save &amp; Update Database
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: GOOGLE WORKSPACE LIVE INTEGRATION */}
      {isTelegramModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-parchment-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-parchment-200">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slatepos-950">Google Workspace Live Sync</h3>
                  <p className="text-[11px] text-slatepos-500 font-mono">adithiyanpv6@gmail.com</p>
                </div>
              </div>
              <button
                onClick={() => setIsTelegramModalOpen(false)}
                className="p-1.5 rounded-lg text-slatepos-400 hover:bg-parchment-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-4 space-y-3.5 text-xs">
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-1.5">
                <div className="font-bold flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Single Sheet Live Editing (No Duplicate Files)</span>
                </div>
                <p className="text-[11px] text-emerald-800">
                  All updates to Staff Register, Live Sessions, and Table Orders modify the exact same Google Sheet in real-time.
                </p>
              </div>

              <div>
                <span className="font-bold text-slatepos-800 block mb-1">
                  Option 1: Google Sheet Live Formulas (3 Sheets)
                </span>
                <p className="text-[11px] text-slatepos-500 mb-1.5">
                  Create 3 tabs in your spreadsheet and paste in cell <strong>A1</strong> of each tab:
                </p>
                <div className="space-y-1.5 font-mono text-[10px]">
                  <div className="p-2 rounded-xl bg-slatepos-900 text-amber-300">
                    <span className="text-slatepos-400 block text-[9px] font-sans font-bold uppercase">Tab 1: Staff Database</span>
                    =IMPORTDATA(&quot;https://cruel-places-jump.loca.lt/api/google-workspace/live-feed?sheet=staff&quot;)
                  </div>
                  <div className="p-2 rounded-xl bg-slatepos-900 text-amber-300">
                    <span className="text-slatepos-400 block text-[9px] font-sans font-bold uppercase">Tab 2: Staff Session Database</span>
                    =IMPORTDATA(&quot;https://cruel-places-jump.loca.lt/api/google-workspace/live-feed?sheet=sessions&quot;)
                  </div>
                  <div className="p-2 rounded-xl bg-slatepos-900 text-amber-300">
                    <span className="text-slatepos-400 block text-[9px] font-sans font-bold uppercase">Tab 3: Table Orders Database</span>
                    =IMPORTDATA(&quot;https://cruel-places-jump.loca.lt/api/google-workspace/live-feed?sheet=tables&quot;)
                  </div>
                </div>
              </div>

              <div>
                <span className="font-bold text-slatepos-800 block mb-1">
                  Option 2: Turnkey Google Apps Script (Auto-Sync Every 1 Min)
                </span>
                <p className="text-[11px] text-slatepos-500 mb-1">
                  The script file <strong className="text-[#9E341D]">GoogleWorkspace_IthiPooram_LiveSync.gs</strong> is created in your project. Open your Google Sheet &gt; <em>Extensions &gt; Apps Script</em> and paste it.
                </p>
              </div>

              <div className="pt-2 flex justify-between items-center">
                <a
                  href="/api/staff/database/excel"
                  className="text-slatepos-600 hover:text-slatepos-900 font-bold underline text-xs"
                >
                  Download Current Excel (.xls)
                </a>

                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsTelegramModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl font-bold text-slatepos-600 hover:bg-parchment-100"
                  >
                    Close
                  </button>
                  <a
                    href="https://docs.google.com/spreadsheets/d/1N2WrgkPmo_pdgatDp5aohdVcUTEp-rJ48yqOdMocibI/edit"
                    target="_blank"
                    rel="noreferrer"
                    className="px-5 py-2.5 rounded-xl font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-md active:scale-95 transition flex items-center space-x-1.5"
                  >
                    <span>Open Linked Google Sheet</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
