# 04 — Folder Structure (Single Monorepo)

```
ai-bot-platform/
├── docker-compose.yml          # Dev: runs everything together
├── docker-compose.prod.yml     # Production version (Phase 5)
├── .env.example                # Copy to .env (never commit .env)
├── README.md
├── docs/                       # <- these project docs (AI assistant memory)
│
├── backend/                    # FastAPI service
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── app/
│   │   ├── main.py             # App entry point
│   │   ├── core/
│   │   │   ├── config.py       # Env vars / settings
│   │   │   └── security.py     # JWT, password hashing, get_current_tenant
│   │   ├── api/v1/
│   │   │   ├── auth.py         # signup / login / me
│   │   │   ├── tenants.py      # tenant profile, api-key
│   │   │   ├── documents.py    # upload, list, delete
│   │   │   ├── chat.py         # RAG chat (dashboard, JWT)
│   │   │   └── widget.py       # public chat (public key)
│   │   ├── models/             # SQLAlchemy tables
│   │   │   ├── tenant.py
│   │   │   ├── user.py
│   │   │   ├── document.py
│   │   │   └── chat_log.py
│   │   ├── services/
│   │   │   ├── ingestion.py    # parse PDF/URL, chunk text
│   │   │   ├── embedding.py    # create vectors, upsert to Qdrant
│   │   │   ├── retrieval.py    # search Qdrant (tenant-filtered)
│   │   │   └── llm.py          # build prompt, call GPT-4o
│   │   ├── db/
│   │   │   ├── session.py
│   │   │   └── migrations/     # Alembic
│   │   └── schemas/            # Pydantic request/response models
│   └── tests/
│
├── frontend/                   # Next.js dashboard
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── app/                # routes (see 07)
│       ├── components/
│       ├── lib/                # api.ts client, helpers
│       └── types/
│
└── widget/                     # Embeddable chat bubble
    ├── package.json
    ├── src/widget.ts
    └── dist/widget.js          # single file clients paste via <script>
```

## Notes / small gaps to resolve while building
- The LLD has an `api_keys` table but the folder structure has no `api_key.py` model. **Add `models/api_key.py`** in Phase 1.
- LLD has `document_chunks`, `chat_sessions`, `chat_messages` tables; folder shows `document.py` and `chat_log.py`. Put `DocumentChunk` in `document.py`, and `ChatSession` + `ChatMessage` in `chat_log.py`.
- Dev plan lists `settings/` as a top-level frontend route; the LLD puts it at `/dashboard/settings`. **Follow the LLD.**
