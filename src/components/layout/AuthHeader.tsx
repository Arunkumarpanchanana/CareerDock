'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { X, Menu } from 'lucide-react'

export function AuthHeader() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt="My Career Dock" width={256} height={256} className="h-7 w-auto object-contain" />
          <span className="text-base font-bold" style={{ fontFamily: 'var(--font-hanken-grotesk)', color: 'var(--color-navy-900)' }}>
            My Career Dock
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-5 text-sm">
          <Link href="/auth/login" className="font-medium text-gray-600 hover:text-blue-600 transition-colors">
            Sign In
          </Link>
          <Link
            href="/auth/signup"
            className="inline-flex items-center rounded-lg px-4 py-2 text-sm font-semibold text-white transition-all duration-300 hover:shadow-[0_4px_15px_rgba(59,130,246,0.4)]"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #0ea5e9)' }}
          >
            Get Started
          </Link>
        </nav>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5 text-gray-600" /> : <Menu className="h-5 w-5 text-gray-600" />}
        </button>
      </div>
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white px-4 py-3 space-y-3">
          <Link
            href="/auth/login"
            onClick={() => setMobileOpen(false)}
            className="block font-medium text-sm text-gray-600 hover:text-blue-600 transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/auth/signup"
            onClick={() => setMobileOpen(false)}
            className="block w-full text-center rounded-lg px-4 py-2.5 text-sm font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #0ea5e9)' }}
          >
            Get Started
          </Link>
        </div>
      )}
    </header>
  )
}
