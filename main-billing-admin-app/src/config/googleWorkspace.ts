// ============================================================================
// ITHI POORAM (ഇത്തിപ്പൂരം) — GOOGLE WORKSPACE & GOOGLE SHEETS CONFIGURATION
// Admin: adithiyanpv6@gmail.com
// All databases live directly on Google Workspace under the Admin's Google account.
// Changes update continuously in real-time on the same Google Sheet.
// ============================================================================

export const GOOGLE_WORKSPACE_CONFIG = {
  adminEmail: 'adithiyanpv6@gmail.com',
  restaurantName: 'ITHI POORAM (ഇത്തിപ്പൂരം)',
  restaurantLocation: 'Vanchiyoor, Trivandrum',
  spreadsheetTitle: 'ITHI POORAM — Central Restaurant Live Database',
  sheets: {
    staff: 'Staff Register',
    sessions: 'Live Login Sessions',
    activityLogs: 'Activity Logs',
    tables: 'Master Table Registry',
    orders: 'Live Table Orders',
  },
  // Optional Google Apps Script Webhook URL for instant push updates
  webhookUrl: process.env.GOOGLE_WORKSPACE_WEBHOOK_URL || '',
};
