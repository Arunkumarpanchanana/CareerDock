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

const statsData = [
  { value: '10K+', label: 'Active Users' },
  { value: '5K+', label: 'Resumes Built' },
  { value: '500+', label: 'Expert Sessions' },
  { value: '95%', label: 'Satisfaction' },
]

const steps = [
  { title: 'Build Your Resume', desc: 'Fill in your details with our guided editor. Choose from expert-written templates.' },
  { title: 'Track Applications', desc: 'Add jobs to your pipeline and move them across stages with ease.' },
  { title: 'Get Expert Help', desc: 'Book 1:1 sessions with professionals who have been where you want to go.' },
]

export default function HomePage() {
  const [scrolled, setScrolled] = useState(false)
  const [prices, setPrices] = useState<Record<string, { monthly: number; yearly: number }>>({})

  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 20) }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    fetch('/api/plan-prices')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          const map: Record<string, { monthly: number; yearly: number }> = {}
          data.forEach((p: any) => { map[p.plan_tier] = { monthly: p.monthly_price, yearly: p.yearly_price } })
          setPrices(map)
        }
      })
      .catch(() => {})
  }, [])

  return (
    <div className="flex min-h-screen flex-col">
      {/* Navigation */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white border-b border-blue-100' : 'bg-transparent'}`}>
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
              {statsData.map((s) => (
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
                  className="group rounded-lg bg-white p-8 shadow-[0_4px_20px_rgba(0,27,61,0.05)] hover:shadow-[0_8px_30px_rgba(0,27,61,0.1)] transition-all duration-300 cursor-default"
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
              {steps.map(({ title, desc }, i) => (
                <AnimatedSection key={title}>
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

        {/* Pricing */}
        <section className="bg-surface-faint py-20 sm:py-28">
          <div className="mx-auto max-w-[1280px] px-5 sm:px-8">
            <AnimatedSection className="text-center mb-16">
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

            <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
              <div className="rounded-lg bg-white p-8 shadow-[0_4px_20px_rgba(0,27,61,0.05)]">
                <h3 className="text-xl font-semibold text-navy-900" style={{ fontFamily: 'var(--font-hanken-grotesk)' }}>Free Trial</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-[40px] font-extrabold text-navy-900 leading-none" style={{ fontFamily: 'var(--font-hanken-grotesk)' }}>₹0</span>
                  <span className="text-on-surface-variant text-sm">/mo</span>
                </div>
                <ul className="mt-6 space-y-3">
                  <li className="flex items-center gap-2 text-sm text-on-surface-variant">
                    <CheckCircle2 className="h-4 w-4 text-growth-green shrink-0" /> 3 resume builds
                  </li>
                  <li className="flex items-center gap-2 text-sm text-on-surface-variant">
                    <CheckCircle2 className="h-4 w-4 text-growth-green shrink-0" /> Skill gap analysis
                  </li>
                  <li className="flex items-center gap-2 text-sm text-on-surface-variant">
                    <CheckCircle2 className="h-4 w-4 text-growth-green shrink-0" /> Job search
                  </li>
                  <li className="flex items-center gap-2 text-sm text-on-surface-variant">
                    <CheckCircle2 className="h-4 w-4 text-growth-green shrink-0" /> 10 AI suggestions / month
                  </li>
                </ul>
                <Link
                  href="/auth/signup"
                  className="mt-8 flex w-full items-center justify-center rounded-lg border-2 border-navy-900 px-5 py-2.5 text-sm font-semibold text-navy-900 hover:bg-navy-900 hover:text-white transition-colors"
                >
                  Get Started
                </Link>
              </div>

              <div className="rounded-lg bg-white p-8 shadow-[0_4px_20px_rgba(0,27,61,0.05)] ring-2 ring-blue-600 relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center rounded-full bg-blue-600 px-3 py-1">
                  <span
                    className="text-[10px] font-semibold text-white tracking-wider uppercase"
                    style={{ fontFamily: 'var(--font-jetbrains-mono)' }}
                  >
                    Most Popular
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-navy-900" style={{ fontFamily: 'var(--font-hanken-grotesk)' }}>Premium</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-[40px] font-extrabold text-navy-900 leading-none" style={{ fontFamily: 'var(--font-hanken-grotesk)' }}>₹{prices.premium?.monthly ?? 299}</span>
                  <span className="text-on-surface-variant text-sm">/mo</span>
                </div>
                <ul className="mt-6 space-y-3">
                  <li className="flex items-center gap-2 text-sm text-on-surface-variant">
                    <CheckCircle2 className="h-4 w-4 text-growth-green shrink-0" /> Unlimited resumes
                  </li>
                  <li className="flex items-center gap-2 text-sm text-on-surface-variant">
                    <CheckCircle2 className="h-4 w-4 text-growth-green shrink-0" /> AI mock interview
                  </li>
                  <li className="flex items-center gap-2 text-sm text-on-surface-variant">
                    <CheckCircle2 className="h-4 w-4 text-growth-green shrink-0" /> 100 AI suggestions / month
                  </li>
                  <li className="flex items-center gap-2 text-sm text-on-surface-variant">
                    <CheckCircle2 className="h-4 w-4 text-growth-green shrink-0" /> Job pipeline tracker
                  </li>
                  <li className="flex items-center gap-2 text-sm text-on-surface-variant">
                    <CheckCircle2 className="h-4 w-4 text-growth-green shrink-0" /> ₹{(prices.premium?.yearly ?? 3000).toLocaleString()} / year (save {prices.premium ? Math.round((1 - prices.premium.yearly / (prices.premium.monthly * 12)) * 100) : 16}%)
                  </li>
                </ul>
                <Link
                  href="/auth/signup"
                  className="mt-8 flex w-full items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
                >
                  Upgrade
                </Link>
              </div>

              <div className="rounded-lg bg-white p-8 shadow-[0_4px_20px_rgba(0,27,61,0.05)]">
                <h3 className="text-xl font-semibold text-navy-900" style={{ fontFamily: 'var(--font-hanken-grotesk)' }}>Premium Pro</h3>
                <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-[40px] font-extrabold text-navy-900 leading-none" style={{ fontFamily: 'var(--font-hanken-grotesk)' }}>₹{prices.premium_pro?.monthly ?? 500}</span>
                  <span className="text-on-surface-variant text-sm">/mo</span>
                </div>
                <ul className="mt-6 space-y-3">
                  <li className="flex items-center gap-2 text-sm text-on-surface-variant">
                    <CheckCircle2 className="h-4 w-4 text-growth-green shrink-0" /> Everything in Premium
                  </li>
                  <li className="flex items-center gap-2 text-sm text-on-surface-variant">
                    <CheckCircle2 className="h-4 w-4 text-growth-green shrink-0" /> Unlimited AI suggestions
                  </li>
                  <li className="flex items-center gap-2 text-sm text-on-surface-variant">
                    <CheckCircle2 className="h-4 w-4 text-growth-green shrink-0" /> 1:1 expert sessions
                  </li>
                  <li className="flex items-center gap-2 text-sm text-on-surface-variant">
                    <CheckCircle2 className="h-4 w-4 text-growth-green shrink-0" /> Priority support
                  </li>
                  <li className="flex items-center gap-2 text-sm text-on-surface-variant">
                    <CheckCircle2 className="h-4 w-4 text-growth-green shrink-0" /> ₹{(prices.premium_pro?.yearly ?? 5500).toLocaleString()} / year (save {prices.premium_pro ? Math.round((1 - prices.premium_pro.yearly / (prices.premium_pro.monthly * 12)) * 100) : 8}%)
                  </li>
                </ul>
                <Link
                  href="/auth/signup"
                  className="mt-8 flex w-full items-center justify-center rounded-lg border-2 border-navy-900 px-5 py-2.5 text-sm font-semibold text-navy-900 hover:bg-navy-900 hover:text-white transition-colors"
                >
                  Go Pro
                </Link>
              </div>
            </div>
          </div>
        </section>

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
      <footer className="bg-surface-faint border-t border-blue-100 py-8">
        <div className="mx-auto max-w-[1280px] px-5 sm:px-8">
          <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
            <div className="flex items-center gap-2">
              <Image src="/logo.png" alt="My Career Dock" width={520} height={143} className="h-8 w-auto object-contain" />
              <span className="text-base font-bold text-navy-900" style={{ fontFamily: 'var(--font-hanken-grotesk)' }}>My Career Dock</span>
            </div>
            <div className="flex items-center gap-6">
              <Link href="/contact" className="text-sm text-outline hover:text-navy-900 transition-colors">
                Contact
              </Link>
              <p className="text-sm text-outline">
                &copy; {new Date().getFullYear()} My Career Dock. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
