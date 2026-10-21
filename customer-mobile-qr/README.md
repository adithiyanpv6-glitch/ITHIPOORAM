# ഇത്തിപ്പൂരം (Ithi Pooram) — Customer Mobile QR Ordering Web App

High-performance, mobile-first QR ordering web application for diners at **ഇത്തിപ്പൂരം (Ithi Pooram)**, Statue, Trivandrum.

---

## Live Demo Highlights

- **Table 1 (`TQ1`) Context**: Automatically binds table identifier and validates cryptographically secure table tokens. Customers cannot edit or tamper with table numbers.
- **Authentic Kerala Visual Identity**: Terracotta brand accent (`#9E341D`), slate POS chrome (`#1E242B`), warm parchment tones, bilingual Malayalam typography (ഇത്തിപ്പൂരം).
- **Category Browsing**: *Kerala Meals*, *Tawa Seafood Fry*, *Traditional Curries*, *Biriyani*, *Beverages & Desserts*.
- **Item Customization**: Quantity increments, special dietary instructions (e.g., "Less spicy", "No onion").
- **Live Cart & Price Breakdown**: Integer paise currency representation with 5% GST estimation (2.5% CGST + 2.5% SGST).
- **Zero-Waiter Direct Kitchen Dispatch**: Idempotent order placement prevents double orders if tapped repeatedly.
- **Real-Time Order Tracking**: Live status lifecycle (`SENT` ➔ `PREPARING` ➔ `READY` ➔ `SERVED`) with kitchen prep estimates.

---

## Vercel Deployment Instructions

1. **Import this repository** in [Vercel](https://vercel.com/new).
2. **Root Directory**:
   - You can leave Root Directory as `./` (Default), **OR**
   - You can set Root Directory to `customer-mobile-qr`.
   *(Both configurations build and run seamlessly).*
3. **Framework Preset**: Next.js (automatically detected).
4. **Environment Variables** (Optional):
   - `NEXT_PUBLIC_API_URL`: Your backend API base URL (e.g., `https://api.ithipooram.in`). If omitted, the app runs in interactive standalone demo mode with full live state and sample dishes.
5. Click **Deploy**.
