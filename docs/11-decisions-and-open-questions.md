# 11 — Decisions and Open Questions

## Decisions made
| Decision | Choice | Notes |
|---|---|---|
| Backend | Python + FastAPI | Replaced the Node.js backend idea from the first proposal |
| Vector DB | Qdrant | Replaced pgvector from the first proposal |
| LLM | GPT-4o | First proposal said "Claude/GPT"; GPT-4o chosen |
| Dashboard | Next.js + TypeScript | |
| Widget | Vanilla TypeScript, one JS file | |
| Relational DB | PostgreSQL | System of record |
| Tenancy | Row-level (`tenant_id` on every table) + RLS safety net | |
| Qdrant layout | One shared collection, `tenant_id` payload filter | Per-tenant collections rejected for MVP |
| Ingestion jobs | FastAPI BackgroundTasks first; Celery/RQ later if needed | |
| Frontend state | TanStack Query + React Context | No Redux |
| Repo | Single monorepo, fully dockerized | |
| First phase to build | Multi-tenant DB + auth (Phase 1) | Out of: DB/auth, ingestion, RAG chat, widget |

## The original proposal is partly outdated
`AI_Bot_as_a_Service_Platform_Proposal.docx` mentions Node.js, pgvector, and Claude. The business goals and RAG concept still hold; the tech choices above **override** it.

## Open questions (decide when the phase arrives)
1. **Login uniqueness:** `users` is unique on `(tenant_id, email)`, but `/auth/login` only receives `email + password`. If the same email can exist in two tenants, login is ambiguous. Options: make email globally unique, or ask for a tenant slug at login. Decide in Phase 1.
2. **RLS setup:** how to set the tenant on each DB session (e.g. `SET LOCAL app.tenant_id`) so RLS policies work. Decide in Phase 1.
3. **Token storage in the frontend:** localStorage vs httpOnly cookie. Decide in Phase 1.
4. **Embedding model:** `.env.example` defaults to `text-embedding-3-small`; confirm before creating the Qdrant collection (vector size must match).
5. **URL ingestion:** how to fetch and clean web pages; whether to crawl multiple pages or one URL only.
6. **Widget CORS:** allow any origin, or let each tenant list allowed domains. Decide in Phase 4.
7. **Widget hosting:** where `widget.js` is served from (backend static route, CDN, or S3).
8. **Streaming answers:** stream tokens or return the full answer at first.
9. **Pricing tiers and usage limits:** by messages or documents; needs client validation.
10. **File storage:** local Docker volume for MVP vs S3 for production.
11. **Hosting/deployment target** for the pilot (AWS is in the developer's existing stack).

## Change log
- Docs folder created for AI assistant project memory. Phase 0 started: root `docker-compose.yml` and `.env.example` done.
