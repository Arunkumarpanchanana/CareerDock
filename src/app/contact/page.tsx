'use client'

import { useState, type FormEvent } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Mail, ArrowUpRight } from 'lucide-react'

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [error, setError] = useState('')

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setError('')

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Something went wrong')
        setStatus('error')
        return
      }
      setStatus('success')
      setForm({ name: '', email: '', subject: '', message: '' })
    } catch {
      setError('Network error. Please try again.')
      setStatus('error')
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-blue-100 bg-white">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-6 sm:px-8">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/logo.png" alt="My Career Dock" width={520} height={143} className="h-10 w-auto object-contain" />
            <span className="text-xl font-bold text-navy-900" style={{ fontFamily: 'var(--font-hanken-grotesk)' }}>My Career Dock</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/auth/login" className="text-sm font-medium text-on-surface-variant hover:text-navy-900 transition-colors">
              Sign In
            </Link>
            <Link href="/auth/signup" className="inline-flex items-center px-5 py-2.5 rounded-lg bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 transition-colors">
              Get Started <ArrowUpRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 bg-surface">
        <section className="mx-auto max-w-2xl px-5 sm:px-8 py-20 sm:py-28">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-4 py-1.5 mb-6">
              <Mail className="h-3 w-3 text-blue-600" />
              <span className="text-[11px] font-semibold text-blue-600 tracking-[0.05em] uppercase" style={{ fontFamily: 'var(--font-jetbrains-mono)' }}>
                Get in touch
              </span>
            </div>
            <h1 className="text-[32px] sm:text-[40px] font-bold text-navy-900 tracking-tight" style={{ fontFamily: 'var(--font-hanken-grotesk)' }}>
              Contact Us
            </h1>
            <p className="mt-3 text-lg text-on-surface-variant max-w-md mx-auto">
              Have a question or need help? Send us a message and we&apos;ll get back to you.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="rounded-lg bg-white p-8 shadow-[0_4px_20px_rgba(0,27,61,0.05)] space-y-5">
            <Input label="Name" name="name" value={form.name} onChange={handleChange} placeholder="Your name" required />
            <Input label="Email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@example.com" required />
            <Input label="Subject" name="subject" value={form.subject} onChange={handleChange} placeholder="How can we help?" required />

            <div className="space-y-1">
              <label htmlFor="message" className="block text-sm font-medium text-[var(--text-secondary)]">
                Message
              </label>
              <textarea
                id="message"
                name="message"
                value={form.message}
                onChange={handleChange}
                rows={5}
                placeholder="Tell us more..."
                required
                className="block w-full rounded-xl px-3 py-2 text-sm transition-colors placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] bg-[var(--bg-secondary)] border border-[var(--glass-border)] text-[var(--text-primary)] focus:border-[var(--accent)] resize-y"
              />
            </div>

            {status === 'success' && (
              <p className="text-sm text-[var(--success)] bg-green-50 rounded-lg px-4 py-3">
                Message sent! We&apos;ll get back to you soon.
              </p>
            )}
            {status === 'error' && (
              <p className="text-sm text-[var(--danger)] bg-red-50 rounded-lg px-4 py-3">
                {error}
              </p>
            )}

            <Button type="submit" loading={status === 'loading'} className="w-full">
              Send Message
            </Button>
          </form>
        </section>
      </main>

      <footer className="bg-surface-faint border-t border-blue-100 py-8">
        <div className="mx-auto max-w-[1280px] px-5 sm:px-8">
          <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
            <div className="flex items-center gap-2">
              <Image src="/logo.png" alt="My Career Dock" width={520} height={143} className="h-8 w-auto object-contain" />
              <span className="text-base font-bold text-navy-900" style={{ fontFamily: 'var(--font-hanken-grotesk)' }}>My Career Dock</span>
            </div>
            <p className="text-sm text-outline">
              &copy; {new Date().getFullYear()} My Career Dock. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
