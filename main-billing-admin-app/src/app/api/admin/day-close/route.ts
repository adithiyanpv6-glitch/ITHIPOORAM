import { NextResponse } from 'next/server';
import { db, refreshTableSummaries, persistDb } from '@/lib/serverDb';
import fs from 'fs';
import path from 'path';

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
    const todayStr = db.currentBusinessDate || new Date().toISOString().slice(0, 10);
    const todayOrders = db.orders.filter(
      (o) => o.createdAt.startsWith(todayStr) || o.paidAt?.startsWith(todayStr)
    );

    const paidOrders = todayOrders.filter((o) => o.paymentStatus === 'PAID');
    const totalSalesPaise = paidOrders.reduce((sum, o) => sum + o.grandTotalPaise, 0);
    const cashPaise = paidOrders
      .filter((o) => o.paymentMode === 'CASH')
      .reduce((sum, o) => sum + o.grandTotalPaise, 0);
    const upiPaise = paidOrders
      .filter((o) => o.paymentMode === 'UPI')
      .reduce((sum, o) => sum + o.grandTotalPaise, 0);

    // Item movement summary
    const itemMap: Record<string, { name: string; qty: number; totalPaise: number }> = {};
    for (const o of paidOrders) {
      for (const it of o.items) {
        if (!itemMap[it.itemName]) {
          itemMap[it.itemName] = { name: it.itemName, qty: 0, totalPaise: 0 };
        }
        itemMap[it.itemName].qty += it.quantity;
        itemMap[it.itemName].totalPaise += it.lineTotalPaise;
      }
    }

    const itemSummary = Object.values(itemMap);

    // Generate Excel Spreadsheet (SpreadsheetML) for permanent day-close document
    const archiveDir = path.join(process.cwd(), 'reports_archive');
    if (!fs.existsSync(archiveDir)) {
      fs.mkdirSync(archiveDir, { recursive: true });
    }

    const excelFileName = `Daily_Report_${todayStr}.xls`;
    const excelFilePath = path.join(archiveDir, excelFileName);

    const itemRowsXml = itemSummary
      .map(
        (it) => `      <Row ss:Height="20">
        <Cell ss:StyleID="DataLeft"><Data ss:Type="String">${it.name}</Data></Cell>
        <Cell ss:StyleID="DataCenter"><Data ss:Type="Number">${it.qty}</Data></Cell>
        <Cell ss:StyleID="DataRight"><Data ss:Type="Number">${(it.totalPaise / 100).toFixed(2)}</Data></Cell>
      </Row>`
      )
      .join('\n');

    const invoiceRowsXml = paidOrders
      .map(
        (o) => `      <Row ss:Height="20">
        <Cell ss:StyleID="DataCenter"><Data ss:Type="String">${o.customerCode}</Data></Cell>
        <Cell ss:StyleID="DataCenter"><Data ss:Type="String">${o.tableCode}</Data></Cell>
        <Cell ss:StyleID="DataCenter"><Data ss:Type="String">${o.paymentMode || 'CASH'}</Data></Cell>
        <Cell ss:StyleID="DataRight"><Data ss:Type="Number">${(o.grandTotalPaise / 100).toFixed(2)}</Data></Cell>
      </Row>`
      )
      .join('\n');

    const xlsContent = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#000000"/>
  </Style>
  <Style ss:ID="Title">
   <Font ss:FontName="Calibri" ss:Size="15" ss:Bold="1" ss:Color="#111827"/>
  </Style>
  <Style ss:ID="Header">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#1F2937" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center"/>
  </Style>
  <Style ss:ID="DataLeft"><Alignment ss:Horizontal="Left"/></Style>
  <Style ss:ID="DataCenter"><Alignment ss:Horizontal="Center"/></Style>
  <Style ss:ID="DataRight"><Alignment ss:Horizontal="Right"/></Style>
 </Styles>

 <Worksheet ss:Name="Day_Summary">
  <Table ss:DefaultColumnWidth="140">
   <Row ss:Height="30"><Cell ss:StyleID="Title"><Data ss:Type="String">ITHI POORAM - DAILY CLOSING REPORT (${todayStr})</Data></Cell></Row>
   <Row ss:Height="20"><Cell ss:StyleID="DataLeft"><Data ss:Type="String">Total Paid Orders:</Data></Cell><Cell ss:StyleID="DataRight"><Data ss:Type="Number">${paidOrders.length}</Data></Cell></Row>
   <Row ss:Height="20"><Cell ss:StyleID="DataLeft"><Data ss:Type="String">Gross Revenue (INR):</Data></Cell><Cell ss:StyleID="DataRight"><Data ss:Type="Number">${(totalSalesPaise / 100).toFixed(2)}</Data></Cell></Row>
   <Row ss:Height="20"><Cell ss:StyleID="DataLeft"><Data ss:Type="String">Cash Revenue (INR):</Data></Cell><Cell ss:StyleID="DataRight"><Data ss:Type="Number">${(cashPaise / 100).toFixed(2)}</Data></Cell></Row>
   <Row ss:Height="20"><Cell ss:StyleID="DataLeft"><Data ss:Type="String">UPI Revenue (INR):</Data></Cell><Cell ss:StyleID="DataRight"><Data ss:Type="Number">${(upiPaise / 100).toFixed(2)}</Data></Cell></Row>
  </Table>
 </Worksheet>

 <Worksheet ss:Name="Item_Movement">
  <Table ss:DefaultColumnWidth="120">
   <Row ss:Height="22">
    <Cell ss:StyleID="Header"><Data ss:Type="String">Dish Name</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Qty Sold</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Revenue (INR)</Data></Cell>
   </Row>
${itemRowsXml}
  </Table>
 </Worksheet>

 <Worksheet ss:Name="Bills_Register">
  <Table ss:DefaultColumnWidth="120">
   <Row ss:Height="22">
    <Cell ss:StyleID="Header"><Data ss:Type="String">Order Ref</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Table</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Mode</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Amount (INR)</Data></Cell>
   </Row>
${invoiceRowsXml}
  </Table>
 </Worksheet>
</Workbook>`;

    fs.writeFileSync(excelFilePath, xlsContent, 'utf8');

    // Reset Table States for tomorrow morning
    for (const t of db.tables) {
      t.status = 'AVAILABLE';
      t.unpaidCount = 0;
      t.unpaidTotalPaise = 0;
    }

    db.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actionType: 'DAY_CLOSED_Z_REPORT',
      module: 'BILLING',
      usernameSnapshot: 'Cashier / Admin',
      reason: `Business day closed. Saved ${excelFileName} with ${(totalSalesPaise / 100).toFixed(2)} INR total.`,
      success: true,
    });

    persistDb();

    return NextResponse.json({
      success: true,
      message: `Day ${todayStr} closed successfully. Excel saved.`,
      summary: {
        date: todayStr,
        totalOrders: paidOrders.length,
        totalSalesPaise,
        cashPaise,
        upiPaise,
        excelFileName,
      },
    }, { headers: corsHeaders });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to close day' }, { status: 500, headers: corsHeaders });
  }
}
