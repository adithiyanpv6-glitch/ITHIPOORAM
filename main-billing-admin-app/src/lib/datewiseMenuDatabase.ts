// ============================================================================
// ITHI POORAM (ഇത്തിപ്പൂരം) — Datewise Menu Database & Excel Generator
// Stores daily menu records across all days and exports multi-sheet Excel (.xls)
// ============================================================================

export interface DailyMenuItemEntry {
  date: string; // YYYY-MM-DD
  id: string;
  name: string;
  malayalamName?: string;
  category: string;
  dietary: 'VEG' | 'NON_VEG' | 'SEAFOOD';
  priceInr: number;
  currentStock: number | null; // null = Unlimited
  isAvailable: boolean;
  station?: string;
  updatedAt: string;
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

export function generateDatewiseMenuExcelXml(
  todayItems: DailyMenuItemEntry[],
  allHistoryItems: DailyMenuItemEntry[],
  currentDate: string
): string {
  const generatedTimeStr = new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'full',
    timeStyle: 'medium',
  });

  const activeTodayCount = todayItems.filter((it) => it.isAvailable).length;
  const soldOutTodayCount = todayItems.length - activeTodayCount;
  const avgPriceToday = todayItems.length > 0 
    ? (todayItems.reduce((sum, it) => sum + it.priceInr, 0) / todayItems.length).toFixed(2)
    : '0.00';

  // Distinct dates in history
  const distinctDates = Array.from(new Set(allHistoryItems.map((h) => h.date))).sort().reverse();

  // Sheet 1: Today's Menu Rows
  const todayRows = todayItems.map((it, idx) => {
    const stockDisplay = it.currentStock !== null ? String(it.currentStock) : 'Unlimited';
    const statusText = it.isAvailable ? 'IN_STOCK' : 'SOLD_OUT';
    const statusStyle = it.isAvailable ? 'StatusActive' : 'StatusSoldOut';

    return `   <Row ss:Height="22">
    <Cell ss:StyleID="DataCenter"><Data ss:Type="String">${escapeXml(it.id || `M-${idx + 1}`)}</Data></Cell>
    <Cell ss:StyleID="DataLeft"><Data ss:Type="String">${escapeXml(it.name)}</Data></Cell>
    <Cell ss:StyleID="DataLeft"><Data ss:Type="String">${escapeXml(it.malayalamName || '—')}</Data></Cell>
    <Cell ss:StyleID="DataCenter"><Data ss:Type="String">${escapeXml(it.category || 'Special')}</Data></Cell>
    <Cell ss:StyleID="DataCenter"><Data ss:Type="String">${escapeXml(it.dietary || 'SEAFOOD')}</Data></Cell>
    <Cell ss:StyleID="DataRight"><Data ss:Type="Number">${it.priceInr.toFixed(2)}</Data></Cell>
    <Cell ss:StyleID="DataCenter"><Data ss:Type="String">${escapeXml(stockDisplay)}</Data></Cell>
    <Cell ss:StyleID="${statusStyle}"><Data ss:Type="String">${statusText}</Data></Cell>
    <Cell ss:StyleID="DataCenter"><Data ss:Type="String">${escapeXml(it.station || 'Main Kitchen')}</Data></Cell>
    <Cell ss:StyleID="DataCenter"><Data ss:Type="String">${escapeXml(it.date)}</Data></Cell>
   </Row>`;
  }).join('\n');

  // Sheet 2: Datewise History Master Rows
  const historyRows = allHistoryItems.map((it, idx) => {
    const stockDisplay = it.currentStock !== null ? String(it.currentStock) : 'Unlimited';
    const statusText = it.isAvailable ? 'IN_STOCK' : 'SOLD_OUT';
    const statusStyle = it.isAvailable ? 'StatusActive' : 'StatusSoldOut';

    return `   <Row ss:Height="21">
    <Cell ss:StyleID="DataCenter"><Data ss:Type="String">${escapeXml(it.date)}</Data></Cell>
    <Cell ss:StyleID="DataCenter"><Data ss:Type="String">${escapeXml(it.id || `M-${idx + 1}`)}</Data></Cell>
    <Cell ss:StyleID="DataLeft"><Data ss:Type="String">${escapeXml(it.name)}</Data></Cell>
    <Cell ss:StyleID="DataLeft"><Data ss:Type="String">${escapeXml(it.malayalamName || '—')}</Data></Cell>
    <Cell ss:StyleID="DataCenter"><Data ss:Type="String">${escapeXml(it.category || 'Special')}</Data></Cell>
    <Cell ss:StyleID="DataCenter"><Data ss:Type="String">${escapeXml(it.dietary || 'SEAFOOD')}</Data></Cell>
    <Cell ss:StyleID="DataRight"><Data ss:Type="Number">${it.priceInr.toFixed(2)}</Data></Cell>
    <Cell ss:StyleID="DataCenter"><Data ss:Type="String">${escapeXml(stockDisplay)}</Data></Cell>
    <Cell ss:StyleID="${statusStyle}"><Data ss:Type="String">${statusText}</Data></Cell>
    <Cell ss:StyleID="DataCenter"><Data ss:Type="String">${escapeXml(it.updatedAt ? it.updatedAt.slice(11, 19) : '')}</Data></Cell>
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
  <Title>Ithi Pooram - Datewise Menu Database</Title>
  <Subject>Daily Restaurant Menu Ledger &amp; Datewise History</Subject>
  <Author>Ithi Pooram Restaurant Suite</Author>
  <Created>${new Date().toISOString()}</Created>
 </DocumentProperties>
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#1E242B"/>
  </Style>
  <Style ss:ID="HeaderTitle">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="16" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#9E341D" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="SubHeader">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="10" ss:Italic="1" ss:Color="#F4EDE4"/>
   <Interior ss:Color="#7D2411" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="ColHeader">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#1E242B" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#0F1216"/>
   </Borders>
  </Style>
  <Style ss:ID="KpiLabel">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="10" ss:Bold="1" ss:Color="#64748B"/>
   <Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="All" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <Style ss:ID="KpiVal">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#0F172A"/>
   <Interior ss:Color="#FFFFFF" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="All" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <Style ss:ID="DataLeft">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <Style ss:ID="DataCenter">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <Style ss:ID="DataRight">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <NumberFormat ss:Format="#,##0.00"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <Style ss:ID="StatusActive">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="10" ss:Bold="1" ss:Color="#166534"/>
   <Interior ss:Color="#DCFCE7" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <Style ss:ID="StatusSoldOut">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="10" ss:Bold="1" ss:Color="#991B1B"/>
   <Interior ss:Color="#FEE2E2" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
 </Styles>

 <!-- SHEET 1: TODAY'S LIVE MENU -->
 <Worksheet ss:Name="Today's Live Menu">
  <Table ss:DefaultRowHeight="20">
   <Column ss:Width="70"/>
   <Column ss:Width="200"/>
   <Column ss:Width="170"/>
   <Column ss:Width="130"/>
   <Column ss:Width="90"/>
   <Column ss:Width="110"/>
   <Column ss:Width="90"/>
   <Column ss:Width="100"/>
   <Column ss:Width="120"/>
   <Column ss:Width="90"/>

   <Row ss:Height="36">
    <Cell ss:MergeAcross="9" ss:StyleID="HeaderTitle"><Data ss:Type="String">  ഇത്തിപ്പൂരം (ITHI POORAM) — TODAY'S LIVE MENU</Data></Cell>
   </Row>
   <Row ss:Height="22">
    <Cell ss:MergeAcross="9" ss:StyleID="SubHeader"><Data ss:Type="String">  Date: ${escapeXml(currentDate)} | Generated: ${escapeXml(generatedTimeStr)} | Net Final Prices (GST Inclusive)</Data></Cell>
   </Row>

   <!-- Summary KPI Strip -->
   <Row ss:Height="20"/>
   <Row ss:Height="22">
    <Cell ss:StyleID="KpiLabel"><Data ss:Type="String">Total Dishes Configured</Data></Cell>
    <Cell ss:StyleID="KpiVal"><Data ss:Type="Number">${todayItems.length}</Data></Cell>
    <Cell ss:StyleID="KpiLabel"><Data ss:Type="String">Dishes In Stock</Data></Cell>
    <Cell ss:StyleID="KpiVal"><Data ss:Type="Number">${activeTodayCount}</Data></Cell>
    <Cell ss:StyleID="KpiLabel"><Data ss:Type="String">Sold Out Dishes</Data></Cell>
    <Cell ss:StyleID="KpiVal"><Data ss:Type="Number">${soldOutTodayCount}</Data></Cell>
    <Cell ss:StyleID="KpiLabel"><Data ss:Type="String">Average Dish Price (INR)</Data></Cell>
    <Cell ss:StyleID="KpiVal"><Data ss:Type="Number">${avgPriceToday}</Data></Cell>
    <Cell ss:StyleID="KpiLabel"><Data ss:Type="String">Historical Days Logged</Data></Cell>
    <Cell ss:StyleID="KpiVal"><Data ss:Type="Number">${distinctDates.length}</Data></Cell>
   </Row>
   <Row ss:Height="14"/>

   <!-- Table Header -->
   <Row ss:Height="26">
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Item ID</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Dish Name (English)</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">പേര് (Malayalam)</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Category</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Dietary</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Final Price (₹ INR)</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Stock Available</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Live Status</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Station</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Menu Date</Data></Cell>
   </Row>

   <!-- Items Rows -->
   ${todayRows || `   <Row ss:Height="24"><Cell ss:MergeAcross="9" ss:StyleID="DataCenter"><Data ss:Type="String">No menu items added yet for today. Use Admin Console to add dishes.</Data></Cell></Row>`}
  </Table>
 </Worksheet>

 <!-- SHEET 2: DATEWISE MENU ARCHIVE -->
 <Worksheet ss:Name="Datewise Menu Archive">
  <Table ss:DefaultRowHeight="20">
   <Column ss:Width="95"/>
   <Column ss:Width="70"/>
   <Column ss:Width="200"/>
   <Column ss:Width="170"/>
   <Column ss:Width="130"/>
   <Column ss:Width="90"/>
   <Column ss:Width="110"/>
   <Column ss:Width="90"/>
   <Column ss:Width="100"/>
   <Column ss:Width="95"/>

   <Row ss:Height="36">
    <Cell ss:MergeAcross="9" ss:StyleID="HeaderTitle"><Data ss:Type="String">  ITHI POORAM — DATEWISE MENU ARCHIVE &amp; AUDIT LEDGER</Data></Cell>
   </Row>
   <Row ss:Height="22">
    <Cell ss:MergeAcross="9" ss:StyleID="SubHeader"><Data ss:Type="String">  Permanent Day-by-Day Historical Record | Total Entries: ${allHistoryItems.length} | Days Logged: ${distinctDates.length}</Data></Cell>
   </Row>

   <Row ss:Height="14"/>

   <!-- Table Header -->
   <Row ss:Height="26">
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Record Date</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Item ID</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Dish Name (English)</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">പേര് (Malayalam)</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Category</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Dietary</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Final Price (₹ INR)</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Stock</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Status</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Logged Time</Data></Cell>
   </Row>

   <!-- History Rows -->
   ${historyRows || `   <Row ss:Height="24"><Cell ss:MergeAcross="9" ss:StyleID="DataCenter"><Data ss:Type="String">No historical datewise menu entries recorded yet.</Data></Cell></Row>`}
  </Table>
 </Worksheet>
</Workbook>`;
}
