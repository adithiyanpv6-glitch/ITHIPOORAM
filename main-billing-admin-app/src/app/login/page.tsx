'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  User, 
  KeyRound, 
  ArrowRight, 
  UserPlus, 
  CheckCircle2, 
  AlertCircle,
  ShieldCheck,
  ChefHat,
  Receipt,
  Crown
} from 'lucide-react';
import { apiRequest } from '../../lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'signin' | 'register'>('signin');
  
  // Sign-in states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // Register states
  const [regName, setRegName] = useState('');
  const [regPin, setRegPin] = useState('');
  const [regRole, setRegRole] = useState<'CASHIER' | 'MANAGER' | 'KITCHEN_STAFF' | 'MENU_EDITOR' | 'MAIN_ADMIN'>('CASHIER');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Quick 1-Tap Login with Default Role PINs
  const handleQuickLogin = async (userRole: string, defaultPin: string) => {
    setUsername(userRole);
    setPassword(defaultPin);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      setLoading(true);
      const res = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username: userRole, password: defaultPin }),
      });

      if (typeof window !== 'undefined') {
        localStorage.setItem('ithipooram_user', JSON.stringify(res.user));
        localStorage.setItem('ithipooram_token', res.token);
      }
      
      setSuccessMessage(`Access granted as ${res.user.fullName}! Entering POS...`);
      setTimeout(() => {
        router.replace('/');
      }, 400);
    } catch (err: any) {
      setErrorMessage(err.message || 'Quick login failed.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Manual Sign In
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!username.trim()) {
      setErrorMessage('Please enter staff username or role.');
      return;
    }
    if (!password.trim() || password.length < 4) {
      setErrorMessage('Please enter your 4-digit PIN password.');
      return;
    }

    try {
      setLoading(true);
      const res = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username: username.trim(), password: password.trim() }),
      });

      if (typeof window !== 'undefined') {
        localStorage.setItem('ithipooram_user', JSON.stringify(res.user));
        localStorage.setItem('ithipooram_token', res.token);
      }
      
      setSuccessMessage('Access granted! Redirecting to POS...');
      setTimeout(() => {
        router.replace('/');
      }, 400);
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please check your PIN.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Staff Registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!regName.trim()) {
      setErrorMessage('Please enter staff full name.');
      return;
    }
    if (!regPin.trim() || regPin.length !== 4) {
      setErrorMessage('PIN must be exactly 4 digits for fast tablet access.');
      return;
    }

    try {
      setLoading(true);
      const res = await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: regName.trim(),
          pin: regPin.trim(),
          role: regRole,
        }),
      });

      if (typeof window !== 'undefined') {
        localStorage.setItem('ithipooram_user', JSON.stringify(res.user));
        localStorage.setItem('ithipooram_token', 'jwt-staff-session');
      }

      setSuccessMessage(`Staff "${res.user.fullName}" registered successfully! Redirecting...`);
      setTimeout(() => {
        router.replace('/');
      }, 500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0C0E12] text-zinc-100 flex flex-col justify-center items-center p-4 sm:p-6 font-sans relative">
      
      <div className="relative z-10 max-w-md w-full my-auto py-6">
        
        {/* Top Branding Section (Matches Admin Panel) */}
        <div className="text-center mb-6 space-y-2">
          <div className="flex justify-center mb-1">
            <img 
              src="/brand-calligraphy-uploaded.png" 
              alt="ഇത്തിപ്പൂരം" 
              className="h-14 sm:h-16 w-auto object-contain invert brightness-200 drop-shadow-md"
            />
          </div>
          <h2 className="text-sm font-black tracking-wider uppercase text-zinc-300">
            ITHI POORAM POS TERMINAL
          </h2>
          <p className="text-xs text-zinc-500 font-medium">
            Vanchiyoor, Trivandrum • Secure Staff Access
          </p>
        </div>

        {/* Card Form (Black, White & Zinc Theme) */}
        <div className="bg-[#141821] rounded-3xl border border-zinc-800 shadow-2xl p-6 sm:p-7 space-y-5">
          
          {/* Segmented Tab Switcher */}
          <div className="flex bg-zinc-900 p-1 rounded-2xl border border-zinc-800">
            <button
              type="button"
              onClick={() => {
                setActiveTab('signin');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 py-2 text-xs font-black rounded-xl transition cursor-pointer flex items-center justify-center space-x-1.5 ${
                activeTab === 'signin'
                  ? 'bg-white text-black shadow-xs'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Staff Login</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('register');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 py-2 text-xs font-black rounded-xl transition cursor-pointer flex items-center justify-center space-x-1.5 ${
                activeTab === 'register'
                  ? 'bg-white text-black shadow-xs'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>New Staff</span>
            </button>
          </div>

          {/* Feedback Notices */}
          {errorMessage && (
            <div className="p-3 rounded-2xl bg-red-950/80 border border-red-800/80 text-red-200 text-xs flex items-center space-x-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-2xl bg-emerald-950/80 border border-emerald-800/80 text-emerald-200 text-xs flex items-center space-x-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* TAB 1: SIGN IN */}
          {activeTab === 'signin' && (
            <div className="space-y-4">
              
              {/* Quick 1-Tap Role Buttons for Touchscreen POS */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                  Quick Staff PIN Login
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('admin', '5566')}
                    className="p-2.5 rounded-2xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700/80 text-center transition cursor-pointer active:scale-95 group"
                  >
                    <Crown className="w-4 h-4 text-amber-400 mx-auto mb-1 group-hover:scale-110 transition" />
                    <span className="text-[11px] font-black block text-white">Manager</span>
                    <span className="text-[9px] font-mono text-zinc-400">PIN: 5566</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickLogin('cashier', '7788')}
                    className="p-2.5 rounded-2xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700/80 text-center transition cursor-pointer active:scale-95 group"
                  >
                    <Receipt className="w-4 h-4 text-emerald-400 mx-auto mb-1 group-hover:scale-110 transition" />
                    <span className="text-[11px] font-black block text-white">Cashier</span>
                    <span className="text-[9px] font-mono text-zinc-400">PIN: 7788</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickLogin('chef', '1122')}
                    className="p-2.5 rounded-2xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700/80 text-center transition cursor-pointer active:scale-95 group"
                  >
                    <ChefHat className="w-4 h-4 text-orange-400 mx-auto mb-1 group-hover:scale-110 transition" />
                    <span className="text-[11px] font-black block text-white">Chef (KDS)</span>
                    <span className="text-[9px] font-mono text-zinc-400">PIN: 1122</span>
                  </button>
                </div>
              </div>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-zinc-800"></div>
                <span className="flex-shrink mx-3 text-[10px] uppercase font-bold text-zinc-600">
                  Or Manual PIN
                </span>
                <div className="flex-grow border-t border-zinc-800"></div>
              </div>

              <form onSubmit={handleSignIn} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 mb-1 uppercase tracking-wider">
                    Staff Name / Username
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. cashier or rahul"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 mb-1 uppercase tracking-wider">
                    4-Digit Password / PIN
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={6}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-xs font-mono tracking-widest text-white placeholder-zinc-500 focus:outline-none focus:border-white transition"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-2xl bg-white hover:bg-zinc-200 text-black text-xs font-black flex items-center justify-center space-x-2 transition shadow-md active:scale-98 cursor-pointer disabled:opacity-50"
                >
                  <span>{loading ? 'Authenticating...' : 'Sign In to POS Counter'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: REGISTER NEW STAFF */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-zinc-400 mb-1 uppercase tracking-wider">
                  Staff Full Name
                </label>
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="e.g. Arun Kumar"
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-400 mb-1 uppercase tracking-wider">
                  Role
                </label>
                <select
                  value={regRole}
                  onChange={(e: any) => setRegRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-white transition cursor-pointer"
                >
                  <option value="CASHIER">Cashier (POS Counter)</option>
                  <option value="MANAGER">Store Manager / Admin</option>
                  <option value="KITCHEN_STAFF">Kitchen Chef (KDS)</option>
                  <option value="MENU_EDITOR">Waiter / Service Staff</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-400 mb-1 uppercase tracking-wider">
                  Set 4-Digit Password / PIN
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  required
                  value={regPin}
                  onChange={(e) => setRegPin(e.target.value)}
                  placeholder="e.g. 2233"
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-xs font-mono tracking-widest text-white placeholder-zinc-500 focus:outline-none focus:border-white transition"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-2xl bg-white hover:bg-zinc-200 text-black text-xs font-black flex items-center justify-center space-x-2 transition shadow-md active:scale-98 cursor-pointer disabled:opacity-50"
              >
                <span>{loading ? 'Registering...' : 'Register & Log In'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

        </div>

        {/* Footer */}
        <div className="mt-4 text-center">
          <p className="text-[11px] text-zinc-500 font-medium">
            Unified POS, Table Ledger &amp; Kitchen System
          </p>
        </div>

      </div>

    </div>
  );
}
