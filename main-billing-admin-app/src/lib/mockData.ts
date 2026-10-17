// In-memory demo data for Ithi Pooram billing & admin portal
export const INITIAL_TABLES = [
  { id: '1', tableCode: 'TQ1', displayName: 'Table 1 (Verandah)', status: 'BILL_PENDING', unpaidCount: 2, unpaidTotalPaise: 70000 },
  { id: '2', tableCode: 'TQ2', displayName: 'Table 2 (Verandah)', status: 'AVAILABLE', unpaidCount: 0, unpaidTotalPaise: 0 },
  { id: '3', tableCode: 'TQ3', displayName: 'Table 3 (Courtyard AC)', status: 'ACTIVE_ORDER', unpaidCount: 1, unpaidTotalPaise: 38000 },
  { id: '4', tableCode: 'TQ4', displayName: 'Table 4 (Courtyard AC)', status: 'AVAILABLE', unpaidCount: 0, unpaidTotalPaise: 0 },
  { id: '5', tableCode: 'TQ5', displayName: 'Table 5 (Inner Hall)', status: 'BILL_PENDING', unpaidCount: 1, unpaidTotalPaise: 44000 },
  { id: '6', tableCode: 'TQ6', displayName: 'Table 6 (Inner Hall)', status: 'AVAILABLE', unpaidCount: 0, unpaidTotalPaise: 0 },
  { id: '7', tableCode: 'TQ7', displayName: 'Table 7 (Heritage Corner)', status: 'ACTIVE_ORDER', unpaidCount: 1, unpaidTotalPaise: 29000 },
  { id: '8', tableCode: 'TQ8', displayName: 'Table 8 (Family Room)', status: 'AVAILABLE', unpaidCount: 0, unpaidTotalPaise: 0 },
  { id: '9', tableCode: 'TQ9', displayName: 'Table 9 (Balcony View)', status: 'AVAILABLE', unpaidCount: 0, unpaidTotalPaise: 0 },
  { id: '10', tableCode: 'TQ10', displayName: 'Table 10 (Garden Gazebo)', status: 'AVAILABLE', unpaidCount: 0, unpaidTotalPaise: 0 },
];

export const INITIAL_ORDERS: Record<string, any[]> = {
  TQ1: [
    {
      id: 'ord-101',
      customerCode: 'TQ1-01',
      internalId: 'LS-20261014-TQ1-001',
      createdAt: new Date(Date.now() - 25 * 60000).toISOString(),
      fulfillmentStatus: 'READY',
      billingStatus: 'UNPAID',
      subtotalPaise: 70000,
      discountPaise: 0,
      grandTotalPaise: 73500,
      table: { tableCode: 'TQ1', displayName: 'Table 1 (Verandah)' },
      items: [
        { id: 'it-1', itemNameSnapshot: 'Special Kerala Seafood Oonu', quantity: 2, itemPriceSnapshotPaise: 16000, lineTotalPaise: 32000 },
        { id: 'it-2', itemNameSnapshot: 'Karimeen Pollichathu', quantity: 1, itemPriceSnapshotPaise: 38000, lineTotalPaise: 38000 },
      ],
    },
    {
      id: 'ord-102',
      customerCode: 'TQ1-02',
      internalId: 'LS-20261014-TQ1-002',
      createdAt: new Date(Date.now() - 10 * 60000).toISOString(),
      fulfillmentStatus: 'PREPARING',
      billingStatus: 'UNPAID',
      subtotalPaise: 14000,
      discountPaise: 0,
      grandTotalPaise: 14700,
      table: { tableCode: 'TQ1', displayName: 'Table 1 (Verandah)' },
      items: [
        { id: 'it-3', itemNameSnapshot: 'Ayala Fry (Mackerel Sizzle)', quantity: 1, itemPriceSnapshotPaise: 14000, lineTotalPaise: 14000 },
      ],
    }
  ],
  TQ3: [
    {
      id: 'ord-301',
      customerCode: 'TQ3-01',
      internalId: 'LS-20261014-TQ3-001',
      createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
      fulfillmentStatus: 'PREPARING',
      billingStatus: 'UNPAID',
      subtotalPaise: 38000,
      discountPaise: 0,
      grandTotalPaise: 39900,
      table: { tableCode: 'TQ3', displayName: 'Table 3 (Courtyard AC)' },
      items: [
        { id: 'it-4', itemNameSnapshot: 'Karimeen Pollichathu', quantity: 1, itemPriceSnapshotPaise: 38000, lineTotalPaise: 38000 },
      ],
    }
  ],
  TQ5: [
    {
      id: 'ord-501',
      customerCode: 'TQ5-01',
      internalId: 'LS-20261014-TQ5-001',
      createdAt: new Date(Date.now() - 35 * 60000).toISOString(),
      fulfillmentStatus: 'READY',
      billingStatus: 'UNPAID',
      subtotalPaise: 44000,
      discountPaise: 0,
      grandTotalPaise: 46200,
      table: { tableCode: 'TQ5', displayName: 'Table 5 (Inner Hall)' },
      items: [
        { id: 'it-5', itemNameSnapshot: 'Neymeen Tawa Fry (King Fish)', quantity: 1, itemPriceSnapshotPaise: 32000, lineTotalPaise: 32000 },
        { id: 'it-6', itemNameSnapshot: 'Traditional Veg Sadhya Lunch', quantity: 1, itemPriceSnapshotPaise: 12000, lineTotalPaise: 12000 },
      ],
    }
  ]
};

export const INITIAL_MENU_CATEGORIES = [
  {
    id: 'cat-1',
    name: 'Kerala Meals & Rice',
    malayalamName: 'കേരള ഊണ് & ചോറ്',
    items: [
      { id: 'm1', name: 'Special Kerala Seafood Oonu', malayalamName: 'സ്പെഷ്യൽ കടൽ മീൻ ഊണ്', pricePaise: 16000, isAvailable: true, currentStock: 140, station: 'Main Meals' },
      { id: 'm2', name: 'Traditional Veg Sadhya Lunch', malayalamName: 'നാടൻ പച്ചക്കറി ഊണ്', pricePaise: 12000, isAvailable: true, currentStock: 75, station: 'Main Meals' },
      { id: 'm3', name: 'Malabar Nei Choru (Ghee Rice)', malayalamName: 'നെയ്യ് ചോറ്', pricePaise: 14000, isAvailable: true, currentStock: 50, station: 'Main Meals' },
    ]
  },
  {
    id: 'cat-2',
    name: 'Seafood Fry & Roasts',
    malayalamName: 'മീൻ വറുത്തത് & റോസ്റ്റ്',
    items: [
      { id: 'm4', name: 'Karimeen Pollichathu (Banana Leaf)', malayalamName: 'കരിമീൻ പൊള്ളിച്ചത്', pricePaise: 38000, isAvailable: true, currentStock: 22, station: 'Tawa & Fry' },
      { id: 'm5', name: 'Neymeen Tawa Fry (King Fish)', malayalamName: 'നെയ്മീൻ തവ ഫ്രൈ', pricePaise: 32000, isAvailable: true, currentStock: 35, station: 'Tawa & Fry' },
      { id: 'm6', name: 'Ayala Fry (Mackerel Sizzle)', malayalamName: 'അയില വറുത്തത്', pricePaise: 14000, isAvailable: true, currentStock: 40, station: 'Tawa & Fry' },
      { id: 'm7', name: 'Chemmeen Roast (Tiger Prawns)', malayalamName: 'ചെമ്മീൻ റോസ്റ്റ്', pricePaise: 29000, isAvailable: true, currentStock: 18, station: 'Tawa & Fry' },
      { id: 'm8', name: 'Koonthal Pepper Fry (Squid Roast)', malayalamName: 'കൂന്തൽ പെപ്പർ ഫ്രൈ', pricePaise: 26000, isAvailable: true, currentStock: 12, station: 'Tawa & Fry' },
    ]
  },
  {
    id: 'cat-3',
    name: 'Kerala Meats & Gravies',
    malayalamName: 'നാടൻ ഇറച്ചി കറികൾ',
    items: [
      { id: 'm9', name: 'Kerala Beef Fry (Ularthiyathu)', malayalamName: 'കേരള ബീഫ് ഉലർത്തിയത്', pricePaise: 23000, isAvailable: true, currentStock: 45, station: 'Main Meals' },
      { id: 'm10', name: 'Nadan Chicken Curry (Clay Pot)', malayalamName: 'നാടൻ ചിക്കൻ കറി', pricePaise: 21000, isAvailable: true, currentStock: 30, station: 'Main Meals' },
      { id: 'm11', name: 'Kerala Porotta (Per piece)', malayalamName: 'കേരള പൊറോട്ട', pricePaise: 1800, isAvailable: true, currentStock: 250, station: 'Main Meals' },
    ]
  },
  {
    id: 'cat-4',
    name: 'Drinks & Desserts',
    malayalamName: 'കുലുക്കി & മധുരം',
    items: [
      { id: 'm12', name: 'Special Kulukki Sarbath', malayalamName: 'സ്പെഷ്യൽ കുലുക്കി സർബത്ത്', pricePaise: 5000, isAvailable: true, currentStock: 90, station: 'Beverage Counter' },
      { id: 'm13', name: 'Spiced Sambharam (Moru Vellam)', malayalamName: 'നാടൻ സംഭാരം', pricePaise: 3500, isAvailable: true, currentStock: 110, station: 'Beverage Counter' },
      { id: 'm14', name: 'Tender Coconut Pudding (Elaneer Payasam)', malayalamName: 'ഇളനീർ പായസം', pricePaise: 9000, isAvailable: true, currentStock: 35, station: 'Beverage Counter' },
    ]
  }
];

export const INITIAL_USERS = [
  { id: 'u1', username: 'owner', fullName: 'Sudheesh Nair (Proprietor)', role: 'MAIN_ADMIN', hasPin: true, isActive: true },
  { id: 'u2', username: 'manager', fullName: 'Anand Varma (General Manager)', role: 'MANAGER', hasPin: true, isActive: true },
  { id: 'u3', username: 'cashier1', fullName: 'Gokul Krishnan (Billing Counter 1)', role: 'CASHIER', hasPin: true, isActive: true },
  { id: 'u4', username: 'cashier2', fullName: 'Meera Rajesh (Billing Counter 2)', role: 'CASHIER', hasPin: true, isActive: true },
  { id: 'u5', username: 'kitchen1', fullName: 'Chef Raghavan (Head Chef)', role: 'KITCHEN_STAFF', hasPin: false, isActive: true },
  { id: 'u6', username: 'kitchen2', fullName: 'Biju Master (Tawa Specialist)', role: 'KITCHEN_STAFF', hasPin: false, isActive: true },
  { id: 'u7', username: 'menueditor', fullName: 'Deepak Store (Inventory)', role: 'MENU_EDITOR', hasPin: false, isActive: true },
];

export const INITIAL_AUDIT_LOGS = [
  { id: 'a1', timestamp: new Date(Date.now() - 5 * 60000).toISOString(), usernameSnapshot: 'cashier1', roleSnapshot: 'CASHIER', actionType: 'PAYMENT_CONFIRMED', module: 'BILLING', orderCode: 'TQ4-02', invoiceNumber: 'INV-20261014-0012', reason: 'UPI payment verified', result: 'SUCCESS' },
  { id: 'a2', timestamp: new Date(Date.now() - 18 * 60000).toISOString(), usernameSnapshot: 'menueditor', roleSnapshot: 'MENU_EDITOR', actionType: 'MENU_AVAILABILITY_CHANGED', module: 'MENU', reason: 'Squid stock low toggle', result: 'SUCCESS' },
  { id: 'a3', timestamp: new Date(Date.now() - 42 * 60000).toISOString(), usernameSnapshot: 'owner', roleSnapshot: 'MAIN_ADMIN', actionType: 'QR_TOKEN_REGENERATED', module: 'TABLE_QR', tableCode: 'TQ1', reason: 'Security stand rotation', result: 'SUCCESS' },
  { id: 'a4', timestamp: new Date(Date.now() - 65 * 60000).toISOString(), usernameSnapshot: 'manager', roleSnapshot: 'MANAGER', actionType: 'DISCOUNT_APPLIED', module: 'BILLING', orderCode: 'TQ7-01', reason: 'Patron courtesy discount', result: 'SUCCESS' },
  { id: 'a5', timestamp: new Date(Date.now() - 90 * 60000).toISOString(), usernameSnapshot: 'cashier1', roleSnapshot: 'CASHIER', actionType: 'LOGIN', module: 'AUTH', reason: 'Morning shift check-in', result: 'SUCCESS' },
];
