# 05 — Component Architecture & Composition

> Defines the component tree for every page, props interfaces,
> and how page files compose components.

---

## Component Design Principles

1. **Pages are composers** — `page.tsx` files import components and hooks, compose layout, handle zero business logic.
2. **Components are self-contained** — Each component owns its own rendering, receives data via props.
3. **Hooks own data fetching** — TanStack Query hooks live in `hooks/` and are shared across pages.
4. **Single responsibility** — One component = one job. Extract early.
5. **Glass-first** — All card surfaces use glassmorphic styling from the design system.

---

## Page Component Trees

### Landing Page `/`

```
(marketing)/page.tsx                          → SSG Server Component
├── Navbar                                    → components/layout/Navbar.tsx
├── HeroSection                               → (inline in page or extracted)
│   ├── H1: "Deploy AI Chatbots in Minutes"
│   ├── Subtitle paragraph
│   ├── Button[CTA] → /login
│   └── GradientOrbs (decorative)
├── FeaturesGrid
│   ├── GlassCard × 4 (RAG, Multi-tenant, Widget, Analytics)
│   └── Each card: icon + title + description
├── HowItWorksSection
│   └── 3-step numbered flow
└── Footer                                    → components/layout/Footer.tsx
```

### Login Page `/login`

```
(auth)/login/page.tsx                         → CSR "use client"
├── (auth)/layout.tsx provides:
│   ├── Centered container
│   ├── GradientOrbs (bg decoration)
│   └── Noise overlay
│
└── LoginForm                                 → components/auth/LoginForm.tsx
    ├── Logo + "Welcome Back" heading
    ├── Formik form
    │   ├── Input[email] + Yup validation
    │   ├── Input[password] + Yup validation
    │   └── Button[submit] "Sign In" (loading state)
    ├── Error alert (API error display)
    └── Redirects: superadmin → /admin/brands, owner → /dashboard
```

### Dashboard Overview `/dashboard`

```
(dashboard)/dashboard/page.tsx                → Hybrid (SSR shell + CSR data)
├── (dashboard)/layout.tsx provides:
│   ├── Sidebar                               → components/layout/Sidebar.tsx
│   │   ├── Logo + brand
│   │   ├── NavItem × 5 (Overview, Docs, Chat, Settings, Widget)
│   │   ├── User info (email, company)
│   │   └── Logout button
│   ├── ImpersonationBanner                   → components/layout/ImpersonationBanner.tsx
│   │   └── Sticky amber warning & "Return to Superadmin Portal" action
│   ├── Topbar                                → components/layout/Topbar.tsx
│   │   ├── BreadcrumbNav
│   │   └── User menu / role badge
│   └── <main> content area
│
├── PageHeader                                → components/layout/PageHeader.tsx
│   ├── H1: "Dashboard"
│   └── Description: "Overview of your workspace"
│
├── StatsGrid                                 → components/dashboard/StatsGrid.tsx
│   ├── StatsCard[Documents]                  → components/dashboard/StatsCard.tsx
│   │   └── icon + count + label + trend
│   ├── StatsCard[Chat Sessions]
│   ├── StatsCard[Status]
│   └── StatsCard[Plan]
│
├── RecentDocuments                           → components/dashboard/RecentDocuments.tsx
│   └── Mini table: last 5 docs with status badges
│
└── QuickActions                              → components/dashboard/QuickActions.tsx
    ├── Button → Upload Document
    ├── Button → Test Chat
    └── Button → View Settings
```

### Documents Page `/dashboard/documents`

```
(dashboard)/dashboard/documents/page.tsx      → Hybrid (SSR + CSR polling)
│
├── PageHeader
│   ├── H1: "Knowledge Base"
│   ├── Description: "Manage your documents and training data"
│   └── Button[action] → Opens UploadModal
│
├── UploadModal                               → components/documents/UploadModal.tsx
│   ├── Tabs                                  → components/ui/Tabs.tsx
│   │   ├── Tab: "PDF Upload"
│   │   │   └── UploadPdfForm                 → components/documents/UploadPdfForm.tsx
│   │   │       ├── FileDropzone              → components/ui/FileDropzone.tsx
│   │   │       └── Button[submit]
│   │   ├── Tab: "URL"
│   │   │   └── UploadUrlForm                 → components/documents/UploadUrlForm.tsx
│   │   │       ├── Input[url]
│   │   │       ├── Input[title] (optional)
│   │   │       └── Button[submit]
│   │   └── Tab: "FAQ / Text"
│   │       └── UploadFaqForm                 → components/documents/UploadFaqForm.tsx
│   │           ├── Input[title]
│   │           ├── TextArea[faq_text]
│   │           └── Button[submit]
│   └── Modal close / backdrop
│
├── DocumentTable                             → components/documents/DocumentTable.tsx
│   ├── Table header (Title, Type, Status, Chunks, Date, Actions)
│   └── Table rows (map documents)
│       ├── Document title
│       ├── Badge[source_type] (pdf / url / faq_text)
│       ├── DocumentStatusBadge               → components/documents/DocumentStatusBadge.tsx
│       │   └── pending(amber) | processing(blue) | ready(green) | failed(red)
│       ├── Chunk count
│       ├── Formatted date
│       └── Actions: View detail | Delete (with ConfirmDialog)
│
└── EmptyState                                → components/ui/EmptyState.tsx (when no documents)
    ├── Illustration
    ├── "No documents yet"
    └── Button → Upload first document
```

### Document Detail `/dashboard/documents/[documentId]`

```
(dashboard)/dashboard/documents/[documentId]/page.tsx  → SSR
│
├── BreadcrumbNav → Dashboard > Documents > {title}
├── PageHeader
│   ├── H1: Document title
│   └── DocumentStatusBadge
│
└── DocumentDetail                            → components/documents/DocumentDetail.tsx
    ├── GlassCard: Metadata
    │   ├── Source type, Original URL, File path
    │   ├── Created at, Updated at
    │   ├── Status, Error message (if failed)
    │   └── Chunk count
    └── Actions: Re-ingest (future) | Delete
```

### Chat Playground `/dashboard/chat-playground`

```
(dashboard)/dashboard/chat-playground/page.tsx  → Full CSR
│
├── PageHeader
│   ├── H1: "Chat Playground"
│   ├── Description: "Test your AI bot"
│   └── Button[action] → New Session (reset)
│
└── ChatWindow                                → components/chat/ChatWindow.tsx
    ├── Message area (scrollable)
    │   ├── ChatMessage × n                   → components/chat/ChatMessage.tsx
    │   │   ├── Avatar (user / bot)
    │   │   ├── Message bubble (markdown rendered)
    │   │   ├── Timestamp
    │   │   └── SourceChip × n (if assistant)  → components/chat/SourceChip.tsx
    │   │       └── Expandable → SourceCard   → components/chat/SourceCard.tsx
    │   │           ├── Chunk text excerpt
    │   │           ├── Document title
    │   │           └── Similarity score
    │   └── TypingIndicator                   → components/chat/TypingIndicator.tsx
    │       └── 3 animated dots
    │
    └── ChatInput                             → components/chat/ChatInput.tsx
        ├── TextArea[message] (auto-resize)
        └── Button[send] (disabled while loading)
```

### Session Replay `/dashboard/chat-playground/[sessionId]`

```
(dashboard)/dashboard/chat-playground/[sessionId]/page.tsx  → SSR
│
├── BreadcrumbNav → Dashboard > Chat > Session {id}
├── PageHeader
│   ├── H1: "Session History"
│   └── Session start time
│
└── ChatWindow (read-only mode)
    └── ChatMessage × n (from session messages)
```

### Settings `/dashboard/settings`

```
(dashboard)/dashboard/settings/page.tsx       → Hybrid
│
├── PageHeader
│   ├── H1: "Settings & Embed"
│   └── Description
│
├── GlassCard: Company Profile
│   └── TenantProfileForm                    → components/settings/TenantProfileForm.tsx
│       ├── Input[name] (prefilled)
│       ├── Button[save] "Update Profile"
│       └── Success/error toast
│
├── GlassCard: Public API Key
│   └── ApiKeyDisplay                        → components/settings/ApiKeyDisplay.tsx
│       ├── Code block with key (mono font)
│       ├── CopyButton                       → components/ui/CopyButton.tsx
│       └── Status badge (active/inactive)
│
└── GlassCard: Widget Embed Code
    └── WidgetEmbedCode                      → components/settings/WidgetEmbedCode.tsx
        ├── Code block with <script> snippet
        ├── CopyButton
        └── Link → /dashboard/widget-embed (full preview)
```

### Widget Embed Preview `/dashboard/widget-embed`

```
(dashboard)/dashboard/widget-embed/page.tsx   → CSR
│
├── PageHeader
│   ├── H1: "Widget Preview"
│   └── Description
│
├── GlassCard: Embed Code
│   └── WidgetEmbedCode (same component)
│
└── GlassCard: Live Preview
    └── WidgetPreview                        → components/settings/WidgetPreview.tsx
        └── iframe with widget loaded
```

### Admin: Brand List `/admin/brands`

```
(admin)/admin/brands/page.tsx                 → SSR + ISR
├── (admin)/layout.tsx provides:
│   ├── AdminTopbar (purple accent)
│   │   ├── Logo + "Superadmin Portal" label
│   │   ├── Nav: Client Brands | Analytics
│   │   └── User: email + badge + logout
│   └── <main> content area
│
├── PageHeader
│   ├── H1: "Client Brands"
│   ├── Description: "Manage onboarded client brands"
│   └── Button[action] → /admin/brands/new "Onboard Brand"
│
├── BrandTable                               → components/brands/BrandTable.tsx
│   ├── Table header (Brand, Owner, Plan, Status, Docs, Sessions, Date, Actions)
│   └── Table rows
│       ├── Brand name + slug
│       ├── Owner email
│       ├── Badge[plan] (trial / starter / pro)
│       ├── BrandStatusToggle                → components/brands/BrandStatusToggle.tsx
│       │   └── Toggle[active/suspended] + confirmation
│       ├── Document count
│       ├── Chat session count
│       ├── Created date
│       └── Actions: Inspect | Dashboard (View as Client) | Delete
│           └── BrandDeleteConfirm           → components/brands/BrandDeleteConfirm.tsx
│               ├── Warning message
│               ├── Input[slug confirmation]
│               └── Button[danger] "Delete Brand"
│
└── EmptyState (when no brands)
```

### Admin: Onboard Brand `/admin/brands/new`

```
(admin)/admin/brands/new/page.tsx             → CSR
│
├── BreadcrumbNav → Admin > Brands > New
├── PageHeader
│   ├── H1: "Onboard New Brand"
│   └── Description
│
└── GlassCard
    └── BrandCreateForm                      → components/brands/BrandCreateForm.tsx
        ├── Input[company_name]
        ├── Input[email]
        ├── Input[password] (temporary)
        ├── Select[plan] (trial / starter / pro)
        ├── Button[submit] "Create Brand"
        └── Redirects to /admin/brands on success
```

### Admin: Brand Detail `/admin/brands/[tenantId]`

```
(admin)/admin/brands/[tenantId]/page.tsx      → SSR
│
├── BreadcrumbNav → Admin > Brands > {brand.name}
├── PageHeader
│   ├── H1: Brand name
│   └── BrandStatusToggle
│
└── BrandDetail                              → components/brands/BrandDetail.tsx
    ├── GlassCard: Overview
    │   ├── Tenant ID, Slug, Plan, Created date
    │   ├── Owner email, Owner user ID
    │   ├── Document count
    │   ├── Chat session count
    │   └── Public API key (if exists)
    │
    ├── GlassCard: Actions
    │   ├── BrandStatusToggle (full-size)
    │   └── BrandDeleteConfirm
    │
    └── GlassCard: Activity (future)
        └── Recent chat sessions / documents
```

---

## Shared Component Props Summary

### `Button` Props
```typescript
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'ghost' | 'danger';
  size: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  fullWidth?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}
```

### `Badge` Props
```typescript
interface BadgeProps {
  variant: 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'purple';
  size?: 'sm' | 'md';
  dot?: boolean;     // Show dot indicator
  children: React.ReactNode;
}
```

### `GlassCard` Props
```typescript
interface GlassCardProps {
  elevated?: boolean;  // Use glass-card-elevated vs glass-card
  padding?: 'sm' | 'md' | 'lg';
  className?: string;
  children: React.ReactNode;
}
```

### `Modal` Props
```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  footer?: React.ReactNode;
}
```

### `PageHeader` Props
```typescript
interface PageHeaderProps {
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
}
```
