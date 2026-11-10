import { NextResponse } from 'next/server';
import { db, refreshTableSummaries, persistDb } from '@/lib/serverDb';
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
    const { adminPin } = body;

    // Strict Admin Security Verification
    if (!adminPin || adminPin !== '5566') {
      return NextResponse.json(
        { error: 'Unauthorized. Invalid Admin PIN. Only the primary administrator can perform a factory reset.' },
        { status: 403, headers: corsHeaders }
      );
    }

    // Complete Clean Zero-State Wipe (all tables, menu, staff, orders, sessions set to 0)
    db.orders = [];
    db.kitchenTickets = [];
    db.auditLogs = [];
    db.tables = [];
    db.menuCategories = [];
    db.staffUsers = [];
    db.loginSessions = [];
    db.staffActivityLogs = [];
    db.dailyMenuHistory = [];
    db.historicalSales = [];
    db.currentBusinessDate = new Date().toISOString().slice(0, 10);
    db.dailyOrderSequence = 0;
    db.dailyInvoiceSequence = 0;

    refreshTableSummaries();
    persistDb();

    return NextResponse.json(
      {
        success: true,
        message: 'Factory reset completed. All staff, menu, tables, and orders wiped to 0. System is in pristine initial state.',
        kpis: {
          grossSalesPaise: 0,
          paidOrdersCount: 0,
          runningOrdersCount: 0,
          staffCount: 0,
          tablesCount: 0,
          menuCount: 0,
        },
      },
      { headers: corsHeaders }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Factory reset failed: ' + (err.message || 'Server error') },
      { status: 500, headers: corsHeaders }
    );
  }
}
