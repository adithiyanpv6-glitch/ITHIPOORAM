import { NextRequest, NextResponse } from 'next/server';
import { db, refreshTableSummaries } from '@/lib/serverDb';
import { generateUnifiedMasterDatabaseXml } from '@/lib/masterExcelDatabase';
import { generateStaffDatabaseXml, generateStaffSessionDatabaseXml } from '@/lib/staffSessionExcelDatabase';
import { generateMultiSheetTableExcelXml } from '@/lib/tableExcelDatabase';

export async function GET(req: NextRequest) {
  try {
    refreshTableSummaries();
    const type = req.nextUrl.searchParams.get('type') || 'master';
    let xml = '';
    let filename = '';

    if (type === 'sessions') {
      xml = generateStaffSessionDatabaseXml(db.loginSessions || [], db.staffActivityLogs || [], db.staffUsers || []);
      filename = `IthiPooram_Staff_Session_Database.xls`;
    } else if (type === 'tables') {
      xml = generateMultiSheetTableExcelXml(db.tables || [], db.orders || []);
      filename = `IthiPooram_Table_Orders_Database.xls`;
    } else if (type === 'staff') {
      xml = generateStaffDatabaseXml(db.staffUsers || []);
      filename = `IthiPooram_Staff_Database.xls`;
    } else {
      // Default: Complete Master Database with all 3 sheets
      xml = generateUnifiedMasterDatabaseXml(
        db.staffUsers || [],
        db.loginSessions || [],
        db.staffActivityLogs || [],
        db.tables || [],
        db.orders || []
      );
      filename = `IthiPooram_Master_Database.xls`;
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
