# Cloud Deployment, SSL & Backup Guide
## Production Deployment for Ithi Pooram (ഇത്തിപ്പൂരം)

### 1. Prerequisites
- Linux Server (Ubuntu 22.04 LTS / Debian 12 or AWS EC2 / DigitalOcean Droplet / GCP Compute Engine).
- Minimum Hardware: 2 vCPU, 4 GB RAM, 40 GB NVMe SSD.
- Domain name mapped with DNS A Records:
  - `order.ithipooram.in` -> Frontend Next.js app
  - `api.ithipooram.in` -> Backend Express & Socket.IO server
- Docker & Docker Compose installed.

---

### 2. Fast Launch with Docker Compose
```bash
# Clone the repository
git clone https://github.com/ithipooram/ithipooram-pos.git /opt/ithipooram
cd /opt/ithipooram

# Review production environment variables in .env
cat <<EOF > backend/.env
PORT=5000
NODE_ENV=production
DATABASE_URL="postgresql://ithipooram_user:ithipooram_production_secure_pass_2026@postgres:5432/ithipooram_db?schema=public"
JWT_SECRET="generate-a-64-character-cryptographic-random-token-here"
JWT_EXPIRES_IN="12h"
FRONTEND_URL="https://order.ithipooram.in"
TZ="Asia/Kolkata"
EOF

# Launch all 3 services (Postgres 16, Backend, Frontend)
docker compose up -d --build

# Run initial database seed
docker compose exec backend npm run seed
```

---

### 3. HTTPS Reverse Proxy with Nginx & Let's Encrypt
```nginx
# /etc/nginx/sites-available/ithipooram.conf

server {
    server_name order.ithipooram.in;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

server {
    server_name api.ithipooram.in;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable SSL certificates:
```bash
sudo certbot --nginx -d order.ithipooram.in -d api.ithipooram.in
```

---

### 4. Database Automated Backup & Disaster Recovery
1. Set up daily cron job to run `docker/backup.sh` every morning at 03:30 AM IST (after restaurant shift cutoff):
```bash
# Add to crontab (crontab -e)
30 3 * * * /opt/ithipooram/docker/backup.sh >> /var/log/ithipooram_backup.log 2>&1
```

2. **Disaster Recovery Restore Procedure**:
```bash
# Decompress and restore database into PostgreSQL container
gunzip < /backups/postgres/ithipooram_db_backup_20261014_033000.sql.gz | \
docker compose exec -T postgres psql -U ithipooram_user -d ithipooram_db
```
