# 09 — Development Plan and Current Status

Single developer, single monorepo, fully dockerized. Estimates assume full-time work; part-time roughly doubles them. Add ~20% buffer for debugging and prompt tuning (realistic target: 7–8 weeks to a pilot-ready MVP).

## Phases
| Phase | What gets built | Duration |
|---|---|---|
| 0 | Monorepo setup, Docker Compose (Postgres + Qdrant + backend + frontend), CI basics, empty app running end-to-end | 3 days |
| 1 | Multi-tenant DB schema, tenant + user tables, JWT auth, client can sign up and log in to an empty dashboard | 5 days |
| 2 | Document upload (PDF/FAQ/URL), chunking, embeddings, vectors in Qdrant per tenant | 7 days |
| 3 | RAG chat API: Qdrant retrieval + GPT-4o answers grounded in client data | 5 days |
| 4 | Embeddable widget (single script tag) using tenant's public key | 5 days |
| 5 | Rate limiting, error handling, basic analytics, prod compose file, pilot with 1 real client | 5 days |
| Total | Pilot-ready MVP | ~30 working days (~6 weeks) |

## Current status
- [x] Concept proposal, HLD/architecture, tech stack, LLD (schema, backend, frontend)
- [x] Root `docker-compose.yml` and `.env.example`
- [x] Phase 0 complete: `backend/Dockerfile`, `frontend/Dockerfile`, `backend/app/main.py` with health route, minimal Next.js app, `.gitignore`, Docker services running.
- [x] Phase 1 complete: Database layer & Alembic migrations (`tenants`, `users`, `api_keys`), FastAPI auth & tenant APIs with test suites (9 passing), and Next.js `/signup`, `/login`, `AuthProvider`, and `/dashboard`.
- [x] **Phase 2 complete:** `documents` & `document_chunks` models, Alembic migration, Qdrant collection setup (`document_chunks` with `tenant_id` payload index), ingestion service (PDF parsing via `pypdf`, URL scraping via `beautifulsoup4`, FAQ parsing), OpenAI embeddings + deterministic mock fallback, `/api/v1/documents` endpoints, automated test suite (13 passing), and Next.js `/dashboard/documents` management UI with auto-polling.
- [x] **Phase 3 complete:** `chat_sessions` & `chat_messages` models, Alembic migration `44750554ab41`, vector retrieval with strict `tenant_id` filter (`retrieval.py`), GPT-4o grounded answer generation with context-only guardrails (`llm.py`), conversation session persistence (`chat_service.py`), `/api/v1/chat` endpoints, automated test suite (16 total passing), and Next.js `/dashboard/chat-test` interactive playground with source chunk citation inspector.
- [ ] **Phase 4 next:** Embeddable widget (`widget/src/widget.ts` built to `widget/dist/widget.js`), public-key authenticated endpoint `POST /api/v1/widget/chat`, embed snippet in settings page, and standalone HTML test demo.

> Update this checklist whenever a task is finished.

## Phase 0 — task list
1. [x] Create the monorepo folders from `04-folder-structure.md`.
2. [x] Write `backend/Dockerfile` + `requirements.txt` (include `psycopg[binary]`).
3. [x] Write `backend/app/main.py` with `GET /health`.
4. [x] Write `frontend/Dockerfile`, init Next.js + TypeScript in `frontend/`.
5. [x] Copy `.env.example` → `.env`, run `docker compose up --build`.
6. [x] Done when: Postgres healthy, Qdrant dashboard reachable on 6333, `/health` returns OK, frontend loads on 3000.
7. [x] Add `.gitignore` (`.env`, `node_modules`, `__pycache__`, `.next`, uploads).

## Phase 1 — task list (build order from the LLD)
1. [x] SQLAlchemy models: `tenants`, `users`, `api_keys`; Alembic first migration.
2. [x] `core/config.py`, `core/security.py` (password hashing, JWT, `get_current_tenant`).
3. [x] `api/v1/auth.py`: signup (tenant + user + api key in one transaction), login, me.
4. [x] `api/v1/tenants.py`: me, patch me, api-key.
5. [x] Tests for signup/login/me and for tenant isolation.
6. [x] Next.js `/login`, `/signup`, `AuthProvider`, `lib/api.ts`, empty `/dashboard`.
7. [x] Done when: a user can sign up, log in, see the empty dashboard, and refresh without losing the session.

## Phase 2 — task list (Document Ingestion & Qdrant)
1. [x] SQLAlchemy models: `documents`, `document_chunks`; Alembic migration `7d32b6ea0771`.
2. [x] Qdrant collection initialization on startup with payload index on `tenant_id` and `document_id`.
3. [x] Ingestion service (`services/ingestion.py`): PDF text extraction (`pypdf`), URL scraping (`beautifulsoup4`), and sliding window chunking (~300-500 tokens).
4. [x] Vector service (`services/embedding.py`): OpenAI embeddings (`text-embedding-3-small`) with deterministic mock fallback, Qdrant upsert and tenant-filtered vector deletion.
5. [x] Document service (`services/document_service.py`): background ingestion task, document listings, cascade deletion.
6. [x] API routes (`api/v1/documents.py`): `POST /documents/upload`, `POST /documents/url`, `POST /documents/faq`, `GET /documents`, `GET /documents/{id}`, `DELETE /documents/{id}`.
7. [x] Automated test suite (`tests/test_documents.py`): FAQ ingestion, PDF validation, deletion, and cross-tenant isolation (13 total passing).
8. [x] Frontend UI (`frontend/src/app/dashboard/documents/page.tsx`): Tabs for PDF drag-drop, URL input, FAQ form, auto-polling table with status badges and deletion.

## Phase 3 — task list (RAG Chat Engine & Playground)
1. [x] SQLAlchemy models: `chat_sessions`, `chat_messages` with tenant cascade and indexes.
2. [x] Alembic migration `44750554ab41` applied to PostgreSQL.
3. [x] Retrieval service (`services/retrieval.py`): query embedding and Qdrant vector search strictly filtered by `tenant_id`.
4. [x] LLM service (`services/llm.py`): strict "only-context" system prompt guardrail, multi-turn history assembly, OpenAI GPT-4o with deterministic mock fallback.
5. [x] Chat service (`services/chat_service.py`): session resolution, conversation message logging, citation tracking.
6. [x] API routes (`api/v1/chat.py`): `POST /api/v1/chat` and `GET /api/v1/chat/sessions/{session_id}`.
7. [x] Automated test suite (`tests/test_chat.py`): multi-turn chat persistence, cross-tenant isolation, no-context fallback (16 total passing).
8. [x] Frontend UI (`frontend/src/app/dashboard/chat-test/page.tsx`): Real-time chat playground with citation inspector, expandable chunk excerpts, session reset, and knowledge base readiness indicator.

## Phase 4 — outline
`widget.ts` (bubble + panel) → build to `dist/widget.js` → `/widget/chat` with public-key auth → embed snippet in settings page → test on a plain HTML page.

## Phase 5 — outline
Rate limiting per key/tenant, consistent error responses, basic analytics (message counts, top questions), `docker-compose.prod.yml`, pilot with one friendly client.

## Business next steps (parallel, not code)
Validate with 2–3 DVIO clients who asked for a chatbot; define pricing tiers (e.g. by messages or documents); plan phased rollout.

## Pitfalls to remember
- Missing `tenant_id` filter = data leak. Test isolation explicitly.
- Embedding model mismatch between ingestion and query breaks search.
- Prompt tuning takes real time; keep the "only from context" rule strict.
- Large PDFs and slow embedding calls: keep ingestion in the background.
