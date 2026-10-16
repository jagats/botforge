# 04 — API Integration Map

> Complete mapping of every frontend page/component to its backend API endpoint,
> including the TanStack Query hook, HTTP method, and rendering context.

---

## Backend API Summary

All endpoints live under `/api/v1/`:

| Module | Prefix | Auth | Endpoints |
|---|---|---|---|
| [auth.py](file:///e:/botforge/backend/app/api/v1/auth.py) | `/auth` | JWT (login), Public (login endpoint) | `POST /login`, `GET /me` |
| [documents.py](file:///e:/botforge/backend/app/api/v1/documents.py) | `/documents` | JWT (Bearer) | `POST /upload`, `POST /url`, `POST /faq`, `GET /`, `GET /:id`, `DELETE /:id` |
| [chat.py](file:///e:/botforge/backend/app/api/v1/chat.py) | `/chat` | JWT (Bearer) | `POST /`, `GET /sessions/:id` |
| [tenants.py](file:///e:/botforge/backend/app/api/v1/tenants.py) | `/tenants` | JWT (Bearer) | `GET /me`, `PATCH /me`, `GET /me/api-key` |
| [widget.py](file:///e:/botforge/backend/app/api/v1/widget.py) | `/widget` | Public API Key | `POST /chat`, `GET /config` |
| [admin.py](file:///e:/botforge/backend/app/api/v1/admin.py) | `/admin/brands` | JWT (superadmin) | `POST /`, `GET /`, `GET /:id`, `PATCH /:id/status`, `DELETE /:id` |

---

## Auth Flow — Login & Session

```
┌──────────────────┐     POST /api/v1/auth/login     ┌──────────────────┐
│   Login Form     │ ──────────────────────────────► │  Backend Auth    │
│   (CSR)          │ ◄────── { access_token, role } │                  │
│                  │                                  │                  │
│   Stores token   │     GET /api/v1/auth/me         │                  │
│   in localStorage│ ──────────────────────────────► │  Returns User    │
│                  │ ◄────── { user_id, tenant_id,  │  profile         │
│   Redirects to   │         email, role,            │                  │
│   /dashboard or  │         company_name }          │                  │
│   /admin/brands  │                                  │                  │
└──────────────────┘                                  └──────────────────┘
```

| Frontend Location | Hook / Function | API Call | Endpoint | Method |
|---|---|---|---|---|
| `components/auth/LoginForm.tsx` | `useAuth().login()` | `authApi.login(data)` | `POST /api/v1/auth/login` | CSR |
| `contexts/AuthContext.tsx` (on mount) | `fetchCurrentUser()` | `authApi.getMe()` | `GET /api/v1/auth/me` | CSR |
| `middleware.ts` | Token validation | Cookie/header check | — | Edge |

---

## Dashboard: Documents — CRUD & Upload

```
┌─────────────────────────────┐        Backend: /api/v1/documents
│  Documents Page             │
│  /dashboard/documents       │──── GET /              → documentApi.list()
│                             │──── POST /upload       → documentApi.uploadPdf(file)
│  ┌────────────────────────┐ │──── POST /url          → documentApi.uploadUrl(data)
│  │ UploadModal (tabs)     │ │──── POST /faq          → documentApi.uploadFaq(data)
│  │  ├─ UploadPdfForm      │ │──── DELETE /:id        → documentApi.delete(id)
│  │  ├─ UploadUrlForm      │ │
│  │  └─ UploadFaqForm      │ │
│  └────────────────────────┘ │
│  ┌────────────────────────┐ │
│  │ DocumentTable           │ │──── Polls GET / every 5s while any doc is "processing"
│  │  └─ DocumentStatusBadge│ │
│  └────────────────────────┘ │
└─────────────────────────────┘

┌─────────────────────────────┐
│  Document Detail Page       │
│  /dashboard/documents/[id]  │──── GET /:documentId   → documentApi.get(id)
│  └─ DocumentDetail          │
└─────────────────────────────┘
```

| Frontend Location | Hook | API Call | Endpoint | Method |
|---|---|---|---|---|
| `documents/page.tsx` | `useDocuments().list` | `documentApi.list()` | `GET /api/v1/documents` | Query |
| `documents/page.tsx` | `useDocuments().list` | — | — | `refetchInterval: 5000` while processing |
| `UploadPdfForm.tsx` | `useDocuments().uploadPdf` | `documentApi.uploadPdf(file)` | `POST /api/v1/documents/upload` | Mutation |
| `UploadUrlForm.tsx` | `useDocuments().uploadUrl` | `documentApi.uploadUrl(data)` | `POST /api/v1/documents/url` | Mutation |
| `UploadFaqForm.tsx` | `useDocuments().uploadFaq` | `documentApi.uploadFaq(data)` | `POST /api/v1/documents/faq` | Mutation |
| `DocumentTable.tsx` | `useDocuments().remove` | `documentApi.delete(id)` | `DELETE /api/v1/documents/:id` | Mutation |
| `[documentId]/page.tsx` | `useDocuments().get` | `documentApi.get(id)` | `GET /api/v1/documents/:id` | Query / SSR |

### TanStack Query Keys

```typescript
['documents']                    // Document list
['documents', documentId]        // Single document detail
```

---

## Dashboard: Chat Playground

```
┌─────────────────────────────┐        Backend: /api/v1/chat
│  Chat Playground Page       │
│  /dashboard/chat-playground │
│  ┌────────────────────────┐ │
│  │ ChatWindow             │ │
│  │  ├─ ChatMessage (×n)   │ │
│  │  ├─ TypingIndicator    │ │
│  │  ├─ SourceCard (×n)    │ │──── POST /           → chatApi.sendMessage(data)
│  │  └─ ChatInput          │ │
│  └────────────────────────┘ │
└─────────────────────────────┘

┌─────────────────────────────┐
│  Session Replay Page        │
│  /dashboard/chat-playground/│
│  [sessionId]                │──── GET /sessions/:id → chatApi.getSession(id)
│  └─ ChatWindow (read-only) │
└─────────────────────────────┘
```

| Frontend Location | Hook | API Call | Endpoint | Method |
|---|---|---|---|---|
| `ChatInput.tsx` | `useChat().sendMessage` | `chatApi.sendMessage(data)` | `POST /api/v1/chat` | Mutation |
| `[sessionId]/page.tsx` | `useChat().getSession` | `chatApi.getSession(id)` | `GET /api/v1/chat/sessions/:id` | Query / SSR |

### TanStack Query Keys

```typescript
['chat', 'session', sessionId]   // Session history
```

### Chat Request/Response Shape

```typescript
// Request
{ session_id?: string | null, message: string }

// Response
{ session_id: string, answer: string, sources: string[], source_chunks: ChatSourceItem[] }
```

---

## Dashboard: Settings & Widget Embed

```
┌─────────────────────────────┐        Backend: /api/v1/tenants
│  Settings Page              │
│  /dashboard/settings        │
│  ┌────────────────────────┐ │
│  │ TenantProfileForm      │ │──── GET /me           → tenantApi.getProfile()
│  │                        │ │──── PATCH /me          → tenantApi.updateProfile(data)
│  └────────────────────────┘ │
│  ┌────────────────────────┐ │
│  │ ApiKeyDisplay          │ │──── GET /me/api-key    → tenantApi.getApiKey()
│  └────────────────────────┘ │
└─────────────────────────────┘

┌─────────────────────────────┐
│  Widget Embed Page          │
│  /dashboard/widget-embed    │
│  ┌────────────────────────┐ │
│  │ WidgetEmbedCode        │ │──── Uses API key from tenantApi.getApiKey()
│  │ WidgetPreview (iframe) │ │
│  └────────────────────────┘ │
└─────────────────────────────┘
```

| Frontend Location | Hook | API Call | Endpoint | Method |
|---|---|---|---|---|
| `TenantProfileForm.tsx` | `useTenant().profile` | `tenantApi.getProfile()` | `GET /api/v1/tenants/me` | Query |
| `TenantProfileForm.tsx` | `useTenant().updateProfile` | `tenantApi.updateProfile(data)` | `PATCH /api/v1/tenants/me` | Mutation |
| `ApiKeyDisplay.tsx` | `useTenant().apiKey` | `tenantApi.getApiKey()` | `GET /api/v1/tenants/me/api-key` | Query |

### TanStack Query Keys

```typescript
['tenant', 'profile']           // Tenant profile
['tenant', 'api-key']           // Public API key
```

---

## Admin: Brand Management (Superadmin)

```
┌─────────────────────────────┐        Backend: /api/v1/admin/brands
│  Brand List Page            │
│  /admin/brands              │
│  ┌────────────────────────┐ │
│  │ BrandTable             │ │──── GET /              → adminApi.listBrands()
│  │  └─ BrandStatusToggle  │ │──── PATCH /:id/status  → adminApi.updateStatus()
│  │  └─ BrandDeleteConfirm │ │──── DELETE /:id        → adminApi.deleteBrand()
│  └────────────────────────┘ │
└─────────────────────────────┘

┌─────────────────────────────┐
│  Onboard Brand Page         │
│  /admin/brands/new          │
│  ┌────────────────────────┐ │
│  │ BrandCreateForm        │ │──── POST /             → adminApi.createBrand(data)
│  └────────────────────────┘ │
└─────────────────────────────┘

┌─────────────────────────────┐
│  Brand Detail Page          │
│  /admin/brands/[tenantId]   │
│  ┌────────────────────────┐ │
│  │ BrandDetail            │ │──── GET /:tenantId     → adminApi.getBrand(id)
│  │ BrandStatusToggle      │ │──── PATCH /:id/status  → adminApi.updateStatus()
│  │ BrandDeleteConfirm     │ │──── DELETE /:id        → adminApi.deleteBrand()
│  └────────────────────────┘ │
└─────────────────────────────┘
```

| Frontend Location | Hook | API Call | Endpoint | Method |
|---|---|---|---|---|
| `brands/page.tsx` | `useBrands().list` | `adminApi.listBrands()` | `GET /api/v1/admin/brands` | Query |
| `brands/new/page.tsx` | `useBrands().create` | `adminApi.createBrand(data)` | `POST /api/v1/admin/brands` | Mutation |
| `brands/[tenantId]/page.tsx` | `useBrands().get` | `adminApi.getBrand(id)` | `GET /api/v1/admin/brands/:id` | Query / SSR |
| `BrandStatusToggle.tsx` | `useBrands().updateStatus` | `adminApi.updateStatus(id, status)` | `PATCH /api/v1/admin/brands/:id/status` | Mutation |
| `BrandDeleteConfirm.tsx` | `useBrands().remove` | `adminApi.deleteBrand(id)` | `DELETE /api/v1/admin/brands/:id` | Mutation |

### TanStack Query Keys

```typescript
['brands']                       // Brand list
['brands', tenantId]             // Single brand detail
```

---

## API Client Architecture

### Split by Domain

```
lib/api/
├── client.ts      ← Base fetch wrapper (apiFetch, token management, error handling)
├── auth.ts        ← authApi:     login(), getMe(), logout()
├── documents.ts   ← documentApi: list(), get(), uploadPdf(), uploadUrl(), uploadFaq(), delete()
├── chat.ts        ← chatApi:     sendMessage(), getSession()
├── tenants.ts     ← tenantApi:   getProfile(), updateProfile(), getApiKey()
├── admin.ts       ← adminApi:    listBrands(), getBrand(), createBrand(), updateStatus(), deleteBrand()
└── index.ts       ← Barrel export: { authApi, documentApi, chatApi, tenantApi, adminApi }
```

### Base Client (`client.ts`)

```typescript
const TOKEN_KEY = 'botforge_access_token';
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});

  // Auto-set JSON content type (skip for FormData uploads)
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  // Auto-attach Bearer token
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (!response.ok) {
    const error = await parseApiError(response);
    throw new Error(error);
  }

  // Handle 204 No Content (DELETE responses)
  if (response.status === 204) return undefined as T;

  return response.json();
}
```

---

## Query Invalidation Strategy

| Action | Invalidates | Why |
|---|---|---|
| Upload PDF/URL/FAQ | `['documents']` | New document added to list |
| Delete document | `['documents']` | Document removed from list |
| Update tenant profile | `['tenant', 'profile']` | Name change reflected |
| Create brand | `['brands']` | New brand in list |
| Toggle brand status | `['brands']`, `['brands', id]` | Status change reflected |
| Delete brand | `['brands']` | Brand removed from list |
| Send chat message | — | Response is returned inline, no query to invalidate |
