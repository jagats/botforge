# 10 — Coding Rules for the AI Assistant

## Working style
1. Work on one phase and one small task at a time. Check `09-development-plan.md` for current status.
2. Before large changes, state the plan in a few lines. Prefer small, targeted edits over rewrites.
3. If something in the docs is unclear or contradicts the code, ask instead of guessing.
4. Explain new concepts briefly in simple English (FastAPI dependencies, Qdrant filters, Alembic) — the developer is strong in the JS/TS side and newer to the Python/vector side.
5. After finishing a task, say what changed and suggest the next step. Update the checklist in `09-development-plan.md`.

## Security and multi-tenancy (non-negotiable)
- Every DB query and every Qdrant query is scoped by `tenant_id`.
- `tenant_id` comes only from the JWT or the public-key lookup — never from request body, query, or path.
- Never log secrets, passwords, tokens, or full API keys.
- Hash passwords; never store or return them.
- Public widget endpoints must check: key exists, key `is_active`, tenant `status == 'active'`.
- Add a test for cross-tenant access whenever a new tenant-scoped route is added.
- Never commit `.env`.

## Backend (Python / FastAPI)
- Layers: **route → service → DB/Qdrant**. Routes stay thin; logic lives in `services/`.
- Use Pydantic schemas for all request and response bodies (`schemas/`).
- Use type hints everywhere. Follow PEP 8. Keep functions small.
- Config only via `core/config.py` (pydantic-settings). No `os.getenv` scattered around.
- DB changes only through Alembic migrations, never manual SQL in the running DB.
- Return proper HTTP errors (`401`, `403`, `404`, `409`, `422`) with clear `detail` messages.
- Long work (ingestion/embedding) runs as a background task, not inside the request.
- Add tests in `backend/tests/` (pytest + httpx) for auth and tenant isolation first.

## Frontend (Next.js / TypeScript)
- TypeScript strict; avoid `any`.
- All API calls through `src/lib/api.ts`. No direct `fetch()` in pages/components.
- Server state with TanStack Query, auth with `AuthProvider`. No Redux.
- Keep components small; shared types in `src/types/`.

## Widget
- Vanilla TypeScript only. No frameworks or runtime dependencies.
- Keep the bundle tiny. Isolate styles so they don't clash with the client's site.

## Docker
- Everything must run through `docker compose up --build`.
- Don't hardcode host names or ports; use env vars.
- Backend/frontend reach services by Docker service name; the browser uses `localhost`.

## Git
- Conventional commit messages (e.g. `feat(auth): add signup endpoint`).
- Small commits per task. One branch per phase or feature.

## Do NOT
- Do not use pgvector, Node.js backend code, or Redux (see `11-decisions-and-open-questions.md`).
- Do not add new major libraries or services without asking.
- Do not build features from later phases early.
- Do not invent API routes or table columns that aren't in the docs; propose the change first.
