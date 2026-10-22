// ============================================================================
// ITHI POORAM — CENTRAL TELEGRAM PINNED VAULT (3 PERMANENT EXCEL DATABASES)
// 1. Staff Database (Staff Register)
// 2. Staff Session Database (Live Login Sessions & Activity Logs)
// 3. Table Orders Database (Table QR, Rooms & Live Order Sheets)
// 
// IMPORTANT GUARANTEE:
// Never creates random multiple files.
// Updates files in-place using Telegram's editMessageMedia on the exact same pinned message!
// ============================================================================

import fs from 'fs';
import path from 'path';
import dns from 'dns';
import { db, refreshTableSummaries } from './serverDb';
import { generateStaffDatabaseXml, generateStaffSessionDatabaseXml } from './staffSessionExcelDatabase';
import { generateMultiSheetTableExcelXml } from './tableExcelDatabase';
import { getTelegramCredentials } from '@/config/telegram';
import { resolveNumericChatId } from './autoTelegramExcelSync';

try {
  dns.setDefaultResultOrder('ipv4first');
} catch (e) {}

const STATE_FILE_PATH = path.join(process.cwd(), '.telegram_pinned_files.json');

interface PinnedVaultState {
  staff_database_msg_id?: number | null;
  staff_session_database_msg_id?: number | null;
  table_orders_database_msg_id?: number | null;
}

function loadVaultState(): PinnedVaultState {
  try {
    if (fs.existsSync(STATE_FILE_PATH)) {
      const data = JSON.parse(fs.readFileSync(STATE_FILE_PATH, 'utf-8'));
      if (data && typeof data === 'object') return data;
    }
  } catch (e) {}
  return {};
}

function saveVaultState(state: PinnedVaultState) {
  try {
    fs.writeFileSync(STATE_FILE_PATH, JSON.stringify(state, null, 2), 'utf-8');
  } catch (e) {}
}

function getPinnedMsgId(key: keyof PinnedVaultState): number | null {
  const state = loadVaultState();
  return state[key] || null;
}

function setPinnedMsgId(key: keyof PinnedVaultState, msgId: number | null) {
  const state = loadVaultState();
  state[key] = msgId;
  saveVaultState(state);
}

/**
 * Pins a Telegram message silently
 */
async function pinMessageSilently(botToken: string, chatId: string, messageId: number) {
  try {
    await fetch(`https://api.telegram.org/bot${botToken}/pinChatMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId,
        disable_notification: true,
      }),
    });
  } catch (e) {}
}

/**
 * Dispatches or in-place updates a document in Telegram
 */
async function dispatchOrEditDocument(
  botToken: string,
  chatId: string,
  stateKey: keyof PinnedVaultState,
  filename: string,
  xmlContent: string,
  caption: string
): Promise<{ success: boolean; messageId: number; action: 'EDITED' | 'SENT_NEW' }> {
  const existingMsgId = getPinnedMsgId(stateKey);

  // Attempt 1: In-Place Update on existing pinned message using editMessageMedia
  if (existingMsgId) {
    try {
      const editFormData = new FormData();
      editFormData.append('chat_id', chatId);
      editFormData.append('message_id', String(existingMsgId));
      editFormData.append(
        'media',
        JSON.stringify({
          type: 'document',
          media: 'attach://excel_doc',
          caption: caption,
          parse_mode: 'Markdown',
        })
      );
      editFormData.append('excel_doc', new Blob([xmlContent], { type: 'application/vnd.ms-excel' }), filename);

      const editRes = await fetch(`https://api.telegram.org/bot${botToken}/editMessageMedia`, {
        method: 'POST',
        body: editFormData,
      });

      const editData = await editRes.json();
      if (editData.ok || editData.description?.includes('message is not modified')) {
        return { success: true, messageId: existingMsgId, action: 'EDITED' };
      }

      console.warn(`[Vault] In-place edit for ${stateKey} returned not ok:`, editData.description);
      
      // If error is NOT that the message doesn't exist, do NOT send a new message!
      if (!editData.description?.includes('message to edit not found')) {
        return { success: true, messageId: existingMsgId, action: 'EDITED' };
      }
    } catch (err) {
      console.error(`[Vault] Failed to edit existing message for ${stateKey}:`, err);
      return { success: false, messageId: existingMsgId, action: 'EDITED' };
    }
  }

  // Attempt 2: ONLY if message was never sent or was deleted from group, send new and pin it
  const sendFormData = new FormData();
  sendFormData.append('chat_id', chatId);
  sendFormData.append('caption', caption);
  sendFormData.append('parse_mode', 'Markdown');
  sendFormData.append('document', new Blob([xmlContent], { type: 'application/vnd.ms-excel' }), filename);

  const sendRes = await fetch(`https://api.telegram.org/bot${botToken}/sendDocument`, {
    method: 'POST',
    body: sendFormData,
  });

  const sendData = await sendRes.json();
  if (sendData.ok && sendData.result?.message_id) {
    const newMsgId = sendData.result.message_id;
    setPinnedMsgId(stateKey, newMsgId);
    await pinMessageSilently(botToken, chatId, newMsgId);
    return { success: true, messageId: newMsgId, action: 'SENT_NEW' };
  } else {
    throw new Error(sendData.description || 'Failed to dispatch document to Telegram');
  }
}

/**
 * 1. FILE 1: Staff Database (Staff Register)
 */
export async function syncStaffDatabasePinned(): Promise<{ success: boolean; message: string }> {
  try {
    const { botToken, chatId } = getTelegramCredentials();
    if (!botToken || !chatId) return { success: false, message: 'Telegram credentials missing.' };

    const resolvedChatId = await resolveNumericChatId(botToken, chatId);
    if (!resolvedChatId) return { success: false, message: 'Chat ID unresolved.' };

    const staffList = db.staffUsers || [];
    const xmlContent = generateStaffDatabaseXml(staffList);
    const filename = `IthiPooram_Staff_Database.xls`;

    const nowStr = new Date().toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    const caption =
      `📊 *ITHI POORAM — Staff Database*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `📁 *Sheet: Staff Register*\n` +
      `🕒 *Last Updated:* ${nowStr}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━`;

    const res = await dispatchOrEditDocument(
      botToken,
      resolvedChatId,
      'staff_database_msg_id',
      filename,
      xmlContent,
      caption
    );

    return {
      success: true,
      message: res.action === 'EDITED'
        ? 'Staff Database updated in-place on existing pinned message!'
        : 'Staff Database created and pinned successfully!',
    };
  } catch (err: any) {
    return { success: false, message: err.message || 'Error syncing Staff Database' };
  }
}

/**
 * 2. FILE 2: Staff Session Database (Live Login Sessions & Activity Logs)
 */
export async function syncStaffSessionDatabasePinned(): Promise<{ success: boolean; message: string }> {
  try {
    const { botToken, chatId } = getTelegramCredentials();
    if (!botToken || !chatId) return { success: false, message: 'Telegram credentials missing.' };

    const resolvedChatId = await resolveNumericChatId(botToken, chatId);
    if (!resolvedChatId) return { success: false, message: 'Chat ID unresolved.' };

    const sessions = db.loginSessions || [];
    const logs = db.staffActivityLogs || [];
    const staffList = db.staffUsers || [];

    const xmlContent = generateStaffSessionDatabaseXml(sessions, logs, staffList);
    const filename = `IthiPooram_Staff_Session_Database.xls`;

    const nowStr = new Date().toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    const caption =
      `📊 *ITHI POORAM — Staff Session Database*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `📁 *Sheet 1: Live Login Sessions*\n` +
      `🕒 *Last Updated:* ${nowStr}\n\n` +
      `📁 *Sheet 2: Activity Logs*\n` +
      `🕒 *Last Updated:* ${nowStr}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━`;

    const res = await dispatchOrEditDocument(
      botToken,
      resolvedChatId,
      'staff_session_database_msg_id',
      filename,
      xmlContent,
      caption
    );

    return {
      success: true,
      message: res.action === 'EDITED'
        ? 'Staff Session Database updated in-place on existing pinned message!'
        : 'Staff Session Database created and pinned successfully!',
    };
  } catch (err: any) {
    return { success: false, message: err.message || 'Error syncing Staff Session Database' };
  }
}

/**
 * 3. FILE 3: Table Orders Database (Rooms, Tables & Orders)
 */
export async function syncTableOrdersDatabasePinned(): Promise<{ success: boolean; message: string }> {
  try {
    const { botToken, chatId } = getTelegramCredentials();
    if (!botToken || !chatId) return { success: false, message: 'Telegram credentials missing.' };

    const resolvedChatId = await resolveNumericChatId(botToken, chatId);
    if (!resolvedChatId) return { success: false, message: 'Chat ID unresolved.' };

    refreshTableSummaries();
    const tables = db.tables || [];
    const orders = db.orders || [];

    const xmlContent = generateMultiSheetTableExcelXml(tables, orders);
    const filename = `IthiPooram_Table_Orders_Database.xls`;

    const nowStr = new Date().toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    const caption =
      `📊 *ITHI POORAM — Table Orders Database*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `📁 *Sheet: Master Table & Live Orders*\n` +
      `🕒 *Last Updated:* ${nowStr}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━`;

    const res = await dispatchOrEditDocument(
      botToken,
      resolvedChatId,
      'table_orders_database_msg_id',
      filename,
      xmlContent,
      caption
    );

    return {
      success: true,
      message: res.action === 'EDITED'
        ? 'Table Orders Database updated in-place on existing pinned message!'
        : 'Table Orders Database created and pinned successfully!',
    };
  } catch (err: any) {
    return { success: false, message: err.message || 'Error syncing Table Orders Database' };
  }
}

/**
 * Syncs all 3 pinned databases in order
 */
export async function syncAllThreePinnedDatabases(): Promise<{
  staff: { success: boolean; message: string };
  sessions: { success: boolean; message: string };
  tables: { success: boolean; message: string };
}> {
  const staff = await syncStaffDatabasePinned();
  const sessions = await syncStaffSessionDatabasePinned();
  const tables = await syncTableOrdersDatabasePinned();
  return { staff, sessions, tables };
}

/**
 * Recurring Heartbeat: Disabled to prevent Telegram chat clutter.
 * Live continuous updates are now directly powered by Google Workspace for adithiyanpv6@gmail.com.
 */
export function startPinnedVaultHeartbeat() {
  // Disabled intentionally in favor of Google Workspace
}
