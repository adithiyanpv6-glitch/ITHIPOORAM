// Utilities for 58mm (2-inch / 32 column) and 80mm ESC/POS Thermal Printers
// Specifically tuned for SEZNIK 58mm Bluetooth & USB Mini Thermal Receipt Printers

export interface ReceiptItem {
  name: string;
  qty: number;
  price: number;
  total: number;
}

export interface ReceiptData {
  restaurantName?: string;
  restaurantLocation?: string;
  phone?: string;
  invoiceNumber?: string;
  orderCode?: string;
  tableCode?: string;
  dateTime?: string;
  items: ReceiptItem[];
  subtotal?: number;
  grandTotal: number;
  paymentMode?: string;
  extraLines?: number;
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
  writeLine(`Ph: ${data.phone || '+91 94470 00000'}`);

  // Dashed line (32 chars)
  writeLine('--------------------------------');

  // Bold "BILL OF SUPPLY"
  writeBytes(0x1b, 0x45, 0x01); // Bold on
  writeLine('BILL OF SUPPLY');
  writeBytes(0x1b, 0x45, 0x00); // Bold off

  // Metadata: Inv & Date, Table & Mode (32 chars per line)
  const invStr = `Inv: ${data.invoiceNumber || '1001'}`;
  const dateStr = data.dateTime || new Date().toLocaleDateString('en-IN');
  const sp1 = Math.max(1, 32 - invStr.length - dateStr.length);
  writeLine(`${invStr}${' '.repeat(sp1)}${dateStr}`);

  const tblStr = `Table: ${data.tableCode || 'T1'}`;
  const modeStr = `Mode: ${data.paymentMode || 'Cash'}`;
  const sp2 = Math.max(1, 32 - tblStr.length - modeStr.length);
  writeLine(`${tblStr}${' '.repeat(sp2)}${modeStr}`);

  writeLine('--------------------------------');

  // Column header for 32 chars: ITEM(18) QTY(5) AMT(9)
  writeBytes(0x1b, 0x45, 0x01); // Bold on
  writeLine('ITEM                 QTY     AMT');
  writeBytes(0x1b, 0x45, 0x00); // Bold off
  writeLine('--------------------------------');

  // Items
  data.items.forEach((item) => {
    const namePart = item.name.padEnd(18).substring(0, 18);
    const qtyPart = String(item.qty).padStart(4);
    const amtPart = item.total.toFixed(2).padStart(9);
    writeLine(`${namePart} ${qtyPart} ${amtPart}`);
  });

  writeLine('--------------------------------');

  // TOTAL in Bold: ESC E 1
  writeBytes(0x1b, 0x45, 0x01);
  const totalLabel = 'TOTAL:';
  const totalVal = `Rs.${data.grandTotal.toFixed(2)}`;
  const spTotal = Math.max(1, 32 - totalLabel.length - totalVal.length);
  writeLine(`${totalLabel}${' '.repeat(spTotal)}${totalVal}`);
  writeBytes(0x1b, 0x45, 0x00); // Bold off

  writeLine('--------------------------------');

  // Center footer
  writeBytes(0x1b, 0x61, 0x01);
  writeLine('Thank you! Visit again.');

  // Ample feed lines past the SEZNIK serrated tear teeth (minimum 7 lines)
  const extra = Math.max(7, data.extraLines ?? 7);
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

  // Calculate dynamic canvas height
  // Header: ~130px, Meta: ~60px, Items: ~30px per item, Total: ~55px, Footer: ~90px, Tear Margin: ~160px
  const itemRowsCount = Math.max(1, data.items.length);
  const height = 150 + 65 + 35 + (itemRowsCount * 28) + 60 + 90 + 160;

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

    // Draw logo centered (width ~160px, aspect ratio 3:1 -> height ~53px)
    const logoW = 160;
    const logoH = 53;
    const logoX = (width - logoW) / 2;
    ctx.drawImage(logoImg, logoX, currentY, logoW, logoH);
    currentY += logoH + 8;
  } catch (e) {
    // Fallback brand text if image not reachable
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(data.restaurantName || 'ഇത്തിപ്പൂരം', width / 2, currentY + 20);
    currentY += 30;
  }

  // Location & Phone
  ctx.textAlign = 'center';
  ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(data.restaurantLocation || 'Vanchiyoor, Trivandrum', width / 2, currentY);
  currentY += 18;

  ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(`Ph: ${data.phone || '+91 94470 00000'}`, width / 2, currentY);
  currentY += 14;

  // Dashed Line Helper
  const drawDashedDivider = (y: number) => {
    ctx.save();
    ctx.setLineDash([5, 3]);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(10, y);
    ctx.lineTo(width - 10, y);
    ctx.stroke();
    ctx.restore();
  };

  drawDashedDivider(currentY);
  currentY += 20;

  // BILL OF SUPPLY
  ctx.textAlign = 'center';
  ctx.font = '900 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('BILL OF SUPPLY', width / 2, currentY);
  currentY += 22;

  // Metadata (Inv, Date, Table, Mode)
  ctx.font = '14px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`Inv: ${data.invoiceNumber || '1001'}`, 12, currentY);
  ctx.textAlign = 'right';
  ctx.fillText(data.dateTime || new Date().toLocaleDateString('en-IN'), width - 12, currentY);
  currentY += 18;

  ctx.textAlign = 'left';
  ctx.fillText(`Table: ${data.tableCode || 'T1'}`, 12, currentY);
  ctx.textAlign = 'right';
  ctx.fillText(`Mode: ${data.paymentMode || 'Cash'}`, width - 12, currentY);
  currentY += 14;

  drawDashedDivider(currentY);
  currentY += 22;

  // Columns Header: ITEM, QTY, AMT
  ctx.font = 'bold 14px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('ITEM', 12, currentY);
  ctx.textAlign = 'right';
  ctx.fillText('QTY', 290, currentY);
  ctx.fillText('AMT', width - 12, currentY);
  currentY += 20;

  // Items
  ctx.font = '14px monospace';
  data.items.forEach((item) => {
    ctx.textAlign = 'left';
    const cleanName = item.name.length > 18 ? item.name.substring(0, 18) + '..' : item.name;
    ctx.fillText(cleanName, 12, currentY);

    ctx.textAlign = 'right';
    ctx.fillText(String(item.qty), 290, currentY);
    ctx.fillText(item.total.toFixed(2), width - 12, currentY);
    currentY += 24;
  });

  drawDashedDivider(currentY);
  currentY += 25;

  // TOTAL
  ctx.font = '900 20px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('TOTAL:', 12, currentY);
  ctx.textAlign = 'right';
  ctx.fillText(`Rs.${data.grandTotal.toFixed(2)}`, width - 12, currentY);
  currentY += 18;

  drawDashedDivider(currentY);
  currentY += 26;

  // Malayalam Footer: നന്ദി, വീണ്ടും വരിക
  ctx.textAlign = 'center';
  ctx.font = 'bold 17px "Gayathri", "Manjari", "Noto Sans Malayalam", sans-serif';
  ctx.fillText('നന്ദി, വീണ്ടും വരിക', width / 2, currentY);
  currentY += 18;

  ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('Thank you! Visit again.', width / 2, currentY);
  currentY += 20;

  // The rest of the canvas up to `height` provides the ~140px white margin so
  // the bill feeds completely past the SEZNIK lid tear bar before cutting!

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
