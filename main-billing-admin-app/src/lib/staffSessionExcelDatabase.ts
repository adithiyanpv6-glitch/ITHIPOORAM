// ============================================================================
// ITHI POORAM (ഇത്തിപ്പൂരം) — STAFF SIGN-IN CREDENTIALS & SESSIONS DATABASE
// Multi-sheet XML Spreadsheet (.xls) compatible with Excel & Google Sheets
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

export function generateStaffSessionsExcelXml(
  staffList: StaffUserRecord[],
  sessions: StaffLoginSession[],
  activityLogs: StaffActivityLog[]
): string {
  const generatedAt = new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'medium',
  });

  const activeSessionsCount = sessions.filter((s) => s.status === 'ACTIVE').length;

  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
  <Author>Ithi Pooram Engineering</Author>
  <LastAuthor>Ithi Pooram Security System</LastAuthor>
  <Created>${new Date().toISOString()}</Created>
  <Company>Ithi Pooram, Vanchiyoor, Trivandrum</Company>
  <Title>Staff Sign-in ID, Password &amp; Live Login Sessions Database</Title>
 </DocumentProperties>
 <Styles>
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
   <Font ss:FontName="Segoe UI" ss:Size="15" ss:Color="#FFFFFF" ss:Bold="1"/>
   <Interior ss:Color="#9E341D" ss:Pattern="Solid"/>
  </Style>

  <!-- Sub Header Style -->
  <Style ss:ID="SubHeader">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Size="9" ss:Color="#FDE68A" ss:Italic="1"/>
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
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Color="#0F172A" ss:Bold="1"/>
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

  <!-- Monospace Style for PIN / Password & IDs -->
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
 </Styles>

 <!-- ======================================================================= -->
 <!-- SHEET 1: STAFF CREDENTIALS & PASSWORDS DATABASE                         -->
 <!-- ======================================================================= -->
 <Worksheet ss:Name="Staff Credentials &amp; PINs">
  <Table ss:DefaultRowHeight="20">
   <Column ss:Width="35"/>
   <Column ss:Width="95"/>
   <Column ss:Width="160"/>
   <Column ss:Width="130"/>
   <Column ss:Width="110"/>
   <Column ss:Width="110"/>
   <Column ss:Width="160"/>
   <Column ss:Width="85"/>
   <Column ss:Width="140"/>
   <Column ss:Width="70"/>
   <Column ss:Width="240"/>

   <!-- Title Row -->
   <Row ss:Height="36">
    <Cell ss:MergeAcross="10" ss:StyleID="SuperHeader">
     <Data ss:Type="String">ITHI POORAM (ഇത്തിപ്പൂരം) — STAFF SIGN-IN ID &amp; PASSWORD DATABASE</Data>
    </Cell>
   </Row>

   <!-- Subtitle Row -->
   <Row ss:Height="20">
    <Cell ss:MergeAcross="10" ss:StyleID="SubHeader">
     <Data ss:Type="String">Restaurant POS Cashier, Manager &amp; Kitchen Staff Accounts • Synchronized Live with Telegram Group</Data>
    </Cell>
   </Row>

   <!-- Meta Summary Row -->
   <Row ss:Height="22">
    <Cell ss:StyleID="KpiLabel"><Data ss:Type="String">Export Time:</Data></Cell>
    <Cell ss:MergeAcross="2" ss:StyleID="KpiValue"><Data ss:Type="String">${escapeXml(generatedAt)}</Data></Cell>
    <Cell ss:StyleID="KpiLabel"><Data ss:Type="String">Total Staff:</Data></Cell>
    <Cell ss:StyleID="KpiValue"><Data ss:Type="Number">${staffList.length}</Data></Cell>
    <Cell ss:StyleID="KpiLabel"><Data ss:Type="String">Active Sessions:</Data></Cell>
    <Cell ss:MergeAcross="3" ss:StyleID="KpiValue"><Data ss:Type="String">${activeSessionsCount} Logged-in Staff</Data></Cell>
   </Row>
   <Row ss:Height="8"/>

   <!-- Column Headers -->
   <Row ss:Height="28">
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">#</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Staff ID</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Staff Full Name</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Sign-In Username</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">4-Digit Password / PIN</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Role</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Assigned Counter / Station</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Status</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Registered Date &amp; Time</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Logins</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Security Permissions &amp; Notes</Data></Cell>
   </Row>

   <!-- Data Rows -->
   ${staffList.map((stf, idx) => `
   <Row ss:Height="24">
    <Cell ss:StyleID="DataCellCenter"><Data ss:Type="Number">${idx + 1}</Data></Cell>
    <Cell ss:StyleID="IdMonospace"><Data ss:Type="String">${escapeXml(stf.id)}</Data></Cell>
    <Cell ss:StyleID="DataCellLeft"><Data ss:Type="String">${escapeXml(stf.fullName)}</Data></Cell>
    <Cell ss:StyleID="DataCellLeft"><Data ss:Type="String">${escapeXml(stf.username)}</Data></Cell>
    <Cell ss:StyleID="PinMonospace"><Data ss:Type="String">${escapeXml(stf.pin)}</Data></Cell>
    <Cell ss:StyleID="RoleBadge"><Data ss:Type="String">${escapeXml(stf.role)}</Data></Cell>
    <Cell ss:StyleID="DataCellLeft"><Data ss:Type="String">${escapeXml(stf.station || 'Billing Terminal')}</Data></Cell>
    <Cell ss:StyleID="${stf.isActive ? 'StatusActive' : 'StatusLoggedOut'}"><Data ss:Type="String">${stf.isActive ? 'ACTIVE' : 'DISABLED'}</Data></Cell>
    <Cell ss:StyleID="DataCellCenter"><Data ss:Type="String">${escapeXml(stf.registeredAt || '2026-10-15')}</Data></Cell>
    <Cell ss:StyleID="DataCellCenter"><Data ss:Type="Number">${stf.totalLogins || 0}</Data></Cell>
    <Cell ss:StyleID="DataCellLeft"><Data ss:Type="String">${escapeXml(stf.notes || 'Authorized staff account')}</Data></Cell>
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

 <!-- ======================================================================= -->
 <!-- SHEET 2: LIVE LOGIN SESSIONS DATABASE                                   -->
 <!-- ======================================================================= -->
 <Worksheet ss:Name="Live Login Sessions">
  <Table ss:DefaultRowHeight="20">
   <Column ss:Width="35"/>
   <Column ss:Width="140"/>
   <Column ss:Width="95"/>
   <Column ss:Width="160"/>
   <Column ss:Width="120"/>
   <Column ss:Width="110"/>
   <Column ss:Width="100"/>
   <Column ss:Width="90"/>
   <Column ss:Width="180"/>
   <Column ss:Width="90"/>
   <Column ss:Width="110"/>

   <!-- Title Row -->
   <Row ss:Height="36">
    <Cell ss:MergeAcross="10" ss:StyleID="SuperHeader">
     <Data ss:Type="String">ITHI POORAM (ഇത്തിപ്പൂരം) — REAL-TIME STAFF LOGIN SESSIONS DATABASE</Data>
    </Cell>
   </Row>

   <!-- Subtitle Row -->
   <Row ss:Height="20">
    <Cell ss:MergeAcross="10" ss:StyleID="SubHeader">
     <Data ss:Type="String">Monitored In Real-Time • Live Updates Broadcasted Automatically Every 30 Minutes &amp; On Every Sign-In</Data>
    </Cell>
   </Row>

   <!-- Meta Summary Row -->
   <Row ss:Height="22">
    <Cell ss:StyleID="KpiLabel"><Data ss:Type="String">Current Date:</Data></Cell>
    <Cell ss:MergeAcross="2" ss:StyleID="KpiValue"><Data ss:Type="String">${escapeXml(new Date().toLocaleDateString('en-GB'))}</Data></Cell>
    <Cell ss:StyleID="KpiLabel"><Data ss:Type="String">Active Sessions:</Data></Cell>
    <Cell ss:StyleID="KpiValue"><Data ss:Type="Number">${activeSessionsCount}</Data></Cell>
    <Cell ss:StyleID="KpiLabel"><Data ss:Type="String">Total Recorded:</Data></Cell>
    <Cell ss:MergeAcross="3" ss:StyleID="KpiValue"><Data ss:Type="Number">${sessions.length}</Data></Cell>
   </Row>
   <Row ss:Height="8"/>

   <!-- Column Headers -->
   <Row ss:Height="28">
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">#</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Session ID</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Staff ID</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Staff Name</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Sign-In Username</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Role</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Login Date</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Login Time</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Terminal / Device</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Session Status</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Last Active Time</Data></Cell>
   </Row>

   <!-- Data Rows -->
   ${sessions.length === 0 ? `
   <Row ss:Height="24">
    <Cell ss:MergeAcross="10" ss:StyleID="DataCellCenter"><Data ss:Type="String">No login sessions recorded yet today.</Data></Cell>
   </Row>` : sessions.map((ses, idx) => `
   <Row ss:Height="24">
    <Cell ss:StyleID="DataCellCenter"><Data ss:Type="Number">${idx + 1}</Data></Cell>
    <Cell ss:StyleID="IdMonospace"><Data ss:Type="String">${escapeXml(ses.sessionId)}</Data></Cell>
    <Cell ss:StyleID="IdMonospace"><Data ss:Type="String">${escapeXml(ses.staffId)}</Data></Cell>
    <Cell ss:StyleID="DataCellLeft"><Data ss:Type="String">${escapeXml(ses.fullName)}</Data></Cell>
    <Cell ss:StyleID="DataCellLeft"><Data ss:Type="String">${escapeXml(ses.username)}</Data></Cell>
    <Cell ss:StyleID="RoleBadge"><Data ss:Type="String">${escapeXml(ses.role)}</Data></Cell>
    <Cell ss:StyleID="DataCellCenter"><Data ss:Type="String">${escapeXml(ses.loginDate)}</Data></Cell>
    <Cell ss:StyleID="DataCellCenter"><Data ss:Type="String">${escapeXml(ses.loginTime)}</Data></Cell>
    <Cell ss:StyleID="DataCellLeft"><Data ss:Type="String">${escapeXml(ses.clientIp || 'POS Tablet')}</Data></Cell>
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

 <!-- ======================================================================= -->
 <!-- SHEET 3: REGISTRATION & ACCESS AUDIT LOG                                -->
 <!-- ======================================================================= -->
 <Worksheet ss:Name="Registration &amp; Audit Logs">
  <Table ss:DefaultRowHeight="20">
   <Column ss:Width="35"/>
   <Column ss:Width="100"/>
   <Column ss:Width="160"/>
   <Column ss:Width="150"/>
   <Column ss:Width="120"/>
   <Column ss:Width="150"/>
   <Column ss:Width="100"/>
   <Column ss:Width="80"/>
   <Column ss:Width="320"/>

   <!-- Title Row -->
   <Row ss:Height="36">
    <Cell ss:MergeAcross="8" ss:StyleID="SuperHeader">
     <Data ss:Type="String">ITHI POORAM (ഇത്തിപ്പൂരം) — STAFF REGISTRATION &amp; ACCESS AUDIT TRAIL</Data>
    </Cell>
   </Row>

   <!-- Subtitle Row -->
   <Row ss:Height="20">
    <Cell ss:MergeAcross="8" ss:StyleID="SubHeader">
     <Data ss:Type="String">Immutable Chronological Log of All Staff Registrations, Sign-Ins &amp; Security Events</Data>
    </Cell>
   </Row>
   <Row ss:Height="8"/>

   <!-- Column Headers -->
   <Row ss:Height="28">
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">#</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Log ID</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Timestamp</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Action / Event Type</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Username</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Staff Full Name</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Role</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Status</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Audit Event Details</Data></Cell>
   </Row>

   <!-- Data Rows -->
   ${activityLogs.length === 0 ? `
   <Row ss:Height="24">
    <Cell ss:MergeAcross="8" ss:StyleID="DataCellCenter"><Data ss:Type="String">No activity recorded yet.</Data></Cell>
   </Row>` : activityLogs.map((log, idx) => `
   <Row ss:Height="24">
    <Cell ss:StyleID="DataCellCenter"><Data ss:Type="Number">${idx + 1}</Data></Cell>
    <Cell ss:StyleID="IdMonospace"><Data ss:Type="String">${escapeXml(log.id)}</Data></Cell>
    <Cell ss:StyleID="DataCellCenter"><Data ss:Type="String">${escapeXml(log.timestamp)}</Data></Cell>
    <Cell ss:StyleID="RoleBadge"><Data ss:Type="String">${escapeXml(log.actionType)}</Data></Cell>
    <Cell ss:StyleID="DataCellLeft"><Data ss:Type="String">${escapeXml(log.usernameSnapshot)}</Data></Cell>
    <Cell ss:StyleID="DataCellLeft"><Data ss:Type="String">${escapeXml(log.fullNameSnapshot)}</Data></Cell>
    <Cell ss:StyleID="DataCellCenter"><Data ss:Type="String">${escapeXml(log.roleSnapshot)}</Data></Cell>
    <Cell ss:StyleID="${log.success ? 'StatusActive' : 'StatusLoggedOut'}"><Data ss:Type="String">${log.success ? 'SUCCESS' : 'FAILED'}</Data></Cell>
    <Cell ss:StyleID="DataCellLeft"><Data ss:Type="String">${escapeXml(log.details)}</Data></Cell>
   </Row>`).join('')}
  </Table>
  <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
   <FreezePanes/>
   <FrozenNoSplit/>
   <SplitHorizontal>4</SplitHorizontal>
   <TopRowBottomPane>4</TopRowBottomPane>
   <ActivePane>2</ActivePane>
  </WorksheetOptions>
 </Worksheet>
</Workbook>`;
}
