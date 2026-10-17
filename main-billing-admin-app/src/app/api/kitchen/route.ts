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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const station = searchParams.get('station');

  let result = db.kitchenTickets;
  if (station && station !== 'ALL') {
    result = result.filter((k) => k.station === station);
  }

  return NextResponse.json({ tickets: result, timestamp: Date.now() }, { headers: corsHeaders });
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { ticketId, status } = body;

    const ticket = db.kitchenTickets.find((k) => k.id === ticketId);
    if (!ticket) {
      return NextResponse.json({ error: 'Kitchen ticket not found' }, { status: 404, headers: corsHeaders });
    }

    ticket.status = status;

    // Update parent order fulfillment status
    const parentOrder = db.orders.find((o) => o.id === ticket.orderId);
    if (parentOrder) {
      const allTickets = db.kitchenTickets.filter((k) => k.orderId === ticket.orderId);
      const allReady = allTickets.every((k) => k.status === 'READY' || k.status === 'SERVED');
      const anyPreparing = allTickets.some((k) => k.status === 'PREPARING' || k.status === 'READY');

      if (allReady) {
        parentOrder.fulfillmentStatus = 'READY';
      } else if (anyPreparing) {
        parentOrder.fulfillmentStatus = 'PREPARING';
      } else if (status === 'ACCEPTED') {
        parentOrder.fulfillmentStatus = 'ACCEPTED';
      }
    }

    refreshTableSummaries();

    db.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actionType: 'KITCHEN_STATUS_CHANGE',
      module: 'KITCHEN',
      usernameSnapshot: 'Chef Station',
      orderCode: ticket.customerCode,
      tableCode: ticket.tableCode,
      reason: `Station ${ticket.stationLabel} marked ticket as ${status}`,
      success: true,
    });

    return NextResponse.json({ success: true, ticket }, { headers: corsHeaders });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500, headers: corsHeaders });
  }
}
