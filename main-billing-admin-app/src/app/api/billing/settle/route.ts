import { NextResponse } from 'next/server';
import { db, refreshTableSummaries } from '@/lib/serverDb';

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
    const { orderId, paymentMode, pin, referenceNumber, cashierName } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400, headers: corsHeaders });
    }

    const order = db.orders.find((o) => o.id === orderId || o.customerCode === orderId);
    if (!order) {
      return NextResponse.json({ error: 'Order ticket not found' }, { status: 404, headers: corsHeaders });
    }

    if (order.paymentStatus === 'PAID') {
      return NextResponse.json({ error: 'This ticket has already been settled' }, { status: 400, headers: corsHeaders });
    }

    const now = new Date();
    const invoiceNumber = `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(Math.floor(Math.random() * 900) + 100)}`;

    order.paymentStatus = 'PAID';
    order.fulfillmentStatus = 'SERVED';
    order.paymentMode = paymentMode || 'UPI';
    order.paymentRef = referenceNumber || '';
    order.cashierName = cashierName || 'Cashier';
    order.paidAt = now.toISOString();

    // Record into historical sales for CSV reporting
    db.historicalSales.unshift({
      invoiceNumber,
      orderCode: order.customerCode,
      tableCode: order.tableCode,
      grandTotalPaise: order.grandTotalPaise,
      paymentMode: order.paymentMode || 'UPI',
      settledAt: now.toISOString(),
      cashier: order.cashierName || 'Cashier',
    });

    // Refresh tables
    refreshTableSummaries();

    // Record audit log
    db.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      timestamp: now.toISOString(),
      actionType: 'BILL_SETTLED',
      module: 'BILLING',
      usernameSnapshot: order.cashierName || 'Cashier',
      orderCode: order.customerCode,
      tableCode: order.tableCode,
      invoiceNumber,
      reason: `Settled check via ${order.paymentMode} for ${(order.grandTotalPaise / 100).toFixed(2)} INR`,
      success: true,
    });

    const thermalReceipt = `
========================================
             ITHI POORAM
       ഇത്തിപ്പൂരം തനി നാടൻ രുചി
       Vanchiyoor, Trivandrum
     GSTIN: 32AAAAI0000A1Z5
----------------------------------------
Invoice: ${invoiceNumber}
Date:    ${now.toLocaleDateString('en-IN')} ${now.toLocaleTimeString('en-IN')}
Table:   ${order.tableCode} (${order.tableName})
Cashier: ${order.cashierName}
----------------------------------------
Item                  Qty   Rate    Total
----------------------------------------
${order.items.map((i) => `${i.itemName.padEnd(21).substring(0, 21)} ${String(i.quantity).padStart(2)}  ${(i.pricePaise / 100).toFixed(2).padStart(6)} ${(i.lineTotalPaise / 100).toFixed(2).padStart(7)}`).join('\n')}
----------------------------------------
Subtotal:                    ₹${(order.subtotalPaise / 100).toFixed(2)}
CGST (2.5%):                 ₹${(order.cgstPaise / 100).toFixed(2)}
SGST (2.5%):                 ₹${(order.sgstPaise / 100).toFixed(2)}
----------------------------------------
GRAND TOTAL:                 ₹${(order.grandTotalPaise / 100).toFixed(2)}
Payment: [${order.paymentMode}] ${order.paymentRef ? `Ref: ${order.paymentRef}` : 'VERIFIED'}
========================================
   Thank You! Please Visit Again.
========================================
`.trim();

    return NextResponse.json(
      {
        success: true,
        invoice: {
          invoiceNumber,
          customerCode: order.customerCode,
          tableCode: order.tableCode,
          grandTotalPaise: order.grandTotalPaise,
          paymentMode: order.paymentMode,
          paidAt: order.paidAt,
        },
        thermalReceipt,
      },
      { headers: corsHeaders }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500, headers: corsHeaders });
  }
}
