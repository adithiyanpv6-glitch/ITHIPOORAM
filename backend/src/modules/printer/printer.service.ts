import { CONFIG } from '../../config';
import { formatINR } from '../../utils/currency';
import { formatKolkataDateTime } from '../../utils/date';

export interface PrintableReceiptData {
  invoiceNumber: string;
  orderCode: string;
  tableCode: string;
  cashierName: string;
  createdAt: Date;
  subtotalPaise: number;
  discountPaise: number;
  cgstPaise: number;
  sgstPaise: number;
  grandTotalPaise: number;
  paymentMode: string;
  referenceNumber?: string | null;
  items: Array<{
    name: string;
    quantity: number;
    unitPricePaise: number;
    lineTotalPaise: number;
  }>;
  isReprint?: boolean;
  reprintCount?: number;
}

export class PrinterService {
  /**
   * Generates formatted text layout suitable for 80mm thermal receipt printers (48 characters wide)
   */
  static generateThermalReceiptText(data: PrintableReceiptData): string {
    const W = 48; // Standard 80mm width in characters
    const center = (text: string) => {
      const pad = Math.max(0, Math.floor((W - text.length) / 2));
      return ' '.repeat(pad) + text;
    };
    const row = (left: string, right: string) => {
      const space = Math.max(1, W - left.length - right.length);
      return left + ' '.repeat(space) + right;
    };
    const line = '-'.repeat(W);
    const dblLine = '='.repeat(W);

    const lines: string[] = [];

    // Header
    lines.push(center(CONFIG.RESTAURANT.MALAYALAM_NAME));
    lines.push(center(CONFIG.RESTAURANT.NAME.toUpperCase()));
    lines.push(center(CONFIG.RESTAURANT.TAGLINE));
    lines.push(center(CONFIG.RESTAURANT.LOCATION));
    lines.push(center(`Ph: ${CONFIG.RESTAURANT.PHONE}`));
    lines.push(center(`GSTIN: ${CONFIG.RESTAURANT.GSTIN} | FSSAI: ${CONFIG.RESTAURANT.FSSAI}`));
    lines.push(dblLine);

    if (data.isReprint) {
      lines.push(center(`*** DUPLICATE REPRINT #${data.reprintCount || 1} ***`));
      lines.push(line);
    } else {
      lines.push(center('TAX INVOICE'));
      lines.push(line);
    }

    lines.push(row(`Invoice: ${data.invoiceNumber}`, `Table: ${data.tableCode}`));
    lines.push(row(`Order Ref: ${data.orderCode}`, `Date: ${formatKolkataDateTime(data.createdAt, 'dd/MM/yyyy')}`));
    lines.push(row(`Cashier: ${data.cashierName}`, `Time: ${formatKolkataDateTime(data.createdAt, 'hh:mm a')}`));
    lines.push(line);

    // Table Header
    lines.push(row('ITEM [QTY x RATE]', 'TOTAL (INR)'));
    lines.push(line);

    // Items
    for (const item of data.items) {
      const itemDesc = `${item.name}`;
      const qtyPrice = `  ${item.quantity} x ${formatINR(item.unitPricePaise)}`;
      const totalStr = formatINR(item.lineTotalPaise);
      lines.push(itemDesc);
      lines.push(row(qtyPrice, totalStr));
    }

    lines.push(line);

    // Totals
    lines.push(row('Subtotal:', formatINR(data.subtotalPaise)));
    if (data.discountPaise > 0) {
      lines.push(row('Discount:', `-${formatINR(data.discountPaise)}`));
    }
    lines.push(row(`CGST (${CONFIG.TAX.CGST_PERCENT}%):`, formatINR(data.cgstPaise)));
    lines.push(row(`SGST (${CONFIG.TAX.SGST_PERCENT}%):`, formatINR(data.sgstPaise)));
    lines.push(dblLine);
    lines.push(row('NET PAYABLE:', formatINR(data.grandTotalPaise)));
    lines.push(dblLine);

    // Payment Info
    lines.push(row('Payment Mode:', data.paymentMode));
    if (data.referenceNumber) {
      lines.push(row('Txn Ref No:', data.referenceNumber));
    }
    lines.push(line);

    // Footer
    lines.push(center('Thank you for dining with us!'));
    lines.push(center('ഇത്തിപ്പൂരം വീണ്ടും സന്ദർശിക്കുക'));
    lines.push(center('Fresh Seafood & Kerala Lunches Every Day'));
    lines.push('\n\n\n'); // Feed lines for paper cut

    return lines.join('\n');
  }
}
