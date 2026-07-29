'use client'

import { AuthHeader } from '@/components/layout/AuthHeader'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import { Sparkles, FileText, Briefcase, Target, ArrowRight, Star, Zap, Shield } from 'lucide-react'

const features = [
  {
    icon: FileText,
    title: 'ATS-Optimized Resumes',
    description: 'Build resumes that pass applicant tracking systems with AI-powered suggestions and real-time optimization.',
  },
  {
    icon: Briefcase,
    title: 'Job Tracker',
    description: 'Track applications, interviews, and offers in one place. Never lose sight of your job search progress.',
  },
  {
    icon: Target,
    title: 'Skill Gap Analysis',
    description: 'Identify skill gaps and get personalized recommendations to stay competitive in your field.',
  },
  {
    icon: Zap,
    title: 'AI Career Coach',
    description: 'Get instant answers to career questions, practice interviews, and receive personalized guidance.',
  },
  {
    icon: Star,
    title: 'Premium Templates',
    description: 'Stand out with professionally designed templates that hiring managers love.',
  },
  {
    icon: Shield,
    title: 'Cover Letters',
    description: 'Generate tailored cover letters in seconds with AI that matches your experience to each role.',
  },
]

const plans = [
  {
    tier: 'Free',
    price: '$0',
    period: '/month',
    features: ['AI Resume Builder', 'Basic Templates', 'Job Tracker', '3 AI Actions/month'],
    cta: 'Get Started',
    href: '/auth/signup',
    highlighted: false,
  },
  {
    tier: 'Premium',
    price: '$19.99',
    period: '/month',
    features: ['AI Resume Builder', 'Premium Templates', 'Job Tracker', 'ATS Optimization', 'Cover Letter Generator', '100 AI Actions/month'],
    cta: 'Start Free Trial',
    href: '/auth/signup',
    highlighted: true,
  },
  {
    tier: 'Premium Pro',
    price: '$49.99',
    period: '/month',
    features: ['Everything in Premium', 'Expert Consultation', 'Unlimited AI Actions', 'Priority Support'],
    cta: 'Start Free Trial',
    href: '/auth/signup',
    highlighted: false,
  },
]

function AnimatedBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl animate-float" />
      <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-cyan-500/10 blur-3xl animate-float-delayed" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-violet-500/5 blur-3xl animate-pulse-soft" />
    </div>
  )
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <AuthHeader />

      {/* Hero */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <AnimatedBackground />
        <div className="relative mx-auto max-w-6xl px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--glass-bg)] border border-[var(--glass-border)] text-sm text-[var(--text-secondary)] mb-8 animate-fade-in-up">
            <Sparkles className="w-4 h-4 text-[var(--accent)]" />
            AI-Powered Career Acceleration
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 animate-fade-in-up" style={{ fontFamily: 'var(--font-hanken-grotesk)' }}>
            <span className="text-[var(--text-primary)]">Your Career,</span>
            <br />
            <span className="bg-gradient-to-r from-blue-500 via-cyan-400 to-violet-500 bg-clip-text text-transparent">
              Supercharged by AI
            </span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-[var(--text-secondary)] mb-10 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            Build ATS-optimized resumes, track job applications, practice interviews, and accelerate your career — all powered by intelligent AI.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <Link href="/auth/signup">
              <Button variant="primary" size="lg" className="w-full sm:w-auto text-base px-8 gap-2">
                Get Started Free <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button variant="glass" size="lg" className="w-full sm:w-auto text-base px-8">
                Sign In
              </Button>
            </Link>
          </div>
          <div className="mt-12 flex items-center justify-center gap-8 text-sm text-[var(--text-secondary)] animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <span className="flex items-center gap-1.5"><Star className="w-4 h-4 text-[var(--accent)]" /> No credit card</span>
            <span className="flex items-center gap-1.5"><Shield className="w-4 h-4 text-[var(--accent)]" /> Cancel anytime</span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-[var(--bg-secondary)]">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] mb-4" style={{ fontFamily: 'var(--font-hanken-grotesk)' }}>
              Everything you need to land your dream job
            </h2>
            <p className="text-[var(--text-secondary)] max-w-2xl mx-auto">
              From resume building to interview prep, we&apos;ve got you covered at every step.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div
                key={feature.title}
                className="group p-6 rounded-2xl bg-[var(--glass-bg)] border border-[var(--glass-border)] hover:bg-white/10 transition-all duration-300 hover:-translate-y-1 scroll-animate"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-5 h-5 text-[var(--accent)]" />
                </div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">{feature.title}</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24" id="pricing">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] mb-4" style={{ fontFamily: 'var(--font-hanken-grotesk)' }}>
              Simple, transparent pricing
            </h2>
            <p className="text-[var(--text-secondary)] max-w-2xl mx-auto">
              Start free and upgrade when you&apos;re ready. No hidden fees.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan, i) => (
              <div
                key={plan.tier}
                className={`relative rounded-2xl p-8 border transition-all duration-300 ${
                  plan.highlighted
                    ? 'bg-[var(--accent)]/5 border-[var(--accent)]/30 shadow-xl shadow-[var(--accent)]/5 scale-105'
                    : 'bg-[var(--glass-bg)] border-[var(--glass-border)]'
                }`}
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 text-xs font-semibold text-white">
                    Most Popular
                  </div>
                )}
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">{plan.tier}</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-[var(--text-primary)]">{plan.price}</span>
                  <span className="text-[var(--text-secondary)] text-sm">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                      <Sparkles className="w-4 h-4 text-[var(--accent)] mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href={plan.href}>
                  <Button
                    variant={plan.highlighted ? 'primary' : 'glass'}
                    className="w-full"
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-[var(--bg-secondary)]">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] mb-4" style={{ fontFamily: 'var(--font-hanken-grotesk)' }}>
            Ready to accelerate your career?
          </h2>
          <p className="text-[var(--text-secondary)] mb-8 max-w-xl mx-auto">
            Join thousands of professionals who are landing their dream jobs with My Career Dock.
          </p>
          <Link href="/auth/signup">
            <Button variant="primary" size="lg" className="text-base px-10 gap-2">
              Get Started Free <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-[var(--glass-border)]">
        <div className="mx-auto max-w-6xl px-4 text-center text-sm text-[var(--text-secondary)]">
          &copy; {new Date().getFullYear()} My Career Dock. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
