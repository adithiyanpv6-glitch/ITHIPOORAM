# Ithipooram Restaurant Ecosystem - Backup & Disaster Recovery Guide

## 1. Database Backup Strategy

To ensure zero financial data loss during rush hours or hardware failure, the system uses a two-tier backup strategy:
1. **Continuous WAL Archiving (Point-in-Time Recovery - PITR)**: Managed PostgreSQL provider (e.g. Supabase) records all write-ahead logs continuously with 7 to 30-day retention.
2. **Daily Logical Backups (`pg_dump`)**: Automated daily SQL snapshots taken at 04:30 AM (after the 04:00 AM business day cutoff).

---

## 2. Taking an Automated Daily Backup

### Script: `scripts/backup_db.sh` (or `backup_db.bat`)
```bash
#!/usr/bin/env bash
# Ithipooram Daily Backup Script
set -e

BACKUP_DIR="/var/backups/ithipooram"
DATE=$(date +%Y%m%d_%H%M%S)
FILENAME="${BACKUP_DIR}/ithipooram_backup_${DATE}.sql.gz"

mkdir -p "${BACKUP_DIR}"

echo "[ITHIPOORAM] Starting PostgreSQL logical dump..."
pg_dump "${DATABASE_URL}" --format=custom --no-owner --no-privileges | gzip > "${FILENAME}"

echo "[ITHIPOORAM] Backup created successfully: ${FILENAME}"

# Prune backups older than 30 days
find "${BACKUP_DIR}" -type f -name "ithipooram_backup_*.sql.gz" -mtime +30 -delete
```

---

## 3. Database Restoration Procedure

In the event of database corruption or hardware failure, follow this exact procedure:

### Step 1: Prepare Clean Target Database
```sql
-- Connect to the target PostgreSQL cluster as superuser
DROP DATABASE IF EXISTS ithipooram_recovery;
CREATE DATABASE ithipooram_recovery;
```

### Step 2: Restore Schema & Data from Compressed Dump
```bash
# Decompress and restore custom format dump
gunzip -c /var/backups/ithipooram/ithipooram_backup_YYYYMMDD_HHMMSS.sql.gz | \
pg_restore --dbname="${DATABASE_URL}" --clean --if-exists --exit-on-error
```

### Step 3: Run Integrity & Sequence Reconciliation
Execute the following verification queries to ensure sequence numbers and invoice counters are aligned:
```sql
-- 1. Verify latest business counters
SELECT business_date, table_code, last_sequence 
FROM daily_business_counters 
ORDER BY business_date DESC LIMIT 10;

-- 2. Verify latest invoice counters
SELECT business_date, last_invoice_sequence 
FROM daily_invoice_counters 
ORDER BY business_date DESC LIMIT 5;

-- 3. Verify paid order sums equal invoice grand totals
SELECT o.id, o.grand_total_paise, i.grand_total_paise
FROM orders o
JOIN invoices i ON o.id = i.order_id
WHERE o.grand_total_paise != i.grand_total_paise;
-- (Must return 0 rows)
```

### Step 4: Resume Application Traffic
1. Update `DATABASE_URL` in the production environment.
2. Verify `/health` returns `databaseConnectivity: "connected"`.
3. Check table statuses and resume live ordering.
