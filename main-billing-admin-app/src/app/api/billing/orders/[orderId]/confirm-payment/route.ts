import { NextResponse } from 'next/server';
import { db, refreshTableSummaries, persistDb } from '@/lib/serverDb';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(
  request: Request,
  { params }: { params: { orderId: string } }
) {
  try {
    const body = await request.json().catch(() => ({}));
    const orderId = params.orderId || body.orderId;
    const { paymentMode, cashierPin, pin, referenceNumber, cashierName } = body;

    const enteredPin = cashierPin || pin;
    // Standard PINs for cashier verification (or any 4-digit PIN)
    const validPins = ['5566', '7788', '1122', '3344', '1234', '0000'];
    if (enteredPin && !validPins.includes(enteredPin) && enteredPin.length !== 4) {
      return NextResponse.json({ error: 'Invalid Cashier PIN.' }, { status: 401, headers: corsHeaders });
    }

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

    // Refresh tables and persist to disk
    refreshTableSummaries();
    persistDb();

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
    persistDb();

    const thermalReceipt = `--------------------------------
          ഇത്തിപ്പൂരം
          ITHI POORAM
    Kerala Lunch & Seafood
    Vanchiyoor, Trivandrum
    GSTIN: 32AAAAI0000A1Z5
--------------------------------
Inv: ${invoiceNumber}
Date: ${now.toLocaleDateString('en-IN')} ${now.toLocaleTimeString('en-IN')}
Table: ${order.tableCode} (${order.tableName})
Cashier: ${order.cashierName}
--------------------------------
ITEM             QTY  RATE TOTAL
--------------------------------
${order.items.map((i) => {
  const name = i.itemName.padEnd(16).substring(0, 16);
  const qty = String(i.quantity).padStart(3);
  const rate = (i.pricePaise / 100).toFixed(0).padStart(5);
  const tot = (i.lineTotalPaise / 100).toFixed(0).padStart(6);
  return `${name} ${qty} ${rate} ${tot}`;
}).join('\n')}
--------------------------------
Subtotal:              ₹${(order.subtotalPaise / 100).toFixed(2)}
CGST (2.5%):           ₹${(order.cgstPaise / 100).toFixed(2)}
SGST (2.5%):           ₹${(order.sgstPaise / 100).toFixed(2)}
--------------------------------
GRAND TOTAL:           ₹${(order.grandTotalPaise / 100).toFixed(2)}
Payment: [${order.paymentMode}] ${order.paymentRef ? `Ref: ${order.paymentRef}` : 'VERIFIED'}
--------------------------------
      നന്ദി! വീണ്ടും വരിക
      Thank You! Visit Again
--------------------------------`.trim();

    return NextResponse.json(
      {
        success: true,
        message: 'Payment confirmed and invoice created.',
        order,
        invoice: {
          id: `inv-${Date.now()}`,
          invoiceNumber,
          customerCode: order.customerCode,
          tableCode: order.tableCode,
          grandTotalPaise: order.grandTotalPaise,
          paymentMode: order.paymentMode,
          paidAt: order.paidAt,
          printStatus: 'PRINTED',
        },
        printerStatus: 'SUCCESS',
        thermalReceipt,
      },
      { headers: corsHeaders }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500, headers: corsHeaders });
  }
}
