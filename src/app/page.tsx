'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  ChevronRight,
  ChevronDown,
  ArrowDown,
  CheckCircle2,
  ArrowUpRight,
  Star,
} from 'lucide-react'
import { CountUp } from '@/components/ui/CountUp'

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

const faqs = [
  { q: 'Is My Career Dock really free to start?', a: 'Yes, absolutely. You can create a free account and start building resumes, tracking applications, and using AI suggestions right away — no credit card required.' },
  { q: "What's included in the Free plan?", a: 'The Free plan includes 3 resume builds, skill gap analysis, job search tools, and 10 AI suggestions per month. Enough to get a feel for the platform and make real progress.' },
  { q: 'How is Premium different from Free?', a: 'Premium unlocks unlimited resumes, AI mock interviews, 100 AI suggestions per month, and the full job pipeline tracker. You also get priority support.' },
  { q: 'Can I upgrade or downgrade my plan anytime?', a: 'Yes, you can upgrade or downgrade at any time. Upgrades take effect immediately, and downgrades apply at the next billing cycle.' },
  { q: 'What payment methods do you accept?', a: 'We accept all major credit and debit cards, including Visa, Mastercard, and RuPay. All payments are processed securely through our payment partner.' },
  { q: 'Can I cancel my subscription?', a: "Absolutely. You can cancel anytime from your account settings. You'll retain access to Premium features until the end of your billing period." },
  { q: 'How does the ATS resume builder work?', a: 'Our builder guides you through each section with expert-written prompts. It formats your content into clean, ATS-friendly layouts that recruiters and automated systems can parse easily.' },
  { q: 'What resume templates are available?', a: 'We offer three templates: Professional (traditional layout), Executive (leadership-focused), and Fresher (skills-forward). Each is optimized for ATS compatibility.' },
  { q: 'How do AI suggestions work?', a: 'As you fill in your resume, our AI analyzes your content and suggests stronger bullet points, better action verbs, and relevant skills based on your target role.' },
  { q: 'How many AI suggestions do I get per month?', a: 'Free users get 10 suggestions per month. Premium users get 100, and Premium Pro users get unlimited suggestions.' },
  { q: 'How does the job pipeline tracker work?', a: 'You can add jobs to a kanban-style board and drag them across stages — Wishlist, Applied, Interview, Offer, and Rejected. It keeps all your applications organised in one place.' },
  { q: 'How do I book an expert consultation?', a: 'Premium Pro users can browse available experts by industry, check their availability, and book 1:1 sessions directly from the platform.' },
  { q: 'Can I export my resume as PDF?', a: 'Yes, every resume you build can be downloaded as a clean, print-ready PDF with one click.' },
  { q: 'Is my data secure?', a: 'Yes. We use industry-standard encryption for data storage and transmission. Your personal information and documents are never shared without your consent.' },
  { q: 'How do I contact support?', a: 'You can reach us through the Contact page, or email us directly at support@mycareerdock.com. We typically respond within 24 hours.' },
]

export default function HomePage() {
  const [scrolled, setScrolled] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [prices, setPrices] = useState<Record<string, { monthly: number; yearly: number }>>({})
  const [yearly, setYearly] = useState(false)

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
          data.forEach((p: { plan_tier: string; monthly_price: number; yearly_price: number }) => {
            map[p.plan_tier] = { monthly: p.monthly_price, yearly: p.yearly_price }
          })
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
              className="text-sm font-medium transition-colors"
              style={{ color: scrolled ? '#434656' : '#ffffff' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#001B3D' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = scrolled ? '#434656' : '#ffffff' }}
            >
              Sign In
            </Link>
            <Link
              href="/auth/signup"
              className="inline-flex items-center px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-all duration-300 hover:shadow-[0_4px_15px_rgba(59,130,246,0.4)]"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #0ea5e9)' }}
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden bg-[linear-gradient(135deg,#0a1628_0%,#1a2744_50%,#0f1f3a_100%)] pt-36 pb-20 sm:pt-44 sm:pb-28">
          {/* Animated background shapes */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl animate-pulse" />
            <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            <div className="absolute top-1/3 left-1/4 w-64 h-64 rounded-full bg-cyan-500/5 blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
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
              <Link
                href="/auth/signup"
                className="inline-flex items-center gap-1.5 rounded-lg px-7 py-3.5 text-base font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(59,130,246,0.4)]"
                style={{ background: 'linear-gradient(135deg, #3b82f6, #0ea5e9)' }}
              >
                Book Your Free Consultation <ArrowUpRight className="h-4 w-4" />
              </Link>
              <Link
                href="#services"
                className="inline-flex items-center gap-1.5 rounded-lg px-7 py-3.5 text-base font-semibold transition-colors"
                style={{ color: '#ffffff', border: '2px solid rgba(255,255,255,0.2)', background: 'transparent' }}
              >
                See How It Works <ChevronRight className="h-4 w-4" />
              </Link>
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

        {/* Pricing */}
        <section id="services" className="bg-surface-faint py-20 sm:py-28">
          <div className="mx-auto max-w-[1280px] px-5 sm:px-8">
            <div className="text-center mb-16">
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
              <div className="mt-6 flex items-center justify-center gap-3">
                <span className={`text-sm font-medium transition-colors ${!yearly ? 'text-navy-900' : 'text-on-surface-variant'}`}>Monthly</span>
                <button
                  onClick={() => setYearly(!yearly)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${yearly ? 'bg-blue-600' : 'bg-blue-200'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${yearly ? 'translate-x-6' : ''}`} />
                </button>
                <span className={`text-sm font-medium transition-colors ${yearly ? 'text-navy-900' : 'text-on-surface-variant'}`}>
                  Yearly <span className="text-xs text-blue-600 font-semibold">Save up to 16%</span>
                </span>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
              {/* Free Trial */}
              <div
                className="group rounded-xl bg-white p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                style={{ boxShadow: '0 4px 20px rgba(0,27,61,0.05)' }}
              >
                <div className="text-3xl mb-4">✨</div>
                <h3 className="text-xl font-semibold text-navy-900" style={{ fontFamily: 'var(--font-hanken-grotesk)' }}>
                  Free Trial
                </h3>
                <p className="text-sm text-on-surface-variant mt-1 mb-4">Get started</p>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-[40px] font-extrabold text-navy-900 leading-none" style={{ fontFamily: 'var(--font-hanken-grotesk)' }}>₹0</span>
                  <span className="text-sm text-on-surface-variant">/mo</span>
                </div>
                <ul className="space-y-3 mb-8">
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
                  className="flex w-full items-center justify-center rounded-lg border-2 border-navy-900 px-5 py-2.5 text-sm font-semibold text-navy-900 transition-colors hover:bg-navy-900 hover:text-white"
                >
                  Get Started
                </Link>
              </div>

              {/* Premium (Most Popular) */}
              <div
                className="group rounded-xl bg-white p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl relative"
                style={{ boxShadow: '0 4px 20px rgba(0,27,61,0.05)', border: '2px solid #3b82f6' }}
              >
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center rounded-full px-3 py-1" style={{ background: '#3b82f6' }}>
                  <span
                    className="text-[10px] font-semibold text-white tracking-wider uppercase"
                    style={{ fontFamily: 'var(--font-jetbrains-mono)' }}
                  >
                    Most Popular
                  </span>
                </div>
                <div className="text-3xl mb-4">⚡</div>
                <h3 className="text-xl font-semibold text-navy-900" style={{ fontFamily: 'var(--font-hanken-grotesk)' }}>
                  Premium
                </h3>
                <p className="text-sm text-on-surface-variant mt-1 mb-4">For serious job seekers</p>
                {(() => {
                  const monthlyPrice = prices.premium?.monthly ?? 299
                  const yearlyPrice = prices.premium?.yearly ?? 3000
                  const displayPrice = yearly ? Math.round(yearlyPrice / 12) : monthlyPrice
                  const savingsPercent = prices.premium ? Math.round((1 - yearlyPrice / (monthlyPrice * 12)) * 100) : 16
                  return (
                    <>
                      <div className="flex items-baseline gap-1 mb-1">
                        <span className="text-sm text-on-surface-variant">₹</span>
                        <span className="text-[40px] font-extrabold text-navy-900 leading-none" style={{ fontFamily: 'var(--font-hanken-grotesk)' }}>{displayPrice.toLocaleString('en-IN')}</span>
                        <span className="text-sm text-on-surface-variant">/mo</span>
                      </div>
                      {yearly && (
                        <p className="text-xs text-blue-600 font-medium mb-5">
                          ₹{yearlyPrice.toLocaleString('en-IN')}/year — Save {savingsPercent}%
                        </p>
                      )}
                      {!yearly && <div className="mb-5" />}
                    </>
                  )
                })()}
                <ul className="space-y-3 mb-8">
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
                </ul>
                <Link
                  href="/auth/signup"
                  className="flex w-full items-center justify-center rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_4px_15px_rgba(59,130,246,0.4)]"
                  style={{ background: 'linear-gradient(135deg, #3b82f6, #0ea5e9)' }}
                >
                  Upgrade <ArrowUpRight className="h-4 w-4 ml-1" />
                </Link>
              </div>

              {/* Premium Pro */}
              <div
                className="group rounded-xl bg-white p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl relative"
                style={{ boxShadow: '0 4px 20px rgba(0,27,61,0.05)' }}
              >
                <div
                  className="absolute inset-0 rounded-xl pointer-events-none"
                  style={{
                    padding: '1px',
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    WebkitMaskComposite: 'xor',
                    maskComposite: 'exclude',
                  }}
                />
                <div className="text-3xl mb-4">👑</div>
                <h3 className="text-xl font-semibold text-navy-900" style={{ fontFamily: 'var(--font-hanken-grotesk)' }}>
                  Premium Pro
                </h3>
                <p className="text-sm text-on-surface-variant mt-1 mb-4">Everything plus expert guidance</p>
                {(() => {
                  const monthlyPrice = prices.premium_pro?.monthly ?? 500
                  const yearlyPrice = prices.premium_pro?.yearly ?? 5500
                  const displayPrice = yearly ? Math.round(yearlyPrice / 12) : monthlyPrice
                  const savingsPercent = prices.premium_pro ? Math.round((1 - yearlyPrice / (monthlyPrice * 12)) * 100) : 8
                  return (
                    <>
                      <div className="flex items-baseline gap-1 mb-1">
                        <span className="text-sm text-on-surface-variant">₹</span>
                        <span className="text-[40px] font-extrabold text-navy-900 leading-none" style={{ fontFamily: 'var(--font-hanken-grotesk)' }}>{displayPrice.toLocaleString('en-IN')}</span>
                        <span className="text-sm text-on-surface-variant">/mo</span>
                      </div>
                      {yearly && (
                        <p className="text-xs text-blue-600 font-medium mb-5">
                          ₹{yearlyPrice.toLocaleString('en-IN')}/year — Save {savingsPercent}%
                        </p>
                      )}
                      {!yearly && <div className="mb-5" />}
                    </>
                  )
                })()}
                <ul className="space-y-3 mb-8">
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
                </ul>
                <Link
                  href="/auth/signup"
                  className="flex w-full items-center justify-center rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_4px_15px_rgba(59,130,246,0.4)]"
                  style={{ background: 'linear-gradient(135deg, #3b82f6, #0ea5e9)' }}
                >
                  Go Pro <ArrowUpRight className="h-4 w-4 ml-1" />
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
                <div className="rounded-xl bg-white p-8 hover:-translate-y-1 hover:shadow-xl transition-all duration-300" style={{ boxShadow: '0 4px 20px rgba(0,27,61,0.05)' }}>
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
                <div className="rounded-xl bg-white p-8 hover:-translate-y-1 hover:shadow-xl transition-all duration-300" style={{ boxShadow: '0 4px 20px rgba(0,27,61,0.05)' }}>
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

        {/* FAQ */}
        <section className="bg-surface-faint py-20 sm:py-28">
          <div className="mx-auto max-w-3xl px-5 sm:px-8">
            <AnimatedSection className="text-center mb-16">
              <h2
                className="text-[32px] sm:text-[40px] font-bold text-navy-900 tracking-tight"
                style={{ fontFamily: 'var(--font-hanken-grotesk)' }}
              >
                Frequently Asked Questions
              </h2>
              <p className="mt-3 text-lg text-on-surface-variant max-w-xl mx-auto">
                Quick answers to common questions. If you don&apos;t see what you&apos;re looking for, reach out through our Contact page.
              </p>
            </AnimatedSection>

            <div className="space-y-0">
              {faqs.map((faq, i) => (
                <div key={i} className="border-b border-blue-100 last:border-b-0">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="flex w-full items-center justify-between gap-4 py-5 text-left transition-colors hover:text-blue-600"
                  >
                    <span
                      className="text-base font-semibold text-navy-900"
                      style={{ fontFamily: 'var(--font-hanken-grotesk)' }}
                    >
                      {faq.q}
                    </span>
                    <ChevronDown
                      className={`h-5 w-5 shrink-0 text-outline transition-transform duration-300 ${openFaq === i ? 'rotate-180' : ''}`}
                    />
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-300 ${openFaq === i ? 'max-h-96 pb-5' : 'max-h-0'}`}
                  >
                    <p className="text-base text-on-surface-variant leading-relaxed">
                      {faq.a}
                    </p>
                  </div>
                </div>
              ))}
            </div>
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
