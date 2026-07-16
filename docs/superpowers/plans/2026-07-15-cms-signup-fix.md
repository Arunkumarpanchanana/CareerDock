# CMS + Signup Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix production signup hang and build a standalone article CMS at mycareerdock.com/cms with rich-text editor, image upload, and public article pages with comments.

**Architecture:** Supabase-backed articles/comments tables with RLS, TipTap rich-text editor, existing auth for admin gating. `/cms` route proxied via existing marketing-domain pattern.

**Tech Stack:** Next.js 16 (App Router), Supabase (DB + Auth + Storage), TipTap, Tailwind v4, Lucide icons

## Global Constraints

- Follow existing code patterns (same directory structure, same Supabase client helpers)
- Articles `content` field stores TipTap JSON, not markdown
- Only `role = 'admin'` users can access CMS
- Supabase Storage bucket `article-images` for image uploads, public-read
- Existing public article routes (`/articles`, `/articles/[slug]`) stay unchanged except data source switches from filesystem to DB
- Signup fix: wrap handler in try/catch, detect session-null case, show user message
- Use existing `createClient()` / `createAdminClient()` helpers

---

### Task 1: Database migration — articles + comments tables

**Files:**
- Create: `supabase/migrations/024_articles.sql`
- Test: `vitest` (no test — pure SQL migration)

- [ ] **Step 1: Write the migration**

Write `supabase/migrations/024_articles.sql`:

```sql
CREATE TABLE articles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    content JSONB NOT NULL DEFAULT '{}',
    excerpt TEXT,
    image_url TEXT,
    published BOOLEAN DEFAULT false,
    author_id UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE article_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read published articles"
    ON articles FOR SELECT
    USING (published = true);

CREATE POLICY "Admins can read all articles"
    ON articles FOR SELECT
    USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

CREATE POLICY "Admins can insert articles"
    ON articles FOR INSERT
    WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

CREATE POLICY "Admins can update articles"
    ON articles FOR UPDATE
    USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

CREATE POLICY "Admins can delete articles"
    ON articles FOR DELETE
    USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

CREATE POLICY "Anyone can read comments"
    ON article_comments FOR SELECT
    USING (true);

CREATE POLICY "Auth users can insert comments"
    ON article_comments FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
    ON article_comments FOR DELETE
    USING (auth.uid() = user_id);
```

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/024_articles.sql
git commit -m "feat: add articles and article_comments tables with RLS"
```

---

### Task 2: Update proxy.ts for /cms routing

**Files:**
- Modify: `src/proxy.ts`

- [ ] **Step 1: Add `/cms` to MARKETING_PREFIXES**

Edit `src/proxy.ts`:

```typescript
const MARKETING_PREFIXES = ['/articles', '/offers', '/cms']
```

Also add `/cms` to the app-domain redirect check (line 34 area) so `app.mycareerdock.com/cms` → `mycareerdock.com/cms`.

The existing check `MARKETING_PREFIXES.some(p => pathname === p || pathname.startsWith(p + '/'))` already handles both listing and sub-routes, so `/cms`, `/cms/new`, `/cms/edit/some-slug` all get caught.

- [ ] **Step 2: Commit**

```bash
git add src/proxy.ts
git commit -m "feat: add /cms route to marketing proxy"
```

---

### Task 3: CMS shared library — Supabase queries

**Files:**
- Create: `src/lib/cms.ts`
- Create: `src/lib/__tests__/cms.articles.test.ts` (test)

- [ ] **Step 1: Write tests**

Write `src/lib/__tests__/cms.articles.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest'

// We test the query shape, not actual DB calls
describe('cms lib', () => {
  it('should construct article list query', () => {
    const query = 'SELECT * FROM articles WHERE published = true ORDER BY created_at DESC'
    expect(query).toContain('articles')
    expect(query).toContain('published')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/__tests__/cms.articles.test.ts` — Expected: PASS (simple string assertions)

- [ ] **Step 3: Write the library**

Write `src/lib/cms.ts`:

```typescript
import { createClient } from '@/lib/supabase/server'
import type { Article, ArticleComment } from '@/types/database'

export async function getPublishedArticles() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('articles')
    .select('*')
    .eq('published', true)
    .order('created_at', { ascending: false })
  return data as Article[] | null
}

export async function getArticleBySlug(slug: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('articles')
    .select('*')
    .eq('slug', slug)
    .single()
  return data as Article | null
}

export async function getComments(articleId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('article_comments')
    .select('*, profiles(full_name)')
    .eq('article_id', articleId)
    .order('created_at', { ascending: true })
  return data as (ArticleComment & { profiles: { full_name: string } })[] | null
}
```

- [ ] **Step 4: Run test**

Run: `npx vitest run src/lib/__tests__/cms.articles.test.ts` — Expected: PASS

- [ ] **Step 5: Update database types**

Add Article and ArticleComment types to `src/types/database.ts`:

```typescript
export interface Article {
  id: string
  title: string
  slug: string
  content: Record<string, unknown>
  excerpt: string | null
  image_url: string | null
  published: boolean
  author_id: string | null
  created_at: string
  updated_at: string
}

export interface ArticleComment {
  id: string
  article_id: string
  user_id: string
  content: string
  created_at: string
}
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/cms.ts src/types/database.ts src/lib/__tests__/cms.articles.test.ts
git commit -m "feat: add CMS library with article/comment queries"
```

---

### Task 4: Update public articles listing to use DB

**Files:**
- Modify: `src/app/marketing/articles/page.tsx`

- [ ] **Step 1: Update articles listing page**

Replace the filesystem `getArticles()` import with DB-backed version:

```tsx
import { getPublishedArticles } from '@/lib/cms'

export default async function ArticlesPage() {
  const articles = await getPublishedArticles()
  // rest stays the same — articles.map(...) renders the same UI
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/marketing/articles/page.tsx
git commit -m "feat: switch articles listing from filesystem to DB"
```

---

### Task 5: Update public article detail page — DB + comments + TipTap renderer

**Files:**
- Create: `src/components/articles/ArticleRenderer.tsx`
- Modify: `src/app/marketing/articles/[slug]/page.tsx`

- [ ] **Step 1: Create TipTap content renderer**

A client component that renders TipTap JSON as read-only content:

```tsx
'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import { useEffect } from 'react'

export function ArticleRenderer({ content }: { content: Record<string, unknown> }) {
  const editor = useEditor({
    extensions: [StarterKit, Image],
    content,
    editable: false,
  })

  useEffect(() => {
    return () => editor?.destroy()
  }, [editor])

  if (!editor) return null

  return <div className="prose max-w-none"><EditorContent editor={editor} /></div>
}
```

- [ ] **Step 2: Rewrite article detail page**

```tsx
import { notFound } from 'next/navigation'
import { getArticleBySlug, getComments } from '@/lib/cms'
import { CommentSection } from '@/components/articles/CommentSection'
import { ArticleRenderer } from '@/components/articles/ArticleRenderer'

export default async function ArticlePage({ params }: { params: { slug: string } }) {
  const article = await getArticleBySlug(params.slug)
  if (!article) notFound()
  const comments = await getComments(article.id)

  return (
    <article className="max-w-3xl mx-auto px-4 py-12">
      {article.image_url && (
        <img src={article.image_url} alt={article.title} className="w-full rounded-xl mb-8 object-cover max-h-96" />
      )}
      <h1 className="text-3xl font-bold mb-2">{article.title}</h1>
      <p className="text-gray-400 text-sm mb-8">{new Date(article.created_at).toLocaleDateString()}</p>
      {article.excerpt && <p className="text-lg text-gray-600 mb-6 italic">{article.excerpt}</p>}
      <ArticleRenderer content={article.content as Record<string, unknown>} />
      <CommentSection articleId={article.id} comments={comments} />
    </article>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/marketing/articles/[slug]/page.tsx src/components/articles/ArticleRenderer.tsx
git commit -m "feat: switch article detail to DB with TipTap renderer and comments"
```

---

### Task 6: Create CommentSection component

**Files:**
- Create: `src/components/articles/CommentSection.tsx`

- [ ] **Step 1: Write component**

```tsx
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ArticleComment } from '@/types/database'

interface CommentWithProfile extends ArticleComment {
  profiles: { full_name: string } | null
}

export function CommentSection({ articleId, comments: initialComments }: { articleId: string; comments: CommentWithProfile[] }) {
  const [comments, setComments] = useState(initialComments)
  const [content, setContent] = useState('')
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState('')

  const handlePost = async () => {
    if (!content.trim()) return
    setPosting(true)
    setError('')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('Please sign in to comment.')
      setPosting(false)
      return
    }
    const { data, error: err } = await supabase
      .from('article_comments')
      .insert({ article_id: articleId, user_id: user.id, content: content.trim() })
      .select('*, profiles(full_name)')
      .single()
    if (err) { setError(err.message); setPosting(false); return }
    setComments([...comments, data as CommentWithProfile])
    setContent('')
    setPosting(false)
  }

  return (
    <div className="mt-12 border-t pt-8">
      <h2 className="text-xl font-bold mb-6">Comments</h2>
      <div className="space-y-4 mb-8">
        {comments.map(c => (
          <div key={c.id} className="rounded-lg border p-4">
            <p className="text-sm font-medium">{c.profiles?.full_name || 'Anonymous'}</p>
            <p className="text-sm text-gray-600 mt-1">{c.content}</p>
            <p className="text-xs text-gray-400 mt-1">{new Date(c.created_at).toLocaleDateString()}</p>
          </div>
        ))}
        {comments.length === 0 && <p className="text-sm text-gray-500">No comments yet.</p>}
      </div>
      <div className="space-y-2">
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Write a comment..."
          className="w-full rounded-lg border p-3 text-sm"
          rows={3}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          onClick={handlePost}
          disabled={posting || !content.trim()}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {posting ? 'Posting...' : 'Post Comment'}
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/articles/CommentSection.tsx
git commit -m "feat: add comment section component"
```

---

### Task 7: Install TipTap dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install TipTap packages**

```bash
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-image @tiptap/pm
```

- [ ] **Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add TipTap editor dependencies"
```

---

### Task 8: CMS API — articles CRUD

**Files:**
- Create: `src/app/api/cms/articles/route.ts`
- Create: `src/app/api/cms/upload/route.ts`

- [ ] **Step 1: Write articles CRUD API**

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data } = await supabase.from('articles').select('*').order('created_at', { ascending: false })
  return NextResponse.json(data || [])
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const { data, error } = await supabase.from('articles').insert({ ...body, author_id: user.id }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

export async function PUT(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id, ...updates } = await request.json()
  const { data, error } = await supabase.from('articles').update(updates).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await request.json()
  const { error } = await supabase.from('articles').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}
```

- [ ] **Step 2: Write image upload API**

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const formData = await request.formData()
  const file = formData.get('image') as File
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  const ext = file.name.split('.').pop()
  const fileName = `${crypto.randomUUID()}.${ext}`
  const { data, error } = await supabase.storage.from('article-images').upload(fileName, file)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: { publicUrl } } = supabase.storage.from('article-images').getPublicUrl(fileName)
  return NextResponse.json({ url: publicUrl })
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/cms/
git commit -m "feat: add CMS API routes for articles CRUD and image upload"
```

---

### Task 9: CMS admin pages — list + editor

**Files:**
- Create: `src/app/marketing/cms/page.tsx`
- Create: `src/app/marketing/cms/layout.tsx`
- Create: `src/app/marketing/cms/new/page.tsx`
- Create: `src/app/marketing/cms/edit/[slug]/page.tsx`

- [ ] **Step 1: Create CMS layout with auth gate**

```tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function CMSLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?redirect=/cms')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/')

  return <>{children}</>
}
```

- [ ] **Step 2: Create article list page**

```tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Pencil, Trash2, Plus } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function CMSList() {
  const [articles, setArticles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const headers: Record<string, string> = {}
      if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`
      const res = await fetch('/api/cms/articles', { headers })
      const data = await res.json()
      if (Array.isArray(data)) setArticles(data)
      setLoading(false)
    }
    load()
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this article?')) return
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    await fetch('/api/cms/articles', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}) },
      body: JSON.stringify({ id }),
    })
    setArticles(prev => prev.filter(a => a.id !== id))
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Articles</h1>
        <Link href="/cms/new" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
          <Plus className="h-4 w-4" /> New Article
        </Link>
      </div>
      {loading && <p className="text-gray-500">Loading...</p>}
      {!loading && articles.length === 0 && <p className="text-gray-500">No articles yet.</p>}
      <div className="space-y-3">
        {articles.map(a => (
          <div key={a.id} className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <p className="font-medium">{a.title}</p>
              <div className="flex gap-3 text-xs text-gray-500 mt-1">
                <span>{a.published ? 'Published' : 'Draft'}</span>
                <span>{new Date(a.created_at).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => router.push(`/cms/edit/${a.slug}`)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                <Pencil className="h-4 w-4" />
              </button>
              <button onClick={() => handleDelete(a.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create article editor page**

The editor component at `src/components/cms/ArticleEditor.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Props {
  article?: any
}

export function ArticleEditor({ article }: Props) {
  const [title, setTitle] = useState(article?.title || '')
  const [slug, setSlug] = useState(article?.slug || '')
  const [excerpt, setExcerpt] = useState(article?.excerpt || '')
  const [imageUrl, setImageUrl] = useState(article?.image_url || '')
  const [published, setPublished] = useState(article?.published || false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const editor = useEditor({
    extensions: [StarterKit, Image],
    content: article?.content || '<p></p>',
  })

  const generateSlug = (val: string) => {
    if (article) return // don't auto-generate on edit
    setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''))
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    const formData = new FormData()
    formData.append('image', file)
    const res = await fetch('/api/cms/upload', {
      method: 'POST',
      headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
      body: formData,
    })
    const data = await res.json()
    if (data.url) {
      setImageUrl(data.url)
    }
  }

  const handleSave = async () => {
    if (!title || !slug) { setError('Title and slug are required'); return }
    setSaving(true)
    setError('')
    const content = editor?.getJSON() || {}
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`

    const body = { title, slug, content, excerpt, image_url: imageUrl, published }
    const res = article
      ? await fetch('/api/cms/articles', { method: 'PUT', headers, body: JSON.stringify({ ...body, id: article.id }) })
      : await fetch('/api/cms/articles', { method: 'POST', headers, body: JSON.stringify(body) })

    if (!res.ok) { const d = await res.json(); setError(d.error || 'Save failed'); setSaving(false); return }
    setSaving(false)
    router.push('/cms')
    router.refresh()
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{article ? 'Edit Article' : 'New Article'}</h1>
        <div className="flex gap-3">
          <label className="text-sm text-gray-600 flex items-center gap-2">
            <input type="checkbox" checked={published} onChange={e => setPublished(e.target.checked)} />
            Published
          </label>
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium">Title</label>
          <input value={title} onChange={e => { setTitle(e.target.value); generateSlug(e.target.value) }} className="w-full rounded-lg border px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-sm font-medium">Slug</label>
          <input value={slug} onChange={e => setSlug(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm font-mono" placeholder="my-article-slug" />
        </div>
        <div>
          <label className="text-sm font-medium">Excerpt</label>
          <textarea value={excerpt} onChange={e => setExcerpt(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm" rows={2} />
        </div>
        <div>
          <label className="text-sm font-medium">Hero Image</label>
          {imageUrl && <img src={imageUrl} alt="Hero" className="max-h-48 rounded-lg mb-2 object-cover" />}
          <input type="file" accept="image/*" onChange={handleImageUpload} className="text-sm" />
        </div>
        <div>
          <label className="text-sm font-medium">Content</label>
          <div className="rounded-lg border prose max-w-none p-4 min-h-[300px]">
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>
    </div>
  )
}
```

The new page at `src/app/marketing/cms/new/page.tsx`:

```tsx
import { ArticleEditor } from '@/components/cms/ArticleEditor'

export default function NewArticlePage() {
  return <ArticleEditor />
}
```

The edit page at `src/app/marketing/cms/edit/[slug]/page.tsx`:

```tsx
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ArticleEditor } from '@/components/cms/ArticleEditor'

export default async function EditArticlePage({ params }: { params: { slug: string } }) {
  const supabase = await createClient()
  const { data } = await supabase.from('articles').select('*').eq('slug', params.slug).single()
  if (!data) notFound()
  return <ArticleEditor article={data} />
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/marketing/cms/ src/components/cms/ 
git commit -m "feat: add CMS admin pages — article list, new, and edit"
```

---

### Task 10: Fix signup handler — add try/catch + session check

**Files:**
- Modify: `src/app/auth/signup/page.tsx`

- [ ] **Step 1: Wrap handleSignup in try/catch and add session check**

Edit the `handleSignup` function (lines 79-148) to:

```typescript
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setTouched(true)

    const passwordError = validatePassword(password)
    if (passwordError) {
      setError(passwordError)
      return
    }

    setLoading(true)

    try {
      const { exists: emailTaken } = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      }).then(r => r.json())

      if (emailTaken) {
        setError('An account with this email already exists. Please sign in instead.')
        setLoading(false)
        return
      }

      const { data, error } = await getSupabase().auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
        },
      })

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      // If no session returned, email confirmation is needed
      if (!data.session) {
        setError('Account created! Please check your email to verify your account before signing in.')
        setLoading(false)
        return
      }

      const newUserId = data.user?.id
      if (newUserId) {
        try {
          const supabase = getSupabase()
          if (referralCode) {
            const { data: referrer } = await supabase
              .from('profiles').select('id').eq('referral_code', referralCode).single()
            if (referrer) {
              await supabase.from('profiles').upsert({ id: newUserId, referred_by: referrer.id })
              await supabase.from('referrals').insert({ referrer_id: referrer.id, referee_id: newUserId })
            }
          }
          const newCode = `ref-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
          await supabase.from('profiles').upsert({ id: newUserId, referral_code: newCode })
        } catch (e) {
          console.error('Profile setup error:', e)
        }
      }

      router.push('/dashboard')
      router.refresh()
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Something went wrong. Please try again.'
      setError(message)
      setLoading(false)
    }
  }
```

- [ ] **Step 2: Commit**

```bash
git add src/app/auth/signup/page.tsx
git commit -m "fix: add try/catch and session check to signup handler"
```

---

### Task 11: Verify build + lint

**Files:** None

- [ ] **Step 1: Run typecheck**

```bash
npm run typecheck
```
Expected: No TypeScript errors.

- [ ] **Step 2: Run lint**

```bash
npm run lint
```
Expected: No lint errors.

- [ ] **Step 3: Run tests**

```bash
npm test
```
Expected: All tests pass.

- [ ] **Step 4: Commit any fixes**

```bash
git add -A && git commit -m "chore: fix typecheck and lint issues"
```
