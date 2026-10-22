import { NextResponse } from 'next/server';
import { db, refreshTableSummaries } from '@/lib/serverDb';
import { syncTableOrdersDatabasePinned } from '@/lib/telegramPinnedVault';

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
    
    if (Array.isArray(body.tables) && body.tables.length > 0) {
      db.tables = body.tables.map((t: any) => ({
        id: t.id || `t-${t.tableCode.toLowerCase()}`,
        tableCode: t.tableCode,
        displayName: t.tableName || t.displayName || `Table ${t.tableCode}`,
        roomName: t.roomName || 'Dining Area',
        capacity: t.capacity || 4,
        url: t.url,
      }));
    }

    const result = await syncTableOrdersDatabasePinned();

    return NextResponse.json(
      {
        success: result.success,
        message: result.message,
        tableCount: (db.tables || []).length,
      },
      { headers: corsHeaders }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function GET() {
  try {
    const result = await syncTableOrdersDatabasePinned();
    return NextResponse.json(result, { headers: corsHeaders });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500, headers: corsHeaders });
  }
}
