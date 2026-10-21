import { NextResponse } from 'next/server';
import { db, refreshTableSummaries } from '@/lib/serverDb';
import { generateMultiSheetTableExcelXml } from '@/lib/tableExcelDatabase';

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
  const tables = db.tables;
  const orders = db.orders;

  const xmlContent = generateMultiSheetTableExcelXml(tables, orders);
  const filename = `IthiPooram_Tables_Database_${new Date().toISOString().slice(0, 10)}.xls`;

  return new NextResponse(xmlContent, {
    status: 200,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/vnd.ms-excel; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-cache',
    },
  });
}

export async function POST(request: Request) {
  refreshTableSummaries();
  let tables = db.tables;
  const orders = db.orders;

  try {
    const body = await request.json().catch(() => ({}));
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
  } catch (e) {}

  const xmlContent = generateMultiSheetTableExcelXml(tables, orders);
  const filename = `IthiPooram_Tables_Database_${new Date().toISOString().slice(0, 10)}.xls`;

  return new NextResponse(xmlContent, {
    status: 200,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/vnd.ms-excel; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-cache',
    },
  });
}
