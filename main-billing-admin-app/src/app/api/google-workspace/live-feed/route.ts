import { NextRequest, NextResponse } from 'next/server';
import {
  getStaffRegisterCsv,
  getLoginSessionsCsv,
  getActivityLogsCsv,
  getTablesCsv,
  getOrdersCsv,
  getFullGoogleWorkspacePayload,
} from '@/lib/googleWorkspaceSync';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET(req: NextRequest) {
  try {
    const sheet = req.nextUrl.searchParams.get('sheet') || 'staff';
    const format = req.nextUrl.searchParams.get('format') || 'csv';

    if (format === 'json') {
      return NextResponse.json(getFullGoogleWorkspacePayload(), { headers: corsHeaders });
    }

    let csv = '';
    let filename = 'live-data.csv';

    switch (sheet.toLowerCase()) {
      case 'staff':
        csv = getStaffRegisterCsv();
        filename = 'IthiPooram_GoogleSheets_Staff.csv';
        break;
      case 'sessions':
        csv = getLoginSessionsCsv();
        filename = 'IthiPooram_GoogleSheets_Sessions.csv';
        break;
      case 'logs':
      case 'activity':
        csv = getActivityLogsCsv();
        filename = 'IthiPooram_GoogleSheets_Logs.csv';
        break;
      case 'tables':
        csv = getTablesCsv();
        filename = 'IthiPooram_GoogleSheets_Tables.csv';
        break;
      case 'orders':
        csv = getOrdersCsv();
        filename = 'IthiPooram_GoogleSheets_Orders.csv';
        break;
      default:
        csv = getStaffRegisterCsv();
        filename = 'IthiPooram_GoogleSheets_Staff.csv';
        break;
    }

    return new NextResponse(csv, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `inline; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500, headers: corsHeaders });
  }
}
