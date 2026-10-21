# Ithipooram Restaurant Ecosystem - API Documentation

Location: Near Court Road, Vanchiyoor, Thiruvananthapuram, Kerala 695035  
Timezone: `Asia/Kolkata` (UTC+5:30) | Currency: `INR` | Storage: `integer paise` (₹1.00 = 100 paise)

---

## 1. System Health

### `GET /health`
Returns live status of the backend API, PostgreSQL connection, environment, build version, and server time.
- **Authentication**: None (Public)
- **Response `200 OK`**:
```json
{
  "apiStatus": "healthy",
  "databaseConnectivity": "connected",
  "appEnvironment": "production",
  "buildVersion": "2.0.0-prod",
  "currentServerTime": "2026-10-15T10:45:00.000+05:30"
}
```

---

## 2. Authentication & Session Management

### `POST /api/auth/login`
Staff login with individual credentials. Automatically locks out after 5 consecutive failed attempts for 15 minutes. Disabled employees are rejected immediately.
- **Authentication**: None (Public)
- **Request Body**:
```json
{
  "username": "cashier1",
  "password": "Ithipooram@2026"
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "token": "eyJhbGciOi...",
  "user": {
    "id": "33333333-3333-3333-3333-333333333333",
    "username": "cashier1",
    "fullName": "Anandhu V (Cashier 1)",
    "role": "CASHIER"
  }
}
```

---

## 3. Public Customer Ordering

### `GET /public/menu`
Retrieves all active categories and non-archived menu items. Out-of-stock items have `isOutOfStock: true`.
- **Authentication**: None (Public)
- **Response `200 OK`**:
```json
{
  "categories": [
    { "id": "MEALS", "name": "Traditional Kerala Meals (ഊണ്)", "display_order": 1 }
  ],
  "items": [
    {
      "id": "c0000001-0000-0000-0000-000000000001",
      "category_id": "MEALS",
      "item_code": "OONU-SPL",
      "name": "Ithipooram Special Lunch Meals",
      "malayalam_name": "ഇത്തിപ്പൂരം സ്പെഷ്യൽ ഊണ്",
      "base_price_paise": 12000,
      "priceRupees": "120.00",
      "is_vegetarian": 1,
      "is_available": 1,
      "isOutOfStock": false
    }
  ]
}
```

### `POST /public/qr/validate`
Validates permanent table QR token before customer can browse table-locked ordering.
- **Request Body**:
```json
{
  "tableCode": "TQ1",
  "token": "6640a2d99984771e3a376c1330362bce"
}
```
- **Response `200 OK`**:
```json
{
  "valid": true,
  "table": {
    "id": "a0000000-0000-0000-0000-000000000001",
    "code": "TQ1",
    "name": "Table 1 (Courtyard)",
    "status": "AVAILABLE"
  }
}
```

### `POST /orders`
Creates a customer order for the fixed table. Prices and tax are calculated on the server. Out-of-stock items are strictly blocked.
- **Headers**: `X-Idempotency-Key: <unique-key>`
- **Request Body**:
```json
{
  "tableCode": "TQ1",
  "qrToken": "6640a2d99984771e3a376c1330362bce",
  "items": [
    { "itemCode": "OONU-SPL", "quantity": 2 },
    { "itemCode": "KARIMEEN-POL", "quantity": 1 }
  ],
  "notes": "Extra moru curry and pickle",
  "idempotencyKey": "IDEM-ORDER-991823"
}
```
- **Response `201 Created`**:
```json
{
  "success": true,
  "orderId": "d0000001-...",
  "customerOrderCode": "TQ1-01",
  "internalOrderId": "LS-20261015-TQ1-001",
  "tableCode": "TQ1",
  "tableName": "Table 1 (Courtyard)",
  "subtotalPaise": 56000,
  "taxPaise": 2800,
  "grandTotalPaise": 58800,
  "grandTotalRupees": "588.00",
  "fulfillmentStatus": "NEW",
  "billingStatus": "UNPAID",
  "createdAt": "2026-10-15T10:30:00.000+05:30"
}
```

### `GET /orders/:orderId/status`
Returns live tracking status for customer order code.

---

## 4. Kitchen Display System (KDS)

### `GET /kitchen/orders?stationId=MEALS_STATION`
Returns active kitchen orders. Strip all financial, price, and payment figures.
- **Authentication**: `Bearer <JWT>` (Roles: `KITCHEN_STAFF`, `MANAGER`, `MAIN_ADMIN`)
- **Response `200 OK`**:
```json
{
  "orders": [
    {
      "id": "d0000001-...",
      "customerOrderCode": "TQ1-01",
      "tableCode": "TQ1",
      "tableName": "Table 1 (Courtyard)",
      "fulfillmentStatus": "NEW",
      "elapsedMinutes": 4,
      "isLateWarning": false,
      "items": [
        { "name": "Ithipooram Special Lunch Meals", "quantity": 2, "station_name": "Meals & Rice Station" }
      ]
    }
  ]
}
```

### `PATCH /kitchen/orders/:orderId/status`
Enforces fulfillment state transitions: `NEW` → `ACCEPTED` → `PREPARING` → `READY` → `SERVED`.
- **Request Body**: `{ "status": "ACCEPTED" }`

---

## 5. Billing & Payment Finalization

### `GET /billing/tables/:tableCode/open-orders?limit=5`
Returns latest 3–5 unpaid or partially paid orders for the table, sorted newest first. Excludes cancelled or paid orders.
- **Authentication**: `Bearer <JWT>` (Roles: `CASHIER`, `MANAGER`, `MAIN_ADMIN`)

### `GET /billing/orders/:orderId/bill-preview`
Fetches server-authoritative bill preview with item snapshots and 5% GST breakdown (2.5% CGST + 2.5% SGST).

### `POST /billing/orders/:orderId/finalize`
Performs atomic payment finalization with PostgreSQL row-level locking. Generates unique invoice number, creates invoice snapshots, marks order PAID, and triggers the 80mm thermal receipt print.
- **Headers**: `X-Idempotency-Key: <unique-key>`
- **Request Body**:
```json
{
  "paymentMethod": "SPLIT",
  "allocations": [
    { "method": "CASH", "amountPaise": 30000 },
    { "method": "UPI", "amountPaise": 28800, "referenceNumber": "UPI99228811" }
  ],
  "pin": "1234"
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "orderId": "d0000001-...",
  "customerOrderCode": "TQ1-01",
  "invoiceNumber": "INV-20261015-0001",
  "tableCode": "TQ1",
  "billingStatus": "PAID",
  "grandTotalPaise": 58800,
  "grandTotalRupees": "588.00",
  "printStatus": "SUCCESS"
}
```

### `POST /billing/invoices/:invoiceId/reprint`
Authorizes thermal receipt reprint. Requires audit reason.
- **Request Body**: `{ "reason": "Customer misplaced original receipt" }`

---

## 6. Admin Analytics & Management

- `GET /admin/dashboard`: Metrics cards (Gross/Net sales, orders, AOV, top items).
- `GET /admin/reports/sales?format=csv`: CSV export with report title, date range, generated by, and Asia/Kolkata timezone metadata.
- `GET /admin/audit-logs`: Append-only audit trail.
- `POST /admin/tables/:tableId/regenerate-qr`: Regenerates QR token, instantly revokes old QR.
- `PATCH /admin/menu/:itemId/availability`: Toggles item availability and updates daily stock.
