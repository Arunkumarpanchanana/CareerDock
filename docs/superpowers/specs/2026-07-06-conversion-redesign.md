# Homepage Conversion Redesign — Hero & Service Clarity

**Date:** 2026-07-06
**Status:** Approved design

## Overview

Enhance the CareerDock homepage focused on two areas: **Hero section** and **Services section**. The goal is to increase conversion by improving trust signals, CTA clarity, pricing transparency, and mobile responsiveness. This builds on the existing Anchor Precision design system from `2026-07-01-landing-page-redesign.md`.

## Scope

Only `src/app/page.tsx` is modified. No changes to protected pages, auth pages, layout, globals, or components outside the homepage.

---

## 1. Hero Section

### Layout
- **Background:** Dark blue gradient (`#0a1628` → `#1a2744` → `#0f1f3a`) replacing the current light `surface` bg
- **Overlay:** Subtle animated geometric shapes or floating particles (via CSS animation, no canvas library)
- **Max-width:** 1280px container, centered
- **Mobile:** Headline stacks above CTAs. Metrics displayed in 2x2 grid.

### Headline
```
Unlock Your Career Potential
with Expert Coaching
```
- "Unlock Your Career Potential" — bold emphasis (Hanken Grotesk 800, white)
- "with Expert Coaching" — lighter weight (Hanken Grotesk 300 or thinner, `#94a3b8`)

### Subheadline
```
Land your dream job faster with ATS-optimized resumes, AI mock interviews, and 1:1 expert sessions.
```
- Inter, `#94a3b8`, max-width 520px, centered

### Social Proof Badge
- Positioned directly under headline
- Text: "🔥 85% of clients land interviews within 3 weeks"
- Style: small pill with `rgba(59,130,246,0.15)` background, `#93bbff` text, `1px solid rgba(59,130,246,0.3)`
- Interactive: link to "See client success stories →" (scrolls to testimonial section)

### CTA Buttons
- **Primary CTA:** "Book Your Free Consultation →"
  - Gradient: `linear-gradient(135deg, #3b82f6, #0ea5e9)`
  - Hover: shadow lift + glow effect (`box-shadow` increase + slight translateY)
  - Large padding, white text, `rounded-lg`
- **Secondary CTA:** "See How It Works"
  - `background: transparent`, `border: 2px solid rgba(255,255,255,0.2)`, white text
  - Hover: `rgba(255,255,255,0.1)` background

### Success Metrics
- Positioned below CTAs with a subtle `border-top` separator
- 4 metrics in a row (wrap on mobile to 2x2)
- Each with emoji icon + number + label:
  - 👥 **10K+** Active Users
  - 📄 **5K+** Resumes Built
  - ⭐ **95%** Satisfaction Rate
  - 🎓 **500+** Expert Sessions
- Numbers: Hanken Grotesk 800, white, large (`1.5rem`)
- Labels: small `#94a3b8` text
- **Animation:** Count-up effect on page load (intersection observer based)

---

## 2. Services Section

Replaces the existing Features + How It Works + Pricing sections with a unified Services section.

### Section Header
- **Overline label:** "SERVICES" — small caps, `#3b82f6`, with subtle gradient divider
- **Heading:** "Start with a Free Consultation, then choose your path."
- **Supporting line:** "Every plan includes a 30-minute strategy session — pick the level of support that fits your goals."

### Card Layout
3-column grid (1-column on mobile). Each card has:
- Soft shadow (`box-shadow`), `rounded-xl` (`1rem`)
- Consistent icon style (line icons / emoji at top)
- Title, short tagline, price with `₹` prefix, one-time label
- Bullet feature list with checkmarks
- CTA button: "Book Now →" with gradient (blue → teal) and hover effect

### Card 1: Resume Review — ₹4,999 (Starter)
- Icon: 📝
- Tagline: "Expert ATS audit + rewrite"
- Features:
  - ATS compatibility check
  - Expert rewrite with keywords
  - Cover letter included
  - 48-hour turnaround

### Card 2: Interview Coaching — ₹9,999 (Most Popular)
- Icon: 🎯
- Tagline: "3 mock sessions + feedback"
- "Most Popular" badge: animated pulse, `#3b82f6` background, centered at top
- Border: `2px solid #3b82f6` with light glow
- Features:
  - 3 x 45-min mock interviews
  - AI-powered feedback report
  - Industry-specific questions
  - Salary negotiation guide

### Card 3: Career Strategy — ₹14,999 (Executive)
- Icon: 🚀
- Tagline: "End-to-end career transformation"
- Subtle gradient border (indigo → violet)
- Features:
  - Resume + cover letter + LinkedIn
  - 5 mock interview sessions
  - Custom job search strategy
  - 30 days email/chat support

### Limited-Time Offer Banner
- Below cards, centered
- "🔥 Limited: Book before July 15th and get 20% off any package."
- Red accent (`#ef4444`) for the emoji, bold text
- Optional: CSS-only countdown timer (displayed as text)

### Mobile Behavior
- Cards stack vertically
- "Most Popular" badge stays at top-center
- CTA buttons remain full-width
- Equal padding across all cards

---

## 3. Remaining Sections (Minor Updates)

### Testimonials
- Keep existing but upgrade with real client photo placeholders and job titles
- Add a second testimonial quote with rotating carousel or toggle

### FAQ
- Keep existing 15 questions as-is

### Final CTA
- Keep existing "Ready to accelerate your career?" section
- Update button to match new gradient style

### Footer
- Keep as-is

---

## Implementation Plan

### Files Changed
1. **`src/app/page.tsx`** — Full rewrite of hero and services sections

### No Changes To
- `src/app/layout.tsx` — root layout stays same
- `src/app/globals.css` — existing theme is sufficient
- Any component, protected page, or API route

### Key Technical Details
- Hero gradient uses Tailwind arbitrary values (`bg-[linear-gradient(...)]` or inline style)
- **Navigation adaptation**: Nav text/links use `text-white` when hero is visible (transparent nav bg), switch to dark `text-navy-900` when scrolled (white nav bg) — same mobile behavior
- Count-up animation: IntersectionObserver + `setInterval` counting from 0 to target
- Card hover: `transition-all duration-300`, `hover:-translate-y-1`, `hover:shadow-xl`
- Mobile breakpoints: `sm:` (640px), `md:` (768px), `lg:` (1024px)

### Verification
- `npm run build` — must compile without errors
- `npm run lint` — no new warnings
- `npm run test` — existing tests must pass
- Visual check: hero renders correctly on mobile (Chrome DevTools 375px viewport)
