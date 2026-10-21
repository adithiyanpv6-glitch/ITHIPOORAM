// Daily Menu Database & Multi-Sheet Excel Generator for Ithi Pooram (ഇത്തിപ്പൂരം)
// Generates native Microsoft Office XML Spreadsheet (.xls) compatible with Google Sheets & MS Excel.

export interface MenuItemRecord {
  id: string;
  name: string;
  malayalamName?: string;
  category: string;
  pricePaise: number;
  currentStock: number | null; // null = Unlimited
  isAvailable: boolean;
  image?: string;
  station?: string;
  dietary?: 'VEG' | 'NON_VEG' | 'SEAFOOD';
  dateRecorded?: string; // YYYY-MM-DD
}

function escapeXml(str: string | number | undefined | null): string {
  if (str === undefined || str === null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function generateDailyMenuExcelXml(
  items: MenuItemRecord[],
  targetDate: string
): string {
  const generatedTimeStr = new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'full',
    timeStyle: 'medium',
  });

  const activeCount = items.filter((it) => it.isAvailable).length;
  const soldOutCount = items.length - activeCount;
  const totalStockCount = items.reduce((sum, it) => sum + (it.currentStock || 0), 0);
  const avgPriceInr = items.length > 0 
    ? (items.reduce((sum, it) => sum + it.pricePaise, 0) / items.length / 100).toFixed(2)
    : '0.00';

  // Category counts
  const catMap: Record<string, { count: number; totalPaise: number }> = {};
  for (const it of items) {
    const c = it.category || 'General';
    if (!catMap[c]) catMap[c] = { count: 0, totalPaise: 0 };
    catMap[c].count++;
    catMap[c].totalPaise += it.pricePaise;
  }

  const categoryRows = Object.entries(catMap).map(([cat, data]) => {
    const avg = (data.totalPaise / data.count / 100).toFixed(2);
    return `   <Row ss:Height="22">
    <Cell ss:StyleID="DataCenter"><Data ss:Type="String">${escapeXml(cat)}</Data></Cell>
    <Cell ss:StyleID="DataCenter"><Data ss:Type="Number">${data.count}</Data></Cell>
    <Cell ss:StyleID="DataRight"><Data ss:Type="Number">${avg}</Data></Cell>
   </Row>`;
  }).join('\n');

  const itemRows = items.map((it, idx) => {
    const priceInr = (it.pricePaise / 100).toFixed(2);
    const stockDisplay = it.currentStock !== null ? String(it.currentStock) : 'Unlimited';
    const statusText = it.isAvailable ? 'IN_STOCK' : 'SOLD_OUT';
    const statusStyle = it.isAvailable ? 'StatusActive' : 'StatusSoldOut';

    return `   <Row ss:Height="22">
    <Cell ss:StyleID="DataCenter"><Data ss:Type="String">${escapeXml(it.id || `M-${idx + 1}`)}</Data></Cell>
    <Cell ss:StyleID="DataLeft"><Data ss:Type="String">${escapeXml(it.name)}</Data></Cell>
    <Cell ss:StyleID="DataLeft"><Data ss:Type="String">${escapeXml(it.malayalamName || '—')}</Data></Cell>
    <Cell ss:StyleID="DataCenter"><Data ss:Type="String">${escapeXml(it.category || 'General')}</Data></Cell>
    <Cell ss:StyleID="DataCenter"><Data ss:Type="String">${escapeXml(it.dietary || 'SEAFOOD')}</Data></Cell>
    <Cell ss:StyleID="DataRight"><Data ss:Type="Number">${priceInr}</Data></Cell>
    <Cell ss:StyleID="DataCenter"><Data ss:Type="String">${escapeXml(stockDisplay)}</Data></Cell>
    <Cell ss:StyleID="${statusStyle}"><Data ss:Type="String">${statusText}</Data></Cell>
    <Cell ss:StyleID="DataCenter"><Data ss:Type="String">${escapeXml(targetDate)}</Data></Cell>
   </Row>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
  <Title>Ithi Pooram - Daily Menu Database</Title>
  <Subject>Daily Restaurant Menu Ledger (${escapeXml(targetDate)})</Subject>
  <Author>Ithi Pooram Executive Engine</Author>
  <Created>${new Date().toISOString()}</Created>
 </DocumentProperties>
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#1E242B"/>
  </Style>
  <Style ss:ID="HeaderTitle">
   <Font ss:FontName="Calibri" ss:Size="16" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#9E341D" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="SubHeader">
   <Font ss:FontName="Calibri" ss:Size="10" ss:Italic="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#822814" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="KpiLabel">
   <Font ss:FontName="Calibri" ss:Size="10" ss:Bold="1" ss:Color="#555555"/>
   <Interior ss:Color="#F4EFEA" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D4AF37"/></Borders>
  </Style>
  <Style ss:ID="KpiValue">
   <Font ss:FontName="Calibri" ss:Size="12" ss:Bold="1" ss:Color="#9E341D"/>
   <Interior ss:Color="#FFFFFF" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D4AF37"/></Borders>
  </Style>
  <Style ss:ID="ColumnHeader">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#9E341D" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#D4AF37"/>
   </Borders>
  </Style>
  <Style ss:ID="DataLeft">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E5DFD7"/></Borders>
  </Style>
  <Style ss:ID="DataCenter">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E5DFD7"/></Borders>
  </Style>
  <Style ss:ID="DataRight">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <NumberFormat ss:Format="#,##0.00"/>
   <Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E5DFD7"/></Borders>
  </Style>
  <Style ss:ID="StatusActive">
   <Font ss:FontName="Calibri" ss:Size="10" ss:Bold="1" ss:Color="#15803D"/>
   <Interior ss:Color="#DCFCE7" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E5DFD7"/></Borders>
  </Style>
  <Style ss:ID="StatusSoldOut">
   <Font ss:FontName="Calibri" ss:Size="10" ss:Bold="1" ss:Color="#B91C1C"/>
   <Interior ss:Color="#FEE2E2" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E5DFD7"/></Borders>
  </Style>
  <Style ss:ID="TotalFooter">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#9E341D"/>
   <Interior ss:Color="#FEF3C7" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#9E341D"/>
    <Border ss:Position="Bottom" ss:LineStyle="Double" ss:Weight="3" ss:Color="#9E341D"/>
   </Borders>
  </Style>
 </Styles>

 <Worksheet ss:Name="Daily_Menu_${escapeXml(targetDate.replace(/-/g, '_'))}">
  <Table ss:DefaultRowHeight="20">
   <Column ss:Width="70"/>
   <Column ss:Width="200"/>
   <Column ss:Width="170"/>
   <Column ss:Width="130"/>
   <Column ss:Width="90"/>
   <Column ss:Width="90"/>
   <Column ss:Width="100"/>
   <Column ss:Width="100"/>
   <Column ss:Width="90"/>

   <Row ss:Height="36">
    <Cell ss:MergeAcross="8" ss:StyleID="HeaderTitle"><Data ss:Type="String">  ITHI POORAM (ഇത്തിപ്പൂരം) — DAILY MENU DATABASE</Data></Cell>
   </Row>
   <Row ss:Height="22">
    <Cell ss:MergeAcross="8" ss:StyleID="SubHeader"><Data ss:Type="String">  Operational Date: ${escapeXml(targetDate)}  |  Exported: ${escapeXml(generatedTimeStr)}</Data></Cell>
   </Row>

   <!-- Summary KPI Block -->
   <Row ss:Height="10"/>
   <Row ss:Height="20">
    <Cell ss:MergeAcross="1" ss:StyleID="KpiLabel"><Data ss:Type="String">Total Dishes</Data></Cell>
    <Cell ss:MergeAcross="1" ss:StyleID="KpiLabel"><Data ss:Type="String">Live In-Stock</Data></Cell>
    <Cell ss:MergeAcross="1" ss:StyleID="KpiLabel"><Data ss:Type="String">Sold Out</Data></Cell>
    <Cell ss:MergeAcross="1" ss:StyleID="KpiLabel"><Data ss:Type="String">Available Portions</Data></Cell>
    <Cell ss:StyleID="KpiLabel"><Data ss:Type="String">Avg Price (INR)</Data></Cell>
   </Row>
   <Row ss:Height="26">
    <Cell ss:MergeAcross="1" ss:StyleID="KpiValue"><Data ss:Type="Number">${items.length}</Data></Cell>
    <Cell ss:MergeAcross="1" ss:StyleID="KpiValue"><Data ss:Type="Number">${activeCount}</Data></Cell>
    <Cell ss:MergeAcross="1" ss:StyleID="KpiValue"><Data ss:Type="Number">${soldOutCount}</Data></Cell>
    <Cell ss:MergeAcross="1" ss:StyleID="KpiValue"><Data ss:Type="Number">${totalStockCount}</Data></Cell>
    <Cell ss:StyleID="KpiValue"><Data ss:Type="Number">${avgPriceInr}</Data></Cell>
   </Row>
   <Row ss:Height="12"/>

   <!-- Table Headers -->
   <Row ss:Height="26">
    <Cell ss:StyleID="ColumnHeader"><Data ss:Type="String">Item ID</Data></Cell>
    <Cell ss:StyleID="ColumnHeader"><Data ss:Type="String">Dish Name (English)</Data></Cell>
    <Cell ss:StyleID="ColumnHeader"><Data ss:Type="String">Malayalam Script</Data></Cell>
    <Cell ss:StyleID="ColumnHeader"><Data ss:Type="String">Category</Data></Cell>
    <Cell ss:StyleID="ColumnHeader"><Data ss:Type="String">Dietary</Data></Cell>
    <Cell ss:StyleID="ColumnHeader"><Data ss:Type="String">Price (INR)</Data></Cell>
    <Cell ss:StyleID="ColumnHeader"><Data ss:Type="String">Stock Left</Data></Cell>
    <Cell ss:StyleID="ColumnHeader"><Data ss:Type="String">Status</Data></Cell>
    <Cell ss:StyleID="ColumnHeader"><Data ss:Type="String">Date</Data></Cell>
   </Row>

   <!-- Data Rows -->
${itemRows}

   <!-- Footer Total Row -->
   <Row ss:Height="26">
    <Cell ss:MergeAcross="4" ss:StyleID="TotalFooter"><Data ss:Type="String">TOTAL ACTIVE DISHES</Data></Cell>
    <Cell ss:StyleID="TotalFooter"><Data ss:Type="String">₹${avgPriceInr} Avg</Data></Cell>
    <Cell ss:StyleID="TotalFooter"><Data ss:Type="Number">${totalStockCount}</Data></Cell>
    <Cell ss:MergeAcross="1" ss:StyleID="TotalFooter"><Data ss:Type="String">${activeCount} / ${items.length} Live</Data></Cell>
   </Row>
  </Table>
 </Worksheet>

 <Worksheet ss:Name="Category_Summary">
  <Table ss:DefaultRowHeight="20">
   <Column ss:Width="200"/>
   <Column ss:Width="120"/>
   <Column ss:Width="140"/>
   <Row ss:Height="28">
    <Cell ss:MergeAcross="2" ss:StyleID="HeaderTitle"><Data ss:Type="String">  CATEGORY BREAKDOWN — ${escapeXml(targetDate)}</Data></Cell>
   </Row>
   <Row ss:Height="24">
    <Cell ss:StyleID="ColumnHeader"><Data ss:Type="String">Category</Data></Cell>
    <Cell ss:StyleID="ColumnHeader"><Data ss:Type="String">Dish Count</Data></Cell>
    <Cell ss:StyleID="ColumnHeader"><Data ss:Type="String">Average Price (INR)</Data></Cell>
   </Row>
${categoryRows}
  </Table>
 </Worksheet>
</Workbook>`;
}

export function generateDailyMenuCsv(items: MenuItemRecord[], targetDate: string): string {
  const header = 'Item ID,Dish Name,Malayalam Name,Category,Dietary,Price (INR),Stock Available,Status,Date Recorded\n';
  const rows = items.map((it, idx) => {
    const priceInr = (it.pricePaise / 100).toFixed(2);
    const stockDisplay = it.currentStock !== null ? it.currentStock : 'Unlimited';
    const statusText = it.isAvailable ? 'IN_STOCK' : 'SOLD_OUT';
    const safeName = `"${(it.name || '').replace(/"/g, '""')}"`;
    const safeMal = `"${(it.malayalamName || '').replace(/"/g, '""')}"`;
    const safeCat = `"${(it.category || '').replace(/"/g, '""')}"`;
    return `${it.id || `M-${idx + 1}`},${safeName},${safeMal},${safeCat},${it.dietary || 'SEAFOOD'},${priceInr},${stockDisplay},${statusText},${targetDate}`;
  });
  return header + rows.join('\n');
}
