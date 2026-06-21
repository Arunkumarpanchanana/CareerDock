'use client'

import { useEffect, useRef, useState } from 'react'
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
} from 'lucide-react'

function useInView<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); observer.unobserve(el) } },
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return { ref, inView }
}

function AnimatedSection({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const { ref, inView } = useInView<HTMLDivElement>()
  return (
    <div ref={ref} className={`scroll-animate ${inView ? 'visible' : ''} ${className}`}>
      {children}
    </div>
  )
}

function StaggerItem({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const { ref, inView } = useInView<HTMLDivElement>()
  return (
    <div
      ref={ref}
      className={`scroll-animate-stagger ${inView ? 'visible' : ''}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
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

const trustStats = [
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
    <div className="flex min-h-screen flex-col bg-[var(--bg-primary)]">
      {/* Floating Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[var(--glass-bg)] backdrop-blur-xl border-b border-[var(--glass-border)]">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--accent-gradient)] shadow-sm transition-transform duration-200 group-hover:scale-105">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-[var(--text-primary)]">CareerDock</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/auth/login"
              className="rounded-xl px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-200"
            >
              Sign In
            </Link>
            <Link
              href="/auth/signup"
              className="rounded-xl bg-[var(--accent-gradient)] px-5 py-2 text-sm font-medium text-white hover:opacity-90 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 pt-16">
        {/* Hero */}
        <section className="relative overflow-hidden bg-[var(--bg-primary)]">
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-20 left-[15%] w-72 h-72 rounded-full bg-[var(--accent)]/10 animate-float blur-3xl" />
            <div className="absolute top-40 right-[20%] w-96 h-96 rounded-full bg-violet-500/10 animate-float-delayed blur-3xl" />
            <div className="absolute bottom-20 left-[40%] w-64 h-64 rounded-full bg-[var(--accent)]/5 animate-float blur-3xl" style={{ animationDuration: '10s' }} />
            <div className="absolute top-60 left-[5%] w-16 h-16 rounded-full border-2 border-[var(--glass-border)] animate-float-delayed" />
            <div className="absolute top-32 right-[10%] w-8 h-8 rounded-full border-2 border-[var(--accent)]/20 animate-float" style={{ animationDuration: '7s' }} />
            <div className="absolute bottom-40 right-[30%] w-12 h-12 rounded-full bg-[var(--accent)]/10 animate-float-delayed" style={{ animationDuration: '9s' }} />
          </div>

          <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
            <div className="text-center max-w-4xl mx-auto">
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--accent)]/20 bg-[var(--accent)]/10 backdrop-blur-xl px-4 py-1.5 text-sm font-medium text-[var(--accent)] mb-8 animate-fade-in-down">
                <Sparkles className="h-4 w-4" />
                Land your dream job faster
              </div>

              <h1 className="text-5xl font-bold tracking-tight text-[var(--text-primary)] sm:text-6xl lg:text-7xl leading-[1.1] animate-fade-in-up" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
                Your{' '}
                <span className="bg-[var(--accent-gradient)] bg-clip-text text-transparent">
                  Career Accelerator
                </span>
                <br />
                in One Place
              </h1>

              <p className="mx-auto mt-6 max-w-2xl text-lg text-[var(--text-secondary)] leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
                Build ATS-optimized resumes, track every job application on a visual Kanban board,
                get smart suggestions for your resume, and book 1:1 sessions with industry experts — all from one dashboard.
              </p>

              <div className="mt-10 flex items-center justify-center gap-4 flex-wrap animate-fade-in-up" style={{ animationDelay: '0.3s', animationFillMode: 'both' }}>
                <Link
                  href="/auth/signup"
                  className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent-gradient)] px-8 py-3.5 text-base font-semibold text-white hover:opacity-90 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Start Free <ArrowUpRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/auth/login"
                  className="inline-flex items-center gap-2 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-xl px-8 py-3.5 text-base font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-all duration-200"
                >
                  Sign In <ChevronRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto">
                {[
                  { label: 'Resume Templates', value: '10+' },
                  { label: 'Job Pipelines', value: 'Unlimited' },
                  { label: 'Expert Sessions', value: '1:1' },
                ].map((stat) => (
                  <div key={stat.label} className="text-center rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-xl p-4">
                    <p className="text-2xl font-bold text-[var(--text-primary)]">{stat.value}</p>
                    <p className="text-sm text-[var(--text-tertiary)] mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Trust Stats */}
        <section className="border-y border-[var(--glass-border)] py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {trustStats.map((s, i) => (
                <StaggerItem key={s.label} delay={i * 100}>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-[var(--text-primary)]">
                      <CountUp end={s.value} suffix={s.suffix} />
                    </p>
                    <p className="text-sm text-[var(--text-tertiary)] mt-1">{s.label}</p>
                  </div>
                </StaggerItem>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <AnimatedSection className="text-center mb-16">
              <h2 className="text-3xl font-bold text-[var(--text-primary)] sm:text-4xl">
                Everything you need to land the role
              </h2>
              <p className="mt-4 text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
                From resume to offer letter — CareerDock supports every step of your job search.
              </p>
            </AnimatedSection>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {features.map(({ icon: Icon, title, desc, color, delay }) => (
                <StaggerItem key={title} delay={delay}>
                  <div className="group rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-xl p-6 hover:-translate-y-1 hover:shadow-[var(--glass-glow)] hover:border-[var(--accent)]/30 transition-all duration-300 cursor-default">
                    <div className={`inline-flex rounded-xl p-3 ${color} mb-4`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors duration-200">
                      {title}
                    </h3>
                    <p className="mt-2 text-sm text-[var(--text-secondary)] leading-relaxed">{desc}</p>
                  </div>
                </StaggerItem>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="border-y border-[var(--glass-border)] py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <AnimatedSection className="text-center mb-16">
              <h2 className="text-3xl font-bold text-[var(--text-primary)] sm:text-4xl">
                Three steps to your next role
              </h2>
              <p className="mt-4 text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
                Get started in minutes, not hours.
              </p>
            </AnimatedSection>

            <div className="grid gap-12 md:grid-cols-3 relative">
              <div className="hidden md:block absolute top-12 left-[16.67%] right-[16.67%] h-0.5 bg-gradient-to-r from-[var(--accent)]/30 via-violet-500/30 to-[var(--accent)]/30" />

              {steps.map(({ step, title, desc }, i) => (
                <StaggerItem key={step} delay={i * 150}>
                  <div className="relative text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent-gradient)] text-lg font-bold text-white mx-auto mb-4 relative z-10 shadow-lg shadow-[var(--glass-glow)]">
                      {step}
                    </div>
                    <h3 className="text-xl font-semibold text-[var(--text-primary)]">{title}</h3>
                    <p className="mt-2 text-[var(--text-secondary)] leading-relaxed max-w-sm mx-auto">{desc}</p>
                  </div>
                </StaggerItem>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonial */}
        <section className="py-24">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
            <AnimatedSection>
              <Quote className="h-8 w-8 text-[var(--accent)]/30 mx-auto mb-6" />
              <blockquote className="text-xl sm:text-2xl text-[var(--text-primary)] leading-relaxed font-medium">
                &ldquo;I went from sending out scattered applications to running a structured job search
                with CareerDock. The resume builder alone saved me hours.&rdquo;
              </blockquote>
              <div className="mt-8 flex items-center justify-center gap-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-[var(--warning)] text-[var(--warning)]" />
                ))}
              </div>
              <div className="mt-4 flex items-center justify-center gap-3">
                <div className="flex -space-x-2">
                  {['bg-[var(--accent)]', 'bg-[var(--success)]', 'bg-violet-500'].map((bg) => (
                    <div key={bg} className={`h-10 w-10 rounded-full ${bg} ring-2 ring-[var(--bg-primary)] flex items-center justify-center text-white text-xs font-bold`}>
                      {bg.includes('accent') ? 'S' : bg.includes('success') ? 'J' : 'M'}
                    </div>
                  ))}
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">Early Access Users</p>
                  <p className="text-xs text-[var(--text-tertiary)]">Join 10K+ job seekers</p>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-[var(--accent-gradient)] py-20 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-10 right-[20%] w-64 h-64 rounded-full bg-white/5 animate-float-delayed blur-2xl" />
            <div className="absolute bottom-10 left-[20%] w-48 h-48 rounded-full bg-white/5 animate-float blur-2xl" />
          </div>
          <div className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Ready to accelerate your career?
            </h2>
            <p className="mt-4 text-lg text-white/80 max-w-xl mx-auto">
              Join CareerDock for free. No credit card required.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4 flex-wrap">
              <Link
                href="/auth/signup"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-[var(--accent)] hover:bg-white/90 transition-all duration-200 shadow-lg hover:shadow-xl animate-pulse-soft"
              >
                Create Free Account <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-8 flex items-center justify-center gap-6 text-sm text-white/60">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" /> No credit card</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" /> Cancel anytime</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" /> Free updates</span>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--glass-border)] py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent-gradient)]">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <span className="text-sm font-semibold text-[var(--text-primary)]">CareerDock</span>
            </div>
            <p className="text-sm text-[var(--text-tertiary)]">
              &copy; {new Date().getFullYear()} CareerDock. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
