import { NextResponse } from 'next/server';
import { db, refreshTableSummaries } from '@/lib/serverDb';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const order = db.orders.find((o) => o.id === params.id || o.customerCode === params.id);
  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404, headers: corsHeaders });
  }
  return NextResponse.json(order, { headers: corsHeaders });
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const order = db.orders.find((o) => o.id === params.id || o.customerCode === params.id);
  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404, headers: corsHeaders });
  }

  try {
    const body = await request.json();
    if (body.fulfillmentStatus) {
      order.fulfillmentStatus = body.fulfillmentStatus;
    }
    if (body.paymentStatus) {
      order.paymentStatus = body.paymentStatus;
    }

    refreshTableSummaries();
    return NextResponse.json({ success: true, order }, { headers: corsHeaders });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500, headers: corsHeaders });
  }
}
