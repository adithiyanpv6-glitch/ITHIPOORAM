import { NextResponse } from 'next/server';
import { db, refreshTableSummaries } from '@/lib/serverDb';
import { generateMultiSheetTableExcelXml } from '@/lib/tableExcelDatabase';
import { getTelegramCredentials } from '@/config/telegram';
import { resolveNumericChatId } from '@/lib/autoTelegramExcelSync';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(request: Request) {
  try {
    refreshTableSummaries();
    const body = await request.json().catch(() => ({}));
    
    // Bot token & chat id priority: 1) Body, 2) telegram.ts config / process.env
    const fallback = getTelegramCredentials();
    const botToken = (body.botToken || fallback.botToken || '').trim();
    const rawChatId = (body.chatId || fallback.chatId || '').trim();

    if (!botToken || !rawChatId) {
      return NextResponse.json(
        {
          success: false,
          missingConfig: true,
          error: 'Telegram Bot Token and Chat ID are required.',
          message: 'Please provide your Telegram Bot Token and Chat ID in .env.local file or config/telegram.ts.',
        },
        { status: 400, headers: corsHeaders }
      );
    }

    const chatId = await resolveNumericChatId(botToken, rawChatId);
    if (!chatId) {
      return NextResponse.json(
        {
          success: false,
          pendingChatId: true,
          error: 'Could not auto-detect group chat ID yet.',
          message: 'Please ensure @ithipooram_bot is added as Administrator to your Telegram group, and send at least one message in the group to register it.',
        },
        { status: 400, headers: corsHeaders }
      );
    }

    let tables = db.tables;
    if (Array.isArray(body.tables) && body.tables.length > 0) {
      tables = body.tables.map((t: any) => ({
        id: t.id || `t-${t.tableCode.toLowerCase()}`,
        tableCode: t.tableCode,
        displayName: t.tableName || t.displayName || `Table ${t.tableCode}`,
        roomName: t.roomName || 'Dining Area',
        capacity: t.capacity || 4,
        url: t.url,
      }));
    }

    const orders = db.orders;
    const xmlContent = generateMultiSheetTableExcelXml(tables, orders);
    const dateFormatted = new Date().toISOString().slice(0, 10);
    const filename = `IthiPooram_Tables_Orders_Database_${dateFormatted}.xls`;

    // Prepare multipart form data for Telegram sendDocument API
    const boundary = `----TelegramBoundary${Date.now()}`;
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + (o.grandTotalPaise || 0), 0) / 100;

    const caption = 
      `📊 *ITHI POORAM (ഇത്തിപ്പൂരം) — Table & Orders Database*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `📅 *Date:* ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}\n` +
      `⏰ *Time:* ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}\n` +
      `🪑 *Total Tables:* ${tables.length} (Dedicated Sheet for Each Table)\n` +
      `🧾 *Total Customer Orders:* ${totalOrders}\n` +
      `💰 *Total Recorded Revenue:* ₹${totalRevenue.toFixed(2)}\n` +
      `📍 *Location:* Vanchiyoor, Trivandrum\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `✅ *Google Sheets & MS Excel Ready:* Click or tap to open directly in Google Sheets / Excel!`;

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

    if (tgData.ok) {
      return NextResponse.json(
        {
          success: true,
          message: `Multi-sheet Excel database successfully delivered to Telegram group! (Message ID: ${tgData.result?.message_id})`,
          tableCount: tables.length,
          orderCount: totalOrders,
        },
        { headers: corsHeaders }
      );
    } else {
      return NextResponse.json(
        {
          success: false,
          error: tgData.description || 'Telegram API returned an error.',
          details: tgData,
        },
        { status: 400, headers: corsHeaders }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error while syncing to Telegram',
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
