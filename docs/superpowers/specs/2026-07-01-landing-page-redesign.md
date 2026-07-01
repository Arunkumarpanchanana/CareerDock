# Landing Page Redesign — Anchor Precision

**Date:** 2026-07-01
**Status:** Approved design

## Overview

Replace the existing Apple-inspired landing page at `/` with the Anchor Precision design system. The landing page becomes a standalone design — protected pages (dashboard, resume, etc.) keep their existing dark/light theme system.

## Brand & Style

Pillars: **Authority, Momentum, Clarity.** Corporate/modern with utility-first principles. The blue palette establishes trust and hierarchy; the green accent signals growth and success.

### Target Emotional Response

- **Confidence** — "This tool understands the professional landscape."
- **Control** — "My applications are organized and trackable."
- **Focus** — "The interface removes noise, allowing me to focus on my goals."

## Color Palette

Landing page always uses these light-mode values:

| Token | Hex | Usage |
|---|---|---|
| `navy-900` | `#001B3D` | Headlines, CTA background, nav text |
| `blue-600` | `#0052FF` | Primary buttons, links, badges |
| `blue-400` | `#60A5FA` | Step labels, secondary accents |
| `blue-100` | `#DBEAFE` | Badge backgrounds, light fills |
| `surface` | `#f8f9ff` | Page background (hero, features) |
| `surface-faint` | `#F8FAFC` | Trust bar, steps sections |
| `on-surface` | `#0b1c30` | Body text |
| `on-surface-variant` | `#434656` | Secondary body text |
| `outline` | `#737688` | Tertiary text, metadata |
| `growth-green` | `#0E833E` | Feature card icons, success indicators |
| `white` | `#FFFFFF` | Card backgrounds, nav background |
| `status-info` | `#0052FF` | Info indicators |

## Typography

| Style | Font | Size | Weight | Line Height | Letter Spacing |
|---|---|---|---|---|---|
| display-xl (hero H1) | Hanken Grotesk | 64px → 32px mobile | 800 | 1.1 | -0.02em |
| headline-lg (section H2) | Hanken Grotesk | 40px → 32px mobile | 700 | 1.2 | -0.01em |
| headline-md (card H3) | Hanken Grotesk | 24px → 20px mobile | 600 | 1.3 | — |
| body-lg (hero subtitle) | Inter | 18px → 16px mobile | 400 | 1.6 | — |
| body-md (card text) | Inter | 16px | 400 | 1.5 | — |
| label-caps (badge/step) | JetBrains Mono | 11px | 600 | 1 | 0.05em |
| stat-number (metrics) | Hanken Grotesk | 48px | 800 | 1 | — |

### Font Loading

Add to `layout.tsx` via `next/font/google`:

- `Hanken_Grotesk` — weights 600, 700, 800
- `Inter` — weight 400, 600
- `JetBrains_Mono` — weight 600

Geist and Geist Mono remain for protected pages. The landing page uses CSS variables to switch fonts.

## Layout

- **Desktop:** 1280px max-width container, 12-column grid
- **Mobile:** 16px margin sides, full-width stacking
- **Vertical rhythm:** 120px section gap desktop, 64px mobile

### Page Sections (in order)

1. **Navigation** — fixed, white, 16px gutter
2. **Hero** — full-width, surface background, centered
3. **Trust Bar** — surface-faint, 4-col→2-col mobile
4. **Features** — 3-col→1-col, white cards with ambient shadow
5. **How It Works (3 steps)** — surface-faint, 3-col→1-col
6. **Testimonial** — centered, star ratings, circular avatars
7. **CTA** — navy-900 background, centered
8. **Footer** — surface-faint, minimal

## Spacing

| Token | Value |
|---|---|
| container-max | 1280px |
| gutter | 24px |
| margin-mobile | 16px |
| section-gap-lg | 120px |
| section-gap-sm | 64px |

## Rounded Corners

| Token | Value | Usage |
|---|---|---|
| sm | 0.25rem | — |
| DEFAULT | 0.5rem | Cards, inputs |
| md | 0.75rem | — |
| lg | 1rem | Buttons |
| xl | 1.5rem | — |
| full | 9999px | Avatars |

## Components

### Navigation

- Fixed header, z-50
- White background, `blue-100` bottom border when scrolled
- Logo left (`.h-10 w-auto`)
- "Sign In" — ghost with `navy-900` text + border, `rounded-lg`
- "Get Started" — `blue-600` fill, white text, `rounded-lg`
- Mobile: same layout, smaller hit areas

### Hero

- **Badge:** `blue-100` background pill, JetBrains Mono label in `blue-600`
- **H1:** Hanken Grotesk 800, `navy-900`, `blue-600` accent span
- **Subtitle:** Inter, `on-surface-variant`
- **Primary CTA:** `blue-600` filled, `rounded-lg`, white text
- **Secondary CTA:** `navy-900` border, `rounded-lg`
- **Stats:** Hanken Grotesk 48px 800 for numbers, small Inter label below

### Trust Bar

- `surface-faint` background
- 4-column grid (2-column on tablet, 1-column on mobile)
- Stat numbers in Hanken Grotesk 48px 800
- Label in small Inter text

### Feature Cards

- White background, `rounded` (0.5rem), ambient shadow
- Grid: 3 columns desktop, 2 columns tablet, 1 column mobile
- Each card: green accent icon container, headline-md title, body-md description
- Hover: slight shadow increase (higher opacity)

### How It Works (3 Steps)

- `surface-faint` background
- 3-column grid
- Per step: numbered circle badge `blue-600`, headline, description
- **No** background numerals (per user feedback)

### Testimonial

- Centered blockquote
- Star ratings (5 gold stars)
- Circular avatar group (3 overlapping)
- "Join 10K+ job seekers" label

### CTA

- `navy-900` background
- White headline
- `blue-600` primary button, `rounded-lg`
- Blue-400 checkmark list (no credit card, cancel anytime, free updates)

### Footer

- `surface-faint` background
- Logo + brand name left, copyright right
- Centered on mobile

## Implementation Plan

### File Changes

1. **`src/app/layout.tsx`** — Add Hanken Grotesk, Inter, JetBrains Mono via next/font
2. **`src/app/globals.css`** — Add Anchor Precision colors to `@theme inline`
3. **`src/app/page.tsx`** — Complete rewrite with new design

### Tailwind v4 Theme

Add to `globals.css` `@theme inline` block:

```css
--color-navy-900: #001B3D;
--color-blue-600: #0052FF;
--color-blue-400: #60A5FA;
--color-blue-100: #DBEAFE;
--color-surface: #f8f9ff;
--color-surface-faint: #F8FAFC;
--color-on-surface: #0b1c30;
--color-on-surface-variant: #434656;
--color-outline: #737688;
--color-growth-green: #0E833E;
```

### CSS Variables

Define Anchor Precision as CSS custom properties scoped to the landing page (`.anchor-precision` class on the landing page wrapper). Protected pages unaffected.

### Animation

- Scroll-triggered fade-in-up on sections (existing `useInView` hook pattern)
- Card hover: slight shadow increase
- No heavy animations — priority on professional, clean feel

### Mobile Breakpoints

- `sm:` (640px): 2-col grids
- `md:` (768px): tablet adjustments
- `lg:` (1024px): 3/4-col desktops
- Sizes use margin-mobile (16px) on smallest screens

## What's NOT Changed

- Protected pages (`/(protected)/*`) keep their existing dark/light theme
- Auth pages use their existing styling
- No changes to components outside the landing page
- Theme toggle remains available on protected pages
