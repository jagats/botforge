# 01 — Frontend Folder Structure

> Restructured Next.js 16 App Router project with route groups, dynamic routes,
> component-based architecture, custom hooks, and domain-split API layer.

## Complete Tree

```
frontend/src/
│
├── middleware.ts                            # Next.js Edge Middleware — route protection + redirects
│
├── app/                                     # ─── Next.js App Router ───
│   ├── layout.tsx                           # Root layout: fonts, metadata, <Providers>
│   ├── globals.css                          # Design tokens + global styles + animations
│   ├── loading.tsx                          # Root-level loading skeleton (full page shimmer)
│   ├── not-found.tsx                        # Custom 404 page
│   ├── error.tsx                            # Global error boundary (client component)
│   │
│   │── ── ── ── ── ── ── ── ── ── ── ──
│   │  ROUTE GROUP: (marketing) — Public
│   │── ── ── ── ── ── ── ── ── ── ── ──
│   ├── (marketing)/
│   │   ├── layout.tsx                       # Marketing shell: <Navbar /> + <Footer />
│   │   └── page.tsx                         # Landing page  →  /
│   │
│   │── ── ── ── ── ── ── ── ── ── ── ──
│   │  ROUTE GROUP: (auth) — Public
│   │── ── ── ── ── ── ── ── ── ── ── ──
│   ├── (auth)/
│   │   ├── layout.tsx                       # Centered card layout with subtle bg pattern
│   │   ├── login/
│   │   │   └── page.tsx                     # Login form  →  /login
│   │   └── signup/
│   │       └── page.tsx                     # Redirect to /login (self-signup disabled)
│   │
│   │── ── ── ── ── ── ── ── ── ── ── ──
│   │  ROUTE GROUP: (dashboard) — Protected (owner/member)
│   │── ── ── ── ── ── ── ── ── ── ── ──
│   ├── (dashboard)/
│   │   ├── layout.tsx                       # Dashboard shell: <Sidebar /> + <Topbar /> + <main>
│   │   ├── dashboard/
│   │   │   ├── page.tsx                     # Overview / analytics  →  /dashboard
│   │   │   ├── loading.tsx                  # Dashboard overview skeleton
│   │   │   │
│   │   │   ├── documents/
│   │   │   │   ├── page.tsx                 # Document list + upload  →  /dashboard/documents
│   │   │   │   ├── loading.tsx              # Documents table skeleton
│   │   │   │   └── [documentId]/
│   │   │   │       ├── page.tsx             # Document detail  →  /dashboard/documents/:id
│   │   │   │       └── loading.tsx          # Document detail skeleton
│   │   │   │
│   │   │   ├── chat-playground/
│   │   │   │   ├── page.tsx                 # Chat test UI  →  /dashboard/chat-playground
│   │   │   │   └── [sessionId]/
│   │   │   │       └── page.tsx             # Session replay  →  /dashboard/chat-playground/:id
│   │   │   │
│   │   │   ├── settings/
│   │   │   │   └── page.tsx                 # Tenant profile + API key  →  /dashboard/settings
│   │   │   │
│   │   │   └── widget-embed/
│   │   │       └── page.tsx                 # Embed snippet + live preview  →  /dashboard/widget-embed
│   │   │
│   │   └── (Note: layout.tsx at this level provides sidebar + topbar for all /dashboard/* routes)
│   │
│   │── ── ── ── ── ── ── ── ── ── ── ──
│   │  ROUTE GROUP: (admin) — Protected (superadmin only)
│   │── ── ── ── ── ── ── ── ── ── ── ──
│   └── (admin)/
│       ├── layout.tsx                       # Admin shell: top navbar with purple accent
│       └── admin/
│           ├── page.tsx                     # Admin overview / stats  →  /admin
│           ├── brands/
│           │   ├── page.tsx                 # Brand directory  →  /admin/brands
│           │   ├── loading.tsx              # Brands table skeleton
│           │   ├── new/
│           │   │   └── page.tsx             # Onboard new brand form  →  /admin/brands/new
│           │   └── [tenantId]/
│           │       ├── page.tsx             # Brand detail  →  /admin/brands/:tenantId
│           │       └── loading.tsx          # Brand detail skeleton
│           └── analytics/
│               └── page.tsx                 # Platform-wide analytics (future)  →  /admin/analytics
│
├── components/                              # ─── Reusable UI Components ───
│   │
│   ├── ui/                                  # Primitive / atomic design system components
│   │   ├── Button.tsx                       # Primary, secondary, ghost, danger variants
│   │   ├── Input.tsx                        # Text input with label, error, icon support
│   │   ├── TextArea.tsx                     # Multi-line text input
│   │   ├── Select.tsx                       # Dropdown select
│   │   ├── Badge.tsx                        # Status badges (active, pending, failed, etc.)
│   │   ├── Card.tsx                         # Glassmorphic card container
│   │   ├── GlassCard.tsx                    # Enhanced glass card with border glow
│   │   ├── Modal.tsx                        # Dialog overlay with backdrop blur
│   │   ├── ConfirmDialog.tsx                # Destructive action confirmation modal
│   │   ├── Tooltip.tsx                      # Hover tooltip
│   │   ├── Skeleton.tsx                     # Shimmer loading placeholder
│   │   ├── Spinner.tsx                      # Loading spinner with size variants
│   │   ├── Toast.tsx                        # Toast notification component
│   │   ├── DropdownMenu.tsx                 # Context menu / action dropdown
│   │   ├── Avatar.tsx                       # User avatar with fallback initials
│   │   ├── EmptyState.tsx                   # Illustrated empty state with CTA
│   │   ├── Tabs.tsx                         # Tab navigation component
│   │   ├── Toggle.tsx                       # Toggle switch (on/off)
│   │   ├── FileDropzone.tsx                 # Drag-and-drop file upload area
│   │   ├── CopyButton.tsx                   # Click-to-copy with tooltip feedback
│   │   └── index.ts                         # Barrel export
│   │
│   ├── layout/                              # Layout shell components
│   │   ├── Sidebar.tsx                      # Dashboard sidebar with nav items
│   │   ├── Topbar.tsx                       # Dashboard top bar (breadcrumb + user menu)
│   │   ├── Navbar.tsx                       # Public marketing top navigation
│   │   ├── Footer.tsx                       # Marketing footer
│   │   ├── PageHeader.tsx                   # Page title + description + action button
│   │   ├── BreadcrumbNav.tsx                # Auto-generated breadcrumbs from pathname
│   │   └── index.ts
│   │
│   ├── auth/                                # Auth-specific components
│   │   ├── LoginForm.tsx                    # Formik login form with Yup validation
│   │   ├── AuthGuard.tsx                    # Client-side auth protection wrapper
│   │   ├── SuperadminGuard.tsx              # Client-side superadmin role gate
│   │   └── index.ts
│   │
│   ├── dashboard/                           # Dashboard overview components
│   │   ├── StatsGrid.tsx                    # 4-card stats grid (docs, chats, status, plan)
│   │   ├── StatsCard.tsx                    # Individual metric card with icon + trend
│   │   ├── RecentDocuments.tsx              # Last 5 documents mini-table
│   │   ├── QuickActions.tsx                 # Upload doc, test chat, view settings shortcuts
│   │   └── index.ts
│   │
│   ├── documents/                           # Document management components
│   │   ├── DocumentTable.tsx                # Sortable table with status badges
│   │   ├── DocumentCard.tsx                 # Document card (mobile/grid view)
│   │   ├── DocumentStatusBadge.tsx          # pending | processing | ready | failed badge
│   │   ├── UploadModal.tsx                  # Tab modal: PDF / URL / FAQ upload
│   │   ├── UploadPdfForm.tsx                # PDF file dropzone form
│   │   ├── UploadUrlForm.tsx                # URL ingestion form
│   │   ├── UploadFaqForm.tsx                # FAQ text form
│   │   ├── DocumentDetail.tsx               # Document metadata + chunk info
│   │   └── index.ts
│   │
│   ├── chat/                                # Chat playground components
│   │   ├── ChatWindow.tsx                   # Full chat container with message list
│   │   ├── ChatMessage.tsx                  # Single message bubble (user/assistant)
│   │   ├── ChatInput.tsx                    # Message input bar with send button
│   │   ├── SourceChip.tsx                   # Inline source citation chip
│   │   ├── SourceCard.tsx                   # Expandable source chunk detail
│   │   ├── SessionList.tsx                  # Previous chat sessions sidebar
│   │   ├── TypingIndicator.tsx              # Animated typing dots
│   │   └── index.ts
│   │
│   ├── brands/                              # Admin brand management components
│   │   ├── BrandTable.tsx                   # Brand directory table with actions
│   │   ├── BrandCard.tsx                    # Brand summary card
│   │   ├── BrandCreateForm.tsx              # Formik onboard brand form
│   │   ├── BrandStatusToggle.tsx            # Active/Suspended toggle switch
│   │   ├── BrandDeleteConfirm.tsx           # Offboard confirmation with slug match
│   │   ├── BrandDetail.tsx                  # Full brand detail view
│   │   └── index.ts
│   │
│   ├── settings/                            # Settings & embed components
│   │   ├── TenantProfileForm.tsx            # Company name edit form
│   │   ├── ApiKeyDisplay.tsx                # API key card with copy button
│   │   ├── WidgetEmbedCode.tsx              # Embed snippet code block
│   │   ├── WidgetPreview.tsx                # Live widget preview iframe
│   │   └── index.ts
│   │
│   └── Providers.tsx                        # QueryClient + AuthProvider + ToastProvider wrapper
│
├── hooks/                                   # ─── Custom React Hooks ───
│   ├── useAuth.ts                           # Re-export useAuth from AuthContext
│   ├── useDocuments.ts                      # TanStack Query: list, get, upload (PDF/URL/FAQ), delete
│   ├── useChat.ts                           # TanStack Query: sendMessage mutation, getSession query
│   ├── useTenant.ts                         # TanStack Query: profile, updateProfile, apiKey
│   ├── useBrands.ts                         # TanStack Query: listBrands, getBrand, create, updateStatus, delete
│   ├── useToast.ts                          # Toast notification state & dispatch
│   ├── useDebounce.ts                       # Debounce utility hook
│   ├── useMediaQuery.ts                     # Responsive breakpoint detection
│   ├── useCopyToClipboard.ts                # Clipboard copy with feedback
│   └── useClickOutside.ts                   # Detect clicks outside a ref
│
├── lib/                                     # ─── Utilities & Services ───
│   ├── api/                                 # API client split by backend domain
│   │   ├── client.ts                        # Base apiFetch wrapper, token management, error handling
│   │   ├── auth.ts                          # authApi: login(), getMe(), logout()
│   │   ├── documents.ts                     # documentApi: list(), get(), uploadPdf(), uploadUrl(), uploadFaq(), delete()
│   │   ├── chat.ts                          # chatApi: sendMessage(), getSession()
│   │   ├── tenants.ts                       # tenantApi: getProfile(), updateProfile(), getApiKey()
│   │   ├── admin.ts                         # adminApi: listBrands(), getBrand(), createBrand(), updateStatus(), deleteBrand()
│   │   └── index.ts                         # Barrel re-export of all API modules
│   │
│   ├── validations.ts                       # Yup schemas mirroring backend Pydantic models (existing)
│   ├── constants.ts                         # App-wide constants (routes, storage keys, limits)
│   ├── utils.ts                             # Helpers: formatDate(), cn(), truncate(), etc.
│   └── fonts.ts                             # Google Font loader: Inter + JetBrains Mono
│
├── contexts/                                # ─── React Contexts ───
│   ├── AuthContext.tsx                       # Auth state: user, login, logout, refreshUser
│   ├── SidebarContext.tsx                    # Sidebar collapse/expand state
│   └── ToastContext.tsx                      # Toast notification queue and dispatch
│
├── types/                                   # ─── TypeScript Types (split by domain) ───
│   ├── auth.ts                              # User, LoginInput, AuthTokens
│   ├── brand.ts                             # Brand, BrandCreateInput, BrandListResponse, BrandStatusUpdateInput
│   ├── document.ts                          # Document, DocumentListResponse, UploadUrlInput, UploadFaqInput
│   ├── chat.ts                              # ChatRequest, ChatResponse, ChatSourceItem, ChatSessionDetail, ChatMessageItem
│   ├── tenant.ts                            # Tenant, ApiKey
│   ├── widget.ts                            # WidgetConfig types (for embed preview)
│   ├── common.ts                            # ApiError, PaginationParams, SelectOption
│   └── index.ts                             # Barrel re-export of all type modules
│
└── styles/                                  # ─── Additional Style Modules ───
    └── animations.css                       # Reusable keyframe animations (imported in globals.css)
```

---

## Mapping to Backend Modules

| Backend Module | Frontend Feature Area | Folder(s) |
|---|---|---|
| `api/v1/auth.py` | Login, auth state | `(auth)/login/`, `components/auth/`, `hooks/useAuth.ts`, `lib/api/auth.ts` |
| `api/v1/documents.py` | Knowledge base management | `(dashboard)/dashboard/documents/`, `components/documents/`, `hooks/useDocuments.ts`, `lib/api/documents.ts` |
| `api/v1/chat.py` | Chat playground & history | `(dashboard)/dashboard/chat-playground/`, `components/chat/`, `hooks/useChat.ts`, `lib/api/chat.ts` |
| `api/v1/tenants.py` | Settings & API key | `(dashboard)/dashboard/settings/`, `components/settings/`, `hooks/useTenant.ts`, `lib/api/tenants.ts` |
| `api/v1/widget.py` | Widget embed preview | `(dashboard)/dashboard/widget-embed/`, `components/settings/WidgetEmbedCode.tsx` |
| `api/v1/admin.py` | Brand provisioning (superadmin) | `(admin)/admin/brands/`, `components/brands/`, `hooks/useBrands.ts`, `lib/api/admin.ts` |
| `schemas/*.py` | TypeScript types | `types/auth.ts`, `types/brand.ts`, `types/document.ts`, `types/chat.ts`, `types/tenant.ts` |
| `core/security.py` | Middleware + auth guards | `middleware.ts`, `components/auth/AuthGuard.tsx`, `components/auth/SuperadminGuard.tsx` |

---

## Key Structural Rules

1. **No business logic in `page.tsx`** — pages compose components and call hooks.
2. **No raw `fetch()` calls** — all API calls go through `lib/api/*.ts` modules.
3. **No inline styles or ad-hoc colors** — everything uses CSS custom properties from `globals.css`.
4. **One responsibility per component** — extract early, reuse often.
5. **Barrel exports everywhere** — every component folder has an `index.ts` for clean imports.
6. **Types split by domain** — no single monolith types file; barrel re-export in `types/index.ts`.
