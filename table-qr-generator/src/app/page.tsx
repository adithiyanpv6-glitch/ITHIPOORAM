'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Printer, 
  Download, 
  ExternalLink, 
  Settings, 
  Plus, 
  Trash2, 
  RotateCcw,
  Layers, 
  CheckCircle2, 
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  X,
  Send,
  QrCode,
  UtensilsCrossed,
  Clock,
  Check,
  Loader2,
  Copy,
  Eye,
  MessageSquare
} from 'lucide-react';
import QRCode from 'qrcode';

export interface Room {
  id: string;
  name: string;
  createdAt: number;
}

export interface CustomTableStand {
  id: string;
  roomId: string;
  roomName: string;
  tableCode: string; // e.g. TQ1, TQ1A, TQ1B
  tableName: string; // e.g. Table 1, Table 1 (Seat A)
  capacity: number;
  url: string;
  qrDataUrl: string;
}

export default function TableQrStandsPage() {
  const router = useRouter();

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };
  const [customerBaseUrl, setCustomerBaseUrl] = useState('https://customer-mobile-ithipooram.vercel.app');
  const [showConfig, setShowConfig] = useState(false);

  // Room & Tables state
  const [rooms, setRooms] = useState<Room[]>([]);
  const [tables, setTables] = useState<CustomTableStand[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');

  // Wizard Modal state
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState<1 | 2>(1);
  const [inputRoomName, setInputRoomName] = useState('');
  
  // Step 2 table params - Starts with 0 as requested
  const [tableNumberStart, setTableNumberStart] = useState<number>(1);
  const [tableCountToGenerate, setTableCountToGenerate] = useState<number>(0);
  const [isSeatSharingEnabled, setIsSeatSharingEnabled] = useState<boolean>(true);
  const [seatsPerTable, setSeatsPerTable] = useState<number>(3);
  const [isGenerating, setIsGenerating] = useState(false);

  // Table selection & Live Order Tracking state
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [isSyncingTelegram, setIsSyncingTelegram] = useState(false);
  const [telegramSyncFeedback, setTelegramSyncFeedback] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Hidden Canvas Ref for High-Res Acrylic Stand Export
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Live polling for customer orders
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch('/api/orders');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setAllOrders(data);
          }
        }
      } catch (e) {}
    };
    fetchOrders();
    const interval = setInterval(fetchOrders, 4000);
    return () => clearInterval(interval);
  }, []);

  // Load saved rooms & tables
  useEffect(() => {
    const savedUrl = localStorage.getItem('ithipooram_customer_base_url');
    if (savedUrl) setCustomerBaseUrl(savedUrl);

    const savedRooms = localStorage.getItem('ithipooram_custom_rooms');
    const savedTables = localStorage.getItem('ithipooram_custom_tables');

    if (savedRooms && savedTables) {
      try {
        const parsedRooms = JSON.parse(savedRooms);
        const parsedTables = JSON.parse(savedTables);

        // Filter out legacy dummy starter rooms
        const isLegacyDummy = parsedRooms.length === 3 && 
          parsedRooms.some((r: Room) => r.id === 'room-living') && 
          parsedRooms.some((r: Room) => r.id === 'room-courtyard');

        if (parsedRooms.length > 0 && !isLegacyDummy) {
          setRooms(parsedRooms);
          setTables(parsedTables);
          setSelectedRoomId(parsedRooms[0].id);
          return;
        } else if (isLegacyDummy) {
          localStorage.removeItem('ithipooram_custom_rooms');
          localStorage.removeItem('ithipooram_custom_tables');
        }
      } catch (e) {}
    }

    setRooms([]);
    setTables([]);
    setSelectedRoomId('');
  }, [router]);

  const saveState = (updatedRooms: Room[], updatedTables: CustomTableStand[]) => {
    localStorage.setItem('ithipooram_custom_rooms', JSON.stringify(updatedRooms));
    localStorage.setItem('ithipooram_custom_tables', JSON.stringify(updatedTables));
    
    // Sync with central backend /api/tables
    try {
      fetch('/api/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          replace: true,
          tables: updatedTables.map((t) => ({
            tableCode: t.tableCode,
            displayName: `${t.roomName} - ${t.tableName} (${t.tableCode})`,
            capacity: t.capacity,
          })),
        }),
      }).catch(() => {});
    } catch (e) {}
  };

  // Clear all rooms and tables to start fresh
  const handleStartFresh = () => {
    if (!confirm('Are you sure you want to clear all rooms and tables and start completely fresh?')) return;
    setRooms([]);
    setTables([]);
    setSelectedRoomId('');
    setSelectedTableId(null);
    localStorage.removeItem('ithipooram_custom_rooms');
    localStorage.removeItem('ithipooram_custom_tables');
    try {
      fetch('/api/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ replace: true, tables: [] }),
      }).catch(() => {});
    } catch (e) {}
  };

  // Preview generated table codes in Step 2
  const previewGeneratedCodes = useMemo(() => {
    if (tableCountToGenerate <= 0) return [];
    const list: Array<{ code: string; label: string }> = [];
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const count = Math.min(20, Math.max(0, tableCountToGenerate));
    const start = Math.max(1, tableNumberStart);

    for (let i = 0; i < count; i++) {
      const tableNum = start + i;
      if (isSeatSharingEnabled && seatsPerTable > 1) {
        const seats = Math.min(6, Math.max(2, seatsPerTable));
        for (let s = 0; s < seats; s++) {
          const letter = alphabet[s];
          list.push({
            code: `TQ${tableNum}${letter}`,
            label: `Table ${tableNum} (Seat ${letter})`,
          });
        }
      } else {
        list.push({
          code: `TQ${tableNum}`,
          label: `Table ${tableNum}`,
        });
      }
    }
    return list;
  }, [tableNumberStart, tableCountToGenerate, isSeatSharingEnabled, seatsPerTable]);

  // Open Wizard
  const handleOpenWizard = (presetRoomName?: string) => {
    if (presetRoomName) {
      setInputRoomName(presetRoomName);
      setWizardStep(2);
    } else {
      setInputRoomName('');
      setWizardStep(1);
    }
    setTableCountToGenerate(0);
    setIsWizardOpen(true);
  };

  // Confirm and Generate Tables from Wizard
  const handleConfirmWizard = async () => {
    if (!inputRoomName.trim() || previewGeneratedCodes.length === 0) return;
    setIsGenerating(true);

    try {
      // Find or create room
      let activeRoom = rooms.find(
        (r) => r.name.toLowerCase() === inputRoomName.trim().toLowerCase()
      );
      let updatedRooms = [...rooms];

      if (!activeRoom) {
        activeRoom = {
          id: `room-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          name: inputRoomName.trim(),
          createdAt: Date.now(),
        };
        updatedRooms.push(activeRoom);
      }

      // Generate Table stands with QRs
      const cleanBase = customerBaseUrl.replace(/\/+$/, '');
      const newStands: CustomTableStand[] = [];

      for (const item of previewGeneratedCodes) {
        const url = `${cleanBase}?table=${item.code}&name=${encodeURIComponent(activeRoom.name + ' - ' + item.label)}`;
        const qrDataUrl = await QRCode.toDataURL(url, {
          width: 600,
          margin: 2,
          color: { dark: '#16191D', light: '#FFFFFF' },
          errorCorrectionLevel: 'H',
        });

        newStands.push({
          id: `t-${activeRoom.id}-${item.code.toLowerCase()}-${Date.now()}`,
          roomId: activeRoom.id,
          roomName: activeRoom.name,
          tableCode: item.code,
          tableName: item.label,
          capacity: isSeatSharingEnabled ? 1 : 4,
          url,
          qrDataUrl,
        });
      }

      // Append tables
      const existingFiltered = tables.filter(
        (t) => !newStands.some((ns) => ns.tableCode === t.tableCode)
      );
      const updatedTables = [...existingFiltered, ...newStands];

      setRooms(updatedRooms);
      setTables(updatedTables);
      setSelectedRoomId(activeRoom.id);
      saveState(updatedRooms, updatedTables);
      setIsWizardOpen(false);
    } catch (err) {
      console.error('Failed to generate tables:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Delete Room
  const handleDeleteRoom = (roomId: string) => {
    const roomToDelete = rooms.find((r) => r.id === roomId);
    if (!roomToDelete) return;
    if (!confirm(`Are you sure you want to remove "${roomToDelete.name}" and all its tables?`)) return;

    const nextRooms = rooms.filter((r) => r.id !== roomId);
    const nextTables = tables.filter((t) => t.roomId !== roomId);

    setRooms(nextRooms);
    setTables(nextTables);
    if (nextRooms.length > 0) {
      setSelectedRoomId(nextRooms[0].id);
    } else {
      setSelectedRoomId('');
    }
    saveState(nextRooms, nextTables);
  };

  // Delete Single Table
  const handleDeleteTable = (tableId: string) => {
    const nextTables = tables.filter((t) => t.id !== tableId);
    setTables(nextTables);
    saveState(rooms, nextTables);
  };

  // Helper function to load image
  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load ${src}`));
      img.src = src;
    });
  };

  // Helper for drawing rounded rectangle
  function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, fill = false, stroke = false) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
  }

  // HIGH-RESOLUTION CANVAS EXPORT TO PNG (Using uploaded Logo & Brand Calligraphy)
  const handleExportStandImage = async (stand: CustomTableStand) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 1200;
    canvas.height = 1650;

    // Background: Rich Warm Parchment
    ctx.fillStyle = '#FDFCF7';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Outer Luxury Crimson Border
    ctx.strokeStyle = '#9E341D';
    ctx.lineWidth = 14;
    ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);

    // Inner Delicate Gold Border
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 4;
    ctx.strokeRect(55, 55, canvas.width - 110, canvas.height - 110);

    // Top Header Banner
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(40, 40, canvas.width - 80, 260);

    // Bottom border of header
    ctx.strokeStyle = '#E0D8CE';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(40, 300);
    ctx.lineTo(canvas.width - 40, 300);
    ctx.stroke();

    try {
      const [logoImg, calligraphyImg, qrImg] = await Promise.all([
        loadImage('/ithipooram-logo.png'),
        loadImage('/ithipooram-calligraphy.png'),
        loadImage(stand.qrDataUrl),
      ]);

      // Draw Official Logo on left
      ctx.drawImage(logoImg, 90, 70, 190, 190);

      // Draw Brand Calligraphy on right
      ctx.drawImage(calligraphyImg, 320, 85, 480, 150);

      // Location Subtitle
      ctx.fillStyle = '#9E341D';
      ctx.font = 'bold 30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Vanchiyoor, Trivandrum', canvas.width / 2, 360);

      // Room & Table Badge Box
      ctx.fillStyle = '#9E341D';
      roundRect(ctx, (canvas.width - 760) / 2, 400, 760, 150, 24, true);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 68px monospace';
      ctx.fillText(stand.tableCode, canvas.width / 2, 480);

      ctx.fillStyle = '#FFEEDB';
      ctx.font = 'bold 32px sans-serif';
      ctx.fillText(`${stand.roomName} • ${stand.tableName}`, canvas.width / 2, 526);

      // Draw Scannable QR Code
      const qrSize = 680;
      const qrX = (canvas.width - qrSize) / 2;
      const qrY = 600;

      // White card behind QR
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = '#D8D0C5';
      ctx.lineWidth = 6;
      roundRect(ctx, qrX - 25, qrY - 25, qrSize + 50, qrSize + 50, 36, true, true);

      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

      // Text Below QR (As requested: Removed everything under this sentence!)
      ctx.fillStyle = '#16191D';
      ctx.font = 'bold 40px sans-serif';
      ctx.fillText('SCAN WITH PHONE CAMERA TO ORDER', canvas.width / 2, 1420);

      // Trigger Download
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `IthiPooram_Stand_${stand.roomName.replace(/\s+/g, '_')}_${stand.tableCode}.png`;
      link.click();
    } catch (e) {
      console.error('Failed to export image:', e);
    }
  };

  const handleManualTelegramSync = async () => {
    try {
      setIsSyncingTelegram(true);
      setTelegramSyncFeedback(null);
      const res = await fetch('/api/tables/database/telegram-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tables }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTelegramSyncFeedback('✅ Excel database delivered to Telegram group!');
      } else {
        setTelegramSyncFeedback(`⚠️ ${data.message || data.error || 'Sync in progress'}`);
      }
    } catch (e: any) {
      setTelegramSyncFeedback(`❌ ${e.message}`);
    } finally {
      setIsSyncingTelegram(false);
      setTimeout(() => setTelegramSyncFeedback(null), 5000);
    }
  };

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  // Filter tables by active room
  const currentRoom = rooms.find((r) => r.id === selectedRoomId);
  const currentRoomTables = tables.filter((t) => t.roomId === selectedRoomId);

  // Active selected table stand & real-time orders
  const selectedStand = useMemo(() => {
    return tables.find((t) => t.id === selectedTableId) || null;
  }, [tables, selectedTableId]);

  const selectedStandOrders = useMemo(() => {
    if (!selectedStand) return [];
    return allOrders.filter(
      (o) => o.tableCode.toUpperCase() === selectedStand.tableCode.toUpperCase()
    );
  }, [allOrders, selectedStand]);

  return (
    <div className="min-h-screen bg-parchment-50 font-sans pb-32">
      {/* Hidden canvas for image export */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Top Header - Professional Brand Header */}
      <header className="bg-slatepos-900 border-b border-slatepos-800 text-white px-4 sm:px-6 py-3.5 flex items-center justify-between print:hidden sticky top-0 z-30 shadow-md">
        <div className="flex items-center space-x-3.5">
          <button 
            onClick={handleBack} 
            className="p-2 rounded-xl bg-slatepos-800 hover:bg-slatepos-700 text-slatepos-300 transition-colors"
            title="Back to Previous Page"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          
          {/* Professional Brand Logo */}
          <img 
            src="/ithipooram-logo.png" 
            alt="Ithi Pooram" 
            className="w-10 h-10 rounded-xl object-contain shadow-sm shrink-0 border border-slatepos-700 bg-white/10"
          />

          {/* Professional Brand Name Calligraphy / Typography */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3">
            <div className="flex items-center space-x-2">
              <span className="text-base font-extrabold tracking-wide text-white">ITHI POORAM</span>
              <span className="text-xs font-bold text-amber-400">ഇത്തിപ്പൂരം</span>
            </div>
            <span className="text-[11px] text-slatepos-400 hidden sm:inline">
              Vanchiyoor, Trivandrum
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {tables.length > 0 && (
            <button
              onClick={handleStartFresh}
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl text-xs font-bold bg-slatepos-800 hover:bg-red-950 text-red-300 border border-red-900/40 flex items-center space-x-1.5 transition active:scale-95 cursor-pointer"
              title="Clear all rooms & tables to start fresh"
            >
              <RotateCcw className="w-3.5 h-3.5 text-red-400" />
              <span className="hidden sm:inline">Start Fresh</span>
            </button>
          )}

          <button
            onClick={() => setShowConfig(!showConfig)}
            className="p-2 rounded-xl bg-slatepos-800 hover:bg-slatepos-700 text-slatepos-300 cursor-pointer"
            title="Configure Target Customer URL"
          >
            <Settings className="w-4 h-4" />
          </button>

          {tables.length > 0 && (
            <button
              onClick={() => window.print()}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#9E341D] hover:bg-[#832B18] text-white flex items-center space-x-1.5 shadow-md active:scale-95 transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Print Stands</span>
            </button>
          )}
        </div>
      </header>

      {/* Target URL Settings Drawer */}
      {showConfig && (
        <div className="bg-white border-b border-parchment-200 p-4 print:hidden animate-in slide-in-from-top duration-150">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
            <div>
              <span className="font-bold text-slatepos-900">Target Customer Ordering Webapp URL:</span>
              <p className="text-slatepos-500 text-[11px]">When customers scan physical QRs, this is the domain their camera opens.</p>
            </div>
            <div className="flex space-x-2">
              <input
                type="text"
                value={customerBaseUrl}
                onChange={(e) => setCustomerBaseUrl(e.target.value)}
                placeholder="e.g. https://customer-mobile-ithipooram.vercel.app"
                className="px-3 py-1.5 rounded-lg border border-parchment-300 text-xs w-72 max-w-full text-black font-semibold"
              />
              <button
                onClick={() => {
                  localStorage.setItem('ithipooram_customer_base_url', customerBaseUrl);
                  setShowConfig(false);
                }}
                className="px-3 py-1.5 bg-[#9E341D] text-white font-bold rounded-lg cursor-pointer"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Body View */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6">
        {selectedStand ? (
          /* ========================================================================= */
          /* TABLE DETAIL VIEW (CLICKED ON TABLE NAME): QR STAND + LIVE ORDER TRACKING */
          /* ========================================================================= */
          <div className="animate-in fade-in duration-200">
            {/* Top Navigation Bar for Table Detail */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-parchment-200">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setSelectedTableId(null)}
                  className="px-3.5 py-2 rounded-2xl bg-white hover:bg-parchment-100 text-slatepos-800 border border-parchment-300 flex items-center space-x-1.5 transition active:scale-95 shadow-2xs font-bold text-xs cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4 text-[#9E341D]" />
                  <span>Back to {selectedStand.roomName} Tables</span>
                </button>

                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xl sm:text-2xl font-black text-slatepos-950 font-mono">
                      {selectedStand.tableCode}
                    </span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-slatepos-900 text-amber-300 font-bold">
                      {selectedStand.roomName}
                    </span>
                    {selectedStandOrders.length > 0 ? (
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-300 flex items-center space-x-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
                        <span>{selectedStandOrders.length} Order(s) Active</span>
                      </span>
                    ) : (
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold">
                        Available
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slatepos-500 mt-0.5">
                    {selectedStand.roomName} Table {selectedStand.tableCode} • {selectedStand.tableName} • Capacity: {selectedStand.capacity} Guests
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <a
                  href="https://t.me/+9eJM_DO7vyUxMjE9"
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-2xl bg-[#0088cc] hover:bg-[#0077b5] text-white font-bold text-xs flex items-center space-x-2 shadow-sm transition active:scale-95 cursor-pointer"
                  title="Open Telegram Group to view live order database in Excel"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Open Telegram Group ↗</span>
                </a>

                <button
                  onClick={() => handleExportStandImage(selectedStand)}
                  className="px-4 py-2 rounded-2xl bg-[#9E341D] hover:bg-[#832B18] text-white font-bold text-xs flex items-center space-x-1.5 shadow-sm transition active:scale-95 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Stand PNG</span>
                </button>
              </div>
            </div>

            {/* Two Column Layout: Left = QR Stand, Right = Live Orders & Telegram Sync */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Physical QR Stand Preview */}
              <div className="lg:col-span-5 xl:col-span-4 space-y-4">
                <div className="bg-white rounded-3xl border-2 border-slatepos-900 shadow-md p-6 text-center">
                  {/* Stand Header Branding */}
                  <div className="flex items-center justify-center space-x-2.5 mb-2">
                    <img 
                      src="/ithipooram-logo.png" 
                      alt="Logo" 
                      className="w-10 h-10 rounded-xl object-contain shadow-xs shrink-0"
                    />
                    <div className="text-left">
                      <div className="text-xs font-black tracking-widest text-slatepos-950 uppercase">
                        ITHI POORAM
                      </div>
                      <div className="text-[10px] font-bold text-[#9E341D]">
                        ഇത്തിപ്പൂരം
                      </div>
                    </div>
                  </div>

                  <div className="text-[11px] font-bold text-slatepos-600 bg-amber-50 border border-amber-200 rounded-lg py-1 px-2.5 mb-3">
                    {selectedStand.roomName} • {selectedStand.tableName}
                  </div>

                  {/* Scannable QR Frame */}
                  <div className="p-4 bg-white border-2 border-slatepos-900 rounded-2xl shadow-inner mx-auto max-w-[260px]">
                    <img
                      src={selectedStand.qrDataUrl}
                      alt={`QR Code for ${selectedStand.tableCode}`}
                      className="w-full h-auto aspect-square object-contain mx-auto"
                    />
                  </div>

                  {/* Big Table Code Box */}
                  <div className="w-full bg-slatepos-900 text-white py-3 px-4 rounded-2xl mt-4 mb-2">
                    <div className="text-3xl font-black font-mono tracking-widest text-amber-300">
                      {selectedStand.tableCode}
                    </div>
                    <div className="text-xs text-slate-300 font-semibold mt-0.5">
                      {selectedStand.roomName} — {selectedStand.tableName}
                    </div>
                  </div>

                  <p className="text-[11px] text-slatepos-400 font-medium">
                    Scan with phone camera to order
                  </p>

                  {/* Action links */}
                  <div className="mt-4 pt-4 border-t border-parchment-200 flex flex-col space-y-2">
                    <button
                      onClick={() => handleCopyLink(selectedStand.url)}
                      className="w-full py-2.5 px-3 rounded-xl text-xs font-bold bg-parchment-100 hover:bg-parchment-200 text-slatepos-800 border border-parchment-300 flex items-center justify-center space-x-1.5 transition active:scale-98 cursor-pointer"
                    >
                      {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedUrl ? 'Copied QR Link!' : 'Copy Table QR Link'}</span>
                    </button>

                    <a
                      href={selectedStand.url}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-2.5 px-3 rounded-xl text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 flex items-center justify-center space-x-1.5 transition"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-[#9E341D]" />
                      <span>Open Customer Mobile View ↗</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Right Column: Live Order Tracking of that QR & Telegram Sync */}
              <div className="lg:col-span-7 xl:col-span-8 space-y-5">
                {/* Telegram Group Direct Banner */}
                <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-sky-950 via-slate-900 to-slate-950 text-white border border-sky-500/20 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
                      <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">
                        Telegram Live Excel Sync
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-white">
                      Order details sync live to Telegram as Excel spreadsheet
                    </h4>
                    <p className="text-[11px] text-slate-300">
                      Bot: <code className="text-sky-300">@ithipooram_bot</code> • Group: <span className="text-white font-medium">Ithi Pooram Orders</span>
                    </p>
                  </div>

                  <div className="flex items-center space-x-2 w-full sm:w-auto shrink-0">
                    <button
                      onClick={handleManualTelegramSync}
                      disabled={isSyncingTelegram}
                      className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 flex items-center justify-center space-x-1.5 transition active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                      {isSyncingTelegram ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5 text-sky-300" />}
                      <span>Send Excel Now</span>
                    </button>

                    <a
                      href="https://t.me/+9eJM_DO7vyUxMjE9"
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-[#0088cc] hover:bg-[#0077b5] text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition active:scale-95 shadow-sm"
                    >
                      <span>Open Group ↗</span>
                    </a>
                  </div>
                </div>

                {telegramSyncFeedback && (
                  <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold animate-in fade-in">
                    {telegramSyncFeedback}
                  </div>
                )}

                {/* Live Order Tracking for this specific table */}
                <div className="bg-white rounded-3xl border border-parchment-200 p-5 sm:p-6 shadow-xs">
                  <div className="flex items-center justify-between pb-3 border-b border-parchment-200 mb-4">
                    <div>
                      <h3 className="text-base font-extrabold text-slatepos-950 flex items-center space-x-2">
                        <UtensilsCrossed className="w-4 h-4 text-[#9E341D]" />
                        <span>Live Orders for {selectedStand.roomName} Table {selectedStand.tableCode}</span>
                      </h3>
                      <p className="text-xs text-slatepos-500 mt-0.5">
                        Real-time customer orders placed through this specific table QR code
                      </p>
                    </div>

                    <span className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-black uppercase tracking-wider flex items-center space-x-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Live Tracking</span>
                    </span>
                  </div>

                  {selectedStandOrders.length === 0 ? (
                    <div className="py-14 text-center">
                      <div className="w-14 h-14 rounded-3xl bg-amber-50 border border-amber-200 text-[#9E341D] flex items-center justify-center mx-auto mb-3">
                        <Clock className="w-7 h-7" />
                      </div>
                      <h4 className="text-sm font-bold text-slatepos-900">
                        No active orders for Table {selectedStand.tableCode} yet
                      </h4>
                      <p className="text-xs text-slatepos-500 max-w-sm mx-auto mt-1 leading-relaxed">
                        As soon as a guest scans this QR code and places an order, the items, rounds, quantities, and totals will appear here live and sync to Telegram.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {selectedStandOrders.map((order) => {
                        const orderDate = new Date(order.createdAt || Date.now());
                        const timeFormatted = orderDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
                        const dateFormatted = orderDate.toLocaleDateString('en-GB');

                        return (
                          <div
                            key={order.id}
                            className="p-4 rounded-2xl border border-parchment-300 bg-parchment-50/50 hover:bg-parchment-50 transition"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-parchment-200 mb-3 text-xs">
                              <div className="flex items-center space-x-2">
                                <span className="font-mono font-black text-slatepos-950 px-2.5 py-0.5 rounded-lg bg-white border border-parchment-300 shadow-2xs">
                                  {order.customerCode || order.id}
                                </span>
                                <span className="text-slatepos-500 text-[11px]">
                                  {dateFormatted} at {timeFormatted}
                                </span>
                                {order.roundCount && order.roundCount > 1 && (
                                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-black text-[10px]">
                                    Round {order.roundCount} (Add-on)
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center space-x-2">
                                <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                                  order.fulfillmentStatus === 'READY' || order.fulfillmentStatus === 'SERVED'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-amber-100 text-amber-900'
                                }`}>
                                  {order.fulfillmentStatus || 'NEW'}
                                </span>
                                <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                                  order.paymentStatus === 'PAID'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {order.paymentStatus || 'UNPAID'}
                                </span>
                              </div>
                            </div>

                            {/* Items List */}
                            <div className="space-y-1.5 mb-3">
                              {order.items?.map((item: any, idx: number) => (
                                <div key={idx} className="flex items-center justify-between text-xs">
                                  <span className="text-slatepos-800 font-semibold">
                                    <span className="text-[#9E341D] font-bold mr-1.5">x{item.quantity}</span>
                                    {item.itemName} {item.itemMalayalamName && <span className="text-[11px] text-slatepos-400">({item.itemMalayalamName})</span>}
                                  </span>
                                  <span className="font-mono font-bold text-slatepos-900">
                                    ₹{((item.lineTotalPaise || item.pricePaise * item.quantity || 0) / 100).toFixed(2)}
                                  </span>
                                </div>
                              ))}
                            </div>

                            {/* Total Breakdown */}
                            <div className="pt-2 border-t border-parchment-200 flex items-center justify-between text-xs font-bold">
                              <span className="text-slatepos-500">Total with GST:</span>
                              <span className="text-base font-black text-[#9E341D] font-mono">
                                ₹{((order.grandTotalPaise || 0) / 100).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* CLEAN TABLES DASHBOARD VIEW: SHOW ROOMS FIRST, THEN TABLE NAMES ONLY      */
          /* ========================================================================= */
          <div className="space-y-6">
            {/* 1. ROOMS OPTION FIRST TOGETHER WITH ADD ROOM */}
            <div className="bg-white rounded-3xl border border-parchment-200 p-5 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-parchment-200 mb-4">
                <div>
                  <h2 className="text-base sm:text-lg font-black text-slatepos-950 flex items-center space-x-2">
                    <Layers className="w-5 h-5 text-[#9E341D]" />
                    <span>Rooms &amp; Dining Areas</span>
                  </h2>
                  <p className="text-xs text-slatepos-500">
                    Select a room to view its tables, or add a new dining room.
                  </p>
                </div>

                {/* ADD ROOM BUTTON RIGHT TOGETHER WITH ROOMS */}
                <button
                  onClick={() => handleOpenWizard()}
                  className="px-4 py-2 rounded-2xl text-xs font-black bg-[#9E341D] hover:bg-[#832B18] text-white shadow-md flex items-center space-x-1.5 transition active:scale-95 cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Room</span>
                </button>
              </div>

              {/* CREATED ROOMS TABS UNDER THAT */}
              <div className="flex items-center space-x-2.5 overflow-x-auto no-scrollbar py-1">
                {rooms.map((room) => {
                  const isSelected = room.id === selectedRoomId;
                  const count = tables.filter((t) => t.roomId === room.id).length;
                  return (
                    <button
                      key={room.id}
                      onClick={() => {
                        setSelectedRoomId(room.id);
                        setSelectedTableId(null);
                      }}
                      className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition whitespace-nowrap flex items-center space-x-2 cursor-pointer ${
                        isSelected
                          ? 'bg-slatepos-900 text-white shadow-md ring-2 ring-slatepos-900'
                          : 'bg-parchment-100 text-slatepos-700 hover:bg-parchment-200 border border-parchment-300'
                      }`}
                    >
                      <span>{room.name}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                        isSelected ? 'bg-amber-400 text-slatepos-950' : 'bg-parchment-300 text-slatepos-700'
                      }`}>
                        {count} Table{count !== 1 ? 's' : ''}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. CREATED ROOM DETAILS UNDER THAT WITH ADD TABLE OPTION */}
            {currentRoom ? (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 bg-white rounded-3xl border border-parchment-200 shadow-2xs">
                  <div>
                    <h3 className="text-xl font-black text-slatepos-950">
                      {currentRoom.name}
                    </h3>
                    <p className="text-xs text-slatepos-500 mt-0.5">
                      {currentRoomTables.length} table(s) configured. Click any table name below to view its QR code and live order stream.
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* ADD TABLE TO THIS ROOM OPTION */}
                    <button
                      onClick={() => handleOpenWizard(currentRoom.name)}
                      className="px-4 py-2.5 rounded-2xl text-xs font-extrabold bg-[#9E341D] hover:bg-[#832B18] text-white shadow-md flex items-center space-x-1.5 transition active:scale-95 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Tables to {currentRoom.name}</span>
                    </button>

                    <button
                      onClick={() => handleDeleteRoom(currentRoom.id)}
                      className="p-2 rounded-xl text-red-500 hover:bg-red-50 hover:text-red-700 transition"
                      title={`Delete ${currentRoom.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* 3. SHOW ONLY TABLE NAMES INSIDE THAT PAGE (LIKE LIVING ROOM TABLE TQ1A) */}
                {currentRoomTables.length === 0 ? (
                  <div className="h-56 flex flex-col items-center justify-center text-center bg-white rounded-3xl border border-parchment-200 p-8 shadow-xs">
                    <Layers className="w-10 h-10 text-slatepos-300 mb-2" />
                    <h4 className="text-sm font-bold text-slatepos-800">No tables in {currentRoom.name} yet</h4>
                    <p className="text-xs text-slatepos-500 mt-1 max-w-sm">
                      Click &quot;Add Tables to {currentRoom.name}&quot; to configure your tables and QRs.
                    </p>
                    <button
                      onClick={() => handleOpenWizard(currentRoom.name)}
                      className="mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-[#9E341D] text-white shadow-md flex items-center space-x-1"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Tables Now</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {currentRoomTables.map((stand) => {
                      const tableOrders = allOrders.filter(
                        (o) => o.tableCode.toUpperCase() === stand.tableCode.toUpperCase()
                      );
                      const hasActiveOrders = tableOrders.length > 0;

                      return (
                        <div
                          key={stand.id}
                          onClick={() => setSelectedTableId(stand.id)}
                          className="bg-white rounded-2xl border-2 border-parchment-200 hover:border-[#9E341D] p-4 shadow-2xs hover:shadow-md transition cursor-pointer flex items-center justify-between group active:scale-99"
                        >
                          <div className="space-y-1">
                            {/* ONLY TABLE NAME: LIKE LIVING ROOM TABLE TQ1A */}
                            <div className="flex items-center space-x-2">
                              <span className="px-2.5 py-1 rounded-lg bg-slatepos-900 text-amber-300 font-mono font-black text-sm">
                                {stand.tableCode}
                              </span>
                              <h4 className="font-extrabold text-sm text-slatepos-950 group-hover:text-[#9E341D] transition">
                                {stand.roomName} Table {stand.tableCode}
                              </h4>
                            </div>

                            <div className="flex items-center space-x-2 text-[11px] text-slatepos-500">
                              <span>{stand.tableName}</span>
                              <span>•</span>
                              <span>Capacity: {stand.capacity} Guests</span>
                            </div>

                            <div className="pt-0.5">
                              {hasActiveOrders ? (
                                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
                                  <span>{tableOrders.length} Order(s) Active</span>
                                </span>
                              ) : (
                                <span className="inline-block px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-semibold">
                                  Available
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center space-x-2 shrink-0 ml-3">
                            <span className="hidden sm:inline text-xs font-bold text-[#9E341D] group-hover:underline">
                              View QR &amp; Orders
                            </span>
                            <div className="w-9 h-9 rounded-xl bg-amber-50 group-hover:bg-[#9E341D] text-[#9E341D] group-hover:text-white flex items-center justify-center transition">
                              <ChevronRight className="w-4 h-4" />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="py-20 text-center bg-white rounded-3xl border border-parchment-200 p-6">
                <Layers className="w-10 h-10 text-slatepos-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-slatepos-700">No rooms available.</p>
                <button
                  onClick={() => handleOpenWizard()}
                  className="mt-3 px-4 py-2 rounded-xl bg-[#9E341D] text-white font-bold text-xs"
                >
                  + Create Room &amp; Tables
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* STEP-BY-STEP DYNAMIC ROOM & TABLE GENERATOR WIZARD MODAL */}
      {isWizardOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-parchment-200 animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-parchment-200">
              <div className="flex items-center space-x-2">
                <span className="w-7 h-7 rounded-lg bg-amber-500 text-slatepos-950 font-black text-xs flex items-center justify-center">
                  {wizardStep}
                </span>
                <h3 className="text-base font-extrabold text-slatepos-950">
                  {wizardStep === 1 ? 'Step 1: Room Name' : 'Step 2: Configure Tables & Seats'}
                </h3>
              </div>
              <button
                onClick={() => setIsWizardOpen(false)}
                className="p-1.5 rounded-lg text-slatepos-400 hover:bg-parchment-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* STEP 1: CLEAN ROOM NAME INPUT (NO RECOMMENDATIONS, NO UNNECESSARY TEXT) */}
            {wizardStep === 1 && (
              <div className="my-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slatepos-700 uppercase tracking-wider mb-2">
                    Dining Room / Area Name:
                  </label>
                  <input
                    type="text"
                    value={inputRoomName}
                    onChange={(e) => setInputRoomName(e.target.value)}
                    placeholder='e.g. Living Room, AC Hall, Family Hall'
                    className="w-full px-4 py-3 rounded-2xl border border-parchment-300 text-sm font-bold text-black bg-white focus:outline-none focus:border-[#9E341D]"
                    autoFocus
                  />
                </div>

                <div className="pt-4 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsWizardOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-slatepos-600 hover:bg-parchment-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!inputRoomName.trim()}
                    onClick={() => setWizardStep(2)}
                    className="px-5 py-2.5 rounded-xl text-xs font-extrabold bg-[#9E341D] hover:bg-[#832B18] text-white shadow-md flex items-center space-x-1.5 disabled:opacity-50"
                  >
                    <span>Next: Add Tables</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: MULTI-TABLE & MULTI-SEAT SPLIT (TQ1A, TQ1B, TQ1C...) */}
            {wizardStep === 2 && (
              <div className="my-5 space-y-4">
                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
                  <div>
                    <span className="font-bold">Active Room:</span> {inputRoomName}
                  </div>
                  <button
                    onClick={() => setWizardStep(1)}
                    className="text-[11px] font-bold text-[#9E341D] hover:underline"
                  >
                    Change Room
                  </button>
                </div>

                {/* Table Numbers & Batch Count - Input Inside Clearly Visible Black */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slatepos-700 uppercase tracking-wider mb-1">
                      Starting Table Number:
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={99}
                      value={tableNumberStart}
                      onChange={(e) => setTableNumberStart(parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2.5 rounded-xl border border-parchment-300 text-base font-bold font-mono text-black bg-white focus:outline-none focus:border-[#9E341D]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slatepos-700 uppercase tracking-wider mb-1">
                      How Many Tables to Add:
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={20}
                      value={tableCountToGenerate}
                      onChange={(e) => setTableCountToGenerate(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2.5 rounded-xl border border-parchment-300 text-base font-bold font-mono text-black bg-white focus:outline-none focus:border-[#9E341D]"
                    />
                  </div>
                </div>

                {/* Multi-Customer Seat Sharing Toggle */}
                <div className="p-4 rounded-2xl bg-parchment-100 border border-parchment-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slatepos-950 block">
                        Multi-Guest Seat Sub-QRs (e.g. TQ1A, TQ1B, TQ1C)
                      </span>
                      <p className="text-[11px] text-slatepos-500">
                        Enable if multiple random persons sit at the same table and order separately.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={isSeatSharingEnabled}
                      onChange={(e) => setIsSeatSharingEnabled(e.target.checked)}
                      className="w-5 h-5 rounded-md accent-[#9E341D] cursor-pointer"
                    />
                  </div>

                  {isSeatSharingEnabled && (
                    <div className="pt-2 border-t border-parchment-200 flex items-center justify-between">
                      <span className="text-xs font-bold text-slatepos-700">
                        Number of Persons / Seats per Table:
                      </span>
                      <div className="flex items-center space-x-1.5">
                        {[2, 3, 4, 6].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => setSeatsPerTable(num)}
                            className={`w-8 h-8 rounded-lg text-xs font-bold transition ${
                              seatsPerTable === num
                                ? 'bg-[#9E341D] text-white shadow-2xs'
                                : 'bg-white text-slatepos-700 border border-parchment-300 hover:bg-parchment-200'
                            }`}
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Real-Time Generated Preview */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-bold text-slatepos-400 uppercase tracking-wider">
                      Live Preview ({previewGeneratedCodes.length} QR Stands):
                    </span>
                  </div>
                  {previewGeneratedCodes.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2.5 bg-parchment-50 rounded-xl border border-parchment-200">
                      {previewGeneratedCodes.map((p) => (
                        <span
                          key={p.code}
                          className="px-2 py-1 rounded-lg bg-white border border-parchment-300 text-xs font-mono font-bold text-slatepos-900 shadow-2xs flex items-center space-x-1"
                        >
                          <span className="text-[#9E341D]">{p.code}</span>
                          <span className="text-[10px] text-slatepos-400">({p.label.split('(')[1] ? p.label.split('(')[1].replace(')', '') : 'Full'})</span>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 text-center text-xs text-slatepos-400 bg-parchment-50 rounded-xl border border-parchment-200">
                      Enter the number of tables to add (e.g. 1, 2, 4) to preview QR stands.
                    </div>
                  )}
                </div>

                {/* Confirmation Footer */}
                <div className="pt-4 flex justify-between space-x-2">
                  <button
                    type="button"
                    onClick={() => setWizardStep(1)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-slatepos-600 hover:bg-parchment-100"
                  >
                    ← Back
                  </button>

                  <button
                    type="button"
                    disabled={isGenerating || previewGeneratedCodes.length === 0}
                    onClick={handleConfirmWizard}
                    className="px-6 py-2.5 rounded-xl text-xs font-black bg-[#9E341D] hover:bg-[#832B18] text-white shadow-lg flex items-center space-x-1.5 disabled:opacity-50 active:scale-98 transition"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {previewGeneratedCodes.length === 0
                        ? 'Enter Tables to Add'
                        : isGenerating
                        ? 'Generating QRs...'
                        : `Confirm & Create ${previewGeneratedCodes.length} Stand(s)`}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
