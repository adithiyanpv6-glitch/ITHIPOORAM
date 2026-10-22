// ============================================================================
// ITHI POORAM (ഇത്തിപ്പൂരം) — STAFF & SESSIONS EXCEL SPREADSHEETS
// Multi-sheet XML Spreadsheet (.xls) compatible with Microsoft Excel & Google Sheets
// ============================================================================

import { StaffUserRecord, StaffLoginSession, StaffActivityLog } from './serverDb';

function escapeXml(unsafe: any): string {
  if (unsafe === undefined || unsafe === null) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

const COMMON_EXCEL_STYLES = `
  <!-- Base Style -->
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Borders/>
   <Font ss:FontName="Segoe UI" x:Family="Swiss" ss:Size="10" ss:Color="#1E293B"/>
   <Interior/>
   <NumberFormat/>
   <Protection/>
  </Style>

  <!-- Super Header Style -->
  <Style ss:ID="SuperHeader">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#782312"/>
   </Borders>
   <Font ss:FontName="Segoe UI" ss:Size="14" ss:Color="#FFFFFF" ss:Bold="1"/>
   <Interior ss:Color="#9E341D" ss:Pattern="Solid"/>
  </Style>

  <!-- Sub Header Style -->
  <Style ss:ID="SubHeader">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Size="9.5" ss:Color="#FDE68A" ss:Italic="1"/>
   <Interior ss:Color="#1E293B" ss:Pattern="Solid"/>
  </Style>

  <!-- KPI Banner Style -->
  <Style ss:ID="KpiLabel">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Size="9" ss:Color="#64748B" ss:Bold="1"/>
   <Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="KpiValue">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Size="9.5" ss:Color="#0F172A" ss:Bold="1"/>
   <Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/>
  </Style>

  <!-- Table Header Columns -->
  <Style ss:ID="ColHeader">
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

  <!-- Regular Data Cells -->
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

  <!-- Monospace Style for PIN & IDs -->
  <Style ss:ID="PinMonospace">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
   <Font ss:FontName="Consolas" ss:Size="10" ss:Color="#9E341D" ss:Bold="1"/>
   <Interior ss:Color="#FEF3C7" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="IdMonospace">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
   <Font ss:FontName="Consolas" ss:Size="9.5" ss:Color="#1E293B" ss:Bold="1"/>
   <Interior ss:Color="#F1F5F9" ss:Pattern="Solid"/>
  </Style>

  <!-- Badges -->
  <Style ss:ID="StatusActive">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
   <Font ss:FontName="Segoe UI" ss:Size="9" ss:Color="#15803D" ss:Bold="1"/>
   <Interior ss:Color="#DCFCE7" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="StatusLoggedOut">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
   <Font ss:FontName="Segoe UI" ss:Size="9" ss:Color="#64748B" ss:Bold="1"/>
   <Interior ss:Color="#F1F5F9" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="RoleBadge">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
   <Font ss:FontName="Segoe UI" ss:Size="9" ss:Color="#4338CA" ss:Bold="1"/>
   <Interior ss:Color="#EEF2FF" ss:Pattern="Solid"/>
  </Style>
`;

/**
 * FILE 1: Staff Database (Staff Register)
 * Single Sheet: Staff Register
 * Columns: # | Staff ID | Employee Name | Access PIN / Password | Role | Registration Date & Time
 */
export function generateStaffDatabaseXml(staffList: StaffUserRecord[]): string {
  const generatedAt = new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
  <Author>Ithi Pooram</Author>
  <LastAuthor>Ithi Pooram Admin</LastAuthor>
  <Created>${new Date().toISOString()}</Created>
  <Company>Ithi Pooram, Vanchiyoor, Trivandrum</Company>
  <Title>Staff Database</Title>
 </DocumentProperties>
 <Styles>
  ${COMMON_EXCEL_STYLES}
 </Styles>

 <Worksheet ss:Name="Staff Register">
  <Table ss:DefaultRowHeight="20">
   <Column ss:Width="35"/>
   <Column ss:Width="130"/>
   <Column ss:Width="220"/>
   <Column ss:Width="160"/>
   <Column ss:Width="130"/>
   <Column ss:Width="180"/>

   <!-- Title Row -->
   <Row ss:Height="34">
    <Cell ss:MergeAcross="5" ss:StyleID="SuperHeader">
     <Data ss:Type="String">ITHI POORAM (ഇത്തിപ്പൂരം) — STAFF REGISTER</Data>
    </Cell>
   </Row>

   <!-- Subtitle Row -->
   <Row ss:Height="20">
    <Cell ss:MergeAcross="5" ss:StyleID="SubHeader">
     <Data ss:Type="String">Staff Sign-In Credentials &amp; Role Registry</Data>
    </Cell>
   </Row>

   <!-- Meta Summary Row -->
   <Row ss:Height="22">
    <Cell ss:StyleID="KpiLabel"><Data ss:Type="String">Last Updated:</Data></Cell>
    <Cell ss:MergeAcross="2" ss:StyleID="KpiValue"><Data ss:Type="String">${escapeXml(generatedAt)}</Data></Cell>
    <Cell ss:StyleID="KpiLabel"><Data ss:Type="String">Total Staff:</Data></Cell>
    <Cell ss:StyleID="KpiValue"><Data ss:Type="Number">${staffList.length}</Data></Cell>
   </Row>
   <Row ss:Height="8"/>

   <!-- Column Headers -->
   <Row ss:Height="26">
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">#</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Staff ID</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Employee Name</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Access PIN / Password</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Role</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Registration Date &amp; Time</Data></Cell>
   </Row>

   <!-- Data Rows -->
   ${staffList.length === 0 ? `
   <Row ss:Height="26">
    <Cell ss:MergeAcross="5" ss:StyleID="DataCellCenter"><Data ss:Type="String">Database is clean and ready. No staff registered yet.</Data></Cell>
   </Row>` : staffList.map((stf, idx) => `
   <Row ss:Height="24">
    <Cell ss:StyleID="DataCellCenter"><Data ss:Type="Number">${idx + 1}</Data></Cell>
    <Cell ss:StyleID="IdMonospace"><Data ss:Type="String">${escapeXml(stf.id)}</Data></Cell>
    <Cell ss:StyleID="DataCellLeft"><Data ss:Type="String">${escapeXml(stf.fullName)}</Data></Cell>
    <Cell ss:StyleID="PinMonospace"><Data ss:Type="String">${escapeXml(stf.pin)}</Data></Cell>
    <Cell ss:StyleID="RoleBadge"><Data ss:Type="String">${escapeXml(stf.role)}</Data></Cell>
    <Cell ss:StyleID="DataCellCenter"><Data ss:Type="String">${escapeXml(stf.registeredAt || '')}</Data></Cell>
   </Row>`).join('')}
  </Table>
  <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
   <Selected/>
   <FreezePanes/>
   <FrozenNoSplit/>
   <SplitHorizontal>5</SplitHorizontal>
   <TopRowBottomPane>5</TopRowBottomPane>
   <ActivePane>2</ActivePane>
  </WorksheetOptions>
 </Worksheet>
</Workbook>`;
}

/**
 * FILE 2: Staff Session Database
 * Sheet 1: Live Login Sessions
 * Sheet 2: Activity Logs
 */
export function generateStaffSessionDatabaseXml(
  sessions: StaffLoginSession[],
  activityLogs: StaffActivityLog[],
  staffList: StaffUserRecord[] = []
): string {
  const generatedAt = new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
  <Author>Ithi Pooram</Author>
  <LastAuthor>Ithi Pooram Security System</LastAuthor>
  <Created>${new Date().toISOString()}</Created>
  <Company>Ithi Pooram, Vanchiyoor, Trivandrum</Company>
  <Title>Staff Session Database</Title>
 </DocumentProperties>
 <Styles>
  ${COMMON_EXCEL_STYLES}
 </Styles>

 <!-- SHEET 1: LIVE LOGIN SESSIONS -->
 <Worksheet ss:Name="Live Login Sessions">
  <Table ss:DefaultRowHeight="20">
   <Column ss:Width="35"/>
   <Column ss:Width="160"/>
   <Column ss:Width="130"/>
   <Column ss:Width="200"/>
   <Column ss:Width="130"/>
   <Column ss:Width="180"/>
   <Column ss:Width="120"/>
   <Column ss:Width="130"/>

   <!-- Title Row -->
   <Row ss:Height="34">
    <Cell ss:MergeAcross="7" ss:StyleID="SuperHeader">
     <Data ss:Type="String">ITHI POORAM (ഇത്തിപ്പൂരം) — LIVE LOGIN SESSIONS</Data>
    </Cell>
   </Row>

   <!-- Subtitle Row -->
   <Row ss:Height="20">
    <Cell ss:MergeAcross="7" ss:StyleID="SubHeader">
     <Data ss:Type="String">Real-Time Connected Staff Sessions &amp; Active Shifts</Data>
    </Cell>
   </Row>

   <!-- Meta Summary Row -->
   <Row ss:Height="22">
    <Cell ss:StyleID="KpiLabel"><Data ss:Type="String">Last Updated:</Data></Cell>
    <Cell ss:MergeAcross="2" ss:StyleID="KpiValue"><Data ss:Type="String">${escapeXml(generatedAt)}</Data></Cell>
    <Cell ss:StyleID="KpiLabel"><Data ss:Type="String">Active Sessions:</Data></Cell>
    <Cell ss:MergeAcross="2" ss:StyleID="KpiValue"><Data ss:Type="String">${sessions.filter((s) => s.status === 'ACTIVE').length} Staff Online</Data></Cell>
   </Row>
   <Row ss:Height="8"/>

   <!-- Column Headers -->
   <Row ss:Height="26">
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">#</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Session ID</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Staff ID</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Employee Name</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Role</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Login Date &amp; Time</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Session Status</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Last Active Time</Data></Cell>
   </Row>

   <!-- Data Rows -->
   ${sessions.length === 0 ? `
   <Row ss:Height="26">
    <Cell ss:MergeAcross="7" ss:StyleID="DataCellCenter"><Data ss:Type="String">No login sessions recorded yet. Fresh database ready for testing.</Data></Cell>
   </Row>` : sessions.map((ses, idx) => `
   <Row ss:Height="24">
    <Cell ss:StyleID="DataCellCenter"><Data ss:Type="Number">${idx + 1}</Data></Cell>
    <Cell ss:StyleID="IdMonospace"><Data ss:Type="String">${escapeXml(ses.sessionId)}</Data></Cell>
    <Cell ss:StyleID="IdMonospace"><Data ss:Type="String">${escapeXml(ses.staffId)}</Data></Cell>
    <Cell ss:StyleID="DataCellLeft"><Data ss:Type="String">${escapeXml(ses.fullName)}</Data></Cell>
    <Cell ss:StyleID="RoleBadge"><Data ss:Type="String">${escapeXml(ses.role)}</Data></Cell>
    <Cell ss:StyleID="DataCellCenter"><Data ss:Type="String">${escapeXml(ses.loginDate)} ${escapeXml(ses.loginTime)}</Data></Cell>
    <Cell ss:StyleID="${ses.status === 'ACTIVE' ? 'StatusActive' : 'StatusLoggedOut'}"><Data ss:Type="String">${ses.status === 'ACTIVE' ? '🟢 ACTIVE' : '⚪ LOGGED OUT'}</Data></Cell>
    <Cell ss:StyleID="DataCellCenter"><Data ss:Type="String">${escapeXml(ses.lastActive || ses.loginTime)}</Data></Cell>
   </Row>`).join('')}
  </Table>
  <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
   <FreezePanes/>
   <FrozenNoSplit/>
   <SplitHorizontal>5</SplitHorizontal>
   <TopRowBottomPane>5</TopRowBottomPane>
   <ActivePane>2</ActivePane>
  </WorksheetOptions>
 </Worksheet>

 <!-- SHEET 2: ACTIVITY LOGS -->
 <Worksheet ss:Name="Activity Logs">
  <Table ss:DefaultRowHeight="20">
   <Column ss:Width="35"/>
   <Column ss:Width="120"/>
   <Column ss:Width="170"/>
   <Column ss:Width="180"/>
   <Column ss:Width="130"/>
   <Column ss:Width="200"/>
   <Column ss:Width="130"/>
   <Column ss:Width="100"/>

   <!-- Title Row -->
   <Row ss:Height="34">
    <Cell ss:MergeAcross="7" ss:StyleID="SuperHeader">
     <Data ss:Type="String">ITHI POORAM (ഇത്തിപ്പൂരം) — ACTIVITY LOGS</Data>
    </Cell>
   </Row>

   <!-- Subtitle Row -->
   <Row ss:Height="20">
    <Cell ss:MergeAcross="7" ss:StyleID="SubHeader">
     <Data ss:Type="String">Chronological Staff Registration &amp; Sign-In Events</Data>
    </Cell>
   </Row>

   <!-- Meta Summary Row -->
   <Row ss:Height="22">
    <Cell ss:StyleID="KpiLabel"><Data ss:Type="String">Last Updated:</Data></Cell>
    <Cell ss:MergeAcross="2" ss:StyleID="KpiValue"><Data ss:Type="String">${escapeXml(generatedAt)}</Data></Cell>
    <Cell ss:StyleID="KpiLabel"><Data ss:Type="String">Total Events:</Data></Cell>
    <Cell ss:MergeAcross="2" ss:StyleID="KpiValue"><Data ss:Type="Number">${activityLogs.length}</Data></Cell>
   </Row>
   <Row ss:Height="8"/>

   <!-- Column Headers -->
   <Row ss:Height="26">
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">#</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Log ID</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Date &amp; Time</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Action / Event</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Staff ID</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Employee Name</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Role</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Status</Data></Cell>
   </Row>

   <!-- Data Rows -->
   ${activityLogs.length === 0 ? `
   <Row ss:Height="26">
    <Cell ss:MergeAcross="7" ss:StyleID="DataCellCenter"><Data ss:Type="String">No activity logs recorded yet. Fresh database ready for testing.</Data></Cell>
   </Row>` : activityLogs.map((log, idx) => {
     const matched = staffList.find((s) => s.fullName === log.fullNameSnapshot || s.username === log.usernameSnapshot);
     const staffIdVal = matched ? matched.id : '-';
     return `
   <Row ss:Height="24">
    <Cell ss:StyleID="DataCellCenter"><Data ss:Type="Number">${idx + 1}</Data></Cell>
    <Cell ss:StyleID="IdMonospace"><Data ss:Type="String">${escapeXml(log.id)}</Data></Cell>
    <Cell ss:StyleID="DataCellCenter"><Data ss:Type="String">${escapeXml(log.timestamp)}</Data></Cell>
    <Cell ss:StyleID="RoleBadge"><Data ss:Type="String">${escapeXml(log.actionType)}</Data></Cell>
    <Cell ss:StyleID="IdMonospace"><Data ss:Type="String">${escapeXml(staffIdVal)}</Data></Cell>
    <Cell ss:StyleID="DataCellLeft"><Data ss:Type="String">${escapeXml(log.fullNameSnapshot)}</Data></Cell>
    <Cell ss:StyleID="DataCellCenter"><Data ss:Type="String">${escapeXml(log.roleSnapshot)}</Data></Cell>
    <Cell ss:StyleID="${log.success ? 'StatusActive' : 'StatusLoggedOut'}"><Data ss:Type="String">${log.success ? 'SUCCESS' : 'FAILED'}</Data></Cell>
   </Row>`;
   }).join('')}
  </Table>
  <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
   <FreezePanes/>
   <FrozenNoSplit/>
   <SplitHorizontal>5</SplitHorizontal>
   <TopRowBottomPane>5</TopRowBottomPane>
   <ActivePane>2</ActivePane>
  </WorksheetOptions>
 </Worksheet>
</Workbook>`;
}

// Backwards-compatible export
export function generateStaffSessionsExcelXml(
  staffList: StaffUserRecord[],
  sessions: StaffLoginSession[],
  activityLogs: StaffActivityLog[]
): string {
  return generateStaffDatabaseXml(staffList);
}
