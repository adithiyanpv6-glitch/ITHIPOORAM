// ============================================================================
// ITHI POORAM (ഇത്തിപ്പൂരം) — GOOGLE WORKSPACE & GOOGLE SHEETS CONFIGURATION
// Admin: adithiyanpv6@gmail.com
// Linked Spreadsheet: https://docs.google.com/spreadsheets/d/1N2WrgkPmo_pdgatDp5aohdVcUTEp-rJ48yqOdMocibI/edit
// ============================================================================

export const GOOGLE_WORKSPACE_CONFIG = {
  adminEmail: 'adithiyanpv6@gmail.com',
  spreadsheetId: '1N2WrgkPmo_pdgatDp5aohdVcUTEp-rJ48yqOdMocibI',
  spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/1N2WrgkPmo_pdgatDp5aohdVcUTEp-rJ48yqOdMocibI/edit',
  restaurantName: 'ITHI POORAM (ഇത്തിപ്പൂരം)',
  restaurantLocation: 'Vanchiyoor, Trivandrum',
  sheets: {
    staff: 'Staff Database',
    sessions: 'Staff Session Database',
    tables: 'Table Orders Database',
  },
  webhookUrl: process.env.GOOGLE_WORKSPACE_WEBHOOK_URL || '',
};
