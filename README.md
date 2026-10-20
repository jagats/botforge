# BotForge — Multi-Tenant AI Bot-as-a-Service Platform

BotForge is a multi-tenant AI chatbot platform built with **FastAPI**, **PostgreSQL**, **Qdrant**, and **Next.js 16**. It enables businesses and agencies to ingest knowledge sources (PDF documents, website pages, and FAQs) and instantly deploy a customized, grounded AI assistant to their websites with a single `<script>` embed tag.

---

## Architecture & Tech Stack

- **Frontend Dashboard**: Next.js 16 (App Router, Turbopack, React 19, Tailwind CSS v4, Phosphor Icons via `react-icons/pi`).
- **Backend API**: Python 3.12 + FastAPI, SQLAlchemy 2.0, Alembic migrations, Pydantic v2.
- **Vector Database**: Qdrant (storing vector embeddings with strict `tenant_id` payload filtering).
- **Relational Database**: PostgreSQL 16 (storing tenants, users, API keys, documents, chunks, and chat history).
- **RAG & LLM Engine**: OpenAI (`text-embedding-3-small` for vector embeddings, `gpt-4o` for grounded answer synthesis).
- **Embeddable Widget**: Lightweight, zero-dependency standalone JavaScript bundle (`widget.js`).

---

## Prerequisites for a New System

Before setting up BotForge on a fresh machine, ensure you have installed:

1. **Git**: [git-scm.com](https://git-scm.com/)
2. **Docker Desktop** (or Docker Engine + Docker Compose v2): [docker.com](https://www.docker.com/)
   - *Ensure Docker daemon is running before proceeding.*
3. **OpenAI API Key**: Obtain from [platform.openai.com](https://platform.openai.com/) (required for vector embeddings and chat responses).
4. *(Optional for local host development without Docker)*:
   - **Node.js**: v20 or higher (`node -v`)
   - **Python**: 3.12 or higher (`python --version`)

---

## Quickstart: Docker Setup (Recommended)

Docker Compose provisions and orchestrates all 4 services (**Postgres**, **Qdrant**, **FastAPI Backend**, and **Next.js Frontend**) on a shared internal network with live-reloading.

### 1. Clone the Repository
```bash
git clone <repository-url> botforge
cd botforge
```

### 2. Configure Environment Variables
Copy the example environment file:

**macOS / Linux:**
```bash
cp .env.example .env
```

**Windows (PowerShell):**
```powershell
Copy-Item .env.example .env
```

Open `.env` in your text editor and update the critical configuration keys:
```env
# 1. Provide your OpenAI API key
OPENAI_API_KEY=sk-your-actual-openai-api-key

# 2. Generate a secure secret for signing JWT tokens (e.g., openssl rand -hex 32)
SECRET_KEY=replace_with_a_long_random_secret_string

# 3. Define the initial master superadmin credentials
SUPERADMIN_EMAIL=your registerd email id
SUPERADMIN_PASSWORD=valid password

# Database and ports (defaults work out-of-the-box for local development)
POSTGRES_USER=aibot_user
POSTGRES_PASSWORD=change_me_locally
POSTGRES_DB=aibot_platform
```

### 3. Build and Start the Docker Stack
Run the following from the project root:
```bash
docker compose up -d --build
```

Verify that all containers are healthy and running:
```bash
docker compose ps
```
You should see:
- `aibot_postgres` (Port 5432)
- `aibot_qdrant` (Ports 6333, 6334)
- `aibot_backend` (Port 8000)
- `aibot_frontend` (Port 3000)

### 4. Run Database Migrations
Initialize the PostgreSQL tables by running the Alembic migrations inside the backend container:
```bash
docker compose exec backend alembic upgrade head
```

> **Note on Initial Seeding:**
> Upon startup, the backend lifespan service automatically initializes the Qdrant `document_chunks` collection and payload indexes, and provisions the master superadmin user specified in `.env`.

---

## Access Points & Credentials

| Service | URL | Notes |
|---|---|---|
| **Web Dashboard** | [http://localhost:3000](http://localhost:3000) | Next.js Client & Admin Portal |
| **Login Page** | [http://localhost:3000/login](http://localhost:3000/login) | Sign in with superadmin credentials |
| **Backend API Docs (Swagger)** | [http://localhost:8000/docs](http://localhost:8000/docs) | Interactive OpenAPI documentation |
| **Backend Health Check** | [http://localhost:8000/health](http://localhost:8000/health) | Returns `{"status": "ok"}` |
| **Qdrant Vector Dashboard** | [http://localhost:6333/dashboard](http://localhost:6333/dashboard) | Web UI for vector collections & points |
| **Embeddable Widget Script** | [http://localhost:8000/widget.js](http://localhost:8000/widget.js) | Standalone client embed bundle |

### Default Superadmin Credentials
- **Email:** `admin@botforge.com` (or the value set in `SUPERADMIN_EMAIL`)
- **Password:** `Admin@BotForge2026!` (or the value set in `SUPERADMIN_PASSWORD`)

---

## Alternative: Local Development (Without Docker)

If you prefer to run services directly on your host machine:

### 1. External Services (Postgres & Qdrant)
You can still use Docker just for the databases:
```bash
docker compose up -d postgres qdrant
```

### 2. Backend Setup
```bash
cd backend

# Create and activate a Python virtual environment
python -m venv .venv

# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
alembic upgrade head

# Start FastAPI dev server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Frontend Setup
```bash
cd frontend

# Install npm dependencies
npm install

# Start Next.js development server
npm run dev
```

### 4. Build Embeddable Chat Widget
```bash
cd widget
npm install
npm run build
```
The compiled widget will be output to `backend/app/static/widget.js`.

---

## Useful Development Commands

### Backend Tests
Run the automated pytest test suite (covers auth, tenancy, document ingestion, RAG chat, and rate limits):
```bash
# Inside Docker:
docker compose exec backend pytest -v

# Locally on host:
cd backend && pytest -v
```

### Frontend Typechecking & Production Build
```bash
cd frontend
npm run build
```

### Installing New NPM Packages with Docker
Because `docker-compose.yml` mounts an anonymous volume at `/app/node_modules` to isolate container dependencies:
```bash
# When adding a new package to frontend while running in Docker:
docker compose exec frontend npm install <package-name>
docker compose restart frontend
```

### Resetting Local Database & Vector Store
If you want to completely wipe the local development databases and start fresh:
```bash
# WARNING: Deletes all local database rows, uploaded files, and vector indices
docker compose down -v
docker compose up -d --build
docker compose exec backend alembic upgrade head
```

---

## Project Structure

```
botforge/
├── .env.example             # Template environment variables
├── docker-compose.yml       # Docker Compose definition (Postgres, Qdrant, Backend, Frontend)
├── backend/
│   ├── app/
│   │   ├── api/             # FastAPI routers (v1 endpoints: auth, brands, documents, chat, widget)
│   │   ├── core/            # Config, security, database session, Qdrant setup
│   │   ├── db/              # Alembic migrations & initial seeders
│   │   ├── models/          # SQLAlchemy ORM models (Tenant, User, Document, ChatSession, etc.)
│   │   ├── schemas/         # Pydantic validation schemas
│   │   └── services/        # Business logic (ingestion, embeddings, vector retrieval, LLM)
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── app/             # Next.js App Router pages (marketing, auth, dashboard, admin)
│   │   ├── components/      # UI components (buttons, modals, tables, chat playground, etc.)
│   │   ├── hooks/           # React Query hooks (useAuth, useDocuments, useChat, useBrands)
│   │   └── lib/             # API client, fonts, utilities
│   ├── Dockerfile
│   └── package.json
├── widget/                  # Zero-dependency embeddable chat widget source
└── docs/                    # Architectural specs and engineering documentation
```

---

## Core Tenancy Rules for Developers

1. **Mandatory Tenant Isolation:** Every database table contains a `tenant_id` column, and every query **must** filter by `tenant_id`.
2. **Vector Space Partitioning:** Every Qdrant vector retrieval payload filter **must** include a strict match on `tenant_id`.
3. **Trusted Tenant Context:** The `tenant_id` is always derived securely from the authenticated JWT session or the validated public API key — never from client request bodies.
4. **Grounded RAG Responses:** The LLM bot is strictly instructed to answer questions using only the retrieved context chunks, responding with polite fallback messages when information is absent.

---

## Detailed Documentation Index

For in-depth architectural and implementation specifications, see the documentation in [`docs/`](./docs):

- [`01-project-overview.md`](./docs/01-project-overview.md) — Problem statement, goals, and business model.
- [`02-architecture.md`](./docs/02-architecture.md) — RAG pipeline, system components, and request flows.
- [`03-tech-stack.md`](./docs/03-tech-stack.md) — Technology stack selections and justifications.
- [`04-folder-structure.md`](./docs/04-folder-structure.md) — Monorepo layout and organization.
- [`05-database-schema.md`](./docs/05-database-schema.md) — PostgreSQL DDL and Qdrant collection design.
- [`06-backend-api-spec.md`](./docs/06-backend-api-spec.md) — FastAPI route schemas and contracts.
- [`07-frontend-and-widget-spec.md`](./docs/07-frontend-and-widget-spec.md) — Dashboard UI, themes, and widget specifications.
- [`08-docker-and-env.md`](./docs/08-docker-and-env.md) — Service port mappings and environment variables.
- [`09-development-plan.md`](./docs/09-development-plan.md) — Implementation roadmap and completed phases.
- [`10-coding-rules.md`](./docs/10-coding-rules.md) — Coding conventions and multi-tenancy safeguards.
- [`11-decisions-and-open-questions.md`](./docs/11-decisions-and-open-questions.md) — Architectural decisions and trade-offs.
