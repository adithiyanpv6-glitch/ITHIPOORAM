import { NextResponse } from 'next/server';
import { autoDispatchMenuExcelToTelegram } from '@/lib/autoTelegramMenuSync';

export const dynamic = 'force-dynamic';

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
    const success = await autoDispatchMenuExcelToTelegram('Manual Menu Excel Sync via Admin Console');
    return NextResponse.json({ success, message: success ? 'Datewise Menu Database sent to Telegram group.' : 'Sync failed. Verify Telegram bot and group setup.' }, { headers: corsHeaders });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500, headers: corsHeaders });
  }
}

export async function GET() {
  try {
    const success = await autoDispatchMenuExcelToTelegram('Live Status Menu Sync');
    return NextResponse.json({ success }, { headers: corsHeaders });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500, headers: corsHeaders });
  }
}
