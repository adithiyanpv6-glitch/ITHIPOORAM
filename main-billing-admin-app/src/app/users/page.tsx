'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  ArrowLeft, 
  UserPlus, 
  Eye, 
  EyeOff, 
  Trash2, 
  X, 
  Lock,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { getCurrentUser } from '../../lib/api';
import { StaffRecord } from '../../lib/userExcelDatabase';

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<StaffRecord[]>([]);
  const [revealedPins, setRevealedPins] = useState<{ [id: string]: boolean }>({});

  // Admin Password Protection State
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Add Member Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [newRole, setNewRole] = useState<'CASHIER' | 'MANAGER' | 'KITCHEN_STAFF' | 'MENU_EDITOR' | 'MAIN_ADMIN'>('CASHIER');
  const [registerError, setRegisterError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      const unlocked = sessionStorage.getItem('ithi_staff_admin_unlocked');
      if (unlocked === 'true') {
        setIsUnlocked(true);
      }
    }
  }, [router]);

  // Load registered staff accounts from server API and localStorage
  const loadStaffDatabase = async () => {
    try {
      const res = await fetch('/api/staff/sessions');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.staff)) {
          setUsers(data.staff);
          if (typeof window !== 'undefined') {
            localStorage.setItem('ithipooram_registered_users', JSON.stringify(data.staff));
          }
          return;
        }
      }
    } catch (e) {}

    // Fallback to localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ithipooram_registered_users');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setUsers(parsed);
            return;
          }
        } catch (e) {}
      }
    }
    setUsers([]);
  };

  useEffect(() => {
    if (isUnlocked) {
      loadStaffDatabase();
      const interval = setInterval(loadStaffDatabase, 4000);
      return () => clearInterval(interval);
    }
  }, [isUnlocked]);

  // Handle Admin Password Verification to Enter Section
  const handleVerifyAdminPassword = (e: React.FormEvent) => {
    e.preventDefault();
    const entered = adminPasswordInput.trim();

    // Universal Admin master PIN (1111), standard admin passwords, or registered MAIN_ADMIN PINs
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
        sessionStorage.setItem('ithi_staff_admin_unlocked', 'true');
      }
    } else {
      setPasswordError('Incorrect Admin Password. Access restricted to Admin only.');
    }
  };

  const saveDatabaseState = (updatedList: StaffRecord[]) => {
    setUsers(updatedList);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ithipooram_registered_users', JSON.stringify(updatedList));
    }
  };

  const togglePinReveal = (id: string) => {
    setRevealedPins((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Delete staff member
  const handleDeleteStaff = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove account for "${name}"?`)) return;
    const updated = users.filter((u) => u.id !== id);
    saveDatabaseState(updated);
  };

  // Add new member (matches initial registration in /login)
  const handleAddNewMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError('');

    if (!newName.trim()) {
      setRegisterError('Please enter employee full name.');
      return;
    }
    if (!newPin.trim() || newPin.length !== 4) {
      setRegisterError('Security PIN must be exactly 4 digits.');
      return;
    }
    if (confirmPin && newPin !== confirmPin) {
      setRegisterError('PIN confirmation does not match.');
      return;
    }

    try {
      setIsSubmitting(true);
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
        await loadStaffDatabase();
        setNewName('');
        setNewPin('');
        setConfirmPin('');
        setIsAddModalOpen(false);
      } else {
        setRegisterError(data.error || 'Failed to register new member.');
      }
    } catch (e: any) {
      setRegisterError(e.message || 'Network error registering member.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // If password locked: show clean Admin Password verification screen
  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-parchment-50 flex items-center justify-center p-4 font-sans">
        <div className="bg-white rounded-3xl max-w-sm w-full p-6 sm:p-8 shadow-xl border border-parchment-300 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#9E341D] text-white flex items-center justify-center mx-auto mb-4 shadow-md">
            <Lock className="w-7 h-7" />
          </div>

          <h2 className="text-lg font-black text-slatepos-950 tracking-tight">Staff &amp; Admin Credentials</h2>
          <p className="text-xs font-semibold text-slatepos-500 mt-1 mb-6">Enter Admin Password to enter</p>

          <form onSubmit={handleVerifyAdminPassword} className="space-y-4">
            <div>
              <input
                type="password"
                required
                autoFocus
                value={adminPasswordInput}
                onChange={(e) => {
                  setAdminPasswordInput(e.target.value);
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
              Enter Section
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
    <div className="min-h-screen bg-parchment-50 font-sans pb-32">
      {/* Top Header - Kept only Back button and Title (Excel option, + icon, and description removed as requested) */}
      <header className="bg-slatepos-900 border-b border-slatepos-800 text-white px-4 sm:px-6 py-4 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <button 
              onClick={handleBack} 
              className="p-2 rounded-xl bg-slatepos-800 hover:bg-slatepos-700 text-slatepos-300 transition-colors"
              title="Back to Previous Page"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <img 
              src="/ithipooram-logo.png" 
              alt="Ithi Pooram" 
              className="w-9 h-9 rounded-xl object-contain shadow-sm shrink-0 border border-slatepos-700 bg-white/10"
            />

            <div>
              <h1 className="text-base sm:text-lg font-extrabold tracking-wide text-white">STAFF &amp; ADMIN CREDENTIALS</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Top Controls: Registered Accounts Option & Add New Member Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-parchment-200 shadow-2xs">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-700">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slatepos-500 uppercase tracking-wider block">
                Registered Accounts
              </span>
              <div className="text-2xl font-black text-slatepos-950 flex items-center space-x-2">
                <span>{users.length}</span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  {users.filter((u) => u.isActive !== false).length} Active Accounts
                </span>
              </div>
            </div>
          </div>

          <div>
            <button
              onClick={() => {
                setRegisterError('');
                setIsAddModalOpen(true);
              }}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-[#9E341D] hover:bg-[#852B17] text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-md flex items-center justify-center space-x-2 active:scale-98 transition cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add New Member</span>
            </button>
          </div>
        </div>

        {/* Registered Accounts Viewable Registry Table */}
        <div className="bg-white rounded-3xl border border-parchment-200 overflow-hidden shadow-2xs">
          <div className="p-4 sm:px-6 py-4 border-b border-parchment-200 flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-slatepos-950">Registered Accounts</h2>
              <p className="text-xs text-slatepos-500">Viewable account credentials for all registered staff &amp; administrators</p>
            </div>
            <span className="text-xs font-mono font-bold text-slatepos-500">
              {users.length} Total
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
                    <td colSpan={6} className="py-12 text-center text-slatepos-400 font-medium">
                      No accounts registered yet. Click &quot;Add New Member&quot; to register your first staff account.
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
                        <td className="py-3.5 px-4 font-mono font-bold text-slatepos-700">
                          {staff.id}
                        </td>

                        {/* Employee Name */}
                        <td className="py-3.5 px-4">
                          <div className="font-extrabold text-slatepos-950 text-sm">{staff.fullName}</div>
                        </td>

                        {/* 4-Digit Security PIN (Masked with Eye reveal) */}
                        <td className="py-3.5 px-4">
                          <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-200">
                            <span className="font-mono font-black text-sm text-[#9E341D] tracking-wider">
                              {isPinShown ? staff.pin : '••••'}
                            </span>
                            <button
                              type="button"
                              onClick={() => togglePinReveal(staff.id)}
                              className="p-1 rounded-lg text-slatepos-400 hover:text-slatepos-800 cursor-pointer"
                              title={isPinShown ? 'Hide PIN' : 'Reveal PIN'}
                            >
                              {isPinShown ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </td>

                        {/* Role Pill */}
                        <td className="py-3.5 px-4">
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
                        <td className="py-3.5 px-4 text-slatepos-600 font-medium">
                          {staff.registeredAt || 'Today'}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleDeleteStaff(staff.id, staff.fullName)}
                            className="p-1.5 rounded-lg text-slatepos-400 hover:text-red-600 transition cursor-pointer"
                            title="Remove Account"
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
      </main>

      {/* MODAL: ADD NEW MEMBER (Identical to initial Login/Registration Process) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-parchment-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-parchment-200">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#9E341D] text-white flex items-center justify-center font-bold">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slatepos-950">Add New Member</h3>
                  <p className="text-[11px] text-slatepos-500">Register new staff account &amp; 4-digit PIN</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg text-slatepos-400 hover:bg-parchment-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddNewMember} className="my-4 space-y-4 text-xs">
              {registerError && (
                <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 font-bold">
                  {registerError}
                </div>
              )}

              <div>
                <label className="block font-bold text-slatepos-800 uppercase tracking-wider mb-1">
                  Employee Full Name:
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Rahul / Adhithiyan"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-parchment-300 text-sm font-semibold text-black bg-white focus:outline-none focus:border-[#9E341D]"
                />
              </div>

              <div>
                <label className="block font-bold text-slatepos-800 uppercase tracking-wider mb-1">
                  Staff Role:
                </label>
                <select
                  value={newRole}
                  onChange={(e: any) => setNewRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-parchment-300 text-xs font-bold text-black bg-white focus:outline-none focus:border-[#9E341D]"
                >
                  <option value="CASHIER">CASHIER (Counter POS)</option>
                  <option value="MANAGER">MANAGER (Floor &amp; Operations)</option>
                  <option value="KITCHEN_STAFF">KITCHEN_STAFF (Kitchen Display System)</option>
                  <option value="MENU_EDITOR">MENU_EDITOR (Live Menu Updates)</option>
                  <option value="MAIN_ADMIN">MAIN_ADMIN (Full Executive Control)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slatepos-800 uppercase tracking-wider mb-1">
                    4-Digit PIN:
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

                <div>
                  <label className="block font-bold text-slatepos-800 uppercase tracking-wider mb-1">
                    Confirm PIN:
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="Confirm PIN"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-parchment-300 text-sm font-mono font-bold text-[#9E341D] bg-white focus:outline-none focus:border-[#9E341D]"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl font-bold text-slatepos-600 hover:bg-parchment-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl font-black bg-[#9E341D] hover:bg-[#832B18] text-white shadow-md active:scale-95 transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Registering...' : 'Register Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
