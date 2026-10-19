# 07 — Frontend (Next.js) and Widget Spec

## Application routes (`frontend/src/app/`)
```
login/                       → /login (public - single authentication portal for all roles)
signup/                      → /signup (redirects to /login - public self-registration disabled)

[Role: superadmin]
admin/brands/page.tsx        → /admin/brands         Product Admin: Brand directory, onboard new brand, toggle active/inactive

[Role: owner / member (Client Brands)]
dashboard/page.tsx           → /dashboard            Brand overview: doc count, chat volume
dashboard/documents/page.tsx → /dashboard/documents  Brand knowledge base: upload + list docs
dashboard/chat-test/page.tsx → /dashboard/chat-test  Brand playground: test bot before going live
dashboard/settings/page.tsx  → /dashboard/settings   Brand embed: script tag, API key, branding
```

## Role-based redirection after login
Upon entering credentials on `/login`:
- If `user.role === 'superadmin'` ➔ automatically redirects to `/admin/brands`.
- If `user.role === 'owner'` or `'member'` ➔ automatically redirects to `/dashboard`.
- If `user.is_active === false` or `tenant.status !== 'active'` ➔ displays error: *"Account suspended. Please contact platform administrator."*

## Superadmin Client Dashboard View & Impersonation
- **Row-level Access:** The "Client Dashboard View" button is located on each individual client brand row in the Brand Directory table (`BrandTable.tsx`) as well as on the Brand Details page (`BrandDetail.tsx`). It is removed from the global header navigation to keep multi-tenant context explicit.
- **Audit-Logged Impersonation:** Clicking "Dashboard" on a client row requests an impersonation token (`POST /api/v1/admin/brands/:id/impersonate`), saves the original superadmin token to `botforge_admin_backup_token`, and redirects to `/dashboard`.
- **Persistent Exit Banner (`ImpersonationBanner`):** When in impersonation mode, a persistent amber banner is rendered at the top of the client dashboard layout: *"Viewing as Superadmin: Managing [Brand Name]. All live changes apply."* with a one-click button: *"Return to Superadmin Portal"*, safely restoring the superadmin session.

## State and data fetching
- **Server state** (documents, tenant info, chat history): **TanStack Query** — handles loading/error and polling.
- **Auth state**: small React Context (`AuthProvider`), filled once from `GET /api/v1/auth/me` on app load.
- No Redux.

## API client — one file only: `src/lib/api.ts`
- Reads `NEXT_PUBLIC_API_URL`.
- Adds `Authorization: Bearer <token>` automatically.
- **No page or component calls `fetch()` directly.** All calls go through `api`.
- Note for file upload: when sending `FormData`, do NOT force `Content-Type: application/json` (the browser must set the multipart boundary). The LLD sample sets JSON header by default — fix this when implementing `uploadDocument`.

```ts
const BASE_URL = process.env.NEXT_PUBLIC_API_URL;
async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}
```

## Documents page component tree
```
DocumentsPage
├── UploadDropzone   (drag-drop PDF / paste URL / paste FAQ text)
├── DocumentsTable
│   └── DocumentRow  (name, status badge, delete button)
└── StatusPoller     (poll GET /documents every few sec while any doc is "processing")
```

## Widget (`widget/`)
- Vanilla TypeScript, compiled to ONE file: `widget/dist/widget.js`.
- **No frameworks, no dependencies** — must stay tiny.
- Floating chat bubble + panel using plain DOM APIs.
- Reads `data-public-key` from its own `<script>` tag.
- Calls `POST /api/v1/widget/chat` with the public key header. No dashboard code involved.
- Creates an anonymous `visitor_id` (localStorage/cookie) and keeps `session_id` between messages.

Embed snippet shown in dashboard settings (example shape — final URL decided at deploy time):
```html
<script src="https://<widget-host>/widget.js" data-public-key="pk_xxx" async></script>
```

## Form Management & Validation (Formik + Yup)

All dashboard and auth forms use **Formik** for form state handling and **Yup** for schema validation.
Validation schemas are maintained in `frontend/src/lib/validations.ts` and directly mirror backend Pydantic models in `backend/app/schemas/`:

| Frontend Form | Backend Schema | Validation Rules (Yup Schema) |
|---|---|---|
| **Onboard Brand Modal** (`/admin/brands`) | `BrandCreateRequest` (`admin.py`) | • `company_name`: string, min 2, max 100, required<br>• `email`: string, valid email format, required<br>• `password`: string, min 8, max 100, required<br>• `plan`: string, oneOf [trial, starter, pro], required |
| **Login** (`/login`) | `LoginRequest` (`auth.py`) | • `email`: string, valid email format, required<br>• `password`: string, min 1, required |
| **Settings Profile** (`/dashboard/settings`) | `TenantUpdateRequest` (`tenant.py`) | • `name`: string, min 2, max 100, required |
| **Document URL Ingestion** (`/dashboard/documents`) | `DocumentUrlCreate` (`document.py`) | • `url`: string, valid URL (http/https), required<br>• `title`: string, optional |
| **Document FAQ Ingestion** (`/dashboard/documents`) | `DocumentFaqCreate` (`document.py`) | • `title`: string, min 1, max 255, required<br>• `faq_text`: string, min 10, required |

