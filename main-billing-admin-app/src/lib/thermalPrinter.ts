// Utilities for 58mm (2-inch / 32 column) and 80mm ESC/POS Thermal Printers
// Compatible with SEZNIK 58mm Bluetooth & USB Mini Thermal Receipt Printers

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

// Generate Raw ESC/POS Binary Commands for 58mm printer
export function generateEscPos58mmCommands(data: ReceiptData): Uint8Array {
  const encoder = new TextEncoder();
  const parts: Uint8Array[] = [];

  const writeBytes = (...bytes: number[]) => {
    parts.push(new Uint8Array(bytes));
  };

  const writeText = (str: string) => {
    parts.push(encoder.encode(str));
  };

  const writeLine = (str: string = '') => {
    parts.push(encoder.encode(str + '\n'));
  };

  // 1. Initialize printer: ESC @
  writeBytes(0x1b, 0x40);

  // 2. Set align center: ESC a 1
  writeBytes(0x1b, 0x61, 0x01);

  // 3. Double height & double width for Header: GS ! 0x11
  writeBytes(0x1d, 0x21, 0x11);
  writeLine(data.restaurantName || 'ITHI POORAM');

  // Cancel double mode: GS ! 0x00
  writeBytes(0x1d, 0x21, 0x00);
  writeLine(data.restaurantLocation || 'Vanchiyoor, Trivandrum');
  if (data.phone) {
    writeLine(`Ph: ${data.phone}`);
  }

  // 4. Horizontal line (32 chars for 58mm)
  writeLine('--------------------------------');

  // Align left: ESC a 0
  writeBytes(0x1b, 0x61, 0x00);
  writeLine(`Inv: ${data.invoiceNumber || 'INV-001'}`);
  writeLine(`Table: ${data.tableCode || 'T1'}   Order: ${data.orderCode || '#1'}`);
  writeLine(`Date: ${data.dateTime || new Date().toLocaleDateString('en-IN')}`);
  writeLine('--------------------------------');

  // Column header for 32 chars: Item(16) Qty(4) Price(5) Total(7)
  writeLine('ITEM             QTY  RATE TOTAL');
  writeLine('--------------------------------');

  // Items
  data.items.forEach((item) => {
    const namePart = item.name.padEnd(16).substring(0, 16);
    const qtyPart = String(item.qty).padStart(3);
    const ratePart = String(Math.round(item.price)).padStart(5);
    const totalPart = String(Math.round(item.total)).padStart(6);
    writeLine(`${namePart} ${qtyPart} ${ratePart} ${totalPart}`);
  });

  writeLine('--------------------------------');

  // Grand Total in Bold: ESC E 1
  writeBytes(0x1b, 0x45, 0x01);
  const totalLabel = 'GRAND TOTAL:';
  const totalVal = `Rs.${data.grandTotal.toFixed(2)}`;
  const spaces = Math.max(1, 32 - totalLabel.length - totalVal.length);
  writeLine(`${totalLabel}${' '.repeat(spaces)}${totalVal}`);
  writeBytes(0x1b, 0x45, 0x00); // Bold off

  writeLine(`Payment: ${data.paymentMode || 'Cash'}`);
  writeLine('--------------------------------');

  // Center footer
  writeBytes(0x1b, 0x61, 0x01);
  writeLine('Thank You! Visit Again');

  // Extra line feeds
  const extra = Math.max(2, data.extraLines ?? 2);
  for (let i = 0; i < extra; i++) {
    writeLine();
  }

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

// Print directly via Web Bluetooth API (Connects seamlessly to Seznik Bluetooth)
export async function printDirectToBluetoothThermalPrinter(data: ReceiptData): Promise<boolean> {
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

    // Generate binary ESC/POS
    const binary = generateEscPos58mmCommands(data);

    // Send in chunks of 100 bytes (standard BLE MTU)
    const chunkSize = 100;
    for (let i = 0; i < binary.length; i += chunkSize) {
      const chunk = binary.slice(i, i + chunkSize);
      if (targetChar.writeValueWithoutResponse) {
        await targetChar.writeValueWithoutResponse(chunk);
      } else {
        await targetChar.writeValue(chunk);
      }
    }

    return true;
  } catch (err: any) {
    console.error('Bluetooth printer error:', err);
    throw err;
  }
}
