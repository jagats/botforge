# 14 — Pre-Deployment Checklist (Staging & Production)

> **Document Purpose:** Comprehensive gatekeeping checklist and sign-off verification matrix before deploying BotForge to **Staging** and **Production** environments.  
> **Target Audience:** DevOps, Backend Engineers, Frontend Engineers, and Product Administrators.

---

## 1. Code Quality & Automated Test Gates

Before deploying code to Staging or Production, ensure the codebase satisfies all automated verification gates locally or in CI/CD.

| Check | Command / Verification | Staging Gate | Prod Gate | Status |
| :--- | :--- | :---: | :---: | :---: |
| **Backend Unit & Integration Tests** | `python -m pytest` inside `backend/` | 34/34 passing | 34/34 passing | [ ] |
| **Tenant Isolation Tests** | `pytest tests/test_documents.py tests/test_chat.py tests/test_widget.py` | Required | Required | [ ] |
| **RBAC & Impersonation Tests** | `pytest tests/test_admin_brands.py` | Required | Required | [ ] |
| **Rate Limiter Throttling Tests** | `pytest tests/test_rate_limiting.py` | Required | Required | [ ] |
| **Frontend Production Build** | `npm run build` inside `frontend/` (Next.js Standalone) | 0 errors | 0 errors | [ ] |
| **TypeScript Typecheck** | Included in `npm run build` | 0 errors | 0 errors | [ ] |
| **Widget Standalone Build** | `node widget/build.js` | 21 KB bundle generated | 21 KB bundle generated | [ ] |
| **Git Working Tree** | `git status -s` on target release branch | Clean tree | Clean tree (tagged release) | [ ] |

---

## 2. API Keys, Secrets & Environment Variables Matrix

Every variable must be provisioned and verified in the target environment vault (`.env.staging` or `.env.production` / AWS Secrets Manager / Doppler / Infisical).

> [!WARNING]
> **Never commit production or staging `.env` files to git.** Use `.env.example` as the canonical reference template.

| Variable | Target Service | Sensitivity | Dev Default | Staging Requirement | Production Requirement |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `ENVIRONMENT` | Backend | Medium | `development` | `staging` | `production` *(enforces `secure=True` on cookies)* |
| `SECRET_KEY` | Backend | **CRITICAL** | `insecure-default-secret...` | Generated: `openssl rand -hex 32` | Generated: `openssl rand -hex 64` (distinct from staging) |
| `JWT_ALGORITHM` | Backend | Low | `HS256` | `HS256` | `HS256` |
| `JWT_EXPIRE_MINUTES` | Backend | Medium | `1440` (24h) | `1440` (24h) | `1440` (24h) or configured org policy |
| `OPENAI_API_KEY` | Backend | **CRITICAL** | `sk-replace-me` | Real OpenAI Key (Tier 1/2) with usage limits | Real OpenAI Key (Tier 3+) with usage alerts |
| `EMBEDDING_MODEL` | Backend | High | `text-embedding-3-small` | `text-embedding-3-small` *(must match Qdrant dim 1536)* | `text-embedding-3-small` *(must match Qdrant dim 1536)* |
| `CHAT_MODEL` | Backend | Medium | `gpt-4o` | `gpt-4o` | `gpt-4o` |
| `DATABASE_URL` | Backend | **CRITICAL** | `postgresql+psycopg://...localhost:5432` | Managed DB or Staging Postgres with SSL (`sslmode=require`) | Managed DB (RDS / Supabase) with High Availability & SSL |
| `POSTGRES_USER` | Postgres | High | `aibot_user` | Custom user name | Custom user name (not root/postgres) |
| `POSTGRES_PASSWORD` | Postgres | **CRITICAL** | `change_me_locally` | Strong generated password | Strong generated password (≥ 32 chars) |
| `POSTGRES_DB` | Postgres | Low | `aibot_platform` | `botforge_staging` | `botforge_prod` |
| `QDRANT_URL` | Backend | High | `http://qdrant:6333` | `http://qdrant:6333` or Staging Qdrant Cloud | `http://qdrant:6333` or Dedicated Qdrant Cluster |
| `QDRANT_COLLECTION_NAME` | Backend | Low | `document_chunks` | `document_chunks` | `document_chunks` |
| `CORS_ORIGINS` | Backend | **CRITICAL** | `["http://localhost:3000", ...]` | `["https://staging.botforge.com"]` | `["https://app.botforge.com"]` |
| `NEXT_PUBLIC_API_URL` | Frontend | High | `http://localhost:8000` | `https://api.staging.botforge.com` | `https://api.botforge.com` |
| `SUPERADMIN_EMAIL` | Backend | High | `admin@botforge.com` | `admin-staging@botforge.com` | Production Master Admin Email |
| `SUPERADMIN_PASSWORD` | Backend | **CRITICAL** | `Admin@BotForge2026!` | Strong staging password | High-entropy password (≥ 20 chars, symbols) |
| `MAX_UPLOAD_SIZE_MB` | Backend | Low | `20` | `20` | `25` (or configured client contract limit) |
| `UPLOAD_DIR` | Backend | Medium | `/app/uploads` | Persistent volume mount | Persistent cloud volume (EBS) or S3/R2 |
| `RATE_LIMIT_ENABLED` | Backend | Medium | `true` | `true` | `true` |
| `RATE_LIMIT_WIDGET_PER_MINUTE` | Backend | Medium | `60` | `60` | `60` (or tiered per plan) |
| `RATE_LIMIT_WIDGET_IP_PER_MINUTE`| Backend | Medium | `20` | `20` | `20` |
| `RATE_LIMIT_AUTH_PER_MINUTE` | Backend | High | `15` | `15` | `15` |

---

## 3. Security & Authentication Audit Checklist

Verify that every security posture established in the Audit Fixes Plan is active.

- [ ] **1. HttpOnly Cookie Enforced**
  - Verify that `POST /api/v1/auth/login` sets `botforge_admin_token` or `botforge_user_token` with `HttpOnly=True` and `SameSite=Lax`.
  - In `ENVIRONMENT=production`, verify that `Secure=True` is active (requires HTTPS).
- [ ] **2. Impersonation Session Isolation**
  - Verify `POST /api/v1/admin/brands/{tenant_id}/impersonate` sets `botforge_impersonation_token` without deleting `botforge_admin_token`.
  - Verify `POST /api/v1/admin/brands/exit-impersonation` clears only `botforge_impersonation_token`.
- [ ] **3. Zero Tokens in Client Storage**
  - Inspect browser DevTools on frontend login: `localStorage` and `sessionStorage` must have **0** JWT tokens.
  - Client-side JavaScript cannot read `document.cookie` for auth tokens.
- [ ] **4. CORS Policy Restriction**
  - Verify backend does not allow `allow_origins=["*"]` when `allow_credentials=True`.
  - Verify that staging origins cannot hit production backend APIs and vice-versa.
- [ ] **5. Closed Self-Signup Guard**
  - Verify `POST /api/v1/auth/signup` returns `404 Not Found`.
  - Verify frontend `/signup` immediately redirects to `/login`.
- [ ] **6. Suspended Tenant Lockout**
  - Verify that setting a brand to `inactive` / `suspended` locks out all tenant user logins with `403 Forbidden`.
  - Verify that public widget chat for suspended tenants immediately returns `403 Forbidden`.

---

## 4. Database & Migration Readiness Checklist

- [ ] **1. Alembic Migrations Up-To-Date**
  - Run `alembic current` and compare against `alembic heads`.
  - Target migration revision must match `f8b23c91d4e2_add_is_active_to_users.py` (or latest).
- [ ] **2. Connection Pool Sizing**
  - Verify SQLAlchemy pool settings in `backend/app/db/session.py`:
    - `pool_size`: 10-20 connections per backend worker.
    - `max_overflow`: 10.
    - `pool_pre_ping=True`: Active (prevents stale disconnected TCP connections).
- [ ] **3. Superadmin Auto-Seed Verification**
  - Verify that `seed_superadmin(db)` executes on startup without error and creates the master administrator with password hash.
- [ ] **4. Automated Snapshot / Backup Scheduled**
  - Staging: Daily automated PostgreSQL dump.
  - Production: Automated hourly WAL archiving + continuous point-in-time recovery (PITR) enabled.

---

## 5. Vector Engine (Qdrant) Readiness Checklist

- [ ] **1. Payload Indexes Initialized**
  - Confirm on startup that `init_qdrant_collection()` successfully created:
    - Collection: `document_chunks` (vector size 1536, Distance `COSINE`).
    - Payload Index 1: `tenant_id` (Keyword index — **critical for multi-tenant data isolation**).
    - Payload Index 2: `document_id` (Keyword index).
- [ ] **2. Disk Persistence Volume Attached**
  - Confirm `/qdrant/storage` is mounted to a durable host volume or cloud block storage so vectors survive container restarts.
- [ ] **3. Qdrant Version Pinned**
  - Verify `docker-compose.prod.yml` uses a pinned release (e.g., `qdrant/qdrant:v1.9.0`), not `:latest`.

---

## 6. Embeddable Widget Readiness Checklist

- [ ] **1. Widget Script Compilation**
  - Verify `widget/dist/widget.js` has been compiled via `node widget/build.js`.
  - Verify file size is ~21 KB and has **zero** external runtime dependencies.
- [ ] **2. Static Script Serving & Headers**
  - Verify `GET /widget.js` returns HTTP 200 with headers:
    - `Content-Type: application/javascript`
    - `Access-Control-Allow-Origin: *`
    - `Cache-Control: public, max-age=3600`
- [ ] **3. Public API Key Verification**
  - Verify `POST /api/v1/widget/chat` works with `X-Public-Key` header or `Authorization: Bearer <pubkey>`.
  - Verify rate limiter enforces widget chat throttling (default 20 requests/minute per client IP).

---

## 7. Go / No-Go Sign-Off Matrix

Every stakeholder must sign off on the checks below before deploying to Production.

| Phase Gate | Responsible Role | Staging Sign-Off | Production Sign-Off | Date Signed |
| :--- | :--- | :---: | :---: | :---: |
| **All Test Suites Passing** | QA / Lead Dev | [ ] | [ ] | |
| **Security & CORS Audit** | Security / DevOps | [ ] | [ ] | |
| **Real LLM Key & Quotas** | Product Owner | [ ] | [ ] | |
| **Database Migrations Ready** | Backend Lead | [ ] | [ ] | |
| **SSL / HTTPS Verified** | DevOps / Infra | [ ] | [ ] | |
| **Smoke Test Completed** | Lead Dev | [ ] | [ ] | |

> **Decision Rule:** A single uncheck in the Production column constitutes an automatic **NO-GO**.
