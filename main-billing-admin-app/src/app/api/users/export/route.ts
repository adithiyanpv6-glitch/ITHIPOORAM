import { NextResponse } from 'next/server';
import { generateMasterStaffExcelXml, generateStaffCsv, DEFAULT_MASTER_STAFF_DATABASE } from '@/lib/userExcelDatabase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const format = searchParams.get('format') || 'excel';

  if (format === 'csv') {
    const csvContent = generateStaffCsv(DEFAULT_MASTER_STAFF_DATABASE);
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="IthiPooram_Master_Staff_Database.csv"',
      },
    });
  }

  const xmlContent = generateMasterStaffExcelXml(DEFAULT_MASTER_STAFF_DATABASE);
  return new NextResponse(xmlContent, {
    headers: {
      'Content-Type': 'application/vnd.ms-excel; charset=utf-8',
      'Content-Disposition': 'attachment; filename="IthiPooram_Master_Staff_Database.xls"',
    },
  });
}
