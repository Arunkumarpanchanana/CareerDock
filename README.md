# CareerDock - Career Acceleration Platform

A career acceleration platform built with Next.js and Supabase.

## Prerequisites

- Node.js 18+
- A Supabase account (free tier works)

## Quick Start

1. Clone the repo
2. Copy `.env.example` to `.env.local` and fill in your Supabase values:
   ```bash
   cp .env.example .env.local
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Run migrations from `supabase/migrations/` (in order):
   ```bash
   # Use the Supabase CLI or run SQL manually from each file
   supabase migration up
   ```
3. Enable the **Google OAuth** provider in your Supabase dashboard under Authentication → Providers

## AI Features

CareerDock uses an OpenAI-compatible AI API (works with Groq, Gemini, OpenAI, etc.).

### Getting a Groq API Key (Free)

1. Go to https://console.groq.com/keys
2. Click **"Create API Key"** — no credit card required
3. Copy the key (starts with `gsk_`)

### Local Development

Add to `.env.local`:
```
AI_API_KEY=gsk_...
AI_API_URL=https://api.groq.com/openai/v1/chat/completions
AI_MODEL=llama-3.3-70b-versatile
```

### Production (Vercel)

Add these environment variables in your Vercel project dashboard:
- `AI_API_KEY` — your Groq API key
- `AI_API_URL` — `https://api.groq.com/openai/v1/chat/completions`
- `AI_MODEL` — `llama-3.3-70b-versatile`

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start the development server |
| `npm run build` | Build for production |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript type checking |

## Project Structure

```
src/
  app/          — Next.js App Router pages and API routes
  components/   — Reusable React components
  lib/          — Utility functions and Supabase client
  types/        — TypeScript type definitions
supabase/
  migrations/   — Database migration files
```
