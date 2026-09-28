# 06 — Backend API Spec (FastAPI)

Base path: `/api/v1`

## Request flow for every authenticated call
```
Request → JWT check → get_current_tenant dependency (gives tenant_id)
        → route handler → service function (always passes tenant_id)
        → every DB / Qdrant query scoped by tenant_id
```
Tenant extraction lives in ONE shared dependency so it can't be forgotten:

```python
# app/core/security.py  (shape from the LLD — SECRET_KEY comes from settings)
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer
import jwt

bearer_scheme = HTTPBearer()

def get_current_tenant(token=Depends(bearer_scheme)) -> str:
    try:
        payload = jwt.decode(token.credentials, SECRET_KEY, algorithms=["HS256"])
        return payload["tenant_id"]
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
```
Every protected route declares `tenant_id = Depends(get_current_tenant)`.

## Auth — `api/v1/auth.py` (Phase 1)
| Method | Path | Body | Response | Notes |
|---|---|---|---|---|
| POST | `/auth/signup` | `{company_name, email, password}` | `{tenant_id, user_id, access_token}` | Creates tenant + first user (role=owner) **in one transaction**. Also create an `api_keys` row. |
| POST | `/auth/login` | `{email, password}` | `{access_token, tenant_id}` | Verify hash, issue JWT |
| GET | `/auth/me` | JWT | `{user_id, tenant_id, email, role}` | Used by frontend on load |

JWT payload: `{ "user_id": "...", "tenant_id": "...", "role": "owner", "exp": <unix> }`

## Tenants — `api/v1/tenants.py`
| Method | Path | Purpose |
|---|---|---|
| GET | `/tenants/me` | Tenant profile (name, plan, status) |
| PATCH | `/tenants/me` | Update tenant name/settings |
| GET | `/tenants/me/api-key` | Public key for the embed script |

## Documents — `api/v1/documents.py` (Phase 2)
| Method | Path | Request | Response |
|---|---|---|---|
| POST | `/documents/upload` | multipart PDF, or `{url}`, or `{faq_text}` | `{document_id, status: "pending"}` |
| GET | `/documents` | — | List with status |
| DELETE | `/documents/{id}` | — | Removes document, chunks, and Qdrant vectors |

Ingestion (background task):
1. Save file, create `documents` row `status="pending"`.
2. Set `processing` → extract text → chunk (~300–500 tokens) → insert `document_chunks`.
3. Embed each chunk → upsert to Qdrant with `tenant_id` payload.
4. Set `ready` (or `failed` + logged reason).

## Chat (dashboard test) — `api/v1/chat.py` (Phase 3)
| Method | Path | Request | Response |
|---|---|---|---|
| POST | `/chat` | `{session_id?, message}` | `{session_id, answer, sources: [chunk_id,...]}` |

Flow: embed question → Qdrant top-k (5) filtered by tenant → prompt with ONLY-context rule → GPT-4o → save user + assistant messages.

## Widget (public) — `api/v1/widget.py` (Phase 4)
| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/widget/chat` | `public_key` in header (no JWT) | Same as `/chat`, tenant resolved from `api_keys` |

Widget path needs: active-key check, tenant `status == active` check, CORS handling, and rate limiting (Phase 5).

## Service layer
| File | Responsibility |
|---|---|
| `services/ingestion.py` | Extract text from PDF/URL, split into chunks |
| `services/embedding.py` | Text → vectors, upsert to Qdrant |
| `services/retrieval.py` | Search Qdrant for a query, filtered by tenant |
| `services/llm.py` | Build prompt, call GPT-4o, return answer |

## System prompt principle (services/llm.py)
"Answer using ONLY the following context. If the answer isn't in the context, say you don't know." Never let the model invent policies, prices, or facts.
