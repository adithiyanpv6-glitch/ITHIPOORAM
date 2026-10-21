import { NextResponse } from 'next/server';
import { db } from '@/lib/serverDb';
import { generateDailyMenuExcelXml, generateDailyMenuCsv, MenuItemRecord } from '@/lib/menuExcelDatabase';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const targetDate = searchParams.get('date') || new Date().toISOString().split('T')[0];
  const format = searchParams.get('format') || 'xls';

  // Flatten all menu items from server database
  const allItems: MenuItemRecord[] = [];
  for (const cat of db.menuCategories || []) {
    for (const it of cat.items || []) {
      allItems.push({
        id: it.id,
        name: it.name,
        malayalamName: it.malayalamName,
        category: cat.name,
        pricePaise: it.pricePaise,
        currentStock: it.currentStock !== undefined ? it.currentStock : null,
        isAvailable: it.isAvailable,
        dietary: (it.dietary as any) || 'SEAFOOD',
        station: it.station,
        dateRecorded: targetDate,
      });
    }
  }

  if (format === 'csv') {
    const csvContent = generateDailyMenuCsv(allItems, targetDate);
    return new NextResponse(csvContent, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="IthiPooram_Daily_Menu_${targetDate}.csv"`,
      },
    });
  }

  const xlsXml = generateDailyMenuExcelXml(allItems, targetDate);
  return new NextResponse(xlsXml, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/vnd.ms-excel; charset=utf-8',
      'Content-Disposition': `attachment; filename="IthiPooram_Daily_Menu_${targetDate}.xls"`,
    },
  });
}
