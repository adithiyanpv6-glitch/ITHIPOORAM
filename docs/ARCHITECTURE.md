# System Architecture & Technical Specifications
## Ithi Pooram (ഇത്തിപ്പൂരം) - Restaurant Management System

### 1. High-Level Architectural Overview
```mermaid
flowchart TD
    subgraph Clients["Edge Client Devices"]
        CM["Customer Smartphones\n(Mobile Web Browser via QR)"]
        KT["Kitchen Android Tablets\n(KDS Fullscreen PWA)"]
        BP["Billing Counter Tablet / PC\n(POS Cashier Interface)"]
        AD["Admin / Owner Terminal\n(Management Console)"]
    end

    subgraph Gateway["Reverse Proxy / SSL"]
        Nginx["Nginx / Caddy Proxy (HTTPS :443)"]
    end

    subgraph AppLayer["Application Layer"]
        Frontend["Next.js 14 App Router (:3000)\n(Tailwind CSS + Web Audio Engine)"]
        Backend["Node.js Express Core (:5000)\n(TypeScript + Zod Validation)"]
        WS["Socket.IO Engine\n(Kitchen & Billing Real-Time Rooms)"]
    end

    subgraph DataLayer["Storage & Audit Engine"]
        Postgres[("PostgreSQL 16 Engine\n(Paise Integers & SELECT FOR UPDATE Locks)")]
        Audit[("Immutable Audit Trail\n(Append-Only Change Snapshots)")]
    end

    CM -->|Scan TQ1..TQ10 QR| Gateway
    KT -->|KDS Tickets| Gateway
    BP -->|Settle Bills & Print| Gateway
    AD -->|Analytics & Stock| Gateway

    Gateway --> Frontend
    Gateway --> Backend

    Backend <--> WS
    Backend <--> Postgres
    Backend --> Audit
    Frontend <--> WS
```

---

### 2. Database Entity Relationship (ER) Diagram
```mermaid
erDiagram
    User ||--o{ Session : has
    User ||--o{ Payment : authorizes
    User ||--o{ Invoice : settles
    User ||--o{ AuditLog : records
    RestaurantTable ||--o{ Order : seats
    RestaurantTable ||--o{ TableQrToken : rotates
    KitchenStation ||--o{ MenuItem : prepares
    KitchenStation ||--o{ Order : routes
    MenuCategory ||--o{ MenuItem : categorizes
    MenuItem ||--o{ OrderItem : snapshots
    Order ||--|{ OrderItem : contains
    Order ||--o{ OrderStatusHistory : tracks
    Order ||--o| Invoice : finalizes
    Order ||--o{ Payment : receives
    Invoice ||--|{ InvoiceItem : snapshots
    Invoice ||--o{ InvoicePrintLog : logs
```

---

### 3. Core Business & Concurrency Rules
1. **Paise Precision**: All monetary figures (`pricePaise`, `subtotalPaise`, `taxPaise`, `grandTotalPaise`) are stored as 64-bit integer paise (`1 INR = 100 paise`) to prevent floating-point rounding discrepancies.
2. **Indian Tax Calculation (GST 5%)**: Split exactly into 2.5% CGST and 2.5% SGST. Rounded to nearest integer paise.
3. **Business Day Cutoff (03:00 AM IST)**: For night service dining, any order placed before 03:00 AM IST is attributed to the preceding operational business date shift.
4. **Idempotency Protection**: Customer orders carry a client-generated UUID idempotency key preventing duplicate order placement during poor network connectivity or rapid double-taps.
5. **Row-Level Billing Locks**: Final payment confirmation executes inside a PostgreSQL `SELECT FOR UPDATE` transaction. If two cashiers attempt to settle the same table order simultaneously, only the first transaction commits; the second fails gracefully with `ORDER_ALREADY_PAID`.
6. **Immutable Snapshots**: When an order is placed, item names, prices, and notes are frozen into `OrderItem`. Subsequent price updates by management do not alter historic sales or open orders.
