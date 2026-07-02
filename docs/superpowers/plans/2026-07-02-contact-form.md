# Contact Form Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a standalone `/contact` page with a form that emails submissions to `support@mycareerdock.com`

**Architecture:** Client-side form page → `POST /api/contact` → nodemailer SMTP. Header and footer reuse the landing page's design.

**Tech Stack:** Next.js 16 App Router, Tailwind v4, nodemailer, zod

---

### Task 1: Install nodemailer dependency

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install nodemailer and types**

```bash
npm install nodemailer && npm install -D @types/nodemailer
```

- [ ] **Step 2: Verify installation**

Run: `node -e "require('nodemailer')"` — should not error.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add nodemailer dependency"
```

---

### Task 2: Create POST /api/contact route

**Files:**
- Create: `src/app/api/contact/route.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/app/api/__tests__/contact.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSendMail = vi.fn()
vi.mock('nodemailer', () => ({
  default: { createTransport: () => ({ sendMail: mockSendMail }) },
}))

async function post(body: Record<string, unknown>) {
  const { POST } = await import('../contact/route')
  const req = new Request('http://localhost/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return POST(req)
}

describe('POST /api/contact', () => {
  beforeEach(() => {
    vi.stubEnv('SMTP_HOST', 'smtp.example.com')
    vi.stubEnv('SMTP_PORT', '587')
    vi.stubEnv('SMTP_USER', 'user@example.com')
    vi.stubEnv('SMTP_PASS', 'pass')
    mockSendMail.mockReset()
  })

  it('returns 400 for missing fields', async () => {
    const res = await post({})
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBeDefined()
  })

  it('returns 400 for invalid email', async () => {
    const res = await post({ name: 'A', email: 'not-email', subject: 'S', message: 'M'.repeat(10) })
    expect(res.status).toBe(400)
  })

  it('sends email and returns 200 on valid input', async () => {
    mockSendMail.mockResolvedValue({ messageId: '123' })
    const res = await post({
      name: 'Alice',
      email: 'alice@test.com',
      subject: 'Hello',
      message: 'This is a test message.',
    })
    expect(res.status).toBe(200)
    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'user@example.com',
        replyTo: 'alice@test.com',
        to: 'support@mycareerdock.com',
        subject: '[Contact] Hello',
      })
    )
  })

  it('returns 500 when SMTP fails', async () => {
    mockSendMail.mockRejectedValue(new Error('SMTP error'))
    const res = await post({
      name: 'Alice',
      email: 'alice@test.com',
      subject: 'Hello',
      message: 'This is a test message.',
    })
    expect(res.status).toBe(500)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- src/app/api/__tests__/contact.test.ts
```
Expected: FAIL — module not found

- [ ] **Step 3: Write the API route implementation**

```ts
// src/app/api/contact/route.ts
import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

const TO_EMAIL = 'support@mycareerdock.com'

function createTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST!,
    port: Number(process.env.SMTP_PORT!),
    secure: Number(process.env.SMTP_PORT!) === 465,
    auth: {
      user: process.env.SMTP_USER!,
      pass: process.env.SMTP_PASS!,
    },
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, subject, message } = body

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    if (message.length < 10) {
      return NextResponse.json({ error: 'Message must be at least 10 characters' }, { status: 400 })
    }

    const transporter = createTransport()
    await transporter.sendMail({
      from: process.env.SMTP_USER!,
      to: TO_EMAIL,
      replyTo: email,
      subject: `[Contact] ${subject}`,
      text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- src/app/api/__tests__/contact.test.ts
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/api/contact/route.ts src/app/api/__tests__/contact.test.ts
git commit -m "feat: add POST /api/contact endpoint"
```

---

### Task 3: Create the /contact page

**Files:**
- Create: `src/app/contact/page.tsx`

- [ ] **Step 1: Write the failing test**

```ts
// src/app/contact/__tests__/page.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ContactPage from '../page'

// Mock fetch for form submission
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('ContactPage', () => {
  it('renders the form with all fields', () => {
    render(<ContactPage />)
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/subject/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/message/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /send message/i })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- src/app/contact/__tests__/page.test.tsx
```
Expected: FAIL — module not found

- [ ] **Step 3: Write the contact page**

```tsx
// src/app/contact/page.tsx
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
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- src/app/contact/__tests__/page.test.tsx
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/contact/
git commit -m "feat: add contact form page"
```

---

### Task 4: Add "Contact" link to landing page footer

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Update the footer section to add a Contact link**

In `src/app/page.tsx`, find the footer and add a links row above the copyright line:

```tsx
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
```

- [ ] **Step 2: Verify the existing landing page tests still pass**

```bash
npm test -- src/app/__tests__/page.test.tsx
```
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: add Contact link to landing page footer"
```

---

### Task 5: Add SMTP env vars to .env.example

**Files:**
- Modify: `.env.example`

- [ ] **Step 1: Add SMTP variables**

```
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
```

- [ ] **Step 2: Commit**

```bash
git add .env.example
git commit -m "chore: add SMTP env vars to .env.example"
```
