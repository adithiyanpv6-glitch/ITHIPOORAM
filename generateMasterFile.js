const fs = require('fs');
const path = require('path');

const currentDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
const currentTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

const staff = [
  { id: 'IP-USR-001', name: 'Owner / Executive Admin', user: 'admin', pin: '1111', role: 'MAIN_ADMIN', station: 'Executive Central Gateway', status: 'ACTIVE', date: '15-Oct-2026', note: 'Primary Master Admin. Emergency bypass PIN 1111 valid across all screens.' },
  { id: 'IP-USR-002', name: 'Gokul Krishnan', user: 'gokul', pin: '1234', role: 'CASHIER', station: 'Billing Counter POS 1', status: 'ACTIVE', date: '15-Oct-2026', note: 'Main lunch and dinner counter cashier. Authorized for cash & UPI billing.' },
  { id: 'IP-USR-003', name: 'Meera Rajesh', user: 'meera', pin: '5678', role: 'CASHIER', station: 'Billing Counter POS 2', status: 'ACTIVE', date: '15-Oct-2026', note: 'Secondary counter cashier & parcel order billing operator.' },
  { id: 'IP-USR-004', name: 'Ananthu V', user: 'ananthu', pin: '9999', role: 'MANAGER', station: 'Floor Operations & KDS Gateway', status: 'ACTIVE', date: '15-Oct-2026', note: 'Restaurant shift floor manager. Audit access and void order privileges.' },
  { id: 'IP-USR-005', name: 'Chef Suresh Kumar', user: 'chef_suresh', pin: '2233', role: 'KITCHEN_STAFF', station: 'Main Kitchen Display (KDS)', status: 'ACTIVE', date: '16-Oct-2026', note: 'Head seafood chef. Kitchen ticket management (Cooking, Ready, Served).' },
  { id: 'IP-USR-006', name: 'Dining QR Supervisor', user: 'qr_supervisor', pin: '4455', role: 'MENU_EDITOR', station: 'QR & Menu Control Desk', status: 'ACTIVE', date: '16-Oct-2026', note: 'Authorized to update live 86-item availability and generate acrylic table stands.' }
];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
  <Title>Ithi Pooram - Staff Credentials &amp; Access Database</Title>
  <Subject>Confidential Restaurant Credentials &amp; Role Permissions</Subject>
  <Author>Ithi Pooram Restaurant Systems</Author>
 </DocumentProperties>
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Color="#16191D"/>
  </Style>
  <Style ss:ID="TitleBanner">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Size="16" ss:Color="#FFFFFF" ss:Bold="1"/>
   <Interior ss:Color="#9E341D" ss:Pattern="Solid"/>
   <Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#D4AF37"/></Borders>
  </Style>
  <Style ss:ID="SubtitleBanner">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Color="#FDFCF7" ss:Italic="1"/>
   <Interior ss:Color="#7A2816" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="MetaBar">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Size="9" ss:Color="#6E665D" ss:Bold="1"/>
   <Interior ss:Color="#F6F1EA" ss:Pattern="Solid"/>
   <Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2D9CC"/></Borders>
  </Style>
  <Style ss:ID="TableHeader">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Color="#FFFFFF" ss:Bold="1"/>
   <Interior ss:Color="#16191D" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#333333"/>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#D4AF37"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#333333"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#333333"/>
   </Borders>
  </Style>
  <Style ss:ID="CellRegular">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Size="9.5" ss:Color="#16191D"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#EAE5DE"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#EAE5DE"/>
   </Borders>
  </Style>
  <Style ss:ID="CellZebra">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Size="9.5" ss:Color="#16191D"/>
   <Interior ss:Color="#FAF7F2" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#EAE5DE"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#EAE5DE"/>
   </Borders>
  </Style>
  <Style ss:ID="PinCell">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Consolas" ss:Size="11" ss:Color="#9E341D" ss:Bold="1"/>
   <Interior ss:Color="#FFF3E0" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FFE0B2"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FFE0B2"/>
   </Borders>
  </Style>
  <Style ss:ID="RoleAdmin">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Size="9" ss:Color="#FFFFFF" ss:Bold="1"/>
   <Interior ss:Color="#9E341D" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="RoleManager">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Size="9" ss:Color="#FFFFFF" ss:Bold="1"/>
   <Interior ss:Color="#2C3E50" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="RoleCashier">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Size="9" ss:Color="#FFFFFF" ss:Bold="1"/>
   <Interior ss:Color="#1E824C" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="RoleKitchen">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Size="9" ss:Color="#FFFFFF" ss:Bold="1"/>
   <Interior ss:Color="#D35400" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="StatusActive">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Size="9" ss:Color="#1E824C" ss:Bold="1"/>
   <Interior ss:Color="#E8F8F0" ss:Pattern="Solid"/>
   <Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#C8E6C9"/></Borders>
  </Style>
  <Style ss:ID="FooterNotice">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center" ss:WrapText="1"/>
   <Font ss:FontName="Segoe UI" ss:Size="8.5" ss:Color="#7F8C8D" ss:Italic="1"/>
   <Interior ss:Color="#FDFCF7" ss:Pattern="Solid"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="Staff_Credentials_Database">
  <Table ss:ExpandedColumnCount="9" x:FullColumns="1" x:FullRows="1" ss:DefaultRowHeight="20">
   <Column ss:Width="85"/>
   <Column ss:Width="160"/>
   <Column ss:Width="120"/>
   <Column ss:Width="100"/>
   <Column ss:Width="120"/>
   <Column ss:Width="180"/>
   <Column ss:Width="85"/>
   <Column ss:Width="140"/>
   <Column ss:Width="240"/>
   <Row ss:Height="40"><Cell ss:MergeAcross="8" ss:StyleID="TitleBanner"><Data ss:Type="String">ITHI POORAM (ഇത്തിപ്പൂരം) • MASTER STAFF &amp; ADMIN CREDENTIALS</Data></Cell></Row>
   <Row ss:Height="22"><Cell ss:MergeAcross="8" ss:StyleID="SubtitleBanner"><Data ss:Type="String">Vanchiyoor, Trivandrum | Confidential Access Control &amp; Authentication Registry</Data></Cell></Row>
   <Row ss:Height="22"><Cell ss:MergeAcross="8" ss:StyleID="MetaBar"><Data ss:Type="String">System Sync: Live Linked to POS Gateway • Generated on: ${currentDate} at ${currentTime} • Telegram Archive: @IthiPooram_Group</Data></Cell></Row>
   <Row ss:Height="8"/>
   <Row ss:Height="28">
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">STAFF ID</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">EMPLOYEE FULL NAME</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">LOGIN USERNAME</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">ACCESS PIN (4-DIGIT)</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">ASSIGNED ROLE</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">COUNTER / TERMINAL</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">STATUS</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">REGISTERED DATE</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">SECURITY PRIVILEGE NOTES</Data></Cell>
   </Row>
` + staff.map((s, idx) => {
  const isZebra = idx % 2 === 1;
  const cStyle = isZebra ? 'CellZebra' : 'CellRegular';
  let rStyle = 'RoleCashier';
  if (s.role === 'MAIN_ADMIN') rStyle = 'RoleAdmin';
  else if (s.role === 'MANAGER') rStyle = 'RoleManager';
  else if (s.role === 'KITCHEN_STAFF') rStyle = 'RoleKitchen';
  return `   <Row ss:Height="24">
    <Cell ss:StyleID="${cStyle}"><Data ss:Type="String">${s.id}</Data></Cell>
    <Cell ss:StyleID="${cStyle}"><Data ss:Type="String">${s.name}</Data></Cell>
    <Cell ss:StyleID="${cStyle}"><Data ss:Type="String">${s.user}</Data></Cell>
    <Cell ss:StyleID="PinCell"><Data ss:Type="String">${s.pin}</Data></Cell>
    <Cell ss:StyleID="${rStyle}"><Data ss:Type="String">${s.role}</Data></Cell>
    <Cell ss:StyleID="${cStyle}"><Data ss:Type="String">${s.station}</Data></Cell>
    <Cell ss:StyleID="StatusActive"><Data ss:Type="String">${s.status}</Data></Cell>
    <Cell ss:StyleID="${cStyle}"><Data ss:Type="String">${s.date}</Data></Cell>
    <Cell ss:StyleID="${cStyle}"><Data ss:Type="String">${s.note}</Data></Cell>
   </Row>`;
}).join('\n') + `
   <Row ss:Height="12"/>
   <Row ss:Height="28">
    <Cell ss:MergeAcross="8" ss:StyleID="FooterNotice">
     <Data ss:Type="String">CONFIDENTIAL &amp; PROPRIETARY: This master credentials database is protected. Admin Master PIN [1111] possesses emergency override permissions across all tablet terminals. Keep this document stored securely in the private Telegram vault.</Data>
    </Cell>
   </Row>
  </Table>
  <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
   <Selected/>
   <FreezePanes/><FrozenNoSplit/>
   <SplitPane><PaneType>3</PaneType><Row>5</Row></SplitPane>
  </WorksheetOptions>
 </Worksheet>
</Workbook>`;

const publicPath = path.join(__dirname, 'main-billing-admin-app', 'public');
if (!fs.existsSync(publicPath)) fs.mkdirSync(publicPath, { recursive: true });

fs.writeFileSync(path.join(publicPath, 'IthiPooram_Master_Staff_Database.xls'), xml, 'utf8');
fs.writeFileSync(path.join(__dirname, 'IthiPooram_Master_Staff_Database.xls'), xml, 'utf8');

// Generate CSV for Google Sheets
const csv = [
  'Staff ID,Employee Full Name,Login Username,Access PIN (4-Digit),Assigned Role,Counter / Terminal,Status,Registered Date,Security Notes',
  ...staff.map(s => `${s.id},"${s.name}",${s.user},'${s.pin},${s.role},"${s.station}",${s.status},${s.date},"${s.note}"`)
].join('\r\n');

fs.writeFileSync(path.join(publicPath, 'IthiPooram_Master_Staff_Database.csv'), csv, 'utf8');
fs.writeFileSync(path.join(__dirname, 'IthiPooram_Master_Staff_Database.csv'), csv, 'utf8');

console.log('Successfully generated master Excel database files!');
