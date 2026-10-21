# Ithipooram Restaurant Ecosystem - Staff Manual

## 1. Cashier Operations Guide

### 1.1 Logging In
1. Open the POS application on the billing tablet or POS terminal at `https://pos.example.com` (or local POS bridge).
2. Enter your personal username (e.g. `cashier1` or `cashier2`) and password.
3. Never use a shared cashier account. All actions are strictly audited under your personal name.
4. If you fail password entry 5 times consecutively, the terminal locks your account for 15 minutes.

### 1.2 Table Lookup & Open Orders
1. In the **Billing** tab, physical tables `TQ1` through `TQ8` appear as cards.
2. When a dining customer approaches the billing counter stating their table (e.g. "Table 1"):
   - Click **TQ1**.
   - The system automatically loads the **latest 3 to 5 open (unpaid) orders** for that table, sorted newest first.
   - Cancelled and already-paid orders are automatically excluded.
3. Click the specific order card matching the customer's order.
4. The system instantly loads an authoritative **Server Bill Preview** displaying:
   - Item names and quantities.
   - Subtotal in INR.
   - 5% Restaurant GST breakdown (2.5% CGST + 2.5% SGST).
   - Grand Total in INR.

### 1.3 Accepting Payment & Confirmation PIN
1. Select the payment method:
   - **Cash**: Collect cash, verify amount.
   - **UPI**: Customer scans the billing UPI QR code. Verify success on UPI soundbox or phone.
   - **Card**: Swipe or tap card on EDC terminal. Enter reference/approval code.
   - **Split Payment**: Enter exact breakdown between Cash, UPI, and Card. The system validates that the sum matches the grand total to the exact paise.
2. Enter your **4 to 6 digit Cashier PIN** (e.g. `1234`).
3. Click **Confirm Payment & Print Thermal Receipt**.
4. The order is locked atomically; the status transitions to `PAID`, and a thermal receipt is cut automatically.

### 1.4 Bill Reprints
1. If a customer requests a duplicate bill, click **Reprint Receipt**.
2. Enter the invoice number and an explicit reason (e.g., "Customer requested expense bill copy").
3. The reprint is logged with your username in the immutable audit log and the receipt prints with a distinct `*** DUPLICATE / REPRINT ***` header.

---

## 2. Kitchen Staff (KDS) Guide

### 2.1 Logging In
1. Open the kitchen tablet at `https://kitchen.example.com` (or `http://localhost:4000/kitchen`).
2. Log in using your chef credentials (`chef1` / `Ithipooram@2026`).
3. Kitchen staff cannot see prices, bills, or payment information.

### 2.2 Order Arrival & Chime Alerts
1. When a customer scans a table QR and places an order, it appears on the screen in real-time accompanied by a dual-tone sound alert and an amber flashing border.
2. The card displays:
   - Order Code (e.g. `TQ1-01`).
   - Table Code & Name (e.g. `TQ1 (Courtyard)`).
   - Time elapsed in minutes. If elapsed time exceeds 20 minutes, the timer turns red with a **LATE ORDER** warning.
   - Dishes, quantities, and customer preparation notes (e.g., "Less spicy, extra moru curry").

### 2.3 Status Transitions
Follow the one-way kitchen workflow using the large touch buttons:
1. **Accept Order**: Moves order to `ACCEPTED`.
2. **Start Cooking**: Moves order to `PREPARING`.
3. **Mark Ready**: Moves order to `READY` (notifies runner to collect).
4. **Mark Served**: Moves order to `SERVED` when food is on the table.

*Note: You cannot reverse an order from PREPARING or SERVED back to NEW. Once marked served, cooking is complete.*

### 2.4 Station Filters
Use the top station tabs to view only the dishes assigned to your prep counter:
- **Meals & Rice Station**: Oonu, rice pots, sambar, aviyal, thoran, payasam.
- **Seafood Tawa & Fry**: Karimeen Pollichathu, Neymeen fry, Ayala fry, Chemmeen roast.
- **Hot Gravy & Porotta**: Nadan Kozhi curry, Beef Ularthiyathu, Porotta, Appam.
- **Beverage Counter**: Sambharam, Kulukki Sarbath, Fresh Lime.
