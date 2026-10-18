# 07 — Design Refresh Plan

> **Status:** Planning — approved before execution.
> Overrides `02-design-system.md` wherever they conflict.

---

## Overview of Changes

| # | Area | Summary |
|---|---|---|
| 1 | **Color Palette** | Beige `#DDD0C8` + Dark Grey `#323232`. Remove all pure white backgrounds. |
| 2 | **Border Radius** | Hard-cap at `rounded-md` (8px). Only `rounded-full` on avatar/status dots. |
| 3 | **Icon Library** | Install `react-icons`. Use Phosphor Light set (`react-icons/pi`) everywhere. |
| 4 | **Logo** | DiceBear bot avatar + "BotForge" wordmark via `next/image`. |
| 5 | **Glassmorphism v2** | Dark warm background. Glass cards float over deep charcoal-beige gradient. |
| 6 | **Login Page** | Split-panel: left branding + right form. |

---

## 1. Color Palette

### Philosophy

Warm, premium, editorial. Beige (#DDD0C8) and Dark Grey (#323232) as brand colors on a deep warm dark background. Glass cards will visually pop because they sit over a rich dark gradient (like the reference image — same principle as blue background + frosted card).

### Primary Brand Colors

| Token | Hex | Usage |
|---|---|---|
| `--color-primary` | `#323232` | Primary buttons, headings, sidebar active text |
| `--color-primary-hover` | `#1a1a1a` | Hover on primary elements |
| `--color-primary-light` | `#4a4a4a` | Icons, secondary labels |
| `--color-accent` | `#DDD0C8` | Accent badge bg, selected states, border highlight |
| `--color-accent-dark` | `#C4B4A8` | Hover on accent, secondary text |
| `--color-accent-muted` | `#EDE4DF` | Very light accent tint |

### Background / Surface Colors (Dark Theme)

| Token | Hex | Usage |
|---|---|---|
| `--color-bg-page` | `#1E1A17` | Page background (deep warm brown) |
| `--color-bg-alt` | `#2B2420` | Content area backgrounds |
| `--color-bg-panel` | `#232020` | Right panels, form backgrounds |
| `--color-bg-card` | `rgba(221,208,200,0.12)` | Glass card surface |
| `--color-bg-card-elevated` | `rgba(237,228,223,0.18)` | Elevated glass (modals, panels) |
| `--color-bg-sidebar` | `rgba(30,26,23,0.80)` | Sidebar glass |
| `--color-bg-topbar` | `rgba(30,26,23,0.88)` | Topbar glass |
| `--color-bg-input` | `rgba(221,208,200,0.08)` | Input field (dark glass) |
| `--color-bg-hover` | `rgba(221,208,200,0.10)` | Hover tint |
| `--color-bg-active` | `rgba(221,208,200,0.20)` | Active/selected state |
| `--color-bg-modal-overlay` | `rgba(14,11,8,0.65)` | Modal backdrop |

### Text Colors

| Token | Hex | Usage |
|---|---|---|
| `--color-text-primary` | `#F5EDE8` | Headings, primary body (warm white) |
| `--color-text-secondary` | `#C4B4A8` | Descriptions, secondary text |
| `--color-text-tertiary` | `#7A6E68` | Timestamps, labels, disabled |
| `--color-text-inverse` | `#323232` | Text on beige/light elements |
| `--color-text-link` | `#DDD0C8` | Links |

### Border Colors

| Token | Hex | Usage |
|---|---|---|
| `--color-border` | `rgba(221,208,200,0.20)` | Default glass borders |
| `--color-border-strong` | `rgba(221,208,200,0.40)` | Inputs, table rows |
| `--color-border-focus` | `#DDD0C8` | Input focus ring (beige glow) |
| `--color-border-glass` | `rgba(255,248,245,0.25)` | Glass highlight border (top-left) |

### Status Colors (for badges — warm-tinted)

| Status | Text Color | Badge Background | Border |
|---|---|---|---|
| success | `#4ADE80` | `rgba(74,222,128,0.15)` | `rgba(74,222,128,0.30)` |
| warning | `#FCD34D` | `rgba(252,211,77,0.15)` | `rgba(252,211,77,0.30)` |
| error | `#F87171` | `rgba(248,113,113,0.15)` | `rgba(248,113,113,0.30)` |
| info | `#60A5FA` | `rgba(96,165,250,0.15)` | `rgba(96,165,250,0.30)` |
| neutral | `#C4B4A8` | `rgba(221,208,200,0.12)` | `rgba(221,208,200,0.25)` |

---

## 2. Border Radius — Hard Cap

> **Rule: `rounded-md` (8px) is the maximum. No `rounded-lg`, `rounded-xl`, `rounded-2xl`.**
> Exception: `rounded-full` for avatar circles and status dot indicators only.

### Replacement Map

| Remove | Replace With |
|---|---|
| `rounded-lg` | `rounded-md` |
| `rounded-xl` | `rounded-md` |
| `rounded-2xl` | `rounded-md` |
| `rounded-3xl` | `rounded-md` |
| `rounded-full` on buttons/cards | `rounded-md` |
| `rounded-full` on avatar/dots | KEEP as-is |

### Tailwind Config

```js
borderRadius: {
  'xs':   '2px',
  'sm':   '4px',
  'md':   '8px',      // MAXIMUM for containers
  'full': '9999px',   // avatars and dots ONLY
}
```

---

## 3. Icons — React Icons (Phosphor)

### Installation

```bash
npm install react-icons
```

### Icon Set

Primary: **Phosphor Light** — import from `react-icons/pi` (prefix: `Pi`, suffix: `Light`).

### Full Replacement Map

| Component / Location | Old | New Import |
|---|---|---|
| Sidebar — Overview | inline SVG | `PiHouseLight` |
| Sidebar — Documents | inline SVG | `PiFilesLight` |
| Sidebar — Chat Playground | inline SVG | `PiChatCircleDotsLight` |
| Sidebar — Widget Embed | inline SVG | `PiCodeLight` |
| Sidebar — Settings | inline SVG | `PiGearLight` |
| Sidebar — Logout | inline SVG | `PiSignOutLight` |
| Topbar — Hamburger | inline SVG | `PiListLight` |
| Topbar — Search | none | `PiMagnifyingGlassLight` |
| Topbar — Notifications | none | `PiBellLight` |
| Modal — Close button | inline SVG | `PiXLight` |
| Input — Password toggle | inline SVG | `PiEyeLight` / `PiEyeSlashLight` |
| Login — Email field icon | none | `PiEnvelopeLight` |
| Login — Password field icon | none | `PiLockLight` |
| Login — Security badge | none | `PiShieldCheckLight` |
| Upload — PDF tab | emoji/text | `PiFilePdfLight` |
| Upload — URL tab | emoji/text | `PiLinkLight` |
| Upload — FAQ tab | emoji/text | `PiChatTextLight` |
| Document status — ready | inline SVG / text | `PiCheckCircleLight` |
| Document status — failed | inline SVG / text | `PiWarningCircleLight` |
| Document status — pending | inline SVG / text | `PiClockLight` |
| Document — delete action | inline SVG | `PiTrashLight` |
| CopyButton — idle | inline SVG | `PiCopyLight` |
| CopyButton — copied | inline SVG | `PiCheckLight` |
| EmptyState — default | inline SVG | `PiInboxLight` |
| BrandTable — Inspect | inline SVG | `PiEyeLight` |
| BrandTable — Delete | inline SVG | `PiTrashLight` |
| Admin — Onboard | inline SVG | `PiPlusCircleLight` |
| Chat — Send button | inline SVG | `PiPaperPlaneRightLight` |
| Chat — Sources | inline SVG | `PiBookOpenLight` |
| Settings — API Key | inline SVG | `PiKeyLight` |
| Toast — Success | inline SVG | `PiCheckCircleLight` |
| Toast — Error | inline SVG | `PiXCircleLight` |
| Toast — Warning | inline SVG | `PiWarningLight` |
| Toast — Info | inline SVG | `PiInfoLight` |
| Stats — Chunks | none | `PiCubeLight` |
| Stats — Health | none | `PiShieldCheckLight` |
| Stats — Queue | none | `PiArrowsClockwiseLight` |
| Stats — Documents | none | `PiFileTextLight` |
| QuickActions — Upload | none | `PiUploadSimpleLight` |
| QuickActions — Chat | none | `PiChatCircleDotsLight` |
| QuickActions — Embed | none | `PiCodeLight` |
| QuickActions — Settings | none | `PiSlidersLight` |

### Sizing Standards

| Context | Size |
|---|---|
| Sidebar nav items | `size={20}` |
| Button icons (sm button) | `size={14}` |
| Button icons (md button) | `size={16}` |
| Input left/right icons | `size={16}` |
| Toast / badge icons | `size={15}` |
| StatsCard icons | `size={22}` |
| EmptyState icon | `size={36}` |
| Login decorative | `size={18}` |

---

## 4. Logo Component

### Spec

- **Type:** `next/image` with DiceBear remote URL
- **Avatar style:** `bottts-neutral` (robot face, matches BotForge brand)
- **Background:** `#323232` (dark grey) inside the avatar box
- **Shape:** `rounded-md` (8px) square container, NOT circular
- **Wordmark:** "BotForge" in `font-bold text-sm text-[#F5EDE8]`

### Logo URL

```
https://api.dicebear.com/9.x/bottts-neutral/svg?seed=botforge&backgroundColor=323232&scale=80
```

### Component Code

```tsx
// src/components/layout/Logo.tsx
"use client";
import Image from "next/image";
import Link from "next/link";

interface LogoProps {
  collapsed?: boolean;
  size?: "sm" | "md";
}

export const Logo = ({ collapsed = false, size = "md" }: LogoProps) => {
  const dim = size === "sm" ? 28 : 32;
  return (
    <Link href="/" className="flex items-center gap-2.5 group shrink-0">
      <div
        style={{ width: dim, height: dim }}
        className="relative rounded-md overflow-hidden shrink-0 bg-[#323232]"
      >
        <Image
          src="https://api.dicebear.com/9.x/bottts-neutral/svg?seed=botforge&backgroundColor=323232&scale=80"
          alt="BotForge"
          fill
          className="object-cover"
          unoptimized
        />
      </div>
      {!collapsed && (
        <span className="text-sm font-bold tracking-tight text-[#F5EDE8] group-hover:text-[#DDD0C8] transition-colors">
          BotForge
        </span>
      )}
    </Link>
  );
};
```

### Remote Image Domain Config (`next.config.mjs`)

```js
images: {
  remotePatterns: [
    { protocol: "https", hostname: "api.dicebear.com" }
  ]
}
```

---

## 5. Glassmorphism v2 — Dark Frosted Glass

### Principle

Reference image shows: frosted semi-transparent card over a deep blue swirling background with glow orbs. We replicate this with warm tones: deep charcoal-brown background + warm beige glow orbs + translucent beige glass cards.

### Page Background (`bg-mesh`)

```css
.bg-mesh {
  background-color: #1E1A17;
  background-image:
    radial-gradient(ellipse at 15% 20%, rgba(221,208,200,0.14) 0%, transparent 55%),
    radial-gradient(ellipse at 85% 75%, rgba(196,180,168,0.08) 0%, transparent 50%),
    radial-gradient(ellipse at 50% 100%, rgba(50,50,50,0.40) 0%, transparent 60%);
  background-attachment: fixed;
}
```

### Floating Orbs

```css
.bg-orb-1 {
  position: fixed;
  width: 700px; height: 700px;
  background: radial-gradient(circle, rgba(221,208,200,0.20), transparent 65%);
  border-radius: 50%;
  filter: blur(100px);
  top: -150px; left: -100px;
  animation: float 9s ease-in-out infinite;
  pointer-events: none;
  z-index: 0;
}

.bg-orb-2 {
  position: fixed;
  width: 550px; height: 550px;
  background: radial-gradient(circle, rgba(196,180,168,0.16), transparent 65%);
  border-radius: 50%;
  filter: blur(90px);
  bottom: -100px; right: -80px;
  animation: float 12s ease-in-out infinite reverse;
  pointer-events: none;
  z-index: 0;
}
```

### Glass Card Styles

```css
/* Standard glass card */
.glass-card {
  background: rgba(221, 208, 200, 0.12);
  backdrop-filter: blur(20px) saturate(150%);
  -webkit-backdrop-filter: blur(20px) saturate(150%);
  border: 1px solid rgba(255, 248, 245, 0.18);
  border-top-color: rgba(255, 248, 245, 0.35);   /* light reflection at top */
  border-left-color: rgba(255, 248, 245, 0.28);  /* light reflection at left */
  border-radius: 8px;
  box-shadow:
    0 2px 4px rgba(0,0,0,0.30),
    0 8px 32px rgba(0,0,0,0.25),
    inset 0 1px 0 rgba(255,248,245,0.15);
}

/* Elevated glass card (modals, detail panels) */
.glass-card-elevated {
  background: rgba(237, 228, 223, 0.18);
  backdrop-filter: blur(28px) saturate(160%);
  -webkit-backdrop-filter: blur(28px) saturate(160%);
  border: 1px solid rgba(255, 248, 245, 0.28);
  border-top-color: rgba(255, 248, 245, 0.45);
  border-left-color: rgba(255, 248, 245, 0.38);
  border-radius: 8px;
  box-shadow:
    0 4px 12px rgba(0,0,0,0.35),
    0 16px 48px rgba(0,0,0,0.28),
    inset 0 1px 0 rgba(255,248,245,0.20);
}

/* Sidebar */
.glass-sidebar {
  background: rgba(30, 26, 23, 0.82);
  backdrop-filter: blur(24px) saturate(130%);
  -webkit-backdrop-filter: blur(24px) saturate(130%);
  border-right: 1px solid rgba(221, 208, 200, 0.15);
}

/* Topbar */
.glass-topbar {
  background: rgba(30, 26, 23, 0.90);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(221, 208, 200, 0.12);
}

/* Modal overlay */
.modal-overlay {
  background: rgba(14, 11, 8, 0.65);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}
```

### Input Field (Glass Style)

```css
.glass-input {
  background: rgba(221, 208, 200, 0.08);
  border: 1px solid rgba(221, 208, 200, 0.25);
  border-radius: 8px;
  color: #F5EDE8;
  transition: all 0.15s ease;
}
.glass-input:hover {
  border-color: rgba(221, 208, 200, 0.40);
}
.glass-input:focus {
  outline: none;
  border-color: rgba(221, 208, 200, 0.65);
  background: rgba(221, 208, 200, 0.12);
  box-shadow: 0 0 0 3px rgba(221, 208, 200, 0.12);
}
.glass-input::placeholder {
  color: rgba(196, 180, 168, 0.50);
}
```

---

## 6. Button Variants (Updated)

| Variant | Background | Text Color | Hover Background |
|---|---|---|---|
| `primary` | `#323232` | `#F5EDE8` | `#1a1a1a` |
| `accent` | `#DDD0C8` | `#323232` | `#C4B4A8` |
| `secondary` | `rgba(221,208,200,0.12)` | `#DDD0C8` | `rgba(221,208,200,0.22)` |
| `ghost` | `transparent` | `#C4B4A8` | `rgba(221,208,200,0.10)` |
| `danger` | `rgba(248,113,113,0.15)` | `#F87171` | `rgba(248,113,113,0.25)` |

All button border-radius: `rounded-md` only.

---

## 7. Login Page — Split Panel

### Layout Blueprint

```
┌──────────────────────────────────────────────────────────────┐
│  min-h-screen flex bg-[#1E1A17]                              │
│  ┌────────────────────────┬─────────────────────────────┐    │
│  │ LEFT PANEL (lg:w-3/5)  │ RIGHT PANEL (lg:w-2/5)      │    │
│  │ bg: deep warm gradient │ bg: #232020                 │    │
│  │                        │                             │    │
│  │ [orb-1] [orb-2]        │  glass-card-elevated        │    │
│  │                        │  ┌─────────────────────┐    │    │
│  │ [Logo + BotForge]      │  │ [Logo] (mobile only) │    │    │
│  │                        │  │                      │    │    │
│  │ (centered vertically)  │  │ Welcome back         │    │    │
│  │ h1: tagline 48px bold  │  │ Sign in to workspace │    │    │
│  │ p: description         │  │                      │    │    │
│  │ [chips: features]      │  │ [Email input]        │    │    │
│  │                        │  │ [Password input]     │    │    │
│  │ (bottom)               │  │ [Sign In button]     │    │    │
│  │ glass-card preview UI  │  │                      │    │    │
│  │                        │  │ [Shield] JWT secured │    │    │
│  │                        │  └─────────────────────┘    │    │
│  └────────────────────────┴─────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘
Mobile: Stack vertically — short brand header on top, form below.
```

### Left Panel Content

- BotForge `Logo` component (top-left)
- Large tagline: *"Your AI-Powered Customer Intelligence Platform"*
- Subtitle: *"Upload documents, deploy grounded AI chatbots in minutes."*
- Feature chips (glass-card badges): `Qdrant Vector Search`, `LangChain RAG`, `Multi-Tenant`, `1-Line Embed`
- Bottom decorative: Small glass-card mockup showing a chat exchange preview

### Right Panel Content

- `glass-card-elevated` card, centered with `max-w-sm`
- `h2` "Welcome back" + subtitle "Sign in to your workspace"
- Email input with `PiEnvelopeLight` left icon
- Password input with `PiLockLight` left icon + `PiEyeLight` / `PiEyeSlashLight` toggle
- "Sign In →" full-width `primary` button
- Below: `PiShieldCheckLight` + "Secured with JWT Authentication" in tertiary text

---

## 8. CSS Custom Properties (Full Token List)

```css
:root {
  /* Brand */
  --color-primary:           #323232;
  --color-primary-hover:     #1a1a1a;
  --color-primary-light:     #4a4a4a;
  --color-accent:            #DDD0C8;
  --color-accent-dark:       #C4B4A8;
  --color-accent-muted:      #EDE4DF;

  /* Backgrounds */
  --color-bg-page:           #1E1A17;
  --color-bg-alt:            #2B2420;
  --color-bg-panel:          #232020;
  --color-bg-card:           rgba(221,208,200,0.12);
  --color-bg-card-elevated:  rgba(237,228,223,0.18);
  --color-bg-sidebar:        rgba(30,26,23,0.82);
  --color-bg-topbar:         rgba(30,26,23,0.90);
  --color-bg-input:          rgba(221,208,200,0.08);
  --color-bg-hover:          rgba(221,208,200,0.10);
  --color-bg-active:         rgba(221,208,200,0.20);
  --color-bg-modal-overlay:  rgba(14,11,8,0.65);

  /* Text */
  --color-text-primary:      #F5EDE8;
  --color-text-secondary:    #C4B4A8;
  --color-text-tertiary:     #7A6E68;
  --color-text-inverse:      #323232;
  --color-text-link:         #DDD0C8;

  /* Borders */
  --color-border:            rgba(221,208,200,0.20);
  --color-border-strong:     rgba(221,208,200,0.40);
  --color-border-focus:      #DDD0C8;
  --color-border-glass:      rgba(255,248,245,0.25);

  /* Status */
  --color-success:           #4ADE80;
  --color-warning:           #FCD34D;
  --color-error:             #F87171;
  --color-info:              #60A5FA;

  /* Radius — HARD CAP at md (8px) */
  --radius-xs:   2px;
  --radius-sm:   4px;
  --radius-md:   8px;
  --radius-full: 9999px;
}
```

---

## 9. Execution Order (Steps A–W)

| Step | Task | File |
|---|---|---|
| A | `npm install react-icons` | `package.json` |
| B | Update `globals.css` — new vars, glass classes, dark bg-mesh | `src/app/globals.css` |
| C | Update `tailwind.config.ts` — beige/charcoal tokens, radius cap | `tailwind.config.ts` |
| D | Update `next.config.mjs` — allow DiceBear remote image | `next.config.mjs` |
| E | Create `Logo.tsx` | `src/components/layout/Logo.tsx` |
| F | Update `GlassCard.tsx` — dark glass classes | `src/components/ui/GlassCard.tsx` |
| G | Update `Button.tsx` — new variants, `rounded-md` | `src/components/ui/Button.tsx` |
| H | Update `Input.tsx` — glass-input style, Phosphor icons | `src/components/ui/Input.tsx` |
| I | Update `Badge.tsx` — dark-bg status colors | `src/components/ui/Badge.tsx` |
| J | Update `Modal.tsx` — dark glass, `rounded-md` | `src/components/ui/Modal.tsx` |
| K | Update `Toast.tsx` — dark glass, Phosphor icons | `src/components/ui/Toast.tsx` |
| L | Update `EmptyState.tsx` — `PiInboxLight`, dark text | `src/components/ui/EmptyState.tsx` |
| M | Update `Spinner.tsx`, `Skeleton.tsx` — dark shimmer | `src/components/ui/` |
| N | Update `Sidebar.tsx` — Logo component, Phosphor icons, dark glass | `src/components/layout/Sidebar.tsx` |
| O | Update `Topbar.tsx` — dark glass, Phosphor icons | `src/components/layout/Topbar.tsx` |
| P | Update `Navbar.tsx` — Logo, dark nav | `src/components/layout/Navbar.tsx` |
| Q | Rebuild `login/page.tsx` — split-panel layout | `src/app/(auth)/login/page.tsx` |
| R | Update `LoginForm.tsx` — glass inputs, Phosphor icons | `src/components/auth/LoginForm.tsx` |
| S | Sweep pages — replace all `rounded-xl/2xl/3xl` → `rounded-md` | All `page.tsx` |
| T | Sweep components — replace inline SVGs with Phosphor imports | All components |
| U | Update marketing `page.tsx` — dark theme, beige hero | `src/app/(marketing)/page.tsx` |
| V | Update dashboard/admin layouts — dark body background | Layout files |
| W | `npm run build` verification — zero errors | — |

---

## 10. Important Notes

> The dark background is essential for the glassmorphism effect to be visible.
> Do NOT revert to `#F8FAFC` or white page backgrounds anywhere.

> When sweeping rounded classes: keep `rounded-full` ONLY on avatar images and status dot indicators (the small circles inside badges). Remove it from all buttons, cards, inputs, and containers.

> Use `react-icons/pi` Phosphor Light variants throughout. Suffix is `Light` not `Line`. Example: `PiTrashLight`, NOT `PiTrashLine`. Be consistent.

> DiceBear logo URL: `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=botforge&backgroundColor=323232&scale=80`
> Must add `api.dicebear.com` to `next.config.mjs` `remotePatterns`.
