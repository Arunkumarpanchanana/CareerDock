# CMS + Signup Fix — Design Spec

## Overview

Two deliverables:
1. Fix production signup failures on app.mycareerdock.com
2. Build a standalone article CMS at mycareerdock.com/cms with rich-text editor, image upload, and public article pages with comments

## 1. Signup Fix

### Problem
- `handleSignup` in `src/app/auth/signup/page.tsx` has no try/catch around the main async flow — any thrown error (network failure, Supabase timeout) leaves `loading` stuck at `true` and the user sees a frozen spinner.
- The Supabase project still has email confirmations enabled, so `signUp()` returns `{ user, session: null }` and the post-signup redirect to `/dashboard` bounces to `/auth/login` with no feedback.

### Fix
- Wrap the entire handler in try/catch that resets loading and shows error
- Detect `session === null` after signup → show "Check your email" message instead of blind redirect
- Document that email confirmations must be disabled in the Supabase project dashboard (already done in `config.toml`)

## 2. Article CMS

### Route & Domain
- `mycareerdock.com/cms` → rewritten by proxy to `src/app/marketing/cms/`
- Add `'/cms'` to `MARKETING_PREFIXES` in `src/proxy.ts`
- `app.mycareerdock.com/cms` → redirects to `mycareerdock.com/cms`

### Database (Supabase)

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

-- RLS
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_comments ENABLE ROW LEVEL SECURITY;

-- Articles: admins can CRUD, anyone can read published
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

-- Comments: anyone can read, authenticated users can insert own
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

### CMS Pages (`mycareerdock.com/cms`)

| Route | Component | Description |
|---|---|---|
| `/cms` | ArticleList | Table of all articles, create/ edit/ delete actions |
| `/cms/new` | ArticleEditor | TipTap editor, blank article |
| `/cms/edit/[slug]` | ArticleEditor | TipTap editor, pre-filled |

**Auth gate:** Admin-only. Uses existing profiles `role = 'admin'` check. Redirects to login if not authenticated, shows 403 if not admin.

**TipTap editor features:**
- Headings H1–H3, bold, italic, bullet lists, numbered lists
- Image insert → uploads to Supabase Storage bucket `article-images`
- Excerpt field (plain text)
- Slug auto-generated from title (editable)
- Publish/draft toggle
- Save & Publish / Save as Draft

### Image Upload
- Supabase Storage bucket: `article-images`
- Public read access
- Upload via API route `/api/cms/upload`
- Returns public URL stored in `articles.image_url`

### Public Article Pages
- `/articles` — listing: reads `published = true` articles from Supabase
- `/articles/[slug]` — detail: reads single article, renders TipTap JSON as HTML
- Below article: comment section
  - List: read-only, no auth required
  - Post: requires Supabase auth session, shows name from `profiles`
- Replace the current filesystem-based `src/lib/articles.ts` with Supabase queries

### Migration
- New migration `024_articles.sql` with the schema above
- Migrate existing `content/articles/welcome-to-careerdock.md` to DB on deploy

### Files Changed
- `src/proxy.ts` — add `/cms` to MARKETING_PREFIXES and app-domain redirect
- `src/app/marketing/cms/page.tsx` — article list
- `src/app/marketing/cms/new/page.tsx` — new article editor
- `src/app/marketing/cms/edit/[slug]/page.tsx` — edit article editor
- `src/app/marketing/articles/page.tsx` — switch to DB
- `src/app/marketing/articles/[slug]/page.tsx` — switch to DB, add comments
- `src/lib/articles.ts` — replace with Supabase queries (or delete, keep thin wrapper)
- `src/lib/supabase/server.ts` — no changes needed (reuse existing patterns)
- `src/app/api/cms/upload/route.ts` — image upload endpoint
- `src/app/api/cms/articles/route.ts` — CRUD API for articles
- `src/app/api/cms/comments/route.ts` — comment API
- `src/app/auth/signup/page.tsx` — add try/catch + session check
- `supabase/migrations/024_articles.sql` — new tables + RLS
- `package.json` — add `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-image`
