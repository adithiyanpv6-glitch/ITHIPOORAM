# Role & Permissions Matrix
## Ithi Pooram (ഇത്തിപ്പൂരം) Operational Security

| Feature / Operation | MAIN_ADMIN / OWNER | MANAGER | CASHIER | KITCHEN_STAFF | MENU_EDITOR |
|---|:---:|:---:|:---:|:---:|:---:|
| **View Table QRs & Status** | ✅ Yes | ✅ Yes | ✅ Yes | ❌ No | ❌ No |
| **Regenerate Table QR Tokens** | ✅ Yes | ✅ Yes | ❌ No | ❌ No | ❌ No |
| **Customer QR Order Placement** | *(Public)* | *(Public)* | *(Public)* | *(Public)* | *(Public)* |
| **Kitchen Active Order View** | ✅ Yes | ✅ Yes | ❌ No | ✅ Yes | ❌ No |
| **Update Order Fulfillment Status** | ✅ Yes | ✅ Yes | ❌ No | ✅ Yes | ❌ No |
| **Order Cancellation with Reason** | ✅ Yes | ✅ Yes | ❌ No | ✅ Yes (Requires Reason) | ❌ No |
| **Counter Table Lookup & Order Cards** | ✅ Yes | ✅ Yes | ✅ Yes | ❌ No | ❌ No |
| **Collect Payments & Finalize Bill** | ✅ Yes (With PIN) | ✅ Yes (With PIN) | ✅ Yes (With PIN) | ❌ No | ❌ No |
| **Print 80mm ESC/POS Thermal Receipt** | ✅ Yes | ✅ Yes | ✅ Yes | ❌ No | ❌ No |
| **Reprint Invoice with Reason** | ✅ Yes (With PIN) | ✅ Yes (With PIN) | ✅ Yes (With PIN) | ❌ No | ❌ No |
| **Apply Bill Discount** | ✅ Full Discretion | ✅ Up to ₹1,000 | ❌ No | ❌ No | ❌ No |
| **Approve Invoice Refunds** | ✅ Yes (Audited) | ✅ Yes (Audited) | ❌ No | ❌ No | ❌ No |
| **Toggle Menu Item Availability** | ✅ Yes | ✅ Yes | ❌ No | ❌ No | ✅ Yes |
| **Update Menu Item Prices** | ✅ Yes (Audited) | ✅ Yes (Audited) | ❌ No | ❌ No | ❌ No |
| **View Executive KPI Dashboard** | ✅ Yes | ✅ Yes | ❌ No | ❌ No | ❌ No |
| **Export Financial CSV Reports** | ✅ Yes | ✅ Yes | ❌ No | ❌ No | ❌ No |
| **Manage Staff Accounts & Reset PINs** | ✅ Yes | ❌ No | ❌ No | ❌ No | ❌ No |
| **Disable / Lockout Employees** | ✅ Yes | ❌ No | ❌ No | ❌ No | ❌ No |
| **Inspect Immutable Audit Logs** | ✅ Yes | ❌ No | ❌ No | ❌ No | ❌ No |
| **Update Restaurant Tax & Cutoff Settings** | ✅ Yes | ❌ No | ❌ No | ❌ No | ❌ No |
