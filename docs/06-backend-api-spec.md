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

## Auth — `api/v1/auth.py`
*Public self-signup has been completely removed. User and client brand onboarding is agency-managed via the Product Admin API.*

| Method | Path | Body | Response | Notes |
|---|---|---|---|---|
| POST | `/auth/login` | `{email, password}` | `{access_token, tenant_id, role, token_type}` | Verifies hash, checks `user.is_active` AND `tenant.status == 'active'`. Issues JWT bearer token. |
| GET | `/auth/me` | Bearer JWT | `{user_id, tenant_id, email, role, is_active, company_name}` | Returns profile information for current session; used by frontend for role-based routing. |

> **Public Signup Removed:** The public `/auth/signup` route is completely removed (`404 Not Found`). All new client brands and workspaces must be onboarded through the Product Admin API.

JWT payload: `{ "user_id": "...", "tenant_id": "...", "role": "superadmin" | "owner" | "member", "exp": <unix> }`

## Admin & Brand Provisioning — `api/v1/admin.py` (`/api/v1/admin/brands`)
*Restricted to Product Admin (`role=superadmin`) via `require_superadmin` dependency.*

| Method | Path | Body | Response | Notes |
|---|---|---|---|---|
| POST | `/admin/brands` | `{company_name, email, password, plan?}` | `BrandResponse` | Atomically provisions a client brand (creates tenant + owner user + widget API key). |
| GET | `/admin/brands` | Query: `skip=0`, `limit=100` | `{brands: BrandResponse[], total: int}` | Lists all client brands with owner details, doc counts, chat sessions, and active status. |
| GET | `/admin/brands/{tenant_id}` | — | `BrandResponse` | Retrieves single brand metadata, knowledge stats, and widget public API key. |
| PATCH | `/admin/brands/{tenant_id}/status` | `{status: "active" \| "suspended"}` | `BrandResponse` | Activates or suspends client brand; instantly locks/unlocks owner logins and blocks widget chat. |
| DELETE | `/admin/brands/{tenant_id}` | — | `204 No Content` | Offboards brand; cascades and purges DB records and Qdrant vector points. |

### `BrandResponse` Schema
```json
{
  "tenant_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "name": "Apex Logistics",
  "slug": "apex-logistics",
  "plan": "starter",
  "status": "active",
  "owner_email": "admin@apexlogistics.com",
  "owner_user_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "is_active": true,
  "document_count": 5,
  "chat_session_count": 42,
  "public_api_key": "bf_pub_3f1a...",
  "created_at": "2026-10-14T22:00:00Z"
}
```

## Tenants — `api/v1/tenants.py`
*Client Brand self-management.*
| Method | Path | Purpose |
|---|---|---|
| GET | `/tenants/me` | Brand profile (name, plan, status) |
| PATCH | `/tenants/me` | Update brand company name |
| GET | `/tenants/me/api-key` | Public key for embed script integration |

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
