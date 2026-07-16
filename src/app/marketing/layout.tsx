'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { X, Menu } from 'lucide-react'

export default function MarketingLayout({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen flex flex-col">
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-blue-100 shadow-sm">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="My Career Dock"
              width={256}
              height={256}
              className="h-8 w-auto object-contain"
            />
            <span
              className="text-lg font-bold"
              style={{ fontFamily: 'var(--font-hanken-grotesk)', color: 'var(--color-navy-900)' }}
            >
              My Career Dock
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <Link
              href="/articles"
              className="font-medium transition-colors hover:text-blue-600"
              style={{ color: 'var(--color-on-surface-variant)' }}
            >
              Articles
            </Link>
            <Link
              href="/offers"
              className="font-medium transition-colors hover:text-blue-600"
              style={{ color: 'var(--color-on-surface-variant)' }}
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
          </nav>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" style={{ color: 'var(--color-on-surface-variant)' }} /> : <Menu className="h-5 w-5" style={{ color: 'var(--color-on-surface-variant)' }} />}
          </button>
        </div>
        {mobileOpen && (
          <div className="md:hidden border-t border-blue-100 bg-white px-4 py-4 space-y-4">
            <Link
              href="/articles"
              onClick={() => setMobileOpen(false)}
              className="block font-medium text-sm transition-colors hover:text-blue-600"
              style={{ color: 'var(--color-on-surface-variant)' }}
            >
              Articles
            </Link>
            <Link
              href="/offers"
              onClick={() => setMobileOpen(false)}
              className="block font-medium text-sm transition-colors hover:text-blue-600"
              style={{ color: 'var(--color-on-surface-variant)' }}
            >
              Offers
            </Link>
            <a
              href="https://app.mycareerdock.com"
              className="block w-full text-center rounded-lg px-4 py-2.5 text-sm font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #0ea5e9)' }}
            >
              Get Started
            </a>
          </div>
        )}
      </header>

      <main className="flex-1 pt-16">{children}</main>

      <footer className="border-t border-blue-100 bg-surface-faint py-8">
        <div className="mx-auto max-w-5xl px-4">
          <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
            <div className="flex items-center gap-2">
              <Image src="/logo.png" alt="My Career Dock" width={256} height={256} className="h-7 w-auto object-contain" />
              <span className="text-base font-bold text-navy-900" style={{ fontFamily: 'var(--font-hanken-grotesk)' }}>My Career Dock</span>
            </div>
            <div className="flex items-center gap-6">
              <Link href="/articles" className="text-sm text-outline hover:text-navy-900 transition-colors">Articles</Link>
              <Link href="/offers" className="text-sm text-outline hover:text-navy-900 transition-colors">Offers</Link>
              <span className="text-sm text-outline">&copy; {new Date().getFullYear()} My Career Dock</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
