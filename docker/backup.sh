#!/bin/sh
# Automated PostgreSQL Backup Script for Ithi Pooram
# Run daily via cron at 03:30 AM (after shift cutoff)

BACKUP_DIR="/backups/postgres"
DATE=$(date +"%Y%m%d_%H%M%S")
FILENAME="ithipooram_db_backup_${DATE}.sql.gz"

mkdir -p "${BACKUP_DIR}"

echo "[$(date)] Starting Ithi Pooram DB backup..."

pg_dump -h postgres -U ithipooram_user -d ithipooram_db | gzip > "${BACKUP_DIR}/${FILENAME}"

if [ $? -eq 0 ]; then
  echo "[$(date)] Backup completed successfully: ${FILENAME}"
  # Retain last 30 days of daily backups
  find "${BACKUP_DIR}" -type f -name "*.sql.gz" -mtime +30 -exec rm {} \;
else
  echo "[$(date)] ERROR: Backup failed!"
  exit 1
fi
