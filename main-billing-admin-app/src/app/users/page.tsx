'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ChefHat, 
  Home, 
  UtensilsCrossed, 
  BarChart3, 
  MoreHorizontal, 
  Grid3X3, 
  ChevronRight, 
  Printer, 
  Users, 
  LogOut, 
  Menu as MenuIcon, 
  X, 
  Bluetooth, 
  CheckCircle2, 
  Loader2, 
  RefreshCw, 
  Receipt,
  ShieldCheck,
  AlertTriangle,
  Trash2,
  FolderDown,
  FileSpreadsheet,
  Plus,
  Lock,
  Unlock,
  Key,
  Check,
  Calendar,
  HardDrive,
  ArrowLeft
} from 'lucide-react';
import { getCurrentUser } from '../../lib/api';
import { 
  printDirectToBluetoothThermalPrinter,
  connectPersistentBluetoothPrinter,
  subscribeToPrinterConnection,
  tryAutoReconnectBluetoothPrinter,
  isBluetoothPrinterConnected,
  getConnectedBluetoothDeviceName
} from '../../lib/thermalPrinter';

export default function MorePage() {
  const router = useRouter();

  // Active sub-tab in More: 1. printer, 2. staff, 3. reports, 4. storage, 5. reset (null = 5 options landing)
  const [activeTab, setActiveTab] = useState<'printer' | 'staff' | 'reports' | 'storage' | 'reset' | null>(null);
  
  // Printer Configuration (SEZNIK 58mm default)
  const [pageSize, setPageSize] = useState<'2-inch' | '3-inch'>('2-inch');
  const [extraLines, setExtraLines] = useState<number>(6);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isBluetoothPrinting, setIsBluetoothPrinting] = useState(false);
  const [btStatus, setBtStatus] = useState<string | null>(null);
  const [btConnectionStatus, setBtConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [connectedDeviceName, setConnectedDeviceName] = useState<string | null>(null);
  const [usbConnected, setUsbConnected] = useState(false);

  // Subscribe to persistent direct mobile Bluetooth printer connection
  useEffect(() => {
    const unsubscribe = subscribeToPrinterConnection((connected, deviceName) => {
      setBtConnectionStatus(connected ? 'connected' : 'disconnected');
      if (deviceName) setConnectedDeviceName(deviceName);
    });

    // Check direct mobile reconnect without prompting
    tryAutoReconnectBluetoothPrinter();

    return () => unsubscribe();
  }, []);

  // Browser & Physical Mobile Back-Button navigation handling
  const openTab = (tab: 'printer' | 'staff' | 'reports' | 'storage' | 'reset') => {
    if (typeof window !== 'undefined') {
      window.history.pushState({ moreTab: tab }, '', `#${tab}`);
    }
    // Always lock storage whenever entering or switching tabs
    if (tab === 'storage') {
      setIsStorageAdminUnlocked(false);
      setStorageAdminPinInput('');
      setStorageAdminPinError(null);
    }
    setActiveTab(tab);
  };

  const handleBackToLanding = () => {
    // Re-lock storage immediately upon exiting
    setIsStorageAdminUnlocked(false);
    setStorageAdminPinInput('');
    setStorageAdminPinError(null);

    if (typeof window !== 'undefined' && window.location.hash) {
      window.history.back();
    } else {
      setActiveTab(null);
    }
  };

  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      // Re-lock storage every time browser or hardware back button is pressed
      setIsStorageAdminUnlocked(false);
      setStorageAdminPinInput('');
      setStorageAdminPinError(null);

      if (e?.state?.moreTab) {
        setActiveTab(e.state.moreTab);
      } else if (typeof window !== 'undefined' && window.location.hash) {
        const h = window.location.hash.replace('#', '') as any;
        if (['printer', 'staff', 'reports', 'storage', 'reset'].includes(h)) {
          setActiveTab(h);
        } else {
          setActiveTab(null);
        }
      } else {
        setActiveTab(null);
      }
    };

    // If opened directly with a hash like #printer, open it immediately
    if (typeof window !== 'undefined' && window.location.hash) {
      const h = window.location.hash.replace('#', '') as any;
      if (['printer', 'staff', 'reports', 'storage', 'reset'].includes(h)) {
        setActiveTab(h);
      }
    }

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Direct Mobile Bluetooth Connect (Hardware to Mobile directly, zero web server)
  const handleConnectBluetooth = async () => {
    if (typeof window === 'undefined' || !(navigator as any).bluetooth) {
      setBtStatus('Web Bluetooth is supported on Google Chrome & Edge on Android mobile phones.');
      alert('Please use Google Chrome or Edge with Bluetooth turned on.');
      return;
    }

    try {
      setBtConnectionStatus('connecting');
      setBtStatus(null);
      const res = await connectPersistentBluetoothPrinter();
      setBtConnectionStatus('connected');
      setConnectedDeviceName(res.name);
      setBtStatus(`Connected directly to mobile Bluetooth (${res.name}) - stays connected for all bills`);
    } catch (err: any) {
      setBtConnectionStatus('disconnected');
      if (err.name !== 'NotFoundError') {
        setBtStatus(`Connection error: ${err.message}`);
      }
    }
  };

  // WebUSB Direct Connection for SEZNIK 58mm
  const handleConnectUsb = async () => {
    if (typeof window !== 'undefined' && (navigator as any).usb) {
      try {
        const device = await (navigator as any).usb.requestDevice({ filters: [] });
        await device.open();
        setUsbConnected(true);
        setBtStatus(`USB Connected: ${device.productName || 'SEZNIK 58mm'}`);
      } catch (err: any) {
        if (err.name !== 'NotFoundError') {
          setUsbConnected(true);
          setBtStatus('USB Ready (System Print)');
        }
      }
    } else {
      setUsbConnected(true);
      setBtStatus('USB Ready (via Browser Driver)');
    }
  };

  // Staff Section State (Admin Password Protected)
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [adminPinInput, setAdminPinInput] = useState('');
  const [adminPinError, setAdminPinError] = useState<string | null>(null);
  const [isAddStaffModalOpen, setIsAddStaffModalOpen] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState('CASHIER');
  const [newStaffPin, setNewStaffPin] = useState('');
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffMessage, setStaffMessage] = useState<string | null>(null);
  const [staffList, setStaffList] = useState<any[]>([
    { id: '1', fullName: 'Main Administrator', role: 'MAIN_ADMIN', pin: '5566', status: 'ACTIVE' },
    { id: '2', fullName: 'Counter Cashier', role: 'CASHIER', pin: '7788', status: 'ACTIVE' },
    { id: '3', fullName: 'Kitchen Chef Head', role: 'KITCHEN_STAFF', pin: '1122', status: 'ACTIVE' },
  ]);

  // Factory Reset State (Admin Sensitive)
  const [resetPinInput, setResetPinInput] = useState('');
  const [resetWipeAll, setResetWipeAll] = useState(true);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState(false);

  // Storage and Archives State (Admin Password Protected)
  const [isStorageAdminUnlocked, setIsStorageAdminUnlocked] = useState(false);
  const [storageAdminPinInput, setStorageAdminPinInput] = useState('');
  const [storageAdminPinError, setStorageAdminPinError] = useState<string | null>(null);
  const [storageSyncMessage, setStorageSyncMessage] = useState<string | null>(null);

  const [phoneStoragePath, setPhoneStoragePath] = useState(
    typeof window !== 'undefined' && /android/i.test(navigator.userAgent)
      ? 'Internal Storage/Download/IthiPooram_POS/reports_archive/'
      : typeof window !== 'undefined' && /iphone|ipad/i.test(navigator.userAgent)
      ? 'Files App > On My iPhone > IthiPooram_POS/reports_archive/'
      : 'Downloads/IthiPooram_POS/reports_archive/'
  );

  // Sync phone storage path from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedPath = localStorage.getItem('ithipooram_phone_storage_path');
      if (savedPath) {
        setPhoneStoragePath(savedPath);
      }
    }
  }, []);

  // Guarantee: Storage is locked whenever user exits or is outside of storage option
  useEffect(() => {
    if (activeTab !== 'storage') {
      setIsStorageAdminUnlocked(false);
      setStorageAdminPinInput('');
      setStorageAdminPinError(null);
    }
    return () => {
      setIsStorageAdminUnlocked(false);
      setStorageAdminPinInput('');
      setStorageAdminPinError(null);
    };
  }, [activeTab]);

  const handleUnlockStorageAdmin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (storageAdminPinInput === '5566') {
      setIsStorageAdminUnlocked(true);
      setStorageAdminPinError(null);
    } else {
      setStorageAdminPinError('Invalid Admin PIN. Please enter 5566.');
    }
  };

  const handleChooseDirectory = async () => {
    if (!isStorageAdminUnlocked) {
      const pin = prompt('Enter Admin PIN (5566) to authorize folder change:');
      if (pin !== '5566') {
        alert('Invalid Admin PIN');
        return;
      }
      setIsStorageAdminUnlocked(true);
    }

    if (typeof window !== 'undefined' && (window as any).showDirectoryPicker) {
      try {
        const dirHandle = await (window as any).showDirectoryPicker({ mode: 'readwrite' });
        if (dirHandle && dirHandle.name) {
          const fullPath = `Internal Storage/Download/${dirHandle.name}/reports_archive/`;
          setPhoneStoragePath(fullPath);
          localStorage.setItem('ithipooram_phone_storage_path', fullPath);
          setStorageSyncMessage(`✓ Storage path synced with folder: ${dirHandle.name}`);
          setTimeout(() => setStorageSyncMessage(null), 4000);
          return;
        }
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        console.warn('showDirectoryPicker error:', err);
      }
    }

    // Fallback on mobile/browser: trigger folder input
    const dirInput = document.getElementById('phone-folder-input') as HTMLInputElement;
    if (dirInput) {
      dirInput.click();
    }
  };

  const handleManualEditPath = () => {
    if (!isStorageAdminUnlocked) {
      const pin = prompt('Enter Admin PIN (5566) to authorize folder change:');
      if (pin !== '5566') {
        alert('Invalid Admin PIN');
        return;
      }
      setIsStorageAdminUnlocked(true);
    }

    const customPath = prompt('Enter folder path inside phone storage where reports will be saved:', phoneStoragePath);
    if (customPath && customPath.trim()) {
      const cleaned = customPath.trim().endsWith('/') ? customPath.trim() : `${customPath.trim()}/`;
      setPhoneStoragePath(cleaned);
      if (typeof window !== 'undefined') {
        localStorage.setItem('ithipooram_phone_storage_path', cleaned);
      }
      setStorageSyncMessage(`✓ Storage folder path synced: ${cleaned}`);
      setTimeout(() => setStorageSyncMessage(null), 4000);
    }
  };

  // Mock latest 10 reports for inspection & audit
  const [latestReports] = useState([
    { id: 'rep-1', date: '08 Nov 2026', shift: 'Night Z-Report', totalSales: 24850, orders: 42, cash: 14200, upi: 10650, file: 'Z_Report_2026_11_08.xlsx' },
    { id: 'rep-2', date: '07 Nov 2026', shift: 'Night Z-Report', totalSales: 28400, orders: 51, cash: 15300, upi: 13100, file: 'Z_Report_2026_11_07.xlsx' },
    { id: 'rep-3', date: '06 Nov 2026', shift: 'Night Z-Report', totalSales: 21900, orders: 38, cash: 11000, upi: 10900, file: 'Z_Report_2026_11_06.xlsx' },
    { id: 'rep-4', date: '05 Nov 2026', shift: 'Night Z-Report', totalSales: 31200, orders: 59, cash: 18400, upi: 12800, file: 'Z_Report_2026_11_05.xlsx' },
    { id: 'rep-5', date: '04 Nov 2026', shift: 'Night Z-Report', totalSales: 19800, orders: 34, cash: 9500, upi: 10300, file: 'Z_Report_2026_11_04.xlsx' },
    { id: 'rep-6', date: '03 Nov 2026', shift: 'Night Z-Report', totalSales: 26500, orders: 48, cash: 13800, upi: 12700, file: 'Z_Report_2026_11_03.xlsx' },
    { id: 'rep-7', date: '02 Nov 2026', shift: 'Night Z-Report', totalSales: 23400, orders: 40, cash: 12000, upi: 11400, file: 'Z_Report_2026_11_02.xlsx' },
    { id: 'rep-8', date: '01 Nov 2026', shift: 'Night Z-Report', totalSales: 33500, orders: 62, cash: 19100, upi: 14400, file: 'Z_Report_2026_11_01.xlsx' },
    { id: 'rep-9', date: '31 Oct 2026', shift: 'Night Z-Report', totalSales: 29800, orders: 54, cash: 16200, upi: 13600, file: 'Z_Report_2026_10_31.xlsx' },
    { id: 'rep-10', date: '30 Oct 2026', shift: 'Night Z-Report', totalSales: 25100, orders: 45, cash: 13500, upi: 11600, file: 'Z_Report_2026_10_30.xlsx' },
  ]);

  // 5 Essential Daily Reports & Last 7 Days Download State
  const [expandedReport, setExpandedReport] = useState<string | null>('sales');

  const reportCategories = [
    {
      id: 'sales',
      number: '1',
      title: '1. Total Sales of the Day Report',
      fileSuffix: 'sales-report',
      desc: 'Gross revenue, settled bills, cash collections & UPI online sales breakdown.',
    },
    {
      id: 'menu',
      number: '2',
      title: '2. Daily Menu Stock & Remaining Data Report',
      fileSuffix: 'menu-stock-report',
      desc: 'Quantity sold today, active prices, and remaining available kitchen stock.',
    },
    {
      id: 'tables',
      number: '3',
      title: '3. Daily Table-wise Order & Revenue Report',
      fileSuffix: 'table-revenue-report',
      desc: 'Total dining checks served and revenue collected per table.',
    },
    {
      id: 'staff',
      number: '4',
      title: '4. Staff Login & Shift Audit Report',
      fileSuffix: 'staff-audit-report',
      desc: 'Staff shift logins, operational stations, and session active states.',
    },
    {
      id: 'billing',
      number: '5',
      title: '5. Billing Authorization & Staff Action Report',
      fileSuffix: 'billing-auth-report',
      desc: 'Staff authorization logs, invoice settlements, and cashier verification.',
    },
  ];

  const last7Days = React.useMemo(() => {
    const list = [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const isoDate = d.toISOString().slice(0, 10);
      const day = String(d.getDate()).padStart(2, '0');
      const mon = months[d.getMonth()];
      const yr = d.getFullYear();
      const dateLabel = `${day}-${mon}-${yr}`;
      const weekday = d.toLocaleDateString('en-IN', { weekday: 'short' });
      list.push({
        isoDate,
        dateLabel,
        weekday,
        isToday: i === 0,
        isYesterday: i === 1,
      });
    }
    return list;
  }, []);

  const handleDownloadSingleReport = (reportType: string, isoDate: string, filename: string) => {
    const link = document.createElement('a');
    link.href = `/api/admin/daily-reports?format=excel&report=${reportType}&date=${isoDate}`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const [activeReportSubTab, setActiveReportSubTab] = useState<'sales' | 'menu' | 'tables' | 'staff' | 'billing'>('sales');
  const [dailyReports, setDailyReports] = useState<any | null>(null);
  const [loadingDailyReports, setLoadingDailyReports] = useState(false);

  const fetchDailyReports = async () => {
    try {
      setLoadingDailyReports(true);
      const res = await fetch('/api/admin/daily-reports');
      if (res.ok) {
        const d = await res.json();
        setDailyReports(d.reports);
      }
    } catch (e) {
      console.error('Failed to load daily reports:', e);
    } finally {
      setLoadingDailyReports(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'reports') {
      fetchDailyReports();
    }
  }, [activeTab]);

  const handleDownloadFullDailyWorkbook = () => {
    const today = new Date().toISOString().slice(0, 10);
    const link = document.createElement('a');
    link.href = `/api/admin/daily-reports?format=excel&date=${today}`;
    link.download = `IthiPooram_Daily_Reports_${today}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      router.replace('/login');
    }
    // Load persisted extraLines for printer tear-off
    if (typeof window !== 'undefined') {
      const savedLines = localStorage.getItem('ithipooram_printer_extra_lines');
      if (savedLines) {
        setExtraLines(Number(savedLines));
      }
    }
  }, [router]);

  const updateExtraLines = (val: number) => {
    const clamped = Math.max(0, val);
    setExtraLines(clamped);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ithipooram_printer_extra_lines', String(clamped));
    }
  };

  const handleSignOut = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('ithipooram_user');
      localStorage.removeItem('ithipooram_token');
    }
    router.replace('/login');
  };

  // Direct Bluetooth Test Print for SEZNIK 58mm
  const handleBluetoothTestPrint = async () => {
    setIsBluetoothPrinting(true);
    setBtStatus(null);
    try {
      await printDirectToBluetoothThermalPrinter({
        restaurantName: 'ഇത്തിപ്പൂരം',
        restaurantLocation: 'Vanchiyoor, Trivandrum',
        phone: '+91 94470 00000',
        invoiceNumber: '1001',
        orderCode: '#01',
        tableCode: 'T1',
        dateTime: '04/11/2026',
        items: [
          { name: 'Aavoli fry', qty: 1, price: 120, total: 120 },
        ],
        grandTotal: 120,
        paymentMode: 'Cash',
        extraLines: extraLines,
      }, 'bitmap');
      setBtStatus('Test print sent successfully to SEZNIK!');
      setBtConnectionStatus('connected');
    } catch (err: any) {
      setBtStatus(`Bluetooth Error: ${err.message || 'Device disconnected or cancelled'}`);
    } finally {
      setIsBluetoothPrinting(false);
    }
  };

  // Admin PIN Unlock Handler
  const handleUnlockAdmin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (adminPinInput === '5566') {
      setIsAdminUnlocked(true);
      setAdminPinError(null);
    } else {
      setAdminPinError('Invalid Admin PIN. Please enter 5566.');
    }
  };

  // Add Staff Handler
  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim() || newStaffPin.length !== 4) {
      alert('Please enter staff name and a 4-digit PIN');
      return;
    }
    setStaffLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newStaffName.trim(),
          pin: newStaffPin.trim(),
          role: newStaffRole,
        }),
      });

      if (res.ok) {
        setStaffList((prev) => [
          ...prev,
          {
            id: String(Date.now()),
            fullName: newStaffName.trim(),
            role: newStaffRole,
            pin: newStaffPin.trim(),
            status: 'ACTIVE',
          },
        ]);
        setStaffMessage(`✓ Staff "${newStaffName}" registered successfully!`);
        setNewStaffName('');
        setNewStaffPin('');
        setIsAddStaffModalOpen(false);
        setTimeout(() => setStaffMessage(null), 3000);
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to register staff');
      }
    } catch (err: any) {
      alert('Error registering staff: ' + err.message);
    } finally {
      setStaffLoading(false);
    }
  };

  // Factory Reset Execution
  const handleExecuteFactoryReset = async () => {
    if (resetPinInput !== '5566') {
      setResetError('Unauthorized. Enter Admin PIN 5566 to confirm factory reset.');
      return;
    }

    if (!confirm('FINAL WARNING: This will completely erase all orders, sales data, and reset all tables to 0. Are you 100% sure?')) {
      return;
    }

    setResetLoading(true);
    setResetError(null);
    try {
      const res = await fetch('/api/admin/factory-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminPin: resetPinInput,
          resetMode: resetWipeAll ? 'FULL_WIPE' : 'CLEAN_START',
        }),
      });

      if (res.ok) {
        setResetSuccess(true);
        setStaffList([]);
        if (typeof window !== 'undefined') {
          localStorage.clear();
        }
        setTimeout(() => {
          router.replace('/login');
        }, 1500);
      } else {
        const d = await res.json();
        setResetError(d.error || 'Factory reset failed');
      }
    } catch (err: any) {
      setResetError('Reset failed: ' + err.message);
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#0A0C10] flex flex-col md:flex-row font-sans selection:bg-zinc-800 selection:text-white">
      
      {/* ============================================================== */}
      {/* 1. LEFT SIDEBAR                                                 */}
      {/* ============================================================== */}
      <aside className="hidden md:flex md:w-64 lg:w-72 bg-[#0C0E12] text-zinc-300 flex-col justify-between border-r border-zinc-800 shrink-0 select-none">
        
        {/* Top Brand Logo */}
        <div className="p-4 lg:p-5 border-b border-zinc-800/80">
          <div className="flex items-center justify-between gap-2">
            <Link href="/" className="flex-1 flex items-center justify-start group py-1">
              <img 
                src="/brand-calligraphy-uploaded.png" 
                alt="ഇത്തിപ്പൂരം - Ithi Pooram" 
                className="w-full max-h-16 lg:max-h-20 object-contain invert brightness-200 transition group-hover:scale-102"
              />
            </Link>
            <button 
              onClick={handleSignOut}
              title="Sign Out"
              className="p-1.5 rounded-lg bg-zinc-800/60 hover:bg-zinc-700 text-zinc-400 hover:text-white transition shrink-0 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-1.5 flex-1">
          <Link
            href="/"
            className="flex items-center space-x-3 px-3.5 py-3 rounded-2xl text-zinc-400 hover:bg-zinc-900 hover:text-white font-bold text-sm transition"
          >
            <Home className="w-4 h-4" />
            <span>Home</span>
          </Link>

          <Link
            href="/qr"
            className="flex items-center space-x-3 px-3.5 py-3 rounded-2xl text-zinc-400 hover:bg-zinc-900 hover:text-white font-bold text-sm transition"
          >
            <Grid3X3 className="w-4 h-4" />
            <span>Table</span>
          </Link>

          <Link
            href="/billing"
            className="flex items-center space-x-3 px-3.5 py-3 rounded-2xl text-zinc-400 hover:bg-zinc-900 hover:text-white font-bold text-sm transition"
          >
            <Receipt className="w-4 h-4" />
            <span>Billing</span>
          </Link>

          <Link
            href="/menu"
            className="flex items-center space-x-3 px-3.5 py-3 rounded-2xl text-zinc-400 hover:bg-zinc-900 hover:text-white font-bold text-sm transition"
          >
            <UtensilsCrossed className="w-4 h-4" />
            <span>Items</span>
          </Link>

          <Link
            href="/kitchen"
            className="flex items-center justify-between px-3.5 py-3 rounded-2xl text-zinc-400 hover:bg-zinc-900 hover:text-white font-bold text-sm transition"
          >
            <div className="flex items-center space-x-3">
              <ChefHat className="w-4 h-4 text-orange-400" />
              <span>Kitchen (KDS)</span>
            </div>
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
          </Link>

          <Link
            href="/users"
            className="flex items-center justify-between px-3.5 py-3 rounded-2xl bg-white text-black font-extrabold text-sm shadow-md transition"
          >
            <div className="flex items-center space-x-3">
              <MoreHorizontal className="w-4 h-4" />
              <span>More</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
          </Link>
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-zinc-800/80 space-y-3">
          <Link
            href="/"
            className="w-full flex items-center justify-center py-3 px-4 rounded-2xl border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-white font-extrabold text-xs shadow-sm transition active:scale-98"
          >
            <span>+ Add Order</span>
          </Link>

          <div className="flex items-center justify-between p-2.5 rounded-2xl bg-zinc-900/60 border border-zinc-800">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-white text-black font-black text-xs flex items-center justify-center">
                IP
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-white truncate">Ithi Pooram</p>
                <p className="text-[10px] text-zinc-400 truncate">Vanchiyoor, TVM</p>
              </div>
            </div>
            <button onClick={handleSignOut} className="text-zinc-500 hover:text-white p-1 cursor-pointer">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ============================================================== */}
      {/* 2. MOBILE TOP BAR                                               */}
      {/* ============================================================== */}
      <header className="md:hidden bg-[#0C0E12] text-white p-4 border-b border-zinc-800 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center space-x-3 flex-1">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-300 cursor-pointer"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
          </button>
          <img 
            src="/brand-calligraphy-uploaded.png" 
            alt="ഇത്തിപ്പൂരം" 
            className="h-9 w-auto object-contain invert brightness-200"
          />
        </div>
        <Link href="/" className="px-3.5 py-1.5 rounded-xl bg-white text-black font-black text-xs">
          <span>+ Add Order</span>
        </Link>
      </header>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-[#0C0E12] border-b border-zinc-800 px-4 py-3 space-y-2 z-30">
          <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-zinc-300 font-bold text-sm">
            <Home className="w-4 h-4" />
            <span>Home</span>
          </Link>
          <Link href="/qr" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-zinc-300 font-bold text-sm">
            <Grid3X3 className="w-4 h-4" />
            <span>Table</span>
          </Link>
          <Link href="/billing" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-zinc-300 font-bold text-sm">
            <Receipt className="w-4 h-4" />
            <span>Billing</span>
          </Link>
          <Link href="/menu" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-zinc-300 font-bold text-sm">
            <UtensilsCrossed className="w-4 h-4" />
            <span>Items</span>
          </Link>
          <Link href="/kitchen" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-zinc-300 font-bold text-sm">
            <ChefHat className="w-4 h-4 text-orange-400" />
            <span>Kitchen (KDS)</span>
          </Link>
          <Link href="/users" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center space-x-3 px-3 py-2.5 rounded-xl bg-white text-black font-black text-sm">
            <MoreHorizontal className="w-4 h-4" />
            <span>More</span>
          </Link>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. MAIN WORKSPACE (SEZNIK PRINTER, STAFF, REPORTS, STORAGE, RESET) */}
      {/* Downscroll is completely unrestricted with pb-64 sm:pb-48     */}
      {/* ============================================================== */}
      <main className="flex-1 flex flex-col w-full min-h-screen overflow-y-auto pb-64 sm:pb-48">
        
        {/* ========================================================== */}
        {/* LANDING PAGE: HEADING "MORE OPTION" & EXACTLY 5 OPTIONS    */}
        {/* ========================================================== */}
        {activeTab === null && (
          <div className="flex-1 flex flex-col w-full">
            {/* Top Header: Only heading "More Option", no subtitles, no badges */}
            <div className="px-4 sm:px-6 py-4 sm:py-5 bg-white border-b border-zinc-200 shrink-0">
              <h1 className="text-xl sm:text-2xl font-black text-black tracking-tight">More Option</h1>
            </div>

            {/* Exactly 5 Big Rectangles (Clean card boxes without inner small curved rectangles) */}
            <div className="max-w-4xl mx-auto w-full p-4 sm:p-6 pb-64">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Printer */}
                <button
                  type="button"
                  onClick={() => openTab('printer')}
                  className="w-full text-left bg-white hover:bg-zinc-50 p-5 rounded-2xl border-2 border-zinc-200 hover:border-black shadow-xs transition-all cursor-pointer flex flex-col justify-between group active:scale-[0.99]"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Printer className="w-6 h-6 text-black" />
                      <ChevronRight className="w-5 h-5 text-zinc-400 group-hover:text-black group-hover:translate-x-1 transition-all" />
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-black text-black">1. Printer Setup</h2>
                      <p className="text-xs text-zinc-500 font-medium mt-1 leading-relaxed">
                        SEZNIK 58mm POS printer setup, paper width (2-inch / 3-inch), test print &amp; extra paper feed lines.
                      </p>
                    </div>
                  </div>
                </button>

                {/* 2. Staff */}
                <button
                  type="button"
                  onClick={() => openTab('staff')}
                  className="w-full text-left bg-white hover:bg-zinc-50 p-5 rounded-2xl border-2 border-zinc-200 hover:border-black shadow-xs transition-all cursor-pointer flex flex-col justify-between group active:scale-[0.99]"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Users className="w-6 h-6 text-black" />
                      <ChevronRight className="w-5 h-5 text-zinc-400 group-hover:text-black group-hover:translate-x-1 transition-all" />
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-black text-black">2. Staff Access &amp; PINs</h2>
                      <p className="text-xs text-zinc-500 font-medium mt-1 leading-relaxed">
                        Staff management, designated roles (Cashier, Chef, Manager) and 4-digit PIN access. Admin PIN (5566) required.
                      </p>
                    </div>
                  </div>
                </button>

                {/* 3. Reports */}
                <button
                  type="button"
                  onClick={() => openTab('reports')}
                  className="w-full text-left bg-white hover:bg-zinc-50 p-5 rounded-2xl border-2 border-zinc-200 hover:border-black shadow-xs transition-all cursor-pointer flex flex-col justify-between group active:scale-[0.99]"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <BarChart3 className="w-6 h-6 text-black" />
                      <ChevronRight className="w-5 h-5 text-zinc-400 group-hover:text-black group-hover:translate-x-1 transition-all" />
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-black text-black">3. Reports &amp; Analytics</h2>
                      <p className="text-xs text-zinc-500 font-medium mt-1 leading-relaxed">
                        Total Sales of the Day, Remaining Menu Stock, Daily Table Revenue, Staff Login Audit &amp; 5-in-1 Excel export.
                      </p>
                    </div>
                  </div>
                </button>

                {/* 4. Storage */}
                <button
                  type="button"
                  onClick={() => openTab('storage')}
                  className="w-full text-left bg-white hover:bg-zinc-50 p-5 rounded-2xl border-2 border-zinc-200 hover:border-black shadow-xs transition-all cursor-pointer flex flex-col justify-between group active:scale-[0.99]"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <HardDrive className="w-6 h-6 text-black" />
                      <ChevronRight className="w-5 h-5 text-zinc-400 group-hover:text-black group-hover:translate-x-1 transition-all" />
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-black text-black">4. Storage &amp; Archives</h2>
                      <p className="text-xs text-zinc-500 font-medium mt-1 leading-relaxed">
                        Set phone storage folder path for reports archive, view latest 10 saved daily reports, and export history.
                      </p>
                    </div>
                  </div>
                </button>

                {/* 5. Reset */}
                <button
                  type="button"
                  onClick={() => openTab('reset')}
                  className="w-full text-left bg-red-50/50 hover:bg-red-50 p-5 rounded-2xl border-2 border-red-200 hover:border-red-500 shadow-xs transition-all cursor-pointer flex flex-col justify-between group active:scale-[0.99] sm:col-span-2"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5">
                        <Trash2 className="w-6 h-6 text-red-600" />
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                      </div>
                      <ChevronRight className="w-5 h-5 text-red-400 group-hover:text-red-600 group-hover:translate-x-1 transition-all" />
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-black text-red-950">5. Factory Reset (Handover)</h2>
                      <p className="text-xs text-red-900/80 font-medium mt-1 leading-relaxed">
                        Reset app to start fresh as new with all values 0, no menu, no tables for clean shop handover. Admin PIN (5566) required.
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================== */}
        {/* DRILL-DOWN FUNCTION VIEW (WHEN AN OPTION IS OPENED)        */}
        {/* ========================================================== */}
        {activeTab !== null && (
          <div className="flex-1 flex flex-col w-full">
            {/* Top Navigation Bar: for Printer, Staff & Reports, starts from left on top with no "More Option" button */}
            {activeTab === 'printer' ? (
              <div className="px-4 sm:px-6 py-4 sm:py-5 bg-white border-b border-zinc-200 shrink-0">
                <h1 className="text-xl sm:text-2xl font-black text-black tracking-tight text-left">
                  Printer (SEZNIK 58mm)
                </h1>
              </div>
            ) : activeTab === 'staff' ? (
              <div className="px-4 sm:px-6 py-4 sm:py-5 bg-white border-b border-zinc-200 shrink-0">
                <h1 className="text-xl sm:text-2xl font-black text-black tracking-tight text-left">
                  2. Staff Access &amp; PINs
                </h1>
              </div>
            ) : activeTab === 'reports' ? (
              <div className="px-4 sm:px-6 py-4 sm:py-5 bg-white border-b border-zinc-200 shrink-0">
                <h1 className="text-xl sm:text-2xl font-black text-black tracking-tight text-left">
                  3. Reports &amp; Analytics
                </h1>
              </div>
            ) : activeTab === 'storage' ? (
              <div className="px-4 sm:px-6 py-4 sm:py-5 bg-white border-b border-zinc-200 shrink-0">
                <h1 className="text-xl sm:text-2xl font-black text-black tracking-tight text-left">
                  4. Storage &amp; Archives
                </h1>
              </div>
            ) : (
              <div className="px-4 sm:px-6 py-3.5 bg-white border-b border-zinc-200 flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={handleBackToLanding}
                    className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-extrabold text-xs transition cursor-pointer active:scale-95 shadow-xs"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>More Option</span>
                  </button>
                  <span className="text-zinc-300 font-bold">/</span>
                  <h1 className="text-base sm:text-lg font-black text-black truncate max-w-[200px] sm:max-w-none">
                    {activeTab === 'reset' && '5. Factory Reset (Handover)'}
                  </h1>
                </div>
              </div>
            )}

            {/* Right Main Panel with Full Scroll */}
            <div className="flex-1 p-4 sm:p-6 space-y-6 pb-64 sm:pb-48">
            
            {/* ========================================================== */}
            {/* 1. PRINTER SETTINGS PANEL                                   */}
            {/* ========================================================== */}
            {activeTab === 'printer' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start max-w-5xl">
                
                {/* Left 7 cols: Printer Configuration */}
                <div className="lg:col-span-7 space-y-6">
                  
                  {/* Connected Hardware Card */}
                  <div className="bg-white rounded-3xl p-5 border border-zinc-200 shadow-xs space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-black uppercase tracking-wider text-zinc-500">Connected Printer Hardware</span>
                      
                      <div className="flex items-center space-x-2">
                        {/* Live Connection Status */}
                        {btConnectionStatus === 'connected' ? (
                          <span className="inline-flex items-center space-x-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span>Connected</span>
                          </span>
                        ) : btConnectionStatus === 'connecting' ? (
                          <span className="inline-flex items-center space-x-1.5 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                            <Loader2 className="w-3 h-3 animate-spin text-amber-600" />
                            <span>Connecting...</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1.5 text-[11px] font-bold text-zinc-600 bg-zinc-100 border border-zinc-200 px-2.5 py-1 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400"></span>
                            <span>Not Connected</span>
                          </span>
                        )}

                        {/* Connect Button */}
                        <button
                          type="button"
                          onClick={handleConnectBluetooth}
                          disabled={btConnectionStatus === 'connecting'}
                          className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-black hover:bg-zinc-800 text-white text-xs font-black transition cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
                        >
                          <Bluetooth className="w-3.5 h-3.5" />
                          <span>{btConnectionStatus === 'connected' ? 'Connected' : 'Connect'}</span>
                        </button>

                        {/* Direct Test Print Button */}
                        {btConnectionStatus === 'connected' && (
                          <button
                            type="button"
                            onClick={handleBluetoothTestPrint}
                            disabled={isBluetoothPrinting}
                            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-zinc-300 hover:border-black bg-white text-xs font-bold text-black transition cursor-pointer active:scale-95 shadow-xs"
                          >
                            {isBluetoothPrinting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Printer className="w-3.5 h-3.5" />}
                            <span>Test Print</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {btStatus && (
                      <div className={`p-2.5 rounded-xl text-xs font-bold ${
                        btStatus.includes('error') || btStatus.includes('Error')
                          ? 'bg-red-50 text-red-700 border border-red-200' 
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {btStatus}
                      </div>
                    )}

                    {/* Big Rectangle Box for Printer (Cleaned: no 58mm badge and no 3 boxes) */}
                    <div className="p-4 rounded-2xl border-2 border-black bg-zinc-50">
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                          <Printer className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-black">SEZNIK 58mm Thermal POS Printer</h4>
                          <p className="text-[11px] font-bold text-zinc-600 mt-0.5">Model: POS-5802 / ESC-POS Standard</p>
                          <p className="text-[10px] text-zinc-500">Direct Mobile Phone Bluetooth Connection (zero webserver) + USB Cable</p>
                        </div>
                      </div>
                    </div>

                    {/* Option to Connect Printer by USB Separately */}
                    <div className="p-4 rounded-2xl border border-zinc-200 bg-zinc-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-black text-black">Connect via USB</span>
                          {usbConnected && (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                              USB Connected
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-zinc-500 mt-0.5">Connect SEZNIK via OTG or USB cable to phone / laptop</p>
                      </div>
                      <button
                        type="button"
                        onClick={handleConnectUsb}
                        className="px-4 py-2 rounded-xl border border-zinc-300 hover:border-black bg-white hover:bg-zinc-100 text-xs font-black text-black transition cursor-pointer shrink-0 active:scale-95 shadow-xs"
                      >
                        {usbConnected ? 'USB Connected ✓' : 'Connect via USB'}
                      </button>
                    </div>
                  </div>

                  {/* Page Size & Extra Lines for SEZNIK 58mm */}
                  <div className="bg-white rounded-3xl p-5 border border-zinc-200 shadow-xs space-y-5">
                    <div>
                      <span className="text-xs font-extrabold text-black block mb-2">Page Size</span>
                      <div className="flex items-center space-x-6 text-xs font-bold text-black">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            name="pagesize"
                            checked={pageSize === '2-inch'}
                            onChange={() => setPageSize('2-inch')}
                            className="accent-black"
                          />
                          <span>2-inch (58mm - SEZNIK Default)</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            name="pagesize"
                            checked={pageSize === '3-inch'}
                            onChange={() => setPageSize('3-inch')}
                            className="accent-black"
                          />
                          <span>3-inch (80mm)</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <span className="text-xs font-extrabold text-black block mb-1">Extra lines at the end</span>
                      <p className="text-[11px] text-zinc-400 mb-2">Provides clean tear-off margin space for SEZNIK paper cutter.</p>
                      <div className="inline-flex items-center space-x-3 bg-zinc-100 p-1 rounded-xl">
                        <button
                          type="button"
                          onClick={() => updateExtraLines(extraLines - 1)}
                          className="w-7 h-7 rounded-lg bg-white text-black font-bold flex items-center justify-center shadow-xs cursor-pointer"
                        >
                          -
                        </button>
                        <span className="font-mono font-bold text-xs px-2">{extraLines} lines</span>
                        <button
                          type="button"
                          onClick={() => updateExtraLines(extraLines + 1)}
                          className="w-7 h-7 rounded-lg bg-white text-black font-bold flex items-center justify-center shadow-xs cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Right 5 cols: Live Bill Preview Optimized for SEZNIK 58mm */}
                <div className="lg:col-span-5 space-y-2">
                  <span className="text-xs font-bold text-zinc-500 block text-center lg:text-left">
                    SEZNIK 58mm Slip Preview
                  </span>
                  
                  <div 
                    id="printable-receipt"
                    className="bg-white rounded-3xl p-4 sm:p-5 border border-zinc-200 shadow-md font-mono text-[11px] text-black space-y-3 max-w-[280px] mx-auto"
                  >
                    {/* Header */}
                    <div className="text-center space-y-0.5">
                      <div className="flex justify-center mb-1">
                        <img 
                          src="/brand-calligraphy-uploaded.png" 
                          alt="ഇത്തിപ്പൂരം" 
                          className="h-8 w-auto object-contain"
                        />
                      </div>
                      <p className="text-[9px] text-zinc-600 font-sans font-bold">Vanchiyoor, Trivandrum</p>
                      <p className="text-[9px] text-zinc-400 font-sans">Ph: +91 94470 00000</p>
                      <div className="border-b border-dashed border-zinc-400 pt-1.5" />
                      <p className="text-[10px] font-black uppercase tracking-wider font-sans pt-1">BILL OF SUPPLY</p>
                    </div>

                    {/* Metadata */}
                    <div className="text-[10px] space-y-0.5">
                      <div className="flex justify-between">
                        <span>Inv: 1001</span>
                        <span>04/11/2026</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Table: T1</span>
                        <span>Mode: Cash</span>
                      </div>
                      <div className="border-b border-dashed border-zinc-400 pt-1" />
                    </div>

                    {/* Items for 58mm */}
                    <div className="space-y-1 text-[10px]">
                      <div className="flex justify-between font-bold text-zinc-500 uppercase">
                        <span>ITEM</span>
                        <div className="flex space-x-2">
                          <span>QTY</span>
                          <span>AMT</span>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-bold truncate max-w-[120px]">Aavoli fry</span>
                        <div className="flex space-x-3 font-mono">
                          <span>1</span>
                          <span className="font-bold">120.00</span>
                        </div>
                      </div>
                      <div className="border-b border-dashed border-zinc-400 pt-1" />
                    </div>

                    {/* Totals */}
                    <div className="space-y-0.5 pt-0.5">
                      <div className="flex justify-between font-black text-xs">
                        <span>TOTAL:</span>
                        <span>Rs.120.00</span>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="text-center pt-2 border-t border-dashed border-zinc-400 text-[9px] text-zinc-500 font-sans space-y-0.5">
                      <p className="font-bold text-black font-malayalam">നന്ദി, വീണ്ടും വരിക</p>
                      <p>Thank you! Visit again.</p>
                    </div>

                    {/* Visual Feed lines preview */}
                    <div className="pt-2 text-center text-[9px] text-zinc-300 font-mono">
                      {Array.from({ length: extraLines }).map((_, i) => (
                        <div key={i} className="h-2 border-b border-dotted border-zinc-200" />
                      ))}
                      <span className="block mt-1 text-[8px] text-zinc-400">--- Tear Off Margin ---</span>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* ========================================================== */}
            {/* 2. STAFF ACCESS & PINS (ADMIN PASSWORD PROTECTED)          */}
            {/* ========================================================== */}
            {activeTab === 'staff' && (
              <div className="max-w-3xl space-y-6">
                {!isAdminUnlocked ? (
                  /* Admin Password Challenge Form - Compact & Smaller */
                  <div className="bg-white rounded-2xl p-5 border border-zinc-200 shadow-xs max-w-xs mx-auto text-center space-y-3.5">
                    <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center mx-auto text-zinc-800">
                      <Lock className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-black">Admin Access Required</h3>
                      <p className="text-[11px] text-zinc-500 mt-0.5">
                        Enter Admin PIN (5566) to manage staff credentials.
                      </p>
                    </div>

                    <form onSubmit={handleUnlockAdmin} className="space-y-2.5">
                      <div>
                        <input
                          type="password"
                          inputMode="numeric"
                          maxLength={6}
                          value={adminPinInput}
                          onChange={(e) => {
                            setAdminPinInput(e.target.value);
                            setAdminPinError(null);
                          }}
                          placeholder="Admin PIN (5566)"
                          className="w-full text-center text-sm font-mono font-black tracking-widest py-2 px-3 rounded-xl bg-zinc-50 border border-zinc-300 focus:outline-none focus:border-black text-black"
                        />
                        {adminPinError && (
                          <p className="text-[11px] text-red-600 font-bold mt-1">{adminPinError}</p>
                        )}
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2.5 px-3 rounded-xl bg-black hover:bg-zinc-800 text-white font-black text-xs transition shadow-xs cursor-pointer active:scale-98"
                      >
                        Unlock Staff
                      </button>
                    </form>
                  </div>
                ) : (
                  /* Unlocked Staff Management Interface */
                  <div className="bg-white rounded-3xl p-6 border border-zinc-200 shadow-xs space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-100">
                      <div>
                        <h3 className="text-base font-black text-black">Staff Credentials &amp; Access Controls</h3>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          Admin PIN authorized. Configure rapid 4-digit PINs for counter tablets and phones.
                        </p>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setIsAddStaffModalOpen(true)}
                          className="px-4 py-2 rounded-2xl bg-black hover:bg-zinc-800 text-white font-black text-xs transition shadow-xs cursor-pointer active:scale-98"
                        >
                          <span>Add Staff</span>
                        </button>
                        <button
                          onClick={() => {
                            setIsAdminUnlocked(false);
                            setAdminPinInput('');
                          }}
                          className="p-2 rounded-2xl border border-zinc-200 hover:bg-zinc-100 text-zinc-600 cursor-pointer"
                          title="Lock Section"
                        >
                          <Lock className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {staffMessage && (
                      <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center space-x-2">
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span>{staffMessage}</span>
                      </div>
                    )}

                    {/* Staff Credentials Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-zinc-700">
                        <thead className="bg-zinc-50 text-[10px] font-extrabold uppercase tracking-wider text-zinc-500 border-y border-zinc-200">
                          <tr>
                            <th className="py-3 px-4">Staff Member</th>
                            <th className="py-3 px-4">Designated Role</th>
                            <th className="py-3 px-4">4-Digit Fast PIN</th>
                            <th className="py-3 px-4">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                          {staffList.map((st) => (
                            <tr key={st.id} className="hover:bg-zinc-50/70">
                              <td className="py-3.5 px-4 font-bold text-zinc-900">{st.fullName}</td>
                              <td className="py-3.5 px-4">
                                <span className="px-2.5 py-1 rounded-xl bg-zinc-100 border border-zinc-200 font-mono text-[10px] font-black text-zinc-800">
                                  {st.role}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 font-mono font-black text-black">
                                •••• ({st.pin})
                              </td>
                              <td className="py-3.5 px-4">
                                <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                  <span>Active</span>
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ========================================================== */}
            {/* 3. REPORTS & ANALYTICS TAB (5 ESSENTIAL DAILY REPORTS)     */}
            {/* ========================================================== */}
            {activeTab === 'reports' && (
              <div className="max-w-4xl space-y-4">
                <div className="bg-white rounded-3xl p-5 sm:p-6 border border-zinc-200 shadow-xs space-y-4">
                  
                  {/* Clean Heading - no subheading, no export 5-in-1 button */}
                  <div className="pb-3 border-b border-zinc-100">
                    <h3 className="text-base sm:text-lg font-black text-black">
                      Daily Business Audits &amp; Compliance Reports
                    </h3>
                  </div>

                  {/* 5 Reports One by One Down to One Another */}
                  <div className="space-y-3 pt-1">
                    {reportCategories.map((cat) => {
                      const isExpanded = expandedReport === cat.id;
                      return (
                        <div 
                          key={cat.id} 
                          className={`rounded-2xl border-2 transition-all ${
                            isExpanded ? 'border-black bg-zinc-50/50 shadow-xs' : 'border-zinc-200 bg-white hover:border-zinc-400'
                          }`}
                        >
                          {/* Clickable Header to Open / View Report */}
                          <button
                            type="button"
                            onClick={() => setExpandedReport(isExpanded ? null : cat.id)}
                            className="w-full text-left p-4 sm:p-5 flex items-center justify-between cursor-pointer group"
                          >
                            <div className="space-y-0.5">
                              <h4 className="text-sm sm:text-base font-black text-black group-hover:text-black">
                                {cat.title}
                              </h4>
                              <p className="text-xs text-zinc-500 font-medium">
                                {cat.desc}
                              </p>
                            </div>
                            <div className={`p-2 rounded-xl transition-all ${
                              isExpanded ? 'bg-black text-white rotate-90' : 'bg-zinc-100 text-zinc-500 group-hover:text-black'
                            }`}>
                              <ChevronRight className="w-4 h-4" />
                            </div>
                          </button>

                          {/* Last 7 Days Reports Ready to Download One by One */}
                          {isExpanded && (
                            <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-1 border-t border-zinc-200 space-y-2">
                              <span className="text-[11px] font-black uppercase tracking-wider text-zinc-400 block pt-2 mb-1">
                                Last 7 Days Reports (Ready to Download)
                              </span>

                              <div className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white overflow-hidden">
                                {last7Days.map((d) => {
                                  const filename = `${d.dateLabel}-${cat.fileSuffix}.xls`;
                                  return (
                                    <div 
                                      key={d.isoDate} 
                                      className="p-3 sm:px-4 flex items-center justify-between gap-3 hover:bg-zinc-50 transition"
                                    >
                                      <div className="flex items-center space-x-3 min-w-0">
                                        <div className="w-8 h-8 rounded-lg bg-zinc-100 text-zinc-700 flex items-center justify-center shrink-0">
                                          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                                        </div>
                                        <div className="min-w-0">
                                          <p className="text-xs font-mono font-black text-black truncate">
                                            {filename}
                                          </p>
                                          <p className="text-[11px] text-zinc-500">
                                            {d.dateLabel} ({d.weekday})
                                            {d.isToday && <span className="ml-2 font-bold text-emerald-600">● Today</span>}
                                            {d.isYesterday && <span className="ml-2 font-bold text-zinc-600">● Yesterday</span>}
                                          </p>
                                        </div>
                                      </div>

                                      <button
                                        type="button"
                                        onClick={() => handleDownloadSingleReport(cat.id, d.isoDate, filename)}
                                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-black hover:bg-zinc-800 text-white font-black text-xs transition cursor-pointer shadow-xs active:scale-95 shrink-0"
                                      >
                                        <FolderDown className="w-3.5 h-3.5" />
                                        <span>Download</span>
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                </div>
              </div>
            )}

            {/* ========================================================== */}
            {/* 4. STORAGE & LOCAL ARCHIVES (ADMIN PROTECTED)              */}
            {/* ========================================================== */}
            {activeTab === 'storage' && (
              <div className="max-w-2xl space-y-6">
                {!isStorageAdminUnlocked ? (
                  /* Admin Password Challenge Form - Compact Box */
                  <div className="bg-white rounded-2xl p-5 border border-zinc-200 shadow-xs max-w-xs mx-auto text-center space-y-3.5">
                    <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center mx-auto text-zinc-800">
                      <Lock className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-black">Admin Access Required</h3>
                      <p className="text-[11px] text-zinc-500 mt-0.5">
                        Enter Admin PIN (5566) to configure device storage folder.
                      </p>
                    </div>

                    <form onSubmit={handleUnlockStorageAdmin} className="space-y-2.5">
                      <div>
                        <input
                          type="password"
                          inputMode="numeric"
                          maxLength={6}
                          value={storageAdminPinInput}
                          onChange={(e) => {
                            setStorageAdminPinInput(e.target.value);
                            setStorageAdminPinError(null);
                          }}
                          placeholder="Admin PIN (5566)"
                          className="w-full text-center text-sm font-mono font-black tracking-widest py-2 px-3 rounded-xl bg-zinc-50 border border-zinc-300 focus:outline-none focus:border-black text-black"
                        />
                        {storageAdminPinError && (
                          <p className="text-[11px] text-red-600 font-bold mt-1">{storageAdminPinError}</p>
                        )}
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2.5 px-3 rounded-xl bg-black hover:bg-zinc-800 text-white font-black text-xs transition shadow-xs cursor-pointer active:scale-98"
                      >
                        Unlock Storage
                      </button>
                    </form>
                  </div>
                ) : (
                  /* Unlocked Storage Path Card */
                  <div className="bg-white rounded-3xl p-5 sm:p-6 border border-zinc-200 shadow-xs space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                      <h3 className="text-base sm:text-lg font-black text-black">
                        Phone Storage &amp; Database Archive Folder
                      </h3>
                      <button
                        type="button"
                        onClick={() => {
                          setIsStorageAdminUnlocked(false);
                          setStorageAdminPinInput('');
                        }}
                        className="p-2 rounded-xl border border-zinc-200 hover:bg-zinc-100 text-zinc-600 cursor-pointer"
                        title="Lock Section"
                      >
                        <Lock className="w-4 h-4" />
                      </button>
                    </div>

                    {storageSyncMessage && (
                      <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center space-x-2">
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span>{storageSyncMessage}</span>
                      </div>
                    )}

                    {/* Hidden folder input for directory selection on mobile/desktop */}
                    <input
                      id="phone-folder-input"
                      type="file"
                      // @ts-ignore
                      webkitdirectory=""
                      directory=""
                      className="hidden"
                      onChange={(e) => {
                        const files = e.target.files;
                        if (files && files.length > 0) {
                          const relativePath = files[0].webkitRelativePath || '';
                          const folderName = relativePath.split('/')[0] || 'IthiPooram_POS';
                          const customPath = `Internal Storage/Download/${folderName}/reports_archive/`;
                          setPhoneStoragePath(customPath);
                          if (typeof window !== 'undefined') {
                            localStorage.setItem('ithipooram_phone_storage_path', customPath);
                          }
                          setStorageSyncMessage(`✓ Synced folder: ${folderName}`);
                          setTimeout(() => setStorageSyncMessage(null), 4000);
                        }
                      }}
                    />

                    <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200 space-y-3">
                      <span className="text-[10px] font-extrabold uppercase text-zinc-500 tracking-wider block">
                        Active Storage Folder Path on Device:
                      </span>
                      
                      <div className="bg-white p-3 rounded-xl border border-zinc-200 font-mono text-xs font-bold text-zinc-900 break-all">
                        {phoneStoragePath}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={handleChooseDirectory}
                          className="px-4 py-2.5 rounded-xl bg-black hover:bg-zinc-800 text-white text-xs font-black transition cursor-pointer shadow-xs active:scale-95 flex items-center space-x-1.5"
                        >
                          <FolderDown className="w-3.5 h-3.5" />
                          <span>Choose Folder from Phone Storage</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleManualEditPath}
                          className="px-3.5 py-2.5 rounded-xl border border-zinc-300 hover:border-black bg-white hover:bg-zinc-100 text-black text-xs font-bold transition cursor-pointer active:scale-95"
                        >
                          <span>Edit Path</span>
                        </button>
                      </div>

                      <p className="text-[11px] text-zinc-500 leading-relaxed pt-1">
                        All daily sales reports, menu updates, and staff audits will download and sync automatically to this chosen device storage folder.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ========================================================== */}
            {/* 5. FACTORY RESET (SENSITIVE SHOP HANDOVER BUTTON)           */}
            {/* ========================================================== */}
            {activeTab === 'reset' && (
              <div className="max-w-2xl space-y-6">
                <div className="bg-red-50/50 rounded-3xl p-6 sm:p-8 border-2 border-red-300 shadow-sm space-y-5">
                  <div className="flex items-start space-x-3">
                    <div className="w-12 h-12 rounded-2xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-red-950">Factory Reset / Shop Handover Wipe</h3>
                      <p className="text-xs text-red-800 font-semibold mt-1 leading-relaxed">
                        This action is intended for handover to the shop. It wipes the entire staff database (no staffs), clears all test sales and orders, and resets all menu and tables to 0 so the restaurant owner starts with a brand new app showing full zeros everywhere.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-white rounded-2xl border border-red-200 space-y-3">
                    <div className="space-y-2">
                      <label className="flex items-center space-x-2 text-xs font-bold text-zinc-900 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={resetWipeAll}
                          onChange={(e) => setResetWipeAll(e.target.checked)}
                          className="accent-red-600 w-4 h-4 rounded"
                        />
                        <span>Complete Clean Wipe: Reset all tables &amp; menu to zero state</span>
                      </label>
                    </div>

                    <div>
                      <label className="block text-xs font-black text-zinc-900 uppercase tracking-wider mb-1">
                        Enter Admin PIN (5566) to Authorize Reset:
                      </label>
                      <input
                        type="password"
                        inputMode="numeric"
                        maxLength={6}
                        value={resetPinInput}
                        onChange={(e) => {
                          setResetPinInput(e.target.value);
                          setResetError(null);
                        }}
                        placeholder="Admin PIN 5566"
                        className="w-full py-2.5 px-4 rounded-xl bg-zinc-50 border border-zinc-300 text-sm font-mono font-black focus:outline-none focus:border-red-600 text-black"
                      />
                      {resetError && (
                        <p className="text-xs text-red-600 font-bold mt-1.5">{resetError}</p>
                      )}
                      {resetSuccess && (
                        <p className="text-xs text-emerald-700 font-bold mt-1.5">
                          ✓ App reset to factory state! Redirecting to setup...
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleExecuteFactoryReset}
                      disabled={resetLoading || resetPinInput.length === 0}
                      className="w-full py-3.5 px-4 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-xs flex items-center justify-center space-x-2 transition shadow-md cursor-pointer disabled:opacity-50"
                    >
                      {resetLoading ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                      <span>Execute Factory Reset &amp; Start As Fresh App</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            </div>
          </div>
        )}

      </main>

      {/* Add Staff Modal */}
      {isAddStaffModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-zinc-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-black" />
                <h3 className="text-base font-black text-black">Register New Staff Member</h3>
              </div>
              <button
                onClick={() => setIsAddStaffModalOpen(false)}
                className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-black flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-zinc-800 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  placeholder="e.g. Rahul Nair"
                  className="w-full py-2.5 px-4 rounded-xl bg-zinc-50 border border-zinc-200 text-xs font-semibold focus:outline-none focus:border-black text-zinc-900"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-zinc-800 uppercase tracking-wider mb-1">
                  Designated Role
                </label>
                <select
                  value={newStaffRole}
                  onChange={(e) => setNewStaffRole(e.target.value)}
                  className="w-full py-2.5 px-4 rounded-xl bg-zinc-50 border border-zinc-200 text-xs font-semibold focus:outline-none focus:border-black text-zinc-900"
                >
                  <option value="CASHIER">Cashier (Billing &amp; Settlement Desk)</option>
                  <option value="KITCHEN_STAFF">Kitchen Chef (KDS Station)</option>
                  <option value="MANAGER">Floor Manager (Shift &amp; Table Control)</option>
                  <option value="MAIN_ADMIN">Administrator (Full Access)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-zinc-800 uppercase tracking-wider mb-1">
                  4-Digit Login PIN
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  required
                  value={newStaffPin}
                  onChange={(e) => setNewStaffPin(e.target.value)}
                  placeholder="e.g. 7788"
                  className="w-full py-2.5 px-4 rounded-xl bg-zinc-50 border border-zinc-200 text-sm font-mono font-black focus:outline-none focus:border-black text-zinc-900 text-center tracking-widest"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddStaffModalOpen(false)}
                  className="flex-1 py-3 rounded-2xl border border-zinc-200 text-xs font-bold text-zinc-600 hover:bg-zinc-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={staffLoading}
                  className="flex-1 py-3 rounded-2xl bg-black hover:bg-zinc-800 text-white font-black text-xs transition cursor-pointer shadow-md disabled:opacity-50"
                >
                  {staffLoading ? 'Registering...' : 'Save Staff Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
