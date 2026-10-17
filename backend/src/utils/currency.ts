import { CONFIG } from '../config';

/**
 * Format paise to INR display string e.g. "₹240.00"
 */
export function formatINR(paise: number): string {
  const rupees = paise / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(rupees);
}

/**
 * Calculates 5% restaurant GST (2.5% CGST + 2.5% SGST)
 */
export function calculateTaxes(subtotalPaise: number, discountPaise = 0) {
  const taxableAmountPaise = Math.max(0, subtotalPaise - discountPaise);
  
  // 2.5% CGST rounded
  const cgstPaise = Math.round((taxableAmountPaise * CONFIG.TAX.CGST_PERCENT) / 100);
  // 2.5% SGST rounded
  const sgstPaise = Math.round((taxableAmountPaise * CONFIG.TAX.SGST_PERCENT) / 100);
  const totalTaxPaise = cgstPaise + sgstPaise;
  const grandTotalPaise = taxableAmountPaise + totalTaxPaise;

  return {
    subtotalPaise,
    discountPaise,
    taxableAmountPaise,
    cgstPaise,
    sgstPaise,
    totalTaxPaise,
    grandTotalPaise,
    taxBreakup: {
      cgstPercent: CONFIG.TAX.CGST_PERCENT,
      cgstPaise,
      sgstPercent: CONFIG.TAX.SGST_PERCENT,
      sgstPaise,
      totalPercent: CONFIG.TAX.TOTAL_PERCENT,
      totalTaxPaise,
    },
  };
}
