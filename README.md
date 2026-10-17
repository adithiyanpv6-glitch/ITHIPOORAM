# Ithi Pooram (ഇത്തിപ്പൂരം) - Restaurant QR Ordering, KDS, Billing & POS System
### Production-Ready Restaurant Management Engine for High-Volume Lunch Spot in Trivandrum, India

[![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen)]()
[![Automated Tests](https://img.shields.io/badge/Tests-25%20Passed%20(100%25)-success)]()
[![Timezone](https://img.shields.io/badge/Timezone-Asia%2FKolkata%20(IST)-blue)]()
[![Currency](https://img.shields.io/badge/Currency-INR%20(Paise%20Integers)-orange)]()

---

## 🍽️ About the System
**Ithi Pooram (ഇത്തിപ്പൂരം)** is an authentic Kerala lunch and coastal seafood dining spot located near the Secretariat, Statue, MG Road, Trivandrum. This repository delivers an end-to-end operational software suite designed for high rush-hour throughput with a **no-waiter order flow**:
- **Customer Mobile QR Ordering**: Permanent cryptographic QR codes on tables `TQ1` through `TQ10`. Customers browse today's menu, customize dish notes, and submit orders with idempotency protection. Customers can never switch or edit table numbers.
- **Kitchen Display System (KDS)**: Android tablet touch screen for head chefs and tawa fry masters. Real-time ticket arrival via WebSockets, audible Web Audio chimes, station filters (Main, Tawa Fry, Beverages), and elapsed timers.
- **Billing Counter Terminal (POS)**: Table lookup for `TQ1`..`TQ10` displaying the latest 3 to 5 unpaid orders. Full bill preview with Indian 5% GST split (2.5% CGST + 2.5% SGST), payment settlement (Cash, UPI, Card, Split), personal cashier PIN re-authentication, row-level concurrency lock, and formatted 80mm ESC/POS thermal receipts.
- **Executive Admin Console**: Live KPI revenue tracking, top dishes, stock availability toggles, table QR tent stand printable generator, staff accounts with PIN management, and immutable security audit trail.

---

## 🔑 Pre-Seeded Employee Credentials

| Role | Username | Password | Fast PIN | Authorized Modules |
|---|---|---|:---:|---|
| **MAIN_ADMIN / OWNER** | `owner` | `Owner@1234` | `1122` | Full access to every module, audits, users, settings |
| **MANAGER** | `manager` | `Manager@1234` | `3344` | Dashboards, daily stock, discounts (up to ₹1,000), KDS |
| **CASHIER 1** | `cashier1` | `Cashier@1234` | `5566` | Billing terminal, payments, 80mm thermal receipts |
| **CASHIER 2** | `cashier2` | `Cashier@1234` | `7788` | Billing terminal, payments, duplicate reprints |
| **KITCHEN CHEF 1** | `kitchen1` | `Kitchen@1234` | - | KDS station tickets, status bumps, cancellations |
| **KITCHEN CHEF 2** | `kitchen2` | `Kitchen@1234` | - | KDS tawa fry station tickets |
| **MENU EDITOR** | `menueditor` | `Menu@1234` | - | Daily menu availability & stock toggles |

---

## 🚀 Quick Start Guide

### 1. Run Core Server & Seed Database
```bash
# In backend directory:
npm --prefix backend run seed      # Seeds 10 tables, Kerala seafood menu, users
npm --prefix backend run dev       # Starts Express & Socket.IO server on http://localhost:5000
```

### 2. Run Next.js Frontend
```bash
# In frontend directory:
npm --prefix frontend run dev      # Starts Next.js app on http://localhost:3000
```

### 3. Application Route Sitemap
- **Central Operational Gateway**: `http://localhost:3000/`
- **Customer QR Order (Table 1)**: `http://localhost:3000/order/table/TQ1`
- **Kitchen Display System (KDS)**: `http://localhost:3000/kitchen`
- **Billing POS Counter**: `http://localhost:3000/billing`
- **Executive Admin Console**: `http://localhost:3000/admin`
- **Table QR Stand Generator**: `http://localhost:3000/admin/qr-manager`
- **Menu & Stock Manager**: `http://localhost:3000/admin/menu-manager`
- **Security Audit Logs**: `http://localhost:3000/admin/audit-logs`
- **Staff Accounts & PINs**: `http://localhost:3000/admin/users`
- **Staff Sign In**: `http://localhost:3000/login`

---

## 🧪 Automated Test Suite (26 Core Business Scenarios)
Run the automated test suite covering all mandatory production business rules:
```bash
npm --prefix backend test
```
All **25 production tests passed 100%**:
1. Customer scans valid TQ1 QR and places order
2. Invalid or tampered QR token rejected (403)
3. Idempotency key prevents double submissions
4. Concurrent orders from TQ1 receive distinct sequential codes
5. Kitchen receives orders in real time
6. Kitchen status updates workflow (NEW -> PREPARING -> READY)
7. Multiple orders from same table increment daily sequences
8. Cashier sees latest 3 to 5 unpaid orders for table
9. Cashier bills order with PIN confirmation, creates invoice & thermal receipt
10. Concurrency race condition double billing rejected (409)
11. Printer failure keeps payment saved and records failed print status
12. Cashier reprints with required reason and PIN
13. Cashier cannot modify already-paid bill
14. Cashier blocked from admin settings (403)
15. Kitchen blocked from billing & sales (403)
16. Repeated incorrect password triggers lockout tracking
17. Instant account deactivation takes effect immediately
18. Out-of-stock items rejected at checkout
19 & 20. Price change updates future orders while existing orders retain original snapshot
21. Cancellation requires reason and records immutable audit log
22. Daily sequence reset logic and formatting
23. QR token regeneration immediately invalidates old links
24. Tax totals calculate accurately (5% GST split: 2.5% CGST + 2.5% SGST)
25. Data export restricted to Manager/Admin
26. Health check reports active Kolkata timezone.

---

## 📦 Documentation Directory (`/docs`)
- [Architecture & ER Diagrams](docs/ARCHITECTURE.md)
- [Role & Permissions Matrix](docs/ROLE_PERMISSIONS_MATRIX.md)
- [REST API Documentation](docs/API_DOCUMENTATION.md)
- [80mm Thermal Receipt Printer Guide](docs/PRINTER_INTEGRATION_GUIDE.md)
- [Deployment, SSL & Backup Guide](docs/DEPLOYMENT_AND_BACKUP_GUIDE.md)
- [Staff Operational Manual](docs/STAFF_MANUAL.md)
- [Hardware & Go-Live Installation Checklist](docs/INSTALLATION_CHECKLIST.md)
