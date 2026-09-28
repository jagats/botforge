# 08 — Docker and Environment

## Root files (already created)
- `docker-compose.yml` — dev setup
- `.env.example` — copy to `.env`, fill real values, never commit `.env`
- Still to create: `backend/Dockerfile`, `frontend/Dockerfile`, `docker-compose.prod.yml`

## Services in `docker-compose.yml`
| Service | Image / build | Host port (default) | Purpose |
|---|---|---|---|
| `postgres` | `postgres:16-alpine` | 5432 | Relational data. Has healthcheck (`pg_isready`). |
| `qdrant` | `qdrant/qdrant:latest` | 6333 (REST), 6334 (gRPC) | Vector search |
| `backend` | `./backend/Dockerfile` | 8000 | FastAPI, runs `uvicorn app.main:app --reload`, waits for healthy Postgres |
| `frontend` | `./frontend/Dockerfile` | 3000 | Next.js, runs `npm run dev` |

- Network: `aibot_network`. Volumes: `postgres_data`, `qdrant_data`, `backend_uploads`.
- Inside Docker, services reach each other by service name (`postgres`, `qdrant`, `backend`).
- The browser cannot use Docker service names, so `NEXT_PUBLIC_API_URL` must be `http://localhost:8000` in dev.
- Backend source and frontend source are bind-mounted for live reload.

## Environment variables (`.env.example`)
| Group | Variables |
|---|---|
| Postgres | `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `POSTGRES_PORT`, `DATABASE_URL` |
| Qdrant | `QDRANT_URL`, `QDRANT_HTTP_PORT`, `QDRANT_GRPC_PORT`, `QDRANT_COLLECTION_NAME` |
| Backend | `BACKEND_PORT`, `SECRET_KEY`, `JWT_ALGORITHM`, `JWT_EXPIRE_MINUTES`, `ENVIRONMENT` |
| LLM | `OPENAI_API_KEY`, `EMBEDDING_MODEL`, `CHAT_MODEL` |
| Frontend | `FRONTEND_PORT`, `NEXT_PUBLIC_API_URL` |
| Uploads | `MAX_UPLOAD_SIZE_MB`, `UPLOAD_DIR` |

`backend/app/core/config.py` should load all of these with `pydantic-settings`.

## Known things to watch
- If you change `POSTGRES_PASSWORD` after the first run, the existing `postgres_data` volume keeps the old one. Reset with `docker compose down -v` (this deletes local data).
- `.env` `DATABASE_URL` is overridden in compose using the Postgres vars — keep them consistent.
- Pin the Qdrant image version before production.
