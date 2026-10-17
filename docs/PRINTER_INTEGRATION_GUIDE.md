# 80mm Thermal Receipt Printer Integration Guide
## Hardware Specifications & Operational Setup

### 1. Supported Thermal Printer Hardware
- **Standard Width**: 80 mm (3.15 inches).
- **Print Density**: 203 DPI (8 dots/mm).
- **Character Width**: 48 characters per line (`Font A: 12x24 dots`) or 64 characters (`Font B: 9x17 dots`).
- **Standard Protocols**: ESC/POS, Network TCP/IP Socket (`Port 9100`), USB Virtual COM / Direct Spool.
- **Recommended Brands Tested**: Epson TM-T82 / TM-T88, TVS RP-3200 Plus, Citizen CT-S310II, Posiflex Aura.

---

### 2. Network TCP/IP Setup (Ethernet / Wi-Fi)
1. Assign a fixed static IP address to the billing counter printer on the local subnet (e.g. `192.168.1.200`).
2. Verify port `9100` raw printing is open via network ping.
3. Configure the printer IP in backend settings or route print jobs directly from the browser cashier terminal via `window.print()` using CSS `@media print` layout provided in `frontend/src/app/globals.css`.

---

### 3. Thermal Receipt Layout Structure
Every printed bill follows the statutory Indian dining layout:
```text
================================================
                    ഇത്തിപ്പൂരം
                    ITHI POORAM
       Authentic Kerala Lunch & Seafood Spot
   Opp. Old Secretariat Gate, MG Road, Trivandrum
                  Ph: +91 471 233 4567
     GSTIN: 32AAAAI0000A1Z5 | FSSAI: 11324007000890
================================================
                  TAX INVOICE
------------------------------------------------
Invoice: INV-20261014-0001           Table: TQ1
Order Ref: TQ1-01              Date: 14/10/2026
Cashier: Gokul Krishnan         Time: 01:45 PM
------------------------------------------------
ITEM [QTY x RATE]                    TOTAL (INR)
------------------------------------------------
Special Kerala Seafood Oonu
  2 x ₹160.00                            ₹320.00
Karimeen Pollichathu
  1 x ₹380.00                            ₹380.00
------------------------------------------------
Subtotal:                                ₹700.00
CGST (2.5%):                              ₹17.50
SGST (2.5%):                              ₹17.50
================================================
NET PAYABLE:                             ₹735.00
================================================
Payment Mode: UPI
Txn Ref No: UPI/2026/987654321
------------------------------------------------
         Thank you for dining with us!
        ഇത്തിപ്പൂരം വീണ്ടും സന്ദർശിക്കുക
   Fresh Seafood & Kerala Lunches Every Day
```

---

### 4. Handling Printer Failures & Paper Jams
- If the thermal printer experiences a paper jam, runs out of roll paper, or disconnects, the billing transaction **remains committed** in PostgreSQL.
- The cashier terminal surfaces a visible alert: `Printer offline or paper jam detected. Invoice remains safely saved.` with a **Retry Print** button.
- Retrying prints or reprinting duplicate copies prompts for the cashier PIN and a mandatory reason (e.g., `Paper jam replacement`, `Customer requested tax receipt`).
- Duplicate copies are watermarked `*** DUPLICATE REPRINT #N ***` on the thermal header and recorded in `invoice_print_logs` and `audit_logs`.
