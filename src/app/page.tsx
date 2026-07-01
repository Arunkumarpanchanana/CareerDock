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
  {
    icon: FileText,
    title: 'ATS Resume Builder',
    desc: 'Create clean resumes that pass Applicant Tracking Systems. Download as PDF instantly.',
  },
  {
    icon: Kanban,
    title: 'Job Pipeline Tracker',
    desc: 'Drag applications across stages — from Wishlist to Offer. Never lose track.',
  },
  {
    icon: Sparkles,
    title: 'Smart Suggestions',
    desc: 'Get AI-powered suggestions for bullet points, skills, and summaries.',
  },
  {
    icon: Users,
    title: 'Expert Consultations',
    desc: 'Book 1:1 sessions with industry professionals for career advice.',
  },
]

const steps = [
  { step: '01', title: 'Build Your Resume', desc: 'Fill in your details with our guided editor. Choose from expert-written templates.' },
  { step: '02', title: 'Track Applications', desc: 'Add jobs to your pipeline and move them across stages with ease.' },
  { step: '03', title: 'Get Expert Help', desc: 'Book 1:1 sessions with professionals who have been where you want to go.' },
]

export default function HomePage() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 20) }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 backdrop-blur-xl border-b border-gray-100/50' : 'bg-transparent'}`}>
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.jpg" alt="My Career Dock" width={28} height={28} className="h-7 w-7 object-contain" />
            <span className="text-base font-semibold text-[#1d1d1f]">My Career Dock</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/auth/login" className="text-xs font-medium text-[#6e6e73] hover:text-[#1d1d1f] transition-colors">
              Sign In
            </Link>
            <Link
              href="/auth/signup"
              className="px-4 py-1.5 rounded-full bg-[#0071e3] text-xs font-medium text-white hover:bg-[#0077ed] transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-white pt-32 pb-20 sm:pt-40 sm:pb-28">
          <div className="mx-auto max-w-4xl px-5 sm:px-8 text-center">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-gray-50 border border-gray-100 px-3.5 py-1 mb-8">
              <Sparkles className="h-3 w-3 text-[#0071e3]" />
              <span className="text-[11px] font-medium text-[#6e6e73] tracking-wide">Your career, accelerated</span>
            </div>

            <h1 className="text-[40px] leading-[1.05] font-semibold tracking-tight text-[#1d1d1f] sm:text-[56px] lg:text-[64px]">
              Your{' '}
              <span className="text-[#0071e3]">Career Accelerator</span>
              <br />
              in One Place
            </h1>

            <p className="mx-auto mt-5 max-w-xl text-base sm:text-lg text-[#6e6e73] leading-relaxed">
              Build ATS-optimized resumes, track every job application, get AI-powered suggestions, and book 1:1 sessions with industry experts.
            </p>

            <div className="mt-9 flex items-center justify-center gap-3">
              <Link
                href="/auth/signup"
                className="inline-flex items-center gap-1.5 rounded-full bg-[#0071e3] px-6 py-3 text-sm font-medium text-white hover:bg-[#0077ed] transition-colors"
              >
                Start Free <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/auth/login"
                className="inline-flex items-center gap-1.5 rounded-full bg-gray-50 border border-gray-100 px-6 py-3 text-sm font-medium text-[#1d1d1f] hover:bg-gray-100 transition-colors"
              >
                Sign In <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="mt-14 flex items-center justify-center gap-8 sm:gap-14">
              {[
                { label: 'Resume Templates', value: '10+' },
                { label: 'Job Pipelines', value: 'Unlimited' },
                { label: 'Expert Sessions', value: '1:1' },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="text-2xl sm:text-3xl font-semibold text-[#1d1d1f]">{stat.value}</p>
                  <p className="text-xs text-[#6e6e73] mt-0.5 tracking-wide">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Trust Bar */}
        <section className="bg-[#f5f5f7] border-y border-gray-100/50 py-14">
          <div className="mx-auto max-w-5xl px-5 sm:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { value: '10K+', label: 'Active Users' },
                { value: '5K+', label: 'Resumes Built' },
                { value: '500+', label: 'Expert Sessions' },
                { value: '95%', label: 'Satisfaction' },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <p className="text-2xl sm:text-3xl font-semibold text-[#1d1d1f]">{s.value}</p>
                  <p className="text-xs text-[#6e6e73] mt-0.5 tracking-wide">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="bg-white py-20 sm:py-28">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <AnimatedSection className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-semibold text-[#1d1d1f] tracking-tight">
                Everything you need to land the role
              </h2>
              <p className="mt-3 text-base sm:text-lg text-[#6e6e73] max-w-xl mx-auto">
                From resume to offer letter — My Career Dock supports every step of your job search.
              </p>
            </AnimatedSection>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {features.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="group rounded-2xl border border-gray-100 bg-white p-7 hover:shadow-md hover:border-gray-200 transition-all duration-300 cursor-default">
                  <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center mb-4 group-hover:bg-[#0071e3]/5 transition-colors">
                    <Icon className="h-5 w-5 text-[#0071e3]" />
                  </div>
                  <h3 className="text-base font-semibold text-[#1d1d1f]">{title}</h3>
                  <p className="mt-1.5 text-sm text-[#6e6e73] leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="bg-[#f5f5f7] py-20 sm:py-28">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <AnimatedSection className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-semibold text-[#1d1d1f] tracking-tight">
                Three steps to your next role
              </h2>
              <p className="mt-3 text-base sm:text-lg text-[#6e6e73] max-w-xl mx-auto">
                Get started in minutes, not hours.
              </p>
            </AnimatedSection>

            <div className="grid gap-8 md:grid-cols-3">
              {steps.map(({ step, title, desc }, i) => (
                <AnimatedSection key={step}>
                  <div className="text-center">
                    <div className="w-14 h-14 rounded-full bg-[#0071e3] text-white text-lg font-semibold flex items-center justify-center mx-auto mb-5 shadow-sm">
                      {step}
                    </div>
                    <h3 className="text-xl font-semibold text-[#1d1d1f]">{title}</h3>
                    <p className="mt-2 text-sm text-[#6e6e73] leading-relaxed max-w-xs mx-auto">{desc}</p>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonial */}
        <section className="bg-white py-20 sm:py-28">
          <div className="mx-auto max-w-2xl px-5 sm:px-8 text-center">
            <AnimatedSection>
              <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-6">
                <Star className="h-5 w-5 text-[#0071e3]" />
              </div>
              <blockquote className="text-xl sm:text-2xl text-[#1d1d1f] leading-relaxed font-medium">
                &ldquo;I went from sending out scattered applications to running a structured job search
                with My Career Dock. The resume builder alone saved me hours.&rdquo;
              </blockquote>
              <div className="mt-8 flex items-center justify-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-[#ff9f0a] text-[#ff9f0a]" />
                ))}
              </div>
              <div className="mt-6 flex items-center justify-center gap-3">
                <div className="flex -space-x-2">
                  {['bg-[#0071e3]', 'bg-[#34c759]', 'bg-[#af52de]'].map((bg) => (
                    <div key={bg} className={`h-9 w-9 rounded-full ${bg} ring-2 ring-white flex items-center justify-center text-white text-[11px] font-semibold`}>
                      {bg.includes('0071e3') ? 'S' : bg.includes('34c759') ? 'J' : 'M'}
                    </div>
                  ))}
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-[#1d1d1f]">Early Access Users</p>
                  <p className="text-xs text-[#6e6e73]">Join 10K+ job seekers</p>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-[#1d1d1f] py-20 sm:py-28">
          <div className="mx-auto max-w-3xl px-5 sm:px-8 text-center">
            <AnimatedSection>
              <h2 className="text-3xl sm:text-4xl font-semibold text-white tracking-tight">
                Ready to accelerate your career?
              </h2>
              <p className="mt-3 text-base sm:text-lg text-[#86868b] max-w-lg mx-auto">
                Join My Career Dock for free. No credit card required.
              </p>
              <div className="mt-9 flex items-center justify-center gap-3 flex-wrap">
                <Link
                  href="/auth/signup"
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#0071e3] px-6 py-3 text-sm font-medium text-white hover:bg-[#0077ed] transition-colors"
                >
                  Create Free Account <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              <div className="mt-8 flex items-center justify-center gap-6 text-xs text-[#86868b]">
                <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5" /> No credit card</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5" /> Cancel anytime</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5" /> Free updates</span>
              </div>
            </AnimatedSection>
          </div>
        </section>
      </main>

      <footer className="bg-[#f5f5f7] border-t border-gray-100/50 py-8">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
            <div className="flex items-center gap-2">
              <Image src="/logo.jpg" alt="My Career Dock" width={16} height={16} className="h-4 w-4 object-contain" />
              <span className="text-xs font-semibold text-[#1d1d1f]">My Career Dock</span>
            </div>
            <p className="text-xs text-[#6e6e73]">
              &copy; {new Date().getFullYear()} My Career Dock. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
