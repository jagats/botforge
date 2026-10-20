# Full-Stack Technical Audit Report: Performance, Role Separation & Token Security

> **Date:** October 2026  
> **Target:** BotForge Monorepo (Next.js Frontend & FastAPI Backend)  
> **Status:** Completed Audit & Recommended Action Plan

---

## Executive Summary

This audit evaluates three critical architectural areas of BotForge:
1. **Separation of Role-Wise Calls & Navigation:** Addressing the critical bug where logging in as an account Owner causes active Superadmin dashboards in the same browser to navigate/redirect to the Owner dashboard.
2. **Token Storage & Security (HttpOnly Cookies):** Auditing the storage of JWT tokens across the frontend (`localStorage`, `document.cookie`) and backend (JSON body responses, CORS, header parsing), and defining the migration path to strict `HttpOnly` cookies.
3. **Performance & Request Latency:** Identifying the root causes of slow request loading times across the backend database layer, Python asyncio event loop, and frontend client hydration waterfalls.

---

## 1. Role-Wise Call Separation & Navigation Collision

### 1.1 The Issue
When an administrator is logged into the Superadmin Portal (`/admin/brands`) and subsequently signs into an Owner account (`/login`), the Superadmin portal immediately navigates/redirects to the Owner dashboard (`/dashboard`), breaking administrative isolation.

### 1.2 Root Cause Analysis
1. **Single Global Token Key:**  
   In [client.ts](file:///e:/botforge/frontend/src/lib/api/client.ts#L1-L20), tokens for all user roles are written to the same key:
   ```typescript
   const TOKEN_KEY = "botforge_access_token";

   export function setStoredToken(token: string): void {
     if (typeof window !== "undefined") {
       localStorage.setItem(TOKEN_KEY, token);
       document.cookie = `botforge_token=${token}; path=/; max-age=604800; SameSite=Lax`;
     }
   }
   ```
2. **Global Cookie & LocalStorage Clobbering:**  
   When Tab 1 is logged into Superadmin, `botforge_access_token` and `botforge_token` hold the Superadmin JWT. When an Owner logs in via Tab 2 (or in another window), [auth.ts](file:///e:/botforge/frontend/src/lib/api/auth.ts#L10) invokes `setStoredToken(...)`, immediately replacing the token in `localStorage` and `botforge_token` with the Owner's JWT.
3. **Forced Redirect in Superadmin Layout:**  
   When Tab 1 refetches the user profile (`authApi.getMe()`), the backend returns the owner user profile (`role: "owner"`). [SuperadminGuard.tsx](file:///e:/botforge/frontend/src/components/auth/SuperadminGuard.tsx#L20-L22) inspects the updated context:
   ```typescript
   else if (user?.role !== "superadmin") {
     router.push("/dashboard"); // <-- FORCED REDIRECT TO OWNER DASHBOARD!
   }
   ```
   Furthermore, [middleware.ts](file:///e:/botforge/frontend/src/middleware.ts#L35-L37) intercepts requests to `/admin/*`, decodes `botforge_token`, detects `role !== "superadmin"`, and forces a redirect to `/dashboard`.
4. **Impersonation State Pollution:**  
   In [BrandDetail.tsx](file:///e:/botforge/frontend/src/components/brands/BrandDetail.tsx#L31-L43) and [BrandTable.tsx](file:///e:/botforge/frontend/src/components/brands/BrandTable.tsx#L39-L51), clicking *"Client Dashboard"* backs up the admin token in `localStorage.setItem("botforge_admin_backup_token", ...)` and overwrites the active token. This causes multi-tab corruption.

### 1.3 Recommended Resolution
* **Isolate Session Cookies by Persona:**
  * **Superadmin Cookie:** `botforge_admin_token` (Path scoped to `/admin` or verified specifically by admin routes).
  * **Tenant/Owner Cookie:** `botforge_user_token` (Path scoped to `/dashboard` or verified by dashboard routes).
  * **Impersonation Cookie:** `botforge_impersonation_token` (Allows superadmin to view a client dashboard without erasing their superadmin session).
* **Decouple Middleware & Guards:**
  * Next.js middleware and `SuperadminGuard` must read `botforge_admin_token`.
  * `AuthGuard` must read `botforge_user_token` or fallback to `botforge_impersonation_token`.

---

## 2. Token Storage & Security Audit (HttpOnly Cookies)

### 2.1 Current Gaps

| Component | Current Implementation | Risk / Vulnerability |
| :--- | :--- | :--- |
| **Frontend Storage** | [client.ts](file:///e:/botforge/frontend/src/lib/api/client.ts) stores tokens in `localStorage` and writes `document.cookie` via client-side JavaScript. | **XSS Vulnerability:** Client JS cannot set true `HttpOnly` cookies. Any third-party script or XSS vulnerability can extract tokens directly. |
| **Backend Login** | [auth.py](file:///e:/botforge/backend/app/api/v1/auth.py#L31-L33) returns `LoginResponse` with `access_token` in the JSON response body. | Does not set a `Set-Cookie` HTTP header. |
| **Backend Auth Dependency** | [security.py](file:///e:/botforge/backend/app/core/security.py#L18-L103) relies on `HTTPBearer(auto_error=True)`. | Rejects any request missing `Authorization: Bearer <token>` with `403 Forbidden`. Completely ignores cookies. |
| **CORS Configuration** | [main.py](file:///e:/botforge/backend/app/main.py#L33-L39) sets `allow_origins=["*"]` with `allow_credentials=True`. | **Browser CORS Violation:** Browsers block credentialed requests (cookies) when `Access-Control-Allow-Origin` is a wildcard `*`. |
| **Frontend Fetch Client** | [client.ts](file:///e:/botforge/frontend/src/lib/api/client.ts#L41-L44) does not pass `credentials: "include"`. | Cookies are not transmitted on cross-origin API calls. |

### 2.2 HttpOnly Migration Blueprint

#### Backend Changes
1. **Set HttpOnly Cookies in Auth & Admin Endpoints:**
   In [auth.py](file:///e:/botforge/backend/app/api/v1/auth.py) and [admin.py](file:///e:/botforge/backend/app/api/v1/admin.py):
   ```python
   @router.post("/login")
   def login(payload: LoginRequest, response: Response, db: Session = Depends(get_db)):
       res = login_user(db, payload)
       cookie_name = "botforge_admin_token" if res.role == "superadmin" else "botforge_user_token"
       response.set_cookie(
           key=cookie_name,
           value=res.access_token,
           httponly=True,
           secure=settings.ENVIRONMENT == "production",
           samesite="lax",
           max_age=86400, # 24 hours
           path="/",
       )
       return res
   ```
2. **Support Cookie Extraction in Auth Dependency:**
   In [security.py](file:///e:/botforge/backend/app/core/security.py):
   ```python
   def get_current_token_payload(
       request: Request,
       credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False)),
   ) -> Dict[str, Any]:
       # 1. Attempt extracting from HttpOnly cookie
       token = request.cookies.get("botforge_admin_token") or request.cookies.get("botforge_user_token")
       
       # 2. Fallback to Authorization Bearer header (for external widgets/API scripts)
       if not token and credentials:
           token = credentials.credentials
           
       if not token:
           raise HTTPException(
               status_code=status.HTTP_401_UNAUTHORIZED,
               detail="Authentication credentials missing",
           )
       return decode_access_token(token)
   ```
3. **Correct CORS in `main.py`:**
   ```python
   app.add_middleware(
       CORSMiddleware,
       allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
       allow_credentials=True,
       allow_methods=["*"],
       allow_headers=["*"],
   )
   ```

#### Frontend Changes
1. **Update `apiFetch` in `client.ts`:**
   - Remove `localStorage.getItem` and `document.cookie` setters.
   - Always pass `credentials: "include"`.
2. **Logout Endpoint:**
   - Call backend `/api/v1/auth/logout` to delete the HttpOnly cookie via `response.delete_cookie(...)`.

---

## 3. Performance & Request Latency Audit

We identified 7 distinct bottlenecks causing slow page and request loads:

### 3.1 Backend Bottlenecks

#### Bottleneck 1: Massive N+1 Query Storm in `list_brands`
* **File:** [admin_service.py:143-155](file:///e:/botforge/backend/app/services/admin_service.py#L143-L155)
* **Cause:** When [AdminBrandsPage](file:///e:/botforge/frontend/src/app/(admin)/admin/brands/page.tsx#L17) fetches brands (`useBrands(0, 500)`), `_build_brand_response` triggers 4 synchronous queries per brand:
  1. `db.query(User).filter(tenant_id, role="owner").first()`
  2. `db.query(Document).filter(tenant_id).count()`
  3. `db.query(ChatSession).filter(tenant_id).count()`
  4. `db.query(ApiKey).filter(tenant_id, active=True).first()`
* **Impact:** For 50 brands, **201 queries** execute sequentially.
* **Fix:** Use SQL `LEFT JOIN` and `GROUP BY` aggregations in a single query.

#### Bottleneck 2: Event-Loop Blocking Synchronous I/O in `async def` Endpoints
* **Files:** [documents.py:31](file:///e:/botforge/backend/app/api/v1/documents.py#L31), [chat.py:22](file:///e:/botforge/backend/app/api/v1/chat.py#L22)
* **Cause:** Endpoints are declared `async def`, but execute synchronous disk I/O (`with open(...)`) and synchronous SQLAlchemy queries (`db.query(...)`).
* **Impact:** In FastAPI, running synchronous blocking calls inside `async def` halts the Python asyncio event loop, freezing all concurrent requests for all users.
* **Fix:** Change synchronous endpoints to standard `def` (allowing FastAPI's threadpool to handle them) or wrap synchronous queries with `await run_in_threadpool(...)`.

#### Bottleneck 3: Redundant Auth Database Queries on Every Request
* **File:** [security.py:158-180](file:///e:/botforge/backend/app/core/security.py#L158-L180)
* **Cause:** `get_current_user` queries the `users` table and lazily fetches the `tenants` table on every authenticated call.
* **Fix:** Eager load tenant relationship (`joinedload(User.tenant)`) and rely on JWT claims for tenant identity where full user record is not required.

#### Bottleneck 4: Single Lock Contention in Rate Limiter
* **File:** [rate_limiter.py:20-42](file:///e:/botforge/backend/app/core/rate_limiter.py#L20-L42)
* **Cause:** A single `threading.Lock()` synchronizes all incoming requests across all endpoints and clients.
* **Fix:** Partition locks by IP hash or migrate to Redis.

---

### 3.2 Frontend Bottlenecks

#### Bottleneck 5: Blocking Auth Waterfall on Initial Load
* **Files:** [AuthContext.tsx](file:///e:/botforge/frontend/src/contexts/AuthContext.tsx#L20-L40), [AuthGuard.tsx](file:///e:/botforge/frontend/src/components/auth/AuthGuard.tsx#L14-L24)
* **Cause:**
  1. `AuthProvider` starts with `isLoading = true`, `user = null`.
  2. Guards display a loading spinner and block child rendering.
  3. Client makes a round-trip to `/api/v1/auth/me`.
  4. Only after `AuthGuard` completes do child page queries begin (`/api/v1/tenants/me`, `/api/v1/documents`).
* **Impact:** Adds 1.5–3s delay and layout flash on every page load.
* **Fix:** Server-side session verification via Next.js middleware and Server Components, avoiding client-side blocking cascades.

#### Bottleneck 6: File Polling Watcher in `next.config.mjs`
* **File:** [next.config.mjs:14-22](file:///e:/botforge/frontend/next.config.mjs#L14-L22)
* **Cause:**
  ```javascript
  config.watchOptions = {
    poll: 1000,
    aggregateTimeout: 300,
  };
  ```
  Forces Next.js to scan all files every 1000ms on Windows, creating continuous CPU load and sluggish local development response times.
* **Fix:** Remove `poll: 1000` for native Windows development.

#### Bottleneck 7: Frequent Polling & Cache Invalidation Waves
* **File:** [useDocuments.ts:19-26](file:///e:/botforge/frontend/src/hooks/useDocuments.ts#L19-L26)
* **Cause:** Refetch interval of 5000ms runs while documents process. Upload mutations trigger blanket invalidations without optimistic cache updates.
* **Fix:** Restrict polling only to processing document IDs rather than the entire document list query.

---

## 4. Priority Action Matrix

| Priority | Area | Issue | Remediation |
| :---: | :---: | :--- | :--- |
| **P0** | **Security** | Insecure token storage (`localStorage`) | Migrate to server-issued `HttpOnly; SameSite=Lax` cookies; update backend `security.py` to read cookies; add `credentials: "include"`. |
| **P0** | **Routing** | Superadmin session collision with Owner login | Differentiate cookie keys (`botforge_admin_token` vs `botforge_user_token`). Separate guard redirects. |
| **P0** | **Performance** | N+1 query explosion on `/admin/brands` | Consolidate brand metrics into a single SQL `LEFT JOIN` query with `GROUP BY`. |
| **P1** | **Performance** | Event-loop blocking in `async def` | Switch sync DB operations in `async def` to threadpool or define routes as standard `def`. |
| **P1** | **Performance** | Dev server file polling delay | Remove `poll: 1000` from [next.config.mjs](file:///e:/botforge/frontend/next.config.mjs). |
| **P1** | **Performance** | Frontend Auth Waterfall | Hydrate initial session state server-side to prevent full page render blocks. |
