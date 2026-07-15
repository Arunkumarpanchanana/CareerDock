# Marketing Homepage — mycareerdock.com

## Objective

Replace the 26-line placeholder at `src/app/marketing/page.tsx` with a full-featured brand + conversion homepage, served at `mycareerdock.com/` via proxy rewrite. The page is a hybrid: brand-forward top half with hero and features, conversion-focused bottom half with pricing, testimonials, FAQ, and CTA.

## Design

### Brand Identity

- **Colors:** Navy-900 (#001B3D), Blue-600 (#0052FF), Blue-400 (#60A5FA), Growth-Green (#0E833E), Surface (#f8f9ff)
- **Typography:** Hanken Grotesk (headings via `--font-hanken-grotesk`), Inter (body via `--font-inter`), JetBrains Mono (labels via `--font-jetbrains-mono`)
- **Logo:** `public/logo.png` — displayed in nav and footer alongside "CareerDock" text

### Files to Change

| File | Action | Lines |
|---|---|---|
| `src/app/marketing/layout.tsx` | Rewrite nav (logo, sticky, glass effect, CTA) + improve footer | ~40 |
| `src/app/marketing/page.tsx` | Rewrite with full homepage sections | ~350-400 |
| (no new CSS — reuse existing `globals.css` custom properties) | | |

The root `layout.tsx` already loads the fonts and globals.css, so `src/app/marketing/layout.tsx` and `page.tsx` can use `--font-hanken-grotesk` and all custom properties directly.

### Page Structure

#### 1. Nav (marketing/layout.tsx)

- Sticky on scroll, `z-50`
- Default: transparent background, white text
- On scroll (>20px): white background, navy text, subtle bottom border
- Left: `Image` logo (invert to white on transparent, normal on scrolled) + "CareerDock" text
- Center/Right: "Articles" link, "Offers" link, "Get Started" gradient button
- Uses existing `useState` + `useEffect` scroll listener pattern from root page.tsx

#### 2. Hero Section

- Dark gradient background matching root page: `linear-gradient(135deg, #0a1628, #1a2744, #0f1f3a)`
- Animated ambient shapes (blurred circles at corners, matching root page pattern)
- Badge: "🔥 85% of clients land interviews within 3 weeks" (JetBrains Mono label)
- Headline: "Land Your Dream Job Faster with AI-Powered Career Tools" (Hanken Grotesk, white)
- Subhead: "Practice interviews, optimize your resume, get expert coaching — all in one place." (Inter, blue-gray)
- Dual CTAs:
  - "Get Started Free" (blue gradient button → `app.mycareerdock.com`)
  - "Read Articles" (outline button → `/articles`)
- Trust metrics row (below CTA, separated by subtle divider):
  - 👥 10,000+ Active Users
  - 📄 5,000+ Resumes Built
  - ⭐ 95% Satisfaction Rate
  - 🎓 500+ Expert Sessions

#### 3. Features Section (4-column grid)

- Surface-faint background
- Section label: "Features" (JetBrains Mono uppercase, blue)
- Heading: "Everything you need to advance your career" (Hanken Grotesk)
- 4 cards in a grid (responsive: 2-col on tablet, 4-col on desktop):
  - **AI Interview Practice** — Realistic mock interviews with AI feedback (Lucide `Mic` icon)
  - **Smart Resume Builder** — ATS-optimized resumes with AI suggestions (Lucide `FileText` icon)
  - **Career Coaching** — Personalized guidance from AI and experts (Lucide `Users` icon)
  - **Job Tracker** — Track applications and skill gaps in one dashboard (Lucide `LayoutDashboard` icon)
- Scroll-triggered fade-in animation

#### 4. How It Works Section (3 steps)

- Surface background
- Heading: "How It Works"
- 3 steps with numbered circles and connector line:
  1. **Assess** — Tell us about your career goals and current situation
  2. **Practice** — Use AI interviews, resume tools, and coaching to prepare
  3. **Succeed** — Apply with confidence and land your dream role
- Each step: icon, number, title, description
- Between steps: subtle arrow/connector on desktop, divider on mobile

#### 5. Pricing Section

- Surface-faint background
- Heading: "Simple, transparent pricing"
- 3 pricing cards in a row:
  - **Free Trial** — ₹0/mo (3 resumes, skill gap analysis, job search, 10 AI suggestions)
  - **Premium** — ₹299/mo (unlimited resumes, AI mock interview, 100 AI suggestions, job tracker) with "Most Popular" badge
  - **Premium Pro** — ₹500/mo (everything in Premium, unlimited AI suggestions, 1:1 expert sessions, priority support)
- Simplified pricing (no yearly toggle, no API fetch — static prices match root page defaults)
- Each card: plan name, price, feature checklist (CheckCircle2 icons), "Get Started" CTA link

#### 6. Testimonials Section

- 2 testimonial cards in a grid
- Quote with 5-star rating, author avatar initial circle, name, location
- Same quotes as root page (Sarah K. and Rahul M.)
- Bottom: "Join 10,000+ professionals who accelerated their careers"

#### 7. FAQ Section

- Accordion with the same 5-6 most relevant questions from root page
- Click to expand/collapse with chevron animation
- Same styling as root page (border, hover, transition)

#### 8. Final CTA Section

- Navy-900 background
- "Ready to transform your career?" headline
- "Join thousands of professionals who landed their dream job with our help."
- "Create Free Account" gradient button
- Trust signals below: "No credit card" / "Cancel anytime" / "Free updates"

#### 9. Footer (marketing/layout.tsx)

- Updated from current minimal version
- Logo + "CareerDock" left
- Links: Articles, Offers, Contact | Copyright right
- Matching root page footer styling

### Implementation Notes

- Server component (`marketing/page.tsx`) — no `'use client'` needed for sections that are purely presentational. The FAQ accordion and scroll animations require client-side interactivity, so wrap those in `'use client'` child components or keep page as client component.
- Simpler approach: make `page.tsx` a client component (like root page) for the scroll animations and FAQ interactivity, since there's no data fetching from Supabase needed.
- No new npm dependencies — only Lucide icons (already installed) and Tailwind utility classes.

### Testing

- Visual inspection at `mycareerdock.com/` (via localhost proxy or deployment)
- Responsive: check mobile, tablet, desktop breakpoints
- Interactive: FAQ accordion opens/closes, scroll animations trigger

### Future Considerations

- Add `CountUp` animated counters to trust metrics if component extraction is warranted
- Add yearly/monthly pricing toggle if marketing page needs it
- Add blog/article preview section when more articles exist
