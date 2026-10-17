import { NextResponse } from 'next/server';
import { db } from '@/lib/serverDb';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET() {
  return NextResponse.json(db.menuCategories || [], { headers: corsHeaders });
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { itemId, isAvailable, currentStock, pricePaise, reason } = body;

    if (!itemId) {
      return NextResponse.json({ error: 'itemId is required' }, { status: 400, headers: corsHeaders });
    }

    let updatedItem: any = null;
    for (const cat of db.menuCategories) {
      const it = cat.items.find((item) => item.id === itemId);
      if (it) {
        if (typeof isAvailable === 'boolean') it.isAvailable = isAvailable;
        if (currentStock !== undefined) it.currentStock = currentStock;
        if (pricePaise !== undefined) it.pricePaise = pricePaise;
        updatedItem = it;
        break;
      }
    }

    if (!updatedItem) {
      return NextResponse.json({ error: 'Item not found in live menu' }, { status: 404, headers: corsHeaders });
    }

    // Add audit log entry
    db.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actionType: pricePaise !== undefined ? 'MENU_PRICE_CHANGED' : 'MENU_AVAILABILITY_CHANGED',
      module: 'MENU',
      usernameSnapshot: 'Menu Manager',
      reason: reason || `Updated item ${updatedItem.name}`,
      success: true,
    });

    return NextResponse.json({ success: true, item: updatedItem }, { headers: corsHeaders });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500, headers: corsHeaders });
  }
}
