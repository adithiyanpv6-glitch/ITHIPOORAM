import { NextResponse } from 'next/server';
import { generateMasterStaffExcelXml, DEFAULT_MASTER_STAFF_DATABASE } from '@/lib/userExcelDatabase';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const botToken = body.botToken || process.env.TELEGRAM_BOT_TOKEN;
    const chatId = body.chatId || process.env.TELEGRAM_CHAT_ID;
    const staffList = body.staffList || DEFAULT_MASTER_STAFF_DATABASE;

    const xmlContent = generateMasterStaffExcelXml(staffList);
    const filename = `IthiPooram_Master_Staff_Database_${new Date().toISOString().slice(0, 10)}.xls`;

    if (botToken && chatId) {
      // Dispatch using official Telegram Bot API sendDocument
      const boundary = `----TelegramBoundary${Date.now()}`;
      const caption = `🔒 ITHI POORAM (ഇത്തിപ്പൂരം) • Master Staff & Admin Credentials Database\n` +
        `📅 Date: ${new Date().toLocaleDateString('en-GB')}\n` +
        `👥 Registered Accounts: ${staffList.length}\n` +
        `🔐 Security: Password Protected Vault Archive\n` +
        `📍 Vanchiyoor, Trivandrum`;

      const formDataParts = [
        `--${boundary}\r\nContent-Disposition: form-data; name="chat_id"\r\n\r\n${chatId.trim()}\r\n`,
        `--${boundary}\r\nContent-Disposition: form-data; name="caption"\r\n\r\n${caption}\r\n`,
        `--${boundary}\r\nContent-Disposition: form-data; name="document"; filename="${filename}"\r\nContent-Type: application/vnd.ms-excel\r\n\r\n${xmlContent}\r\n`,
        `--${boundary}--\r\n`,
      ];

      const tgRes = await fetch(`https://api.telegram.org/bot${botToken.trim()}/sendDocument`, {
        method: 'POST',
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
        },
        body: formDataParts.join(''),
      });

      const tgData = await tgRes.json();
      if (tgData.ok) {
        return NextResponse.json({
          success: true,
          message: `Master Excel database successfully delivered to private Telegram group! (Message ID: ${tgData.result?.message_id})`,
        });
      } else {
        return NextResponse.json({
          success: false,
          error: tgData.description || 'Telegram API returned an error.',
        }, { status: 400 });
      }
    }

    // If bot token is not yet provided, return instructions and the generated file metadata
    return NextResponse.json({
      success: true,
      pendingBotToken: true,
      message: 'Master Excel Database compiled successfully! Add your Telegram Bot Token in Settings or download directly.',
      downloadUrl: '/IthiPooram_Master_Staff_Database.xls',
      telegramGroupLink: 'https://t.me/+9eJM_DO7vyUxMjE9',
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error while syncing to Telegram',
    }, { status: 500 });
  }
}
