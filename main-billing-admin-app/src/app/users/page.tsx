'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  ArrowLeft, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  RefreshCw 
} from 'lucide-react';
import { apiRequest, getCurrentUser } from '../../lib/api';

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
    if (!getCurrentUser()) {
      router.replace('/login');
      return;
    }
    loadUsers();
  }, [router]);

  const handleToggleActive = async (u: any) => {
    try {
      await apiRequest(`/admin/users/${u.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !u.isActive }),
      });
      loadUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to update');
    }
  };

  return (
    <div className="min-h-screen bg-parchment-50 font-sans">
      <header className="bg-slatepos-900 border-b border-slatepos-800 text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link href="/" className="p-2 rounded-xl bg-slatepos-800 hover:bg-slatepos-700 text-slatepos-300">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-md">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-tight">STAFF ACCOUNTS & SECURITY PINS</h1>
            <p className="text-xs text-slatepos-400">Cashier, Kitchen Chef & Manager Credentials and Re-Auth PINs</p>
          </div>
        </div>

        <button onClick={loadUsers} className="p-2 rounded-xl bg-slatepos-800 text-slatepos-300">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </header>

      <main className="max-w-6xl mx-auto p-4 sm:p-6 pb-28">
        <div className="bg-white rounded-3xl border border-parchment-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slatepos-700">
            <thead className="bg-parchment-100 text-[11px] font-bold uppercase tracking-wider text-slatepos-500 border-b border-parchment-200">
              <tr>
                <th className="py-3 px-4">Employee Full Name</th>
                <th className="py-3 px-4">Username</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Fast PIN</th>
                <th className="py-3 px-4 text-right">Account State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-parchment-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-parchment-50/60 transition">
                  <td className="py-3 px-4 font-bold text-slatepos-950">{u.fullName}</td>
                  <td className="py-3 px-4 font-mono font-semibold text-slatepos-600">{u.username}</td>
                  <td className="py-3 px-4">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slatepos-100 text-slatepos-800">
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
                      <span className="text-slatepos-400">None</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleToggleActive(u)}
                      className={`px-3 py-1 rounded-full text-[10px] font-bold transition ${
                        u.isActive ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' : 'bg-red-100 text-red-800 hover:bg-red-200'
                      }`}
                    >
                      {u.isActive ? 'Active' : 'Disabled'}
                    </button>
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
