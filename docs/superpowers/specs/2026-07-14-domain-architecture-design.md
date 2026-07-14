# Domain Architecture: mycareerdock.com + app.mycareerdock.com

## Overview
Single Next.js project on Vercel serving two domains:
- `mycareerdock.com` — marketing site (home, articles, offers)
- `app.mycareerdock.com` — CareerDock app (coach, interview, resume, etc.)

Middleware routes traffic by hostname. Decap CMS provides browser-based content editing for articles.

## Architecture

```
User → mycareerdock.com ─┐
                          ├─ Vercel (single project) ── middleware (hostname check) ──┬─ marketing pages (/)
User → app.mycareerdock.com ┘                                                       └─ app pages (/interview, /coach, etc.)
```

## Components

### 1. Hostname Middleware
- `src/middleware.ts` checks `req.headers.get('host')`
- Rewrites `/` to app routes if hostname is `app.mycareerdock.com`
- Marketing pages render only for root domain

### 2. Marketing Pages
- Home page (`/`) — landing with hero, features, CTA
- Articles list (`/articles`) — paginated list of published articles
- Article page (`/articles/[slug]`) — renders markdown content
- Offers page (`/offers`) — special offers/promotions

### 3. Decap CMS
- Accessible at `/admin`
- Git-based: edits commit markdown files to `content/articles/` in the repo
- Auth via GitHub OAuth
- Widgets: rich text, images, metadata (title, date, slug, tags)

### 4. Content Storage
- Articles stored as markdown in `content/articles/<slug>.md`
- Frontmatter: title, date, excerpt, tags, published
- Loaded at build time via server components (no DB needed)

### 5. CareerDock App (unchanged)
- All existing pages under `app.mycareerdock.com`
- Supabase backend
- No modifications to existing app logic

## Domain Setup (DNS)

| Domain | Type | Value |
|--------|------|-------|
| mycareerdock.com | CNAME | cname.vercel-dns.com |
| app.mycareerdock.com | CNAME | cname.vercel-dns.com |

Or use Vercel's nameservers for root domain.

## Tech Stack
- Next.js (same project)
- Decap CMS (free, Git-backed)
- Markdown/MDX for content
- Tailwind CSS for styling

## Future Considerations
- When marketing needs outgrow this setup, migrate to a separate Vercel project or a dedicated CMS
- No migration cost — just move content files and deploy separately

## Out of Scope (for now)
- Newsletter/subscription system
- Analytics beyond basic Vercel analytics
- Multi-author workflows
- Comments on articles
