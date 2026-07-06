# Homepage Conversion Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the MyCareerDock homepage into a conversion-focused landing page with a new hero section and service clarity cards.

**Architecture:** Single-page client component (`src/app/page.tsx`). Extracts reusable animation hook and service card data into separate files for testability. Hero uses inline Tailwind gradients, services use a data-driven card map.

**Tech Stack:** Next.js 16, React 19, Tailwind v4, TypeScript

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `src/app/page.tsx` | Modify | Homepage component — hero, services, testimonials, FAQ, CTA, footer |
| `src/components/ui/CountUp.tsx` | Create | Reusable count-up animation component |

---

### Task 1: Create CountUp component

**Files:**
- Create: `src/components/ui/CountUp.tsx`

- [ ] **Step 1: Write CountUp component**

```tsx
'use client'

import { useEffect, useRef, useState } from 'react'

interface CountUpProps {
  end: number
  suffix?: string
  duration?: number
}

export function CountUp({ end, suffix = '', duration = 2000 }: CountUpProps) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const started = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el || started.current) return
    started.current = true
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          observer.unobserve(el)
          const startTime = performance.now()
          const step = (now: number) => {
            const elapsed = now - startTime
            const progress = Math.min(elapsed / duration, 1)
            setCount(Math.floor(progress * end))
            if (progress < 1) requestAnimationFrame(step)
          }
          requestAnimationFrame(step)
        }
      },
      { threshold: 0.3 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [end, duration])

  return <span ref={ref}>{count}{suffix}</span>
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit src/components/ui/CountUp.tsx`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/CountUp.tsx
git commit -m "feat: add CountUp animation component"
```

---

### Task 2: Rewrite Hero Section

**Files:**
- Modify: `src/app/page.tsx`

Replace the existing hero section (lines 132-189) and navigation text adaptation with the new conversion-focused hero.

- [ ] **Step 1: Read current page.tsx to confirm state**

Run: `wc -l src/app/page.tsx`
Expected: ~520 lines

- [ ] **Step 2: Add imports**

Add `CountUp` import and lucide icons needed:
```tsx
import { CountUp } from '@/components/ui/CountUp'
import { Calendar, ArrowDown, Sparkles } from 'lucide-react'
```

- [ ] **Step 3: Replace hero section**

Replace lines 132-189 (hero section) with:

```tsx
        {/* Hero */}
        <section className="relative overflow-hidden bg-[linear-gradient(135deg,#0a1628_0%,#1a2744_50%,#0f1f3a_100%)] pt-36 pb-20 sm:pt-44 sm:pb-28">
          {/* Animated background shapes */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl animate-pulse" />
            <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl animate-pulse animation-delay-1000" />
            <div className="absolute top-1/3 left-1/4 w-64 h-64 rounded-full bg-cyan-500/5 blur-3xl animate-pulse animation-delay-2000" />
          </div>

          <div className="mx-auto max-w-4xl px-5 sm:px-8 text-center relative z-10">
            {/* Social Proof Badge */}
            <a
              href="#testimonials"
              className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 mb-8 transition-colors hover:bg-[rgba(59,130,246,0.25)]"
              style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)' }}
            >
              <span className="text-sm">🔥</span>
              <span
                className="text-[11px] font-semibold tracking-[0.05em] uppercase"
                style={{ color: '#93bbff', fontFamily: 'var(--font-jetbrains-mono)' }}
              >
                85% of clients land interviews within 3 weeks
              </span>
              <ArrowDown className="h-3 w-3 ml-1" style={{ color: '#93bbff' }} />
            </a>

            <h1
              className="text-[40px] leading-[1.1] font-extrabold tracking-tight sm:text-[56px] lg:text-[64px]"
              style={{ fontFamily: 'var(--font-hanken-grotesk)', letterSpacing: '-0.02em', color: '#ffffff' }}
            >
              <span className="text-white">Unlock Your Career Potential</span>
              <br />
              <span style={{ color: '#94a3b8', fontWeight: 300 }}>with Expert Coaching</span>
            </h1>

            <p
              className="mx-auto mt-5 max-w-xl text-lg sm:text-xl leading-relaxed"
              style={{ color: '#94a3b8', fontFamily: 'var(--font-inter)' }}
            >
              Land your dream job faster with ATS-optimized resumes, AI mock interviews, and 1:1 expert sessions.
            </p>

            <div className="mt-9 flex items-center justify-center gap-3 flex-wrap">
              <a
                href="/auth/signup"
                className="inline-flex items-center gap-1.5 rounded-lg px-7 py-3.5 text-base font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(59,130,246,0.4)]"
                style={{ background: 'linear-gradient(135deg, #3b82f6, #0ea5e9)' }}
              >
                Book Your Free Consultation <ArrowUpRight className="h-4 w-4" />
              </a>
              <a
                href="#services"
                className="inline-flex items-center gap-1.5 rounded-lg px-7 py-3.5 text-base font-semibold transition-colors"
                style={{ color: '#ffffff', border: '2px solid rgba(255,255,255,0.2)', background: 'transparent' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
              >
                See How It Works <ChevronRight className="h-4 w-4" />
              </a>
            </div>

            {/* Success Metrics */}
            <div
              className="mt-14 flex items-center justify-center gap-8 sm:gap-14 flex-wrap pt-10"
              style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}
            >
              {[
                { icon: '👥', value: 10000, suffix: '+', label: 'Active Users' },
                { icon: '📄', value: 5000, suffix: '+', label: 'Resumes Built' },
                { icon: '⭐', value: 95, suffix: '%', label: 'Satisfaction Rate' },
                { icon: '🎓', value: 500, suffix: '+', label: 'Expert Sessions' },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <span className="text-2xl">{s.icon}</span>
                  <p
                    className="text-[40px] sm:text-[48px] font-extrabold leading-none mt-1"
                    style={{ fontFamily: 'var(--font-hanken-grotesk)', color: '#ffffff' }}
                  >
                    <CountUp end={s.value} suffix={s.suffix} />
                  </p>
                  <p className="text-sm mt-1" style={{ color: '#94a3b8' }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
```

- [ ] **Step 4: Adapt navigation for dark hero**

Update the nav header tag to use white text when transparent:

Replace the header tag on line 108:
```
<header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white border-b border-blue-100' : 'bg-transparent'}`}>
```

And update the "Sign In" link to use white text when not scrolled:
Change line 117: `className="text-sm font-medium text-on-surface-variant hover:text-navy-900 transition-colors"` 
to: 
```
className="text-sm font-medium transition-colors"
style={{ color: scrolled ? '#434656' : '#ffffff' }}
onMouseEnter={(e) => { e.currentTarget.style.color = '#001B3D' }}
onMouseLeave={(e) => { e.currentTarget.style.color = scrolled ? '#434656' : '#ffffff' }}
```

And update "Get Started" button to use the gradient style:
Change lines 121-126 to:
```tsx
<Link
  href="/auth/signup"
  className="inline-flex items-center px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-all duration-300 hover:shadow-[0_4px_15px_rgba(59,130,246,0.4)]"
  style={{ background: 'linear-gradient(135deg, #3b82f6, #0ea5e9)' }}
>
  Get Started
</Link>
```

- [ ] **Step 5: Verify build compiles**

Run: `npm run build`
Expected: No errors

- [ ] **Step 6: Commit**

```bash
git add src/app/page.tsx src/components/ui/CountUp.tsx
git commit -m "feat: redesign hero section with dark gradient and conversion CTAs"
```

---

### Task 3: Create Services Section

**Files:**
- Modify: `src/app/page.tsx`

Replace the existing Features (lines 191-226) + How It Works (lines 228-264) + Pricing (lines 266-381) sections with the unified Services section.

- [ ] **Step 1: Replace Features + How It Works + Pricing with Services**

Replace everything from the Features section start (line 191) through the Pricing section end (line 381) with:

```tsx
        {/* Services */}
        <section id="services" className="bg-surface-faint py-20 sm:py-28">
          <div className="mx-auto max-w-[1280px] px-5 sm:px-8">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 mb-4">
                <span
                  className="text-[11px] font-semibold tracking-[0.05em] uppercase"
                  style={{ color: '#3b82f6', fontFamily: 'var(--font-jetbrains-mono)' }}
                >
                  Services
                </span>
                <div className="w-12 h-px" style={{ background: 'linear-gradient(90deg, #3b82f6, transparent)' }} />
              </div>
              <h2
                className="text-[32px] sm:text-[40px] font-bold text-navy-900 tracking-tight"
                style={{ fontFamily: 'var(--font-hanken-grotesk)' }}
              >
                Start with a Free Consultation,<br />
                then choose your path.
              </h2>
              <p className="mt-3 text-lg text-on-surface-variant max-w-xl mx-auto">
                Every plan includes a 30-minute strategy session — pick the level of support that fits your goals.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
              {/* Card 1: Resume Review */}
              <div
                className="group rounded-xl bg-white p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                style={{ boxShadow: '0 4px 20px rgba(0,27,61,0.05)' }}
              >
                <div className="text-3xl mb-4">📝</div>
                <h3 className="text-xl font-semibold text-navy-900" style={{ fontFamily: 'var(--font-hanken-grotesk)' }}>
                  Resume Review
                </h3>
                <p className="text-sm text-on-surface-variant mt-1 mb-4">Expert ATS audit + rewrite</p>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-sm text-on-surface-variant">₹</span>
                  <span className="text-[40px] font-extrabold text-navy-900 leading-none" style={{ fontFamily: 'var(--font-hanken-grotesk)' }}>4,999</span>
                </div>
                <p className="text-xs text-outline mb-6">One-time payment</p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-2 text-sm text-on-surface-variant">
                    <CheckCircle2 className="h-4 w-4 text-growth-green shrink-0" /> ATS compatibility check
                  </li>
                  <li className="flex items-center gap-2 text-sm text-on-surface-variant">
                    <CheckCircle2 className="h-4 w-4 text-growth-green shrink-0" /> Expert rewrite with keywords
                  </li>
                  <li className="flex items-center gap-2 text-sm text-on-surface-variant">
                    <CheckCircle2 className="h-4 w-4 text-growth-green shrink-0" /> Cover letter included
                  </li>
                  <li className="flex items-center gap-2 text-sm text-on-surface-variant">
                    <CheckCircle2 className="h-4 w-4 text-growth-green shrink-0" /> 48-hour turnaround
                  </li>
                </ul>
                <Link
                  href="/auth/signup"
                  className="flex w-full items-center justify-center rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_4px_15px_rgba(59,130,246,0.4)]"
                  style={{ background: 'linear-gradient(135deg, #3b82f6, #0ea5e9)' }}
                >
                  Book Now <ArrowUpRight className="h-4 w-4 ml-1" />
                </Link>
              </div>

              {/* Card 2: Interview Coaching (Most Popular) */}
              <div
                className="group rounded-xl bg-white p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl relative"
                style={{ boxShadow: '0 4px 20px rgba(0,27,61,0.05)', border: '2px solid #3b82f6' }}
              >
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center rounded-full px-3 py-1 animate-pulse" style={{ background: '#3b82f6' }}>
                  <span
                    className="text-[10px] font-semibold text-white tracking-wider uppercase"
                    style={{ fontFamily: 'var(--font-jetbrains-mono)' }}
                  >
                    Most Popular
                  </span>
                </div>
                <div className="text-3xl mb-4">🎯</div>
                <h3 className="text-xl font-semibold text-navy-900" style={{ fontFamily: 'var(--font-hanken-grotesk)' }}>
                  Interview Coaching
                </h3>
                <p className="text-sm text-on-surface-variant mt-1 mb-4">3 mock sessions + feedback</p>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-sm text-on-surface-variant">₹</span>
                  <span className="text-[40px] font-extrabold text-navy-900 leading-none" style={{ fontFamily: 'var(--font-hanken-grotesk)' }}>9,999</span>
                </div>
                <p className="text-xs text-outline mb-6">One-time payment</p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-2 text-sm text-on-surface-variant">
                    <CheckCircle2 className="h-4 w-4 text-growth-green shrink-0" /> 3 x 45-min mock interviews
                  </li>
                  <li className="flex items-center gap-2 text-sm text-on-surface-variant">
                    <CheckCircle2 className="h-4 w-4 text-growth-green shrink-0" /> AI-powered feedback report
                  </li>
                  <li className="flex items-center gap-2 text-sm text-on-surface-variant">
                    <CheckCircle2 className="h-4 w-4 text-growth-green shrink-0" /> Industry-specific questions
                  </li>
                  <li className="flex items-center gap-2 text-sm text-on-surface-variant">
                    <CheckCircle2 className="h-4 w-4 text-growth-green shrink-0" /> Salary negotiation guide
                  </li>
                </ul>
                <Link
                  href="/auth/signup"
                  className="flex w-full items-center justify-center rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_4px_15px_rgba(59,130,246,0.4)]"
                  style={{ background: 'linear-gradient(135deg, #3b82f6, #0ea5e9)' }}
                >
                  Book Now <ArrowUpRight className="h-4 w-4 ml-1" />
                </Link>
              </div>

              {/* Card 3: Career Strategy */}
              <div
                className="group rounded-xl bg-white p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                style={{
                  boxShadow: '0 4px 20px rgba(0,27,61,0.05)',
                  border: '1px solid transparent',
                  backgroundClip: 'padding-box',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '0.75rem',
                    padding: '1px',
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    WebkitMaskComposite: 'xor',
                    maskComposite: 'exclude',
                    pointerEvents: 'none',
                  }}
                />
                <div className="text-3xl mb-4">🚀</div>
                <h3 className="text-xl font-semibold text-navy-900" style={{ fontFamily: 'var(--font-hanken-grotesk)' }}>
                  Career Strategy
                </h3>
                <p className="text-sm text-on-surface-variant mt-1 mb-4">End-to-end career transformation</p>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-sm text-on-surface-variant">₹</span>
                  <span className="text-[40px] font-extrabold text-navy-900 leading-none" style={{ fontFamily: 'var(--font-hanken-grotesk)' }}>14,999</span>
                </div>
                <p className="text-xs text-outline mb-6">One-time payment</p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-2 text-sm text-on-surface-variant">
                    <CheckCircle2 className="h-4 w-4 text-growth-green shrink-0" /> Resume + cover letter + LinkedIn
                  </li>
                  <li className="flex items-center gap-2 text-sm text-on-surface-variant">
                    <CheckCircle2 className="h-4 w-4 text-growth-green shrink-0" /> 5 mock interview sessions
                  </li>
                  <li className="flex items-center gap-2 text-sm text-on-surface-variant">
                    <CheckCircle2 className="h-4 w-4 text-growth-green shrink-0" /> Custom job search strategy
                  </li>
                  <li className="flex items-center gap-2 text-sm text-on-surface-variant">
                    <CheckCircle2 className="h-4 w-4 text-growth-green shrink-0" /> 30 days email/chat support
                  </li>
                </ul>
                <Link
                  href="/auth/signup"
                  className="flex w-full items-center justify-center rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_4px_15px_rgba(59,130,246,0.4)]"
                  style={{ background: 'linear-gradient(135deg, #3b82f6, #0ea5e9)' }}
                >
                  Book Now <ArrowUpRight className="h-4 w-4 ml-1" />
                </Link>
              </div>
            </div>

            {/* Limited-Time Offer Banner */}
            <div className="mt-8 text-center">
              <p className="text-base font-semibold" style={{ color: '#334155' }}>
                <span style={{ color: '#ef4444' }}>🔥</span>{' '}
                Limited: Book before July 15th and get <strong>20% off</strong> any package.
              </p>
            </div>
          </div>
        </section>
```

Also remove the `prices` state, the `useEffect` that fetches `/api/plan-prices`, and the unused features/steps/faqs imports. Update the `faqs` array reference — keep it, it's still used.

Delete these:
- `const [prices, setPrices]` state (line 83)
- The `useEffect` that fetches plan-prices (lines 92-103)
- Remove `features` array (lines 43-48) — no longer needed
- Remove `steps` array (lines 57-61) — no longer needed

Keep `faqs` array (lines 63-79) — still used.

- [ ] **Step 2: Run build to verify**

Run: `npm run build`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: add services section with pricing cards and offer banner"
```

---

### Task 4: Update Testimonials and Final CTA

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Upgrade testimonial section**

Replace lines ~383-421 (testimonial section) with an enhanced version:

```tsx
        {/* Testimonials */}
        <section id="testimonials" className="bg-surface py-20 sm:py-28">
          <div className="mx-auto max-w-4xl px-5 sm:px-8">
            <AnimatedSection className="text-center mb-16">
              <h2
                className="text-[32px] sm:text-[40px] font-bold text-navy-900 tracking-tight"
                style={{ fontFamily: 'var(--font-hanken-grotesk)' }}
              >
                What Our Clients Say
              </h2>
              <p className="mt-3 text-lg text-on-surface-variant max-w-xl mx-auto">
                Real results from real professionals who transformed their careers.
              </p>
            </AnimatedSection>

            <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
              <AnimatedSection>
                <div className="rounded-xl bg-white p-8" style={{ boxShadow: '0 4px 20px rgba(0,27,61,0.05)' }}>
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-[#ff9f0a] text-[#ff9f0a]" />
                    ))}
                  </div>
                  <blockquote className="text-base text-navy-900 leading-relaxed">
                    &ldquo;I went from sending out scattered applications to running a structured job search
                    with My Career Dock. The resume builder alone saved me hours.&rdquo;
                  </blockquote>
                  <div className="mt-6 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
                      S
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-navy-900">Sarah K.</p>
                      <p className="text-xs text-outline">Product Manager, Bangalore</p>
                    </div>
                  </div>
                </div>
              </AnimatedSection>

              <AnimatedSection>
                <div className="rounded-xl bg-white p-8" style={{ boxShadow: '0 4px 20px rgba(0,27,61,0.05)' }}>
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-[#ff9f0a] text-[#ff9f0a]" />
                    ))}
                  </div>
                  <blockquote className="text-base text-navy-900 leading-relaxed">
                    &ldquo;The interview coaching was a game-changer. I went from nervous to confident,
                    and landed an offer within 2 weeks of my sessions.&rdquo;
                  </blockquote>
                  <div className="mt-6 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-growth-green flex items-center justify-center text-white text-sm font-bold">
                      R
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-navy-900">Rahul M.</p>
                      <p className="text-xs text-outline">Software Engineer, Pune</p>
                    </div>
                  </div>
                </div>
              </AnimatedSection>
            </div>

            <div className="mt-10 text-center">
              <p className="text-sm text-outline">Join <strong className="text-navy-900">10,000+</strong> professionals who accelerated their careers</p>
            </div>
          </div>
        </section>
```

- [ ] **Step 2: Update Final CTA button gradient**

Replace the final CTA button's `bg-blue-600` with the gradient style:

Find the "Create Free Account" CTA link and update it. Also update the heading to match the new messaging:

```tsx
        {/* CTA */}
        <section className="bg-navy-900 py-20 sm:py-28">
          <div className="mx-auto max-w-3xl px-5 sm:px-8 text-center">
            <AnimatedSection>
              <h2
                className="text-[32px] sm:text-[40px] font-bold text-white tracking-tight"
                style={{ fontFamily: 'var(--font-hanken-grotesk)' }}
              >
                Ready to transform your career?
              </h2>
              <p className="mt-3 text-lg text-blue-400 max-w-lg mx-auto">
                Join thousands of professionals who landed their dream job with our help.
              </p>
              <div className="mt-9 flex items-center justify-center gap-3 flex-wrap">
                <Link
                  href="/auth/signup"
                  className="inline-flex items-center gap-1.5 rounded-lg px-7 py-3.5 text-base font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(59,130,246,0.4)]"
                  style={{ background: 'linear-gradient(135deg, #3b82f6, #0ea5e9)' }}
                >
                  Create Free Account <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="mt-8 flex items-center justify-center gap-6 text-sm text-blue-400 flex-wrap">
                <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" /> No credit card</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" /> Cancel anytime</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" /> Free updates</span>
              </div>
            </AnimatedSection>
          </div>
        </section>
```

- [ ] **Step 3: Run build to verify**

Run: `npm run build`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: upgrade testimonials with dual quotes and update final CTA"
```

---

### Task 5: Final Verification

- [ ] **Step 1: Run lint**

Run: `npm run lint`
Expected: No warnings or errors

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`
Expected: No errors

- [ ] **Step 3: Run tests**

Run: `npm run test`
Expected: All tests passing

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 5: Remove unused imports**

Check for any unused imports added during the refactor and remove them. Specifically check `Kanban`, `Sparkles`, `Users`, `FileText` if they were removed from features.

- [ ] **Step 6: Final commit**

```bash
git add .
git commit -m "chore: cleanup unused imports and finalize conversion redesign"
```
