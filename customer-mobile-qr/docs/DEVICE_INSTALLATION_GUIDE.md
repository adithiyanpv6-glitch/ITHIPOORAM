# Ithipooram Restaurant Ecosystem - Device Installation Guide

## 1. Physical Table QR Stands (TQ1 through TQ8)

### Specifications
- **Format**: High-contrast UV printed acrylic or metal table tent stand.
- **Size**: 100mm × 150mm.
- **Printed Content**:
  - Ithipooram logo & traditional Malayalam script (ഇത്തിപ്പൂരം).
  - Clear high-resolution QR code encoding `https://order.example.com/t/TQ1?token=<SECURE_TOKEN>`.
  - Prominent human-readable table label printed in bold below the QR code:  
    `TABLE 1 (COURTYARD)`
  - Friendly instruction: *"Scan with your camera to view today's Kerala lunch menu & order directly."*

### Table Map Layout (Vanchiyoor Location)
- **TQ1**: Table 1 (Courtyard - Open Air)
- **TQ2**: Table 2 (Courtyard - Open Air)
- **TQ3**: Table 3 (Main Dining Hall)
- **TQ4**: Table 4 (Main Dining Hall)
- **TQ5**: Table 5 (Main Dining Hall)
- **TQ6**: Table 6 (Family Booth)
- **TQ7**: Table 7 (AC Dining Hall)
- **TQ8**: Table 8 (AC Dining Hall)

---

## 2. Kitchen Display Tablet (KDS)

### Hardware Requirements
- 10-inch or 12-inch Android or iPad tablet (minimum 1920×1080 resolution).
- Waterproof / grease-resistant silicone protective case with wall/arm mount.
- Minimum 2A USB power adapter permanently connected.

### Configuration
1. Open Google Chrome or Safari and navigate to:  
   `https://kitchen.example.com`
2. Install as a PWA / Add to Home Screen:
   - In Chrome: Click Menu (⋮) → **Install App** or **Add to Home screen**.
3. Enable Kiosk Mode / Guided Access:
   - Ensure screen sleep / auto-lock is set to **Never**.
   - Ensure tablet volume is set to at least 80% to ensure the order chime is audible above kitchen exhaust fans.
4. Log in as `chef1` with password `Ithipooram@2026`.

---

## 3. Billing POS Terminal & Thermal Printer Bridge

### Architecture
```
Billing POS Vercel App (https://pos.example.com)
       |
       | Authenticated HTTP POST (Bearer PRINTER_BRIDGE_SECRET)
       v
Local Print Bridge Daemon (http://127.0.0.1:9100/print)
       |
       | USB Virtual COM or LAN Port 9100 (ESC/POS)
       v
80mm Thermal Receipt Printer (Epson TM-T82 / TVS RP3200 / NGX)
```

### Thermal Printer Bridge Installation

1. Connect the 80mm thermal receipt printer to the billing computer via USB or Ethernet LAN.
2. Load standard 80mm thermal receipt paper roll.
3. Start the print bridge daemon:
   ```powershell
   node printer-bridge/src/bridgeServer.js
   ```
4. Verify the bridge is responding:
   ```powershell
   curl http://127.0.0.1:9100/health
   ```
   Expected response:
   ```json
   {
     "status": "ONLINE",
     "service": "Ithipooram Thermal Printer Bridge",
     "paperWidth": "80mm"
   }
   ```
5. In the POS billing app, billing requests dispatched by cashiers will automatically trigger 80mm ESC/POS formatted receipts complete with CGST/SGST tax breakdown, cashier name, and restaurant header.
