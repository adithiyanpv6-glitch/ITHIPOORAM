# Complete REST API Documentation
## Ithi Pooram (ഇത്തിപ്പൂരം) Core Backend API

Base URL: `http://localhost:5000/api` (Dev) / `https://api.ithipooram.in/api` (Production)

---

### 1. Authentication (`/api/auth`)

#### `POST /api/auth/login`
Authenticates an employee. Locks out after 5 consecutive failures for 15 minutes.
- **Request Body**:
```json
{
  "username": "cashier1",
  "password": "Cashier@1234",
  "deviceType": "COUNTER_POS_TABLET_1"
}
```
- **Response `200 OK`**:
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-here",
    "username": "cashier1",
    "fullName": "Gokul Krishnan",
    "role": "CASHIER",
    "hasPin": true
  }
}
```

#### `POST /api/auth/verify-pin`
Re-authenticates employee PIN before high-security operations (e.g. payment settlement, reprints).
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**: `{ "pin": "5566" }`
- **Response `200 OK`**: `{ "valid": true, "message": "PIN verified successfully." }`

---

### 2. Table QR & Routing (`/api/tables`)

#### `GET /api/tables/validate-token`
Validates the cryptographic QR token for customer mobile landing.
- **Query Params**: `?tableCode=TQ1&token=<cryptographic-token>`
- **Response `200 OK`**:
```json
{
  "valid": true,
  "table": {
    "id": "table-uuid",
    "tableCode": "TQ1",
    "displayName": "Table 1 (Verandah)",
    "capacity": 4,
    "status": "AVAILABLE"
  }
}
```

#### `POST /api/tables/:tableCode/regenerate-qr`
*Restricted to MAIN_ADMIN / MANAGER*.
Immediately revokes current QR token and creates a new cryptographic token.
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**: `{ "reason": "Physical table stand replaced" }`

---

### 3. Customer Orders (`/api/orders`)

#### `POST /api/orders`
Customer creates a new order ticket from their table.
- **Request Body**:
```json
{
  "tableCode": "TQ1",
  "qrToken": "qr_tq1_abcdef...",
  "items": [
    {
      "menuItemId": "menu-item-uuid",
      "quantity": 2,
      "itemNotes": "Less spicy, extra onion rings"
    }
  ],
  "customerNotes": "Please serve with hot water",
  "idempotencyKey": "idem_tq1_1728912345_abc12"
}
```
- **Response `201 Created`**:
```json
{
  "message": "Order placed successfully and sent to kitchen display.",
  "order": {
    "id": "order-uuid",
    "internalId": "LS-20261014-TQ1-001",
    "customerCode": "TQ1-01",
    "fulfillmentStatus": "NEW",
    "billingStatus": "UNPAID",
    "subtotalPaise": 32000,
    "taxPaise": 1600,
    "grandTotalPaise": 33600
  }
}
```

---

### 4. Kitchen Display System (`/api/kitchen`)

#### `GET /api/kitchen/active`
*Restricted to KITCHEN_STAFF, MANAGER, MAIN_ADMIN*.
Returns all tickets in `NEW`, `ACCEPTED`, `PREPARING`, `READY` status sorted by age.
- **Query Params**: `?stationCode=SEAFOOD_FRY` (Optional)

#### `PATCH /api/kitchen/orders/:orderId/status`
Updates order lifecycle status.
- **Request Body**:
```json
{
  "status": "READY",
  "reason": "Cooked and ready on hot pass"
}
```

---

### 5. Billing Counter & Payments (`/api/billing`)

#### `GET /api/billing/tables/:tableCode/unpaid`
*Restricted to CASHIER, MANAGER, MAIN_ADMIN*.
Returns latest 3 to 5 UNPAID orders for table lookup.

#### `POST /api/billing/orders/:orderId/confirm-payment`
Settles the bill with concurrency protection and generates an 80mm ESC/POS receipt.
- **Request Body**:
```json
{
  "paymentMode": "UPI",
  "referenceNumber": "UPI/2026/987654321",
  "cashierPin": "5566"
}
```
- **Response `200 OK`**:
```json
{
  "message": "Payment confirmed and invoice created.",
  "invoice": {
    "invoiceNumber": "INV-20261014-0001",
    "grandTotalPaise": 33600,
    "printStatus": "PRINTED"
  },
  "printerStatus": "SUCCESS",
  "thermalReceipt": "=== ITHI POORAM ===\n..."
}
```

#### `POST /api/billing/invoices/:invoiceId/reprint`
Prints duplicate invoice copy with mandatory audit reason.
- **Request Body**:
```json
{
  "reason": "Customer requested copy for company meal reimbursement",
  "cashierPin": "5566"
}
```
