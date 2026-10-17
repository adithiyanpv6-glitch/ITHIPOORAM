# Hardware, Network & Go-Live Installation Checklist
## Restaurant: Ithi Pooram (ഇത്തിപ്പൂരം), Trivandrum

### 1. Networking & Wi-Fi
- [ ] Dedicated Restaurant POS Wi-Fi SSID configured (e.g. `IthiPooram_Staff_5G`) with WPA3/WPA2-PSK.
- [ ] Wi-Fi signal tested at all 10 dining tables (`TQ1` to `TQ10`), kitchen expeditor counter, and cashier counter (minimum -65 dBm RSSI).
- [ ] Fallback 4G/5G mobile hotspot or SIM-router configured for internet failover during local broadband disruptions.

---

### 2. Kitchen Android Tablets (KDS)
- [ ] 10-inch or 12-inch Android Tablets mounted in splash-proof wall brackets at:
  - Main Meals & Sadhya station.
  - Tawa & Deep Fry seafood station.
- [ ] Android Settings configured:
  - Screen timeout set to &ldquo;Never&rdquo; while connected to AC power.
  - Volume set to 80%+ for clear Web Audio order chime alerts.
  - Chrome / Edge PWA shortcut added to home screen: `https://order.ithipooram.in/kitchen`.
  - Tablet locked to Single App / Kiosk mode if desired.

---

### 3. Billing Counter & Thermal Printers
- [ ] 80mm ESC/POS Thermal Receipt Printer installed at counter:
  - Static IP assigned or connected via high-speed USB.
  - 80mm thermal paper rolls stocked (BPA-free thermal paper).
  - Test print executed: verify Kerala Malayalam logo, GSTIN, FSSAI, item table, and cutter operation.
- [ ] Cashier Tablet / All-In-One Touch POS PC configured at `https://order.ithipooram.in/billing`.
- [ ] Cashier PINs issued to billing staff (`cashier1`: 5566, `cashier2`: 7788).

---

### 4. Table QR Stands (TQ1 through TQ10)
- [ ] Print high-resolution QR stand inserts from `/admin/qr-manager`.
- [ ] Mount inserts into sturdy, clear acrylic double-sided L-stands or T-stands.
- [ ] Fix stands securely on each physical dining table:
  - Table 1 (Verandah) -> `TQ1`
  - Table 2 (Verandah) -> `TQ2`
  - Table 3 (Courtyard AC) -> `TQ3`
  - Table 4 (Courtyard AC) -> `TQ4`
  - Table 5 (Inner Hall) -> `TQ5`
  - Table 6 (Inner Hall) -> `TQ6`
  - Table 7 (Heritage Corner) -> `TQ7`
  - Table 8 (Family Room) -> `TQ8`
  - Table 9 (Balcony View) -> `TQ9`
  - Table 10 (Garden Gazebo) -> `TQ10`
- [ ] Verify test scan on multiple iPhone and Android devices to ensure immediate landing on `/order/table/TQx`.

---

### 5. Management Pre-Flight Verification
- [ ] Admin credentials tested (`owner` / `Owner@1234`, PIN: `1122`).
- [ ] Business details verified: GSTIN `32AAAAI0000A1Z5`, FSSAI `11324007000890`.
- [ ] Shift cutoff set to 03:00 AM IST.
- [ ] Automated backup script `backup.sh` added to system crontab.
