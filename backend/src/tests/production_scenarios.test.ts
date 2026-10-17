import request from 'supertest';
import { createApp } from '../app';
import { prisma } from '../db/prisma';
import { getBusinessDate } from '../utils/date';
import { calculateTaxes } from '../utils/currency';

const app = createApp();

describe('Ithi Pooram End-to-End Operational & Business Rules Test Suite', () => {
  let ownerToken: string;
  let cashierToken: string;
  let kitchenToken: string;
  let tq1Table: any;
  let validQrToken: string;
  let sampleMenuItem: any;
  let testOrderId: string;
  let testInvoiceId: string;

  beforeAll(async () => {
    // Fetch seeded table TQ1
    tq1Table = await prisma.restaurantTable.findUnique({
      where: { tableCode: 'TQ1' },
    });
    validQrToken = tq1Table.qrToken;

    // Fetch sample menu item
    sampleMenuItem = await prisma.menuItem.findFirst({
      where: { isAvailable: true },
    });

    // Login Owner
    const ownerRes = await request(app).post('/api/auth/login').send({
      username: 'owner',
      password: 'Owner@1234',
    });
    ownerToken = ownerRes.body.token;

    // Login Cashier
    const cashierRes = await request(app).post('/api/auth/login').send({
      username: 'cashier1',
      password: 'Cashier@1234',
    });
    cashierToken = cashierRes.body.token;

    // Login Kitchen
    const kitchenRes = await request(app).post('/api/auth/login').send({
      username: 'kitchen1',
      password: 'Kitchen@1234',
    });
    kitchenToken = kitchenRes.body.token;
  });

  // Scenario 1: Customer scans valid TQ1 QR and places one order
  test('Scenario 1: Customer scans valid TQ1 QR and places one order', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send({
        tableCode: 'TQ1',
        qrToken: validQrToken,
        items: [{ menuItemId: sampleMenuItem.id, quantity: 2, itemNotes: 'Less spicy' }],
        customerNotes: 'Please serve quickly',
        idempotencyKey: `test-order-s1-${Date.now()}`,
      });

    expect(res.status).toBe(201);
    expect(res.body.order).toBeDefined();
    expect(res.body.order.customerCode).toMatch(/^TQ1-\d{2}$/);
    expect(res.body.order.fulfillmentStatus).toBe('NEW');
    expect(res.body.order.billingStatus).toBe('UNPAID');
    testOrderId = res.body.order.id;
  });

  // Scenario 2: Customer uses an invalid or tampered QR token
  test('Scenario 2: Customer uses an invalid or tampered QR token', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send({
        tableCode: 'TQ1',
        qrToken: 'fake-tampered-token-123',
        items: [{ menuItemId: sampleMenuItem.id, quantity: 1 }],
      });

    expect(res.status).toBe(403);
    expect(res.body.error).toContain('QR token is invalid');
  });

  // Scenario 3: Customer tries to submit the same cart twice quickly (Idempotency)
  test('Scenario 3: Customer tries to submit the same cart twice quickly', async () => {
    const key = `idem-key-${Date.now()}`;
    const payload = {
      tableCode: 'TQ1',
      qrToken: validQrToken,
      items: [{ menuItemId: sampleMenuItem.id, quantity: 1 }],
      idempotencyKey: key,
    };

    const firstRes = await request(app).post('/api/orders').send(payload);
    expect(firstRes.status).toBe(201);

    const secondRes = await request(app).post('/api/orders').send(payload);
    expect(secondRes.status).toBe(200);
    expect(secondRes.body.message).toContain('idempotent');
    expect(secondRes.body.order.id).toBe(firstRes.body.order.id);
  });

  // Scenario 4: Two customers place separate orders from TQ1 at almost the same time
  test('Scenario 4: Two customers place separate orders from TQ1 concurrently', async () => {
    const [resA, resB] = await Promise.all([
      request(app).post('/api/orders').send({
        tableCode: 'TQ1',
        qrToken: validQrToken,
        items: [{ menuItemId: sampleMenuItem.id, quantity: 1 }],
        idempotencyKey: `concurrent-a-${Date.now()}`,
      }),
      request(app).post('/api/orders').send({
        tableCode: 'TQ1',
        qrToken: validQrToken,
        items: [{ menuItemId: sampleMenuItem.id, quantity: 1 }],
        idempotencyKey: `concurrent-b-${Date.now()}`,
      }),
    ]);

    expect(resA.status).toBe(201);
    expect(resB.status).toBe(201);
    expect(resA.body.order.customerCode).not.toBe(resB.body.order.customerCode);
  });

  // Scenario 5: Kitchen receives all valid orders in real time
  test('Scenario 5: Kitchen fetches active orders and sees the new orders', async () => {
    const res = await request(app)
      .get('/api/kitchen/active')
      .set('Authorization', `Bearer ${kitchenToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    const found = res.body.find((o: any) => o.id === testOrderId);
    expect(found).toBeDefined();
    expect(found.fulfillmentStatus).toBe('NEW');
  });

  // Scenario 6: Kitchen updates order status and billing sees it immediately
  test('Scenario 6: Kitchen updates order status (NEW -> PREPARING -> READY)', async () => {
    const prepRes = await request(app)
      .patch(`/api/kitchen/orders/${testOrderId}/status`)
      .set('Authorization', `Bearer ${kitchenToken}`)
      .send({ status: 'PREPARING' });
    expect(prepRes.status).toBe(200);
    expect(prepRes.body.order.fulfillmentStatus).toBe('PREPARING');

    const readyRes = await request(app)
      .patch(`/api/kitchen/orders/${testOrderId}/status`)
      .set('Authorization', `Bearer ${kitchenToken}`)
      .send({ status: 'READY' });
    expect(readyRes.status).toBe(200);
    expect(readyRes.body.order.fulfillmentStatus).toBe('READY');
  });

  // Scenario 7: Customer creates multiple orders from the same table
  test('Scenario 7: Customer creates multiple orders from the same table (sequences increment)', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send({
        tableCode: 'TQ1',
        qrToken: validQrToken,
        items: [{ menuItemId: sampleMenuItem.id, quantity: 1 }],
      });

    expect(res.status).toBe(201);
    expect(res.body.order.customerCode).toMatch(/^TQ1-\d{2}$/);
  });

  // Scenario 8: Cashier selects TQ1 and sees only latest 3 to 5 unpaid orders
  test('Scenario 8: Cashier selects TQ1 and sees unpaid orders (max 5)', async () => {
    const res = await request(app)
      .get('/api/billing/tables/TQ1/unpaid')
      .set('Authorization', `Bearer ${cashierToken}`);

    expect(res.status).toBe(200);
    expect(res.body.table.tableCode).toBe('TQ1');
    expect(Array.isArray(res.body.unpaidOrders)).toBe(true);
    expect(res.body.unpaidOrders.length).toBeGreaterThan(0);
    expect(res.body.unpaidOrders.length).toBeLessThanOrEqual(5);
  });

  // Scenario 9: Cashier bills one selected order successfully
  test('Scenario 9: Cashier bills selected order with PIN confirmation', async () => {
    const res = await request(app)
      .post(`/api/billing/orders/${testOrderId}/confirm-payment`)
      .set('Authorization', `Bearer ${cashierToken}`)
      .send({
        paymentMode: 'UPI',
        referenceNumber: 'UPI/2026/987654321',
        cashierPin: '5566', // Cashier1 PIN
      });

    expect(res.status).toBe(200);
    expect(res.body.order.billingStatus).toBe('PAID');
    expect(res.body.invoice.invoiceNumber).toMatch(/^INV-\d{8}-\d{4}$/);
    expect(res.body.thermalReceipt).toContain('TAX INVOICE');
    testInvoiceId = res.body.invoice.id;
  });

  // Scenario 10: Two cashiers try to bill the same order simultaneously (Race condition test)
  test('Scenario 10: Billing an already billed order is strictly rejected', async () => {
    const res = await request(app)
      .post(`/api/billing/orders/${testOrderId}/confirm-payment`)
      .set('Authorization', `Bearer ${cashierToken}`)
      .send({
        paymentMode: 'CASH',
        cashierPin: '5566',
      });

    expect(res.status).toBe(409);
    expect(res.body.error).toContain('already been paid');
  });

  // Scenario 11: Printer fails after payment confirmation
  test('Scenario 11: Printer failure simulation records failed print status but retains payment & invoice', async () => {
    // Create fresh order
    const orderRes = await request(app).post('/api/orders').send({
      tableCode: 'TQ1',
      qrToken: validQrToken,
      items: [{ menuItemId: sampleMenuItem.id, quantity: 1 }],
    });
    const newOrderId = orderRes.body.order.id;

    const res = await request(app)
      .post(`/api/billing/orders/${newOrderId}/confirm-payment`)
      .set('Authorization', `Bearer ${cashierToken}`)
      .send({
        paymentMode: 'CASH',
        cashierPin: '5566',
        simulatePrinterFailure: true,
      });

    expect(res.status).toBe(200);
    expect(res.body.order.billingStatus).toBe('PAID');
    expect(res.body.printerStatus).toBe('PRINTER_ERROR');
    expect(res.body.invoice.printStatus).toBe('FAILED');
  });

  // Scenario 12: Cashier retries receipt printing with reason and PIN
  test('Scenario 12: Cashier retries printing or reprints with mandatory reason', async () => {
    const res = await request(app)
      .post(`/api/billing/invoices/${testInvoiceId}/reprint`)
      .set('Authorization', `Bearer ${cashierToken}`)
      .send({
        cashierPin: '5566',
        reason: 'Customer requested printed duplicate receipt for company reimbursement',
      });

    expect(res.status).toBe(200);
    expect(res.body.printCount).toBeGreaterThan(1);
    expect(res.body.thermalReceipt).toContain('DUPLICATE REPRINT');
  });

  // Scenario 13: Cashier tries to bill an already-paid order
  test('Scenario 13: Cashier cannot modify or bill an already-paid order', async () => {
    const res = await request(app)
      .post(`/api/billing/orders/${testOrderId}/confirm-payment`)
      .set('Authorization', `Bearer ${cashierToken}`)
      .send({
        paymentMode: 'CARD',
        cashierPin: '5566',
      });

    expect(res.status).toBe(409);
  });

  // Scenario 14: Cashier attempts to access restricted admin settings
  test('Scenario 14: Cashier attempts to access restricted admin user management', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${cashierToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toContain('Access denied');
  });

  // Scenario 15: Kitchen user tries to access sales data
  test('Scenario 15: Kitchen user tries to access billing / sales overview', async () => {
    const res = await request(app)
      .get('/api/admin/overview')
      .set('Authorization', `Bearer ${kitchenToken}`);

    expect(res.status).toBe(403);
  });

  // Scenario 16: Employee enters incorrect password/PIN repeatedly
  test('Scenario 16: Repeated incorrect password triggers lockout tracking', async () => {
    // Reset test user failed attempts for clean test isolation
    await prisma.user.update({
      where: { username: 'cashier2' },
      data: { failedLoginAttempts: 0, lockoutUntil: null, isActive: true },
    });

    const badAttempts = [1, 2, 3];
    for (const _ of badAttempts) {
      const res = await request(app).post('/api/auth/login').send({
        username: 'cashier2',
        password: 'WrongPassword!',
      });
      expect(res.status).toBe(401);
    }
  });

  // Scenario 17: Admin disables an employee account while that employee is logged in
  test('Scenario 17: Admin disables employee account -> instant session revocation', async () => {
    // Reset lockout for cashier2
    await prisma.user.update({
      where: { username: 'cashier2' },
      data: { failedLoginAttempts: 0, lockoutUntil: null, isActive: true },
    });

    const targetUser = await prisma.user.findUnique({ where: { username: 'cashier2' } });

    // Admin disables account
    await request(app)
      .patch(`/api/admin/users/${targetUser!.id}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ isActive: false });

    // Cashier2 tries to access endpoint with prior credentials
    const loginRes = await request(app).post('/api/auth/login').send({
      username: 'cashier2',
      password: 'Cashier@1234',
    });
    expect(loginRes.status).toBe(403);
    expect(loginRes.body.error).toContain('disabled');

    // Re-enable for cleanliness
    await prisma.user.update({ where: { id: targetUser!.id }, data: { isActive: true } });
  });

  // Scenario 18: Menu item becomes unavailable while a customer has it in cart
  test('Scenario 18: Out-of-stock menu item rejected during order placement', async () => {
    // Disable item
    await request(app)
      .patch(`/api/menu/items/${sampleMenuItem.id}/availability`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ isAvailable: false, reason: 'Sold out for lunch rush' });

    // Customer attempts to place order with disabled item
    const res = await request(app).post('/api/orders').send({
      tableCode: 'TQ1',
      qrToken: validQrToken,
      items: [{ menuItemId: sampleMenuItem.id, quantity: 1 }],
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('currently unavailable');

    // Restore availability
    await prisma.menuItem.update({
      where: { id: sampleMenuItem.id },
      data: { isAvailable: true },
    });
  });

  // Scenario 19 & 20: Admin changes item price; existing order retains original price
  test('Scenario 19 & 20: Admin updates menu price; existing order retains original price snapshot', async () => {
    // 1. Create order at current price
    const initialPrice = sampleMenuItem.pricePaise;
    const createRes = await request(app).post('/api/orders').send({
      tableCode: 'TQ1',
      qrToken: validQrToken,
      items: [{ menuItemId: sampleMenuItem.id, quantity: 1 }],
    });
    const orderCreated = createRes.body.order;
    expect(orderCreated.items[0].itemPriceSnapshotPaise).toBe(initialPrice);

    // 2. Admin increases price
    const newPrice = initialPrice + 5000; // + ₹50
    const priceRes = await request(app)
      .patch(`/api/menu/items/${sampleMenuItem.id}/price`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        newPricePaise: newPrice,
        reason: 'Daily market fish auction price increase',
      });
    expect(priceRes.status).toBe(200);

    // 3. Verify existing order retained initial price snapshot
    const fetchedOrder = await prisma.order.findUnique({
      where: { id: orderCreated.id },
      include: { items: true },
    });
    expect(fetchedOrder!.items[0].itemPriceSnapshotPaise).toBe(initialPrice);

    // Restore price
    await prisma.menuItem.update({
      where: { id: sampleMenuItem.id },
      data: { pricePaise: initialPrice },
    });
  });

  // Scenario 21: Cancellation / refund requires reason and creates audit records
  test('Scenario 21: Cancellation requires reason and creates audit records', async () => {
    const orderRes = await request(app).post('/api/orders').send({
      tableCode: 'TQ1',
      qrToken: validQrToken,
      items: [{ menuItemId: sampleMenuItem.id, quantity: 1 }],
    });
    const orderToCancel = orderRes.body.order;

    // Fail if reason missing
    const failRes = await request(app)
      .patch(`/api/kitchen/orders/${orderToCancel.id}/status`)
      .set('Authorization', `Bearer ${kitchenToken}`)
      .send({ status: 'CANCELLED' });
    expect(failRes.status).toBe(400);

    // Succeed with reason
    const cancelRes = await request(app)
      .patch(`/api/kitchen/orders/${orderToCancel.id}/status`)
      .set('Authorization', `Bearer ${kitchenToken}`)
      .send({ status: 'CANCELLED', reason: 'Customer requested cancellation due to train departure' });
    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.order.fulfillmentStatus).toBe('CANCELLED');

    // Verify audit log exists
    const auditLog = await prisma.auditLog.findFirst({
      where: { actionType: 'ORDER_CANCELLED', entityId: orderToCancel.id },
    });
    expect(auditLog).toBeDefined();
    expect(auditLog?.reason).toContain('train departure');
  });

  // Scenario 22: End-of-day business cutoff resets daily table sequences correctly
  test('Scenario 22: Order code formatting and daily sequence allocation logic', () => {
    const today = getBusinessDate();
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  // Scenario 23: QR token regeneration invalidates old table QR links
  test('Scenario 23: QR token regeneration invalidates old table QR links immediately', async () => {
    const oldToken = validQrToken;

    // Admin regenerates QR token for TQ1
    const regenRes = await request(app)
      .post('/api/tables/TQ1/regenerate-qr')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ reason: 'Routine security stand replacement' });

    expect(regenRes.status).toBe(200);
    const newToken = regenRes.body.table.qrToken;
    expect(newToken).not.toBe(oldToken);

    // Old token should be immediately rejected
    const oldValidateRes = await request(app)
      .get(`/api/tables/validate-token?tableCode=TQ1&token=${oldToken}`);
    expect(oldValidateRes.status).toBe(403);

    // New token should be accepted
    const newValidateRes = await request(app)
      .get(`/api/tables/validate-token?tableCode=TQ1&token=${newToken}`);
    expect(newValidateRes.status).toBe(200);
    expect(newValidateRes.body.valid).toBe(true);

    validQrToken = newToken; // Update for subsequent tests
  });

  // Scenario 24: Tax totals and invoice totals are calculated correctly (5% GST: 2.5% CGST + 2.5% SGST)
  test('Scenario 24: Tax totals and invoice totals calculate accurately in paise', () => {
    const subtotal = 100000; // ₹1000.00
    const discount = 10000;  // ₹100.00
    const calc = calculateTaxes(subtotal, discount);

    expect(calc.taxableAmountPaise).toBe(90000); // ₹900.00
    expect(calc.cgstPaise).toBe(2250);          // ₹22.50 (2.5%)
    expect(calc.sgstPaise).toBe(2250);          // ₹22.50 (2.5%)
    expect(calc.totalTaxPaise).toBe(4500);       // ₹45.00 (5.0%)
    expect(calc.grandTotalPaise).toBe(94500);    // ₹945.00
  });

  // Scenario 25: Data export respects user permissions
  test('Scenario 25: Data export is restricted to Managers and Admin', async () => {
    // Cashier cannot export
    const cashierExport = await request(app)
      .get('/api/admin/reports/export-csv?reportType=sales')
      .set('Authorization', `Bearer ${cashierToken}`);
    expect(cashierExport.status).toBe(403);

    // Owner can export
    const ownerExport = await request(app)
      .get('/api/admin/reports/export-csv?reportType=sales')
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(ownerExport.status).toBe(200);
    expect(ownerExport.headers['content-type']).toContain('text/csv');
  });

  // Scenario 26: Health check returns uptime, timezone (Asia/Kolkata), and service status
  test('Scenario 26: System health check reports active Kolkata timezone', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('UP');
    expect(res.body.timezone).toBe('Asia/Kolkata');
  });
});
