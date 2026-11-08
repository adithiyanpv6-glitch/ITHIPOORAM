// Utilities for 58mm (2-inch / 32 column) and 80mm ESC/POS Thermal Printers
// Specifically tuned for SEZNIK 58mm Bluetooth & USB Mini Thermal Receipt Printers

export interface ReceiptItem {
  name: string;
  qty: number;
  price: number;
  total: number;
}

export interface DishSoldItem {
  name: string;
  amount: number;
}

export interface ReceiptData {
  restaurantName?: string;
  restaurantLocation?: string;
  phone?: string;
  
  // Document Type / Header
  reportType?: 'bill' | 'daily_report';
  title?: string; // 'BILL OF SUPPLY' | 'DAILY REVENUE REPORT'
  subtitle?: string;
  
  // Standard Bill fields
  invoiceNumber?: string;
  orderCode?: string;
  tableCode?: string;
  dateTime?: string;
  paymentMode?: string;
  items?: ReceiptItem[];
  subtotal?: number;
  
  // Daily Report fields
  dateRangeLabel?: string;
  settledChecksCount?: number;
  cashRevenue?: number;
  upiRevenue?: number;
  dishesSold?: DishSoldItem[];
  
  // Common
  grandTotal: number;
  extraLines?: number;
  footerPrimary?: string;
  footerSecondary?: string;
}

function formatRow(left: string, right: string, totalWidth: number = 32): string {
  const sp = Math.max(1, totalWidth - left.length - right.length);
  return `${left}${' '.repeat(sp)}${right}`;
}

// 1. Text-Mode ESC/POS Generator (Fallback & Fast Text)
export function generateEscPos58mmCommands(data: ReceiptData): Uint8Array {
  const encoder = new TextEncoder();
  const parts: Uint8Array[] = [];

  const writeBytes = (...bytes: number[]) => {
    parts.push(new Uint8Array(bytes));
  };

  const writeLine = (str: string = '') => {
    parts.push(encoder.encode(str + '\n'));
  };

  // 1. Initialize printer: ESC @
  writeBytes(0x1b, 0x40);

  // 2. Set align center: ESC a 1
  writeBytes(0x1b, 0x61, 0x01);

  // 3. Double height & width for Header: GS ! 0x11
  writeBytes(0x1d, 0x21, 0x11);
  writeLine(data.restaurantName || 'ITHI POORAM');

  // Cancel double mode: GS ! 0x00
  writeBytes(0x1d, 0x21, 0x00);
  writeLine(data.restaurantLocation || 'Vanchiyoor, Trivandrum');
  if (data.reportType !== 'daily_report') {
    writeLine(`Ph: ${data.phone || '+91 94470 00000'}`);
  }

  // Dashed line (32 chars)
  writeLine('--------------------------------');

  if (data.reportType === 'daily_report') {
    // --- DAILY REVENUE REPORT LAYOUT (32 COLUMNS) ---
    writeBytes(0x1b, 0x45, 0x01); // Bold on
    writeLine(data.title || 'DAILY REVENUE REPORT');
    writeBytes(0x1b, 0x45, 0x00); // Bold off

    writeBytes(0x1b, 0x61, 0x00); // Left align
    writeLine(formatRow('Date:', data.dateTime || new Date().toLocaleDateString('en-IN'), 32));
    writeLine(formatRow('Range:', data.dateRangeLabel || 'Today', 32));
    writeLine(formatRow('Settled Checks:', String(data.settledChecksCount ?? 0), 32));
    writeLine('--------------------------------');

    writeLine(formatRow('Cash Revenue:', `Rs.${(data.cashRevenue ?? 0).toFixed(2)}`, 32));
    writeLine(formatRow('UPI / Online:', `Rs.${(data.upiRevenue ?? 0).toFixed(2)}`, 32));
    writeLine('--------------------------------');

    writeBytes(0x1b, 0x45, 0x01); // Bold on
    writeLine(formatRow('TOTAL SALES:', `Rs.${data.grandTotal.toFixed(2)}`, 32));
    writeBytes(0x1b, 0x45, 0x00); // Bold off

    if (data.dishesSold && data.dishesSold.length > 0) {
      writeLine('--------------------------------');
      writeBytes(0x1b, 0x45, 0x01);
      writeLine('Dishes Sold:');
      writeBytes(0x1b, 0x45, 0x00);
      data.dishesSold.slice(0, 6).forEach((dish) => {
        const dName = dish.name.padEnd(20).substring(0, 20);
        const dAmt = `Rs.${dish.amount.toFixed(2)}`.padStart(11);
        writeLine(`${dName} ${dAmt}`);
      });
    }

    writeLine('--------------------------------');
    writeBytes(0x1b, 0x61, 0x01); // Center
    writeLine(data.footerPrimary || 'ITHI POORAM REPORT');
    writeLine(data.footerSecondary || 'Generated at Vanchiyoor POS');
  } else {
    // --- STANDARD CUSTOMER BILL LAYOUT (32 COLUMNS) ---
    writeBytes(0x1b, 0x45, 0x01); // Bold on
    writeLine(data.title || 'BILL OF SUPPLY');
    writeBytes(0x1b, 0x45, 0x00); // Bold off

    // Metadata: Inv & Date, Table & Mode (32 chars per line)
    const invStr = `Inv: ${data.invoiceNumber || '1001'}`;
    const dateStr = data.dateTime || new Date().toLocaleDateString('en-IN');
    writeLine(formatRow(invStr, dateStr, 32));

    const tblStr = `Table: ${data.tableCode || 'T1'}`;
    const modeStr = `Mode: ${data.paymentMode || 'Cash'}`;
    writeLine(formatRow(tblStr, modeStr, 32));

    writeLine('--------------------------------');

    // Column header for 32 chars: ITEM(18) QTY(5) AMT(9)
    writeBytes(0x1b, 0x45, 0x01); // Bold on
    writeLine('ITEM                 QTY     AMT');
    writeBytes(0x1b, 0x45, 0x00); // Bold off
    writeLine('--------------------------------');

    // Items
    (data.items || []).forEach((item) => {
      const namePart = item.name.padEnd(18).substring(0, 18);
      const qtyPart = String(item.qty).padStart(4);
      const amtPart = item.total.toFixed(2).padStart(9);
      writeLine(`${namePart} ${qtyPart} ${amtPart}`);
    });

    writeLine('--------------------------------');

    // TOTAL in Bold: ESC E 1
    writeBytes(0x1b, 0x45, 0x01);
    writeLine(formatRow('TOTAL:', `Rs.${data.grandTotal.toFixed(2)}`, 32));
    writeBytes(0x1b, 0x45, 0x00); // Bold off

    writeLine('--------------------------------');

    // Center footer
    writeBytes(0x1b, 0x61, 0x01);
    writeLine(data.footerPrimary || 'Thank you! Visit again.');
    if (data.footerSecondary) {
      writeLine(data.footerSecondary);
    }
  }

  // Ample feed lines past the SEZNIK serrated tear teeth (minimum 8 lines)
  const extra = Math.max(8, data.extraLines ?? 8);
  for (let i = 0; i < extra; i++) {
    writeLine();
  }

  // Feed command: ESC d 4
  writeBytes(0x1b, 0x64, 0x04);

  // Combine into single Uint8Array
  const totalLength = parts.reduce((acc, p) => acc + p.length, 0);
  const combined = new Uint8Array(totalLength);
  let offset = 0;
  for (const part of parts) {
    combined.set(part, offset);
    offset += part.length;
  }

  return combined;
}

// 2. High-Fidelity Canvas-to-ESC/POS Raster Bitmap Generator
// Recreates the exact visual preview with Calligraphy Logo and Malayalam Script
export async function generateEscPosRasterBitmapFromPreview(data: ReceiptData): Promise<Uint8Array> {
  if (typeof window === 'undefined') {
    return generateEscPos58mmCommands(data);
  }

  // Width is exactly 384 pixels for 58mm printer (48 bytes per row)
  const width = 384;
  const isReport = data.reportType === 'daily_report';

  // Calculate dynamic canvas height to avoid clipping or excessive feed
  let height: number;
  if (isReport) {
    const dishesCount = Math.min(6, data.dishesSold?.length || 0);
    // Logo+Header (~120) + Title (~30) + Meta (~75) + Breakdown (~55) + Total (~40) + Dishes (~25 + count*22) + Footer (~60) + Tear margin (~160)
    height = 120 + 30 + 75 + 55 + 40 + (dishesCount > 0 ? (28 + dishesCount * 22) : 0) + 60 + 160;
  } else {
    const itemRowsCount = Math.max(1, data.items?.length || 1);
    // Header (~150) + Meta (~65) + Header (~35) + Items (~28*rows) + Total (~60) + Footer (~90) + Tear margin (~160)
    height = 150 + 65 + 35 + (itemRowsCount * 28) + 60 + 90 + 160;
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return generateEscPos58mmCommands(data);
  }

  // White Background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);

  // Black rendering for thermal printer
  ctx.fillStyle = '#000000';
  ctx.strokeStyle = '#000000';

  let currentY = 15;

  // 1. Draw Calligraphy Brand Logo (centered)
  try {
    const logoImg = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Logo load failed'));
      img.src = '/brand-calligraphy-uploaded.png';
    });

    const logoW = 160;
    const logoH = 53;
    const logoX = (width - logoW) / 2;
    ctx.drawImage(logoImg, logoX, currentY, logoW, logoH);
    currentY += logoH + 6;
  } catch (e) {
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(data.restaurantName || 'ഇത്തിപ്പൂരം', width / 2, currentY + 20);
    currentY += 30;
  }

  // Brand Name & Location
  ctx.textAlign = 'center';
  ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(data.restaurantName || 'ITHI POORAM', width / 2, currentY);
  currentY += 16;

  ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(data.restaurantLocation || 'Vanchiyoor, Trivandrum', width / 2, currentY);
  currentY += 15;

  if (!isReport) {
    ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(`Ph: ${data.phone || '+91 94470 00000'}`, width / 2, currentY);
    currentY += 15;
  }

  // Dashed Line Helper
  const drawDashedDivider = (y: number) => {
    ctx.save();
    ctx.setLineDash([5, 3]);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(12, y);
    ctx.lineTo(width - 12, y);
    ctx.stroke();
    ctx.restore();
  };

  drawDashedDivider(currentY);
  currentY += 20;

  if (isReport) {
    // ==============================================================
    // DAILY REVENUE REPORT LAYOUT (Matches on-screen preview 1:1)
    // ==============================================================
    ctx.textAlign = 'center';
    ctx.font = '900 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(data.title || 'DAILY REVENUE REPORT', width / 2, currentY);
    currentY += 22;

    // Metadata: Date, Range, Settled Checks
    ctx.font = '14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('Date:', 14, currentY);
    ctx.textAlign = 'right';
    ctx.fillText(data.dateTime || new Date().toLocaleDateString('en-IN'), width - 14, currentY);
    currentY += 20;

    ctx.textAlign = 'left';
    ctx.fillText('Range:', 14, currentY);
    ctx.textAlign = 'right';
    ctx.fillText(data.dateRangeLabel || 'Today', width - 14, currentY);
    currentY += 20;

    ctx.textAlign = 'left';
    ctx.fillText('Settled Checks:', 14, currentY);
    ctx.textAlign = 'right';
    ctx.font = 'bold 14px monospace';
    ctx.fillText(String(data.settledChecksCount ?? 0), width - 14, currentY);
    currentY += 16;

    drawDashedDivider(currentY);
    currentY += 20;

    // Revenue Breakdown
    ctx.font = '14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('Cash Revenue:', 14, currentY);
    ctx.textAlign = 'right';
    ctx.font = 'bold 14px monospace';
    ctx.fillText(`₹ ${(data.cashRevenue ?? 0).toFixed(2)}`, width - 14, currentY);
    currentY += 20;

    ctx.font = '14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('UPI / Online:', 14, currentY);
    ctx.textAlign = 'right';
    ctx.font = 'bold 14px monospace';
    ctx.fillText(`₹ ${(data.upiRevenue ?? 0).toFixed(2)}`, width - 14, currentY);
    currentY += 16;

    drawDashedDivider(currentY);
    currentY += 22;

    // TOTAL SALES
    ctx.textAlign = 'left';
    ctx.font = '900 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('TOTAL SALES:', 14, currentY);
    ctx.textAlign = 'right';
    ctx.font = '900 17px monospace';
    ctx.fillText(`₹ ${data.grandTotal.toFixed(2)}`, width - 14, currentY);
    currentY += 16;

    // Recent Dishes Sold
    if (data.dishesSold && data.dishesSold.length > 0) {
      drawDashedDivider(currentY);
      currentY += 20;

      ctx.textAlign = 'left';
      ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('Dishes Sold:', 14, currentY);
      currentY += 20;

      ctx.font = '13px monospace';
      data.dishesSold.slice(0, 6).forEach((dish) => {
        ctx.textAlign = 'left';
        const dName = dish.name.length > 18 ? dish.name.substring(0, 18) + '..' : dish.name;
        ctx.fillText(dName, 14, currentY);
        ctx.textAlign = 'right';
        ctx.fillText(`₹ ${dish.amount.toFixed(2)}`, width - 14, currentY);
        currentY += 20;
      });
      currentY -= 4;
    }

    drawDashedDivider(currentY);
    currentY += 24;

    // Malayalam Report Footer
    ctx.textAlign = 'center';
    ctx.font = 'bold 16px "Gayathri", "Manjari", "Noto Sans Malayalam", "Malayalam Sangam MN", sans-serif';
    ctx.fillText(data.footerPrimary || 'ഇത്തിപ്പൂരം റിപ്പോർട്ട്', width / 2, currentY);
    currentY += 18;

    ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(data.footerSecondary || 'Generated at Vanchiyoor POS Terminal', width / 2, currentY);
    currentY += 20;

  } else {
    // ==============================================================
    // STANDARD CUSTOMER BILL LAYOUT (Matches on-screen preview 1:1)
    // ==============================================================
    ctx.textAlign = 'center';
    ctx.font = '900 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(data.title || 'BILL OF SUPPLY', width / 2, currentY);
    currentY += 22;

    // Metadata (Inv, Date, Table, Mode)
    ctx.font = '14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`Inv: ${data.invoiceNumber || '1001'}`, 14, currentY);
    ctx.textAlign = 'right';
    ctx.fillText(data.dateTime || new Date().toLocaleDateString('en-IN'), width - 14, currentY);
    currentY += 18;

    ctx.textAlign = 'left';
    ctx.fillText(`Table: ${data.tableCode || 'T1'}`, 14, currentY);
    ctx.textAlign = 'right';
    ctx.fillText(`Mode: ${data.paymentMode || 'Cash'}`, width - 14, currentY);
    currentY += 14;

    drawDashedDivider(currentY);
    currentY += 22;

    // Columns Header: ITEM, QTY, AMT
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('ITEM', 14, currentY);
    ctx.textAlign = 'right';
    ctx.fillText('QTY', 285, currentY);
    ctx.fillText('AMT', width - 14, currentY);
    currentY += 20;

    // Items
    ctx.font = '14px monospace';
    (data.items || []).forEach((item) => {
      ctx.textAlign = 'left';
      const cleanName = item.name.length > 18 ? item.name.substring(0, 18) + '..' : item.name;
      ctx.fillText(cleanName, 14, currentY);

      ctx.textAlign = 'right';
      ctx.fillText(String(item.qty), 285, currentY);
      ctx.fillText(item.total.toFixed(2), width - 14, currentY);
      currentY += 24;
    });

    drawDashedDivider(currentY);
    currentY += 25;

    // TOTAL
    ctx.font = '900 20px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('TOTAL:', 14, currentY);
    ctx.textAlign = 'right';
    ctx.fillText(`Rs.${data.grandTotal.toFixed(2)}`, width - 14, currentY);
    currentY += 18;

    drawDashedDivider(currentY);
    currentY += 26;

    // Malayalam Customer Greeting Footer: നന്ദി, വീണ്ടും വരിക
    ctx.textAlign = 'center';
    ctx.font = 'bold 17px "Gayathri", "Manjari", "Noto Sans Malayalam", "Malayalam Sangam MN", sans-serif';
    ctx.fillText(data.footerPrimary || 'നന്ദി, വീണ്ടും വരിക', width / 2, currentY);
    currentY += 18;

    ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(data.footerSecondary || 'Thank you! Visit again.', width / 2, currentY);
    currentY += 20;
  }

  // The rest of the canvas up to `height` provides the ~140-160px white margin so
  // the paper feeds completely past the SEZNIK lid tear bar before cutting!

  // Convert canvas pixel data to ESC/POS Raster Bit Image (GS v 0)
  const imageData = ctx.getImageData(0, 0, width, height);
  const pixels = imageData.data;
  const rowBytes = width / 8; // 384 / 8 = 48 bytes per row

  // Slice into bands of 64 dots height to prevent Bluetooth buffer overflow
  const bandHeight = 64;
  const totalBands = Math.ceil(height / bandHeight);
  const resultCommands: Uint8Array[] = [];

  // Initialize printer: ESC @
  resultCommands.push(new Uint8Array([0x1b, 0x40]));

  for (let b = 0; b < totalBands; b++) {
    const startY = b * bandHeight;
    const currentBandH = Math.min(bandHeight, height - startY);
    const bandBytes = new Uint8Array(rowBytes * currentBandH);

    for (let y = 0; y < currentBandH; y++) {
      const srcY = startY + y;
      for (let xByte = 0; xByte < rowBytes; xByte++) {
        let byteVal = 0;
        for (let bit = 0; bit < 8; bit++) {
          const srcX = xByte * 8 + bit;
          const pixelIndex = (srcY * width + srcX) * 4;
          const r = pixels[pixelIndex];
          const g = pixels[pixelIndex + 1];
          const b = pixels[pixelIndex + 2];
          const a = pixels[pixelIndex + 3];

          // Threshold: if pixel is dark and not transparent, set thermal dot to 1 (black)
          const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
          if (a > 128 && luminance < 170) {
            byteVal |= (1 << (7 - bit));
          }
        }
        bandBytes[y * rowBytes + xByte] = byteVal;
      }
    }

    // GS v 0 0 xL xH yL yH
    const xL = rowBytes & 0xff; // 48
    const xH = (rowBytes >> 8) & 0xff; // 0
    const yL = currentBandH & 0xff;
    const yH = (currentBandH >> 8) & 0xff;

    const header = new Uint8Array([0x1d, 0x76, 0x30, 0x00, xL, xH, yL, yH]);
    resultCommands.push(header);
    resultCommands.push(bandBytes);
  }

  // Extra line feed commands at the end to guarantee full clearance
  // ESC d 6 (feed 6 lines)
  resultCommands.push(new Uint8Array([0x1b, 0x64, 0x06]));
  resultCommands.push(new TextEncoder().encode('\n\n\n\n\n\n'));

  // Merge into single Uint8Array
  const totalLength = resultCommands.reduce((acc, p) => acc + p.length, 0);
  const finalBinary = new Uint8Array(totalLength);
  let offset = 0;
  for (const part of resultCommands) {
    finalBinary.set(part, offset);
    offset += part.length;
  }

  return finalBinary;
}

// 3. Print directly via Web Bluetooth API (Connects seamlessly to Seznik Bluetooth)
export async function printDirectToBluetoothThermalPrinter(
  data: ReceiptData,
  mode: 'bitmap' | 'text' = 'bitmap'
): Promise<boolean> {
  if (typeof window === 'undefined' || !(navigator as any).bluetooth) {
    throw new Error('Web Bluetooth is not supported in this browser. Please use Google Chrome or Edge.');
  }

  try {
    // Request Bluetooth Device with Serial Port Profile / Thermal Printer Service
    const device = await (navigator as any).bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: [
        '000018f0-0000-1000-8000-00805f9b34fb', // Standard POS Printer Service
        'e7810a71-73ae-499d-8c15-faa9aef0c3f2', // Mini POS thermal service
        '49535343-fe7d-4ae5-8fa9-9fafd205e455', // ISSC transparent UART
        '0000e0ff-0000-1000-8000-00805f9b34fb',
      ],
    });

    const server = await device.gatt.connect();

    // Look for writable characteristic
    let targetChar: any = null;
    const services = await server.getPrimaryServices();

    for (const service of services) {
      const chars = await service.getCharacteristics();
      for (const char of chars) {
        if (char.properties.write || char.properties.writeWithoutResponse) {
          targetChar = char;
          break;
        }
      }
      if (targetChar) break;
    }

    if (!targetChar) {
      throw new Error('No writable printer service found on this Bluetooth device.');
    }

    // Generate binary commands:
    // If bitmap mode, generates exact replica of visual preview with calligraphy and Malayalam.
    // If bitmap generation fails or text mode chosen, falls back cleanly.
    let binary: Uint8Array;
    if (mode === 'bitmap') {
      try {
        binary = await generateEscPosRasterBitmapFromPreview(data);
      } catch (err) {
        console.warn('Bitmap raster render failed, falling back to clean text ESC/POS:', err);
        binary = generateEscPos58mmCommands(data);
      }
    } else {
      binary = generateEscPos58mmCommands(data);
    }

    // Send in chunks of 100 bytes (standard BLE MTU) with pacing
    const chunkSize = 100;
    for (let i = 0; i < binary.length; i += chunkSize) {
      const chunk = binary.slice(i, i + chunkSize);
      if (targetChar.writeValueWithoutResponse) {
        await targetChar.writeValueWithoutResponse(chunk);
      } else {
        await targetChar.writeValue(chunk);
      }
      // Small delay to allow low-speed BLE thermal printer buffer to process
      await new Promise((r) => setTimeout(r, 25));
    }

    return true;
  } catch (err: any) {
    console.error('Bluetooth printer error:', err);
    throw err;
  }
}
