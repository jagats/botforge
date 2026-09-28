# 03 — Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Backend API | Python + **FastAPI** | Fast to build, great for AI/RAG, async support |
| Relational DB | **PostgreSQL** | Tenants, users, chat logs, document metadata |
| Vector DB | **Qdrant** | Semantic ("meaning") search over embeddings |
| LLM | **GPT-4o** (OpenAI) | Generates chat answers from retrieved content |
| Embeddings | OpenAI `text-embedding-3-small` (default in `.env.example`) | Must be the same model for ingestion and query |
| Dashboard | **Next.js + TypeScript** | Client-facing: upload docs, test bot, embed code |
| Widget | **Vanilla TypeScript** → one JS file | Tiny, dependency-free, works on any site |
| ORM / migrations | SQLAlchemy + Alembic | Per folder structure (`models/`, `db/migrations/`) |
| Validation | Pydantic | Request/response schemas |
| Server state (frontend) | TanStack Query | Loading/error/polling handled for us |
| Auth state (frontend) | React Context (`AuthProvider`) | Filled from `/auth/me` on load. No Redux. |
| Containers | Docker + Docker Compose | Same setup on every machine |
| Repo | Single monorepo | Backend + frontend + widget in one place |

## Version/driver notes
- `docker-compose.yml` builds `DATABASE_URL` as `postgresql+psycopg://...` → the backend needs **psycopg 3** (`psycopg[binary]`) in `requirements.txt`, not psycopg2.
- Postgres image: `postgres:16-alpine`. Qdrant image: `qdrant/qdrant:latest` (pin a version before production).
- Pin all Python and npm dependency versions once Phase 1 works.

## Suggested Python packages (Phase 1 starting point — confirm versions when installing)
`fastapi`, `uvicorn[standard]`, `sqlalchemy`, `alembic`, `psycopg[binary]`, `pydantic`, `pydantic-settings`, `pyjwt`, `passlib[bcrypt]` (or `bcrypt`), `python-multipart` (file uploads), `email-validator`.
Added later: `qdrant-client`, `openai`, a PDF parser (e.g. `pypdf`), an HTML text extractor for URLs, `pytest`, `httpx`.

## Why not the original proposal's stack?
The first proposal mentioned Node.js/Next.js, PostgreSQL + pgvector, and Claude/GPT. The team chose Python/FastAPI + Qdrant + GPT-4o instead. See `11-decisions-and-open-questions.md`. **Do not use pgvector or Node backend code.**
