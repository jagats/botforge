# Frontend Development Documentation

> Complete architecture, design system, and implementation plan for the BotForge frontend restructure.
> These docs govern the conversion from monolithic pages to a proper component-based architecture
> with route groups, dynamic routes, glassmorphic design, and domain-split modules.

---

## Documents

| # | Document | Purpose |
|---|---|---|
| 01 | [Folder Structure](./01-folder-structure.md) | Complete `frontend/src/` tree with route groups, dynamic routes, components, hooks, API modules, types, and mapping to backend modules |
| 02 | [Design System](./02-design-system.md) | Colors (light glassmorphic), typography (Inter + JetBrains Mono), spacing, shadows, animations, effects, z-index, responsive breakpoints, and visual hierarchy |
| 03 | [Rendering Strategy](./03-rendering-strategy.md) | SSG / SSR / CSR / ISR decisions per route, route group layouts, dynamic route params, middleware protection, loading/error states, and data fetching patterns |
| 04 | [API Integration Map](./04-api-integration-map.md) | Every frontend page → backend endpoint mapping with hooks, TanStack Query keys, invalidation strategy, and API client architecture |
| 05 | [Component Architecture](./05-component-architecture.md) | Component tree for every page, composition patterns, shared component props interfaces |
| 06 | [Implementation Plan](./06-implementation-plan.md) | 11-chunk execution plan with tasks, file paths, dependencies, deliverables, and verification steps |

---

## Quick Reference

### Design System Summary

| Property | Value |
|---|---|
| **Primary Color** | `#6366F1` (Indigo-500) |
| **Background** | `#F8FAFC` (Slate-50, light) |
| **Card Surface** | `rgba(255,255,255,0.70)` (Glass) |
| **Font Family** | Inter (UI), JetBrains Mono (code) |
| **Border Radius** | 6px–24px scale |
| **Theme** | Light mode, glassmorphism, subtle gradients |
| **Effects** | Backdrop blur, glow shadows, staggered animations, floating orbs |

### Architecture Summary

| Layer | Current State | Target State |
|---|---|---|
| **Routes** | Flat files, no groups | `(marketing)`, `(auth)`, `(dashboard)`, `(admin)` route groups |
| **Dynamic Routes** | None | `[documentId]`, `[sessionId]`, `[tenantId]` |
| **Components** | 1 file (`Providers.tsx`) | ~40+ components across 8 feature folders |
| **Hooks** | None | 8 custom hooks (TanStack Query + utility) |
| **API Client** | Single `api.ts` (207 lines) | 6 domain-split files in `lib/api/` |
| **Types** | Single `index.ts` (136 lines) | 7 domain-split files in `types/` |
| **Design** | Dark mode, no tokens, Tailwind only | Light glassmorphic, CSS custom properties |
| **Rendering** | All CSR (`"use client"`) | Mixed SSG/SSR/CSR/ISR per route |
| **Middleware** | None | Edge middleware for auth routing |
| **Loading States** | None | `loading.tsx` skeletons at every segment |

### Backend Module → Frontend Mapping

| Backend | Frontend Feature | Route |
|---|---|---|
| `auth.py` | Login & Auth | `(auth)/login/` |
| `documents.py` | Knowledge Base | `(dashboard)/dashboard/documents/` |
| `chat.py` | Chat Playground | `(dashboard)/dashboard/chat-playground/` |
| `tenants.py` | Settings & API Key | `(dashboard)/dashboard/settings/` |
| `widget.py` | Widget Embed Preview | `(dashboard)/dashboard/widget-embed/` |
| `admin.py` | Brand Management | `(admin)/admin/brands/` |
