# 05 — Database Schema (Postgres + Qdrant)

## Golden rule
Every table has `tenant_id`. Every query filters by `tenant_id`. RLS is a safety net, not a replacement.

## Entity relationships
```
tenants ──< users
tenants ──< api_keys
tenants ──< documents ──< document_chunks
tenants ──< chat_sessions ──< chat_messages
```
One tenant = one client company.

## DDL (source of truth — implement via SQLAlchemy models + Alembic)
```sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,                 -- e.g. "acme-clinic"
  plan TEXT NOT NULL DEFAULT 'trial',        -- trial | starter | pro
  status TEXT NOT NULL DEFAULT 'active',     -- active | suspended | cancelled
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  hashed_password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'owner',        -- owner | member
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, email)
);

CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  public_key TEXT UNIQUE NOT NULL,           -- safe to expose in widget script
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL,                 -- pdf | url | faq_text
  title TEXT NOT NULL,
  original_url TEXT,                         -- if url
  file_path TEXT,                            -- if pdf
  status TEXT NOT NULL DEFAULT 'pending',    -- pending | processing | ready | failed
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  qdrant_point_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  visitor_id TEXT,                           -- anonymous ID from widget
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ
);

CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL,                        -- user | assistant
  content TEXT NOT NULL,
  retrieved_chunk_ids UUID[],                -- audit/debug
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_documents_tenant ON documents(tenant_id);
CREATE INDEX idx_chunks_tenant_doc ON document_chunks(tenant_id, document_id);
CREATE INDEX idx_sessions_tenant ON chat_sessions(tenant_id);
CREATE INDEX idx_messages_session ON chat_messages(session_id);
```

## Qdrant design
- ONE collection shared by all tenants, name from env `QDRANT_COLLECTION_NAME` (default `document_chunks`).
- Vector size must match the embedding model (e.g. 1536 for `text-embedding-3-small` — verify when creating the collection).
- Payload on every point:
```json
{ "tenant_id": "<uuid>", "document_id": "<uuid>", "chunk_id": "<uuid, = document_chunks.id>", "text": "<chunk text, optional>" }
```
- **Every search must include a `tenant_id` filter.** Consider a payload index on `tenant_id`.
- Deleting a document must delete its Postgres rows AND its Qdrant points.

## Notes
- Email is unique per tenant (`UNIQUE (tenant_id, email)`). Login by email only means the same email could exist in two tenants — see open question in `11-decisions-and-open-questions.md`.
- Never store plain passwords. Hash them.
