# 07 — Frontend (Next.js) and Widget Spec

## Dashboard routes (`frontend/src/app/`)
```
login/                       → /login (public)
signup/                      → /signup (public)
dashboard/page.tsx           → /dashboard            overview: doc count, chat volume
dashboard/documents/page.tsx → /dashboard/documents  upload + list docs
dashboard/chat-test/page.tsx → /dashboard/chat-test  try the bot before going live
dashboard/settings/page.tsx  → /dashboard/settings   embed code, API key, plan
```

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
