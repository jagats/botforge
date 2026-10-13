# 02 — Architecture

## Core engine: RAG (Retrieval-Augmented Generation)
RAG makes the AI answer from real facts in the client's data instead of guessing.

### Ingestion (when a client uploads content)
1. **Collect** — PDF, FAQ text, or URL is received.
2. **Extract + chunk** — text is extracted and split into ~300–500 token chunks.
3. **Embed** — each chunk is turned into a vector (numbers representing meaning) by an embedding model.
4. **Store** — chunk text + metadata go to Postgres; the vector goes to Qdrant with `tenant_id` in its payload.

### Answering (when a visitor asks a question)
1. **Embed the question** with the SAME embedding model used at ingestion.
2. **Retrieve** top-k (e.g. 5) most similar chunks from Qdrant, **filtered by `tenant_id`**.
3. **Prompt** GPT-4o: "Answer using ONLY the following context. If the answer isn't in the context, say you don't know." + chunks.
4. **Answer** is returned (streamed or full) and both messages are saved to `chat_messages`.

## System components
```
                                ┌───────────────────────────────────────┐
                                │   Product Admin (Platform Owner)      │
                                └───────────────────┬───────────────────┘
                                                    │ Onboards Brand / Toggles Status
                                                    ▼
 Client's website ──(script tag + public key)──► Widget (vanilla TS)
                                                     │  POST /api/v1/widget/chat
                                                     ▼
 Brand dashboard (Next.js) ──(JWT)──► FastAPI backend ──► PostgreSQL (system of record)
                                            │
                                            ├──► Qdrant (vectors, tenant-filtered)
                                            └──► OpenAI (embeddings + GPT-4o)
```

## User tiers and authentication paths
| Caller | Role | Auth | Scope & Privileges |
|---|---|---|---|
| Product Admin (DVIO) | `superadmin` | JWT (Bearer) | Cross-tenant access: onboard brands, list all members, toggle active/inactive |
| Client Brand (Member) | `owner` / `member` | JWT (Bearer) | Tenant-scoped: upload knowledge base, playground test, embed widget |
| Website visitor via widget | Public | Public key in header (`X-Public-Key`) | Chat with AI grounded in active brand's documents |

## Closed onboarding model
- **No public self-service registration.** Public `/signup` route is removed/redirected to `/login`.
- **Admin-provisioned brands:** Only Product Admin creates new client tenants and issues initial credentials.
- **Instant deactivation switch:** When a brand is deactivated, their login is blocked and widget queries return HTTP 403 Forbidden.

## Multi-tenancy model
- **Row-level multi-tenancy:** one shared schema, every table has `tenant_id`.
- Postgres **Row-Level Security (RLS)** planned as a safety net in addition to app-level filters.
- **One shared Qdrant collection** (`document_chunks`) with `tenant_id` payload filter. (One collection per tenant is stronger isolation but more ops work — rejected for MVP.)

## Why chunk text is stored in Postgres too
Postgres is the system of record. If Qdrant needs rebuilding (upgrade/bug), we re-embed from Postgres without asking clients to re-upload.

## Background processing
Ingestion runs as a background task (FastAPI `BackgroundTasks` for MVP; Celery/RQ later if needed) so upload requests return immediately with `status: "pending"`.

## Scaling notes (later, not MVP)
Job queue + workers for ingestion, Redis for rate limiting, per-tenant usage metering, object storage (S3) instead of local upload volume.
