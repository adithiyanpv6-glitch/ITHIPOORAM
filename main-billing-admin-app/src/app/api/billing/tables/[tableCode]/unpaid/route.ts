import { NextResponse } from 'next/server';
import { db, refreshTableSummaries } from '@/lib/serverDb';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET(
  request: Request,
  { params }: { params: { tableCode: string } }
) {
  refreshTableSummaries();
  const tCode = params.tableCode.toUpperCase();
  const unpaidOrders = db.orders.filter(
    (o) => o.tableCode.toUpperCase() === tCode && o.paymentStatus === 'UNPAID'
  );

  return NextResponse.json({ unpaidOrders }, { headers: corsHeaders });
}
