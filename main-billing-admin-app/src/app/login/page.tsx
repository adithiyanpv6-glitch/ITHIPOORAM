'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  User, 
  KeyRound, 
  ArrowRight, 
  ShieldCheck, 
  UserPlus, 
  CheckCircle2, 
  AlertCircle,
  Briefcase
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

  // Handle Sign In
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!username.trim()) {
      setErrorMessage('Please enter your name or username.');
      return;
    }
    if (!password.trim() || password.length < 4) {
      setErrorMessage('Please enter your 4-digit password.');
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
      
      setSuccessMessage('Access granted! Redirecting to Gateway...');
      setTimeout(() => {
        router.replace('/');
      }, 500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please check credentials.');
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
      setErrorMessage('Password must be exactly 4 digits for fast tablet access.');
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
      }, 600);
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0C0E12] text-stone-100 flex flex-col justify-center items-center p-4 sm:p-6 font-sans relative overflow-x-hidden">
      {/* Black-Faded 4K Sadhya Background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <img 
          src="/sadhya-dark-bg.jpg" 
          alt="Authentic Kerala Sadhya" 
          className="w-full h-full object-cover opacity-55 filter blur-[0.2px] contrast-110 scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0C0E12]/85 via-[#0C0E12]/70 to-[#0C0E12]/90" />
      </div>

      <div className="relative z-10 max-w-md w-full my-auto py-6">
        {/* Top Branding Section */}
        <div className="text-center mb-6">
          <div className="relative inline-block mb-3">
            <div className="absolute -inset-2 rounded-full bg-[#9E341D]/30 blur-md animate-pulse" />
            <img 
              src="/logo.png" 
              alt="ഇത്തിപൂരം (Ithi Pooram)" 
              className="relative w-20 h-20 sm:w-24 sm:h-24 object-contain drop-shadow-xl mx-auto rounded-full"
            />
          </div>
          
          <div className="flex justify-center mb-1">
            <img 
              src="/brand-calligraphy-white.png" 
              alt="ഇത്തിപൂരം" 
              className="h-10 sm:h-12 w-auto object-contain drop-shadow-md"
            />
          </div>
          <p className="text-xs text-amber-200/90 font-medium tracking-wide">
            Vanchiyoor, Trivandrum • Staff & Cashier Portal
          </p>
        </div>

        {/* Card Form */}
        <div className="bg-[#141821]/90 backdrop-blur-xl rounded-3xl border border-stone-800 shadow-2xl overflow-hidden p-6 sm:p-8">
          {/* Segmented Tab Switcher */}
          <div className="flex bg-stone-900/90 p-1.5 rounded-2xl border border-stone-800 mb-6">
            <button
              type="button"
              onClick={() => {
                setActiveTab('signin');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all duration-200 flex items-center justify-center space-x-1.5 ${
                activeTab === 'signin'
                  ? 'bg-[#9E341D] text-white shadow-md'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Staff Sign In</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('register');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all duration-200 flex items-center justify-center space-x-1.5 ${
                activeTab === 'register'
                  ? 'bg-[#9E341D] text-white shadow-md'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Register New Staff</span>
            </button>
          </div>

          {/* Feedback Notices */}
          {errorMessage && (
            <div className="mb-4 p-3.5 rounded-2xl bg-red-950/80 border border-red-800/80 text-red-200 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-800/80 text-emerald-200 text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* TAB 1: SIGN IN */}
          {activeTab === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-300 mb-1.5 uppercase tracking-wider">
                  Staff Name or Username
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-stone-500 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. rahul or admin"
                    autoComplete="username"
                    className="w-full pl-10 pr-4 py-3 bg-stone-900/90 border border-stone-700/80 rounded-2xl text-xs sm:text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:border-[#9E341D] focus:ring-1 focus:ring-[#9E341D]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-300 mb-1.5 uppercase tracking-wider">
                  4-Digit Password / PIN
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-stone-500 absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    maxLength={4}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••"
                    autoComplete="current-password"
                    className="w-full pl-10 pr-4 py-3 bg-stone-900/90 border border-stone-700/80 rounded-2xl text-xs sm:text-sm text-stone-100 placeholder-stone-500 tracking-widest font-mono focus:outline-none focus:border-[#9E341D] focus:ring-1 focus:ring-[#9E341D]"
                  />
                </div>
                <p className="text-[11px] text-stone-400 mt-1">
                  Enter your 4-digit PIN (Admin master password works for all accounts).
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 bg-[#9E341D] hover:bg-[#B33C22] text-white font-bold text-xs sm:text-sm rounded-2xl shadow-lg transition duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 mt-2"
              >
                <span>{loading ? 'Authenticating...' : 'Sign In to Tablet'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setActiveTab('register')}
                  className="text-xs text-amber-300/90 hover:text-amber-200 font-semibold transition"
                >
                  Need access? Register new staff account →
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: REGISTER NEW STAFF */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-300 mb-1.5 uppercase tracking-wider">
                  Staff Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-stone-500 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g. Rahul Menon"
                    className="w-full pl-10 pr-4 py-3 bg-stone-900/90 border border-stone-700/80 rounded-2xl text-xs sm:text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:border-[#9E341D] focus:ring-1 focus:ring-[#9E341D]"
                  />
                </div>
                <p className="text-[10px] text-stone-400 mt-1">
                  Your name will also serve as your login username.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-300 mb-1.5 uppercase tracking-wider">
                  Choose 4-Digit Password / PIN
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-stone-500 absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    maxLength={4}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    required
                    value={regPin}
                    onChange={(e) => setRegPin(e.target.value)}
                    placeholder="e.g. 1234"
                    className="w-full pl-10 pr-4 py-3 bg-stone-900/90 border border-stone-700/80 rounded-2xl text-xs sm:text-sm text-stone-100 placeholder-stone-500 tracking-widest font-mono focus:outline-none focus:border-[#9E341D] focus:ring-1 focus:ring-[#9E341D]"
                  />
                </div>
                <p className="text-[10px] text-stone-400 mt-1">
                  Simple 4-digit code for fast sign-in on Android/iOS tablets.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-300 mb-1.5 uppercase tracking-wider">
                  Assigned Staff Role
                </label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 text-stone-500 absolute left-3.5 top-3.5" />
                  <select
                    value={regRole}
                    onChange={(e: any) => setRegRole(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-stone-900/90 border border-stone-700/80 rounded-2xl text-xs sm:text-sm text-stone-100 focus:outline-none focus:border-[#9E341D] focus:ring-1 focus:ring-[#9E341D]"
                  >
                    <option value="CASHIER">Cashier (Billing POS Counter)</option>
                    <option value="MANAGER">Manager (Shift Reports & Operations)</option>
                    <option value="KITCHEN_STAFF">Kitchen Staff (Kitchen Display System)</option>
                    <option value="MENU_EDITOR">Menu Editor (Live Menu & Stock)</option>
                    <option value="MAIN_ADMIN">Main Admin / Owner (Full System Control)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 bg-[#9E341D] hover:bg-[#B33C22] text-white font-bold text-xs sm:text-sm rounded-2xl shadow-lg transition duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 mt-2"
              >
                <span>{loading ? 'Registering Staff...' : 'Create Staff Account'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="pt-2 text-center space-y-2">
                <div className="text-[10px] text-amber-400/90 font-medium">
                  🔒 Automatically synchronized to Master Excel &amp; Google Sheets Database
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('signin')}
                    className="text-xs text-stone-400 hover:text-stone-200 transition"
                  >
                    Already registered? Switch to Sign In →
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Security Notice */}
        <div className="text-center mt-6 text-stone-500 text-[11px] flex items-center justify-center space-x-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-stone-400" />
          <span>Ithi Pooram Central Gateway • Admin Master PIN [1111] Universal Override Active</span>
        </div>
      </div>
    </div>
  );
}
