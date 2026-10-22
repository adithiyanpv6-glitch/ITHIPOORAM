// ============================================================================
// ITHI POORAM (ഇത്തിപ്പൂരം) — Automatic Telegram Datewise Menu Excel Dispatcher
// Dispatches updated Datewise Menu Database Excel to Telegram group on every menu change
// ============================================================================

import { db } from './serverDb';
import { generateDatewiseMenuExcelXml, DailyMenuItemEntry } from './datewiseMenuDatabase';
import { getTelegramCredentials } from '@/config/telegram';
import { resolveNumericChatId } from './autoTelegramExcelSync';

export async function autoDispatchMenuExcelToTelegram(reason: string = 'Menu Update'): Promise<boolean> {
  try {
    const { botToken, chatId } = getTelegramCredentials();
    if (!botToken || !chatId) {
      console.log('Telegram credentials not configured for Menu Excel sync');
      return false;
    }

    const resolvedChatId = await resolveNumericChatId(botToken, chatId);
    if (!resolvedChatId) {
      console.log('Telegram Chat ID pending resolution.');
      return false;
    }

    const todayDate = new Date().toISOString().split('T')[0];

    // Gather today's items from db.menuCategories
    const todayItems: DailyMenuItemEntry[] = [];
    for (const cat of db.menuCategories || []) {
      for (const it of cat.items || []) {
        todayItems.push({
          date: todayDate,
          id: it.id,
          name: it.name,
          malayalamName: it.malayalamName,
          category: cat.name,
          dietary: (it.dietary as any) || 'SEAFOOD',
          priceInr: it.pricePaise / 100,
          currentStock: it.currentStock !== undefined ? it.currentStock : null,
          isAvailable: it.isAvailable !== false,
          station: it.station || 'Main Kitchen',
          updatedAt: new Date().toISOString(),
        });
      }
    }

    // Ensure db.dailyMenuHistory exists
    if (!db.dailyMenuHistory) {
      db.dailyMenuHistory = [];
    }

    // Upsert today's items into permanent datewise history
    for (const item of todayItems) {
      const existingIdx = db.dailyMenuHistory.findIndex(
        (h) => h.date === todayDate && (h.id === item.id || h.name.toLowerCase() === item.name.toLowerCase())
      );
      if (existingIdx >= 0) {
        db.dailyMenuHistory[existingIdx] = item;
      } else {
        db.dailyMenuHistory.unshift(item);
      }
    }

    const allHistoryItems = db.dailyMenuHistory;

    const xmlContent = generateDatewiseMenuExcelXml(todayItems, allHistoryItems, todayDate);
    const filename = `IthiPooram_Datewise_Menu_Database_${todayDate}.xls`;

    const activeCount = todayItems.filter((i) => i.isAvailable).length;

    const caption = 
      `📋 *ITHI POORAM (ഇത്തിപ്പൂരം) — Live Menu Database Update*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `⚡ *Action:* ${reason}\n` +
      `📅 *Date:* ${new Date().toLocaleDateString('en-GB')}\n` +
      `⏰ *Time:* ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}\n` +
      `🍽️ *Total Dishes in Menu:* ${todayItems.length} (${activeCount} In Stock)\n` +
      `💵 *Pricing Policy:* Final Net Prices (GST added directly by Admin)\n` +
      `📚 *History Logged:* ${Array.from(new Set(allHistoryItems.map((h) => h.date))).length} Day(s) archived\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `📂 *Multi-sheet Datewise Menu Excel attached below.* Tap to view in Google Sheets / MS Excel!`;

    const boundary = `----TelegramMenuBoundary${Date.now()}`;
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
    console.error('Failed to auto-dispatch Menu Excel to Telegram:', err);
    return false;
  }
}
