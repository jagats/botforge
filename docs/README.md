# Project Docs — AI Bot-as-a-Service Platform

> **For the AI coding assistant (Antigravity):** Read this file first, then the files below in order.
> These docs are the single source of truth for the project. If code and docs disagree, tell the developer and ask before changing either.

## What this project is (one paragraph)
A multi-tenant platform where a client (a DVIO website customer) signs up, uploads their FAQs / PDFs / web pages, and gets an AI chatbot for their website. The bot answers using ONLY the client's own content (RAG). The client adds the bot with one `<script>` tag. DVIO earns a monthly subscription per client.

## Reading order
| # | File | What it covers |
|---|------|----------------|
| 01 | `01-project-overview.md` | Problem, idea, business value, goals, non-goals |
| 02 | `02-architecture.md` | RAG pipeline, system components, request flows |
| 03 | `03-tech-stack.md` | Chosen technologies and why |
| 04 | `04-folder-structure.md` | Monorepo layout (what lives where) |
| 05 | `05-database-schema.md` | Postgres tables, Qdrant design, multi-tenancy rules |
| 06 | `06-backend-api-spec.md` | FastAPI modules, routes, service layer |
| 07 | `07-frontend-and-widget-spec.md` | Next.js dashboard + embeddable widget |
| 08 | `08-docker-and-env.md` | Docker Compose services and environment variables |
| 09 | `09-development-plan.md` | Phases, timeline, **current status**, next tasks |
| 10 | `10-coding-rules.md` | Conventions and rules the assistant must follow |
| 11 | `11-decisions-and-open-questions.md` | Decisions made, things that changed, open items |

## The 5 rules that matter most
1. **Every table has `tenant_id`, and every query filters by it.** Missing this leaks one client's data to another.
2. **Every Qdrant search filters by `tenant_id`.**
3. **`tenant_id` comes from the JWT (dashboard) or the public API key (widget) — never from the request body.**
4. **The bot answers only from retrieved content.** If the answer isn't there, it says it doesn't know.
5. **Work one phase at a time** (see `09-development-plan.md`). Don't build Phase 3 code while doing Phase 1.

## Developer profile (how to help)
- Developer: Jagat Pal Singh, full-stack developer (React, Next.js, Node.js, TypeScript, PostgreSQL, Docker, AWS). Building this solo. New to FastAPI/Qdrant — explain briefly *why* when introducing them.
- Prefers concise, actionable answers, small targeted changes over full rewrites, and simple English.
- Give complete, working code with short comments. Point out pitfalls.
