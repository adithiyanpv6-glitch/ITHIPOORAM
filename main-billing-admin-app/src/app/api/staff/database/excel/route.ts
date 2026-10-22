import { NextResponse } from 'next/server';
import { db } from '@/lib/serverDb';
import { generateStaffSessionsExcelXml } from '@/lib/staffSessionExcelDatabase';

export async function GET() {
  try {
    const staffList = db.staffUsers || [];
    const sessions = db.loginSessions || [];
    const logs = db.staffActivityLogs || [];

    const xml = generateStaffSessionsExcelXml(staffList, sessions, logs);
    const dateFormatted = new Date().toISOString().slice(0, 10);
    const filename = `IthiPooram_Staff_And_Sessions_Database_${dateFormatted}.xls`;

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
