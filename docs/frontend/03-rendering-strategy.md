# 03 — Rendering Strategy & Route Architecture

> Defines which rendering mode (SSG, SSR, CSR, ISR) each route uses, why,
> and how Next.js App Router features are applied.

---

## Rendering Modes in Next.js App Router

| Mode | Server/Client | When HTML is Generated | Best For |
|---|---|---|---|
| **SSG** (Static Site Generation) | Server at build time | `next build` | Static marketing pages, no user data |
| **SSR** (Server-Side Rendering) | Server on every request | Each HTTP request | Authenticated pages needing fresh data |
| **CSR** (Client-Side Rendering) | Client after initial load | In the browser | Interactive forms, real-time UI, auth state |
| **ISR** (Incremental Static Regeneration) | Server, revalidated | After `revalidate` seconds | Semi-static data that changes periodically |
| **Hybrid** (SSR + CSR) | Server initial, client hydration | Mixed | Server-rendered shell + client interactivity |

---

## Route-by-Route Rendering Decisions

### Public Routes — `(marketing)` Group

| Route | URL | Rendering | Component Type | Rationale |
|---|---|---|---|---|
| Landing | `/` | **SSG** | Server Component | Static marketing content, no backend calls, fastest possible load |

### Auth Routes — `(auth)` Group

| Route | URL | Rendering | Component Type | Rationale |
|---|---|---|---|---|
| Login | `/login` | **CSR** | `"use client"` | Interactive form, localStorage token, Formik/Yup validation |
| Signup | `/signup` | **CSR** | `"use client"` | Redirect-only (self-signup disabled) |

### Dashboard Routes — `(dashboard)` Group

| Route | URL | Rendering | Component Type | Rationale |
|---|---|---|---|---|
| Overview | `/dashboard` | **Hybrid (SSR + CSR)** | Server shell + client `useDocuments()`, `useTenant()` | Server renders layout; TanStack Query fetches stats client-side |
| Documents List | `/dashboard/documents` | **Hybrid (SSR + CSR)** | Server shell + client polling | Initial list rendered server-side; status polling (pending→ready) via `refetchInterval` |
| Document Detail | `/dashboard/documents/[documentId]` | **SSR** | Server Component with client actions | Dynamic route, single document fetch, cacheable per request |
| Chat Playground | `/dashboard/chat-playground` | **Full CSR** | `"use client"` | Real-time conversation, streaming-ready, heavy DOM updates |
| Session Replay | `/dashboard/chat-playground/[sessionId]` | **SSR** | Server Component | Read-only historical data, no interactivity needed |
| Settings | `/dashboard/settings` | **Hybrid (SSR + CSR)** | Server shell + client form | Profile data SSR; Formik edit form is client-side |
| Widget Embed | `/dashboard/widget-embed` | **CSR** | `"use client"` | Code snippet generation, clipboard copy, live preview iframe |

### Admin Routes — `(admin)` Group

| Route | URL | Rendering | Component Type | Rationale |
|---|---|---|---|---|
| Admin Overview | `/admin` | **SSR** | Server Component | Platform-wide stats snapshot |
| Brand List | `/admin/brands` | **SSR + ISR** (revalidate: 60s) | Server Component | Brand directory rarely changes; 60s revalidation avoids stale data |
| Brand Detail | `/admin/brands/[tenantId]` | **SSR** | Server Component | Dynamic brand data, always fresh |
| Onboard Brand | `/admin/brands/new` | **CSR** | `"use client"` | Interactive Formik form |

---

## Route Groups & Layout Hierarchy

```
app/layout.tsx                        ← Root: fonts, metadata, <Providers>
│
├── (marketing)/layout.tsx            ← Public: <Navbar> + <Footer>
│   └── page.tsx                         Landing page (SSG)
│
├── (auth)/layout.tsx                 ← Auth: centered card, gradient orbs
│   ├── login/page.tsx                   Login form (CSR)
│   └── signup/page.tsx                  Redirect (CSR)
│
├── (dashboard)/layout.tsx            ← Dashboard: <Sidebar> + <Topbar> + <AuthGuard>
│   └── dashboard/
│       ├── page.tsx                     Overview (Hybrid)
│       ├── loading.tsx                  Skeleton
│       ├── documents/
│       │   ├── page.tsx                 List (Hybrid)
│       │   ├── loading.tsx              Skeleton
│       │   └── [documentId]/page.tsx    Detail (SSR)
│       ├── chat-playground/
│       │   ├── page.tsx                 Chat UI (CSR)
│       │   └── [sessionId]/page.tsx     Replay (SSR)
│       ├── settings/page.tsx            Settings (Hybrid)
│       └── widget-embed/page.tsx        Embed (CSR)
│
└── (admin)/layout.tsx                ← Admin: <AdminTopbar> + <SuperadminGuard>
    └── admin/
        ├── page.tsx                     Overview (SSR)
        ├── brands/
        │   ├── page.tsx                 Directory (SSR+ISR)
        │   ├── loading.tsx              Skeleton
        │   ├── new/page.tsx             Onboard form (CSR)
        │   └── [tenantId]/page.tsx      Detail (SSR)
        └── analytics/page.tsx           Analytics (future)
```

---

## Dynamic Routes

### `/dashboard/documents/[documentId]`

```typescript
// (dashboard)/dashboard/documents/[documentId]/page.tsx
interface Params {
  documentId: string;  // UUID from URL path
}

// SSR — fetches document detail on each request
export default async function DocumentDetailPage({ params }: { params: Params }) {
  // Server-side fetch via API route or direct service call
  // Falls back to client-side useDocuments().get(params.documentId) if needed
}
```

### `/dashboard/chat-playground/[sessionId]`

```typescript
// (dashboard)/dashboard/chat-playground/[sessionId]/page.tsx
interface Params {
  sessionId: string;  // UUID from URL path
}

// SSR — fetches session history on each request
export default async function SessionReplayPage({ params }: { params: Params }) {
  // Read-only display of past conversation messages
}
```

### `/admin/brands/[tenantId]`

```typescript
// (admin)/admin/brands/[tenantId]/page.tsx
interface Params {
  tenantId: string;  // UUID from URL path
}

// SSR — fetches brand detail including doc count, chat sessions, API key
export default async function BrandDetailPage({ params }: { params: Params }) {
  // Full brand management view: detail, status toggle, delete action
}
```

---

## Loading & Error States

### Loading Skeletons (`loading.tsx`)

Every route segment with server-rendered data has a `loading.tsx` that shows immediately while the server fetch is in progress. Uses the shimmer animation from the design system.

```
(dashboard)/dashboard/loading.tsx           → Dashboard overview skeleton
(dashboard)/dashboard/documents/loading.tsx → Documents table skeleton
(admin)/admin/brands/loading.tsx            → Brands table skeleton
(admin)/admin/brands/[tenantId]/loading.tsx → Brand detail skeleton
```

### Error Boundaries (`error.tsx`)

```
app/error.tsx                               → Global error boundary (catch-all)
(dashboard)/dashboard/error.tsx             → Dashboard error (retry option)
```

### Not Found

```
app/not-found.tsx                           → Custom 404 (illustrated empty state)
```

---

## Middleware Route Protection

```typescript
// middleware.ts (runs on Edge Runtime)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/', '/login', '/signup'];
const DASHBOARD_PREFIX = '/dashboard';
const ADMIN_PREFIX = '/admin';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('botforge_token')?.value;
  const { pathname } = request.nextUrl;

  // 1. Allow public paths
  if (PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.next();
  }

  // 2. No token → redirect to /login
  if (!token && (pathname.startsWith(DASHBOARD_PREFIX) || pathname.startsWith(ADMIN_PREFIX))) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 3. Admin paths → verify superadmin claim
  if (token && pathname.startsWith(ADMIN_PREFIX)) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.role !== 'superadmin') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    } catch {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'],
};
```

### Client-Side Guards (Defense in Depth)

In addition to Edge Middleware, the `(dashboard)/layout.tsx` and `(admin)/layout.tsx` include client-side `<AuthGuard>` and `<SuperadminGuard>` wrappers that:

1. Read auth state from `AuthContext`
2. Redirect if not authenticated / wrong role
3. Show a loading spinner during verification

This provides double protection: middleware blocks unauthenticated server requests, while client guards protect against client-side navigation edge cases.

---

## Data Fetching Patterns

### Server Components (SSR pages)

```typescript
// Direct fetch in server component (no hooks needed)
async function getDocumentDetail(documentId: string, token: string) {
  const res = await fetch(`${API_URL}/api/v1/documents/${documentId}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store', // SSR: always fresh
  });
  if (!res.ok) throw new Error('Failed to fetch document');
  return res.json();
}
```

### Client Components (CSR pages / interactive sections)

```typescript
// TanStack Query hook in client component
'use client';
import { useDocuments } from '@/hooks/useDocuments';

function DocumentsPage() {
  const { list, uploadPdf, remove } = useDocuments();

  // list.data, list.isLoading, list.error — automatic
  // uploadPdf.mutate(file) — with optimistic updates
  // remove.mutate(id) — with cache invalidation
}
```

### ISR (Incremental Static Regeneration)

```typescript
// (admin)/admin/brands/page.tsx
export const revalidate = 60; // Revalidate every 60 seconds

export default async function BrandsPage() {
  const brands = await fetchBrands(); // Cached for 60s
  return <BrandTable brands={brands} />;
}
```
