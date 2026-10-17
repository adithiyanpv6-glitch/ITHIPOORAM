# Staff Operational User Manual
## Daily Standard Operating Procedures (SOP) for Ithi Pooram

### 1. Cashier Counter SOP (Billing Terminal)
1. **Morning Shift Login**:
   - Access `/billing` on the counter tablet or POS PC.
   - Sign in with assigned credentials (`cashier1` / `Cashier@1234`).
2. **Customer Settlement Flow**:
   - Customer approaches counter and states their table number (e.g., &ldquo;Table 1&rdquo; / `TQ1`).
   - Cashier taps tile `TQ1` on the left table grid.
   - The middle column displays the latest 3 to 5 UNPAID orders for `TQ1`.
   - Cashier selects the order ticket to see the itemized bill preview.
   - Confirm payment mode with customer: **CASH**, **UPI** (enter ref number if needed), or **CARD**.
   - Tap **Authorize & Settle Bill**.
   - Enter your personal 4-digit Cashier PIN (`5566`).
   - The system locks the record, prints the 80mm tax invoice, and updates table balance in real-time.
3. **Receipt Reprinting**:
   - If a customer requests a duplicate invoice, tap **Reprint Bill**, select the reason from the prompt, and enter your PIN. The receipt will print with a `DUPLICATE REPRINT` stamp.

---

### 2. Kitchen Display System (KDS) SOP (Android Tablet)
1. Mount the Android tablet securely at the chef expeditor station or tawa fry counter.
2. Sign in as `kitchen1` / `Kitchen@1234` and open `/kitchen`.
3. Tap **Chime ON** so an audio ding-dong sounds every time a customer submits a new order.
4. **Card Progression Workflow**:
   - **NEW (Flashing Brand Border)**: Tap **Accept Ticket** to signal you have received the order.
   - **ACCEPTED (Blue)**: Tap **Start Cooking** when items are placed on the tawa or flame.
   - **PREPARING (Amber)**: Tap **Mark Ready** when the hot dish is plated at the counter pass.
   - **READY (Emerald)**: Runner carries food to table and marks **Mark Served**.
5. **Cancellations**:
   - If an order must be cancelled (e.g. fish batch exhausted), tap the Cancel icon, type the reason, and confirm. Stock will automatically be restored.

---

### 3. Manager & Owner SOP (Admin Console)
1. **Daily Morning Review**:
   - Sign in as `owner` or `manager` and visit `/admin`.
   - Check real-time gross revenue, top-selling dishes, and table revenue.
2. **Live Menu & Stock Management**:
   - Go to `/admin/menu-manager`.
   - If daily fresh fish stock runs out (e.g. Neymeen Tawa Fry), tap **In Stock** to switch it to **Sold Out**. Customer mobile ordering menus update instantly.
   - To update daily prices, click the edit icon, input the new rate, and provide an audit reason.
3. **Table QR Regeneration**:
   - If a table acrylic stand is lost, damaged, or suspected of misuse, navigate to `/admin/qr-manager`.
   - Click **Regenerate**. The old QR link is revoked immediately, and a new QR asset is generated for printing.
4. **Audit Trail Review**:
   - Review `/admin/audit-logs` periodically to track cash drawer settlements, refunds, and price changes.
