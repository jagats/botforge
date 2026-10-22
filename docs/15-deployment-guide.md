# 15 — Deployment Guide (Staging & Production)

> **Document Purpose:** Complete, step-by-step deployment guide for provisioning, configuring, and deploying BotForge across **Staging** and **Production** environments.  
> **Target Audience:** DevOps, System Administrators, and Full-Stack Engineers.

---

## 1. Architectural Topology & Network Topology

```
                          Internet Traffic
                                 │
                 ┌───────────────┴───────────────┐
                 │                               │
                 ▼                               ▼
       https://app.botforge.com         https://api.botforge.com
         (Frontend Dashboard)             (FastAPI Backend)
                 │                               │
                 └───────────────┬───────────────┘
                                 │
                         [ Cloudflare DNS ]
                                 │
                       [ Nginx Reverse Proxy ]
                     (SSL / TLS 1.3 Termination)
                                 │
        ┌────────────────────────┼────────────────────────┐
        │ Docker Internal Network (aibot_prod_network)    │
        │                                                 │
        ▼                                                 ▼
┌───────────────────┐                             ┌───────────────────┐
│ Next.js Standalone│                             │  FastAPI Backend  │
│ Container (:3000) │                             │ Container (:8000) │
│ (Node 20 Alpine)  │                             │(Gunicorn/Uvicorn) │
└───────────────────┘                             └─────────┬─────────┘
                                                            │
                                  ┌─────────────────────────┴──────────────┐
                                  │                                        │
                                  ▼                                        ▼
                      ┌──────────────────────┐                 ┌──────────────────────┐
                      │  PostgreSQL 16 DB    │                 │   Qdrant Vector DB   │
                      │  (Relational Data)   │                 │    (Port :6333)      │
                      │  Volume: pg_prod_data│                 │Volume: qdrant_storage│
                      └──────────────────────┘                 └──────────────────────┘
```

---

## 2. Server & Infrastructure Sizing Recommendations

| Environment | Minimum CPU | Minimum RAM | Disk Storage | Target Hosting Type |
| :--- | :---: | :---: | :---: | :--- |
| **Staging** | 2 vCPU | 4 GB | 40 GB SSD | Single VPS / EC2 (`t3.medium` or DigitalOcean Droplet) |
| **Production (MVP / Pilot)** | 4 vCPU | 8 GB | 80 GB NVMe | Managed Services / EC2 (`c6i.xlarge` or `t3.xlarge`) + Managed RDS |
| **Production (Scaled)** | 8+ vCPU | 16+ GB | Auto-scaling EBS | AWS ECS / EKS or Distributed Compose + Managed RDS + Qdrant Cloud |

---

## 3. Production Docker Architecture (`docker-compose.prod.yml`)

Create `docker-compose.prod.yml` in the project root:

```yaml
version: "3.9"

services:
  # ---------------- Database: PostgreSQL 16 ----------------
  postgres:
    image: postgres:16-alpine
    container_name: botforge_prod_postgres
    restart: always
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - postgres_prod_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - botforge_prod_network

  # ---------------- Vector Database: Qdrant ----------------
  qdrant:
    image: qdrant/qdrant:v1.9.0
    container_name: botforge_prod_qdrant
    restart: always
    volumes:
      - qdrant_prod_data:/qdrant/storage
    networks:
      - botforge_prod_network

  # ---------------- Backend: FastAPI (Gunicorn + Uvicorn) ----------------
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: botforge_prod_backend
    restart: always
    env_file:
      - .env.production
    environment:
      DATABASE_URL: postgresql+psycopg://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
      QDRANT_URL: http://qdrant:6333
    volumes:
      - backend_prod_uploads:/app/uploads
    depends_on:
      postgres:
        condition: service_healthy
      qdrant:
        condition: service_started
    networks:
      - botforge_prod_network
    command: gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000 --timeout 120

  # ---------------- Frontend: Next.js Standalone ----------------
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      target: runner
      args:
        NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL}
    container_name: botforge_prod_frontend
    restart: always
    env_file:
      - .env.production
    depends_on:
      - backend
    networks:
      - botforge_prod_network

networks:
  botforge_prod_network:
    driver: bridge

volumes:
  postgres_prod_data:
  qdrant_prod_data:
  backend_prod_uploads:
```

---

## 4. Reverse Proxy & SSL Configuration (Nginx)

Place this configuration at `/etc/nginx/sites-available/botforge.conf` on the host:

```nginx
# Upstream Definitions
upstream backend_upstream {
    server 127.0.0.1:8000;
    keepalive 32;
}

upstream frontend_upstream {
    server 127.0.0.1:3000;
    keepalive 32;
}

# ----------------- 1. HTTP -> HTTPS Redirect -----------------
server {
    listen 80;
    listen [::]:80;
    server_name app.botforge.com api.botforge.com;
    return 301 https://$host$request_uri;
}

# ----------------- 2. Frontend Dashboard (app.botforge.com) -----------------
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name app.botforge.com;

    ssl_certificate /etc/letsencrypt/live/app.botforge.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.botforge.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    location / {
        proxy_pass http://frontend_upstream;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# ----------------- 3. Backend API & Widget (api.botforge.com) -----------------
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.botforge.com;

    ssl_certificate /etc/letsencrypt/live/api.botforge.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.botforge.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Upload size allowance for PDF knowledge ingestion
    client_max_body_size 30M;

    # Backend API endpoints
    location / {
        proxy_pass http://backend_upstream;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Support HttpOnly cookies across origins
        proxy_cookie_path / "/; Secure; HttpOnly; SameSite=Lax";
        
        proxy_read_timeout 180s;
        proxy_connect_timeout 60s;
    }

    # Embeddable Widget Script Serving with CDN/Browser Caching
    location = /widget.js {
        proxy_pass http://backend_upstream/widget.js;
        proxy_set_header Host $host;
        proxy_cache_valid 200 1h;
        add_header Cache-Control "public, max-age=3600";
        add_header Access-Control-Allow-Origin "*";
    }
}
```

---

## 5. Step-by-Step Staging Deployment Walkthrough

Follow these steps when setting up the **Staging** environment on a fresh Ubuntu 22.04 / 24.04 server.

### Step 5.1: Initial Server Setup & Dependencies
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git ufw nginx certbot python3-certbot-nginx

# Install Docker & Docker Compose Plugin
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker

# Configure UFW Firewall
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
```

### Step 5.2: Clone Repository & Build Widget
```bash
cd /opt
sudo git clone https://github.com/jagats/botforge.git
sudo chown -R $USER:$USER /opt/botforge
cd /opt/botforge
git checkout main  # or target release tag

# Build standalone widget bundle
cd widget && npm install && node build.js && cd ..
```

### Step 5.3: Configure Staging Environment Variables
```bash
# Copy and edit environment file
cp .env.example .env.staging
nano .env.staging
```
Ensure the following staging values are configured:
- `ENVIRONMENT=staging`
- `SECRET_KEY=<random-32-hex>`
- `OPENAI_API_KEY=sk-...` (Valid OpenAI staging key)
- `CORS_ORIGINS=["https://staging.botforge.com"]`
- `NEXT_PUBLIC_API_URL=https://api.staging.botforge.com`
- `SUPERADMIN_EMAIL=admin-staging@botforge.com`

### Step 5.4: Issue SSL Certificates via Certbot
```bash
sudo certbot --nginx -d staging.botforge.com -d api.staging.botforge.com
```

### Step 5.5: Build & Launch Staging Containers
```bash
docker compose --env-file .env.staging -f docker-compose.prod.yml up --build -d
```

### Step 5.6: Run Database Migrations
```bash
# Execute Alembic migrations inside the running backend container
docker exec -it botforge_prod_backend alembic upgrade head
```

---

## 6. Step-by-Step Production Deployment Walkthrough

### Step 6.1: Pre-Deployment Safety Snapshot
Before updating a running production instance:
```bash
# Snapshot the Postgres database
docker exec botforge_prod_postgres pg_dump -U aibot_user aibot_platform > /opt/backups/backup_$(date +%Y%m%d_%H%M%S).sql

# Snapshot Qdrant storage volume
docker run --rm --volumes-from botforge_prod_qdrant -v /opt/backups:/backup alpine tar czf /backup/qdrant_$(date +%Y%m%d_%H%M%S).tar.gz /qdrant/storage
```

### Step 6.2: Fetch Production Release & Compile Assets
```bash
cd /opt/botforge
git fetch --tags
git checkout v1.0.0  # release version

# Rebuild widget bundle
cd widget && npm install && node build.js && cd ..
```

### Step 6.3: Build & Launch with Zero Downtime / Rolling Containers
```bash
# Pull and build new container images
docker compose --env-file .env.production -f docker-compose.prod.yml build

# Apply database migrations first
docker compose --env-file .env.production -f docker-compose.prod.yml run --rm backend alembic upgrade head

# Restart services with new build
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --remove-orphans
```

---

## 7. Post-Deployment Verification & Smoke Tests

Run these terminal checks immediately following deployment to confirm full stack health.

### 1. Backend Health Check
```bash
curl -I https://api.botforge.com/health
# Expected: HTTP/2 200 OK
# Body: {"status":"ok","service":"botforge-backend","version":"0.1.0"}
```

### 2. Widget Script Delivery Check
```bash
curl -I https://api.botforge.com/widget.js
# Expected: HTTP/2 200 OK
# Header: Access-Control-Allow-Origin: *
# Header: Content-Type: application/javascript
```

### 3. Superadmin Authentication Check
```bash
curl -X POST https://api.botforge.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@botforge.com","password":"<your_production_password>"}' \
  -c cookies.txt
# Expected: HTTP 200 OK
# Check cookies.txt contains: botforge_admin_token with HttpOnly and Secure attributes
```

### 4. Impersonation & Tenant Verification
- Log in to `https://app.botforge.com` as Superadmin.
- Navigate to `/admin/brands`.
- Verify existing brand rows load without N+1 delay (< 300ms).
- Click **"View Dashboard"** on a brand row: verify sticky impersonation banner appears.
- Click **"Return to Superadmin"**: verify seamless navigation back to `/admin/brands`.

### 5. Ingestion & RAG Chat Smoke Test
- Upload a sample 2-page PDF document under a test brand.
- Verify status changes from `pending` ➔ `processing` ➔ `ready`.
- Open `/dashboard/chat-playground` and ask a question present in the document.
- Verify context chunks are retrieved and citations display accurately.

---

## 8. Rollback Procedures & Disaster Recovery

If critical failures, regressions, or database incompatibilities occur after deployment:

### Fast Code Rollback (No Schema Changes)
```bash
cd /opt/botforge
git checkout <previous-stable-tag>
cd widget && node build.js && cd ..
docker compose --env-file .env.production -f docker-compose.prod.yml up --build -d
```

### Full Rollback with Database Restore
```bash
# 1. Stop backend services to halt writes
docker stop botforge_prod_backend botforge_prod_frontend

# 2. Restore PostgreSQL database snapshot
cat /opt/backups/backup_<timestamp>.sql | docker exec -i botforge_prod_postgres psql -U aibot_user aibot_platform

# 3. Restore Qdrant volume if vector data was affected
docker run --rm --volumes-from botforge_prod_qdrant -v /opt/backups:/backup alpine sh -c "rm -rf /qdrant/storage/* && tar xzf /backup/qdrant_<timestamp>.tar.gz -C /"

# 4. Rollback codebase & restart
git checkout <previous-stable-tag>
docker compose --env-file .env.production -f docker-compose.prod.yml up -d
```

---

## 9. Ongoing Maintenance & Backup Automation

Add an automated daily backup cron job via `sudo crontab -e`:

```bash
# Daily BotForge PostgreSQL & Qdrant snapshot at 03:00 AM UTC
0 3 * * * docker exec botforge_prod_postgres pg_dump -U aibot_user aibot_platform | gzip > /opt/backups/db_$(date +\%Y\%m\%d).sql.gz && find /opt/backups -name "db_*.sql.gz" -mtime +14 -delete
```
