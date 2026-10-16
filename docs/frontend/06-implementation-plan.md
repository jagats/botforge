# 06 — Frontend Implementation Plan

> Step-by-step execution order for the frontend restructure.
> Each chunk is independently shippable and testable.

---

## Overview

The restructure converts the existing monolithic frontend (6 large page files, 1 component,
1 API file, 1 types file) into a proper modular architecture with ~40+ components,
domain-split hooks/API/types, route groups, dynamic routes, and a full glassmorphic design system.

### What Changes
- Route groups `(marketing)`, `(auth)`, `(dashboard)`, `(admin)` with scoped layouts
- Dynamic routes `[documentId]`, `[sessionId]`, `[tenantId]` for detail pages
- ~40 focused components extracted from monolith pages
- Custom hooks layer: `useDocuments`, `useChat`, `useBrands`, `useTenant`
- API client split: single `api.ts` → domain-separated `lib/api/*.ts`
- Types split: single `types/index.ts` → domain-separated `types/*.ts`
- Design system: CSS custom properties, glassmorphism, Inter font, animations
- Edge middleware for auth routing
- `loading.tsx` + `error.tsx` + `not-found.tsx` at every segment

### What Does NOT Change
- **Next.js App Router** (already using it ✅)
- **TanStack React Query** (already installed ✅)
- **Formik + Yup** validation (already working ✅)
- **AuthContext pattern** (works well, just enhanced ✅)
- **Backend API structure** (no changes needed ✅)

---

## Chunk 1: Design System Foundation

**Goal:** Establish CSS custom properties, fonts, animations, and global styles.

| Task | File |
|---|---|
| 1.1 Create font loader | `src/lib/fonts.ts` |
| 1.2 Replace `globals.css` with full design token system | `src/app/globals.css` |
| 1.3 Create animations stylesheet | `src/styles/animations.css` |
| 1.4 Update root layout to load Inter + JetBrains Mono | `src/app/layout.tsx` |

**Deliverable:** All pages now render with Inter font, light glassmorphic background, and design tokens available globally.

**Verification:** Open any page → confirm Inter font, light background, custom properties in dev tools.

---

## Chunk 2: UI Primitives

**Goal:** Build atomic UI components used everywhere.

| Task | File |
|---|---|
| 2.1 Button (primary, secondary, ghost, danger) | `src/components/ui/Button.tsx` |
| 2.2 Input (label, error, icon, focus glow) | `src/components/ui/Input.tsx` |
| 2.3 TextArea | `src/components/ui/TextArea.tsx` |
| 2.4 Select | `src/components/ui/Select.tsx` |
| 2.5 Badge (success, warning, error, info, neutral) | `src/components/ui/Badge.tsx` |
| 2.6 Card + GlassCard | `src/components/ui/Card.tsx`, `GlassCard.tsx` |
| 2.7 Modal + ConfirmDialog | `src/components/ui/Modal.tsx`, `ConfirmDialog.tsx` |
| 2.8 Skeleton + Spinner | `src/components/ui/Skeleton.tsx`, `Spinner.tsx` |
| 2.9 Toast | `src/components/ui/Toast.tsx` |
| 2.10 Tabs | `src/components/ui/Tabs.tsx` |
| 2.11 Toggle | `src/components/ui/Toggle.tsx` |
| 2.12 FileDropzone | `src/components/ui/FileDropzone.tsx` |
| 2.13 CopyButton | `src/components/ui/CopyButton.tsx` |
| 2.14 Avatar + EmptyState + Tooltip + DropdownMenu | Remaining `src/components/ui/` |
| 2.15 Barrel export | `src/components/ui/index.ts` |

**Deliverable:** Full set of reusable UI primitives with glassmorphic styling.

**Verification:** Create a temporary `/test` page that renders every component.

---

## Chunk 3: Layout Components + Route Groups

**Goal:** Create layout shells and restructure routes into groups.

| Task | File |
|---|---|
| 3.1 Sidebar component | `src/components/layout/Sidebar.tsx` |
| 3.2 Topbar component | `src/components/layout/Topbar.tsx` |
| 3.3 Navbar (marketing) | `src/components/layout/Navbar.tsx` |
| 3.4 Footer (marketing) | `src/components/layout/Footer.tsx` |
| 3.5 PageHeader component | `src/components/layout/PageHeader.tsx` |
| 3.6 BreadcrumbNav component | `src/components/layout/BreadcrumbNav.tsx` |
| 3.7 Create `(marketing)/layout.tsx` | Move landing page into route group |
| 3.8 Create `(auth)/layout.tsx` | Centered card layout with orbs |
| 3.9 Create `(dashboard)/layout.tsx` | Sidebar + Topbar shell (refactor from existing) |
| 3.10 Create `(admin)/layout.tsx` | Admin top navbar (refactor from existing) |
| 3.11 Move existing pages into route groups | Relocate all `page.tsx` files |
| 3.12 SidebarContext | `src/contexts/SidebarContext.tsx` |
| 3.13 ToastContext + ToastProvider | `src/contexts/ToastContext.tsx` |
| 3.14 Update Providers.tsx | Add SidebarProvider + ToastProvider |

**Deliverable:** Route groups working, layouts rendering correctly, sidebar/topbar componentized.

**Verification:** Navigate all routes → correct layouts render → no regressions.

---

## Chunk 4: API Client Split + Types Split + Hooks

**Goal:** Split monolith `api.ts` and `types/index.ts` into domain files; create TanStack hooks.

| Task | File |
|---|---|
| 4.1 Split types into domain files | `src/types/auth.ts`, `brand.ts`, `document.ts`, `chat.ts`, `tenant.ts`, `common.ts`, `widget.ts` |
| 4.2 Create barrel re-export | `src/types/index.ts` |
| 4.3 Extract base API client | `src/lib/api/client.ts` |
| 4.4 Split API by domain | `src/lib/api/auth.ts`, `documents.ts`, `chat.ts`, `tenants.ts`, `admin.ts` |
| 4.5 Create barrel re-export | `src/lib/api/index.ts` |
| 4.6 Create `useDocuments` hook | `src/hooks/useDocuments.ts` |
| 4.7 Create `useChat` hook | `src/hooks/useChat.ts` |
| 4.8 Create `useTenant` hook | `src/hooks/useTenant.ts` |
| 4.9 Create `useBrands` hook | `src/hooks/useBrands.ts` |
| 4.10 Create utility hooks | `useToast.ts`, `useDebounce.ts`, `useMediaQuery.ts`, `useCopyToClipboard.ts` |
| 4.11 Create constants file | `src/lib/constants.ts` |
| 4.12 Create utils file | `src/lib/utils.ts` |
| 4.13 Update all imports across pages | Find/replace old paths |

**Deliverable:** All API calls go through domain-split modules; pages use hooks.

**Verification:** Login → navigate all pages → confirm data loads correctly from hooks.

---

## Chunk 5: Auth Components + Middleware

**Goal:** Implement Edge Middleware and client-side auth guards.

| Task | File |
|---|---|
| 5.1 Create Edge Middleware | `src/middleware.ts` |
| 5.2 Create AuthGuard component | `src/components/auth/AuthGuard.tsx` |
| 5.3 Create SuperadminGuard component | `src/components/auth/SuperadminGuard.tsx` |
| 5.4 Extract LoginForm component | `src/components/auth/LoginForm.tsx` |
| 5.5 Rebuild login page composing LoginForm | `src/(auth)/login/page.tsx` |
| 5.6 Create custom not-found page | `src/app/not-found.tsx` |
| 5.7 Create error boundary | `src/app/error.tsx` |

**Deliverable:** Route protection at both Edge and client level.

**Verification:** Unauthenticated → redirected to login; non-superadmin → redirected from admin.

---

## Chunk 6: Feature Components — Documents

**Goal:** Extract document page monolith into focused components.

| Task | File |
|---|---|
| 6.1 DocumentTable | `src/components/documents/DocumentTable.tsx` |
| 6.2 DocumentStatusBadge | `src/components/documents/DocumentStatusBadge.tsx` |
| 6.3 UploadModal (tabs container) | `src/components/documents/UploadModal.tsx` |
| 6.4 UploadPdfForm | `src/components/documents/UploadPdfForm.tsx` |
| 6.5 UploadUrlForm | `src/components/documents/UploadUrlForm.tsx` |
| 6.6 UploadFaqForm | `src/components/documents/UploadFaqForm.tsx` |
| 6.7 DocumentDetail | `src/components/documents/DocumentDetail.tsx` |
| 6.8 Rebuild documents list page (composing components) | `src/(dashboard)/dashboard/documents/page.tsx` |
| 6.9 Create document detail dynamic route | `src/(dashboard)/dashboard/documents/[documentId]/page.tsx` |
| 6.10 Documents loading skeleton | `src/(dashboard)/dashboard/documents/loading.tsx` |

**Deliverable:** Documents page rebuilt with componentized architecture + dynamic detail route.

**Verification:** Upload PDF/URL/FAQ → table shows → polling works → click to view detail → delete works.

---

## Chunk 7: Feature Components — Chat

**Goal:** Extract chat page into focused components.

| Task | File |
|---|---|
| 7.1 ChatWindow | `src/components/chat/ChatWindow.tsx` |
| 7.2 ChatMessage | `src/components/chat/ChatMessage.tsx` |
| 7.3 ChatInput | `src/components/chat/ChatInput.tsx` |
| 7.4 SourceChip + SourceCard | `src/components/chat/SourceChip.tsx`, `SourceCard.tsx` |
| 7.5 TypingIndicator | `src/components/chat/TypingIndicator.tsx` |
| 7.6 Rebuild chat playground page | `src/(dashboard)/dashboard/chat-playground/page.tsx` |
| 7.7 Create session replay dynamic route | `src/(dashboard)/dashboard/chat-playground/[sessionId]/page.tsx` |

**Deliverable:** Chat playground rebuilt with real-time messaging + session history route.

**Verification:** Send message → see response + sources → navigate to session history.

---

## Chunk 8: Feature Components — Settings & Widget Embed

**Goal:** Extract settings page + create widget embed preview.

| Task | File |
|---|---|
| 8.1 TenantProfileForm | `src/components/settings/TenantProfileForm.tsx` |
| 8.2 ApiKeyDisplay | `src/components/settings/ApiKeyDisplay.tsx` |
| 8.3 WidgetEmbedCode | `src/components/settings/WidgetEmbedCode.tsx` |
| 8.4 WidgetPreview | `src/components/settings/WidgetPreview.tsx` |
| 8.5 Rebuild settings page | `src/(dashboard)/dashboard/settings/page.tsx` |
| 8.6 Create widget embed page | `src/(dashboard)/dashboard/widget-embed/page.tsx` |

**Deliverable:** Settings rebuilt with glassmorphic cards + separate widget preview page.

**Verification:** Edit profile → save → see updated name; copy API key; view embed code.

---

## Chunk 9: Feature Components — Admin Brands

**Goal:** Extract admin brands page into focused components.

| Task | File |
|---|---|
| 9.1 BrandTable | `src/components/brands/BrandTable.tsx` |
| 9.2 BrandStatusToggle | `src/components/brands/BrandStatusToggle.tsx` |
| 9.3 BrandDeleteConfirm | `src/components/brands/BrandDeleteConfirm.tsx` |
| 9.4 BrandCreateForm | `src/components/brands/BrandCreateForm.tsx` |
| 9.5 BrandDetail | `src/components/brands/BrandDetail.tsx` |
| 9.6 Rebuild brands list page | `src/(admin)/admin/brands/page.tsx` |
| 9.7 Create brand onboard page | `src/(admin)/admin/brands/new/page.tsx` |
| 9.8 Create brand detail dynamic route | `src/(admin)/admin/brands/[tenantId]/page.tsx` |
| 9.9 Brands loading skeleton | `src/(admin)/admin/brands/loading.tsx` |

**Deliverable:** Admin brand management rebuilt with componentized table + dynamic detail route.

**Verification:** List brands → onboard new → toggle status → view detail → delete brand.

---

## Chunk 10: Dashboard Overview + Landing Page

**Goal:** Build the dashboard overview page and polish the landing page.

| Task | File |
|---|---|
| 10.1 StatsCard | `src/components/dashboard/StatsCard.tsx` |
| 10.2 StatsGrid | `src/components/dashboard/StatsGrid.tsx` |
| 10.3 RecentDocuments | `src/components/dashboard/RecentDocuments.tsx` |
| 10.4 QuickActions | `src/components/dashboard/QuickActions.tsx` |
| 10.5 Rebuild dashboard overview | `src/(dashboard)/dashboard/page.tsx` |
| 10.6 Dashboard loading skeleton | `src/(dashboard)/dashboard/loading.tsx` |
| 10.7 Rebuild landing page with glassmorphic design | `src/(marketing)/page.tsx` |

**Deliverable:** Polished dashboard overview + stunning landing page.

**Verification:** Dashboard shows stats, recent docs, quick actions; landing page is visually impressive.

---

## Chunk 11: Polish & Responsive

**Goal:** Final polish, responsive design, performance optimization.

| Task |
|---|
| 11.1 Mobile responsive sidebar (hamburger toggle) |
| 11.2 Responsive tables → card views on mobile |
| 11.3 Staggered animations on page load |
| 11.4 Toast notifications across all mutations |
| 11.5 Keyboard shortcuts (Escape to close modals, Enter to submit) |
| 11.6 SEO: meta tags, Open Graph, page titles |
| 11.7 Performance: dynamic imports for heavy components |
| 11.8 Accessibility: focus management, aria labels |
| 11.9 Remove temporary test pages |
| 11.10 Production build verification |

**Deliverable:** Production-ready frontend with responsive design and polished UX.

**Verification:** `next build` succeeds; test all pages on mobile + desktop; no console errors.

---

## Execution Summary

| Chunk | Name | Depends On | Est. Effort |
|---|---|---|---|
| 1 | Design System Foundation | — | Small |
| 2 | UI Primitives | Chunk 1 | Medium |
| 3 | Layout + Route Groups | Chunks 1, 2 | Medium |
| 4 | API/Types/Hooks Split | — (can parallel with 2, 3) | Medium |
| 5 | Auth + Middleware | Chunks 2, 3, 4 | Small |
| 6 | Documents Components | Chunks 2, 3, 4 | Medium |
| 7 | Chat Components | Chunks 2, 3, 4 | Medium |
| 8 | Settings & Widget | Chunks 2, 3, 4 | Small |
| 9 | Admin Brands | Chunks 2, 3, 4 | Medium |
| 10 | Dashboard + Landing | Chunks 2, 3, 4 | Medium |
| 11 | Polish & Responsive | All above | Medium |
