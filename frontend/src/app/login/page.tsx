'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Lock, 
  User, 
  ArrowRight, 
  AlertCircle, 
  Sparkles,
  ChefHat,
  Receipt,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { apiRequest, setAuthToken } from '../../lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e?: React.FormEvent, customUser?: string, customPass?: string) => {
    if (e) e.preventDefault();
    const u = customUser || username;
    const p = customPass || password;

    if (!u || !p) {
      setError('Please enter both username and password.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          username: u.trim().toLowerCase(),
          password: p,
          deviceType: 'WEB_TERMINAL',
        }),
      });

      // Save token and user
      setAuthToken(res.token);
      localStorage.setItem('ithipooram_user', JSON.stringify(res.user));

      // Role-based redirect
      if (res.user.role === 'KITCHEN_STAFF') {
        router.push('/kitchen');
      } else if (res.user.role === 'CASHIER') {
        router.push('/billing');
      } else {
        router.push('/admin');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = (roleUser: string, rolePass: string) => {
    setUsername(roleUser);
    setPassword(rolePass);
    handleLogin(undefined, roleUser, rolePass);
  };

  return (
    <div className="min-h-screen bg-parchment-50 flex flex-col justify-center items-center p-4 font-sans">
      <div className="max-w-md w-full">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-brand-600 flex items-center justify-center text-white font-bold text-3xl mx-auto shadow-md shadow-brand-900/15 mb-3">
            ഇ
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slatepos-950 font-sans">
            ITHI POORAM
          </h1>
          <p className="text-xs font-semibold text-brand-700 font-malayalam">
            ഇത്തിപ്പൂരം • സ്റ്റാഫ് പോർട്ടൽ
          </p>
          <p className="text-xs text-slatepos-500 mt-1">
            Employee Authentication & POS Terminal Gateway
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-3xl border border-parchment-200 p-8 shadow-sm">
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slatepos-700 mb-1 uppercase tracking-wider">
                Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. cashier1, kitchen1, owner"
                  className="w-full text-sm pl-9 pr-3 py-2.5 rounded-xl border border-parchment-300 focus:outline-none focus:border-brand-500 font-medium"
                />
                <User className="w-4 h-4 text-slatepos-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slatepos-700 mb-1 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full text-sm pl-9 pr-3 py-2.5 rounded-xl border border-parchment-300 focus:outline-none focus:border-brand-500 font-medium"
                />
                <Lock className="w-4 h-4 text-slatepos-400 absolute left-3 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 flex items-center justify-center space-x-2 shadow-md shadow-brand-900/10 transition active:scale-98 mt-2"
            >
              {loading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>Sign In to Terminal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Switcher */}
          <div className="mt-8 pt-6 border-t border-parchment-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slatepos-400 block mb-2 text-center">
              Quick Role Switcher (Preloaded Demo Accounts)
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('cashier1', 'Cashier@1234')}
                className="p-2 rounded-xl border border-parchment-200 hover:border-brand-300 hover:bg-brand-50/50 text-left transition"
              >
                <div className="text-xs font-bold text-slatepos-900 flex items-center space-x-1">
                  <Receipt className="w-3.5 h-3.5 text-brand-600" />
                  <span>Cashier 1</span>
                </div>
                <div className="text-[10px] text-slatepos-500">PIN: 5566</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('kitchen1', 'Kitchen@1234')}
                className="p-2 rounded-xl border border-parchment-200 hover:border-emerald-300 hover:bg-emerald-50/50 text-left transition"
              >
                <div className="text-xs font-bold text-slatepos-900 flex items-center space-x-1">
                  <ChefHat className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Kitchen Chef</span>
                </div>
                <div className="text-[10px] text-slatepos-500">KDS Display</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('manager', 'Manager@1234')}
                className="p-2 rounded-xl border border-parchment-200 hover:border-blue-300 hover:bg-blue-50/50 text-left transition"
              >
                <div className="text-xs font-bold text-slatepos-900 flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>Manager</span>
                </div>
                <div className="text-[10px] text-slatepos-500">PIN: 3344</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('owner', 'Owner@1234')}
                className="p-2 rounded-xl border border-parchment-200 hover:border-purple-300 hover:bg-purple-50/50 text-left transition"
              >
                <div className="text-xs font-bold text-slatepos-900 flex items-center space-x-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                  <span>Owner / Admin</span>
                </div>
                <div className="text-[10px] text-slatepos-500">Full Access (1122)</div>
              </button>
            </div>
          </div>
        </div>

        {/* Home link */}
        <div className="text-center mt-6">
          <Link
            href="/"
            className="text-xs font-semibold text-slatepos-600 hover:text-brand-700"
          >
            ← Return to System Overview
          </Link>
        </div>
      </div>
    </div>
  );
}
