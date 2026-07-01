# Landing Page Redesign — Anchor Precision Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Apple-inspired landing page at `/` with the Anchor Precision design system.

**Architecture:** Add fonts and color tokens globally, then rewrite the landing page as a single client component using the new tokens. Protected pages remain untouched.

**Tech Stack:** Next.js 16 + React 19 + Tailwind v4 + next/font/google + Lucide icons

---

### Task 1: Add Anchor Precision fonts to root layout

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Import Hanken Grotesk, Inter, JetBrains Mono**

```tsx
// Add alongside existing Geist imports
import { Hanken_Grotesk, Inter, JetBrains_Mono } from "next/font/google"
```

- [ ] **Step 2: Initialize font instances as variables**

```tsx
// Add after Geist initializations
const hankenGrotesk = Hanken_Grotesk({
  variable: "--font-hanken-grotesk",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
})

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "600"],
})

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["600"],
})
```

- [ ] **Step 3: Add all font variables to `<html>` className**

```tsx
// Replace existing className with:
className={`${geistSans.variable} ${geistMono.variable} ${hankenGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
```

- [ ] **Step 4: Verify fonts load**

Run: `npm run dev`
Check: Open Chrome DevTools → Computed styles on `<html>` — confirm `--font-hanken-grotesk`, `--font-inter`, `--font-jetbrains-mono` exist.

- [ ] **Step 5: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat: add Hanken Grotesk, Inter, JetBrains Mono fonts"
```

---

### Task 2: Add Anchor Precision color tokens to globals.css

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Add color tokens to existing `@theme inline` block**

```css
@theme inline {
  --color-background: var(--bg-primary);
  --color-foreground: var(--text-primary);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
  /* Anchor Precision colors */
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
}
```

- [ ] **Step 2: Add `.anchor-precision` scope to force light mode for landing page**

```css
/* Add after the light mode theme overrides */
.anchor-precision {
  --bg-primary: #f8f9ff;
  --bg-secondary: #ffffff;
  --bg-tertiary: #f1f3f8;
  --text-primary: #0b1c30;
  --text-secondary: #434656;
  --text-tertiary: #737688;
  --glass-border: rgba(0, 0, 0, 0.06);
}
```

- [ ] **Step 3: Verify tokens work**

Run: `npm run dev`
Check: Add `className="bg-blue-600 text-navy-900"` temporarily to any element — confirm colors render in browser DevTools.

- [ ] **Step 4: Commit**

```bash
git add src/app/globals.css
git commit -m "feat: add Anchor Precision color tokens and landing page scoping"
```

---

### Task 3: Write render test for the landing page

**Files:**
- Create: `src/app/__tests__/page.test.tsx`

- [ ] **Step 1: Create test file**

```tsx
import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import HomePage from "../page"

describe("Landing Page", () => {
  it("renders the main headline", () => {
    render(<HomePage />)
    expect(screen.getByText("Career Accelerator")).toBeDefined()
  })

  it("renders CTA buttons", () => {
    render(<HomePage />)
    expect(screen.getByText("Start Free")).toBeDefined()
  })

  it("renders all feature cards", () => {
    render(<HomePage />)
    expect(screen.getByText("ATS Resume Builder")).toBeDefined()
    expect(screen.getByText("Job Pipeline Tracker")).toBeDefined()
    expect(screen.getByText("Smart Suggestions")).toBeDefined()
    expect(screen.getByText("Expert Consultations")).toBeDefined()
  })
})
```

- [ ] **Step 2: Run test to verify it fails (page not yet rewritten)**

Run: `npx vitest run src/app/__tests__/page.test.tsx`
Expected: FAIL — expected text not found

- [ ] **Step 3: Commit**

```bash
git add src/app/__tests__/page.test.tsx
git commit -m "test: add landing page render tests"
```

---

### Task 4: Rewrite landing page with Anchor Precision design

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Write structure, fonts helper, animation hook, data constants**

```tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  FileText,
  Kanban,
  Sparkles,
  Users,
  ChevronRight,
  CheckCircle2,
  ArrowUpRight,
  Star,
} from 'lucide-react'

function useInView<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); observer.unobserve(el) } },
      { threshold: 0.2 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return { ref, inView }
}

function AnimatedSection({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const { ref, inView } = useInView<HTMLDivElement>()
  return (
    <div ref={ref} className={`transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className}`}>
      {children}
    </div>
  )
}

const features = [
  { icon: FileText, title: 'ATS Resume Builder', desc: 'Create clean resumes that pass Applicant Tracking Systems. Download as PDF instantly.' },
  { icon: Kanban, title: 'Job Pipeline Tracker', desc: 'Drag applications across stages — from Wishlist to Offer. Never lose track.' },
  { icon: Sparkles, title: 'Smart Suggestions', desc: 'Get AI-powered suggestions for bullet points, skills, and summaries.' },
  { icon: Users, title: 'Expert Consultations', desc: 'Book 1:1 sessions with industry professionals for career advice.' },
]

const steps = [
  { step: '01', title: 'Build Your Resume', desc: 'Fill in your details with our guided editor. Choose from expert-written templates.' },
  { step: '02', title: 'Track Applications', desc: 'Add jobs to your pipeline and move them across stages with ease.' },
  { step: '03', title: 'Get Expert Help', desc: 'Book 1:1 sessions with professionals who have been where you want to go.' },
]
```

- [ ] **Step 2: Write component shell + navigation**

```tsx
export default function HomePage() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 20) }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="anchor-precision flex min-h-screen flex-col bg-surface">
      {/* Navigation */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white border-b border-[#DBEAFE]' : 'bg-transparent'}`}>
        <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-6 sm:px-8">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/logo.png" alt="My Career Dock" width={520} height={143} className="h-10 w-auto object-contain" />
            <span className="text-xl font-bold text-navy-900" style={{ fontFamily: 'var(--font-hanken-grotesk)' }}>My Career Dock</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/auth/login"
              className="text-sm font-medium text-on-surface-variant hover:text-navy-900 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/auth/signup"
              className="inline-flex items-center px-5 py-2.5 rounded-lg bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>
```

- [ ] **Step 3: Write Hero section with stats**

```tsx
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-surface pt-36 pb-20 sm:pt-44 sm:pb-28">
          <div className="mx-auto max-w-4xl px-5 sm:px-8 text-center">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-4 py-1.5 mb-8">
              <Sparkles className="h-3 w-3 text-blue-600" />
              <span
                className="text-[11px] font-semibold text-blue-600 tracking-[0.05em] uppercase"
                style={{ fontFamily: 'var(--font-jetbrains-mono)' }}
              >
                Your career, accelerated
              </span>
            </div>

            <h1
              className="text-[40px] leading-[1.1] font-extrabold tracking-tight text-navy-900 sm:text-[56px] lg:text-[64px]"
              style={{ fontFamily: 'var(--font-hanken-grotesk)', letterSpacing: '-0.02em' }}
            >
              Your{' '}
              <span className="text-blue-600">Career Accelerator</span>
              <br />
              in One Place
            </h1>

            <p className="mx-auto mt-5 max-w-xl text-lg sm:text-xl text-on-surface-variant leading-relaxed">
              Build ATS-optimized resumes, track every job application, get AI-powered suggestions, and book 1:1 sessions with industry experts.
            </p>

            <div className="mt-9 flex items-center justify-center gap-3 flex-wrap">
              <Link
                href="/auth/signup"
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-7 py-3.5 text-base font-semibold text-white hover:bg-blue-700 transition-colors"
              >
                Start Free <ArrowUpRight className="h-4 w-4" />
              </Link>
              <Link
                href="/auth/login"
                className="inline-flex items-center gap-1.5 rounded-lg border-2 border-navy-900 px-7 py-3.5 text-base font-semibold text-navy-900 hover:bg-navy-900 hover:text-white transition-colors"
              >
                Sign In <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Hero Stats */}
            <div className="mt-14 flex items-center justify-center gap-8 sm:gap-14 flex-wrap">
              {[
                { value: '10K+', label: 'Active Users' },
                { value: '5K+', label: 'Resumes Built' },
                { value: '500+', label: 'Expert Sessions' },
                { value: '95%', label: 'Satisfaction' },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <p
                    className="text-[40px] sm:text-[48px] font-extrabold text-navy-900 leading-none"
                    style={{ fontFamily: 'var(--font-hanken-grotesk)' }}
                  >
                    {s.value}
                  </p>
                  <p className="text-sm text-outline mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
```

- [ ] **Step 4: Write Trust Bar section**

```tsx
        {/* Trust Bar */}
        <section className="bg-surface-faint py-14">
          <div className="mx-auto max-w-5xl px-5 sm:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { value: '10K+', label: 'Active Users' },
                { value: '5K+', label: 'Resumes Built' },
                { value: '500+', label: 'Expert Sessions' },
                { value: '95%', label: 'Satisfaction' },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <p
                    className="text-[40px] sm:text-[48px] font-extrabold text-navy-900 leading-none"
                    style={{ fontFamily: 'var(--font-hanken-grotesk)' }}
                  >
                    {s.value}
                  </p>
                  <p className="text-sm text-outline mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
```

- [ ] **Step 5: Write Features grid section**

```tsx
        {/* Features */}
        <section className="bg-surface py-20 sm:py-28">
          <div className="mx-auto max-w-[1280px] px-5 sm:px-8">
            <AnimatedSection className="text-center mb-16">
              <h2
                className="text-[32px] sm:text-[40px] font-bold text-navy-900 tracking-tight"
                style={{ fontFamily: 'var(--font-hanken-grotesk)' }}
              >
                Everything you need to land the role
              </h2>
              <p className="mt-3 text-lg text-on-surface-variant max-w-xl mx-auto">
                From resume to offer letter — My Career Dock supports every step of your job search.
              </p>
            </AnimatedSection>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map(({ icon: Icon, title, desc }) => (
                <div
                  key={title}
                  className="group rounded-lg bg-[#ffffff] p-8 shadow-[0_4px_20px_rgba(0,27,61,0.05)] hover:shadow-[0_8px_30px_rgba(0,27,61,0.1)] transition-all duration-300 cursor-default"
                >
                  <div className="w-10 h-10 rounded-lg bg-growth-green flex items-center justify-center mb-5">
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <h3
                    className="text-xl font-semibold text-navy-900"
                    style={{ fontFamily: 'var(--font-hanken-grotesk)' }}
                  >
                    {title}
                  </h3>
                  <p className="mt-1.5 text-base text-on-surface-variant leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
```

- [ ] **Step 6: Write How It Works (3 steps) section**

```tsx
        {/* How It Works */}
        <section className="bg-surface-faint py-20 sm:py-28">
          <div className="mx-auto max-w-[1280px] px-5 sm:px-8">
            <AnimatedSection className="text-center mb-16">
              <h2
                className="text-[32px] sm:text-[40px] font-bold text-navy-900 tracking-tight"
                style={{ fontFamily: 'var(--font-hanken-grotesk)' }}
              >
                Three steps to your next role
              </h2>
              <p className="mt-3 text-lg text-on-surface-variant max-w-xl mx-auto">
                Get started in minutes, not hours.
              </p>
            </AnimatedSection>

            <div className="grid gap-8 md:grid-cols-3">
              {steps.map(({ step, title, desc }, i) => (
                <AnimatedSection key={step}>
                  <div className="text-center">
                    <div className="w-14 h-14 rounded-lg bg-blue-600 text-white text-lg font-bold flex items-center justify-center mx-auto mb-5">
                      {i + 1}
                    </div>
                    <h3
                      className="text-xl font-semibold text-navy-900"
                      style={{ fontFamily: 'var(--font-hanken-grotesk)' }}
                    >
                      {title}
                    </h3>
                    <p className="mt-2 text-base text-on-surface-variant leading-relaxed max-w-xs mx-auto">
                      {desc}
                    </p>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>
```

- [ ] **Step 7: Write Testimonial, CTA, and Footer sections**

```tsx
        {/* Testimonial */}
        <section className="bg-surface py-20 sm:py-28">
          <div className="mx-auto max-w-2xl px-5 sm:px-8 text-center">
            <AnimatedSection>
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-6">
                <Star className="h-5 w-5 text-blue-600" />
              </div>
              <blockquote className="text-xl sm:text-2xl text-navy-900 leading-relaxed font-medium">
                &ldquo;I went from sending out scattered applications to running a structured job search
                with My Career Dock. The resume builder alone saved me hours.&rdquo;
              </blockquote>
              <div className="mt-8 flex items-center justify-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-[#ff9f0a] text-[#ff9f0a]" />
                ))}
              </div>
              <div className="mt-6 flex items-center justify-center gap-3">
                <div className="flex -space-x-2">
                  {[
                    { bg: 'bg-blue-600', initial: 'S' },
                    { bg: 'bg-growth-green', initial: 'J' },
                    { bg: 'bg-blue-400', initial: 'M' },
                  ].map(({ bg, initial }) => (
                    <div
                      key={initial}
                      className={`h-9 w-9 rounded-full ${bg} ring-2 ring-white flex items-center justify-center text-white text-xs font-bold`}
                    >
                      {initial}
                    </div>
                  ))}
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-navy-900">Early Access Users</p>
                  <p className="text-xs text-outline">Join 10K+ job seekers</p>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-navy-900 py-20 sm:py-28">
          <div className="mx-auto max-w-3xl px-5 sm:px-8 text-center">
            <AnimatedSection>
              <h2
                className="text-[32px] sm:text-[40px] font-bold text-white tracking-tight"
                style={{ fontFamily: 'var(--font-hanken-grotesk)' }}
              >
                Ready to accelerate your career?
              </h2>
              <p className="mt-3 text-lg text-blue-400 max-w-lg mx-auto">
                Join My Career Dock for free. No credit card required.
              </p>
              <div className="mt-9 flex items-center justify-center gap-3 flex-wrap">
                <Link
                  href="/auth/signup"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-7 py-3.5 text-base font-semibold text-white hover:bg-blue-700 transition-colors"
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
      </main>

      {/* Footer */}
      <footer className="bg-surface-faint border-t border-[#DBEAFE] py-8">
        <div className="mx-auto max-w-[1280px] px-5 sm:px-8">
          <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
            <div className="flex items-center gap-2">
              <Image src="/logo.png" alt="My Career Dock" width={520} height={143} className="h-8 w-auto object-contain" />
              <span className="text-base font-bold text-navy-900" style={{ fontFamily: 'var(--font-hanken-grotesk)' }}>My Career Dock</span>
            </div>
            <p className="text-sm text-outline">
              &copy; {new Date().getFullYear()} My Career Dock. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
```

- [ ] **Step 8: Run tests to verify they all pass**

Run: `npx vitest run src/app/__tests__/page.test.tsx`
Expected: PASS

- [ ] **Step 9: Visual verification**

Run: `npm run dev`
Visit: `http://localhost:3000`
Verify:
- Hero renders with blue "Career Accelerator" accent
- Trust bar with 4 stats
- 3-column feature cards with green icons
- 3-step process with simple numbered badges
- Testimonial with 5 gold stars
- Navy CTA section with blue checkmarks
- Mobile: sections stack vertically at 16px margin

- [ ] **Step 10: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: redesign landing page with Anchor Precision design system"
```

---

### Task 5: Verify protected pages are unaffected

**Files:** None (verification only)

- [ ] **Step 1: Check dashboard still renders**

Visit: `http://localhost:3000/auth/login`
Expected: Login page uses existing styling (not Anchor Precision)

- [ ] **Step 2: Verify no broken references**

Run: `npm run build`
Expected: Build succeeds with no errors
