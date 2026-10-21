// Multi-Sheet Excel & Google Sheets Database Generator for Ithi Pooram (ഇത്തിപ്പൂരം)
// Generates native Microsoft Office XML Spreadsheet (.xls) compatible with Google Sheets & MS Excel.
// Architecture:
// - Sheet 1: Master Table Registry (Summary of all tables, capacities, QR links, order counts & revenue)
// - Sheet 2..N: Dedicated individual sheets for each generated table with full order history & items.

import { RestaurantTable, RestaurantOrder } from './serverDb';

function escapeXml(str: string | number | undefined | null): string {
  if (str === undefined || str === null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function sanitizeSheetName(name: string): string {
  // Excel sheet names max 31 characters, cannot contain: \ / ? * [ ] :
  const cleaned = name.replace(/[\\/?*\[\]:]/g, '_').trim();
  return (cleaned.slice(0, 28) || 'Table').padEnd(3, '_');
}

export function generateMultiSheetTableExcelXml(
  tables: Array<{
    id?: string;
    tableCode: string;
    displayName: string;
    capacity: number;
    roomName?: string;
    status?: string;
    url?: string;
    unpaidCount?: number;
    unpaidTotalPaise?: number;
  }>,
  orders: RestaurantOrder[] = []
): string {
  const generatedTimeStr = new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'full',
    timeStyle: 'medium',
  });

  // Calculate table metrics
  const tableMetrics = tables.map((t) => {
    const tableOrders = orders.filter(
      (o) => o.tableCode.toUpperCase() === t.tableCode.toUpperCase()
    );
    const totalRevenuePaise = tableOrders.reduce((sum, o) => sum + (o.grandTotalPaise || 0), 0);
    const totalItemsCount = tableOrders.reduce(
      (sum, o) => sum + (o.items?.reduce((iSum, it) => iSum + (it.quantity || 1), 0) || 0),
      0
    );

    return {
      ...t,
      orders: tableOrders,
      orderCount: tableOrders.length,
      revenuePaise: totalRevenuePaise,
      itemsCount: totalItemsCount,
    };
  });

  const grandTotalRevenuePaise = tableMetrics.reduce((sum, t) => sum + t.revenuePaise, 0);
  const grandTotalOrdersCount = tableMetrics.reduce((sum, t) => sum + t.orderCount, 0);
  const grandTotalSeats = tables.reduce((sum, t) => sum + (t.capacity || 4), 0);

  // XML Header & Styles
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
  <Author>ITHI POORAM Admin POS</Author>
  <LastAuthor>ITHI POORAM Admin POS</LastAuthor>
  <Created>${new Date().toISOString()}</Created>
  <Company>ITHI POORAM Heritage Restaurant</Company>
 </DocumentProperties>
 <Styles>
  <!-- Base Normal -->
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Borders/>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#1F2937"/>
   <Interior/>
   <NumberFormat/>
   <Protection/>
  </Style>

  <!-- Big Brand Banner -->
  <Style ss:ID="BrandHeader">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#9E341D"/>
   </Borders>
   <Font ss:FontName="Segoe UI" x:Family="Swiss" ss:Size="16" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#9E341D" ss:Pattern="Solid"/>
  </Style>

  <!-- Subtitle Bar -->
  <Style ss:ID="BrandSubHeader">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D4AF37"/>
   </Borders>
   <Font ss:FontName="Segoe UI" x:Family="Swiss" ss:Size="10" ss:Italic="1" ss:Color="#374151"/>
   <Interior ss:Color="#FDF8F0" ss:Pattern="Solid"/>
  </Style>

  <!-- Section Title -->
  <Style ss:ID="SectionTitle">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" x:Family="Swiss" ss:Size="12" ss:Bold="1" ss:Color="#9E341D"/>
   <Interior ss:Color="#F5ECE4" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#9E341D"/>
   </Borders>
  </Style>

  <!-- Table Column Header -->
  <Style ss:ID="TableHeader">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#4B5563"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D1D5DB"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D1D5DB"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D1D5DB"/>
   </Borders>
   <Font ss:FontName="Segoe UI" x:Family="Swiss" ss:Size="10" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#1F2937" ss:Pattern="Solid"/>
  </Style>

  <!-- Gold Summary Header -->
  <Style ss:ID="SummaryHeader">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#9E341D"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D4AF37"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D4AF37"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D4AF37"/>
   </Borders>
   <Font ss:FontName="Segoe UI" x:Family="Swiss" ss:Size="10" ss:Bold="1" ss:Color="#78350F"/>
   <Interior ss:Color="#FEF3C7" ss:Pattern="Solid"/>
  </Style>

  <!-- Data Cells -->
  <Style ss:ID="DataCellCenter">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E5E7EB"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E5E7EB"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E5E7EB"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E5E7EB"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="10" ss:Color="#111827"/>
  </Style>

  <Style ss:ID="DataCellLeft">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E5E7EB"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E5E7EB"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E5E7EB"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E5E7EB"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="10" ss:Color="#111827"/>
  </Style>

  <Style ss:ID="DataCellRight">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E5E7EB"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E5E7EB"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E5E7EB"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E5E7EB"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="10" ss:Color="#111827"/>
  </Style>

  <Style ss:ID="DataCellCurrency">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E5E7EB"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E5E7EB"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E5E7EB"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E5E7EB"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="10" ss:Bold="1" ss:Color="#065F46"/>
   <NumberFormat ss:Format="₹#,##0.00"/>
  </Style>

  <!-- Status Badges -->
  <Style ss:ID="StatusAvailable">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Size="9" ss:Bold="1" ss:Color="#065F46"/>
   <Interior ss:Color="#D1FAE5" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#A7F3D0"/>
   </Borders>
  </Style>

  <Style ss:ID="StatusActive">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Size="9" ss:Bold="1" ss:Color="#9A3412"/>
   <Interior ss:Color="#FFEDD5" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FDBA74"/>
   </Borders>
  </Style>

  <Style ss:ID="TotalRow">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Size="11" ss:Bold="1" ss:Color="#111827"/>
   <Interior ss:Color="#F3F4F6" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#4B5563"/>
    <Border ss:Position="Bottom" ss:LineStyle="Double" ss:Weight="3" ss:Color="#4B5563"/>
   </Borders>
  </Style>

  <Style ss:ID="TotalRowCurrency">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Size="11" ss:Bold="1" ss:Color="#065F46"/>
   <Interior ss:Color="#ECFDF5" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#047857"/>
    <Border ss:Position="Bottom" ss:LineStyle="Double" ss:Weight="3" ss:Color="#047857"/>
   </Borders>
   <NumberFormat ss:Format="₹#,##0.00"/>
  </Style>
 </Styles>
`;

  // ==========================================
  // SHEET 1: TABLES MASTER REGISTRY
  // ==========================================
  xml += `
 <Worksheet ss:Name="Tables_Master_Registry">
  <Table ss:DefaultColumnWidth="90" ss:DefaultRowHeight="22">
   <Column ss:Index="1" ss:Width="70"/>   <!-- Table Code -->
   <Column ss:Index="2" ss:Width="160"/>  <!-- Display Name -->
   <Column ss:Index="3" ss:Width="120"/>  <!-- Room / Area -->
   <Column ss:Index="4" ss:Width="70"/>   <!-- Capacity -->
   <Column ss:Index="5" ss:Width="100"/>  <!-- Status -->
   <Column ss:Index="6" ss:Width="90"/>   <!-- Total Orders -->
   <Column ss:Index="7" ss:Width="90"/>   <!-- Total Items -->
   <Column ss:Index="8" ss:Width="110"/>  <!-- Total Bill (₹) -->
   <Column ss:Index="9" ss:Width="250"/>  <!-- QR Order URL -->

   <!-- Banner Row -->
   <Row ss:Height="40">
    <Cell ss:MergeAcross="8" ss:StyleID="BrandHeader">
     <Data ss:Type="String">ITHI POORAM (ഇത്തിപ്പൂരം) — Table Master Registry &amp; Live Orders</Data>
    </Cell>
   </Row>

   <!-- Subtitle Row -->
   <Row ss:Height="24">
    <Cell ss:MergeAcross="8" ss:StyleID="BrandSubHeader">
     <Data ss:Type="String">Generated: ${escapeXml(generatedTimeStr)} | Location: Vanchiyoor, Trivandrum | Total Tables: ${tables.length}</Data>
    </Cell>
   </Row>

   <!-- Empty Row -->
   <Row ss:Height="14"/>

   <!-- Table Headers -->
   <Row ss:Height="26">
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Table Code</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Table Name</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Room / Section</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Capacity</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Status</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Orders Logged</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Dishes Served</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Gross Total (₹)</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Direct QR Customer Link</Data></Cell>
   </Row>
`;

  // Rows for each table in Master Registry
  tableMetrics.forEach((t) => {
    const isAvailable = (t.orders.length === 0 || t.status === 'AVAILABLE');
    const statusStyle = isAvailable ? 'StatusAvailable' : 'StatusActive';
    const statusText = isAvailable ? 'AVAILABLE' : `${t.orderCount} ORDER(S)`;

    xml += `
   <Row ss:Height="22">
    <Cell ss:StyleID="DataCellCenter"><Data ss:Type="String">${escapeXml(t.tableCode)}</Data></Cell>
    <Cell ss:StyleID="DataCellLeft"><Data ss:Type="String">${escapeXml(t.displayName)}</Data></Cell>
    <Cell ss:StyleID="DataCellLeft"><Data ss:Type="String">${escapeXml(t.roomName || 'Dining Area')}</Data></Cell>
    <Cell ss:StyleID="DataCellCenter"><Data ss:Type="Number">${t.capacity || 4}</Data></Cell>
    <Cell ss:StyleID="${statusStyle}"><Data ss:Type="String">${statusText}</Data></Cell>
    <Cell ss:StyleID="DataCellCenter"><Data ss:Type="Number">${t.orderCount}</Data></Cell>
    <Cell ss:StyleID="DataCellCenter"><Data ss:Type="Number">${t.itemsCount}</Data></Cell>
    <Cell ss:StyleID="DataCellCurrency"><Data ss:Type="Number">${(t.revenuePaise / 100).toFixed(2)}</Data></Cell>
    <Cell ss:StyleID="DataCellLeft"><Data ss:Type="String">${escapeXml(t.url || `https://customer-mobile-ithipooram.vercel.app?table=${t.tableCode}`)}</Data></Cell>
   </Row>`;
  });

  // Master Summary Row
  xml += `
   <Row ss:Height="26">
    <Cell ss:MergeAcross="2" ss:StyleID="TotalRow"><Data ss:Type="String">GRAND TOTALS (${tables.length} Tables):</Data></Cell>
    <Cell ss:StyleID="TotalRow"><Data ss:Type="Number">${grandTotalSeats}</Data></Cell>
    <Cell ss:StyleID="TotalRow"><Data ss:Type="String">—</Data></Cell>
    <Cell ss:StyleID="TotalRow"><Data ss:Type="Number">${grandTotalOrdersCount}</Data></Cell>
    <Cell ss:StyleID="TotalRow"><Data ss:Type="String">—</Data></Cell>
    <Cell ss:StyleID="TotalRowCurrency"><Data ss:Type="Number">${(grandTotalRevenuePaise / 100).toFixed(2)}</Data></Cell>
    <Cell ss:StyleID="TotalRow"><Data ss:Type="String">—</Data></Cell>
   </Row>
  </Table>
 </Worksheet>
`;

  // ==========================================
  // SHEET 2..N: DEDICATED SHEET FOR EACH TABLE
  // ==========================================
  tableMetrics.forEach((t) => {
    const rawSheetName = `Table_${t.tableCode}`;
    const safeSheetName = sanitizeSheetName(rawSheetName);

    xml += `
 <Worksheet ss:Name="${escapeXml(safeSheetName)}">
  <Table ss:DefaultColumnWidth="90" ss:DefaultRowHeight="22">
   <Column ss:Index="1" ss:Width="80"/>   <!-- Order ID -->
   <Column ss:Index="2" ss:Width="85"/>   <!-- Date -->
   <Column ss:Index="3" ss:Width="75"/>   <!-- Time -->
   <Column ss:Index="4" ss:Width="110"/>  <!-- Phone Session -->
   <Column ss:Index="5" ss:Width="75"/>   <!-- Round -->
   <Column ss:Index="6" ss:Width="280"/>  <!-- Ordered Dishes & Quantities -->
   <Column ss:Index="7" ss:Width="85"/>   <!-- Subtotal (₹) -->
   <Column ss:Index="8" ss:Width="75"/>   <!-- CGST 2.5% -->
   <Column ss:Index="9" ss:Width="75"/>   <!-- SGST 2.5% -->
   <Column ss:Index="10" ss:Width="95"/>  <!-- Grand Total (₹) -->
   <Column ss:Index="11" ss:Width="90"/>  <!-- Kitchen Status -->
   <Column ss:Index="12" ss:Width="85"/>  <!-- Payment -->
   <Column ss:Index="13" ss:Width="80"/>  <!-- Mode -->

   <!-- Banner for Table -->
   <Row ss:Height="36">
    <Cell ss:MergeAcross="12" ss:StyleID="BrandHeader">
     <Data ss:Type="String">ITHI POORAM — ${escapeXml(t.displayName.toUpperCase())} [${escapeXml(t.tableCode)}]</Data>
    </Cell>
   </Row>

   <!-- Table Metadata -->
   <Row ss:Height="22">
    <Cell ss:MergeAcross="12" ss:StyleID="BrandSubHeader">
     <Data ss:Type="String">Room/Section: ${escapeXml(t.roomName || 'Dining Area')} | Seating Capacity: ${t.capacity || 4} Guests | QR Table Code: ${escapeXml(t.tableCode)} | Live Status: ${t.orderCount > 0 ? `${t.orderCount} Orders Active` : 'Available'}</Data>
    </Cell>
   </Row>

   <Row ss:Height="12"/>

   <!-- Table Orders Header -->
   <Row ss:Height="26">
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Order ID</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Date</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Time</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Customer Session</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Round</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Ordered Dishes &amp; Quantities</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Subtotal (₹)</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">CGST (₹)</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">SGST (₹)</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Grand Total (₹)</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Kitchen Status</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Payment</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Mode</Data></Cell>
   </Row>
`;

    if (t.orders.length === 0) {
      xml += `
   <Row ss:Height="28">
    <Cell ss:MergeAcross="12" ss:StyleID="DataCellCenter">
     <Data ss:Type="String">No customer orders recorded yet for Table ${escapeXml(t.tableCode)}. Orders scanned through QR will sync here in real time.</Data>
    </Cell>
   </Row>`;
    } else {
      t.orders.forEach((o) => {
        const orderDate = new Date(o.createdAt || Date.now());
        const dateStr = orderDate.toLocaleDateString('en-GB');
        const timeStr = orderDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        
        // Format dishes list
        const dishesText = (o.items || [])
          .map((it) => `${it.itemName}${it.itemMalayalamName ? ` (${it.itemMalayalamName})` : ''} x${it.quantity}`)
          .join('; ');

        const roundLabel = (o.roundCount && o.roundCount > 1) ? `Round ${o.roundCount} (Add-on)` : 'Initial Order';
        const subtotal = (o.subtotalPaise || 0) / 100;
        const cgst = (o.cgstPaise || 0) / 100;
        const sgst = (o.sgstPaise || 0) / 100;
        const grandTotal = (o.grandTotalPaise || 0) / 100;

        xml += `
   <Row ss:Height="24">
    <Cell ss:StyleID="DataCellCenter"><Data ss:Type="String">${escapeXml(o.customerCode || o.id)}</Data></Cell>
    <Cell ss:StyleID="DataCellCenter"><Data ss:Type="String">${escapeXml(dateStr)}</Data></Cell>
    <Cell ss:StyleID="DataCellCenter"><Data ss:Type="String">${escapeXml(timeStr)}</Data></Cell>
    <Cell ss:StyleID="DataCellCenter"><Data ss:Type="String">${escapeXml(o.deviceSessionId ? o.deviceSessionId.slice(0, 16) : 'Direct-POS')}</Data></Cell>
    <Cell ss:StyleID="DataCellCenter"><Data ss:Type="String">${escapeXml(roundLabel)}</Data></Cell>
    <Cell ss:StyleID="DataCellLeft"><Data ss:Type="String">${escapeXml(dishesText)}</Data></Cell>
    <Cell ss:StyleID="DataCellCurrency"><Data ss:Type="Number">${subtotal.toFixed(2)}</Data></Cell>
    <Cell ss:StyleID="DataCellCurrency"><Data ss:Type="Number">${cgst.toFixed(2)}</Data></Cell>
    <Cell ss:StyleID="DataCellCurrency"><Data ss:Type="Number">${sgst.toFixed(2)}</Data></Cell>
    <Cell ss:StyleID="DataCellCurrency"><Data ss:Type="Number">${grandTotal.toFixed(2)}</Data></Cell>
    <Cell ss:StyleID="DataCellCenter"><Data ss:Type="String">${escapeXml(o.fulfillmentStatus || 'NEW')}</Data></Cell>
    <Cell ss:StyleID="DataCellCenter"><Data ss:Type="String">${escapeXml(o.paymentStatus || 'UNPAID')}</Data></Cell>
    <Cell ss:StyleID="DataCellCenter"><Data ss:Type="String">${escapeXml(o.paymentMode || 'PENDING')}</Data></Cell>
   </Row>`;
      });

      // Table specific summary row
      const subtotalTotal = t.orders.reduce((sum, o) => sum + (o.subtotalPaise || 0), 0) / 100;
      const cgstTotal = t.orders.reduce((sum, o) => sum + (o.cgstPaise || 0), 0) / 100;
      const sgstTotal = t.orders.reduce((sum, o) => sum + (o.sgstPaise || 0), 0) / 100;
      const grandTotal = t.revenuePaise / 100;

      xml += `
   <Row ss:Height="26">
    <Cell ss:MergeAcross="5" ss:StyleID="TotalRow"><Data ss:Type="String">TOTALS FOR TABLE ${escapeXml(t.tableCode)} (${t.orders.length} Orders):</Data></Cell>
    <Cell ss:StyleID="TotalRowCurrency"><Data ss:Type="Number">${subtotalTotal.toFixed(2)}</Data></Cell>
    <Cell ss:StyleID="TotalRowCurrency"><Data ss:Type="Number">${cgstTotal.toFixed(2)}</Data></Cell>
    <Cell ss:StyleID="TotalRowCurrency"><Data ss:Type="Number">${sgstTotal.toFixed(2)}</Data></Cell>
    <Cell ss:StyleID="TotalRowCurrency"><Data ss:Type="Number">${grandTotal.toFixed(2)}</Data></Cell>
    <Cell ss:MergeAcross="2" ss:StyleID="TotalRow"><Data ss:Type="String">—</Data></Cell>
   </Row>`;
    }

    xml += `
  </Table>
 </Worksheet>`;
  });

  xml += `
</Workbook>`;
  return xml;
}
