import { toZonedTime, format } from 'date-fns-tz';
import { subDays } from 'date-fns';
import { CONFIG } from '../config';

/**
 * Returns the current date/time converted to Asia/Kolkata timezone
 */
export function getKolkataTime(date = new Date()): Date {
  return toZonedTime(date, CONFIG.TIMEZONE);
}

/**
 * Returns formatted string in Asia/Kolkata timezone
 * e.g., "14 Oct 2026, 01:45 PM"
 */
export function formatKolkataDateTime(date = new Date(), pattern = 'dd MMM yyyy, hh:mm a'): string {
  const zoned = getKolkataTime(date);
  return format(zoned, pattern, { timeZone: CONFIG.TIMEZONE });
}

/**
 * Computes the operational business date (YYYY-MM-DD).
 * For a restaurant open past midnight (e.g. up to 2-3 AM), any order placed
 * before the cutoff hour (default 03:00) belongs to the previous calendar day's business shift.
 */
export function getBusinessDate(date = new Date(), cutoffHour = CONFIG.BUSINESS_DAY_CUTOFF_HOUR): string {
  const kolkata = getKolkataTime(date);
  const hour = kolkata.getHours();
  
  const targetDate = hour < cutoffHour ? subDays(kolkata, 1) : kolkata;
  return format(targetDate, 'yyyy-MM-dd', { timeZone: CONFIG.TIMEZONE });
}

/**
 * Formats table sequence code: TQ1-05
 */
export function formatCustomerOrderCode(tableCode: string, sequenceNumber: number): string {
  const seqStr = sequenceNumber.toString().padStart(2, '0');
  return `${tableCode}-${seqStr}`;
}

/**
 * Formats internal immutable order code: LS-YYYYMMDD-TQ1-005
 */
export function formatInternalOrderId(businessDate: string, tableCode: string, sequenceNumber: number): string {
  const cleanDate = businessDate.replace(/-/g, '');
  const seqStr = sequenceNumber.toString().padStart(3, '0');
  return `LS-${cleanDate}-${tableCode}-${seqStr}`;
}

/**
 * Formats invoice code: INV-YYYYMMDD-0001
 */
export function formatInvoiceNumber(businessDate: string, invoiceSequence: number): string {
  const cleanDate = businessDate.replace(/-/g, '');
  const seqStr = invoiceSequence.toString().padStart(4, '0');
  return `INV-${cleanDate}-${seqStr}`;
}
