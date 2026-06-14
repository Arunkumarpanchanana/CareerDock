# CareerDock Homepage Redesign

## Overview
Full redesign of the public landing page (`src/app/page.tsx`) with bold flat design, micro-interactions, scroll-triggered animations, and a modern color system. No new dependencies — uses existing Tailwind CSS, Lucide icons, and Geist font.

## Design Direction
- **Style:** Bold Flat Design — 2D, minimalist, bold colors, clean lines, no gradients (except hero text and CTA section)
- **Pattern:** Marketplace/Directory — search-focused hero, feature cards, trust signals
- **Effect:** Micro-interactions, scroll-triggered fade/slide animations, hover lift, floating background shapes

## Color System
- Primary: `#2563EB` (blue-600)
- Secondary: `#7C3AED` (violet-600)
- Background: `#F8FAFC` (slate-50), white for cards
- Surface: `#F1F5F9` (slate-100) for alternate section backgrounds
- Accent: `#10B981` (emerald-500) for CTAs/success indicators
- Text heading: `#0F172A` (slate-900)
- Text body: `#475569` (slate-600)
- Text muted: `#94A3B8` (slate-400)

## Typography
- Geist (already loaded via layout.tsx)
- Headings: bold, 5xl-7xl, gradient text on hero (`from-blue-600 to-violet-600`)
- Body: 15-16px, leading-relaxed
- Font sizes consistent with Tailwind scale

## Page Structure (8 sections)

### 1. Floating Navbar
- `bg-white/80 backdrop-blur-md` sticky top-0
- Left: Logo icon + "CareerDock" text
- Right: Sign In (text) + Get Started Free (blue button)
- **Animation:** subtle blur-in on load

### 2. Hero Section
- Full-width with absolute-positioned floating geometric shapes (circles, dots, abstract lines)
- Background: `bg-gradient-to-br from-sky-50 via-white to-indigo-50`
- Badge pill: "Land your dream job faster" with Sparkles icon
- H1: gradient text `from-blue-600 to-indigo-600 bg-clip-text text-transparent`
- Subtext: max-w-2xl, text-gray-600
- CTA: "Start Free" (blue, shadow) + "Sign In" (outline)
- Stats row: 3 stats (Resume Templates 10+, Job Pipelines Unlimited, Expert Sessions 1:1)
- **Animations:**
  - Background shapes: `@keyframes float` (20-30s cycle, translateY + rotate)
  - Badge: fade-in-slide-down
  - CTA buttons: fade-in with slight delay
  - Stats: count-up on scroll (Intersection Observer)

### 3. Trust/Stats Bar
- 4 metrics: "10K+ Users", "5K+ Resumes Built", "500+ Expert Sessions", "95% Satisfaction"
- Light gray background section
- **Animation:** count-up numbers on scroll enter

### 4. Features Grid
- 4 cards in `md:grid-cols-2 lg:grid-cols-4`
- Icon circles with colored backgrounds (blue, emerald, purple, orange)
- Title + description
- Hover: `-translate-y-1 shadow-lg border-blue-200`
- **Animation:** fade-in + translate-y(20px) on scroll, 100ms stagger per card

### 5. How It Works (3 steps)
- Numbered circles (01, 02, 03) with connecting line
- Title + description
- Vertical layout, centered
- **Animation:** staggered slide-in from bottom

### 6. Testimonial
- Centered quote with Star icons (filled amber)
- "Early Access User" attribution
- **Animation:** subtle scale-in on scroll

### 7. CTA Section
- `bg-gradient-to-br from-blue-600 to-indigo-700`
- White heading + subtext
- White CTA button with hover effect
- 3 benefit bullets (No credit card, Cancel anytime, Free updates)
- **Animation:** subtle pulse on button

### 8. Footer
- Logo + copyright
- Clean, minimal, gray-50 background

## Animation Implementation
- Use a `'use client'` wrapper component or inline `useEffect` + `useInView` pattern
- Respect `prefers-reduced-motion`
- Keyframe definitions in globals.css for floating shapes
- Intersection Observer for scroll-triggered animations
- CSS transitions for hovers (duration-200 to 300)

## Files to Modify
- `src/app/page.tsx` — full rewrite of the page component
- `src/app/globals.css` — add keyframe animations, floating shape styles

## What NOT to Change
- `src/app/layout.tsx` — keep as-is (already has Geist font + metadata)
- No new packages or dependencies
- No server components affected

## Accessibility
- prefers-reduced-motion respected
- All interactive elements have cursor-pointer
- Color contrast 4.5:1 minimum
- Focus states visible on all interactive elements
- Alt text on any images if added
