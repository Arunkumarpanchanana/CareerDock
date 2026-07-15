# Marketing Homepage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the marketing homepage placeholder with a full brand + conversion page at mycareerdock.com

**Architecture:** Two files: `marketing/layout.tsx` updated with sticky nav and footer, `marketing/page.tsx` rewritten as a client component with Hero → Features → How It Works → Pricing → Testimonials → FAQ → CTA sections. Reuses existing CSS custom properties and scroll-animate classes from `globals.css`.

**Tech Stack:** Next.js (client component), Lucide icons, Tailwind CSS v4 (CSS-based config)

## Global Constraints

- No new npm dependencies
- Use only existing CSS custom properties (`--color-navy-900`, `--accent`, etc.) and global classes (`.scroll-animate`, `.animate-float`, etc.) from `src/app/globals.css`
- Match the root page.tsx's scroll-animation pattern: `useInView` hook → `AnimatedSection` wrapper
- All brand colors referenced by CSS variable names, not hex values
- Logo as `<Image>` from `public/logo.png`

---

### Task 1: Enhance Marketing Layout with Sticky Nav and Improved Footer

**Files:**
- Modify: `src/app/marketing/layout.tsx` — full rewrite

**Interfaces:**
- Produces: `<MarketingLayout>` — wraps children with sticky nav + footer; nav has `href="/"` (logo + text), `/articles`, `/offers`, and external `app.mycareerdock.com` CTA

- [ ] **Step 1: Write the new layout**

```tsx
'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'

export default function MarketingLayout({ children }: { children: ReactNode }) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 20) }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="min-h-screen flex flex-col">
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-white border-b border-blue-100 shadow-sm'
            : 'bg-transparent'
        }`}
      >
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="CareerDock"
              width={256}
              height={256}
              className="h-8 w-auto object-contain transition-all duration-300"
              style={{ filter: scrolled ? 'none' : 'brightness(0) invert(1)' }}
            />
            <span
              className="text-lg font-bold transition-colors duration-300"
              style={{
                fontFamily: 'var(--font-hanken-grotesk)',
                color: scrolled ? 'var(--color-navy-900)' : '#ffffff',
              }}
            >
              CareerDock
            </span>
          </Link>
          <div className="flex items-center gap-6 text-sm">
            <Link
              href="/articles"
              className="font-medium transition-colors"
              style={{
                color: scrolled ? 'var(--color-on-surface-variant)' : 'rgba(255,255,255,0.8)',
              }}
            >
              Articles
            </Link>
            <Link
              href="/offers"
              className="font-medium transition-colors"
              style={{
                color: scrolled ? 'var(--color-on-surface-variant)' : 'rgba(255,255,255,0.8)',
              }}
            >
              Offers
            </Link>
            <a
              href="https://app.mycareerdock.com"
              className="inline-flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-all duration-300 hover:shadow-[0_4px_15px_rgba(59,130,246,0.4)]"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #0ea5e9)' }}
            >
              Get Started
            </a>
          </div>
        </div>
      </header>

      <main className="flex-1 pt-16">{children}</main>

      <footer className="border-t border-blue-100 bg-surface-faint py-8">
        <div className="mx-auto max-w-5xl px-4">
          <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
            <div className="flex items-center gap-2">
              <Image src="/logo.png" alt="CareerDock" width={256} height={256} className="h-7 w-auto object-contain" />
              <span className="text-base font-bold text-navy-900" style={{ fontFamily: 'var(--font-hanken-grotesk)' }}>CareerDock</span>
            </div>
            <div className="flex items-center gap-6">
              <Link href="/articles" className="text-sm text-outline hover:text-navy-900 transition-colors">Articles</Link>
              <Link href="/offers" className="text-sm text-outline hover:text-navy-900 transition-colors">Offers</Link>
              <span className="text-sm text-outline">&copy; {new Date().getFullYear()} CareerDock</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
```

- [ ] **Step 2: Verify it builds**

Run: `npm run typecheck 2>&1 | head -5`
Expected: No type errors in `marketing/layout.tsx`

- [ ] **Step 3: Commit**

```bash
git add src/app/marketing/layout.tsx
git commit -m "feat: enhance marketing layout with sticky nav and improved footer"
```

---

### Task 2: Build Marketing Homepage

**Files:**
- Rewrite: `src/app/marketing/page.tsx`

**Interfaces:**
- Consumes: `<MarketingLayout>` from Task 1 (wraps this page's content in `<main>`)
- Produces: Full homepage with all sections

- [ ] **Step 1: Write the marketing homepage**

```tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  ArrowUpRight, ChevronRight, ChevronDown,
  CheckCircle2, Star, Mic, FileText, Users, LayoutDashboard,
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
  { icon: Mic, title: 'AI Interview Practice', description: 'Realistic mock interviews with AI feedback tailored to your industry and experience level.' },
  { icon: FileText, title: 'Smart Resume Builder', description: 'ATS-optimized resumes with AI-powered suggestions and real-time scoring.' },
  { icon: Users, title: 'Career Coaching', description: 'Personalized guidance from AI and expert consultants who understand your field.' },
  { icon: LayoutDashboard, title: 'Job Tracker', description: 'Track applications, analyze skill gaps, and monitor progress in one dashboard.' },
]

const faqs = [
  { q: 'Is CareerDock really free to start?', a: 'Yes. Create a free account and start building resumes, tracking applications, and using AI suggestions right away — no credit card required.' },
  { q: "What's included in the Free plan?", a: 'The Free plan includes 3 resume builds, skill gap analysis, job search tools, and 10 AI suggestions per month.' },
  { q: 'How is Premium different from Free?', a: 'Premium unlocks unlimited resumes, AI mock interviews, 100 AI suggestions per month, and the full job pipeline tracker.' },
  { q: 'How do AI suggestions work?', a: 'As you build your resume, our AI analyzes your content and suggests stronger bullet points, better action verbs, and relevant skills based on your target role.' },
  { q: 'Can I cancel my subscription?', a: 'Absolutely. Cancel anytime from your account settings. You keep access to Premium features until the end of your billing period.' },
]

export default function MarketingHome() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-[linear-gradient(135deg,#0a1628_0%,#1a2744_50%,#0f1f3a_100%)] pt-16 pb-12 sm:pt-20 sm:pb-16">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl animate-pulse" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/3 left-1/4 w-64 h-64 rounded-full bg-cyan-500/5 blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        <div className="mx-auto max-w-4xl px-5 sm:px-8 text-center relative z-10">
          <div
            className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 mb-6"
            style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)' }}
          >
            <span className="text-sm">🔥</span>
            <span
              className="text-[11px] font-semibold tracking-[0.05em] uppercase"
              style={{ color: '#93bbff', fontFamily: 'var(--font-jetbrains-mono)' }}
            >
              85% of clients land interviews within 3 weeks
            </span>
          </div>

          <h1
            className="text-[40px] leading-[1.1] font-extrabold tracking-tight sm:text-[56px] lg:text-[64px]"
            style={{ fontFamily: 'var(--font-hanken-grotesk)', letterSpacing: '-0.02em', color: '#ffffff' }}
          >
            Land Your Dream Job Faster<br />
            <span style={{ color: '#94a3b8', fontWeight: 300 }}>with AI-Powered Career Tools</span>
          </h1>

          <p
            className="mx-auto mt-4 max-w-xl text-lg sm:text-xl leading-relaxed"
            style={{ color: '#94a3b8', fontFamily: 'var(--font-inter)' }}
          >
            Practice interviews, optimize your resume, get expert coaching — all in one place.
          </p>

          <div className="mt-9 flex items-center justify-center gap-3 flex-wrap">
            <a
              href="https://app.mycareerdock.com"
              className="inline-flex items-center gap-1.5 rounded-lg px-7 py-3.5 text-base font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(59,130,246,0.4)]"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #0ea5e9)' }}
            >
              Get Started Free <ArrowUpRight className="h-4 w-4" />
            </a>
            <Link
              href="/articles"
              className="inline-flex items-center gap-1.5 rounded-lg px-7 py-3.5 text-base font-semibold transition-colors"
              style={{ color: '#ffffff', border: '2px solid rgba(255,255,255,0.2)', background: 'transparent' }}
            >
              Read Articles <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div
            className="mt-10 flex items-center justify-center gap-6 sm:gap-10 flex-wrap pt-6"
            style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}
          >
            {[
              { icon: '👥', value: '10,000+', label: 'Active Users' },
              { icon: '📄', value: '5,000+', label: 'Resumes Built' },
              { icon: '⭐', value: '95%', label: 'Satisfaction Rate' },
              { icon: '🎓', value: '500+', label: 'Expert Sessions' },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <span className="text-2xl">{s.icon}</span>
                <p
                  className="text-[32px] sm:text-[40px] font-extrabold leading-none mt-1"
                  style={{ fontFamily: 'var(--font-hanken-grotesk)', color: '#ffffff' }}
                >
                  {s.value}
                </p>
                <p className="text-sm mt-1" style={{ color: '#94a3b8' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-surface-faint py-14 sm:py-20">
        <div className="mx-auto max-w-5xl px-5 sm:px-8">
          <AnimatedSection className="text-center mb-12">
            <div className="inline-flex items-center gap-2 mb-4">
              <span
                className="text-[11px] font-semibold tracking-[0.05em] uppercase"
                style={{ color: '#3b82f6', fontFamily: 'var(--font-jetbrains-mono)' }}
              >
                Features
              </span>
              <div className="w-12 h-px" style={{ background: 'linear-gradient(90deg, #3b82f6, transparent)' }} />
            </div>
            <h2
              className="text-[32px] sm:text-[40px] font-bold text-navy-900 tracking-tight"
              style={{ fontFamily: 'var(--font-hanken-grotesk)' }}
            >
              Everything you need to advance your career
            </h2>
          </AnimatedSection>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feat, i) => (
              <AnimatedSection key={feat.title}>
                <div className="rounded-xl bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl h-full" style={{ boxShadow: '0 4px 20px rgba(0,27,61,0.05)' }}>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg" style={{ background: 'var(--accent-gradient)' }}>
                    <feat.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-navy-900" style={{ fontFamily: 'var(--font-hanken-grotesk)' }}>{feat.title}</h3>
                  <p className="mt-2 text-sm text-on-surface-variant leading-relaxed">{feat.description}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-surface py-14 sm:py-20">
        <div className="mx-auto max-w-4xl px-5 sm:px-8">
          <AnimatedSection className="text-center mb-14">
            <h2
              className="text-[32px] sm:text-[40px] font-bold text-navy-900 tracking-tight"
              style={{ fontFamily: 'var(--font-hanken-grotesk)' }}
            >
              How It Works
            </h2>
            <p className="mt-3 text-lg text-on-surface-variant max-w-xl mx-auto">
              Three simple steps to transform your career.
            </p>
          </AnimatedSection>

          <div className="grid gap-8 sm:grid-cols-3">
            {[
              { num: '01', icon: '🎯', title: 'Assess', desc: 'Tell us about your career goals and current situation. We\'ll build a personalized plan.' },
              { num: '02', icon: '🚀', title: 'Practice', desc: 'Use AI interviews, resume tools, and coaching to prepare with confidence.' },
              { num: '03', icon: '🏆', title: 'Succeed', desc: 'Apply with a polished resume, ace your interviews, and land your dream role.' },
            ].map((step) => (
              <AnimatedSection key={step.num}>
                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-600">
                    <span className="text-2xl">{step.icon}</span>
                  </div>
                  <span
                    className="text-xs font-semibold tracking-[0.1em] uppercase text-blue-600"
                    style={{ fontFamily: 'var(--font-jetbrains-mono)' }}
                  >
                    {step.num}
                  </span>
                  <h3 className="mt-2 text-xl font-bold text-navy-900" style={{ fontFamily: 'var(--font-hanken-grotesk)' }}>{step.title}</h3>
                  <p className="mt-2 text-sm text-on-surface-variant leading-relaxed">{step.desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-surface-faint py-14 sm:py-20">
        <div className="mx-auto max-w-5xl px-5 sm:px-8">
          <AnimatedSection className="text-center mb-12">
            <div className="inline-flex items-center gap-2 mb-4">
              <span
                className="text-[11px] font-semibold tracking-[0.05em] uppercase"
                style={{ color: '#3b82f6', fontFamily: 'var(--font-jetbrains-mono)' }}
              >
                Pricing
              </span>
              <div className="w-12 h-px" style={{ background: 'linear-gradient(90deg, #3b82f6, transparent)' }} />
            </div>
            <h2
              className="text-[32px] sm:text-[40px] font-bold text-navy-900 tracking-tight"
              style={{ fontFamily: 'var(--font-hanken-grotesk)' }}
            >
              Simple, transparent pricing
            </h2>
            <p className="mt-3 text-lg text-on-surface-variant max-w-xl mx-auto">
              Start free, upgrade when you&apos;re ready.
            </p>
          </AnimatedSection>

          <div className="grid gap-5 md:grid-cols-3 max-w-4xl mx-auto">
            {/* Free Trial */}
            <div
              className="group rounded-xl bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              style={{ boxShadow: '0 4px 20px rgba(0,27,61,0.05)' }}
            >
              <div className="text-2xl mb-3">✨</div>
              <h3 className="text-lg font-semibold text-navy-900" style={{ fontFamily: 'var(--font-hanken-grotesk)' }}>
                Free Trial
              </h3>
              <p className="text-sm text-on-surface-variant mt-1 mb-3">Get started</p>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-[40px] font-extrabold text-navy-900 leading-none" style={{ fontFamily: 'var(--font-hanken-grotesk)' }}>₹0</span>
                <span className="text-sm text-on-surface-variant">/mo</span>
              </div>
              <ul className="space-y-3 mb-8">
                {['3 resume builds', 'Skill gap analysis', 'Job search tools', '10 AI suggestions / month'].map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-on-surface-variant">
                    <CheckCircle2 className="h-4 w-4 text-growth-green shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <a
                href="https://app.mycareerdock.com/auth/signup"
                className="flex w-full items-center justify-center rounded-lg border-2 border-navy-900 px-5 py-2.5 text-sm font-semibold text-navy-900 transition-colors hover:bg-navy-900 hover:text-white"
              >
                Get Started
              </a>
            </div>

            {/* Premium */}
            <div
              className="group rounded-xl bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl relative"
              style={{ boxShadow: '0 4px 20px rgba(0,27,61,0.05)', border: '2px solid #3b82f6' }}
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center rounded-full px-3 py-1" style={{ background: '#3b82f6' }}>
                <span className="text-[10px] font-semibold text-white tracking-wider uppercase" style={{ fontFamily: 'var(--font-jetbrains-mono)' }}>
                  Most Popular
                </span>
              </div>
              <div className="text-2xl mb-3">⚡</div>
              <h3 className="text-lg font-semibold text-navy-900" style={{ fontFamily: 'var(--font-hanken-grotesk)' }}>
                Premium
              </h3>
              <p className="text-sm text-on-surface-variant mt-1 mb-3">For serious job seekers</p>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-sm text-on-surface-variant">₹</span>
                <span className="text-[40px] font-extrabold text-navy-900 leading-none" style={{ fontFamily: 'var(--font-hanken-grotesk)' }}>299</span>
                <span className="text-sm text-on-surface-variant">/mo</span>
              </div>
              <ul className="space-y-3 mb-8">
                {['Unlimited resumes', 'AI mock interviews', '100 AI suggestions / month', 'Job pipeline tracker'].map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-on-surface-variant">
                    <CheckCircle2 className="h-4 w-4 text-growth-green shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <a
                href="https://app.mycareerdock.com/auth/signup"
                className="flex w-full items-center justify-center rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_4px_15px_rgba(59,130,246,0.4)]"
                style={{ background: 'linear-gradient(135deg, #3b82f6, #0ea5e9)' }}
              >
                Upgrade <ArrowUpRight className="h-4 w-4 ml-1" />
              </a>
            </div>

            {/* Premium Pro */}
            <div
              className="group rounded-xl bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl relative"
              style={{ boxShadow: '0 4px 20px rgba(0,27,61,0.05)' }}
            >
              <div className="text-2xl mb-3">👑</div>
              <h3 className="text-lg font-semibold text-navy-900" style={{ fontFamily: 'var(--font-hanken-grotesk)' }}>
                Premium Pro
              </h3>
              <p className="text-sm text-on-surface-variant mt-1 mb-3">Everything plus expert guidance</p>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-sm text-on-surface-variant">₹</span>
                <span className="text-[40px] font-extrabold text-navy-900 leading-none" style={{ fontFamily: 'var(--font-hanken-grotesk)' }}>500</span>
                <span className="text-sm text-on-surface-variant">/mo</span>
              </div>
              <ul className="space-y-3 mb-8">
                {['Everything in Premium', 'Unlimited AI suggestions', '1:1 expert sessions', 'Priority support'].map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-on-surface-variant">
                    <CheckCircle2 className="h-4 w-4 text-growth-green shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <a
                href="https://app.mycareerdock.com/auth/signup"
                className="flex w-full items-center justify-center rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_4px_15px_rgba(59,130,246,0.4)]"
                style={{ background: 'linear-gradient(135deg, #3b82f6, #0ea5e9)' }}
              >
                Go Pro <ArrowUpRight className="h-4 w-4 ml-1" />
              </a>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-on-surface-variant">
              All plans include a free trial. No credit card required.
            </p>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-surface py-14 sm:py-20">
        <div className="mx-auto max-w-4xl px-5 sm:px-8">
          <AnimatedSection className="text-center mb-10">
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
            {[
              {
                quote: 'I went from sending out scattered applications to running a structured job search with CareerDock. The resume builder alone saved me hours.',
                name: 'Sarah K.', role: 'Product Manager, Bangalore', initial: 'S', color: 'bg-blue-600',
              },
              {
                quote: 'The AI interview coaching was a game-changer. I went from nervous to confident, and landed an offer within 2 weeks.',
                name: 'Rahul M.', role: 'Software Engineer, Pune', initial: 'R', color: 'bg-growth-green',
              },
            ].map((t) => (
              <AnimatedSection key={t.name}>
                <div className="rounded-xl bg-white p-6 hover:-translate-y-1 hover:shadow-xl transition-all duration-300" style={{ boxShadow: '0 4px 20px rgba(0,27,61,0.05)' }}>
                  <div className="flex items-center gap-1 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-[#ff9f0a] text-[#ff9f0a]" />
                    ))}
                  </div>
                  <blockquote className="text-base text-navy-900 leading-relaxed">
                    &ldquo;{t.quote}&rdquo;
                  </blockquote>
                  <div className="mt-6 flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-full ${t.color} flex items-center justify-center text-white text-sm font-bold`}>
                      {t.initial}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-navy-900">{t.name}</p>
                      <p className="text-xs text-outline">{t.role}</p>
                    </div>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>

          <div className="mt-10 text-center">
            <p className="text-sm text-outline">Join <strong className="text-navy-900">10,000+</strong> professionals who accelerated their careers</p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-surface-faint py-14 sm:py-20">
        <div className="mx-auto max-w-3xl px-5 sm:px-8">
          <AnimatedSection className="text-center mb-10">
            <h2
              className="text-[32px] sm:text-[40px] font-bold text-navy-900 tracking-tight"
              style={{ fontFamily: 'var(--font-hanken-grotesk)' }}
            >
              Frequently Asked Questions
            </h2>
            <p className="mt-3 text-lg text-on-surface-variant max-w-xl mx-auto">
              Quick answers to common questions.
            </p>
          </AnimatedSection>

          <div className="space-y-0">
            {faqs.map((faq, i) => (
              <div key={i} className="border-b border-blue-100 last:border-b-0">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between gap-4 py-5 text-left transition-colors hover:text-blue-600"
                >
                  <span className="text-base font-semibold text-navy-900" style={{ fontFamily: 'var(--font-hanken-grotesk)' }}>
                    {faq.q}
                  </span>
                  <ChevronDown className={`h-5 w-5 shrink-0 text-outline transition-transform duration-300 ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${openFaq === i ? 'max-h-96 pb-5' : 'max-h-0'}`}>
                  <p className="text-base text-on-surface-variant leading-relaxed">{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-navy-900 py-14 sm:py-20">
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
            <div className="mt-7 flex items-center justify-center gap-3 flex-wrap">
              <a
                href="https://app.mycareerdock.com/auth/signup"
                className="inline-flex items-center gap-1.5 rounded-lg px-7 py-3.5 text-base font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(59,130,246,0.4)]"
                style={{ background: 'linear-gradient(135deg, #3b82f6, #0ea5e9)' }}
              >
                Create Free Account <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>
            <div className="mt-8 flex items-center justify-center gap-6 text-sm text-blue-400 flex-wrap">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" /> No credit card</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" /> Cancel anytime</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" /> Free updates</span>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </>
  )
}
```

- [ ] **Step 2: Verify build + typecheck**

Run: `npm run typecheck 2>&1 | tail -5`
Expected: No type errors

- [ ] **Step 3: Commit**

```bash
git add src/app/marketing/page.tsx
git commit -m "feat: build marketing homepage with all sections"
```

---

### Verification

- [ ] **Typecheck**: `npm run typecheck` — should pass with only pre-existing errors
- [ ] **Lint**: `npm run lint` — no new errors from our files
- [ ] **Test**: `npm test` — all 149 tests still pass
- [ ] **Visual inspection**: Load `mycareerdock.com/` locally and verify all sections render correctly
