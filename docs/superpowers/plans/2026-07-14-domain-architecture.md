# Domain Architecture Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Serve marketing site at mycareerdock.com and CareerDock app at app.mycareerdock.com from a single Vercel project, with Decap CMS for no-code article editing.

**Architecture:** Middleware rewrites root domain requests to marketing pages under `src/app/marketing/`. App subdomain passes through to existing routes unchanged. All existing app code stays untouched.

**Tech Stack:** Next.js, Decap CMS (Git-backed), Tailwind CSS, markdown content files

---

### Task 1: DNS Setup

**Action:** User sets DNS records at their domain registrar.

- [ ] **Add DNS records for mycareerdock.com**

   | Type | Name | Value |
   |------|------|-------|
   | CNAME | @ | cname.vercel-dns.com |
   | CNAME | app | cname.vercel-dns.com |

   Or switch nameservers to Vercel's if the registrar supports it.

---

### Task 2: Decap CMS configuration

**Files:**
- Create: `public/admin/config.yml`
- Create: `src/app/admin/page.tsx`

- [ ] **Create CMS config file**

```yaml
# public/admin/config.yml
backend:
  name: github
  repo: Arunkumarpanchanana/CareerDock
  branch: main
  base_url: https://mycareerdock.com
  auth_endpoint: /api/auth

media_folder: public/images/uploads
public_folder: /images/uploads

collections:
  - name: "articles"
    label: "Articles"
    folder: "content/articles"
    create: true
    slug: "{{slug}}"
    fields:
      - { label: "Title", name: "title", widget: "string" }
      - { label: "Publish Date", name: "date", widget: "datetime" }
      - { label: "Excerpt", name: "excerpt", widget: "text", required: false }
      - { label: "Tags", name: "tags", widget: "list", required: false }
      - { label: "Published", name: "published", widget: "boolean", default: true }
      - { label: "Body", name: "body", widget: "markdown" }
```

- [ ] **Create admin page**

```tsx
'use client'

import { useEffect } from 'react'
import Script from 'next/script'

export default function AdminPage() {
  useEffect(() => {
    if (window.netlifyIdentity) {
      window.netlifyIdentity.on('init', (user: any) => {
        if (!user) window.netlifyIdentity.open()
      })
    }
  }, [])

  return (
    <>
      <Script src="https://identity.netlify.com/v1/netlify-identity-widget.js" />
      <div>
        <link rel="stylesheet" href="https://unpkg.com/decap-cms@^3.0.0/dist/decap-cms.css" />
        <script src="https://unpkg.com/decap-cms@^3.0.0/dist/decap-cms.js"></script>
      </div>
    </>
  )
}
```

- [ ] **Create content directory**

```bash
mkdir -p content/articles public/images/uploads
```

- [ ] **Create a sample article**

```markdown
---
title: "Welcome to CareerDock"
date: 2026-07-14
excerpt: "Your AI-powered career companion"
tags:
  - welcome
published: true
---

# Welcome to CareerDock

CareerDock helps you prepare for interviews, improve your resume, and get personalized career coaching — all powered by AI.
```

---

### Task 3: Marketing pages

**Files:**
- Create: `src/app/marketing/layout.tsx`
- Create: `src/app/marketing/page.tsx`
- Create: `src/app/marketing/articles/page.tsx`
- Create: `src/app/marketing/articles/[slug]/page.tsx`
- Create: `src/app/marketing/offers/page.tsx`
- Create: `src/lib/articles.ts`
- Create: `src/app/marketing/globals.css`

- [ ] **Create article loading utility**

```typescript
// src/lib/articles.ts
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

export interface Article {
  slug: string
  title: string
  date: string
  excerpt: string
  tags: string[]
  published: boolean
  content: string
}

const articlesDir = path.join(process.cwd(), 'content/articles')

export function getArticles(): Article[] {
  if (!fs.existsSync(articlesDir)) return []
  const files = fs.readdirSync(articlesDir).filter(f => f.endsWith('.md'))
  const articles = files.map(file => {
    const raw = fs.readFileSync(path.join(articlesDir, file), 'utf-8')
    const { data, content } = matter(raw)
    return {
      slug: file.replace('.md', ''),
      title: data.title || '',
      date: data.date ? new Date(data.date).toISOString() : '',
      excerpt: data.excerpt || '',
      tags: data.tags || [],
      published: data.published !== false,
      content,
    }
  })
  return articles.filter(a => a.published).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export function getArticle(slug: string): Article | null {
  return getArticles().find(a => a.slug === slug) || null
}
```

- [ ] **Create marketing layout**

```tsx
// src/app/marketing/layout.tsx
import Link from 'next/link'
import type { ReactNode } from 'react'

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-gray-200">
        <nav className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold">CareerDock</Link>
          <div className="flex gap-6 text-sm">
            <Link href="/articles" className="hover:text-blue-600">Articles</Link>
            <Link href="/offers" className="hover:text-blue-600">Offers</Link>
            <a href="https://app.mycareerdock.com" className="text-blue-600 font-medium">Launch App →</a>
          </div>
        </nav>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-gray-200 py-8 text-center text-sm text-gray-500">
        © 2026 CareerDock
      </footer>
    </div>
  )
}
```

- [ ] **Create marketing landing page**

```tsx
// src/app/marketing/page.tsx
import Link from 'next/link'

export default function MarketingHome() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-20 text-center">
      <h1 className="text-5xl font-bold mb-6">Your AI Career Companion</h1>
      <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
        Practice interviews, get coaching, improve your resume — all with AI.
      </p>
      <div className="flex gap-4 justify-center">
        <a
          href="https://app.mycareerdock.com"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
        >
          Go to App →
        </a>
        <Link
          href="/articles"
          className="px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
        >
          Read Articles
        </Link>
      </div>
    </div>
  )
}
```

- [ ] **Create articles list page**

```tsx
// src/app/marketing/articles/page.tsx
import Link from 'next/link'
import { getArticles } from '@/lib/articles'

export default function ArticlesPage() {
  const articles = getArticles()
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Articles</h1>
      {articles.length === 0 && <p className="text-gray-500">No articles yet.</p>}
      <div className="space-y-6">
        {articles.map(a => (
          <article key={a.slug} className="border-b border-gray-200 pb-6">
            <Link href={`/articles/${a.slug}`} className="block group">
              <h2 className="text-xl font-semibold group-hover:text-blue-600">{a.title}</h2>
              {a.excerpt && <p className="text-gray-600 mt-1">{a.excerpt}</p>}
              <p className="text-sm text-gray-400 mt-2">{new Date(a.date).toLocaleDateString()}</p>
            </Link>
          </article>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Create article detail page**

```tsx
// src/app/marketing/articles/[slug]/page.tsx
import { notFound } from 'next/navigation'
import { getArticle, getArticles } from '@/lib/articles'
import ReactMarkdown from 'react-markdown'

export function generateStaticParams() {
  return getArticles().map(a => ({ slug: a.slug }))
}

export default function ArticlePage({ params }: { params: { slug: string } }) {
  const article = getArticle(params.slug)
  if (!article) notFound()

  return (
    <article className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">{article.title}</h1>
      <p className="text-gray-400 text-sm mb-8">{new Date(article.date).toLocaleDateString()}</p>
      <div className="prose max-w-none">
        <ReactMarkdown>{article.content}</ReactMarkdown>
      </div>
    </article>
  )
}
```

- [ ] **Create offers page**

```tsx
// src/app/marketing/offers/page.tsx
export default function OffersPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-6">Special Offers</h1>
      <p className="text-gray-600">No current offers. Check back later.</p>
    </div>
  )
}
```

---

### Task 4: Hostname middleware

**Files:**
- Create: `src/middleware.ts`

- [ ] **Create middleware**

```typescript
// src/middleware.ts
import { NextRequest, NextResponse } from 'next/server'

const APP_DOMAIN = 'app.mycareerdock.com'
const MARKETING_PREFIXES = ['/articles', '/offers', '/admin']

export function middleware(req: NextRequest) {
  const host = req.headers.get('host') || ''
  const isAppDomain = host.startsWith('app.') || host.includes(APP_DOMAIN)
  const { pathname } = req.nextUrl

  // Redirect marketing paths on app domain to root domain
  if (isAppDomain) {
    const isMarketingPath = MARKETING_PREFIXES.some(p => pathname.startsWith(p))
    if (isMarketingPath) {
      return NextResponse.redirect(new URL(pathname, `https://mycareerdock.com`))
    }
    return NextResponse.next()
  }

  // Rewrite root domain paths to marketing pages
  const url = req.nextUrl.clone()
  url.pathname = `/marketing${pathname === '/' ? '' : pathname}`
  return NextResponse.rewrite(url)
}

export const config = {
  matcher: ['/((?!api/|_next/|_vercel/|images/|favicon.ico).*)'],
}
```

- [ ] **Install gray-matter dependency**

```bash
npm install gray-matter react-markdown
```

---

### Task 5: Supabase project setup

- [ ] **Create Supabase project**

   User goes to https://supabase.com → "New project"
   - Name: CareerDock
   - Database password: set and save securely
   - Region: closest to you

- [ ] **Get API credentials**

   After project is ready, go to Project Settings → API and copy:
   - `NEXT_PUBLIC_SUPABASE_URL` (Project URL)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (anon public key)

- [ ] **Run schema migrations**

   ```bash
   # After connecting Supabase CLI or running SQL in Supabase SQL Editor
   # Apply the schema from the existing migration files
   ```

---

### Task 6: Vercel domain configuration

- [ ] **Add domains in Vercel**

   User goes to Vercel dashboard → CareerDock project → Settings → Domains
   - Add `mycareerdock.com`
   - Add `app.mycareerdock.com`
   - Follow Vercel's DNS verification steps

- [ ] **Set environment variables in Vercel**

   Add to Production environment:
   - `NEXT_PUBLIC_SUPABASE_URL` — from Supabase
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — from Supabase
   - `SUPABASE_SERVICE_ROLE_KEY` — from Supabase
   - `AI_API_KEY` — existing
   - `AI_API_URL` — existing
   - `AI_MODEL` — existing
   - `AI_FALLBACK_API_KEY` — Gemini key

---

### Task 7: Deploy and verify

- [ ] **Push to main**

   ```bash
   git add -A
   git commit -m "feat: add marketing site with Decap CMS and domain routing"
   git push origin main
   ```

- [ ] **Verify production**

   - Visit `https://mycareerdock.com` → should show marketing home
   - Visit `https://mycareerdock.com/articles` → should show articles (empty or with sample)
   - Visit `https://app.mycareerdock.com` → should show app home
   - Visit `https://app.mycareerdock.com/interview` → should show interview page
   - Visit `https://mycareerdock.com/admin` → should show Decap CMS login
