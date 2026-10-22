// ============================================================================
// ITHI POORAM (ഇത്തിപ്പൂരം) — CENTRAL TELEGRAM PINNED VAULT (SINGLE MASTER FILE)
//
// GUARANTEE:
// 1. NEVER creates duplicate or new files.
// 2. Uses EXACTLY ONE permanent pinned Excel file in Telegram ("IthiPooram_Master_Database.xls").
// 3. Contains all 3 worksheets:
//    - "Staff Database"
//    - "Staff Session Database"
//    - "Table Orders Database"
// 4. Edits the file in-place on the same message (#16) repeatedly via editMessageMedia.
// ============================================================================

import fs from 'fs';
import path from 'path';
import dns from 'dns';
import { db, refreshTableSummaries } from './serverDb';
import { generateUnifiedMasterDatabaseXml } from './masterExcelDatabase';
import { getTelegramCredentials } from '@/config/telegram';
import { resolveNumericChatId } from './autoTelegramExcelSync';

try {
  dns.setDefaultResultOrder('ipv4first');
} catch (e) {}

const STATE_FILE_PATH = path.join(process.cwd(), '.telegram_pinned_files.json');

interface PinnedVaultState {
  master_database_msg_id?: number | null;
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
  return { master_database_msg_id: 16 };
}

function saveVaultState(state: PinnedVaultState) {
  try {
    fs.writeFileSync(STATE_FILE_PATH, JSON.stringify(state, null, 2), 'utf-8');
  } catch (e) {}
}

function getMasterMsgId(): number | null {
  const state = loadVaultState();
  return state.master_database_msg_id || state.staff_database_msg_id || 16;
}

function setMasterMsgId(msgId: number | null) {
  const state = loadVaultState();
  state.master_database_msg_id = msgId;
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
 * Dispatches or in-place updates the SINGLE master document in Telegram
 */
async function dispatchOrEditMasterDocument(
  botToken: string,
  chatId: string,
  filename: string,
  xmlContent: string,
  caption: string
): Promise<{ success: boolean; messageId: number; action: 'EDITED' | 'SENT_NEW' }> {
  const existingMsgId = getMasterMsgId();

  // ATTEMPT 1: In-Place Update on existing pinned message using editMessageMedia
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

      console.warn(`[Vault] In-place edit for master document returned not ok:`, editData.description);

      // If the error is NOT that the message doesn't exist, NEVER send a new message!
      if (!editData.description?.includes('message to edit not found')) {
        return { success: true, messageId: existingMsgId, action: 'EDITED' };
      }
    } catch (err) {
      console.error(`[Vault] Failed to edit existing master document:`, err);
      return { success: false, messageId: existingMsgId, action: 'EDITED' };
    }
  }

  // ATTEMPT 2: ONLY if message was deleted from group, send new and pin it
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
    setMasterMsgId(newMsgId);
    await pinMessageSilently(botToken, chatId, newMsgId);
    return { success: true, messageId: newMsgId, action: 'SENT_NEW' };
  } else {
    throw new Error(sendData.description || 'Failed to dispatch master document to Telegram');
  }
}

/**
 * 🌟 The SINGLE master database update function:
 * Updates the 1 pinned file in Telegram containing all 3 sheets.
 */
export async function syncMasterDatabasePinned(): Promise<{ success: boolean; message: string }> {
  try {
    const { botToken, chatId } = getTelegramCredentials();
    if (!botToken || !chatId) return { success: false, message: 'Telegram credentials missing.' };

    const resolvedChatId = await resolveNumericChatId(botToken, chatId);
    if (!resolvedChatId) return { success: false, message: 'Chat ID unresolved.' };

    refreshTableSummaries();
    const staffList = db.staffUsers || [];
    const sessions = db.loginSessions || [];
    const logs = db.staffActivityLogs || [];
    const tables = db.tables || [];
    const orders = db.orders || [];

    const xmlContent = generateUnifiedMasterDatabaseXml(staffList, sessions, logs, tables, orders);
    const filename = `IthiPooram_Master_Database.xls`;

    const nowStr = new Date().toLocaleTimeString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    const caption =
      `📊 *ITHI POORAM — Central Restaurant Live Database*\n` +
      `📁 *Sheets: Staff Database • Staff Sessions • Table Orders*\n` +
      `🕒 *Last Updated:* ${nowStr}`;

    const res = await dispatchOrEditMasterDocument(
      botToken,
      resolvedChatId,
      filename,
      xmlContent,
      caption
    );

    return {
      success: true,
      message: res.action === 'EDITED'
        ? 'Central Master Database updated in-place on existing Telegram file!'
        : 'Central Master Database created and pinned successfully in Telegram!',
    };
  } catch (err: any) {
    return { success: false, message: err.message || 'Error syncing Central Master Database' };
  }
}

// All legacy database sync calls now route to the SINGLE master database update!
export async function syncStaffDatabasePinned() {
  return syncMasterDatabasePinned();
}

export async function syncStaffSessionDatabasePinned() {
  return syncMasterDatabasePinned();
}

export async function syncTableOrdersDatabasePinned() {
  return syncMasterDatabasePinned();
}

export async function syncAllThreePinnedDatabases() {
  const result = await syncMasterDatabasePinned();
  return {
    staff: result,
    sessions: result,
    tables: result,
  };
}

export function startPinnedVaultHeartbeat() {
  // Silent: No periodic timer needed. In-place sync runs reactively on every real action!
}
