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
            : 'bg-[#0a1628]'
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
