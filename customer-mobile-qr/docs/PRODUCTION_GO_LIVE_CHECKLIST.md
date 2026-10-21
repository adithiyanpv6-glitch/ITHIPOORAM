# Ithipooram Restaurant Ecosystem - Production Go-Live Checklist

Location: Near Court Road, Vanchiyoor, Thiruvananthapuram, Kerala 695035  
Before deploying live to customers and lunch dining patrons, complete every verification step below:

---

## 1. Environment & Infrastructure Setup
- [ ] **Separate Environments**: Development, Preview/Staging, and Production databases configured separately.
- [ ] **Shared PostgreSQL Database**: Applied migrations:
  - `database/migrations/001_initial_schema.sql` (Tables, constraints, indexes)
  - `database/migrations/002_rls_policies.sql` (Row Level Security policies)
  - `database/migrations/003_triggers_and_functions.sql` (Atomic sequence generators & immutable audit triggers)
- [ ] **Production Seeds**: Loaded confirmed Vanchiyoor restaurant data via `database/seeds/001_seed_production.sql`.
- [ ] **Vercel Deployments**: All three frontend applications deployed on production domains:
  - `https://order.example.com` (Customer QR ordering)
  - `https://kitchen.example.com` (Kitchen display system)
  - `https://pos.example.com` (Admin POS & billing)
  - `https://api.example.com` (Shared backend API)
- [ ] **Environment Variables on Vercel**:
  - `NEXT_PUBLIC_APP_ENV=production`
  - `NEXT_PUBLIC_API_URL=https://api.example.com`
  - `NEXT_PUBLIC_SUPABASE_URL=https://[YOUR_REF].supabase.co`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY=...`
  - *Confirmed*: No server secrets (`SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`, `QR_SIGNING_SECRET`, `PRINTER_BRIDGE_SECRET`, `DATABASE_URL`) are exposed to client bundles.
- [ ] **Redeploy After Variable Updates**: Triggered a fresh redeploy on Vercel after variable configuration.

---

## 2. Table QR Codes & Verification
- [ ] **Table-to-QR Mapping**: Verified tables `TQ1` through `TQ8`.
- [ ] **Permanent QR URL Format**: `https://order.example.com/t/TQ1?token=...`
- [ ] **Server Validation**: Tested that scanning `TQ1` locks to Table 1 and cannot be switched to `TQ2`.
- [ ] **Old Demo QRs Disabled**: Disabled all previous temporary/demo links.
- [ ] **Physical Stands**: Only after backend validation passes, print permanent acrylic stands with visible table codes printed below the QR code.

---

## 3. Staff Accounts & Security
- [ ] **Individual Credentials**: Every cashier and cook has their own username and password.
- [ ] **Cashier PINs**: Configured individual 4-digit PINs (`cashier1`: `1234`, `cashier2`: `5678`).
- [ ] **Account Lockout**: Tested that 5 failed logins triggers a 15-minute lock.
- [ ] **Disabled Staff Rejection**: Tested that disabling an employee immediately revokes access.
- [ ] **Role Access**:
  - Cashier cannot view admin routes or edit prices.
  - Kitchen staff cannot view payment or sales figures.

---

## 4. Menu, Tax & Pricing
- [ ] **Kerala Lunch Menu**: Verified items and prices in paise:
  - Special Kerala Lunch Meals: ₹120.00 (`12000` paise)
  - Karimeen Pollichathu: ₹320.00 (`32000` paise)
  - Neymeen Fry: ₹240.00 (`24000` paise)
  - Ayala Fry: ₹110.00 (`11000` paise)
  - Chemmeen Roast: ₹280.00 (`28000` paise)
  - Beef Ularthiyathu: ₹190.00 (`19000` paise)
  - Nadan Kozhi Curry: ₹180.00 (`18000` paise)
  - Malabar Porotta: ₹20.00 (`2000` paise)
  - Appam: ₹15.00 (`1500` paise)
  - Sambharam: ₹30.00 (`3000` paise)
  - Kulukki Sarbath: ₹40.00 (`4000` paise)
- [ ] **GST Configuration**: 5% GST verified (2.5% CGST + 2.5% SGST calculated correctly in paise).
- [ ] **Out-of-Stock Handling**: Tested marking item sold out disables ordering immediately.

---

## 5. Hardware & Thermal Printing
- [ ] **Thermal Printer Bridge**: Running locally on `127.0.0.1:9100`.
- [ ] **Secret Authentication**: Bridge requires `PRINTER_BRIDGE_SECRET`.
- [ ] **80mm Receipt Content**: Verified restaurant name, address, GSTIN (`32AAAAI0000A1Z5`), FSSAI (`11322001000456`), invoice number, order code, table number, item lines, CGST/SGST tax, payment method, cashier name, and thank-you message.
- [ ] **Printer Failure Test**: Verified that if printer runs out of paper, invoice and payment are safely stored and "Retry Print" works without duplicating payments.
- [ ] **Reprint Audit**: Verified reprint requires reason and logs to `audit_logs`.

---

## 6. Real-Time & Network Resilience
- [ ] **Audio Chime**: Kitchen tablet chime sounds when customer places order.
- [ ] **Status Workflow**: `NEW` → `ACCEPTED` → `PREPARING` → `READY` → `SERVED` transitions smoothly.
- [ ] **Network Loss**: Tested disconnecting Wi-Fi and reconnecting; verified that active orders reconcile without duplicate cards.
- [ ] **Concurrency Test**: Verified that two cashiers clicking "Finalize" on the same order results in exactly one success and one clear error.
- [ ] **Staff Training Complete**: Cashiers and kitchen staff trained on workflows.
