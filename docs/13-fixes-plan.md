# 13 — Audit Fixes Plan & Task Chunks

> **Reference:** [12-audit-report.md](./12-audit-report.md)  
> **Objective:** Eliminate role collision (Superadmin vs Owner), migrate token storage exclusively to `HttpOnly` cookies, and resolve critical frontend/backend performance bottlenecks.

---

## Overview of Chunks

```
┌─────────────────────────────────────────────────────────────┐
│ Chunk 1: Backend Auth, HttpOnly Cookies & CORS Security     │
│ - Set HttpOnly cookies on login/impersonate                 │
│ - Role-separated cookies (admin vs user vs impersonation)    │
│ - Extract token from cookie or header in security.py        │
│ - Strict CORS configuration (no wildcard with credentials)  │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ Chunk 2: Frontend Cookie Migration & Role-Isolated Routing  │
│ - Purge localStorage & client document.cookie               │
│ - Enable credentials: "include" in fetch client             │
│ - Role-isolated Next.js middleware & route guards           │
│ - Clean impersonation session & return-to-admin flow        │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ Chunk 3: Backend Performance & Database Optimization        │
│ - Eliminate N+1 queries in list_brands (single JOIN query)  │
│ - Unblock Python event loop in async def endpoints          │
│ - Eager-load tenant in get_current_user                     │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ Chunk 4: Frontend Performance & Dev Experience Optimization │
│ - Remove poll: 1000 file watcher from next.config.mjs       │
│ - Eliminate auth hydration waterfall & spinner flashing     │
│ - Narrow polling interval in useDocuments                   │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ Chunk 5: End-to-End Validation & Verification               │
│ - Multi-tab Superadmin + Owner concurrent session testing   │
│ - DevTools verification: 0 tokens in localStorage           │
│ - Performance benchmarking (before vs after response times) │
│ - Automated test suite run (pytest & next build)            │
└─────────────────────────────────────────────────────────────┘
```

---

## Detailed Task Breakdown

### 🔷 Chunk 1: Backend Auth, HttpOnly Cookies & CORS Security
**Goal:** Transition the backend to issue and accept role-separated `HttpOnly` cookies and enforce strict CORS for credentialed requests.

- [x] **Task 1.1: Fix CORS Configuration**
  - **File:** `backend/app/main.py`
  - Change `allow_origins=["*"]` to explicit origins `["http://localhost:3000", "http://127.0.0.1:3000"]` (and env-configured origins) with `allow_credentials=True`.
- [x] **Task 1.2: Update Security Token Extractor**
  - **File:** `backend/app/core/security.py`
  - Modify `get_current_token_payload` to check cookies first (`botforge_impersonation_token` > `botforge_admin_token` > `botforge_user_token`), falling back to `Authorization: Bearer <token>` for public widget chat & external APIs.
  - Implement role-specific dependencies: `require_superadmin` checks `botforge_admin_token`; tenant endpoints check `botforge_user_token` or `botforge_impersonation_token`.
- [x] **Task 1.3: Set HttpOnly Cookies on Login & Add Logout Route**
  - **File:** `backend/app/api/v1/auth.py`
  - Update `POST /auth/login` to inject `Response` and set cookie:
    - If `role == "superadmin"`: set `botforge_admin_token`
    - If `role == "owner"` or user: set `botforge_user_token`
    - Attributes: `httponly=True`, `samesite="lax"`, `secure=(settings.ENVIRONMENT == "production")`, `path="/"`.
  - Add `POST /auth/logout` endpoint that deletes all session cookies.
- [x] **Task 1.4: Update Impersonation Cookie Issuance**
  - **File:** `backend/app/api/v1/admin.py`
  - Update `POST /admin/brands/{tenant_id}/impersonate` to set `botforge_impersonation_token` (HttpOnly), leaving `botforge_admin_token` untouched.
  - Add `POST /admin/brands/exit-impersonation` to clear `botforge_impersonation_token`.

---

### 🔷 Chunk 2: Frontend Cookie Migration & Role-Isolated Routing
**Goal:** Stop storing tokens in `localStorage`/`document.cookie`, decouple Superadmin and Owner sessions so they cannot overwrite each other, and update Next.js middleware and guards.

- [x] **Task 2.1: Purge Client-Side Token Storage in API Client**
  - **File:** `frontend/src/lib/api/client.ts`
  - Remove `localStorage.getItem(TOKEN_KEY)`, `localStorage.setItem`, and `document.cookie` setters.
  - Add `credentials: "include"` to all `apiFetch` calls so cookies are sent automatically with every request.
- [x] **Task 2.2: Implement Server-Side Logout in Frontend**
  - **File:** `frontend/src/lib/api/auth.ts`
  - Update `authApi.logout` to invoke `POST /api/v1/auth/logout`.
- [x] **Task 2.3: Role-Isolated Next.js Middleware**
  - **File:** `frontend/src/middleware.ts`
  - For `/admin/:path*`: Verify `botforge_admin_token`. If absent or not superadmin, redirect to `/login`.
  - For `/dashboard/:path*`: Verify `botforge_impersonation_token` or `botforge_user_token`. If absent, redirect to `/login`.
  - Ensure logging in as Owner in another tab does **not** redirect `/admin/*` to `/dashboard`.
- [x] **Task 2.4: Update Guards & AuthContext**
  - **Files:** `frontend/src/contexts/AuthContext.tsx`, `frontend/src/components/auth/SuperadminGuard.tsx`, `frontend/src/components/auth/AuthGuard.tsx`
  - `SuperadminGuard`: Validate superadmin session specifically; do not redirect to `/dashboard` if an owner token exists in a different cookie.
  - `AuthGuard`: Support active impersonation session seamlessly.
- [x] **Task 2.5: Update Impersonation Flow & Banner**
  - **Files:** `frontend/src/components/brands/BrandDetail.tsx`, `frontend/src/components/brands/BrandTable.tsx`, `frontend/src/components/layout/ImpersonationBanner.tsx`
  - Remove all `localStorage.setItem("botforge_admin_backup_token", ...)` calls.
  - On impersonate: trigger the impersonation API (which sets the HttpOnly impersonation cookie) and navigate to `/dashboard`.
  - On "Return to Superadmin": call exit impersonation API and navigate back to `/admin/brands`.

---

### 🔷 Chunk 3: Backend Performance & Database Optimization
**Goal:** Eliminate N+1 database queries and stop blocking the Python asyncio event loop during I/O operations.

- [x] **Task 3.1: Resolve N+1 Query Storm in `list_brands`**
  - **File:** `backend/app/services/admin_service.py`
  - Replace the 4 sequential queries per brand inside `_build_brand_response` with a single consolidated query using `LEFT JOIN` and `GROUP BY`:
    - `LEFT JOIN` users where `role = 'owner'`
    - `LEFT JOIN` documents -> `COUNT(documents.id)`
    - `LEFT JOIN` chat_sessions -> `COUNT(chat_sessions.id)`
    - `LEFT JOIN` api_keys where `is_active = true`
  - Reduces database round trips from 200+ down to **1 single query**.
- [x] **Task 3.2: Unblock Python Asyncio Event Loop in Endpoints**
  - **Files:** `backend/app/api/v1/documents.py`, `backend/app/api/v1/chat.py`
  - `upload_pdf_document`: Use threadpool execution for synchronous disk file writing (`shutil.copyfileobj`) and synchronous DB creation.
  - `chat_message_endpoint`: Ensure synchronous SQLAlchemy queries in `chat_service.py` execute without blocking the main event loop.
- [x] **Task 3.3: Eager-Load Tenant on User Authentication**
  - **File:** `backend/app/core/security.py`
  - Add `joinedload(User.tenant)` inside `get_current_user` to eliminate lazy-loading secondary queries on every authenticated request.

---

### 🔷 Chunk 4: Frontend Performance & Dev Experience Optimization
**Goal:** Eliminate dev server disk polling overhead and client-side rendering waterfalls.

- [x] **Task 4.1: Remove Aggressive Polling in `next.config.mjs`**
  - **File:** `frontend/next.config.mjs`
  - Remove `poll: 1000` watch options to stop continuous Windows filesystem re-scanning, lowering CPU consumption and request latency.
- [x] **Task 4.2: Streamline Auth Hydration Waterfall**
  - **File:** `frontend/src/contexts/AuthContext.tsx`
  - Avoid blocking child layout rendering when session is valid. Allow dashboard components to initiate data fetching concurrently.
- [x] **Task 4.3: Optimize Polling in `useDocuments`**
  - **File:** `frontend/src/hooks/useDocuments.ts`
  - Only enable polling interval when there are documents with status `'pending'` or `'processing'`, and avoid invalidating untouched queries on upload.

---

### 🔷 Chunk 5: End-to-End Validation & Verification
**Goal:** Ensure all fixes work together seamlessly in real-world scenarios.

- [x] **Task 5.1: Multi-Tab Concurrency Verification**
  - Superadmin session cookie (`botforge_admin_token`) and Owner session cookie (`botforge_user_token`) operate independently without cross-overwriting.
- [x] **Task 5.2: Impersonation Flow Verification**
  - Impersonation issues isolated `botforge_impersonation_token` without clearing the admin session.
  - Exit impersonation endpoint and frontend button clear only the impersonation token.
- [x] **Task 5.3: Security Inspection**
  - All token writes to `localStorage` and `document.cookie` removed across the entire frontend repository.
  - Cookies configured with `HttpOnly; SameSite=Lax; Path=/`.
- [x] **Task 5.4: Automated Test & Performance Benchmarks**
  - Run backend test suite: 34 tests passing (`pytest`).
  - Run frontend build: `npm run build` completed successfully.

---

## Execution Order & Priority

| Step | Chunk | Est. Impact | Risk |
| :---: | :--- | :--- | :---: |
| **1** | **Chunk 1: Backend Auth, HttpOnly Cookies & CORS** | Critical (Security & Foundation) | Low (maintains header fallback) |
| **2** | **Chunk 2: Frontend Cookie Migration & Role-Isolated Routing** | Critical (Fixes Superadmin/Owner Bug) | Medium (routing & guards) |
| **3** | **Chunk 3: Backend Performance & Database Optimization** | High (5x-10x faster API loads) | Low (isolated SQL query updates) |
| **4** | **Chunk 4: Frontend Performance & Dev Experience** | Medium (Faster local dev & UI rendering) | Low |
| **5** | **Chunk 5: End-to-End Validation & Verification** | Quality Assurance & Regression Prevention | None |
