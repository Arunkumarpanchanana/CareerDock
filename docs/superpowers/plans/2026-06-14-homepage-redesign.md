# Homepage Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Full redesign of the public landing page with bold flat design, scroll-triggered animations, floating background shapes, and micro-interactions.

**Architecture:** Single `'use client'` page component with inline IntersectionObserver hooks for scroll animations. Keyframe animations defined in globals.css. No new dependencies.

**Tech Stack:** Next.js 16, Tailwind CSS v4, Lucide icons, Geist font

---

### Task 1: Add CSS animations to globals.css

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Add keyframe animations before the body rule**

```css
@keyframes float {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  33% { transform: translateY(-10px) rotate(1deg); }
  66% { transform: translateY(5px) rotate(-1deg); }
}

@keyframes float-delayed {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-15px) rotate(2deg); }
}

@keyframes fade-in-up {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes fade-in-down {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes pulse-soft {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.03); }
}

@keyframes count-up {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

- [ ] **Step 2: Add animation utility classes after the root variables**

```css
.animate-float {
  animation: float 6s ease-in-out infinite;
}

.animate-float-delayed {
  animation: float-delayed 8s ease-in-out infinite;
}

.animate-fade-in-up {
  animation: fade-in-up 0.6s ease-out forwards;
}

.animate-fade-in-down {
  animation: fade-in-down 0.5s ease-out forwards;
}

.animate-pulse-soft {
  animation: pulse-soft 2s ease-in-out infinite;
}

.scroll-animate {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.6s ease-out, transform 0.6s ease-out;
}

.scroll-animate.visible {
  opacity: 1;
  transform: translateY(0);
}

.scroll-animate-stagger {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.5s ease-out, transform 0.5s ease-out;
}

.scroll-animate-stagger.visible {
  opacity: 1;
  transform: translateY(0);
}

@media (prefers-reduced-motion: reduce) {
  .animate-float,
  .animate-float-delayed,
  .animate-fade-in-up,
  .animate-fade-in-down,
  .animate-pulse-soft,
  .scroll-animate,
  .scroll-animate-stagger {
    animation: none;
    opacity: 1;
    transform: none;
  }
}
```

- [ ] **Step 3: Run typecheck to verify**

```bash
npm run typecheck
```
Expected: clean exit, no errors

- [ ] **Step 4: Commit**

```bash
git add src/app/globals.css
git commit -m "feat: add CSS keyframe animations for homepage"
```

---

### Task 2: Rewrite homepage with new design and animations

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Write the full page component**

```tsx
'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import {
  Building2,
  FileText,
  Kanban,
  Sparkles,
  Users,
  ChevronRight,
  CheckCircle2,
  ArrowUpRight,
  Star,
  Quote,
  BarChart3,
  GraduationCap,
  Target,
  HeartHandshake,
} from 'lucide-react'

function useInView<T extends HTMLElement>(options?: IntersectionObserverInit) {
  const ref = useRef<T>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); observer.unobserve(el) } },
      { threshold: 0.1, ...options }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [options])

  return { ref, inView }
}

function AnimatedSection({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, inView } = useInView<HTMLDivElement>()
  return (
    <div
      ref={ref}
      className={`scroll-animate ${inView ? 'visible' : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

function StaggerGroup({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const { ref, inView } = useInView<HTMLDivElement>()
  return (
    <div ref={ref} className={`${inView ? 'visible' : ''} ${className}`}>
      {children}
    </div>
  )
}

function CountUp({ end, suffix = '' }: { end: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  const { ref, inView } = useInView<HTMLDivElement>()

  useEffect(() => {
    if (!inView) return
    const duration = 1500
    const steps = 30
    const increment = end / steps
    let current = 0
    const timer = setInterval(() => {
      current += increment
      if (current >= end) {
        setCount(end)
        clearInterval(timer)
      } else {
        setCount(Math.floor(current))
      }
    }, duration / steps)
    return () => clearInterval(timer)
  }, [inView, end])

  return <span ref={ref}>{count}{suffix}</span>
}

const stats = [
  { value: 10, suffix: 'K+', label: 'Active Users' },
  { value: 5, suffix: 'K+', label: 'Resumes Built' },
  { value: 500, suffix: '+', label: 'Expert Sessions' },
  { value: 95, suffix: '%', label: 'Satisfaction' },
]

const features = [
  {
    icon: FileText,
    title: 'ATS Resume Builder',
    desc: 'Create clean, serif-formatted resumes that pass Applicant Tracking Systems. Download as PDF instantly.',
    color: 'text-blue-600 bg-blue-100',
    delay: 0,
  },
  {
    icon: Kanban,
    title: 'Job Pipeline Tracker',
    desc: 'Drag applications across Wishlist → Applied → Interviewing → Offered → Rejected. Never lose track.',
    color: 'text-emerald-600 bg-emerald-100',
    delay: 100,
  },
  {
    icon: Sparkles,
    title: 'Smart Suggestions',
    desc: 'Get smart suggestions for bullet points, skills, and summaries. Optimize for every job description.',
    color: 'text-violet-600 bg-violet-100',
    delay: 200,
  },
  {
    icon: Users,
    title: 'Expert Consultations',
    desc: 'Book 1:1 sessions with industry professionals for resume reviews, interview prep, and career advice.',
    color: 'text-amber-600 bg-amber-100',
    delay: 300,
  },
]

const steps = [
  { step: '01', title: 'Build Your Resume', desc: 'Fill in your details with our guided editor. Choose from expert-written templates and bullet point suggestions.' },
  { step: '02', title: 'Track Applications', desc: 'Add jobs to your pipeline, move them across stages with drag-and-drop, and never miss a follow-up.' },
  { step: '03', title: 'Get Expert Help', desc: 'Book 1:1 sessions with industry professionals who have been where you want to go. Get feedback that works.' },
]

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Floating Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/60">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 shadow-sm transition-transform duration-200 group-hover:scale-105">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900">CareerDock</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/auth/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors duration-200"
            >
              Sign In
            </Link>
            <Link
              href="/auth/signup"
              className="rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 px-5 py-2 text-sm font-medium text-white hover:from-blue-700 hover:to-violet-700 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 pt-16">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50">
          {/* Floating background shapes */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-20 left-[15%] w-72 h-72 rounded-full bg-blue-100/40 animate-float blur-xl" />
            <div className="absolute top-40 right-[20%] w-96 h-96 rounded-full bg-violet-100/30 animate-float-delayed blur-xl" />
            <div className="absolute bottom-20 left-[40%] w-64 h-64 rounded-full bg-amber-100/20 animate-float blur-xl" style={{ animationDuration: '10s' }} />
            <div className="absolute top-60 left-[5%] w-16 h-16 rounded-full border-2 border-blue-200/50 animate-float-delayed" />
            <div className="absolute top-32 right-[10%] w-8 h-8 rounded-full border-2 border-violet-200/50 animate-float" style={{ animationDuration: '7s' }} />
            <div className="absolute bottom-40 right-[30%] w-12 h-12 rounded-full bg-blue-100/60 animate-float-delayed" style={{ animationDuration: '9s' }} />
          </div>

          <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
            <div className="text-center max-w-4xl mx-auto">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/80 px-4 py-1.5 text-sm font-medium text-blue-700 mb-8 animate-fade-in-down">
                <Sparkles className="h-4 w-4" />
                Land your dream job faster
              </div>

              <h1 className="text-5xl font-bold tracking-tight text-slate-900 sm:text-6xl lg:text-7xl leading-[1.1] animate-fade-in-up" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
                Your{' '}
                <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                  Career Accelerator
                </span>
                <br />
                in One Place
              </h1>

              <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600 leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
                Build ATS-optimized resumes, track every job application on a visual Kanban board,
                get smart suggestions for your resume, and book 1:1 sessions with industry experts — all from one dashboard.
              </p>

              <div className="mt-10 flex items-center justify-center gap-4 flex-wrap animate-fade-in-up" style={{ animationDelay: '0.3s', animationFillMode: 'both' }}>
                <Link
                  href="/auth/signup"
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 px-8 py-3.5 text-base font-semibold text-white hover:from-blue-700 hover:to-violet-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Start Free <ArrowUpRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/auth/login"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-8 py-3.5 text-base font-semibold text-slate-700 hover:bg-slate-50 transition-colors duration-200"
                >
                  Sign In <ChevronRight className="h-4 w-4" />
                </Link>
              </div>

              {/* Stats Row */}
              <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto">
                {[
                  { label: 'Resume Templates', value: '10+' },
                  { label: 'Job Pipelines', value: 'Unlimited' },
                  { label: 'Expert Sessions', value: '1:1' },
                ].map((stat) => (
                  <div key={stat.label} className="text-center">
                    <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                    <p className="text-sm text-slate-500 mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Trust/Stats Bar */}
        <section className="bg-slate-50 border-y border-slate-100 py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <StaggerGroup>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {stats.map((s, i) => (
                  <div
                    key={s.label}
                    className="scroll-animate-stagger text-center"
                    style={{ transitionDelay: `${i * 100}ms` }}
                  >
                    <p className="text-3xl font-bold text-slate-900">
                      <CountUp end={s.value} suffix={s.suffix} />
                    </p>
                    <p className="text-sm text-slate-500 mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
            </StaggerGroup>
          </div>
        </section>

        {/* Features Grid */}
        <section className="bg-white py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <AnimatedSection className="text-center mb-16">
              <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">
                Everything you need to land the role
              </h2>
              <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
                From resume to offer letter — CareerDock supports every step of your job search.
              </p>
            </AnimatedSection>

            <StaggerGroup>
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
                {features.map(({ icon: Icon, title, desc, color, delay }) => (
                  <div
                    key={title}
                    className="scroll-animate-stagger group rounded-xl border border-slate-200 bg-white p-6 hover:-translate-y-1 hover:shadow-lg hover:border-blue-200 transition-all duration-300 cursor-default"
                    style={{ transitionDelay: `${delay}ms` }}
                  >
                    <div className={`inline-flex rounded-lg p-3 ${color} mb-4`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 group-hover:text-blue-600 transition-colors duration-200">
                      {title}
                    </h3>
                    <p className="mt-2 text-sm text-slate-600 leading-relaxed">{desc}</p>
                  </div>
                ))}
              </div>
            </StaggerGroup>
          </div>
        </section>

        {/* How It Works */}
        <section className="bg-slate-50 py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <AnimatedSection className="text-center mb-16">
              <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">
                Three steps to your next role
              </h2>
              <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
                Get started in minutes, not hours.
              </p>
            </AnimatedSection>

            <StaggerGroup>
              <div className="grid gap-12 md:grid-cols-3 relative">
                {/* Connecting line */}
                <div className="hidden md:block absolute top-12 left-[16.67%] right-[16.67%] h-0.5 bg-gradient-to-r from-blue-200 via-violet-200 to-amber-200" />

                {steps.map(({ step, title, desc }, i) => (
                  <div
                    key={step}
                    className="scroll-animate-stagger relative text-center"
                    style={{ transitionDelay: `${i * 150}ms` }}
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 text-lg font-bold text-white mx-auto mb-4 relative z-10 shadow-md">
                      {step}
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900">{title}</h3>
                    <p className="mt-2 text-slate-600 leading-relaxed max-w-sm mx-auto">{desc}</p>
                  </div>
                ))}
              </div>
            </StaggerGroup>
          </div>
        </section>

        {/* Testimonial */}
        <section className="bg-white py-24">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
            <AnimatedSection>
              <Quote className="h-8 w-8 text-blue-200 mx-auto mb-6" />
              <blockquote className="text-xl sm:text-2xl text-slate-700 leading-relaxed font-medium">
                &ldquo;I went from sending out scattered applications to running a structured job search
                with CareerDock. The resume builder alone saved me hours.&rdquo;
              </blockquote>
              <div className="mt-8 flex items-center justify-center gap-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <div className="mt-4 flex items-center justify-center gap-3">
                <div className="flex -space-x-2">
                  {['bg-blue-500', 'bg-emerald-500', 'bg-violet-500'].map((bg, i) => (
                    <div key={i} className={`h-10 w-10 rounded-full ${bg} ring-2 ring-white flex items-center justify-center text-white text-xs font-bold`}>
                      {['S', 'J', 'M'][i]}
                    </div>
                  ))}
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-slate-900">Early Access Users</p>
                  <p className="text-xs text-slate-500">Join 10K+ job seekers</p>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-gradient-to-br from-blue-600 to-violet-700 py-20 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-10 right-[20%] w-64 h-64 rounded-full bg-white/5 animate-float-delayed blur-2xl" />
            <div className="absolute bottom-10 left-[20%] w-48 h-48 rounded-full bg-white/5 animate-float blur-2xl" />
          </div>
          <div className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Ready to accelerate your career?
            </h2>
            <p className="mt-4 text-lg text-blue-100 max-w-xl mx-auto">
              Join CareerDock for free. No credit card required.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4 flex-wrap">
              <Link
                href="/auth/signup"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-blue-700 hover:bg-blue-50 transition-all duration-200 shadow-lg hover:shadow-xl animate-pulse-soft"
              >
                Create Free Account <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-8 flex items-center justify-center gap-6 text-sm text-blue-200">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" /> No credit card</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" /> Cancel anytime</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" /> Free updates</span>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-slate-50 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-violet-600">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <span className="text-sm font-semibold text-slate-900">CareerDock</span>
            </div>
            <p className="text-sm text-slate-500">
              &copy; {new Date().getFullYear()} CareerDock. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
```

- [ ] **Step 2: Run typecheck**

```bash
npm run typecheck
```
Expected: clean exit, no errors

- [ ] **Step 3: Run full test suite**

```bash
npx vitest run
```
Expected: all 106 tests pass

- [ ] **Step 4: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: redesign homepage with bold flat design and scroll animations"
```
