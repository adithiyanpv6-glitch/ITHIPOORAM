import { NextResponse } from 'next/server';
import { db } from '@/lib/serverDb';

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
  { params }: { params: { orderId: string } }
) {
  const order = db.orders.find((o) => o.id === params.orderId || o.customerCode === params.orderId);
  if (!order) {
    return NextResponse.json({ error: 'Order ticket not found' }, { status: 404, headers: corsHeaders });
  }

  const calculation = {
    subtotalPaise: order.subtotalPaise,
    cgstPaise: order.cgstPaise,
    sgstPaise: order.sgstPaise,
    grandTotalPaise: order.grandTotalPaise,
    roundOffPaise: 0,
  };

  return NextResponse.json(
    {
      orderId: order.id,
      customerCode: order.customerCode,
      calculation,
      items: order.items,
    },
    { headers: corsHeaders }
  );
}
