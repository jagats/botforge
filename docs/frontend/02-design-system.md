# 02 — Design System: Colors, Typography, Effects & Hierarchy

> Light-mode glassmorphic design system with modern effects for BotForge.
> This document defines every visual token used across the frontend.

---

## Color Palette

### Philosophy
A **clean, airy, light-mode** palette inspired by frosted glass interfaces.
Primary blue-violet for brand identity, soft grays for surfaces, with vibrant semantic colors for status indicators.

### Core Brand Colors

| Token | Hex | HSL | Usage |
|---|---|---|---|
| `--color-primary` | `#6366F1` | `239 84% 67%` | Primary actions, active states, CTA buttons |
| `--color-primary-hover` | `#4F46E5` | `239 84% 59%` | Hover on primary elements |
| `--color-primary-light` | `#EEF2FF` | `226 100% 97%` | Primary tinted backgrounds, selected rows |
| `--color-primary-muted` | `#C7D2FE` | `225 94% 89%` | Muted primary for borders, rings |
| `--color-primary-glow` | `rgba(99, 102, 241, 0.15)` | — | Glow shadows on primary elements |

### Surface Colors (Light Glassmorphic)

| Token | Hex | Usage |
|---|---|---|
| `--color-bg-page` | `#F8FAFC` | Page background (slate-50) |
| `--color-bg-body` | `#F1F5F9` | Body / content area background (slate-100) |
| `--color-bg-card` | `rgba(255, 255, 255, 0.70)` | Glass card surface (translucent white) |
| `--color-bg-card-solid` | `#FFFFFF` | Opaque card surface (forms, modals) |
| `--color-bg-sidebar` | `rgba(255, 255, 255, 0.55)` | Sidebar glass panel |
| `--color-bg-topbar` | `rgba(248, 250, 252, 0.80)` | Topbar with backdrop blur |
| `--color-bg-modal-overlay` | `rgba(15, 23, 42, 0.40)` | Modal backdrop |
| `--color-bg-hover` | `rgba(99, 102, 241, 0.06)` | Subtle hover tint |
| `--color-bg-active` | `rgba(99, 102, 241, 0.10)` | Active/selected row |
| `--color-bg-input` | `#FFFFFF` | Input field background |

### Text Colors

| Token | Hex | Usage |
|---|---|---|
| `--color-text-primary` | `#0F172A` | Headings, primary body text (slate-900) |
| `--color-text-secondary` | `#475569` | Descriptions, secondary text (slate-600) |
| `--color-text-tertiary` | `#94A3B8` | Timestamps, labels, disabled text (slate-400) |
| `--color-text-inverse` | `#FFFFFF` | Text on dark/primary backgrounds |
| `--color-text-link` | `#6366F1` | Inline links (matches primary) |

### Border Colors

| Token | Hex | Usage |
|---|---|---|
| `--color-border` | `#E2E8F0` | Default borders (slate-200) |
| `--color-border-light` | `#F1F5F9` | Subtle dividers (slate-100) |
| `--color-border-focus` | `#6366F1` | Input focus rings |
| `--color-border-glass` | `rgba(255, 255, 255, 0.30)` | Glass card borders |

### Semantic / Status Colors

| Token | Hex | Badge Bg | Usage |
|---|---|---|---|
| `--color-success` | `#10B981` | `#ECFDF5` | Active, ready, completed |
| `--color-warning` | `#F59E0B` | `#FFFBEB` | Pending, processing |
| `--color-error` | `#EF4444` | `#FEF2F2` | Failed, suspended, destructive |
| `--color-info` | `#3B82F6` | `#EFF6FF` | Information, tips |

### Admin Accent (Superadmin Portal)

| Token | Hex | Usage |
|---|---|---|
| `--color-admin-accent` | `#8B5CF6` | Purple accent for admin portal |
| `--color-admin-accent-light` | `#F5F3FF` | Admin badge backgrounds |
| `--color-admin-accent-hover` | `#7C3AED` | Admin action hover |

---

## Typography

### Font Families

| Token | Font | Weight Range | Usage |
|---|---|---|---|
| `--font-sans` | **Inter** (Google Fonts) | 400, 500, 600, 700 | All UI text |
| `--font-mono` | **JetBrains Mono** (Google Fonts) | 400, 500 | Code blocks, API keys, embed snippets |

### Font Loading (Next.js)

```typescript
// lib/fonts.ts
import { Inter, JetBrains_Mono } from 'next/font/google';

export const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

export const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
  weight: ['400', '500'],
});
```

### Type Scale & Hierarchy

| Level | Element | Size | Weight | Line Height | Letter Spacing | Color |
|---|---|---|---|---|---|---|
| **Display** | Hero heading | `48px` / `3rem` | 700 (Bold) | 1.1 | `-0.02em` | `text-primary` |
| **H1** | Page title | `30px` / `1.875rem` | 700 (Bold) | 1.2 | `-0.015em` | `text-primary` |
| **H2** | Section title | `24px` / `1.5rem` | 600 (Semibold) | 1.3 | `-0.01em` | `text-primary` |
| **H3** | Card title | `18px` / `1.125rem` | 600 (Semibold) | 1.4 | `normal` | `text-primary` |
| **H4** | Subsection | `16px` / `1rem` | 600 (Semibold) | 1.5 | `normal` | `text-primary` |
| **Body** | Paragraph text | `14px` / `0.875rem` | 400 (Regular) | 1.6 | `normal` | `text-secondary` |
| **Body Small** | Descriptions | `13px` / `0.8125rem` | 400 (Regular) | 1.5 | `normal` | `text-secondary` |
| **Caption** | Labels, timestamps | `12px` / `0.75rem` | 500 (Medium) | 1.4 | `0.01em` | `text-tertiary` |
| **Overline** | Badge text, category | `11px` / `0.6875rem` | 600 (Semibold) | 1.3 | `0.05em` | `text-tertiary` (uppercase) |
| **Code** | API keys, snippets | `13px` / `0.8125rem` | 400 (Regular) | 1.5 | `0` | `text-primary` (mono) |

### Heading Usage by Page

| Page | H1 | H2 | H3 |
|---|---|---|---|
| Landing `/` | "Deploy AI Chatbots in Minutes" | Feature sections | Feature cards |
| Login `/login` | "Welcome Back" | — | — |
| Dashboard `/dashboard` | "Dashboard" | "Recent Documents", "Quick Actions" | StatsCard titles |
| Documents `/dashboard/documents` | "Knowledge Base" | — | Document titles |
| Chat Playground | "Chat Playground" | — | Session labels |
| Settings `/dashboard/settings` | "Settings & Embed" | "Company Profile", "API Key", "Widget Embed" | — |
| Admin Brands `/admin/brands` | "Client Brands" | — | Brand names |
| Brand Detail `/admin/brands/:id` | Brand name | "Documents", "Chat Sessions", "Actions" | — |

---

## Glassmorphism & Effects

### Glass Card Effect

```css
.glass-card {
  background: rgba(255, 255, 255, 0.70);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.30);
  border-radius: 16px;
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.04),
    0 4px 16px rgba(0, 0, 0, 0.03);
}

.glass-card-elevated {
  background: rgba(255, 255, 255, 0.80);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.40);
  border-radius: 20px;
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.06),
    0 8px 32px rgba(0, 0, 0, 0.04);
}
```

### Sidebar Glass

```css
.glass-sidebar {
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border-right: 1px solid rgba(226, 232, 240, 0.60);
}
```

### Topbar Glass

```css
.glass-topbar {
  background: rgba(248, 250, 252, 0.80);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(226, 232, 240, 0.50);
}
```

### Modal Backdrop

```css
.modal-overlay {
  background: rgba(15, 23, 42, 0.40);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}
```

### Input Focus Glow

```css
.input-focus-glow:focus {
  outline: none;
  border-color: var(--color-border-focus);
  box-shadow:
    0 0 0 3px rgba(99, 102, 241, 0.12),
    0 1px 2px rgba(0, 0, 0, 0.05);
}
```

### Button Hover Glow

```css
.btn-primary:hover {
  box-shadow:
    0 4px 14px rgba(99, 102, 241, 0.35),
    0 0 0 1px rgba(99, 102, 241, 0.15);
  transform: translateY(-1px);
}

.btn-primary:active {
  transform: translateY(0px) scale(0.98);
}
```

---

## Spacing Scale

| Token | Value | Usage |
|---|---|---|
| `--space-0.5` | `2px` | Micro gaps |
| `--space-1` | `4px` | Icon padding, tight gaps |
| `--space-1.5` | `6px` | Badge padding |
| `--space-2` | `8px` | Small gaps, inline spacing |
| `--space-3` | `12px` | Input padding, card inner spacing |
| `--space-4` | `16px` | Standard component gap |
| `--space-5` | `20px` | Section padding |
| `--space-6` | `24px` | Card body padding |
| `--space-8` | `32px` | Section margins |
| `--space-10` | `40px` | Large section spacing |
| `--space-12` | `48px` | Page-level padding |
| `--space-16` | `64px` | Hero section spacing |
| `--space-20` | `80px` | Major section breaks |

---

## Border Radius Scale

| Token | Value | Usage |
|---|---|---|
| `--radius-xs` | `4px` | Small badges, toggles |
| `--radius-sm` | `6px` | Inputs, small buttons |
| `--radius-md` | `10px` | Buttons, dropdowns |
| `--radius-lg` | `16px` | Cards, modals |
| `--radius-xl` | `20px` | Elevated glass cards |
| `--radius-2xl` | `24px` | Hero sections, feature cards |
| `--radius-full` | `9999px` | Pills, avatars, circular elements |

---

## Shadow Scale

| Token | Value | Usage |
|---|---|---|
| `--shadow-xs` | `0 1px 2px rgba(0,0,0,0.04)` | Inputs, subtle elevation |
| `--shadow-sm` | `0 1px 3px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.03)` | Cards at rest |
| `--shadow-md` | `0 4px 12px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.04)` | Elevated cards, dropdowns |
| `--shadow-lg` | `0 8px 30px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.04)` | Modals, popovers |
| `--shadow-glow-primary` | `0 0 20px rgba(99,102,241,0.20)` | Primary button hover glow |
| `--shadow-glow-success` | `0 0 12px rgba(16,185,129,0.25)` | Active status glow |
| `--shadow-glow-error` | `0 0 12px rgba(239,68,68,0.25)` | Error state glow |

---

## Animations & Transitions

### Transition Timing

| Token | Value | Usage |
|---|---|---|
| `--transition-fast` | `120ms cubic-bezier(0.4, 0, 0.2, 1)` | Button press, toggles |
| `--transition-base` | `200ms cubic-bezier(0.4, 0, 0.2, 1)` | Hovers, color transitions |
| `--transition-slow` | `350ms cubic-bezier(0.4, 0, 0.2, 1)` | Sidebar expand, modals |
| `--transition-spring` | `500ms cubic-bezier(0.34, 1.56, 0.64, 1)` | Scale bounces, toast entry |

### Keyframe Animations

```css
/* Fade in — page entry, list items */
@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

/* Slide up — cards, toasts, modals */
@keyframes slideUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Slide down — dropdowns, tooltips */
@keyframes slideDown {
  from { opacity: 0; transform: translateY(-8px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Slide in from left — sidebar items, staggered lists */
@keyframes slideInLeft {
  from { opacity: 0; transform: translateX(-20px); }
  to   { opacity: 1; transform: translateX(0); }
}

/* Slide in from right — side panels, detail views */
@keyframes slideInRight {
  from { opacity: 0; transform: translateX(20px); }
  to   { opacity: 1; transform: translateX(0); }
}

/* Scale in — modals, cards on mount */
@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.95); }
  to   { opacity: 1; transform: scale(1); }
}

/* Pulse — loading, processing status */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.5; }
}

/* Shimmer — skeleton loading placeholders */
@keyframes shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

/* Spin — loading spinners */
@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Float — decorative background orbs */
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50%      { transform: translateY(-20px); }
}

/* Glow pulse — status indicators */
@keyframes glowPulse {
  0%, 100% { box-shadow: 0 0 4px rgba(99,102,241,0.3); }
  50%      { box-shadow: 0 0 16px rgba(99,102,241,0.5); }
}

/* Typing dots — chat loading */
@keyframes typingDots {
  0%, 60%, 100% { opacity: 0; transform: translateY(0); }
  30%           { opacity: 1; transform: translateY(-4px); }
}
```

### Animation Utility Classes

```css
.animate-fade-in       { animation: fadeIn 400ms ease-out both; }
.animate-slide-up      { animation: slideUp 400ms ease-out both; }
.animate-slide-down    { animation: slideDown 250ms ease-out both; }
.animate-slide-in-left { animation: slideInLeft 400ms ease-out both; }
.animate-scale-in      { animation: scaleIn 300ms ease-out both; }
.animate-shimmer       { animation: shimmer 2s infinite linear;
                         background: linear-gradient(90deg,
                           var(--color-bg-body) 25%,
                           rgba(255,255,255,0.6) 50%,
                           var(--color-bg-body) 75%);
                         background-size: 200% 100%; }
.animate-float         { animation: float 6s ease-in-out infinite; }
```

### Staggered Entry (Lists / Grids)

Use `animation-delay` for staggered child animations:
```css
.stagger-item:nth-child(1) { animation-delay: 0ms; }
.stagger-item:nth-child(2) { animation-delay: 60ms; }
.stagger-item:nth-child(3) { animation-delay: 120ms; }
.stagger-item:nth-child(4) { animation-delay: 180ms; }
.stagger-item:nth-child(5) { animation-delay: 240ms; }
/* ... */
```

---

## Background Effects

### Page Background Pattern (subtle mesh gradient)

```css
body {
  background-color: var(--color-bg-page);
  background-image:
    radial-gradient(at 20% 20%, rgba(99, 102, 241, 0.05) 0%, transparent 50%),
    radial-gradient(at 80% 80%, rgba(139, 92, 246, 0.04) 0%, transparent 50%),
    radial-gradient(at 50% 0%, rgba(59, 130, 246, 0.03) 0%, transparent 50%);
  background-attachment: fixed;
}
```

### Floating Gradient Orbs (Landing/Auth pages)

```css
.bg-orb-1 {
  position: fixed;
  width: 600px; height: 600px;
  background: radial-gradient(circle, rgba(99,102,241,0.10), transparent 70%);
  border-radius: 50%;
  filter: blur(80px);
  top: -100px; left: -100px;
  animation: float 8s ease-in-out infinite;
  pointer-events: none;
  z-index: 0;
}

.bg-orb-2 {
  position: fixed;
  width: 500px; height: 500px;
  background: radial-gradient(circle, rgba(139,92,246,0.08), transparent 70%);
  border-radius: 50%;
  filter: blur(80px);
  bottom: -80px; right: -80px;
  animation: float 10s ease-in-out infinite reverse;
  pointer-events: none;
  z-index: 0;
}
```

### Noise Texture Overlay (subtle grain)

```css
.noise-overlay::before {
  content: '';
  position: fixed;
  inset: 0;
  opacity: 0.025;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  pointer-events: none;
  z-index: 0;
}
```

---

## Component Visual Hierarchy

### Z-Index Scale

| Token | Value | Usage |
|---|---|---|
| `--z-base` | `0` | Regular content |
| `--z-card` | `1` | Cards, elevated surfaces |
| `--z-dropdown` | `10` | Dropdowns, context menus |
| `--z-sticky` | `20` | Sticky headers, sidebars |
| `--z-topbar` | `30` | Top navigation bar |
| `--z-sidebar` | `35` | Sidebar (above topbar on mobile) |
| `--z-modal` | `40` | Modal overlays |
| `--z-toast` | `50` | Toast notifications (always on top) |
| `--z-tooltip` | `60` | Tooltips |

### Visual Weight Hierarchy (Page Layout)

```
┌──────────────────────────────────────────────────────────────────────┐
│  TOPBAR (z-30, glass-topbar, fixed)                                  │
│  ┌───────────┬───────────────────────────────────────────────────────┐│
│  │           │                                                       ││
│  │  SIDEBAR  │   PAGE CONTENT                                        ││
│  │  (z-35,   │   ┌─────────────────────────────────────────────────┐ ││
│  │  glass)   │   │  PAGE HEADER (H1 + description + action btn)    │ ││
│  │           │   ├─────────────────────────────────────────────────┤ ││
│  │  [Nav]    │   │  STATS GRID (glass-card × 4)                    │ ││
│  │  [Nav]    │   ├─────────────────────────────────────────────────┤ ││
│  │  [Nav]    │   │  MAIN CONTENT (glass-card-elevated)             │ ││
│  │  [Nav]    │   │   ┌───────────────────────────────────────────┐ │ ││
│  │           │   │   │  TABLE / LIST / FORM / CHAT               │ │ ││
│  │           │   │   └───────────────────────────────────────────┘ │ ││
│  │  [User]   │   └─────────────────────────────────────────────────┘ ││
│  │  [Logout] │                                                       ││
│  └───────────┴───────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────────┘
```

### Information Density Levels

| Level | Applied To | Characteristics |
|---|---|---|
| **Hero** | Landing page hero | Large text, generous padding (80px+), dramatic gradients |
| **Spacious** | Dashboard overview, settings | 24–32px card padding, ample whitespace between sections |
| **Standard** | Document list, brand table | 16–24px padding, compact but readable rows |
| **Dense** | Chat messages, source chunks | 12–16px padding, tight line height, max content visibility |

---

## Responsive Breakpoints

| Breakpoint | Width | Sidebar | Layout Adjustments |
|---|---|---|---|
| **Mobile** | `< 640px` | Hidden (hamburger toggle) | Single column, stacked cards |
| **Tablet** | `640px – 1023px` | Collapsed (icons only, 64px) | 2-column grid where possible |
| **Desktop** | `1024px – 1279px` | Full width (260px) | Standard layout |
| **Wide** | `≥ 1280px` | Full width (260px) | Max-width 1280px centered |
