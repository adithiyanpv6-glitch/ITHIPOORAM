// ============================================================================
// ITHI POORAM (ഇത്തിപ്പൂരം) — UNIFIED MASTER EXCEL DATABASE
// A single multi-sheet Microsoft Excel XML (.xls) containing:
// 1. "Staff Database" (Staff Register with ithi_xxx_001 format)
// 2. "Staff Session Database" (Live Sessions & Activity History)
// 3. "Table Orders Database" (Master Tables, Rooms & Live Orders)
//
// Updates in-place on ONE SINGLE Telegram message (#16) without duplicate files!
// ============================================================================

import { StaffUserRecord, StaffLoginSession, StaffActivityLog, RestaurantTable, RestaurantOrder } from './serverDb';

function escapeXml(unsafe: any): string {
  if (unsafe === undefined || unsafe === null) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

const COMMON_STYLES = `
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Borders/>
   <Font ss:FontName="Segoe UI" x:Family="Swiss" ss:Size="10" ss:Color="#1E293B"/>
   <Interior/>
   <NumberFormat/>
   <Protection/>
  </Style>

  <!-- Banner Header (Red/Brown) -->
  <Style ss:ID="BannerStaff">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#782312"/>
   </Borders>
   <Font ss:FontName="Segoe UI" ss:Size="13" ss:Color="#FFFFFF" ss:Bold="1"/>
   <Interior ss:Color="#9E341D" ss:Pattern="Solid"/>
  </Style>

  <!-- Banner Header (Navy/Slate) -->
  <Style ss:ID="BannerSessions">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#0F172A"/>
   </Borders>
   <Font ss:FontName="Segoe UI" ss:Size="13" ss:Color="#FFFFFF" ss:Bold="1"/>
   <Interior ss:Color="#1E293B" ss:Pattern="Solid"/>
  </Style>

  <!-- Banner Header (Emerald) -->
  <Style ss:ID="BannerTables">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#047857"/>
   </Borders>
   <Font ss:FontName="Segoe UI" ss:Size="13" ss:Color="#FFFFFF" ss:Bold="1"/>
   <Interior ss:Color="#059669" ss:Pattern="Solid"/>
  </Style>

  <!-- Sub Title -->
  <Style ss:ID="SubTitle">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Size="9.5" ss:Color="#FDE68A" ss:Italic="1"/>
   <Interior ss:Color="#0F172A" ss:Pattern="Solid"/>
  </Style>

  <!-- Section Header -->
  <Style ss:ID="SectionHeader">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Size="10.5" ss:Color="#0F172A" ss:Bold="1"/>
   <Interior ss:Color="#E2E8F0" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#94A3B8"/>
   </Borders>
  </Style>

  <!-- Column Headers -->
  <Style ss:ID="ColHeaderStaff">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#782312"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
   </Borders>
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Color="#FFFFFF" ss:Bold="1"/>
   <Interior ss:Color="#9E341D" ss:Pattern="Solid"/>
  </Style>

  <Style ss:ID="ColHeaderDark">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#0F172A"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
   </Borders>
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Color="#FFFFFF" ss:Bold="1"/>
   <Interior ss:Color="#1E293B" ss:Pattern="Solid"/>
  </Style>

  <Style ss:ID="ColHeaderGreen">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#047857"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
   </Borders>
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Color="#FFFFFF" ss:Bold="1"/>
   <Interior ss:Color="#059669" ss:Pattern="Solid"/>
  </Style>

  <!-- Data Cells -->
  <Style ss:ID="DataCellLeft">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
   <Font ss:FontName="Segoe UI" ss:Size="9.5" ss:Color="#0F172A"/>
  </Style>

  <Style ss:ID="DataCellCenter">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
   <Font ss:FontName="Segoe UI" ss:Size="9.5" ss:Color="#0F172A"/>
  </Style>

  <Style ss:ID="DataCellCode">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
   <Font ss:FontName="Consolas" ss:Size="10" ss:Color="#0F172A" ss:Bold="1"/>
   <Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/>
  </Style>

  <Style ss:ID="DataCellPin">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
   <Font ss:FontName="Consolas" ss:Size="11" ss:Color="#9E341D" ss:Bold="1"/>
   <Interior ss:Color="#FFFBEB" ss:Pattern="Solid"/>
  </Style>

  <Style ss:ID="DataCellMoney">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
   <Font ss:FontName="Consolas" ss:Size="10" ss:Color="#047857" ss:Bold="1"/>
   <NumberFormat ss:Format="#,##0.00"/>
  </Style>

  <Style ss:ID="BadgeActive">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#A7F3D0"/>
   </Borders>
   <Font ss:FontName="Segoe UI" ss:Size="9" ss:Color="#065F46" ss:Bold="1"/>
   <Interior ss:Color="#D1FAE5" ss:Pattern="Solid"/>
  </Style>

  <Style ss:ID="BadgeOffline">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
   <Font ss:FontName="Segoe UI" ss:Size="9" ss:Color="#64748B"/>
   <Interior ss:Color="#F1F5F9" ss:Pattern="Solid"/>
  </Style>

  <Style ss:ID="EmptyRow">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Size="9.5" ss:Color="#94A3B8" ss:Italic="1"/>
   <Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/>
  </Style>
`;

/**
 * Generates the unified master multi-sheet Excel spreadsheet (.xls)
 */
export function generateUnifiedMasterDatabaseXml(
  staffList: StaffUserRecord[] = [],
  sessions: StaffLoginSession[] = [],
  logs: StaffActivityLog[] = [],
  tables: RestaurantTable[] = [],
  orders: RestaurantOrder[] = []
): string {
  const nowStr = new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'full',
    timeStyle: 'medium',
  });

  // --------------------------------------------------------------------------
  // SHEET 1: Staff Database
  // --------------------------------------------------------------------------
  let staffRowsXml = '';
  if (staffList.length === 0) {
    staffRowsXml += `
    <Row ss:Height="26">
      <Cell ss:MergeAcross="5" ss:StyleID="EmptyRow">
        <Data ss:Type="String">Database ready. No staff registered yet. Add accounts from Admin Console.</Data>
      </Cell>
    </Row>`;
  } else {
    staffList.forEach((s, idx) => {
      staffRowsXml += `
    <Row ss:Height="24">
      <Cell ss:StyleID="DataCellCenter"><Data ss:Type="Number">${idx + 1}</Data></Cell>
      <Cell ss:StyleID="DataCellCode"><Data ss:Type="String">${escapeXml(s.id)}</Data></Cell>
      <Cell ss:StyleID="DataCellLeft"><Data ss:Type="String">${escapeXml(s.fullName || s.username)}</Data></Cell>
      <Cell ss:StyleID="DataCellPin"><Data ss:Type="String">${escapeXml(s.pin)}</Data></Cell>
      <Cell ss:StyleID="DataCellCenter"><Data ss:Type="String">${escapeXml(s.role)}</Data></Cell>
      <Cell ss:StyleID="DataCellCenter"><Data ss:Type="String">${escapeXml(s.registeredAt || 'Today')}</Data></Cell>
    </Row>`;
    });
  }

  const sheet1Xml = `
  <Worksheet ss:Name="Staff Database">
    <Table ss:DefaultRowHeight="20">
      <Column ss:Width="40"/>
      <Column ss:Width="130"/>
      <Column ss:Width="200"/>
      <Column ss:Width="140"/>
      <Column ss:Width="140"/>
      <Column ss:Width="180"/>

      <!-- Header Banner -->
      <Row ss:Height="36">
        <Cell ss:MergeAcross="5" ss:StyleID="BannerStaff">
          <Data ss:Type="String">ITHI POORAM (ഇത്തിപ്പൂരം) — STAFF DATABASE</Data>
        </Cell>
      </Row>
      <Row ss:Height="22">
        <Cell ss:MergeAcross="5" ss:StyleID="SubTitle">
          <Data ss:Type="String">Active Personnel Registry • Central Security PIN Store • Updated: ${escapeXml(nowStr)}</Data>
        </Cell>
      </Row>
      <Row ss:Height="10"/>

      <!-- Column Headers -->
      <Row ss:Height="28">
        <Cell ss:StyleID="ColHeaderStaff"><Data ss:Type="String">#</Data></Cell>
        <Cell ss:StyleID="ColHeaderStaff"><Data ss:Type="String">Staff ID</Data></Cell>
        <Cell ss:StyleID="ColHeaderStaff"><Data ss:Type="String">Employee Name</Data></Cell>
        <Cell ss:StyleID="ColHeaderStaff"><Data ss:Type="String">Access PIN / Password</Data></Cell>
        <Cell ss:StyleID="ColHeaderStaff"><Data ss:Type="String">Role</Data></Cell>
        <Cell ss:StyleID="ColHeaderStaff"><Data ss:Type="String">Registration Date &amp; Time</Data></Cell>
      </Row>

      <!-- Data Rows -->
      ${staffRowsXml}
    </Table>
  </Worksheet>`;

  // --------------------------------------------------------------------------
  // SHEET 2: Staff Session Database
  // --------------------------------------------------------------------------
  let sessionRowsXml = '';
  if (sessions.length === 0) {
    sessionRowsXml += `
    <Row ss:Height="26">
      <Cell ss:MergeAcross="7" ss:StyleID="EmptyRow">
        <Data ss:Type="String">No login sessions recorded yet. Database is fresh and waiting for live logins.</Data>
      </Cell>
    </Row>`;
  } else {
    sessions.forEach((ses, idx) => {
      const isActive = ses.status === 'ACTIVE';
      sessionRowsXml += `
    <Row ss:Height="24">
      <Cell ss:StyleID="DataCellCenter"><Data ss:Type="Number">${idx + 1}</Data></Cell>
      <Cell ss:StyleID="DataCellCode"><Data ss:Type="String">${escapeXml(ses.sessionId)}</Data></Cell>
      <Cell ss:StyleID="DataCellCode"><Data ss:Type="String">${escapeXml(ses.staffId)}</Data></Cell>
      <Cell ss:StyleID="DataCellLeft"><Data ss:Type="String">${escapeXml(ses.fullName)}</Data></Cell>
      <Cell ss:StyleID="DataCellCenter"><Data ss:Type="String">${escapeXml(ses.role)}</Data></Cell>
      <Cell ss:StyleID="DataCellCenter"><Data ss:Type="String">${escapeXml(`${ses.loginDate} ${ses.loginTime}`)}</Data></Cell>
      <Cell ss:StyleID="${isActive ? 'BadgeActive' : 'BadgeOffline'}"><Data ss:Type="String">${isActive ? 'ACTIVE (Online)' : 'LOGGED OUT'}</Data></Cell>
      <Cell ss:StyleID="DataCellCenter"><Data ss:Type="String">${escapeXml(ses.lastActive || ses.loginTime)}</Data></Cell>
    </Row>`;
    });
  }

  let logRowsXml = '';
  if (logs.length === 0) {
    logRowsXml += `
    <Row ss:Height="26">
      <Cell ss:MergeAcross="7" ss:StyleID="EmptyRow">
        <Data ss:Type="String">No activity events recorded yet.</Data>
      </Cell>
    </Row>`;
  } else {
    logs.forEach((log, idx) => {
      const matched = staffList.find((s) => s.fullName === log.fullNameSnapshot || s.username === log.usernameSnapshot);
      logRowsXml += `
    <Row ss:Height="22">
      <Cell ss:StyleID="DataCellCenter"><Data ss:Type="Number">${idx + 1}</Data></Cell>
      <Cell ss:StyleID="DataCellCode"><Data ss:Type="String">${escapeXml(log.id)}</Data></Cell>
      <Cell ss:StyleID="DataCellCenter"><Data ss:Type="String">${escapeXml(log.timestamp)}</Data></Cell>
      <Cell ss:StyleID="DataCellLeft"><Data ss:Type="String">${escapeXml(log.actionType)}</Data></Cell>
      <Cell ss:StyleID="DataCellCode"><Data ss:Type="String">${escapeXml(matched ? matched.id : '-')}</Data></Cell>
      <Cell ss:StyleID="DataCellLeft"><Data ss:Type="String">${escapeXml(log.fullNameSnapshot)}</Data></Cell>
      <Cell ss:StyleID="DataCellCenter"><Data ss:Type="String">${escapeXml(log.roleSnapshot)}</Data></Cell>
      <Cell ss:StyleID="${log.success ? 'BadgeActive' : 'BadgeOffline'}"><Data ss:Type="String">${log.success ? 'SUCCESS' : 'FAILED'}</Data></Cell>
    </Row>`;
    });
  }

  const sheet2Xml = `
  <Worksheet ss:Name="Staff Session Database">
    <Table ss:DefaultRowHeight="20">
      <Column ss:Width="40"/>
      <Column ss:Width="140"/>
      <Column ss:Width="120"/>
      <Column ss:Width="180"/>
      <Column ss:Width="110"/>
      <Column ss:Width="170"/>
      <Column ss:Width="130"/>
      <Column ss:Width="140"/>

      <!-- Header Banner -->
      <Row ss:Height="36">
        <Cell ss:MergeAcross="7" ss:StyleID="BannerSessions">
          <Data ss:Type="String">ITHI POORAM (ഇത്തിപ്പൂരം) — STAFF SESSION DATABASE</Data>
        </Cell>
      </Row>
      <Row ss:Height="22">
        <Cell ss:MergeAcross="7" ss:StyleID="SubTitle">
          <Data ss:Type="String">Live Login Sessions &amp; Terminal Activity Trail • Updated: ${escapeXml(nowStr)}</Data>
        </Cell>
      </Row>
      <Row ss:Height="10"/>

      <!-- SECTION 1: Active Sessions -->
      <Row ss:Height="24">
        <Cell ss:MergeAcross="7" ss:StyleID="SectionHeader">
          <Data ss:Type="String">📌 Live Login Sessions (Cashier, Server, Kitchen &amp; Admin)</Data>
        </Cell>
      </Row>
      <Row ss:Height="28">
        <Cell ss:StyleID="ColHeaderDark"><Data ss:Type="String">#</Data></Cell>
        <Cell ss:StyleID="ColHeaderDark"><Data ss:Type="String">Session ID</Data></Cell>
        <Cell ss:StyleID="ColHeaderDark"><Data ss:Type="String">Staff ID</Data></Cell>
        <Cell ss:StyleID="ColHeaderDark"><Data ss:Type="String">Employee Name</Data></Cell>
        <Cell ss:StyleID="ColHeaderDark"><Data ss:Type="String">Role</Data></Cell>
        <Cell ss:StyleID="ColHeaderDark"><Data ss:Type="String">Login Date &amp; Time</Data></Cell>
        <Cell ss:StyleID="ColHeaderDark"><Data ss:Type="String">Session Status</Data></Cell>
        <Cell ss:StyleID="ColHeaderDark"><Data ss:Type="String">Last Active Time</Data></Cell>
      </Row>
      ${sessionRowsXml}

      <Row ss:Height="16"/>

      <!-- SECTION 2: Activity Trail -->
      <Row ss:Height="24">
        <Cell ss:MergeAcross="7" ss:StyleID="SectionHeader">
          <Data ss:Type="String">📜 Activity &amp; Authentication History</Data>
        </Cell>
      </Row>
      <Row ss:Height="28">
        <Cell ss:StyleID="ColHeaderDark"><Data ss:Type="String">#</Data></Cell>
        <Cell ss:StyleID="ColHeaderDark"><Data ss:Type="String">Log ID</Data></Cell>
        <Cell ss:StyleID="ColHeaderDark"><Data ss:Type="String">Date &amp; Time</Data></Cell>
        <Cell ss:StyleID="ColHeaderDark"><Data ss:Type="String">Action / Event</Data></Cell>
        <Cell ss:StyleID="ColHeaderDark"><Data ss:Type="String">Staff ID</Data></Cell>
        <Cell ss:StyleID="ColHeaderDark"><Data ss:Type="String">Employee Name</Data></Cell>
        <Cell ss:StyleID="ColHeaderDark"><Data ss:Type="String">Role</Data></Cell>
        <Cell ss:StyleID="ColHeaderDark"><Data ss:Type="String">Status</Data></Cell>
      </Row>
      ${logRowsXml}
    </Table>
  </Worksheet>`;

  // --------------------------------------------------------------------------
  // SHEET 3: Table Orders Database
  // --------------------------------------------------------------------------
  let tableRowsXml = '';
  if (tables.length === 0) {
    tableRowsXml += `
    <Row ss:Height="26">
      <Cell ss:MergeAcross="7" ss:StyleID="EmptyRow">
        <Data ss:Type="String">No tables configured yet. Create rooms and tables in Table QR Console.</Data>
      </Cell>
    </Row>`;
  } else {
    tables.forEach((t, idx) => {
      tableRowsXml += `
    <Row ss:Height="24">
      <Cell ss:StyleID="DataCellCenter"><Data ss:Type="Number">${idx + 1}</Data></Cell>
      <Cell ss:StyleID="DataCellCode"><Data ss:Type="String">${escapeXml(t.tableCode)}</Data></Cell>
      <Cell ss:StyleID="DataCellLeft"><Data ss:Type="String">${escapeXml(t.displayName)}</Data></Cell>
      <Cell ss:StyleID="DataCellLeft"><Data ss:Type="String">${escapeXml((t as any).roomName || 'Dining Area')}</Data></Cell>
      <Cell ss:StyleID="DataCellCenter"><Data ss:Type="Number">${t.capacity || 4}</Data></Cell>
      <Cell ss:StyleID="DataCellCenter"><Data ss:Type="Number">${t.unpaidCount || 0}</Data></Cell>
      <Cell ss:StyleID="DataCellMoney"><Data ss:Type="Number">${((t.unpaidTotalPaise || 0) / 100).toFixed(2)}</Data></Cell>
      <Cell ss:StyleID="${t.status === 'AVAILABLE' ? 'BadgeActive' : 'BadgeOffline'}"><Data ss:Type="String">${escapeXml(t.status || 'AVAILABLE')}</Data></Cell>
    </Row>`;
    });
  }

  let orderRowsXml = '';
  if (orders.length === 0) {
    orderRowsXml += `
    <Row ss:Height="26">
      <Cell ss:MergeAcross="7" ss:StyleID="EmptyRow">
        <Data ss:Type="String">No table customer orders recorded yet. Fresh database ready.</Data>
      </Cell>
    </Row>`;
  } else {
    orders.forEach((o) => {
      const itemsSummary = (o.items || []).map((it) => `${it.quantity}x ${it.itemName}`).join('; ');
      orderRowsXml += `
    <Row ss:Height="22">
      <Cell ss:StyleID="DataCellCode"><Data ss:Type="String">${escapeXml(o.customerCode || o.id)}</Data></Cell>
      <Cell ss:StyleID="DataCellCode"><Data ss:Type="String">${escapeXml(o.tableCode)}</Data></Cell>
      <Cell ss:StyleID="DataCellLeft"><Data ss:Type="String">${escapeXml(o.tableName)}</Data></Cell>
      <Cell ss:StyleID="DataCellCenter"><Data ss:Type="String">${escapeXml(o.createdAt ? new Date(o.createdAt).toLocaleTimeString('en-IN') : 'Recent')}</Data></Cell>
      <Cell ss:StyleID="DataCellLeft"><Data ss:Type="String">${escapeXml(itemsSummary)}</Data></Cell>
      <Cell ss:StyleID="DataCellMoney"><Data ss:Type="Number">${((o.grandTotalPaise || 0) / 100).toFixed(2)}</Data></Cell>
      <Cell ss:StyleID="DataCellCenter"><Data ss:Type="String">${escapeXml(o.fulfillmentStatus)}</Data></Cell>
      <Cell ss:StyleID="${o.paymentStatus === 'PAID' ? 'BadgeActive' : 'BadgeOffline'}"><Data ss:Type="String">${escapeXml(o.paymentStatus)}</Data></Cell>
    </Row>`;
    });
  }

  const sheet3Xml = `
  <Worksheet ss:Name="Table Orders Database">
    <Table ss:DefaultRowHeight="20">
      <Column ss:Width="40"/>
      <Column ss:Width="100"/>
      <Column ss:Width="170"/>
      <Column ss:Width="150"/>
      <Column ss:Width="80"/>
      <Column ss:Width="100"/>
      <Column ss:Width="130"/>
      <Column ss:Width="120"/>

      <!-- Header Banner -->
      <Row ss:Height="36">
        <Cell ss:MergeAcross="7" ss:StyleID="BannerTables">
          <Data ss:Type="String">ITHI POORAM (ഇത്തിപ്പൂരം) — TABLE ORDERS DATABASE</Data>
        </Cell>
      </Row>
      <Row ss:Height="22">
        <Cell ss:MergeAcross="7" ss:StyleID="SubTitle">
          <Data ss:Type="String">Rooms, Master Tables &amp; Live Customer Orders • Updated: ${escapeXml(nowStr)}</Data>
        </Cell>
      </Row>
      <Row ss:Height="10"/>

      <!-- SECTION 1: Rooms & Tables -->
      <Row ss:Height="24">
        <Cell ss:MergeAcross="7" ss:StyleID="SectionHeader">
          <Data ss:Type="String">🍽️ Rooms &amp; Dining Table Register</Data>
        </Cell>
      </Row>
      <Row ss:Height="28">
        <Cell ss:StyleID="ColHeaderGreen"><Data ss:Type="String">#</Data></Cell>
        <Cell ss:StyleID="ColHeaderGreen"><Data ss:Type="String">Table Code</Data></Cell>
        <Cell ss:StyleID="ColHeaderGreen"><Data ss:Type="String">Display Name</Data></Cell>
        <Cell ss:StyleID="ColHeaderGreen"><Data ss:Type="String">Room / Section</Data></Cell>
        <Cell ss:StyleID="ColHeaderGreen"><Data ss:Type="String">Seats</Data></Cell>
        <Cell ss:StyleID="ColHeaderGreen"><Data ss:Type="String">Open Orders</Data></Cell>
        <Cell ss:StyleID="ColHeaderGreen"><Data ss:Type="String">Open Amount (INR)</Data></Cell>
        <Cell ss:StyleID="ColHeaderGreen"><Data ss:Type="String">Table Status</Data></Cell>
      </Row>
      ${tableRowsXml}

      <Row ss:Height="16"/>

      <!-- SECTION 2: Live Orders -->
      <Row ss:Height="24">
        <Cell ss:MergeAcross="7" ss:StyleID="SectionHeader">
          <Data ss:Type="String">📦 Live Table Orders</Data>
        </Cell>
      </Row>
      <Row ss:Height="28">
        <Cell ss:StyleID="ColHeaderGreen"><Data ss:Type="String">Order ID</Data></Cell>
        <Cell ss:StyleID="ColHeaderGreen"><Data ss:Type="String">Table Code</Data></Cell>
        <Cell ss:StyleID="ColHeaderGreen"><Data ss:Type="String">Table Name</Data></Cell>
        <Cell ss:StyleID="ColHeaderGreen"><Data ss:Type="String">Time</Data></Cell>
        <Cell ss:StyleID="ColHeaderGreen"><Data ss:Type="String">Ordered Items Summary</Data></Cell>
        <Cell ss:StyleID="ColHeaderGreen"><Data ss:Type="String">Total (INR)</Data></Cell>
        <Cell ss:StyleID="ColHeaderGreen"><Data ss:Type="String">Kitchen Status</Data></Cell>
        <Cell ss:StyleID="ColHeaderGreen"><Data ss:Type="String">Payment</Data></Cell>
      </Row>
      ${orderRowsXml}
    </Table>
  </Worksheet>`;

  return `<?xml version="1.0" encoding="utf-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
  <Title>Ithi Pooram Central Live Database</Title>
  <Subject>Single Unified Restaurant Database</Subject>
  <Author>Ithi Pooram Management</Author>
  <Created>${new Date().toISOString()}</Created>
 </DocumentProperties>
 <Styles>
  ${COMMON_STYLES}
 </Styles>
 ${sheet1Xml}
 ${sheet2Xml}
 ${sheet3Xml}
</Workbook>`;
}
