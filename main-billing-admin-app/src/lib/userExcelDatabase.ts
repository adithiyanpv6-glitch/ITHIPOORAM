/**
 * Ithi Pooram (ഇത്തിപ്പൂരം) - Master Staff Credentials & Access Control Database
 * Generates visually impressive, perfectly cell-oriented Excel & Google Sheets spreadsheets.
 */

export interface StaffRecord {
  id: string;
  fullName: string;
  username: string;
  pin: string;
  role: 'MAIN_ADMIN' | 'MANAGER' | 'CASHIER' | 'KITCHEN_STAFF' | 'MENU_EDITOR';
  station: string;
  isActive: boolean;
  registeredAt: string;
  isAdminMasterOverride: boolean;
  notes?: string;
}

export const DEFAULT_MASTER_STAFF_DATABASE: StaffRecord[] = [
  {
    id: 'IP-USR-001',
    fullName: 'Owner / Executive Admin',
    username: 'admin',
    pin: '1111',
    role: 'MAIN_ADMIN',
    station: 'Executive Central Gateway',
    isActive: true,
    registeredAt: '2026-10-15 09:00 AM',
    isAdminMasterOverride: true,
    notes: 'Primary Master Admin. Can login to ANY staff account with PIN 1111.',
  },
  {
    id: 'IP-USR-002',
    fullName: 'Gokul Krishnan',
    username: 'gokul',
    pin: '1234',
    role: 'CASHIER',
    station: 'Billing Counter POS 1',
    isActive: true,
    registeredAt: '2026-10-15 10:30 AM',
    isAdminMasterOverride: false,
    notes: 'Main lunch and dinner counter cashier. Authorized for cash & UPI billing.',
  },
  {
    id: 'IP-USR-003',
    fullName: 'Meera Rajesh',
    username: 'meera',
    pin: '5678',
    role: 'CASHIER',
    station: 'Billing Counter POS 2',
    isActive: true,
    registeredAt: '2026-10-15 11:00 AM',
    isAdminMasterOverride: false,
    notes: 'Secondary counter cashier & parcel order billing operator.',
  },
  {
    id: 'IP-USR-004',
    fullName: 'Ananthu V',
    username: 'ananthu',
    pin: '9999',
    role: 'MANAGER',
    station: 'Floor Operations & KDS Gateway',
    isActive: true,
    registeredAt: '2026-10-15 11:45 AM',
    isAdminMasterOverride: false,
    notes: 'Restaurant shift floor manager. Audit access and void order privileges.',
  },
  {
    id: 'IP-USR-005',
    fullName: 'Chef Suresh Kumar',
    username: 'chef_suresh',
    pin: '2233',
    role: 'KITCHEN_STAFF',
    station: 'Main Kitchen Display (KDS)',
    isActive: true,
    registeredAt: '2026-10-16 08:30 AM',
    isAdminMasterOverride: false,
    notes: 'Head seafood chef. Kitchen ticket management (Cooking, Ready, Served).',
  },
  {
    id: 'IP-USR-006',
    fullName: 'Dining QR Supervisor',
    username: 'qr_supervisor',
    pin: '4455',
    role: 'MENU_EDITOR',
    station: 'QR & Menu Control Desk',
    isActive: true,
    registeredAt: '2026-10-16 09:15 AM',
    isAdminMasterOverride: false,
    notes: 'Authorized to update live 86-item availability and generate acrylic table stands.',
  },
];

/**
 * Generates an ultra-clean, perfectly styled XML Spreadsheet (.xls / .xlsx compatible)
 * Supported natively by Microsoft Excel, Google Sheets, LibreOffice, and Numbers.
 */
export function generateMasterStaffExcelXml(staffList: StaffRecord[] = DEFAULT_MASTER_STAFF_DATABASE): string {
  const currentDate = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const currentTime = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
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
  <Created>${new Date().toISOString()}</Created>
 </DocumentProperties>
 <Styles>
  <!-- Default Cell Style -->
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Borders/>
   <Font ss:FontName="Segoe UI" x:Family="Swiss" ss:Size="10" ss:Color="#16191D"/>
   <Interior/>
   <NumberFormat/>
   <Protection/>
  </Style>

  <!-- Title Banner (Dark Crimson / Gold) -->
  <Style ss:ID="TitleBanner">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Size="16" ss:Color="#FFFFFF" ss:Bold="1"/>
   <Interior ss:Color="#9E341D" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#D4AF37"/>
   </Borders>
  </Style>

  <!-- Subtitle Style -->
  <Style ss:ID="SubtitleBanner">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Color="#FDFCF7" ss:Italic="1"/>
   <Interior ss:Color="#7A2816" ss:Pattern="Solid"/>
  </Style>

  <!-- Metadata Bar -->
  <Style ss:ID="MetaBar">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Size="9" ss:Color="#6E665D" ss:Bold="1"/>
   <Interior ss:Color="#F6F1EA" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2D9CC"/>
   </Borders>
  </Style>

  <!-- Table Column Header -->
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

  <!-- Regular Row Cells -->
  <Style ss:ID="CellRegular">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Size="9.5" ss:Color="#16191D"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#EAE5DE"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#EAE5DE"/>
   </Borders>
  </Style>

  <!-- Alternating Zebra Cell -->
  <Style ss:ID="CellZebra">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Size="9.5" ss:Color="#16191D"/>
   <Interior ss:Color="#FAF7F2" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#EAE5DE"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#EAE5DE"/>
   </Borders>
  </Style>

  <!-- PIN Password Cell (Highlighted Monospace) -->
  <Style ss:ID="PinCell">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Consolas" ss:Size="11" ss:Color="#9E341D" ss:Bold="1"/>
   <Interior ss:Color="#FFF3E0" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FFE0B2"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FFE0B2"/>
   </Borders>
  </Style>

  <!-- Role Badge Styles -->
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

  <!-- Status Active Badge -->
  <Style ss:ID="StatusActive">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Size="9" ss:Color="#1E824C" ss:Bold="1"/>
   <Interior ss:Color="#E8F8F0" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#C8E6C9"/>
   </Borders>
  </Style>

  <!-- Security Note Footer -->
  <Style ss:ID="FooterNotice">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center" ss:WrapText="1"/>
   <Font ss:FontName="Segoe UI" ss:Size="8.5" ss:Color="#7F8C8D" ss:Italic="1"/>
   <Interior ss:Color="#FDFCF7" ss:Pattern="Solid"/>
  </Style>
 </Styles>

 <!-- WORKSHEET 1: MASTER STAFF DATABASE -->
 <Worksheet ss:Name="Staff_Credentials_Database">
  <Table ss:ExpandedColumnCount="9" x:FullColumns="1" x:FullRows="1" ss:DefaultRowHeight="20">
   <!-- Column Width Definitions -->
   <Column ss:Width="85"/>   <!-- Staff ID -->
   <Column ss:Width="160"/>  <!-- Full Name -->
   <Column ss:Width="120"/>  <!-- Username -->
   <Column ss:Width="100"/>  <!-- 4-Digit PIN -->
   <Column ss:Width="120"/>  <!-- Role -->
   <Column ss:Width="180"/>  <!-- Station -->
   <Column ss:Width="85"/>   <!-- Status -->
   <Column ss:Width="160"/>  <!-- Registered At -->
   <Column ss:Width="230"/>  <!-- Security Notes -->

   <!-- Row 1: Brand Title Banner -->
   <Row ss:Height="40">
    <Cell ss:MergeAcross="8" ss:StyleID="TitleBanner">
     <Data ss:Type="String">ITHI POORAM (ഇത്തിപ്പൂരം) • MASTER STAFF &amp; ADMIN CREDENTIALS</Data>
    </Cell>
   </Row>

   <!-- Row 2: Location Subtitle -->
   <Row ss:Height="22">
    <Cell ss:MergeAcross="8" ss:StyleID="SubtitleBanner">
     <Data ss:Type="String">Vanchiyoor, Trivandrum | Confidential Access Control &amp; Authentication Registry</Data>
    </Cell>
   </Row>

   <!-- Row 3: Generation Metadata -->
   <Row ss:Height="22">
    <Cell ss:MergeAcross="8" ss:StyleID="MetaBar">
     <Data ss:Type="String">System Sync: Live Linked to POS Gateway • Generated on: ${currentDate} at ${currentTime} • Telegram Archive: @IthiPooram_Group</Data>
    </Cell>
   </Row>

   <!-- Row 4: Spacer -->
   <Row ss:Height="8"/>

   <!-- Row 5: Column Headers -->
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

   <!-- Data Rows -->
   ${staffList
     .map((staff, index) => {
       const isZebra = index % 2 === 1;
       const cellStyle = isZebra ? 'CellZebra' : 'CellRegular';
       let roleStyle = 'RoleCashier';
       if (staff.role === 'MAIN_ADMIN') roleStyle = 'RoleAdmin';
       else if (staff.role === 'MANAGER') roleStyle = 'RoleManager';
       else if (staff.role === 'KITCHEN_STAFF') roleStyle = 'RoleKitchen';

       return `
   <Row ss:Height="24">
    <Cell ss:StyleID="${cellStyle}"><Data ss:Type="String">${escapeXml(staff.id)}</Data></Cell>
    <Cell ss:StyleID="${cellStyle}"><Data ss:Type="String">${escapeXml(staff.fullName)}</Data></Cell>
    <Cell ss:StyleID="${cellStyle}"><Data ss:Type="String">${escapeXml(staff.username)}</Data></Cell>
    <Cell ss:StyleID="PinCell"><Data ss:Type="String">${escapeXml(staff.pin)}</Data></Cell>
    <Cell ss:StyleID="${roleStyle}"><Data ss:Type="String">${escapeXml(staff.role)}</Data></Cell>
    <Cell ss:StyleID="${cellStyle}"><Data ss:Type="String">${escapeXml(staff.station)}</Data></Cell>
    <Cell ss:StyleID="StatusActive"><Data ss:Type="String">${staff.isActive ? 'ACTIVE' : 'INACTIVE'}</Data></Cell>
    <Cell ss:StyleID="${cellStyle}"><Data ss:Type="String">${escapeXml(staff.registeredAt)}</Data></Cell>
    <Cell ss:StyleID="${cellStyle}"><Data ss:Type="String">${escapeXml(staff.notes || 'Standard access')}</Data></Cell>
   </Row>`;
     })
     .join('')}

   <!-- Spacer -->
   <Row ss:Height="12"/>

   <!-- Confidentiality Notice -->
   <Row ss:Height="28">
    <Cell ss:MergeAcross="8" ss:StyleID="FooterNotice">
     <Data ss:Type="String">CONFIDENTIAL &amp; PROPRIETARY: This master credentials database is protected. Admin Master PIN [1111] possesses emergency override permissions across all tablet terminals. Keep this document stored securely in the private Telegram vault.</Data>
    </Cell>
   </Row>
  </Table>

  <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
   <Selected/>
   <FreezePanes/>
   <FrozenNoSplit/>
   <SplitPane>
    <PaneType>3</PaneType>
    <Row>5</Row>
   </SplitPane>
   <ProtectObjects>False</ProtectObjects>
   <ProtectScenarios>False</ProtectScenarios>
  </WorksheetOptions>
 </Worksheet>

 <!-- WORKSHEET 2: ROLE POLICIES & PERMISSIONS -->
 <Worksheet ss:Name="Roles_and_Permissions">
  <Table ss:ExpandedColumnCount="4" x:FullColumns="1" x:FullRows="1" ss:DefaultRowHeight="20">
   <Column ss:Width="130"/>
   <Column ss:Width="160"/>
   <Column ss:Width="260"/>
   <Column ss:Width="180"/>

   <Row ss:Height="30">
    <Cell ss:MergeAcross="3" ss:StyleID="TitleBanner">
     <Data ss:Type="String">SECURITY ROLE DEFINITIONS &amp; PERMISSION MATRIX</Data>
    </Cell>
   </Row>
   <Row ss:Height="8"/>
   <Row ss:Height="24">
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">ROLE CODE</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">TITLE</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">ACCESS RIGHTS &amp; RESPONSIBILITIES</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">AUTHORIZATION SCOPE</Data></Cell>
   </Row>
   <Row ss:Height="24">
    <Cell ss:StyleID="RoleAdmin"><Data ss:Type="String">MAIN_ADMIN</Data></Cell>
    <Cell ss:StyleID="CellRegular"><Data ss:Type="String">Owner / Executive Admin</Data></Cell>
    <Cell ss:StyleID="CellRegular"><Data ss:Type="String">Full control over Billing, Menu, Sales CSV, Floor Plan, Tables, and User Accounts. Master PIN overrides any account.</Data></Cell>
    <Cell ss:StyleID="CellRegular"><Data ss:Type="String">All Terminals &amp; Settings</Data></Cell>
   </Row>
   <Row ss:Height="24">
    <Cell ss:StyleID="RoleManager"><Data ss:Type="String">MANAGER</Data></Cell>
    <Cell ss:StyleID="CellRegular"><Data ss:Type="String">Shift Manager</Data></Cell>
    <Cell ss:StyleID="CellRegular"><Data ss:Type="String">Floor supervision, order cancellation approval, audit log reviews, and daily register closing.</Data></Cell>
    <Cell ss:StyleID="CellRegular"><Data ss:Type="String">Billing + Audit + KDS</Data></Cell>
   </Row>
   <Row ss:Height="24">
    <Cell ss:StyleID="RoleCashier"><Data ss:Type="String">CASHIER</Data></Cell>
    <Cell ss:StyleID="CellRegular"><Data ss:Type="String">Counter Billing Staff</Data></Cell>
    <Cell ss:StyleID="CellRegular"><Data ss:Type="String">Order taking, table bill generation, Cash/UPI settlement, and physical receipt printing.</Data></Cell>
    <Cell ss:StyleID="CellRegular"><Data ss:Type="String">Billing POS Terminal</Data></Cell>
   </Row>
   <Row ss:Height="24">
    <Cell ss:StyleID="RoleKitchen"><Data ss:Type="String">KITCHEN_STAFF</Data></Cell>
    <Cell ss:StyleID="CellRegular"><Data ss:Type="String">Kitchen Chef / Cook</Data></Cell>
    <Cell ss:StyleID="CellRegular"><Data ss:Type="String">Live order status updates (Preparing, Ready, Served). Kitchen Display System access only.</Data></Cell>
    <Cell ss:StyleID="CellRegular"><Data ss:Type="String">Kitchen Display Station</Data></Cell>
   </Row>
  </Table>
 </Worksheet>
</Workbook>`;
}

/**
 * Generates clean CSV content for instant copy/paste into Google Sheets
 */
export function generateStaffCsv(staffList: StaffRecord[] = DEFAULT_MASTER_STAFF_DATABASE): string {
  const headers = [
    'Staff ID',
    'Employee Full Name',
    'Login Username',
    'Access PIN (4-Digit)',
    'Assigned Role',
    'Counter / Terminal',
    'Account Status',
    'Registration Date',
    'Master Override Privilege',
    'Notes',
  ];

  const rows = staffList.map((s) => [
    s.id,
    `"${s.fullName.replace(/"/g, '""')}"`,
    s.username,
    `'${s.pin}`, // Leading apostrophe preserves 4-digit formatting (e.g. 0123) in Google Sheets
    s.role,
    `"${s.station}"`,
    s.isActive ? 'ACTIVE' : 'INACTIVE',
    `"${s.registeredAt}"`,
    s.isAdminMasterOverride ? 'YES (Override)' : 'NO',
    `"${(s.notes || '').replace(/"/g, '""')}"`,
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
}

/**
 * Escapes characters for XML compliance
 */
function escapeXml(unsafe: string): string {
  return (unsafe || '').replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '&':
        return '&amp;';
      case '\'':
        return '&apos;';
      case '"':
        return '&quot;';
      default:
        return c;
    }
  });
}

/**
 * Dispatches the Master Excel credentials file to the designated private Telegram group
 */
export async function dispatchMasterDatabaseToTelegram(
  telegramBotToken?: string,
  chatId?: string,
  staffList?: StaffRecord[]
): Promise<{ success: boolean; message: string }> {
  const list = staffList || DEFAULT_MASTER_STAFF_DATABASE;
  const xmlContent = generateMasterStaffExcelXml(list);

  // If token is provided, send through official Telegram Bot API
  if (telegramBotToken && chatId) {
    try {
      const cleanToken = telegramBotToken.trim();
      const cleanChatId = chatId.trim();
      
      const boundary = `----TelegramBoundary${Date.now()}`;
      const filename = `IthiPooram_Master_Staff_Database_${new Date().toISOString().slice(0, 10)}.xls`;
      
      // Send document via Telegram API multipart/form-data
      const formDataParts = [
        `--${boundary}\r\nContent-Disposition: form-data; name="chat_id"\r\n\r\n${cleanChatId}\r\n`,
        `--${boundary}\r\nContent-Disposition: form-data; name="caption"\r\n\r\n🔒 ITHI POORAM • Master Staff Credentials Database\nUpdated: ${new Date().toLocaleString()}\nStaff Count: ${list.length} accounts\nStatus: Password Protected Vault Archive\r\n`,
        `--${boundary}\r\nContent-Disposition: form-data; name="document"; filename="${filename}"\r\nContent-Type: application/vnd.ms-excel\r\n\r\n${xmlContent}\r\n`,
        `--${boundary}--\r\n`,
      ];

      const res = await fetch(`https://api.telegram.org/bot${cleanToken}/sendDocument`, {
        method: 'POST',
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
        },
        body: formDataParts.join(''),
      });

      const data = await res.json();
      if (data.ok) {
        return {
          success: true,
          message: `Master Excel Database successfully uploaded to Telegram Group! (Message ID: ${data.result?.message_id})`,
        };
      } else {
        return {
          success: false,
          message: data.description || 'Telegram API returned an error.',
        };
      }
    } catch (e: any) {
      return {
        success: false,
        message: e.message || 'Network error communicating with Telegram API.',
      };
    }
  }

  // Fallback direct download
  return {
    success: true,
    message: 'Master Excel Database compiled and ready for local save / Telegram upload.',
  };
}
