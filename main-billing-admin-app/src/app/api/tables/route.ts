import { NextResponse } from 'next/server';
import { db, refreshTableSummaries } from '@/lib/serverDb';
import { autoDispatchTableExcelToTelegram } from '@/lib/autoTelegramExcelSync';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET() {
  refreshTableSummaries();
  return NextResponse.json(db.tables, { headers: corsHeaders });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (Array.isArray(body.tables)) {
      if (body.replace || body.tables.length === 0) {
        db.tables = body.tables.map((t: any) => ({
          id: t.id || `t-${t.tableCode.toLowerCase()}-${Date.now()}`,
          tableCode: t.tableCode.toUpperCase(),
          displayName: t.displayName || `Table ${t.tableCode}`,
          capacity: t.capacity || 4,
          status: (t.status as any) || 'AVAILABLE',
          unpaidCount: t.unpaidCount || 0,
          unpaidTotalPaise: t.unpaidTotalPaise || 0,
        }));
      } else {
        for (const t of body.tables) {
          const existing = db.tables.find((ex) => ex.tableCode.toUpperCase() === t.tableCode.toUpperCase());
          if (existing) {
            existing.displayName = t.displayName;
            existing.capacity = t.capacity || existing.capacity;
          } else {
            db.tables.push({
              id: t.id || `t-${t.tableCode.toLowerCase()}-${Date.now()}`,
              tableCode: t.tableCode.toUpperCase(),
              displayName: t.displayName || `Table ${t.tableCode}`,
              capacity: t.capacity || 4,
              status: 'AVAILABLE',
              unpaidCount: 0,
              unpaidTotalPaise: 0,
            });
          }
        }
      }
    }
    refreshTableSummaries();

    // Auto-dispatch updated multi-sheet Excel file to Telegram group
    autoDispatchTableExcelToTelegram(`Table QR Setup Updated (${db.tables.length} tables active)`).catch(() => {});

    return NextResponse.json({ success: true, tables: db.tables }, { headers: corsHeaders });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500, headers: corsHeaders });
  }
}
