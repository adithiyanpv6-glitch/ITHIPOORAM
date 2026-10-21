// Automatic Background Sync of Multi-Sheet Excel Database to Telegram Group
// Triggers live whenever tables are created/modified or customer orders arrive.

import { db, refreshTableSummaries } from './serverDb';
import { generateMultiSheetTableExcelXml } from './tableExcelDatabase';
import { getTelegramCredentials } from '@/config/telegram';

export async function autoDispatchTableExcelToTelegram(reason: string = 'Real-time Data Update'): Promise<boolean> {
  try {
    const { botToken, chatId, isConfigured } = getTelegramCredentials();
    if (!isConfigured || !botToken || !chatId) {
      // Credentials not uploaded yet; skip silently
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
      `--${boundary}\r\nContent-Disposition: form-data; name="chat_id"\r\n\r\n${chatId}\r\n`,
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
