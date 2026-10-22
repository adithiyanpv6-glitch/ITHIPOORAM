// ============================================================================
// ITHI POORAM (ഇത്തിപ്പൂരം) — GOOGLE WORKSPACE LIVE DATABASE ENGINE
// Admin: adithiyanpv6@gmail.com
// Continuously synchronizes Staff, Sessions, and Table Orders directly into
// Google Sheets / Google Workspace without creating multiple files.
// ============================================================================

import { db, refreshTableSummaries } from './serverDb';
import { GOOGLE_WORKSPACE_CONFIG } from '@/config/googleWorkspace';

function escapeCsvCell(val: any): string {
  if (val === undefined || val === null) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * 1. Sheet: Staff Register (CSV format for Google Sheets)
 */
export function getStaffRegisterCsv(): string {
  const staff = db.staffUsers || [];
  const header = ['#', 'Staff ID', 'Employee Name', 'Access PIN / Password', 'Role', 'Registration Date & Time'];
  const rows = [header.map(escapeCsvCell).join(',')];

  if (staff.length === 0) {
    rows.push(['-', 'No staff registered yet', 'Fresh database ready', '-', '-', '-'].map(escapeCsvCell).join(','));
  } else {
    staff.forEach((stf, idx) => {
      rows.push([
        idx + 1,
        stf.id,
        stf.fullName,
        stf.pin,
        stf.role,
        stf.registeredAt || 'Today',
      ].map(escapeCsvCell).join(','));
    });
  }

  return rows.join('\r\n');
}

/**
 * 2. Sheet: Live Login Sessions (CSV format for Google Sheets)
 */
export function getLoginSessionsCsv(): string {
  const sessions = db.loginSessions || [];
  const header = ['#', 'Session ID', 'Staff ID', 'Employee Name', 'Role', 'Login Date & Time', 'Session Status', 'Last Active Time'];
  const rows = [header.map(escapeCsvCell).join(',')];

  if (sessions.length === 0) {
    rows.push(['-', 'No active sessions recorded yet', '-', '-', '-', '-', 'CLEAN', '-'].map(escapeCsvCell).join(','));
  } else {
    sessions.forEach((ses, idx) => {
      rows.push([
        idx + 1,
        ses.sessionId,
        ses.staffId,
        ses.fullName,
        ses.role,
        `${ses.loginDate} ${ses.loginTime}`,
        ses.status === 'ACTIVE' ? 'ACTIVE (Online)' : 'LOGGED OUT',
        ses.lastActive || ses.loginTime,
      ].map(escapeCsvCell).join(','));
    });
  }

  return rows.join('\r\n');
}

/**
 * 3. Sheet: Activity Logs (CSV format for Google Sheets)
 */
export function getActivityLogsCsv(): string {
  const logs = db.staffActivityLogs || [];
  const staff = db.staffUsers || [];
  const header = ['#', 'Log ID', 'Date & Time', 'Action / Event', 'Staff ID', 'Employee Name', 'Role', 'Status'];
  const rows = [header.map(escapeCsvCell).join(',')];

  if (logs.length === 0) {
    rows.push(['-', 'No activity recorded yet', '-', '-', '-', '-', '-', '-'].map(escapeCsvCell).join(','));
  } else {
    logs.forEach((log, idx) => {
      const matched = staff.find((s) => s.fullName === log.fullNameSnapshot || s.username === log.usernameSnapshot);
      rows.push([
        idx + 1,
        log.id,
        log.timestamp,
        log.actionType,
        matched ? matched.id : '-',
        log.fullNameSnapshot,
        log.roleSnapshot,
        log.success ? 'SUCCESS' : 'FAILED',
      ].map(escapeCsvCell).join(','));
    });
  }

  return rows.join('\r\n');
}

/**
 * 4. Sheet: Master Table Registry (CSV format for Google Sheets)
 */
export function getTablesCsv(): string {
  refreshTableSummaries();
  const tables = db.tables || [];
  const header = ['#', 'Table Code', 'Display Name', 'Room / Section', 'Capacity (Seats)', 'Unpaid Orders', 'Unpaid Amount (INR)', 'Status'];
  const rows = [header.map(escapeCsvCell).join(',')];

  if (tables.length === 0) {
    rows.push(['-', 'No tables added yet', 'Fresh database ready', '-', '-', '0', '0.00', 'AVAILABLE'].map(escapeCsvCell).join(','));
  } else {
    tables.forEach((t, idx) => {
      rows.push([
        idx + 1,
        t.tableCode,
        t.displayName,
        (t as any).roomName || 'Dining Area',
        t.capacity || 4,
        t.unpaidCount || 0,
        ((t.unpaidTotalPaise || 0) / 100).toFixed(2),
        t.status || 'AVAILABLE',
      ].map(escapeCsvCell).join(','));
    });
  }

  return rows.join('\r\n');
}

/**
 * 5. Sheet: Live Table Orders (CSV format for Google Sheets)
 */
export function getOrdersCsv(): string {
  const orders = db.orders || [];
  const header = ['Order ID', 'Table Code', 'Table Name', 'Time', 'Items Summary', 'Total Amount (INR)', 'Kitchen Status', 'Payment Status'];
  const rows = [header.map(escapeCsvCell).join(',')];

  if (orders.length === 0) {
    rows.push(['-', 'No customer orders placed yet', 'Fresh database ready', '-', '-', '0.00', '-', '-'].map(escapeCsvCell).join(','));
  } else {
    orders.forEach((o) => {
      const itemsSummary = (o.items || []).map((it) => `${it.quantity}x ${it.itemName}`).join('; ');
      rows.push([
        o.customerCode || o.id,
        o.tableCode,
        o.tableName,
        o.createdAt ? new Date(o.createdAt).toLocaleTimeString('en-IN') : 'Recent',
        itemsSummary,
        ((o.grandTotalPaise || 0) / 100).toFixed(2),
        o.fulfillmentStatus,
        o.paymentStatus,
      ].map(escapeCsvCell).join(','));
    });
  }

  return rows.join('\r\n');
}

/**
 * Full JSON snapshot of all databases for live Google Sheets push
 */
export function getFullGoogleWorkspacePayload() {
  refreshTableSummaries();
  return {
    adminEmail: GOOGLE_WORKSPACE_CONFIG.adminEmail,
    restaurant: GOOGLE_WORKSPACE_CONFIG.restaurantName,
    location: GOOGLE_WORKSPACE_CONFIG.restaurantLocation,
    updatedAt: new Date().toISOString(),
    staff: (db.staffUsers || []).map((s, idx) => ({
      index: idx + 1,
      staffId: s.id,
      name: s.fullName,
      pin: s.pin,
      role: s.role,
      registeredAt: s.registeredAt || 'Today',
    })),
    sessions: (db.loginSessions || []).map((ses, idx) => ({
      index: idx + 1,
      sessionId: ses.sessionId,
      staffId: ses.staffId,
      name: ses.fullName,
      role: ses.role,
      loginDateTime: `${ses.loginDate} ${ses.loginTime}`,
      status: ses.status,
      lastActive: ses.lastActive || ses.loginTime,
    })),
    activityLogs: (db.staffActivityLogs || []).map((log, idx) => {
      const matched = (db.staffUsers || []).find((s) => s.fullName === log.fullNameSnapshot || s.username === log.usernameSnapshot);
      return {
        index: idx + 1,
        logId: log.id,
        timestamp: log.timestamp,
        action: log.actionType,
        staffId: matched ? matched.id : '-',
        name: log.fullNameSnapshot,
        role: log.roleSnapshot,
        status: log.success ? 'SUCCESS' : 'FAILED',
      };
    }),
    tables: (db.tables || []).map((t, idx) => ({
      index: idx + 1,
      tableCode: t.tableCode,
      displayName: t.displayName,
      room: (t as any).roomName || 'Dining Area',
      capacity: t.capacity || 4,
      unpaidOrders: t.unpaidCount || 0,
      unpaidAmountPaise: t.unpaidTotalPaise || 0,
      status: t.status,
    })),
    orders: (db.orders || []).map((o) => ({
      orderId: o.customerCode || o.id,
      tableCode: o.tableCode,
      tableName: o.tableName,
      time: o.createdAt,
      items: (o.items || []).map((it) => `${it.quantity}x ${it.itemName}`).join('; '),
      totalPaise: o.grandTotalPaise || 0,
      fulfillmentStatus: o.fulfillmentStatus,
      paymentStatus: o.paymentStatus,
    })),
  };
}

/**
 * Pushes live update to Google Workspace (Google Apps Script Webhook) if URL is configured
 */
export async function pushLiveUpdateToGoogleWorkspace(): Promise<{ success: boolean; message: string }> {
  try {
    const webhookUrl = GOOGLE_WORKSPACE_CONFIG.webhookUrl;
    if (!webhookUrl) {
      return {
        success: true,
        message: 'Google Workspace live feeds ready. Data is accessible live via CSV/API feeds.',
      };
    }

    const payload = getFullGoogleWorkspacePayload();
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      return { success: true, message: `Google Sheet under ${GOOGLE_WORKSPACE_CONFIG.adminEmail} updated in real-time!` };
    } else {
      return { success: false, message: `Webhook responded with status ${res.status}` };
    }
  } catch (err: any) {
    return { success: false, message: err.message || 'Error pushing to Google Workspace' };
  }
}
