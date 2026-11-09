import { NextResponse } from 'next/server';
import { db, refreshTableSummaries } from '@/lib/serverDb';
import fs from 'fs';
import path from 'path';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { adminPin, resetMode } = body;

    // Strict Admin Security Verification
    if (!adminPin || adminPin !== '5566') {
      return NextResponse.json(
        { error: 'Unauthorized. Invalid Admin PIN. Only the primary administrator can perform a factory reset.' },
        { status: 403, headers: corsHeaders }
      );
    }

    // 1. Wipe all test sales and customer transactions
    db.orders = [];
    db.kitchenTickets = [];
    db.auditLogs = [];

    // 2. Reset active tables to clean AVAILABLE state
    if (resetMode === 'FULL_WIPE') {
      db.tables = [];
      db.menuCategories = [];
    } else {
      // Standard handover reset: clean tables, 0 orders
      db.tables = db.tables.map((t, idx) => ({
        ...t,
        status: 'AVAILABLE',
        unpaidCount: 0,
        unpaidTotalPaise: 0,
      }));
    }

    refreshTableSummaries();

    // 3. Persist clean zero-state ledger to disk
    try {
      const storeFile = path.join(process.cwd(), 'tmp', 'restaurant_store.json');
      fs.writeFileSync(
        storeFile,
        JSON.stringify(
          {
            tables: db.tables,
            orders: db.orders,
            kitchenTickets: db.kitchenTickets,
            menuCategories: db.menuCategories,
            auditLogs: db.auditLogs,
            staffUsers: db.staffUsers,
          },
          null,
          2
        ),
        'utf-8'
      );
    } catch (e) {
      console.warn('Could not persist factory reset to local disk file (non-fatal):', e);
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Factory reset completed successfully. The application is now at a fresh, clean zero-state ready for restaurant handover.',
        kpis: {
          grossSalesPaise: 0,
          paidOrdersCount: 0,
          runningOrdersCount: 0,
        },
      },
      { headers: corsHeaders }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Factory reset failed' }, { status: 500, headers: corsHeaders });
  }
}
