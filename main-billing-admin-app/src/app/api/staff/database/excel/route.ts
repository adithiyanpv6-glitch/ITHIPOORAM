import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/serverDb';
import { generateStaffDatabaseXml, generateStaffSessionDatabaseXml } from '@/lib/staffSessionExcelDatabase';
import { generateMultiSheetTableExcelXml } from '@/lib/tableExcelDatabase';

export async function GET(req: NextRequest) {
  try {
    const type = req.nextUrl.searchParams.get('type') || 'staff';
    let xml = '';
    let filename = '';

    if (type === 'sessions') {
      xml = generateStaffSessionDatabaseXml(db.loginSessions || [], db.staffActivityLogs || [], db.staffUsers || []);
      filename = `IthiPooram_Staff_Session_Database.xls`;
    } else if (type === 'tables') {
      xml = generateMultiSheetTableExcelXml(db.tables || [], db.orders || []);
      filename = `IthiPooram_Table_Orders_Database.xls`;
    } else {
      xml = generateStaffDatabaseXml(db.staffUsers || []);
      filename = `IthiPooram_Staff_Database.xls`;
    }

    return new NextResponse(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.ms-excel; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
