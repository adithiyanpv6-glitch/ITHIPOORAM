// Automatic Background Sync of Multi-Sheet Excel Database to Telegram Group
// Triggers live whenever tables are created/modified or customer orders arrive.

import fs from 'fs';
import path from 'path';
import { db, refreshTableSummaries } from './serverDb';
import { generateMultiSheetTableExcelXml } from './tableExcelDatabase';
import { getTelegramCredentials } from '@/config/telegram';

export let cachedNumericChatId: string | null = null;

function getCachedChatIdFromDisk(): string | null {
  try {
    const file = path.join(process.cwd(), '.telegram_chat_id');
    if (fs.existsSync(file)) {
      const id = fs.readFileSync(file, 'utf-8').trim();
      if (id) return id;
    }
  } catch (e) {}
  return null;
}

function saveCachedChatIdToDisk(id: string) {
  try {
    const file = path.join(process.cwd(), '.telegram_chat_id');
    fs.writeFileSync(file, id.trim(), 'utf-8');
  } catch (e) {}
}

export async function resolveNumericChatId(botToken: string, chatIdOrLink: string): Promise<string | null> {
  // If it's already a numeric Telegram ID (like -1001234567890 or 12345678)
  if (chatIdOrLink && (chatIdOrLink.startsWith('-') || /^\d+$/.test(chatIdOrLink))) {
    return chatIdOrLink;
  }
  if (cachedNumericChatId) {
    return cachedNumericChatId;
  }

  const diskId = getCachedChatIdFromDisk();
  if (diskId) {
    cachedNumericChatId = diskId;
    return cachedNumericChatId;
  }

  // Auto-detect numeric chat ID from recent bot updates
  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/getUpdates`);
    const data = await res.json();
    if (data.ok && Array.isArray(data.result)) {
      for (const update of data.result) {
        const chat = update.message?.chat || update.channel_post?.chat || update.my_chat_member?.chat;
        if (chat && chat.id) {
          cachedNumericChatId = String(chat.id);
          saveCachedChatIdToDisk(cachedNumericChatId);
          return cachedNumericChatId;
        }
      }
    }
  } catch (e) {
    console.error('Error auto-resolving Telegram chat id:', e);
  }
  return null;
}

export async function autoDispatchTableExcelToTelegram(reason: string = 'Real-time Data Update'): Promise<boolean> {
  try {
    const { botToken, chatId } = getTelegramCredentials();
    if (!botToken || !chatId) {
      return false;
    }

    const resolvedChatId = await resolveNumericChatId(botToken, chatId);
    if (!resolvedChatId) {
      // Need at least one message in the group with the bot to auto-detect ID
      console.log('Telegram Chat ID pending: Please ensure @ithipooram_bot is added as Admin in the group and a message was sent.');
      return false;
    }

    refreshTableSummaries();
    const tables = db.tables;
    const orders = db.orders;

    const xmlContent = generateMultiSheetTableExcelXml(tables, orders);
    const dateFormatted = new Date().toISOString().slice(0, 10);
    const filename = `IthiPooram_Live_Database_${dateFormatted}.xls`;

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + (o.grandTotalPaise || 0), 0) / 100;

    const caption = 
      `📊 *ITHI POORAM (ഇത്തിപ്പൂരം) — Live Database Update*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `⚡ *Event:* ${reason}\n` +
      `📅 *Date:* ${new Date().toLocaleDateString('en-GB')}\n` +
      `⏰ *Time:* ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}\n` +
      `🪑 *Tables Registered:* ${tables.length} (Dedicated Sheet for each table)\n` +
      `🧾 *Total Customer Orders:* ${totalOrders}\n` +
      `💰 *Total Recorded Revenue:* ₹${totalRevenue.toFixed(2)}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `📂 *Multi-sheet Excel file (.xls) attached below.* Tap or open directly in Google Sheets / MS Excel!`;

    const boundary = `----TelegramBoundary${Date.now()}`;
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
    return Boolean(tgData.ok);
  } catch (err) {
    console.error('Failed to auto-dispatch Excel to Telegram:', err);
    return false;
  }
}
