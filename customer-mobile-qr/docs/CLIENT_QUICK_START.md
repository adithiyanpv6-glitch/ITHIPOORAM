# ITHI POORAM (ഇത്തിപ്പൂരം) — Restaurant Ecosystem Quick Start Guide
**Location**: Near Court Road, Vanchiyoor, Thiruvananthapuram, Kerala 695035  
**Cuisine**: Authentic Kerala Lunch Sadhya, Fresh Coastal Seafood & Thattukada Delicacies

Welcome to your production restaurant management system! This system runs automatically in the cloud. You and your restaurant staff **do not need to install software, touch servers, or configure databases**.

---

## 1. The Three URLs for Your Restaurant

Bookmark these three web addresses on your respective restaurant devices:

| Device / User | Web Address (URL) | Purpose |
| :--- | :--- | :--- |
| **📱 Customers (Dining Tables)** | `https://order.CLIENTDOMAIN.in` *(or your Vercel customer URL)* | Customers scan table QR stands (TQ1–TQ10) to view today's Kerala lunch menu and submit orders. No login required. |
| **🍳 Kitchen Display (Kitchen Tablet)** | `https://kitchen.CLIENTDOMAIN.in` *(or your Vercel kitchen URL)* | Wall-mounted or counter tablet in the kitchen. Chimes when new orders arrive, organizes tickets by station (Meals, Seafood Fry, Beverages), and updates prep status. |
| **💻 Billing POS & Admin (Cashier Tablet/PC)** | `https://pos.CLIENTDOMAIN.in` *(or your Vercel POS URL)* | Billing counter tablet. Used by cashiers to view table orders, apply discounts, verify payments (Cash / UPI / Card / Split), and issue digital receipts. |

---

## 2. Default Staff Login Accounts

Every employee logs in with their individual account:

| Role | Username | Password | Cashier PIN | Access Level |
| :--- | :--- | :--- | :--- | :--- |
| **MAIN ADMIN (Owner/GM)** | `admin` | `Ithipooram@2026` | `9999` | Full access: Billing, Live Menu 86ing, Prices, Sales Reports, Staff Accounts, Audit Trail |
| **MANAGER (Shift Supervisor)** | `manager` | `Manager@2026` | `1122` | Overview dashboard, menu availability toggling, discounts, cancellations |
| **CASHIER 1 (Counter POS)** | `cashier1` | `Cashier@2026` | `5566` | Billing terminal, table lookup, UPI/Cash settlement, digital receipt generation |
| **CASHIER 2 (Counter POS)** | `cashier2` | `Cashier2@2026` | `7788` | Billing terminal, table lookup, UPI/Cash settlement, digital receipt generation |
| **CHEF (Kitchen Display)** | `chef1` | `Kitchen@2026` | *None* | Kitchen Display System only. No financial or sales data visible. |

---

## 3. Daily Step-by-Step Workflow

### Device 1: Kitchen Display Tablet
1. Turn on the kitchen tablet and open `https://kitchen.CLIENTDOMAIN.in`.
2. Log in using `chef1` / `Kitchen@2026`.
3. Select your station tab (e.g., **All Stations**, **Main Meals**, or **Tawa & Fry**).
4. Leave this screen open throughout the lunch rush.
5. When a customer orders, an acoustic chime sounds and the order ticket appears with item names, quantities, and table number (e.g. `Table 1 (TQ1)`).
6. Tap **Accept** ➔ **Preparing** ➔ **Ready** as the food is cooked and plated!

---

### Device 2: Billing & Counter POS
1. Open `https://pos.CLIENTDOMAIN.in` on your billing tablet or PC.
2. Log in using your cashier credentials (e.g., `cashier1`).
3. Tap **Billing & Counter POS**:
   - The screen shows all dining tables (`TQ1` to `TQ10`) with live badges (Green = Available, Red = Active Orders).
4. When a customer is ready to pay:
   - Tap their table (e.g. `TQ1`).
   - The latest unpaid orders for that table will appear.
   - Tap the order to review the itemized bill and 5% GST calculation.
   - Select payment mode: **UPI**, **Cash**, **Card**, or **Split Payment**.
   - Enter your 4-digit Cashier PIN (e.g., `5566`) and tap **Confirm Payment & Generate Bill**.
5. **Instant Digital Bill**:
   - The screen shows the verified digital invoice stamped **PAID**.
   - Tap **Share WhatsApp** to instantly send the receipt to the customer's mobile number!
   - Tap **Download / PDF** to save or print if needed.
   - Tap **Back to Billing** to serve the next customer.

---

### Device 3: Customer QR Table Ordering
1. Acrylic QR stands are placed on tables `TQ1` through `TQ10`.
2. When seated, the customer scans the table's QR code using any smartphone camera.
3. The customer's mobile browser opens directly:
   - Displays a banner: *"You are ordering for Table 1 (TQ1)"*.
   - Shows today's authentic Kerala lunch menu (Special Seafood Oonu, Karimeen Pollichathu, Neymeen Fry, Ayala Fry, etc.) in English and Malayalam.
   - Prices and 5% GST are calculated by the central server.
4. The customer taps **Add to Cart** and **Confirm & Send to Kitchen**.
5. The order instantly chimes on the kitchen tablet and registers at the billing counter!

---

## 4. Digital Bill & Thermal Printer Support

- **No Printer Required Today**: The system works 100% digitally out-of-the-box. After settlement, bills can be shared directly via WhatsApp or viewed on customer smartphones.
- **Future Thermal Printer**: When you connect an 80mm ESC/POS USB or LAN thermal printer to your billing PC, simply set `PRINTER_ENABLED=true` in your admin dashboard or settings. The system will automatically route physical receipts to the printer while preserving the digital copy!

---

## 5. Sales Reports & Analytics
- Log into `https://pos.CLIENTDOMAIN.in` with your `admin` account.
- Tap **Admin Reports**:
  - View real-time gross revenue, order volume, average bill size, and payment mode breakdowns (UPI vs. Cash).
  - Tap **Download Sales CSV** to export complete daily sales ledgers for your accountant.

*Enjoy smooth, fast, and reliable dining operations during every lunch rush at Ithipooram!*
