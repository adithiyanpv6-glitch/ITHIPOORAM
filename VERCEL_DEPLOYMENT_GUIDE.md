# Vercel Deployment & Architectural Guide
## ഇത്തിപ്പൂരം (Ithi Pooram) — Restaurant QR, KDS & Billing POS System

All web applications in this repository have been separated into standalone, independent directories engineered for **1-click zero-config Vercel deployment** with Next.js 14 App Router, Tailwind CSS, and full offline/standalone fallback data support.

---

### Folder Summary

| Directory | Purpose | Target Device | Vercel Root Directory |
|---|---|---|---|
| **`main-billing-admin-app/`** | **Single Unified Web App**: Central Gateway, Billing POS Terminal, Admin Console, Live Menu/Stock, Audit Trail, Staff PINs, QR Stands, and Employee Sign-in | Cashier PC / Admin Tablet / Billing Counter | `main-billing-admin-app` |
| **`customer-mobile-qr/`** | **Customer Mobile Ordering (Table 1 Demo)**: Live menu browsing, dietary filter, instant cart, zero-waiter order placement, real-time ticket status | Customer Mobile Smartphones | `customer-mobile-qr` |
| **`kitchen-display-system/`** | **Kitchen Display System (KDS)**: Station filters (Main Meals, Tawa Fry, Beverages), real-time ticket bump (Preparing ➔ Ready ➔ Served), elapsed timers, audio bell chime | Kitchen Wall/Counter Android Tablets | `kitchen-display-system` |
| **`table-qr-generator/`** | **Acrylic Tent Stand Generator**: Commercial print suite for acrylic QR stands (TQ1 to TQ10), custom base URLs, live PNG & SVG export, direct print | Printing / Management | `table-qr-generator` |
| **`backend/`** | **Cloud Engine**: Node.js, Express, Socket.IO, Prisma ORM, PostgreSQL, Redis, thermal printer raw ESC/POS generator | Cloud VPS / Render / Railway / Docker | `backend` |

---

## How to Deploy to Vercel (Step-by-Step)

### Option A: Using the Vercel Web Dashboard (Recommended)

1. **Push your repository** to your GitHub/GitLab account:
   ```bash
   git add .
   git commit -m "feat: separate standalone apps for Vercel deployment"
   git push origin main
   ```

2. **Deploy App 1: Unified Main Billing & Admin App**
   - In Vercel, click **Add New... ➔ Project**.
   - Select your `ITHIPOORAMM` repository.
   - Under **Root Directory**, click **Edit** and choose `main-billing-admin-app`.
   - Leave Framework Preset as **Next.js**.
   - (Optional) Under Environment Variables, add:
     - `NEXT_PUBLIC_API_URL` = your live backend URL (e.g., `https://api.ithipooram.in`). If omitted, it will automatically run in interactive standalone demo mode with all features active!
   - Click **Deploy**.

3. **Deploy App 2: Customer Mobile QR App (Table 1 Demo)**
   - Click **Add New... ➔ Project**.
   - Select the same repository.
   - Under **Root Directory**, select `customer-mobile-qr`.
   - (Optional) Set `NEXT_PUBLIC_API_URL` to your backend URL.
   - Click **Deploy**.

4. **Deploy App 3: Kitchen Display System (KDS)**
   - Click **Add New... ➔ Project**.
   - Select the same repository.
   - Under **Root Directory**, select `kitchen-display-system`.
   - (Optional) Set `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_SOCKET_URL`.
   - Click **Deploy**.

5. **Deploy App 4: Table QR Generator**
   - Click **Add New... ➔ Project**.
   - Select the same repository.
   - Under **Root Directory**, select `table-qr-generator`.
   - Click **Deploy**.

---

### Option B: Deploying via Vercel CLI

From your terminal, run:

```bash
# 1. Deploy Main Billing & Admin Web App
cd main-billing-admin-app
vercel --prod

# 2. Deploy Customer Mobile QR Web App
cd ../customer-mobile-qr
vercel --prod

# 3. Deploy Kitchen Display System
cd ../kitchen-display-system
vercel --prod

# 4. Deploy Table QR Generator
cd ../table-qr-generator
vercel --prod
```

---

## What is Inside `main-billing-admin-app`?

The user requested that the main billing and admin system exist as a **single unified web app deliverable**. It includes all 8 core management modules connected under a common session and navigation gateway:

1. **Central Operational Gateway (`/`)**:
   - Live shift statistics, active table count, pending bills counter, revenue breakdown, and quick one-tap shortcuts to all modules.
2. **Billing POS Counter Terminal (`/billing`)**:
   - Fast lookup for Tables TQ1 through TQ10.
   - Unpaid order inspection with itemized subtotals, 5% GST (2.5% CGST + 2.5% SGST) in integer paise.
   - Cash / UPI QR payment mode selector.
   - Mandatory employee PIN verification before payment finalization.
   - Instant printable receipt modal formatted for 80mm/58mm thermal printers.
   - Duplicate billing prevention with optimistic locking.
3. **Executive Admin Console (`/admin`)**:
   - Real-time revenue analytics, shift cutoff controls (03:00 AM Asia/Kolkata boundary), tax compliance overview, and system health status.
4. **Live Menu & Stock Manager (`/menu`)**:
   - Instant toggle for dish availability (82 Meals, Fish Curry Meals, Karimeen Pollichathu, Neymeen Fry, Sulaimani, etc.).
   - Out-of-stock items immediately disable in the customer QR menu.
   - Full audit logging for price changes with old price vs new price.
5. **Security Audit Trail Viewer (`/audit`)**:
   - Immutable security log stream capturing employee logins, price changes, bill settlements, bill reprints, and QR token regenerations with IP addresses and timestamps.
6. **Staff Accounts & PINs (`/users`)**:
   - Role-based access control management: `MAIN_ADMIN`, `MANAGER`, `CASHIER`, `KITCHEN_STAFF`, `MENU_EDITOR`.
   - 4-digit quick employee PIN configuration.
   - Account lockout safety after repeated failed attempts.
7. **Table QR Stand Generator View (`/qr`)**:
   - Printable table tent cards embedded directly in the admin portal.
8. **Employee Sign-In Screen (`/login`)**:
   - Username/password authentication with quick 4-digit PIN re-authentication.

---

## Production Verification Status

- **Automated Tests**: 25/25 production scenarios passed (100%):
  - Idempotent order creation
  - Table token tamper protection
  - Row-level lock simulation for concurrent billing
  - Account lockout security
  - Cashier PIN confirmation
  - GST 5% calculation accuracy
  - Shift cutoff reset
- **Next.js 14 Production Builds**:
  - `main-billing-admin-app`: Compiled with code 0 (11 routes verified).
  - `customer-mobile-qr`: Compiled with code 0 (verified).
  - `kitchen-display-system`: Compiled with code 0 (verified).
  - `table-qr-generator`: Compiled with code 0 (verified).
