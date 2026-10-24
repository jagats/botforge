# 18 — Remediation Plan (Security & Performance)

> **Source findings:** `17-security-and-performance-audit.md` (Version 1.0 + Version 2.0 addendum).
> **Date:** 2026-10-24
> **How to use this:** Work top-down. Each item lists the file(s), the fix, and how to verify it. Do the **Gate 0** items before any production/pilot deploy — they are exploitable today.

## Priority ladder (do in this order)

| Gate | Theme | Items | Blocks deploy? |
| :--- | :--- | :--- | :--- |
| **0** | Stop the bleeding | C-01, C-02, H-01, H-02 | **Yes** |
| **1** | Abuse & cost control | H-03, H-04, H-05, H-06 (SEC-02/03) | Yes for public pilot |
| **2** | Hardening & hygiene | M-01..M-07 | Recommended |
| **3** | Performance correctness | P-01..P-05 | Yes for multi-user load |
| **4** | Performance polish | P-06..P-08, PERF-04/05/06, frontend | No |

---

## Gate 0 — Critical (exploitable now)

### 0.1 — SSRF hardening + lock down Qdrant (C-01 / SEC-01)
- **Files:** `backend/app/services/ingestion.py`, `backend/app/core/config.py`, `docker-compose.yml`, `docs/15-deployment-guide.md`.
- **Fix:**
  1. Add a `safe_url_guard(url)` helper: allow only `http`/`https`; resolve the host; reject if the resolved IP is loopback, private (RFC1918), link-local (`169.254.0.0/16`), or a known internal name (`postgres`, `qdrant`, `backend`, `localhost`).
  2. Set `follow_redirects=False`; on each redirect, re-run the guard on the new URL (max 3 hops).
  3. Cap the response: `MAX_FETCH_BYTES` (e.g. 5 MB) read with a streaming reader.
  4. Store a **generic** failure message for URL docs, not `str(exc)`.
  5. Set `QDRANT__SERVICE__API_KEY` on the Qdrant container (dev + prod) and pass it in `QdrantClient(api_key=...)`.
- **Verify:** ingesting `http://169.254.169.254/latest/meta-data/` and `http://qdrant:6333/collections` both fail with a generic error; a normal public page still ingests; `curl http://localhost:6333/collections` without the key returns 401/403.

### 0.2 — Refuse insecure defaults in production (C-02)
- **Files:** `backend/app/core/config.py` (add a `model_validator`).
- **Fix:** if `ENVIRONMENT == "production"` and `SECRET_KEY` or `SUPERADMIN_PASSWORD` equals its known default, raise at startup. Document `openssl rand -hex 64` for `SECRET_KEY`.
- **Verify:** booting a prod-env container with defaults exits non-zero with a clear message.

### 0.3 — Enforce active status on every protected route (H-01)
- **Files:** `backend/app/core/security.py`, all routers using `get_current_tenant_id`.
- **Fix:** introduce `get_active_tenant_id` that loads the user + tenant and re-checks `user.is_active` and `tenant.status == "active"` (reuse `get_current_user`'s checks). Replace `get_current_tenant_id` on `/chat`, `/tenants/*`, document read/delete, chat history. Keep the widget path's existing tenant-status check.
- **Verify:** suspend a brand, then its existing JWT gets `403` on `/chat` and `/tenants/me`.

### 0.4 — Make AI failures loud, not fake (H-02)
- **Files:** `backend/app/services/embedding.py`, `backend/app/services/llm.py`, `backend/app/core/config.py`.
- **Fix:** add explicit `USE_MOCK_AI: bool = False`. Only use mock vectors/answers when it is `True`. On a real OpenAI error: raise -> ingestion marks the doc `failed` with a safe message; chat returns a 503-style "temporarily unavailable". Batch embeddings (<=100 inputs/call, or chunk the list) and add retry/backoff (e.g. 3 tries).
- **Verify:** with an invalid key and `USE_MOCK_AI=false`, upload -> doc ends `failed` (not `ready`); chat returns an error, not raw chunk text.

---

## Gate 1 — Abuse & cost control

### 1.1 — Redis-backed, proxy-aware rate limiting (H-03 / SEC-04)
- **Files:** `backend/app/core/rate_limiter.py`, `backend/app/core/config.py`, `docker-compose*.yml` (add Redis), `docs/15` nginx snippet.
- **Fix:** move counters to Redis (atomic INCR + TTL). Derive client IP from the **last** `X-Forwarded-For` hop behind a trusted proxy count (`TRUSTED_PROXY_HOPS`). Add limiter deps to `/chat`, document upload, `/widget/config`. Check the limit before inserting any key.
- **Verify:** spoofed `X-Forwarded-For` no longer resets the limit; limits hold across workers.

### 1.2 — Input size & per-tenant quotas (H-04)
- **Files:** `schemas/document.py`, `services/ingestion.py`, `api/v1/documents.py`, new `services/usage.py` (see doc 19 usage table).
- **Fix:** `faq_text` max length (e.g. 100k chars); stream PDF to disk with a running size cap (reject mid-stream); reuse `MAX_FETCH_BYTES` for URLs; enforce per-tenant document count + monthly message quota by `plan`.
- **Verify:** oversized PDF rejected before full write; quota-exceeded upload returns `402/429`.

### 1.3 — Login enumeration + lockout (H-05)
- **Files:** `backend/app/services/auth_service.py`, `rate_limiter.py`.
- **Fix:** run a dummy `verify_password` against a fixed hash when the email is unknown (constant-ish time); add a per-email failure counter with temporary lockout/backoff.
- **Verify:** unknown vs known email response times converge; N bad passwords -> temporary lock.

### 1.4 — Widget domain whitelist + scoped CORS (H-06 / SEC-02 / SEC-03)
- **Files:** `models/tenant.py` (+Alembic), `core/security.py` (`get_tenant_by_api_key`), `api/v1/widget.py`, `main.py`.
- **Fix:** add `allowed_domains` (text[]/JSON) to tenants; in the API-key resolver, check `Origin`/`Referer` against it (wildcard localhost in dev). For `/api/v1/widget/*`, reflect allowed origins dynamically instead of the dashboard-only CORS list. **Note:** this column is folded into the `bots` table in doc 19 — build it there if you do doc 19 first.
- **Verify:** key used from an unlisted origin -> `403`; listed origin works; widget loads on an external site.

---

## Gate 2 — Hardening & hygiene (M-01..M-07)
- **M-01:** stop returning `access_token` in login/impersonate bodies for browser clients (cookie is already set); keep it only for explicit API/test use.
- **M-02:** add an `audit_log` table (actor, action, target, ts); short impersonation TTL (e.g. 30 min); include `impersonated_by` claim in writes/logs.
- **M-03:** in `delete_brand`, delete PDF files from disk and treat Qdrant delete failure as an error (retry/log-and-flag), not a silent pass.
- **M-04:** never log full JWTs or visitor questions at info level; return generic upload errors; disable `/docs` + `/openapi.json` when `ENVIRONMENT=production` (`docs_url=None`).
- **M-05:** wrap context in `<context>...</context>`, instruct the model to ignore instructions inside it, and keep the visitor question in a separate turn from context.
- **M-06:** validate PDF magic bytes (`%PDF-`); cap page count / decompressed size against pypdf bombs.
- **M-07:** add CSP, `X-Frame-Options: DENY`, `X-Content-Type-Options`, HSTS (middleware or nginx).

---

## Gate 3 — Performance correctness (P-01..P-05)
- **P-01:** make the hot paths truly non-blocking — either switch to async SQLAlchemy + `AsyncQdrantClient` + async OpenAI (singletons), or run sync work via `run_in_threadpool`. Ingestion should move to a worker (see doc 19, Celery/RQ).
- **P-02:** size the pool to workers: `pool_size * workers + overlap <= Postgres max_connections`; or use a pgbouncer. Start with `pool_size=5, max_overflow=5` at 4 workers.
- **P-03:** add `gunicorn` to `backend/requirements.txt` (pinned).
- **P-04:** batch chunk inserts; batch embeddings; add retry; move ingestion off `BackgroundTasks` to a durable queue so restarts don't strand docs.
- **P-05:** run `seed_superadmin` + Qdrant init once (a one-shot init container or an advisory lock), not in every worker's lifespan.

## Gate 4 — Performance polish
- **P-06 / PERF-05:** cache widget config + `widget.js` (in-memory/Redis TTL); serve `widget.js` via `FileResponse` or static mount.
- **P-07:** paginate documents list and chat history; use a chunk-count subquery instead of loading chunks.
- **P-08 / PERF-01/02:** singletons for Qdrant/OpenAI clients; add a retrieval min-score cutoff; drop stored chunk text from the Qdrant payload (Postgres is the source of record).
- **PERF-03:** SSE streaming for chat (`StreamingResponse` + `stream=True`) — backend + widget.
- **PERF-04:** composite index `(session_id, created_at)` on `chat_messages`.
- **PERF-06 / frontend:** `optimizePackageImports` for `react-icons`, Turbopack dev, decouple `useTenant`, remove the `AuthGuard` waterfall.

---

## Suggested sequencing (solo dev)
1. **Day 1 — Gate 0** (0.1–0.4). All four are small, high-impact edits.
2. **Day 2 — Gate 1** (Redis + limiter, quotas, login, widget domains). Add the Redis service once; it also serves caching later.
3. **Day 3 — Gate 2** hygiene batch (mostly config + a couple of small tables).
4. **Day 4 — Gate 3** performance correctness (biggest refactor: async + worker queue).
5. **Day 5 — Gate 4 + frontend** polish.

## Tests to add alongside
- `test_ssrf_blocked`, `test_qdrant_requires_key`
- `test_suspended_tenant_denied_on_chat_and_tenants`
- `test_ingestion_fails_loudly_without_key`
- `test_rate_limit_survives_xff_spoof`
- `test_widget_origin_rejected`
- `test_login_timing_and_lockout`

🤖 Generated with [Claude Code](https://claude.com/claude-code)
