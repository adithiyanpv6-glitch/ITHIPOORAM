// Central Restaurant Database Engine for Ithi Pooram
// Provides unified cross-app state for Billing POS, Kitchen Display, Customer Ordering, and Admin Analytics.

import { INITIAL_MENU_CATEGORIES } from './mockData';

export interface RestaurantTable {
  id: string;
  tableCode: string;
  displayName: string;
  capacity: number;
  status: 'AVAILABLE' | 'ACTIVE_ORDER' | 'BILL_PENDING' | 'CLOSED';
  unpaidCount: number;
  unpaidTotalPaise: number;
}

export interface OrderItem {
  id: string;
  itemId: string;
  itemName: string;
  itemMalayalamName?: string;
  quantity: number;
  pricePaise: number;
  lineTotalPaise: number;
  station: 'MAIN_KITCHEN' | 'SEAFOOD_FRY' | 'BEVERAGE_COUNTER';
  notes?: string;
}

export interface RestaurantOrder {
  id: string;
  customerCode: string; // e.g. TQ1-01
  tableCode: string;
  tableName: string;
  deviceSessionId?: string; // Links this order to the specific customer phone session
  roundCount?: number; // 1 = initial order, 2+ = add-on dishes added
  items: OrderItem[];
  subtotalPaise: number;
  cgstPaise: number;
  sgstPaise: number;
  grandTotalPaise: number;
  fulfillmentStatus: 'NEW' | 'ACCEPTED' | 'PREPARING' | 'READY' | 'SERVED' | 'CANCELLED';
  paymentStatus: 'UNPAID' | 'PAID' | 'REFUNDED';
  paymentMode?: 'CASH' | 'UPI' | 'CARD' | 'SPLIT_PAYMENT';
  paymentRef?: string;
  cashierName?: string;
  createdAt: string;
  updatedAt?: string;
  paidAt?: string;
}

export interface KitchenTicket {
  id: string;
  orderId: string;
  customerCode: string;
  tableCode: string;
  tableName: string;
  station: 'MAIN_KITCHEN' | 'SEAFOOD_FRY' | 'BEVERAGE_COUNTER';
  stationLabel: string;
  status: 'NEW' | 'ACCEPTED' | 'PREPARING' | 'READY' | 'SERVED';
  createdAtMs: number;
  tableNotes?: string;
  items: Array<{ id: string; name: string; qty: number; notes?: string }>;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actionType: string;
  module: 'AUTH' | 'BILLING' | 'ORDER' | 'KITCHEN' | 'MENU' | 'TABLE_QR';
  usernameSnapshot: string;
  orderCode?: string;
  tableCode?: string;
  invoiceNumber?: string;
  reason?: string;
  success: boolean;
}

export interface MenuItemDb {
  id: string;
  name: string;
  malayalamName?: string;
  description?: string;
  pricePaise: number;
  dietary?: 'VEG' | 'NON_VEG' | 'SEAFOOD';
  isAvailable: boolean;
  currentStock?: number | null;
  station?: string;
  category?: string;
}

export interface MenuCategoryDb {
  id: string;
  name: string;
  malayalamName?: string;
  items: MenuItemDb[];
}

// Global singleton to persist state in Node.js server environment across route calls
declare global {
  var __ITHIPOORAM_DB__: {
    tables: RestaurantTable[];
    orders: RestaurantOrder[];
    kitchenTickets: KitchenTicket[];
    auditLogs: AuditLogEntry[];
    menuCategories: MenuCategoryDb[];
    historicalSales: Array<{
      invoiceNumber: string;
      orderCode: string;
      tableCode: string;
      grandTotalPaise: number;
      paymentMode: string;
      settledAt: string;
      cashier: string;
    }>;
  } | undefined;
}

const DEFAULT_TABLES: RestaurantTable[] = [
  { id: 't1', tableCode: 'TQ1', displayName: 'Table 1 (Verandah)', capacity: 4, status: 'AVAILABLE', unpaidCount: 0, unpaidTotalPaise: 0 },
  { id: 't2', tableCode: 'TQ2', displayName: 'Table 2 (Verandah)', capacity: 4, status: 'AVAILABLE', unpaidCount: 0, unpaidTotalPaise: 0 },
  { id: 't3', tableCode: 'TQ3', displayName: 'Table 3 (Courtyard AC)', capacity: 6, status: 'AVAILABLE', unpaidCount: 0, unpaidTotalPaise: 0 },
  { id: 't4', tableCode: 'TQ4', displayName: 'Table 4 (Courtyard AC)', capacity: 4, status: 'AVAILABLE', unpaidCount: 0, unpaidTotalPaise: 0 },
  { id: 't5', tableCode: 'TQ5', displayName: 'Table 5 (Inner Hall)', capacity: 8, status: 'AVAILABLE', unpaidCount: 0, unpaidTotalPaise: 0 },
  { id: 't6', tableCode: 'TQ6', displayName: 'Table 6 (Inner Hall)', capacity: 4, status: 'AVAILABLE', unpaidCount: 0, unpaidTotalPaise: 0 },
  { id: 't7', tableCode: 'TQ7', displayName: 'Table 7 (Heritage Corner)', capacity: 2, status: 'AVAILABLE', unpaidCount: 0, unpaidTotalPaise: 0 },
  { id: 't8', tableCode: 'TQ8', displayName: 'Table 8 (Family Room)', capacity: 6, status: 'AVAILABLE', unpaidCount: 0, unpaidTotalPaise: 0 },
  { id: 't9', tableCode: 'TQ9', displayName: 'Table 9 (Balcony View)', capacity: 4, status: 'AVAILABLE', unpaidCount: 0, unpaidTotalPaise: 0 },
  { id: 't10', tableCode: 'TQ10', displayName: 'Table 10 (Garden Gazebo)', capacity: 6, status: 'AVAILABLE', unpaidCount: 0, unpaidTotalPaise: 0 },
];

// Seed sample historical sales for multi-day reporting
function generateInitialHistoricalSales() {
  const sales = [];
  const now = new Date();
  
  // Past 30 days of data
  for (let daysAgo = 30; daysAgo >= 0; daysAgo--) {
    const dayDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    const dayOrdersCount = daysAgo === 0 ? 5 : Math.floor(Math.random() * 12 + 6);
    
    for (let i = 1; i <= dayOrdersCount; i++) {
      const tNum = Math.floor(Math.random() * 10) + 1;
      const tCode = `TQ${tNum}`;
      const amountPaise = (Math.floor(Math.random() * 25 + 5) * 100) * 100;
      const modes = ['UPI', 'CASH', 'CARD', 'SPLIT_PAYMENT'];
      const mode = modes[Math.floor(Math.random() * modes.length)];
      
      const invoiceTime = new Date(dayDate);
      invoiceTime.setHours(12 + (i % 8), Math.floor(Math.random() * 59));
      
      sales.push({
        invoiceNumber: `INV-${dayDate.getFullYear()}${String(dayDate.getMonth() + 1).padStart(2, '0')}${String(dayDate.getDate()).padStart(2, '0')}-${String(i).padStart(3, '0')}`,
        orderCode: `${tCode}-${String(i).padStart(2, '0')}`,
        tableCode: tCode,
        grandTotalPaise: amountPaise,
        paymentMode: mode,
        settledAt: invoiceTime.toISOString(),
        cashier: i % 2 === 0 ? 'Gokul Krishnan' : 'Meera Rajesh',
      });
    }
  }
  return sales;
}

if (!global.__ITHIPOORAM_DB__) {
  global.__ITHIPOORAM_DB__ = {
    tables: DEFAULT_TABLES,
    orders: [],
    kitchenTickets: [],
    auditLogs: [
      {
        id: 'aud-init-1',
        timestamp: new Date().toISOString(),
        actionType: 'SYSTEM_BOOT',
        module: 'AUTH',
        usernameSnapshot: 'System',
        reason: 'Restaurant core database engine initialized.',
        success: true,
      }
    ],
    menuCategories: JSON.parse(JSON.stringify(INITIAL_MENU_CATEGORIES)),
    historicalSales: generateInitialHistoricalSales(),
  };
}

export const db = global.__ITHIPOORAM_DB__;

// Helper to recalculate table unpaid totals
export function refreshTableSummaries() {
  for (const table of db.tables) {
    const tableOrders = db.orders.filter(
      (o) => o.tableCode === table.tableCode && o.paymentStatus === 'UNPAID'
    );
    table.unpaidCount = tableOrders.length;
    table.unpaidTotalPaise = tableOrders.reduce((sum, o) => sum + o.grandTotalPaise, 0);

    if (table.unpaidCount > 0) {
      const hasReady = tableOrders.some((o) => o.fulfillmentStatus === 'READY' || o.fulfillmentStatus === 'SERVED');
      table.status = hasReady ? 'BILL_PENDING' : 'ACTIVE_ORDER';
    } else {
      table.status = 'AVAILABLE';
    }
  }
}
