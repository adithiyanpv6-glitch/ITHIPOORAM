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

  // Load staff records from localStorage or defaults
  const loadStaffDatabase = () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ithipooram_registered_users');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const formatted: StaffRecord[] = parsed.map((u: any, idx: number) => ({
              id: u.id || `IP-USR-${String(idx + 1).padStart(3, '0')}`,
              fullName: u.fullName || u.name || 'Staff Member',
              username: u.username || 'user',
              pin: u.pin || u.password || '1234',
              role: u.role || 'CASHIER',
              station: u.station || 'General Counter',
              isActive: u.isActive !== false,
              registeredAt: u.registeredAt || 'Recent',
              isAdminMasterOverride: u.role === 'MAIN_ADMIN',
              notes: u.notes || 'Registered Staff',
            }));
            setUsers(formatted);
            return;
          }
        } catch (e) {}
      }
    }
    setUsers([...DEFAULT_MASTER_STAFF_DATABASE]);
  };

  useEffect(() => {
    if (!getCurrentUser()) {
      router.replace('/login');
      return;
    }
    loadStaffDatabase();
    
    // Check saved telegram config
    const savedToken = localStorage.getItem('ithipooram_tg_token');
    const savedChatId = localStorage.getItem('ithipooram_tg_chat_id');
    if (savedToken) setTelegramBotToken(savedToken);
    if (savedChatId) setTelegramChatId(savedChatId);
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
  const handleAddNewStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    if (!newPin.trim() || newPin.length !== 4) {
      alert('Security PIN must be exactly 4 digits.');
      return;
    }

    const cleanUser = newUsername.trim() 
      ? newUsername.trim().toLowerCase().replace(/\s+/g, '')
      : newName.trim().toLowerCase().replace(/\s+/g, '');

    const newStaff: StaffRecord = {
      id: `IP-USR-${String(users.length + 1).padStart(3, '0')}`,
      fullName: newName.trim(),
      username: cleanUser,
      pin: newPin.trim(),
      role: newRole,
      station: newStation.trim() || 'General Counter',
      isActive: true,
      registeredAt: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      isAdminMasterOverride: newRole === 'MAIN_ADMIN',
      notes: newNotes.trim() || 'Standard staff access',
    };

    const updated = [...users, newStaff];
    saveDatabaseState(updated);
    
    // Reset form
    setNewName('');
    setNewUsername('');
    setNewPin('');
    setNewNotes('');
    setIsAddModalOpen(false);
  };

  // Download Master Excel (.xls / .xlsx XML)
  const handleDownloadExcel = () => {
    const xmlContent = generateMasterStaffExcelXml(users);
    const blob = new Blob([xmlContent], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `IthiPooram_Master_Staff_Database_${new Date().toISOString().slice(0, 10)}.xls`;
    a.click();
    URL.revokeObjectURL(url);
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
      if (telegramBotToken) localStorage.setItem('ithipooram_tg_token', telegramBotToken);
      if (telegramChatId) localStorage.setItem('ithipooram_tg_chat_id', telegramChatId);

      const res = await fetch('/api/telegram/sync-database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botToken: telegramBotToken,
          chatId: telegramChatId,
          staffList: users,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setTelegramStatus(data.message || 'Excel database successfully delivered to Telegram!');
      } else {
        setTelegramStatus(`Error: ${data.error || 'Failed to dispatch to Telegram'}`);
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
            <Link href="/" className="p-2 rounded-xl bg-slatepos-800 hover:bg-slatepos-700 text-slatepos-300">
              <ArrowLeft className="w-4 h-4" />
            </Link>

            <img 
              src="/ithipooram-logo.png" 
              alt="Ithi Pooram" 
              className="w-10 h-10 rounded-xl object-contain shadow-sm shrink-0 border border-slatepos-700 bg-white/10"
            />

            <div>
              <div className="flex items-center space-x-2">
                <span className="text-base font-extrabold tracking-wide text-white">STAFF &amp; ADMIN CREDENTIALS</span>
                <span className="text-[10px] font-bold bg-[#9E341D] text-white px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Excel Database
                </span>
              </div>
              <p className="text-xs text-slatepos-400">
                Ithi Pooram • Google Sheets &amp; Private Telegram Database Registry
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
              Admin Master Override
            </span>
            <div className="text-2xl font-black text-[#9E341D] font-mono flex items-center space-x-1.5">
              <ShieldCheck className="w-6 h-6 text-[#9E341D]" />
              <span>PIN 1111</span>
            </div>
            <p className="text-[11px] text-slatepos-400 mt-1">Universal Emergency Staff Access</p>
          </div>

          <div className="bg-white p-4 rounded-3xl border border-parchment-200 shadow-2xs">
            <span className="text-[11px] font-bold text-slatepos-500 uppercase tracking-wider block mb-1">
              Database Format
            </span>
            <div className="text-lg font-black text-slatepos-900 flex items-center space-x-1.5">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              <span>Excel &amp; Sheets</span>
            </div>
            <p className="text-[11px] text-slatepos-400 mt-1">Multi-Tab Cell-Oriented Spreadsheet</p>
          </div>

          <div className="bg-white p-4 rounded-3xl border border-parchment-200 shadow-2xs">
            <span className="text-[11px] font-bold text-slatepos-500 uppercase tracking-wider block mb-1">
              Telegram Group Vault
            </span>
            <div className="text-lg font-black text-blue-600 flex items-center space-x-1.5">
              <Send className="w-5 h-5 text-blue-500" />
              <span className="truncate">Private Vault</span>
            </div>
            <p className="text-[11px] text-slatepos-400 mt-1">Encrypted Cloud Backup Storage</p>
          </div>
        </div>

        {/* Database Action Strip: Excel Export, Google Sheets CSV, Telegram Sync */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-parchment-200 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-black text-slatepos-950 flex items-center space-x-2">
              <span>Master Credentials Database Export &amp; Cloud Sync</span>
            </h3>
            <p className="text-xs text-slatepos-500 mt-0.5">
              Formatted with official brand headers, column styling, and security classifications.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* 1. Download Master Excel (.xls/.xlsx) */}
            <button
              onClick={handleDownloadExcel}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white flex items-center space-x-1.5 shadow-sm active:scale-95 transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download Master Excel (.xls)</span>
            </button>

            {/* 2. Download CSV for Google Sheets */}
            <button
              onClick={handleDownloadCsv}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-parchment-100 hover:bg-parchment-200 text-slatepos-800 border border-parchment-300 flex items-center space-x-1.5 transition active:scale-95 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Google Sheets CSV</span>
            </button>

            {/* 3. Send to Telegram Group */}
            <button
              onClick={() => setIsTelegramModalOpen(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center space-x-1.5 shadow-sm active:scale-95 transition cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Push to Telegram Group</span>
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
                  <th className="py-3.5 px-4">Employee Full Name</th>
                  <th className="py-3.5 px-4">Login Username</th>
                  <th className="py-3.5 px-4">4-Digit Security PIN</th>
                  <th className="py-3.5 px-4">Assigned Role</th>
                  <th className="py-3.5 px-4">Counter / Station</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-parchment-100">
                {users.map((staff, idx) => {
                  const isPinShown = revealedPins[staff.id];
                  const isZebra = idx % 2 === 1;

                  return (
                    <tr 
                      key={staff.id} 
                      className={`hover:bg-amber-50/40 transition ${isZebra ? 'bg-parchment-50/50' : 'bg-white'}`}
                    >
                      {/* Staff ID */}
                      <td className="py-3 px-4 font-mono font-bold text-slatepos-500">
                        {staff.id}
                      </td>

                      {/* Full Name */}
                      <td className="py-3 px-4">
                        <div className="font-extrabold text-slatepos-950 text-sm">{staff.fullName}</div>
                        <div className="text-[11px] text-slatepos-400">{staff.notes}</div>
                      </td>

                      {/* Username */}
                      <td className="py-3 px-4 font-mono font-bold text-slatepos-700 bg-parchment-100/60 rounded-lg">
                        @{staff.username}
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
                            className="p-1 rounded-lg text-slatepos-400 hover:text-slatepos-800"
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

                      {/* Counter Station */}
                      <td className="py-3 px-4 text-slatepos-600 font-medium">
                        {staff.station}
                      </td>

                      {/* Account Status Toggle */}
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleToggleActive(staff.id)}
                          className={`px-3 py-1 rounded-full text-[10px] font-extrabold transition ${
                            staff.isActive 
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' 
                              : 'bg-red-100 text-red-800 hover:bg-red-200'
                          }`}
                        >
                          {staff.isActive ? 'ACTIVE' : 'SUSPENDED'}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDeleteStaff(staff.id, staff.fullName)}
                          className="p-1.5 rounded-lg text-slatepos-400 hover:text-red-600 transition"
                          title="Remove Staff Access"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
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
            The Master Admin holds universal bypass privileges (<span className="font-mono font-bold">PIN: 1111</span>) allowing login to any station for emergency overrides. 
            The Excel file exported from this portal is formatted with full OpenXML schemas ready to open inside Microsoft Excel or Google Workspace Sheets without any conversion loss.
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
              <div>
                <label className="block font-bold text-slatepos-700 uppercase tracking-wider mb-1">
                  Employee Full Name:
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Arun Nair, Deepa V"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-parchment-300 text-sm font-bold text-black bg-white focus:outline-none focus:border-[#9E341D]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slatepos-700 uppercase tracking-wider mb-1">
                    Login Username (Optional):
                  </label>
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="Auto-generated if blank"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-parchment-300 text-sm font-mono text-black bg-white focus:outline-none focus:border-[#9E341D]"
                  />
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
                    placeholder="4 Digits (e.g. 3344)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-parchment-300 text-sm font-mono font-bold text-[#9E341D] bg-white focus:outline-none focus:border-[#9E341D]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slatepos-700 uppercase tracking-wider mb-1">
                    Staff Role:
                  </label>
                  <select
                    value={newRole}
                    onChange={(e: any) => setNewRole(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-parchment-300 text-xs font-bold text-black bg-white focus:outline-none focus:border-[#9E341D]"
                  >
                    <option value="CASHIER">CASHIER (Counter POS)</option>
                    <option value="MANAGER">MANAGER (Floor &amp; Audit)</option>
                    <option value="KITCHEN_STAFF">KITCHEN_STAFF (KDS Chef)</option>
                    <option value="MENU_EDITOR">MENU_EDITOR (Menu &amp; QR)</option>
                    <option value="MAIN_ADMIN">MAIN_ADMIN (Full Access)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slatepos-700 uppercase tracking-wider mb-1">
                    Counter Station:
                  </label>
                  <input
                    type="text"
                    value={newStation}
                    onChange={(e) => setNewStation(e.target.value)}
                    placeholder="e.g. Billing Counter POS 1"
                    className="w-full px-3 py-2.5 rounded-xl border border-parchment-300 text-xs text-black bg-white focus:outline-none focus:border-[#9E341D]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slatepos-700 uppercase tracking-wider mb-1">
                  Security Notes / Allocation:
                </label>
                <input
                  type="text"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="e.g. Morning shift cashier, authorized for UPI billing"
                  className="w-full px-3 py-2 rounded-xl border border-parchment-300 text-xs text-black bg-white"
                />
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

      {/* MODAL 2: DISPATCH TO TELEGRAM GROUP */}
      {isTelegramModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-parchment-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-parchment-200">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                  <Send className="w-4 h-4" />
                </div>
                <h3 className="text-base font-extrabold text-slatepos-950">Push Database to Telegram Vault</h3>
              </div>
              <button
                onClick={() => setIsTelegramModalOpen(false)}
                className="p-1.5 rounded-lg text-slatepos-400 hover:bg-parchment-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-4 space-y-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-blue-950 space-y-1">
                <span className="font-bold block">Private Telegram Group Destination:</span>
                <a 
                  href="https://t.me/+9eJM_DO7vyUxMjE9" 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-blue-700 underline font-semibold flex items-center space-x-1"
                >
                  <span>https://t.me/+9eJM_DO7vyUxMjE9</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div>
                <label className="block font-bold text-slatepos-700 uppercase tracking-wider mb-1">
                  Telegram Bot API Token:
                </label>
                <input
                  type="text"
                  value={telegramBotToken}
                  onChange={(e) => setTelegramBotToken(e.target.value)}
                  placeholder="e.g. 7891234567:AAHxyz... (from @BotFather)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-parchment-300 font-mono text-xs text-black bg-white focus:outline-none focus:border-blue-600"
                />
                <p className="text-[11px] text-slatepos-400 mt-1">
                  Create via @BotFather in 30 seconds and add the bot as Admin to your private group.
                </p>
              </div>

              <div>
                <label className="block font-bold text-slatepos-700 uppercase tracking-wider mb-1">
                  Group Chat ID / Username:
                </label>
                <input
                  type="text"
                  value={telegramChatId}
                  onChange={(e) => setTelegramChatId(e.target.value)}
                  placeholder="e.g. -100xxxxxxxxxx or @yourgroup"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-parchment-300 font-mono text-xs text-black bg-white focus:outline-none focus:border-blue-600"
                />
              </div>

              {telegramStatus && (
                <div className={`p-3 rounded-2xl text-xs font-bold ${
                  telegramStatus.startsWith('Error') 
                    ? 'bg-red-50 text-red-800 border border-red-200' 
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                }`}>
                  {telegramStatus}
                </div>
              )}

              <div className="pt-2 flex justify-between items-center">
                <a
                  href="/IthiPooram_Master_Staff_Database.xls"
                  download
                  className="text-slatepos-600 hover:text-slatepos-900 font-bold underline text-xs"
                >
                  Direct Download (.xls)
                </a>

                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsTelegramModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl font-bold text-slatepos-600 hover:bg-parchment-100"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    disabled={isSendingTelegram}
                    onClick={handleSendToTelegram}
                    className="px-5 py-2.5 rounded-xl font-black bg-blue-600 hover:bg-blue-700 text-white shadow-md active:scale-95 transition disabled:opacity-50"
                  >
                    {isSendingTelegram ? 'Delivering...' : 'Send File to Group'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
