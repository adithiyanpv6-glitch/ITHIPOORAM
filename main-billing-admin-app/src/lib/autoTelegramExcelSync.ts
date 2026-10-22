// Automatic Background Sync of Multi-Sheet Excel Database to Telegram Group
// Triggers live whenever tables are created/modified or customer orders arrive.

import fs from 'fs';
import path from 'path';
import dns from 'dns';
import { db, refreshTableSummaries } from './serverDb';
import { generateMultiSheetTableExcelXml } from './tableExcelDatabase';
import { getTelegramCredentials } from '@/config/telegram';

try {
  dns.setDefaultResultOrder('ipv4first');
} catch (e) {}

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
    const { syncTableOrdersDatabasePinned } = await import('./telegramPinnedVault');
    const res = await syncTableOrdersDatabasePinned();
    return res.success;
  } catch (err) {
    console.error('Failed to auto-dispatch Table Orders Excel to Telegram:', err);
    return false;
  }
}
