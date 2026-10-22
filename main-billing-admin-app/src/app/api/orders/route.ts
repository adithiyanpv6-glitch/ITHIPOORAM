import { NextResponse } from 'next/server';
import { db, refreshTableSummaries, RestaurantOrder, KitchenTicket } from '@/lib/serverDb';
import { autoDispatchTableExcelToTelegram } from '@/lib/autoTelegramExcelSync';
import { pushLiveUpdateToGoogleWorkspace } from '@/lib/googleWorkspaceSync';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tableCode = searchParams.get('tableCode');
  const status = searchParams.get('status');
  const deviceSessionId = searchParams.get('deviceSessionId');
  const unpaidOnly = searchParams.get('unpaidOnly') === 'true';

  let result = db.orders;
  if (tableCode) {
    result = result.filter((o) => o.tableCode.toUpperCase() === tableCode.toUpperCase());
  }
  if (status) {
    result = result.filter((o) => o.fulfillmentStatus === status);
  }
  if (deviceSessionId) {
    result = result.filter((o) => o.deviceSessionId === deviceSessionId);
  }
  if (unpaidOnly) {
    result = result.filter((o) => o.paymentStatus === 'UNPAID');
  }

  return NextResponse.json(result, { headers: corsHeaders });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tableCode, items, notes, deviceSessionId, parentOrderId, isAddOn } = body;

    if (!tableCode || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Table code and at least one item are required' },
        { status: 400, headers: corsHeaders }
      );
    }

    const table = db.tables.find((t) => t.tableCode.toUpperCase() === tableCode.toUpperCase());
    const tableName = table ? table.displayName : `Table ${tableCode}`;

    // Format incoming new items
    const formattedItems = items.map((it: any, idx: number) => {
      const pricePaise = it.pricePaise || 12000;
      const quantity = Math.max(1, it.quantity || it.qty || 1);
      const lineTotalPaise = pricePaise * quantity;
      
      // Determine kitchen station
      const category = (it.category || '').toLowerCase();
      let station: 'MAIN_KITCHEN' | 'SEAFOOD_FRY' | 'BEVERAGE_COUNTER' = 'MAIN_KITCHEN';
      if (category.includes('seafood') || category.includes('fry') || it.name?.toLowerCase().includes('fry') || it.name?.toLowerCase().includes('karimeen')) {
        station = 'SEAFOOD_FRY';
      } else if (category.includes('drink') || category.includes('dessert') || it.name?.toLowerCase().includes('sarbath') || it.name?.toLowerCase().includes('pudding')) {
        station = 'BEVERAGE_COUNTER';
      }

      return {
        id: `it-${Date.now()}-${idx}`,
        itemId: it.id || `m-${idx}`,
        itemName: it.name || it.itemName || 'Kerala Dish',
        itemMalayalamName: it.malayalamName,
        quantity,
        pricePaise,
        lineTotalPaise,
        station,
        notes: it.notes || '',
      };
    });

    // Check if this is an ADD-ON to an existing active order for this device and table
    let existingOrder: RestaurantOrder | undefined;
    if (parentOrderId) {
      existingOrder = db.orders.find((o) => o.id === parentOrderId && o.paymentStatus === 'UNPAID');
    } else if (isAddOn && deviceSessionId) {
      existingOrder = db.orders.find(
        (o) => o.tableCode.toUpperCase() === tableCode.toUpperCase() && 
               o.deviceSessionId === deviceSessionId && 
               o.paymentStatus === 'UNPAID'
      );
    }

    if (existingOrder) {
      // Re-order continuation: append new items to the existing active order
      existingOrder.roundCount = (existingOrder.roundCount || 1) + 1;
      existingOrder.items.push(...formattedItems);
      
      const newSubtotal = existingOrder.items.reduce((acc, it) => acc + it.lineTotalPaise, 0);
      
      existingOrder.subtotalPaise = newSubtotal;
      existingOrder.cgstPaise = 0;
      existingOrder.sgstPaise = 0;
      existingOrder.grandTotalPaise = newSubtotal; // Net final price (GST included by Admin)
      existingOrder.updatedAt = new Date().toISOString();
      if (existingOrder.fulfillmentStatus === 'READY' || existingOrder.fulfillmentStatus === 'SERVED') {
        existingOrder.fulfillmentStatus = 'PREPARING'; // New round cooking
      }

      // Create new kitchen ticket for just the newly added items tagged with Round info
      const stationGroups: Record<string, typeof formattedItems> = {};
      for (const it of formattedItems) {
        if (!stationGroups[it.station]) stationGroups[it.station] = [];
        stationGroups[it.station].push(it);
      }

      for (const [stn, stnItems] of Object.entries(stationGroups)) {
        const stationName = stn as 'MAIN_KITCHEN' | 'SEAFOOD_FRY' | 'BEVERAGE_COUNTER';
        const label = stationName === 'SEAFOOD_FRY' ? 'Tawa & Fry' : stationName === 'BEVERAGE_COUNTER' ? 'Beverages & Sweets' : 'Main Meals & Curries';

        const ticket: KitchenTicket = {
          id: `kt-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          orderId: existingOrder.id,
          customerCode: `${existingOrder.customerCode} (Add-on Round ${existingOrder.roundCount})`,
          tableCode: existingOrder.tableCode,
          tableName: existingOrder.tableName,
          station: stationName,
          stationLabel: label,
          status: 'NEW',
          createdAtMs: Date.now(),
          tableNotes: notes ? `ADD-ON (Round ${existingOrder.roundCount}): ${notes}` : `ADD-ON (Round ${existingOrder.roundCount})`,
          items: stnItems.map((it) => ({
            id: it.id,
            name: it.itemName,
            qty: it.quantity,
            notes: it.notes,
          })),
        };
        db.kitchenTickets.unshift(ticket);
      }

      refreshTableSummaries();

      db.auditLogs.unshift({
        id: `aud-${Date.now()}`,
        timestamp: new Date().toISOString(),
        actionType: 'ORDER_ADDON_ADDED',
        module: 'ORDER',
        usernameSnapshot: 'Customer Mobile QR',
        orderCode: existingOrder.customerCode,
        tableCode: tableCode.toUpperCase(),
        reason: `Re-order: ${formattedItems.length} add-on items appended to order (Round ${existingOrder.roundCount})`,
        success: true,
      });

      // Auto-dispatch updated multi-sheet Excel file to Telegram group
      autoDispatchTableExcelToTelegram(`Add-on Order at Table ${tableCode} (Round ${existingOrder.roundCount})`).catch(() => {});
      pushLiveUpdateToGoogleWorkspace().catch(() => {});

      return NextResponse.json({ success: true, order: existingOrder, isAddOn: true }, { status: 200, headers: corsHeaders });
    }

    // Brand new order (new customer or fresh session)
    const existingTableOrders = db.orders.filter(
      (o) => o.tableCode.toUpperCase() === tableCode.toUpperCase()
    );
    const nextSeq = existingTableOrders.length + 1;
    const customerCode = `${tableCode.toUpperCase()}-${String(nextSeq).padStart(2, '0')}`;

    const subtotalPaise = formattedItems.reduce((acc, it) => acc + it.lineTotalPaise, 0);
    const grandTotalPaise = subtotalPaise; // Net final price (GST included by Admin)

    const newOrder: RestaurantOrder = {
      id: `ord-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      customerCode,
      tableCode: tableCode.toUpperCase(),
      tableName,
      deviceSessionId: deviceSessionId || undefined,
      roundCount: 1,
      items: formattedItems,
      subtotalPaise,
      cgstPaise: 0,
      sgstPaise: 0,
      grandTotalPaise,
      fulfillmentStatus: 'NEW',
      paymentStatus: 'UNPAID',
      createdAt: new Date().toISOString(),
    };

    db.orders.unshift(newOrder);

    // Group items into Kitchen Tickets by Station
    const stationGroups: Record<string, typeof formattedItems> = {};
    for (const it of formattedItems) {
      if (!stationGroups[it.station]) stationGroups[it.station] = [];
      stationGroups[it.station].push(it);
    }

    for (const [stn, stnItems] of Object.entries(stationGroups)) {
      const stationName = stn as 'MAIN_KITCHEN' | 'SEAFOOD_FRY' | 'BEVERAGE_COUNTER';
      const label = stationName === 'SEAFOOD_FRY' ? 'Tawa & Fry' : stationName === 'BEVERAGE_COUNTER' ? 'Beverages & Sweets' : 'Main Meals & Curries';

      const ticket: KitchenTicket = {
        id: `kt-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        orderId: newOrder.id,
        customerCode: newOrder.customerCode,
        tableCode: newOrder.tableCode,
        tableName: newOrder.tableName,
        station: stationName,
        stationLabel: label,
        status: 'NEW',
        createdAtMs: Date.now(),
        tableNotes: notes,
        items: stnItems.map((it) => ({
          id: it.id,
          name: it.itemName,
          qty: it.quantity,
          notes: it.notes,
        })),
      };
      db.kitchenTickets.unshift(ticket);
    }

    refreshTableSummaries();

    db.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actionType: 'ORDER_PLACED',
      module: 'ORDER',
      usernameSnapshot: 'Customer Mobile QR',
      orderCode: customerCode,
      tableCode: tableCode.toUpperCase(),
      reason: `New dining order placed: ${formattedItems.length} items (${(grandTotalPaise / 100).toFixed(2)} INR)`,
      success: true,
    });

    // Auto-dispatch updated multi-sheet Excel file to Telegram group
    autoDispatchTableExcelToTelegram(`New Customer Order at Table ${tableCode} (${customerCode})`).catch(() => {});
    pushLiveUpdateToGoogleWorkspace().catch(() => {});

    return NextResponse.json({ success: true, order: newOrder, isAddOn: false }, { status: 201, headers: corsHeaders });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to place order' }, { status: 500, headers: corsHeaders });
  }
}
