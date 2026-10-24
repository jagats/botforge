# 19 — Multi-Bot Architecture (Design)

> **Status:** Design proposal. **No code changes yet** — review before implementing.
> **Date:** 2026-10-24
> **Goal:** Let one tenant run **several bots of different types** (e.g. RAG support, lead-gen, booking, FAQ-only, tool-using) instead of today's fixed one-bot-per-tenant RAG support assistant.

## 1. Why the current structure blocks new bot types

Today **tenant == bot**. The RAG support behaviour is hard-wired into the core:

| Blocker | Where | Problem |
| :--- | :--- | :--- |
| No bot entity | `documents`, `chat_sessions`, `api_keys` all FK straight to `tenants` | A tenant can't have two bots with separate knowledge or keys |
| Behaviour is constant | `llm.py` `SYSTEM_PROMPT`; top-k=5, history=6, model, temperature all literals | Can't vary per bot |
| Fixed pipeline | `chat_service.process_chat_message` always does retrieve -> generate | No room for lead capture, tool calls, or no-retrieval bots |
| Vector size fixed | `qdrant.py` `EMBEDDING_VECTOR_SIZE = 1536` tied to one model | New embedding model = new collection |
| Widget == bot | `widget.ts` + `/widget/*` assume the one chat flow | WhatsApp/Slack/voice would copy the logic |
| No metering/limits | nothing tracks usage per bot/tenant | pricing tiers (doc 01) can't be enforced |

## 2. Target model: Bot as a first-class entity

```
tenants ──< bots ──< documents ──< document_chunks
                 ├──< chat_sessions ──< chat_messages
                 └──< api_keys
```

One tenant -> many bots. Everything that is currently tenant-scoped becomes **(tenant_id, bot_id)**-scoped. `tenant_id` stays on every row (keeps the golden multi-tenancy rule intact and makes RLS simple); `bot_id` is the new finer scope.

### New table: `bots`
```sql
CREATE TABLE bots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,                       -- "Acme Support", "Acme Sales"
  bot_type TEXT NOT NULL DEFAULT 'rag_support',  -- registry key (see §4)
  status TEXT NOT NULL DEFAULT 'active',    -- active | disabled
  config JSONB NOT NULL DEFAULT '{}',       -- per-type settings (see §3)
  allowed_domains TEXT[] NOT NULL DEFAULT '{}',  -- widget origin whitelist (folds in SEC-02)
  embedding_model TEXT NOT NULL DEFAULT 'text-embedding-3-small',
  vector_size INT NOT NULL DEFAULT 1536,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_bots_tenant ON bots(tenant_id);
```

### Add `bot_id` to existing tables
`documents`, `chat_sessions`, `api_keys`, and `document_chunks` each get `bot_id UUID NOT NULL REFERENCES bots(id) ON DELETE CASCADE` (plus an index). `chat_messages` inherits scope through its session but also carries `bot_id` for direct analytics.

### Qdrant payload
Add `bot_id` to every point payload and a **payload index on `bot_id`**. Every search filter becomes `must: [tenant_id, bot_id]`. Keep one shared collection **per vector size** (default `document_chunks_1536`); a bot with a different `vector_size` uses a different collection, resolved from `bot.embedding_model`/`vector_size`.

## 3. Per-type config (the `config` JSONB)

Instead of literals in `llm.py`, each bot carries its own knobs. Example for `rag_support`:
```json
{
  "system_prompt": "You are Acme's support assistant...",
  "top_k": 5,
  "min_score": 0.25,
  "history_turns": 6,
  "chat_model": "gpt-4o",
  "temperature": 0.2,
  "welcome_message": "Hi! How can I help with Acme?",
  "fallback_message": "I don't have that in my knowledge base."
}
```
A `lead_gen` bot's config might instead hold `fields_to_collect`, `qualifying_questions`, and a `handoff_webhook`. Config is validated per type by a Pydantic schema keyed to `bot_type` (unknown keys rejected).

## 4. BotType registry (strategy pattern)

Replace the single hard-coded flow with pluggable handlers sharing one small interface:

```python
# services/bots/base.py
class BotHandler(Protocol):
    type_key: str
    ConfigSchema: type[BaseModel]
    async def handle(self, ctx: BotContext) -> BotReply: ...
```
- `BotContext` = tenant_id, bot, config, session, user message, history, db.
- `BotReply` = answer text, sources, optional events (lead captured, tool call, handoff).

```python
# services/bots/registry.py
REGISTRY: dict[str, BotHandler] = {}
def register(handler): REGISTRY[handler.type_key] = handler
def get_handler(bot_type: str) -> BotHandler: ...  # 400 if unknown
```

`chat_service` becomes a thin dispatcher: resolve bot -> `get_handler(bot.bot_type).handle(ctx)` -> persist messages/events. The existing RAG logic moves into `RagSupportHandler` (`type_key = "rag_support"`) as the first registered handler — behaviour-identical to today, just parameterised by `config`.

**Adding a new bot type = add one file + register it.** No migration, no touching the core.

### First-wave handlers to design toward
| `bot_type` | Pipeline | New config |
| :--- | :--- | :--- |
| `rag_support` | retrieve -> generate (today) | prompt, top_k, model... |
| `faq_only` | retrieve -> return best chunk (no LLM) | min_score |
| `lead_gen` | collect fields -> validate -> webhook | fields, webhook |
| `tool_using` | LLM + function calling | allowed tools, schemas |

## 5. Channel adapters (decouple transport from bot)

The bot logic shouldn't know whether it's a website widget, WhatsApp, or Slack. Introduce an adapter layer:

```
channel adapter (widget / whatsapp / slack / api)
      -> normalises to BotContext
      -> chat_service.dispatch(bot, ctx)
      -> BotReply -> adapter formats for its channel
```
Today's `/widget/chat` becomes the first adapter. Each `api_key` can name its channel. This keeps the one chat core and makes "same bot on WhatsApp" an adapter, not a rewrite.

## 6. Provider interfaces

- **Embeddings/LLM:** small interfaces (`EmbeddingProvider`, `ChatProvider`) with an OpenAI implementation today; model name comes from bot config / `bot.embedding_model`. Lets a bot use a different model without code changes.
- **Vector store:** keep Qdrant behind a thin `VectorStore` interface so collection selection (by vector size) lives in one place.

## 7. Usage metering (enables pricing tiers)

```sql
CREATE TABLE usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  bot_id UUID REFERENCES bots(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,        -- 'message' | 'embedding' | 'document'
  quantity INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_usage_tenant_time ON usage_events(tenant_id, created_at);
```
Plan limits (doc 01) are enforced by summing events per period. This also feeds H-04 quotas in doc 18.

## 8. API surface changes

- `POST /api/v1/bots`, `GET /api/v1/bots`, `GET/PATCH/DELETE /api/v1/bots/{bot_id}` (tenant-scoped; `config` validated per type).
- Document/chat routes gain a `bot_id` (path segment, e.g. `/bots/{bot_id}/documents`, or a required field).
- Widget: `GET /widget/config` and `POST /widget/chat` already resolve a bot via the api key -> now the key maps to a specific `bot_id`, so no visible change for embedders.
- Admin `BrandResponse` grows a `bots` summary (count per type).

## 9. Migration path (backward-compatible)

1. Create `bots`, `usage_events`; add nullable `bot_id` columns + indexes.
2. **Backfill:** one `rag_support` bot per existing tenant; copy `allowed_domains` default; set every existing document/session/api_key `bot_id` to that bot.
3. Backfill Qdrant payloads with `bot_id` (re-embed from Postgres, the system of record — see doc 02) and add the payload index.
4. Make `bot_id` `NOT NULL`.
5. Ship the registry with only `rag_support` registered (behaviour identical to today).
6. Add new bot types incrementally — each is additive.

> **Do this before the second bot type ships.** Retrofitting `bot_id` after real data exists means migrating every table **and** every vector.

## 10. What this does NOT change
- The 5 golden rules (doc README) all hold — `tenant_id` stays on every row and every filter; `bot_id` is an additional scope, not a replacement.
- RAG grounding ("answer only from retrieved content") is preserved; it's just one handler.
- Qdrant stays one shared collection (per vector size), not per-tenant/per-bot.

## 11. Open questions
1. Keys per bot vs per channel — one `api_key` row per (bot, channel)?
2. Do `faq_only`/`tool_using` bots share the same Qdrant collection or opt out of retrieval entirely?
3. Config editing UI — raw JSON vs per-type forms in the dashboard.
4. Should `allowed_domains` live on `bots` (per bot) or stay on `tenants` (per brand)? (Proposal: on `bots`.)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
