'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Users, 
  ArrowLeft, 
  Plus, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  Key, 
  Edit2, 
  RefreshCw,
  Lock
} from 'lucide-react';
import { apiRequest } from '../../../lib/api';

export default function UsersManagementPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New user modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('CASHIER');
  const [newPin, setNewPin] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit user modal
  const [editUser, setEditUser] = useState<any | null>(null);
  const [editRole, setEditRole] = useState('');
  const [editPin, setEditPin] = useState('');
  const [editPassword, setEditPassword] = useState('');

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await apiRequest('/admin/users');
      setUsers(data);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleToggleUserActive = async (user: any) => {
    try {
      const nextActive = !user.isActive;
      await apiRequest(`/admin/users/${user.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: nextActive }),
      });
      loadUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to toggle account');
    }
  };

  const handleCreateUser = async () => {
    if (!newUsername || !newPassword || !newFullName || !newRole) return;

    try {
      setIsSubmitting(true);
      await apiRequest('/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          username: newUsername,
          password: newPassword,
          fullName: newFullName,
          role: newRole,
          pin: newPin || undefined,
        }),
      });

      setIsAddModalOpen(false);
      setNewUsername('');
      setNewFullName('');
      setNewPassword('');
      setNewPin('');
      loadUsers();
      alert('New staff account registered.');
    } catch (err: any) {
      alert(err.message || 'Failed to create user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!editUser) return;

    try {
      setIsSubmitting(true);
      await apiRequest(`/admin/users/${editUser.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          role: editRole || undefined,
          pin: editPin || undefined,
          password: editPassword || undefined,
        }),
      });

      setEditUser(null);
      setEditRole('');
      setEditPin('');
      setEditPassword('');
      loadUsers();
      alert('Employee settings updated.');
    } catch (err: any) {
      alert(err.message || 'Failed to update user');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-parchment-50 font-sans">
      {/* Header */}
      <header className="bg-slatepos-900 border-b border-slatepos-800 text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link
            href="/admin"
            className="p-2 rounded-xl bg-slatepos-800 hover:bg-slatepos-700 text-slatepos-300"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-base font-extrabold tracking-tight">STAFF ACCOUNTS & SECURITY PINS</h1>
            <p className="text-xs text-slatepos-400">
              Manage employee roles, access credentials, and fast-authorization PINs
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white flex items-center space-x-1.5 shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Employee</span>
        </button>
      </header>

      {/* Main Grid */}
      <main className="max-w-6xl mx-auto p-6">
        <div className="bg-white rounded-3xl border border-parchment-200 overflow-hidden shadow-2xs">
          {loading ? (
            <div className="py-24 text-center">
              <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-sm font-semibold text-slatepos-500">Loading user database...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slatepos-700">
                <thead className="bg-parchment-100 text-[11px] font-bold uppercase tracking-wider text-slatepos-500 border-b border-parchment-200">
                  <tr>
                    <th className="py-3 px-4">Employee Name</th>
                    <th className="py-3 px-4">Username</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">PIN Status</th>
                    <th className="py-3 px-4">Account Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-parchment-100">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-parchment-50/60 transition">
                      <td className="py-3 px-4 font-bold text-slatepos-950">
                        {u.fullName}
                      </td>
                      <td className="py-3 px-4 font-mono text-slatepos-600 font-semibold">
                        {u.username}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            u.role === 'MAIN_ADMIN'
                              ? 'bg-purple-100 text-purple-800'
                              : u.role === 'MANAGER'
                              ? 'bg-blue-100 text-blue-800'
                              : u.role === 'CASHIER'
                              ? 'bg-brand-100 text-brand-800'
                              : u.role === 'KITCHEN_STAFF'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slatepos-100 text-slatepos-800'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {u.hasPin ? (
                          <span className="text-emerald-700 font-semibold flex items-center space-x-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Configured</span>
                          </span>
                        ) : (
                          <span className="text-slatepos-400">Not set</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleToggleUserActive(u)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition ${
                            u.isActive
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-red-100 text-red-800 hover:bg-red-200'
                          }`}
                        >
                          {u.isActive ? 'Active' : 'Disabled'}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setEditUser(u);
                            setEditRole(u.role);
                            setEditPin('');
                            setEditPassword('');
                          }}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-parchment-100 hover:bg-parchment-200 text-slatepos-800"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Add User Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-parchment-200">
            <h3 className="text-base font-bold text-slatepos-950">Add New Staff Account</h3>

            <div className="mt-4 space-y-2.5">
              <div>
                <label className="block text-xs font-semibold text-slatepos-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full text-xs p-2 rounded-xl border border-parchment-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slatepos-700 mb-1">Username</label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="e.g. cashier3"
                  className="w-full text-xs p-2 rounded-xl border border-parchment-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slatepos-700 mb-1">Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Strong password"
                  className="w-full text-xs p-2 rounded-xl border border-parchment-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slatepos-700 mb-1">Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full text-xs p-2 rounded-xl border border-parchment-300 bg-white"
                >
                  <option value="CASHIER">CASHIER (Billing)</option>
                  <option value="KITCHEN_STAFF">KITCHEN_STAFF (Display only)</option>
                  <option value="MANAGER">MANAGER (Ops & Discounts)</option>
                  <option value="MENU_EDITOR">MENU_EDITOR (Inventory only)</option>
                  <option value="MAIN_ADMIN">MAIN_ADMIN (Full Owner Access)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slatepos-700 mb-1">
                  Quick PIN (4 digits)
                </label>
                <input
                  type="password"
                  maxLength={4}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder="e.g. 1234"
                  className="w-full text-xs p-2 rounded-xl border border-parchment-300"
                />
              </div>
            </div>

            <div className="mt-5 flex space-x-2">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="flex-1 py-2 rounded-xl text-xs font-bold bg-slatepos-100 text-slatepos-700"
              >
                Cancel
              </button>
              <button
                disabled={isSubmitting || !newUsername || !newPassword || !newFullName}
                onClick={handleCreateUser}
                className="flex-1 py-2 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white disabled:opacity-50"
              >
                Create Staff
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-parchment-200">
            <h3 className="text-base font-bold text-slatepos-950">
              Edit {editUser.fullName}
            </h3>

            <div className="mt-4 space-y-2.5">
              <div>
                <label className="block text-xs font-semibold text-slatepos-700 mb-1">Role</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full text-xs p-2 rounded-xl border border-parchment-300 bg-white"
                >
                  <option value="CASHIER">CASHIER</option>
                  <option value="KITCHEN_STAFF">KITCHEN_STAFF</option>
                  <option value="MANAGER">MANAGER</option>
                  <option value="MENU_EDITOR">MENU_EDITOR</option>
                  <option value="MAIN_ADMIN">MAIN_ADMIN</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slatepos-700 mb-1">
                  Reset Password (Optional)
                </label>
                <input
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="Leave blank to keep current"
                  className="w-full text-xs p-2 rounded-xl border border-parchment-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slatepos-700 mb-1">
                  Update PIN (Optional)
                </label>
                <input
                  type="password"
                  maxLength={4}
                  value={editPin}
                  onChange={(e) => setEditPin(e.target.value)}
                  placeholder="New 4-digit PIN"
                  className="w-full text-xs p-2 rounded-xl border border-parchment-300"
                />
              </div>
            </div>

            <div className="mt-5 flex space-x-2">
              <button
                onClick={() => setEditUser(null)}
                className="flex-1 py-2 rounded-xl text-xs font-bold bg-slatepos-100 text-slatepos-700"
              >
                Cancel
              </button>
              <button
                disabled={isSubmitting}
                onClick={handleUpdateUser}
                className="flex-1 py-2 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white disabled:opacity-50"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
