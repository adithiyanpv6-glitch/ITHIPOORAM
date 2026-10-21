# Ithipooram Restaurant Ecosystem - Administrator Manual

## 1. System Overview & Roles
The Ithipooram system enforces strict Role-Based Access Control (RBAC):
- **MAIN_ADMIN**: Full system control (users, passwords, PINs, tables, QR regeneration, prices, tax, printer, business settings, audit logs, database backups).
- **MANAGER**: Live floor monitor, today's menu availability toggle, kitchen monitoring, discounts up to limit, approving refunds and reprints.
- **CASHIER**: Billing, order lookup, payment finalization, receipt printing. Cannot alter historical prices, invoices, or audit records.
- **KITCHEN_STAFF**: Kitchen display only. Zero access to billing, sales, or customer payment details.
- **MENU_EDITOR**: Update daily availability and stock quantities.

---

## 2. Table QR Management
Permanent physical table codes (`TQ1`, `TQ2`, `TQ3`, etc.) are installed on each dining table.
Each table has an internal UUID and a cryptographically signed HMAC token.

### Regenerating a Table QR Code
If a printed QR stand is damaged, lost, or compromised:
1. Log in to the Admin Portal with Manager or Admin credentials.
2. Navigate to **Table Map & QR**.
3. Locate the table (e.g. `Table 7 - AC Hall`) and click **Regenerate QR**.
4. Confirm the warning prompt.
5. The system immediately revokes the old token (`is_active = 0`) and generates a new secure token.
6. **Result**: Anyone attempting to scan the old QR code is immediately blocked with "Invalid or expired QR token". Print the replacement QR stand and place it on the table.

---

## 3. Daily Menu Availability & Live Stock
During lunch rush hours, fresh catch items (such as Karimeen or Ayala) may sell out:
1. Go to **Today's Menu**.
2. Locate the dish (e.g. `Karimeen Pollichathu`).
3. Click **Mark Sold Out**.
4. The system immediately broadcasts a `menu.updated` real-time event.
5. On all customer mobile screens, the dish is immediately greyed out with a **SOLD OUT FOR TODAY** banner and the "ADD" button is disabled.
6. Any in-flight customer attempt to submit an order with a sold-out dish is safely rejected server-side.

---

## 4. Sales Reports & GST Tax Accounting
1. Navigate to **Reports & Exports**.
2. Select your date range (e.g. Today, Yesterday, or Custom dates).
3. The table displays:
   - Invoice numbers (e.g. `INV-20261015-0001`).
   - Business Date.
   - Table Code.
   - Subtotal in INR.
   - CGST (2.5%) and SGST (2.5%) tax breakup in INR.
   - Grand Total in INR.
   - Cashier username snapshot.
4. Click **Export CSV Report** to download the audited spreadsheet for your chartered accountant / GST return filing.

---

## 5. Security & Employee Management
1. To disable an employee who has left the restaurant:
   - Go to **User Management**.
   - Click **Disable Account**.
   - The user's active session is terminated and subsequent login requests are immediately rejected with HTTP 403 Forbidden.
2. Cashier PIN changes:
   - Cashier PINs can be reset only by MAIN_ADMIN.
   - Cashier PINs are hashed using SHA-256 and never stored in plain text.
