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
  X
} from 'lucide-react';
import QRCode from 'qrcode';
import { getCurrentUser } from '../../lib/api';

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

  // View mode: 'landing' (clean first page) or 'tables' (existing tables view)
  const [viewMode, setViewMode] = useState<'landing' | 'tables'>('landing');
  const [landingNotice, setLandingNotice] = useState<string>('');

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

  // Hidden Canvas Ref for High-Res Acrylic Stand Export
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Check auth and load saved rooms & tables
  useEffect(() => {
    if (!getCurrentUser()) {
      router.replace('/login');
      return;
    }

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
    setViewMode('landing');
    localStorage.removeItem('ithipooram_custom_rooms');
    localStorage.removeItem('ithipooram_custom_tables');
    try {
      fetch('/api/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tables: [] }),
      }).catch(() => {});
    } catch (e) {}
  };

  // Continue with existing tables handler
  const handleContinueWithExisting = () => {
    if (tables.length > 0 && rooms.length > 0) {
      if (!selectedRoomId) setSelectedRoomId(rooms[0].id);
      setViewMode('tables');
    } else {
      setLandingNotice('No saved tables found yet. Please create your first room & tables.');
      setTimeout(() => setLandingNotice(''), 4000);
    }
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
      setViewMode('tables');
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
      setViewMode('landing');
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

  // Filter tables by active room
  const currentRoom = rooms.find((r) => r.id === selectedRoomId);
  const currentRoomTables = tables.filter((t) => t.roomId === selectedRoomId);

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
          {tables.length > 0 && viewMode === 'tables' && (
            <button
              onClick={() => setViewMode('landing')}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slatepos-800 hover:bg-slatepos-700 text-slatepos-300 flex items-center space-x-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Setup Overview</span>
            </button>
          )}

          {tables.length > 0 && (
            <button
              onClick={handleStartFresh}
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl text-xs font-bold bg-slatepos-800 hover:bg-red-950 text-red-300 border border-red-900/40 flex items-center space-x-1.5 transition active:scale-95"
              title="Clear all rooms & tables to start fresh"
            >
              <RotateCcw className="w-3.5 h-3.5 text-red-400" />
              <span className="hidden sm:inline">Start Fresh</span>
            </button>
          )}

          <button
            onClick={() => setShowConfig(!showConfig)}
            className="p-2 rounded-xl bg-slatepos-800 hover:bg-slatepos-700 text-slatepos-300"
            title="Configure Target Customer URL"
          >
            <Settings className="w-4 h-4" />
          </button>

          {tables.length > 0 && viewMode === 'tables' && (
            <button
              onClick={() => window.print()}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#9E341D] hover:bg-[#832B18] text-white flex items-center space-x-1.5 shadow-md active:scale-95 transition"
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
                className="px-3 py-1.5 bg-[#9E341D] text-white font-bold rounded-lg"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Room Tabs & Management Bar (Only shown in tables view) */}
      {viewMode === 'tables' && rooms.length > 0 && (
        <section className="bg-white border-b border-parchment-200 px-4 sm:px-6 py-3.5 shadow-2xs print:hidden">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar w-full sm:w-auto py-1">
              <span className="text-xs font-bold text-slatepos-500 uppercase tracking-wider shrink-0 mr-1">
                Rooms:
              </span>

              {rooms.map((room) => {
                const isSelected = room.id === selectedRoomId;
                const count = tables.filter((t) => t.roomId === room.id).length;
                return (
                  <button
                    key={room.id}
                    onClick={() => setSelectedRoomId(room.id)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center space-x-1.5 ${
                      isSelected
                        ? 'bg-slatepos-900 text-white shadow-sm ring-1 ring-slatepos-900'
                        : 'bg-parchment-100 text-slatepos-700 hover:bg-parchment-200'
                    }`}
                  >
                    <span>{room.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isSelected ? 'bg-amber-400 text-slatepos-950 font-black' : 'bg-parchment-300 text-slatepos-600'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}

              <button
                onClick={() => handleOpenWizard()}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-50 hover:bg-amber-100 text-[#9E341D] border border-amber-300 flex items-center space-x-1 whitespace-nowrap shrink-0 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Room</span>
              </button>
            </div>

            {currentRoom && (
              <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                <button
                  onClick={() => handleOpenWizard(currentRoom.name)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#9E341D] hover:bg-[#832B18] text-white shadow-xs flex items-center space-x-1 transition active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Tables to {currentRoom.name}</span>
                </button>

                <button
                  onClick={() => handleDeleteRoom(currentRoom.id)}
                  className="p-1.5 rounded-xl text-red-500 hover:bg-red-50 hover:text-red-700"
                  title={`Delete ${currentRoom.name}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Main Body View */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6">
        {/* FIRST PAGE: Clean Landing View */}
        {viewMode === 'landing' ? (
          <div className="max-w-2xl mx-auto my-6 sm:my-10 bg-white rounded-3xl border border-parchment-200 shadow-sm p-6 sm:p-10 text-center animate-in fade-in duration-200">
            {/* Notice if any */}
            {landingNotice && (
              <div className="mb-4 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold animate-in fade-in">
                {landingNotice}
              </div>
            )}

            {/* 1, 2, 3 Step Sections (Cleanly Preserved) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-left mb-8">
              <div className="p-4 rounded-2xl bg-parchment-50 border border-parchment-200">
                <div className="w-7 h-7 rounded-xl bg-slatepos-900 text-amber-400 font-black text-xs flex items-center justify-center mb-2">1</div>
                <div className="font-bold text-xs text-slatepos-950 mb-1">Name Dining Room</div>
                <div className="text-[11px] text-slatepos-500">Add custom dining rooms or seating areas.</div>
              </div>
              <div className="p-4 rounded-2xl bg-parchment-50 border border-parchment-200">
                <div className="w-7 h-7 rounded-xl bg-slatepos-900 text-amber-400 font-black text-xs flex items-center justify-center mb-2">2</div>
                <div className="font-bold text-xs text-slatepos-950 mb-1">Set Tables & Seats</div>
                <div className="text-[11px] text-slatepos-500">Configure tables and multi-seat customer splits.</div>
              </div>
              <div className="p-4 rounded-2xl bg-parchment-50 border border-parchment-200">
                <div className="w-7 h-7 rounded-xl bg-slatepos-900 text-amber-400 font-black text-xs flex items-center justify-center mb-2">3</div>
                <div className="font-bold text-xs text-slatepos-950 mb-1">Export HQ Stand</div>
                <div className="text-[11px] text-slatepos-500">Download high-resolution acrylic stand PNGs.</div>
              </div>
            </div>

            {/* Action Buttons: Create New & Continue with Existing */}
            <div className="space-y-3 max-w-md mx-auto">
              <button
                onClick={() => handleOpenWizard()}
                className="w-full py-3.5 px-6 rounded-2xl text-sm font-extrabold bg-[#9E341D] hover:bg-[#832B18] text-white shadow-xl shadow-[#9E341D]/20 flex items-center justify-center space-x-2 active:scale-98 transition cursor-pointer"
              >
                <Plus className="w-5 h-5" />
                <span>Create Your First Room & Tables</span>
              </button>

              <button
                onClick={handleContinueWithExisting}
                className="w-full py-3 px-6 rounded-2xl text-xs font-bold bg-parchment-100 hover:bg-parchment-200 text-slatepos-800 border border-parchment-300 flex items-center justify-center space-x-2 transition active:scale-98 cursor-pointer"
              >
                <span>Continue with Existing Tables</span>
                {tables.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-slatepos-900 text-amber-400 text-[10px] font-black">
                    {tables.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* TABLES DASHBOARD VIEW */
          <div>
            {currentRoom ? (
              <div>
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-parchment-200 gap-2">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-slatepos-950 flex items-center space-x-2">
                      <span>{currentRoom.name}</span>
                    </h2>
                    <p className="text-xs text-slatepos-500 mt-0.5">
                      {currentRoomTables.length} Generated Table / Seat Stands in this area
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleOpenWizard(currentRoom.name)}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#9E341D] hover:bg-[#832B18] text-white shadow-xs flex items-center space-x-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Tables to {currentRoom.name}</span>
                    </button>
                  </div>
                </div>

                {currentRoomTables.length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center text-center bg-white rounded-3xl border border-parchment-200 p-8 shadow-xs">
                    <Layers className="w-12 h-12 text-slatepos-300 mb-2" />
                    <h3 className="text-base font-bold text-slatepos-800">No Tables in {currentRoom.name}</h3>
                    <p className="text-xs text-slatepos-500 mt-1 max-w-sm">
                      Add single tables or split multi-seat customer QRs (e.g. TQ1A, TQ1B, TQ1C) for this room.
                    </p>
                    <button
                      onClick={() => handleOpenWizard(currentRoom.name)}
                      className="mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-[#9E341D] text-white shadow-md flex items-center space-x-1"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Tables & Seats Now</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {currentRoomTables.map((stand) => (
                      <div
                        key={stand.id}
                        className="bg-white rounded-3xl border border-parchment-200 overflow-hidden shadow-xs hover:shadow-md transition p-5 text-center flex flex-col justify-between"
                      >
                        <div>
                          {/* Top Branding Preview */}
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

                          {/* Room & Seat Tag */}
                          <div className="text-[11px] font-bold text-slatepos-500 bg-parchment-100 rounded-lg py-1 px-2 mb-3">
                            {stand.roomName} • {stand.tableName}
                          </div>

                          {/* Scannable QR in Framed Container */}
                          <div className="p-3 bg-white border-2 border-slatepos-900 rounded-2xl shadow-inner my-2">
                            <img
                              src={stand.qrDataUrl}
                              alt={`QR Code for ${stand.tableCode}`}
                              className="w-44 h-44 object-contain mx-auto"
                            />
                          </div>

                          {/* Table Code Pill */}
                          <div className="w-full bg-slatepos-900 text-white py-2 px-3 rounded-xl mb-1 mt-2">
                            <div className="text-2xl font-black font-mono tracking-wider">
                              {stand.tableCode}
                            </div>
                            <div className="text-[10px] text-amber-300 font-medium">
                              {stand.tableName}
                            </div>
                          </div>

                          <p className="text-[10px] text-slatepos-400 font-medium mt-1">
                            Scan with phone camera to order
                          </p>
                        </div>

                        {/* Stand Actions */}
                        <div className="mt-4 pt-3 border-t border-parchment-200 w-full space-y-2 print:hidden">
                          {/* 1. Export High-Res Stand Graphic */}
                          <button
                            onClick={() => handleExportStandImage(stand)}
                            className="w-full py-2.5 px-3 rounded-xl text-xs font-black bg-[#9E341D] hover:bg-[#832B18] text-white flex items-center justify-center space-x-1.5 shadow-md active:scale-95 transition cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Export Stand Image (PNG)</span>
                          </button>

                          {/* 2. Test Open Table Order Link */}
                          <a
                            href={stand.url}
                            target="_blank"
                            rel="noreferrer"
                            className="w-full py-1.5 px-3 rounded-xl text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 flex items-center justify-center space-x-1"
                          >
                            <ExternalLink className="w-3 h-3 text-[#9E341D]" />
                            <span>Test Live Table Link</span>
                          </a>

                          {/* 3. Delete Option */}
                          <button
                            onClick={() => handleDeleteTable(stand.id)}
                            className="w-full text-center text-[11px] text-slatepos-400 hover:text-red-600 pt-1 cursor-pointer"
                          >
                            Remove Table
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="py-24 text-center">
                <p className="text-sm font-bold text-slatepos-600">No rooms configured yet.</p>
                <button
                  onClick={() => handleOpenWizard()}
                  className="mt-3 px-4 py-2 rounded-xl bg-[#9E341D] text-white font-bold text-xs"
                >
                  + Create Room & Tables
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
