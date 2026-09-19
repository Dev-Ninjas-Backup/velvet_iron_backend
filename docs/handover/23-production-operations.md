# Velvet & Iron Backend - Production Operations Runbook

**Document ID:** `23-production-operations.md`  
**Target Audience:** DevOps Engineers, Site Reliability Engineers, On-Call Engineers  

---

## 1. Verified Production Command Reference

Execute these commands on the production host (AWS EC2 instance) under `/home/<EC2_USER>/<SERVER_NAME>/`:

### 1.1 Managing the Application Stack
```bash
# View running containers across the prod profile
sudo docker compose --profile prod ps

# Tail live application logs
sudo docker compose --profile prod logs -f server

# Tail Caddy reverse proxy access and SSL logs
sudo docker compose --profile prod logs -f caddy

# Tail PostgreSQL database engine logs
sudo docker compose --profile prod logs -f postgres

# Restart application container gracefully without downtime to DB
sudo docker compose --profile prod restart server

# Full stack restart
sudo docker compose --profile prod restart
```

### 1.2 Inspecting Database & Running Migrations
```bash
# Execute psql shell directly inside database container
sudo docker compose --profile prod exec postgres psql -U ${POSTGRES_USER} -d ${POSTGRES_DB}

# Check pending Prisma migrations against production DB
sudo docker compose --profile prod exec server npx prisma migrate status

# Manually trigger pending schema migrations
sudo docker compose --profile prod exec server npx prisma migrate deploy

# Open interactive Prisma Studio (accessible via port 8001 / velvet.db.softvence.app)
# (Running as a permanent container service in compose)
```

---

## 2. Backup & Disaster Recovery Procedures

### 2.1 Generating a Full PostgreSQL Database Backup
Execute directly on the production host:
```bash
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/ubuntu/backups"
mkdir -p ${BACKUP_DIR}

# Dump compressed SQL backup
sudo docker compose --profile prod exec -T postgres pg_dump -U ${POSTGRES_USER} ${POSTGRES_DB} | gzip > ${BACKUP_DIR}/velvet_db_${TIMESTAMP}.sql.gz

echo "Backup created at ${BACKUP_DIR}/velvet_db_${TIMESTAMP}.sql.gz"
```

### 2.2 Restoring from a Compressed Backup
> [!CAUTION]
> **DANGEROUS OPERATION:** This will overwrite the active production database. Always take an emergency backup first.

```bash
# 1. Stop the application server to prevent incoming database writes
sudo docker compose --profile prod stop server

# 2. Restore database from backup
gunzip -c /home/ubuntu/backups/velvet_db_TARGET.sql.gz | sudo docker compose --profile prod exec -T postgres psql -U ${POSTGRES_USER} -d ${POSTGRES_DB}

# 3. Restart application server
sudo docker compose --profile prod start server
```

---

## 3. Incident Investigation & Emergency Triage

### Scenario A: Server Returning 502 Bad Gateway
1. **Check if Caddy is running:** `sudo docker ps | grep caddy`
2. **Check if NestJS server container crashed:** `sudo docker ps -a | grep velvet_backend`
3. **Inspect crash logs:** `sudo docker compose --profile prod logs --tail=100 server`
4. **Common Cause:** Database connection failed or missing required environment variable on boot.

### Scenario B: Database Container Healthy but Server Refuses Connection
1. Verify database port and network bridge: `sudo docker network inspect app-network`
2. Test network connectivity from inside server container:
   ```bash
   sudo docker compose --profile prod exec server nc -zv postgres 5432
   ```

### Scenario C: Users Report Being Logged Out Repeatedly
1. Inspect JWT configuration: check if `ACCESS_TOKEN_EXPIRATION_MS` was altered or set to a sub-minute value.
2. Check `OptionalJwtGuard` logs: `sudo docker compose --profile prod logs server | grep "Scenario 1"`
3. Verify server clock synchronization: `timedatectl status` on the host machine.

