# CareerDock Stitch-Inspired Redesign — Phase 1 Spec

**Date:** 2026-06-21
**Status:** Approved Design
**Approach:** Phased — Phase 1 = Visual Redesign + Career Canvas

---

## 1. Design System

### Color Tokens (CSS Custom Properties)

Defined in `globals.css` as `@theme` tokens and CSS variables.

```css
/* Dark mode (default) */
--bg-primary: #0a0a0f;
--bg-secondary: #12121a;
--bg-tertiary: #1a1a25;
--glass-bg: rgba(255, 255, 255, 0.04);
--glass-border: rgba(255, 255, 255, 0.08);
--glass-glow: rgba(99, 102, 241, 0.15);
--accent: #6366f1;
--accent-hover: #5558e6;
--accent-gradient: linear-gradient(135deg, #6366f1, #8b5cf6);
--text-primary: #f1f1f7;
--text-secondary: #9ca3af;
--text-tertiary: #6b7280;
--success: #10b981;
--warning: #f59e0b;
--danger: #ef4444;
```

### Light Mode Overrides

Toggle via `.light` class on `<html>`:

```css
.light {
  --bg-primary: #f8f9fc;
  --bg-secondary: #ffffff;
  --bg-tertiary: #f1f3f8;
  --glass-bg: rgba(255, 255, 255, 0.7);
  --glass-border: rgba(0, 0, 0, 0.06);
  --text-primary: #0f172a;
  --text-secondary: #475569;
  --text-tertiary: #94a3b8;
}
```

### Visual Patterns

- **Glass panels** — `backdrop-blur-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-2xl shadow-lg`
- **Glow accents** — box-shadow with accent at 15-30% opacity on interactive hover states
- **Gradient text** — indigo-to-violet gradient for headings (`bg-gradient-to-r from-[var(--accent)] to-violet-500 bg-clip-text text-transparent`)
- **Soft borders** — `border-white/10` dark, `border-black/5` light
- **Border radius upgrade** — cards `rounded-2xl`, buttons `rounded-xl`, inputs `rounded-xl`
- **Vibe accent shifting** — accent color shifts based on selected vibe (see Section 7)

---

## 2. Component Library

### Upgraded Components (in `src/components/ui/`)

| Component | Status | Details |
|-----------|--------|---------|
| **Button** | Upgrade | Add `glass` variant (transparent + backdrop-blur + border), `icon` size, gradient variant |
| **Input** | Upgrade | Dark mode aware, `glass` variant for search, accent focus ring |
| **Card** | Keep | Thin wrapper, replaced usage by GlassPanel in most cases |
| **GlassPanel** | **New** | Primary surface component. `backdrop-blur-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-2xl shadow-lg`. Props: `hover` (adds glow), `padding`, `className` |
| **Badge** | **New** | Status tags and labels. Variants: `accent`, `success`, `warning`, `danger`, `neutral` |
| **ThemeToggle** | **New** | Sun/moon icon button. Toggles `dark`/`light` class on `<html>`. Persists to localStorage |
| **VibeChip** | **New** | Selectable pill for vibe mode. Shows glow animation when active. Color shifts with vibe |
| **AnimatedBackground** | **New** | Canvas of floating particles/orbs for hero and canvas pages. Configurable density and colors |

### Component Patterns

- All components exported from `src/components/ui/index.ts`
- Dark mode: components read CSS variables, no manual dark: prefix needed for colors
- Consistent `rounded-xl`/`rounded-2xl`, `transition-all duration-200`, glass effects

---

## 3. Layout & Navigation

### Sidebar

- Glass effect in dark mode (`bg-white/5 backdrop-blur-xl border-r border-white/10`)
- Solid bg in light mode
- Active nav item: accent bg + subtle box-shadow glow
- User profile section at bottom: glass avatar circle, name, role title
- Collapse button aligns with ThemeToggle in footer area

### Theme Toggle

- Bottom of sidebar next to collapse button
- Sun icon in dark mode, moon icon in light mode
- Toggles `dark`/`light` class on `<html>` root
- Persists in `localStorage` key `theme`
- Initial value respects `prefers-color-scheme`

### Mobile Navigation

- Bottom navigation bar (5 primary items) with glass effect
- Replaces the current slide-over drawer
- Active item gets accent glow indicator

### Main Content Area

- Full-width max container with padding (`px-6 lg:px-10`)
- Section headers use accent gradient text
- Background: `var(--bg-primary)` solid with subtle gradient on hero/canvas pages

---

## 4. Landing Page (`/`)

### Hero Section
- Dark background `#0a0a0f` with `AnimatedBackground` particles and indigo glow orbs
- Glass pill badge (sparkle icon + "Land your dream job faster") with accent glow
- Headline: gradient indigo-to-violet text
- Subtitle: `text-[var(--text-secondary)]`
- CTA buttons: primary = gradient glass with glow shadow, secondary = outlined glass
- Stats row: 3 glass mini-panels with count animations

### Features Section
- 4 glass panel cards in grid, hover shows glow + subtle lift
- Icon circles: glass treatment with backdrop-blur

### How It Works
- Connecting line: gradient indigo → violet → pink
- Step numbers: glass circles with glow, step text uses var(--text-primary)

### Trust Stats
- Glass panels with live counter animation
- Dark bg with subtle accent border

### Testimonial
- Glass card with quote icon in accent, star ratings, avatar circles

### CTA
- Full-bleed gradient section with floating glass orbs via AnimatedBackground
- White glass CTA button with accent text
- Feature checklist below

### Footer
- Dark glass with subtle top border glow (`border-t border-white/5`)

---

## 5. Dashboard & Core Pages

### Dashboard (`/dashboard`)
- Welcome header with accent gradient text
- Glass stat cards with glow on hover
- Free plan upgrade banner: glass amber panel (amber accent)
- "Get Started" section: glass card
- ReferralCard: glass treatment

### Core Pages (resume, tracker, jobs, interview, experts, skill-gap, profile, upgrade, admin)
- All `bg-white` → `var(--bg-secondary)` or `GlassPanel`
- All `bg-gray-50` → `var(--bg-primary)`
- All `border-gray-200` → `var(--glass-border)`
- All `text-gray-900` → `var(--text-primary)`
- All `text-gray-600`/`text-gray-500` → `var(--text-secondary)`/`var(--text-tertiary)`
- Status badges (Applied, Interviewing, etc.) → `Badge` component
- Buttons → updated `Button` with glass variant where appropriate
- Forms → updated `Input` with dark mode + glass variant for search fields

### Resume Builder (`/resume`)
- Tabs get glass styling, active tab has accent underline glow
- Section panels (Summary, Experience, Education, etc.) → GlassPanel
- Persona selector and template gallery → glass cards with glow on selection

### Job Search (`/jobs/search`)
- Search bar → glass input with backdrop-blur
- Job cards → GlassPanel with hover glow
- Detail panel → glass sidebar with accent accent

### Tracker (`/tracker`)
- Kanban columns → glass panels
- Cards → smaller GlassPanel with status badge
- Column headers with accent gradient text

---

## 6. Career Canvas Page (`/canvas`)

### Route
- `src/app/(protected)/canvas/page.tsx`
- Client component, full-screen layout (sidebar hidden or collapsed)

### Canvas Workspace
- Full-screen viewport with subtle animated grid background
- `AnimatedBackground` with low-density particles
- Zoom/pan via mouse drag and wheel

### Modules
Draggable, resizable glass panels on the canvas:
- **Resume Snapshot** — summary, skills, current template preview
- **Job Search** — saved searches, result count, recent listings
- **Skill Insights** — gap analysis results, recommended skills
- **Interview Feedback** — recent score, strengths, areas to improve
- **Expert Sessions** — upcoming/booked sessions
- **Vibe Selector** — embedded vibe chips that recolor the canvas

### Agent Manager Sidebar
- Right panel (collapsible, ~240px)
- Lists parallel "paths": e.g., "Frontend Engineer", "ML Engineer", "Product Manager"
- Each path shows: name, active modules count, last updated
- Click switches canvas context (modules rearrange per path)
- "Add Path" button at bottom

### Canvas Toolbar
Floating bottom bar (glass, centered):
- Add Module (+) — dropdown of available module types
- Zoom In / Zoom Out / Fit to View
- Export Canvas — generates CAREER.md
- Clear Canvas

### State Persistence
- Canvas layout (module positions, sizes, open/closed state) saved to `canvas_states` table: `id`, `user_id`, `path_name`, `layout_state` (JSONB), `created_at`, `updated_at`
- Auto-save on module move/resize (debounced 2s)

---

## 7. Vibe System

### Vibe Definitions

| Vibe | Accent Color | Hex | Description |
|------|-------------|-----|-------------|
| Confident | Indigo | `#6366f1` | Bold language, leadership focus |
| Strategic | Emerald | `#10b981` | Data-driven, impact metrics |
| Growth | Amber | `#f59e0b` | Learning-focused, potential emphasis |
| Bold | Rose | `#f43f5e` | Disruptive, innovative language |

### Behavior
- Vibe selector: horizontal row of `VibeChip` components on canvas toolbar + resume page
- Selecting a vibe changes `--accent` CSS variable across the UI
- Canvas glow, button accents, badges shift to vibe color
- Vibe influences AI suggestion prompts (tone, focus areas)
- Persisted in `profiles.vibe` column (database column migration required)

### Vibe-Based Generation
- Resume bullet points: reworded per vibe personality
- Cover letter tone: adjusts based on vibe
- Skill gap recommendations: prioritize skills matching vibe direction

---

## 8. Career Config (CAREER.md)

### Export
- Button on canvas toolbar + profile page
- Generates a markdown file with frontmatter:

```markdown
---
vibe: confident
persona: professional
plan: premium
---

# Career Configuration

## Skills
- React, TypeScript, Node.js, Python

## Resume Summary
Senior frontend engineer with 5+ years...

## Active Applications
- Company A - Senior Engineer (Interviewing)
- Company B - Frontend Lead (Applied)

## Skill Targets
- System Design, GraphQL, Kubernetes

## Preferred Roles
- Senior Frontend Engineer, Tech Lead
```

### Import
- Drag-and-drop or file picker on canvas page
- Parses frontmatter + sections
- Restores vibe, updates profile, populates canvas with matching modules

---

## 9. Phase 1 Scope Boundary

### In Scope (Phase 1)
- Design system overhaul (CSS tokens, dark/light)
- Component library upgrade (Button, Input, Card, GlassPanel, Badge, ThemeToggle, VibeChip, AnimatedBackground)
- Layout & navigation (glass sidebar, theme toggle, mobile bottom nav)
- Landing page redesign (dark Stitch aesthetic)
- All core pages visual refresh (tokens, cards, typography)
- Career canvas page with modules, agent manager, toolbar, state persistence
- Vibe system with 4 vibes, accent shifting, AI tone influence
- CAREER.md export/import

### Deferred to Phase 2
- Voice interaction for canvas and resume builder
- Interactive career journey prototype
- AI Career Agent (persistent assistant)
- Deeper AI integration (vibe-driven full generation)

---

## 10. Architecture Notes

### CSS Strategy
- Tailwind v4 `@theme` for design tokens
- CSS variables for dynamic values (dark/light, vibe accent)
- No CSS-in-JS — all styling via Tailwind utility classes
- `globals.css` for animations, keyframes, glass utilities

### Theme Implementation
- `<html>` class toggle via `ThemeToggle` component
- Script in root layout reads `localStorage` and applies class before hydration (prevents flash)
- All components read CSS variables — no manual `dark:` prefix needed

### File Changes Summary

**New files:**
- `src/components/ui/GlassPanel.tsx`
- `src/components/ui/Badge.tsx`
- `src/components/ui/ThemeToggle.tsx`
- `src/components/ui/VibeChip.tsx`
- `src/components/ui/AnimatedBackground.tsx`
- `src/app/(protected)/canvas/page.tsx`
- `src/components/canvas/Canvas.tsx`
- `src/components/canvas/CanvasModule.tsx`
- `src/components/canvas/AgentManager.tsx`
- `src/components/canvas/CanvasToolbar.tsx`
- `src/lib/career-config.ts`
- `src/types/canvas.ts`

**Modified files:**
- `src/app/globals.css` (design tokens, animations, glass utilities)
- `src/app/layout.tsx` (theme initialization script)
- `src/app/page.tsx` (redesign)
- `src/app/(protected)/layout.tsx` (theme toggle integration)
- `src/components/layout/Sidebar.tsx` (glass styling, theme toggle)
- `src/components/ui/Button.tsx` (glass variant, dark mode)
- `src/components/ui/Input.tsx` (dark mode, glass variant)
- `src/components/ui/Card.tsx` (alias to GlassPanel)
- `src/components/ui/index.ts` (new exports)
- All protected pages (visual refresh per Section 5)
