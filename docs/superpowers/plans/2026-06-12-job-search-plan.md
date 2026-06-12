# Job Search Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a job search page with Adzuna API integration, on-demand AI application prep, and one-click apply flow.

**Architecture:** New `/jobs/search` page with two-column layout. `POST /api/jobs/search` proxies Adzuna API. `POST /api/jobs/prepare` runs AI skill-gap + cover-letter generation in parallel. Apply saves to `job_applications` table with source tracking.

**Tech Stack:** Next.js 16 App Router, Supabase, Adzuna API, existing AI module (OpenAI-compatible), Zod validation

---

### Task 1: DB Migration + Types

**Files:**
- Create: `supabase/migrations/013_add_job_source.sql`
- Modify: `src/types/database.ts`

- [ ] **Step 1: Create migration**

```sql
ALTER TABLE job_applications
ADD COLUMN adzuna_id TEXT,
ADD COLUMN source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'adzuna'));

CREATE UNIQUE INDEX idx_job_applications_adzuna_id ON job_applications(adzuna_id) WHERE adzuna_id IS NOT NULL;
```

- [ ] **Step 2: Update types**

Add `JobListing` interface and extend `JobApplication` in `src/types/database.ts`:

```typescript
export interface JobListing {
  adzuna_id: string
  title: string
  company: string
  location: string
  description: string
  salary_min: number | null
  salary_max: number | null
  salary_is_predicted: boolean
  redirect_url: string
  category: string
  contract_type: string | null
  created: string
}
```

Update `JobApplication` interface — add after `job_url`:
```typescript
  adzuna_id: string | null
  source: 'manual' | 'adzuna'
```

- [ ] **Step 3: Verify types compile**

Run: `npm run typecheck`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/013_add_job_source.sql src/types/database.ts
git commit -m "feat: add job source tracking to job_applications"
```

---

### Task 2: Validation Schemas

**Files:**
- Modify: `src/lib/validation.ts`

- [ ] **Step 1: Add search + prepare schemas**

```typescript
export const jobSearchSchema = z.object({
  keyword: z.string().min(1, 'Keyword is required'),
  location: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
})

export const jobPrepareSchema = z.object({
  job_title: z.string().min(1),
  company: z.string().min(1),
  description: z.string().min(1),
  resume_id: z.string().uuid(),
})

// Extend jobApplicationSchema with new fields for Adzuna-sourced jobs
export const jobApplicationSchema = z.object({
  company_name: z.string().min(1, 'Company name is required'),
  job_title: z.string().min(1, 'Job title is required'),
  salary_range: z.string().nullable().optional(),
  job_url: z.string().url().nullable().optional().or(z.literal('')),
  notes: z.string().nullable().optional(),
  status: z.enum(['Wishlist', 'Applied', 'Interviewing', 'Offered', 'Rejected']).optional(),
  adzuna_id: z.string().optional(),
  source: z.enum(['manual', 'adzuna']).optional(),
})
```

- [ ] **Step 2: Verify types compile**

Run: `npm run typecheck`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/lib/validation.ts
git commit -m "feat: add job search and prepare validation schemas"
```

---

### Task 3: Adzuna Search API Route

**Files:**
- Create: `src/app/api/jobs/search/route.ts`
- Test: `src/app/api/jobs/__tests__/search.test.ts`

- [ ] **Step 1: Write search API route**

```typescript
import { createClient } from '@/lib/supabase/server'
import { rateLimitByIp } from '@/lib/rate-limit'
import { NextResponse } from 'next/server'
import { jobSearchSchema } from '@/lib/validation'

const ADZUNA_APP_ID = process.env.ADZUNA_API_ID
const ADZUNA_API_KEY = process.env.ADZUNA_API_KEY
const ADZUNA_API_URL = process.env.ADZUNA_API_URL ?? 'https://api.adzuna.com/v1/api/jobs'

export async function POST(request: Request) {
  const limit = rateLimitByIp(request, 10, 60_000)
  if (limit instanceof NextResponse) return limit

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!ADZUNA_APP_ID || !ADZUNA_API_KEY) {
      return NextResponse.json({ error: 'Adzuna API not configured' }, { status: 503 })
    }

    const body = await request.json()
    const parsed = jobSearchSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    const { keyword, location, page } = parsed.data
    const country = 'gb'
    const params = new URLSearchParams({
      app_id: ADZUNA_APP_ID,
      app_key: ADZUNA_API_KEY,
      what: keyword,
      where: location ?? '',
      page: String(page),
      content_type: 'application/json',
      results_per_page: '20',
    })

    const adzunaRes = await fetch(`${ADZUNA_API_URL}/${country}/search/${page}?${params}`)
    if (!adzunaRes.ok) {
      const errorText = await adzunaRes.text()
      console.error('Adzuna error:', adzunaRes.status, errorText)
      return NextResponse.json({ error: 'Job search failed' }, { status: 502 })
    }

    const adzunaData = await adzunaRes.json()

    const listings = (adzunaData.results ?? []).map((r: Record<string, unknown>) => ({
      adzuna_id: String(r.id),
      title: r.title as string,
      company: (r.company as Record<string, string>)?.display_name ?? 'Unknown',
      location: (r.location as Record<string, string>)?.display_name ?? '',
      description: (r.description as string) ?? '',
      salary_min: r.salary_min != null ? Number(r.salary_min) : null,
      salary_max: r.salary_max != null ? Number(r.salary_max) : null,
      salary_is_predicted: r.salary_is_predicted === '1',
      redirect_url: r.redirect_url as string,
      category: (r.category as Record<string, string>)?.label ?? '',
      contract_type: r.contract_type as string | null,
      created: r.created as string,
    }))

    return NextResponse.json({
      results: listings,
      total: adzunaData.count ?? 0,
      page: adzunaData.page ?? page,
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
```

- [ ] **Step 2: Write test file**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFetch = vi.fn()
global.fetch = mockFetch

const mockSupabase = {
  auth: { getUser: vi.fn() },
}
vi.mock('@/lib/supabase/server', () => ({
  createClient: () => mockSupabase,
}))

vi.mock('@/lib/rate-limit', () => ({
  rateLimitByIp: vi.fn().mockReturnValue(true),
}))

const searchHandler = async (body: Record<string, unknown>) => {
  const { POST } = await import('./route')
  const req = new Request('http://localhost/api/jobs/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return POST(req)
}

describe('POST /api/jobs/search', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    })
    process.env.ADZUNA_API_ID = 'test-id'
    process.env.ADZUNA_API_KEY = 'test-key'
  })

  it('returns 401 when unauthorized', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null })
    const res = await searchHandler({ keyword: 'engineer' })
    expect(res.status).toBe(401)
  })

  it('returns 503 when Adzuna not configured', async () => {
    delete process.env.ADZUNA_API_ID
    const res = await searchHandler({ keyword: 'engineer' })
    expect(res.status).toBe(503)
  })

  it('returns 400 for missing keyword', async () => {
    const res = await searchHandler({ keyword: '' })
    expect(res.status).toBe(400)
  })

  it('returns 502 when Adzuna API fails', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500, text: () => 'error' })
    const res = await searchHandler({ keyword: 'engineer' })
    expect(res.status).toBe(502)
  })

  it('returns listings on success', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        results: [{
          id: '123',
          title: 'Engineer',
          company: { display_name: 'Acme' },
          location: { display_name: 'London' },
          description: 'Job description',
          salary_min: 50000,
          salary_max: 70000,
          salary_is_predicted: '0',
          redirect_url: 'https://apply',
          category: { label: 'Engineering' },
          contract_type: 'permanent',
          created: '2026-06-10T12:00:00Z',
        }],
        count: 1,
        page: 1,
      }),
    })
    const res = await searchHandler({ keyword: 'engineer' })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.results).toHaveLength(1)
    expect(data.results[0].title).toBe('Engineer')
    expect(data.total).toBe(1)
  })
})
```

- [ ] **Step 3: Run test to verify it passes**

Run: `npx vitest run src/app/api/jobs/__tests__/search.test.ts`
Expected: All tests PASS

- [ ] **Step 4: Commit**

```bash
git add src/app/api/jobs/search/route.ts src/app/api/jobs/__tests__/search.test.ts
git commit -m "feat: add Adzuna job search API route"
```

---

### Task 4: AI Prepare API Route

**Files:**
- Create: `src/app/api/jobs/prepare/route.ts`
- Test: `src/app/api/jobs/__tests__/prepare.test.ts`

- [ ] **Step 1: Write prepare API route**

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { analyzeSkillGap, generateCoverLetter } from '@/lib/ai'
import { jobPrepareSchema } from '@/lib/validation'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = jobPrepareSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    const { job_title, company, description, resume_id } = parsed.data

    const { data: resume } = await supabase
      .from('resumes')
      .select('*')
      .eq('id', resume_id)
      .eq('user_id', user.id)
      .single()

    if (!resume) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 })
    }

    const resumeText = [
      resume.summary,
      ...(resume.experience as Array<Record<string, unknown>> ?? []).map(
        (e) => `${e.role} at ${e.company}: ${(e.bullets as string[] ?? []).join(', ')}`
      ),
      `Skills: ${(resume.skills ?? []).join(', ')}`,
    ].filter(Boolean).join('\n')

    const [skillGap, coverLetter] = await Promise.all([
      analyzeSkillGap({
        resume: resumeText,
        jobTitle: job_title,
        jobDescription: description,
      }),
      generateCoverLetter({
        resume: resumeText,
        jobTitle: job_title,
        company,
        jobDescription: description,
      }),
    ])

    return NextResponse.json({
      matchScore: skillGap.score,
      verdict: skillGap.verdict,
      verdict_explanation: skillGap.verdict_explanation,
      strengths: skillGap.strengths,
      gaps: skillGap.gaps,
      missingKeywords: skillGap.missingKeywords,
      suggestions: skillGap.suggestions,
      coverLetter,
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
```

- [ ] **Step 2: Write test file**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSupabase = {
  from: vi.fn(),
  auth: { getUser: vi.fn() },
}
vi.mock('@/lib/supabase/server', () => ({
  createClient: () => mockSupabase,
}))

vi.mock('@/lib/ai', () => ({
  analyzeSkillGap: vi.fn(),
  generateCoverLetter: vi.fn(),
}))

const { analyzeSkillGap, generateCoverLetter } = await import('@/lib/ai')

const prepareHandler = async (body: Record<string, unknown>) => {
  const { POST } = await import('./route')
  const req = new Request('http://localhost/api/jobs/prepare', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return POST(req)
}

describe('POST /api/jobs/prepare', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    })
  })

  it('returns 401 when unauthorized', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null })
    const res = await prepareHandler({
      job_title: 'Engineer', company: 'Acme', description: 'desc', resume_id: 'res-1',
    })
    expect(res.status).toBe(401)
  })

  it('returns 400 for missing fields', async () => {
    const res = await prepareHandler({ job_title: '' })
    expect(res.status).toBe(400)
  })

  it('returns 404 when resume not found', async () => {
    mockSupabase.from.mockReturnValue({
      select: () => ({
        eq: () => ({
          eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }),
        }),
      }),
    })
    const res = await prepareHandler({
      job_title: 'Engineer', company: 'Acme', description: 'desc', resume_id: 'res-1',
    })
    expect(res.status).toBe(404)
  })

  it('returns AI analysis results on success', async () => {
    const mockResume = {
      summary: 'Experienced engineer',
      experience: [{ role: 'Engineer', company: 'Co', bullets: ['Built X'] }],
      skills: ['React', 'TypeScript'],
    }
    mockSupabase.from.mockReturnValue({
      select: () => ({
        eq: () => ({
          eq: () => ({ single: () => Promise.resolve({ data: mockResume, error: null }) }),
        }),
      }),
    })
    vi.mocked(analyzeSkillGap).mockResolvedValue({
      score: 80, verdict: 'Strong fit', verdict_explanation: 'Match',
      strengths: ['React'], gaps: ['AWS'], missingKeywords: ['Docker'], suggestions: ['Learn Docker'],
    })
    vi.mocked(generateCoverLetter).mockResolvedValue('Dear Hiring Manager...')

    const res = await prepareHandler({
      job_title: 'Engineer', company: 'Acme', description: 'desc', resume_id: 'res-1',
    })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.matchScore).toBe(80)
    expect(data.coverLetter).toBe('Dear Hiring Manager...')
  })
})
```

- [ ] **Step 3: Run test to verify it passes**

Run: `npx vitest run src/app/api/jobs/__tests__/prepare.test.ts`
Expected: All tests PASS

- [ ] **Step 4: Commit**

```bash
git add src/app/api/jobs/prepare/route.ts src/app/api/jobs/__tests__/prepare.test.ts
git commit -m "feat: add AI job preparation API route"
```

---

### Task 5: JobSearchBar Component

**Files:**
- Create: `src/components/jobs/JobSearchBar.tsx`

- [ ] **Step 1: Write JobSearchBar**

```typescript
'use client'

import { Search } from 'lucide-react'

interface JobSearchBarProps {
  keyword: string
  location: string
  onKeywordChange: (v: string) => void
  onLocationChange: (v: string) => void
  onSearch: () => void
  loading: boolean
}

export function JobSearchBar({ keyword, location, onKeywordChange, onLocationChange, onSearch, loading }: JobSearchBarProps) {
  return (
    <div className="flex gap-3">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Job title, keyword, or company..."
          value={keyword}
          onChange={(e) => onKeywordChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSearch()}
          className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <input
        type="text"
        placeholder="Location"
        value={location}
        onChange={(e) => onLocationChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onSearch()}
        className="w-48 rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        onClick={onSearch}
        disabled={loading || !keyword.trim()}
        className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Searching...' : 'Search'}
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/jobs/JobSearchBar.tsx
git commit -m "feat: add JobSearchBar component"
```

---

### Task 6: JobCard Component

**Files:**
- Create: `src/components/jobs/JobCard.tsx`

- [ ] **Step 1: Write JobCard**

```typescript
'use client'

import type { JobListing } from '@/types/database'
import { Briefcase, Building2, MapPin, DollarSign, CalendarDays } from 'lucide-react'

interface JobCardProps {
  job: JobListing
  selected: boolean
  onClick: () => void
}

export function JobCard({ job, selected, onClick }: JobCardProps) {
  const daysAgo = job.created
    ? Math.floor((Date.now() - new Date(job.created).getTime()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-lg border p-4 transition-all hover:shadow-sm ${
        selected ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-gray-200 bg-white'
      }`}
    >
      <div className="space-y-2">
        <div>
          <h3 className="font-semibold text-gray-900 leading-tight">{job.title}</h3>
          <div className="flex items-center gap-1.5 text-sm text-gray-600 mt-0.5">
            <Building2 className="h-3.5 w-3.5" />
            {job.company}
          </div>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
          {job.location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {job.location}
            </span>
          )}
          {(job.salary_min || job.salary_max) && (
            <span className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              {job.salary_min ? `$${job.salary_min.toLocaleString()}` : ''}
              {job.salary_min && job.salary_max ? ' - ' : ''}
              {job.salary_max ? `$${job.salary_max.toLocaleString()}` : ''}
            </span>
          )}
          {daysAgo !== null && (
            <span className="flex items-center gap-1">
              <CalendarDays className="h-3 w-3" />
              {daysAgo === 0 ? 'Today' : `${daysAgo}d ago`}
            </span>
          )}
          {job.contract_type && (
            <span className="capitalize">{job.contract_type}</span>
          )}
        </div>
      </div>
    </button>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/jobs/JobCard.tsx
git commit -m "feat: add JobCard component"
```

---

### Task 7: JobDetailPanel Component

**Files:**
- Create: `src/components/jobs/JobDetailPanel.tsx`

- [ ] **Step 1: Write JobDetailPanel**

```typescript
'use client'

import type { JobListing } from '@/types/database'
import { Building2, MapPin, DollarSign, ExternalLink, CalendarDays, Briefcase, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui'

interface JobDetailPanelProps {
  job: JobListing
  onPrepare: () => void
  onApply: () => void
  preparing: boolean
  applied: boolean
}

export function JobDetailPanel({ job, onPrepare, onApply, preparing, applied }: JobDetailPanelProps) {
  const daysAgo = job.created
    ? Math.floor((Date.now() - new Date(job.created).getTime()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">{job.title}</h2>
        <div className="flex items-center gap-1.5 mt-1 text-gray-600">
          <Building2 className="h-4 w-4" />
          <span className="font-medium">{job.company}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 text-sm text-gray-500">
        {job.location && (
          <span className="flex items-center gap-1.5 bg-gray-100 rounded-full px-3 py-1">
            <MapPin className="h-3.5 w-3.5" /> {job.location}
          </span>
        )}
        {(job.salary_min || job.salary_max) && (
          <span className="flex items-center gap-1.5 bg-green-100 text-green-700 rounded-full px-3 py-1">
            <DollarSign className="h-3.5 w-3.5" />
            {job.salary_min ? `$${job.salary_min.toLocaleString()}` : ''}
            {job.salary_min && job.salary_max ? ' - ' : ''}
            {job.salary_max ? `$${job.salary_max.toLocaleString()}` : ''}
          </span>
        )}
        {daysAgo !== null && (
          <span className="flex items-center gap-1.5 bg-gray-100 rounded-full px-3 py-1">
            <CalendarDays className="h-3.5 w-3.5" />
            {daysAgo === 0 ? 'Today' : `${daysAgo} days ago`}
          </span>
        )}
        {job.contract_type && (
          <span className="flex items-center gap-1.5 bg-gray-100 rounded-full px-3 py-1 capitalize">
            <Briefcase className="h-3.5 w-3.5" /> {job.contract_type}
          </span>
        )}
      </div>

      <div className="border-t border-gray-200 pt-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Job Description</h3>
        <div
          className="prose prose-sm max-w-none text-gray-600"
          dangerouslySetInnerHTML={{ __html: job.description }}
        />
      </div>

      <div className="flex gap-3 pt-2">
        <Button onClick={onPrepare} disabled={preparing}>
          {preparing ? (
            <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Preparing...</>
          ) : (
            'Prepare Application'
          )}
        </Button>
        <Button
          variant={applied ? 'secondary' : 'primary'}
          onClick={onApply}
          disabled={applied}
        >
          {applied ? 'Applied' : (
            <><ExternalLink className="h-4 w-4 mr-1.5" /> Apply Now</>
          )}
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/jobs/JobDetailPanel.tsx
git commit -m "feat: add JobDetailPanel component"
```

---

### Task 8: ApplicationPrep Component

**Files:**
- Create: `src/components/jobs/ApplicationPrep.tsx`

- [ ] **Step 1: Write ApplicationPrep**

```typescript
'use client'

import { CheckCircle2, XCircle, Lightbulb, FileText, AlertTriangle } from 'lucide-react'
import { useState } from 'react'

interface ApplicationPrepData {
  matchScore: number
  verdict: string
  verdict_explanation: string
  strengths: string[]
  gaps: string[]
  missingKeywords: string[]
  suggestions: string[]
  coverLetter: string
}

interface ApplicationPrepProps {
  data: ApplicationPrepData
}

function ScoreGauge({ score }: { score: number }) {
  const color = score >= 70 ? 'text-green-600' : score >= 40 ? 'text-amber-600' : 'text-red-600'
  const bgColor = score >= 70 ? 'bg-green-100' : score >= 40 ? 'bg-amber-100' : 'bg-red-100'
  return (
    <div className={`inline-flex items-center gap-2 ${bgColor} rounded-full px-4 py-2`}>
      <span className={`text-2xl font-bold ${color}`}>{score}</span>
      <span className={`text-sm font-medium ${color}`}>/ 100</span>
    </div>
  )
}

export function ApplicationPrep({ data }: ApplicationPrepProps) {
  const [coverLetter, setCoverLetter] = useState(data.coverLetter)

  const scoreColor = data.matchScore >= 70 ? 'text-green-700' : data.matchScore >= 40 ? 'text-amber-700' : 'text-red-700'

  return (
    <div className="space-y-6 border-t border-gray-200 pt-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Application Prep</h3>
        <ScoreGauge score={data.matchScore} />
      </div>

      <p className={`text-sm font-medium ${scoreColor}`}>
        {data.verdict}
      </p>
      <p className="text-sm text-gray-600">{data.verdict_explanation}</p>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-green-700 flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4" /> Strengths
          </h4>
          {data.strengths.length > 0 ? (
            <ul className="space-y-1">
              {data.strengths.map((s, i) => (
                <li key={i} className="text-sm text-gray-600 flex items-start gap-1.5">
                  <span className="text-green-500 mt-0.5">•</span> {s}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-400">No specific strengths identified</p>
          )}
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-red-700 flex items-center gap-1.5">
            <XCircle className="h-4 w-4" /> Gaps
          </h4>
          {data.gaps.length > 0 ? (
            <ul className="space-y-1">
              {data.gaps.map((g, i) => (
                <li key={i} className="text-sm text-gray-600 flex items-start gap-1.5">
                  <span className="text-red-500 mt-0.5">•</span> {g}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-400">No major gaps detected</p>
          )}
        </div>
      </div>

      {data.missingKeywords.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-amber-700 flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4" /> Missing Keywords
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {data.missingKeywords.map((kw, i) => (
              <span key={i} className="text-xs bg-amber-50 text-amber-700 rounded-full px-2.5 py-1">
                {kw}
              </span>
            ))}
          </div>
        </div>
      )}

      {data.suggestions.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-blue-700 flex items-center gap-1.5">
            <Lightbulb className="h-4 w-4" /> Suggestions
          </h4>
          <ul className="space-y-1">
            {data.suggestions.map((s, i) => (
              <li key={i} className="text-sm text-gray-600 flex items-start gap-1.5">
                <span className="text-blue-500 mt-0.5">•</span> {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
          <FileText className="h-4 w-4" /> Cover Letter
        </h4>
        <textarea
          value={coverLetter}
          onChange={(e) => setCoverLetter(e.target.value)}
          rows={10}
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/jobs/ApplicationPrep.tsx
git commit -m "feat: add ApplicationPrep component"
```

---

### Task 9: Job Search Page

**Files:**
- Create: `src/app/(protected)/jobs/search/page.tsx`
- Create: `src/app/(protected)/jobs/layout.tsx`

- [ ] **Step 1: Write search page**

```typescript
'use client'

import { JobSearchBar } from '@/components/jobs/JobSearchBar'
import { JobCard } from '@/components/jobs/JobCard'
import { JobDetailPanel } from '@/components/jobs/JobDetailPanel'
import { ApplicationPrep } from '@/components/jobs/ApplicationPrep'
import type { JobListing } from '@/types/database'
import { ChevronLeft, ChevronRight, Briefcase } from 'lucide-react'
import { useCallback, useState } from 'react'

interface SearchResult {
  results: JobListing[]
  total: number
  page: number
}

export default function JobSearchPage() {
  const [keyword, setKeyword] = useState('')
  const [location, setLocation] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<SearchResult | null>(null)
  const [selectedJob, setSelectedJob] = useState<JobListing | null>(null)
  const [preparing, setPreparing] = useState(false)
  const [prepData, setPrepData] = useState<Record<string, unknown> | null>(null)
  const [appliedJobs, setAppliedJobs] = useState<Set<string>>(new Set())
  const [error, setError] = useState('')

  const handleSearch = useCallback(async (page = 1) => {
    if (!keyword.trim()) return
    setLoading(true)
    setError('')
    setPrepData(null)
    try {
      const res = await fetch('/api/jobs/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword, location: location || undefined, page }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Search failed')
      }
      const data = await res.json()
      setResults(data)
      setSelectedJob(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Search failed')
    } finally {
      setLoading(false)
    }
  }, [keyword, location])

  const handlePrepare = async () => {
    if (!selectedJob) return
    setPreparing(true)
    setPrepData(null)
    try {
      const { data: resumes } = await fetch('/api/resume').then((r) => r.json())
      const primaryResume = Array.isArray(resumes) ? resumes[0] : null
      if (!primaryResume) {
        setError('No resume found. Create one in Resume Builder first.')
        return
      }

      const res = await fetch('/api/jobs/prepare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_title: selectedJob.title,
          company: selectedJob.company,
          description: selectedJob.description,
          resume_id: primaryResume.id,
        }),
      })
      if (!res.ok) throw new Error('Preparation failed')
      const data = await res.json()
      setPrepData(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Preparation failed')
    } finally {
      setPreparing(false)
    }
  }

  const handleApply = async () => {
    if (!selectedJob) return
    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: selectedJob.company,
          job_title: selectedJob.title,
          job_url: selectedJob.redirect_url,
          salary_range: selectedJob.salary_min && selectedJob.salary_max
            ? `$${selectedJob.salary_min.toLocaleString()} - $${selectedJob.salary_max.toLocaleString()}`
            : null,
          status: 'Applied',
          source: 'adzuna',
          adzuna_id: selectedJob.adzuna_id,
        }),
      })
      if (!res.ok) throw new Error('Failed to save')
      setAppliedJobs(new Set(appliedJobs).add(selectedJob.adzuna_id))
      window.open(selectedJob.redirect_url, '_blank', 'noopener')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Apply failed')
    }
  }

  const totalPages = results ? Math.ceil(results.total / 20) : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Job Search</h1>
        <p className="mt-1 text-sm text-gray-600">
          Discover jobs and prepare tailored applications with AI assistance
        </p>
      </div>

      <JobSearchBar
        keyword={keyword}
        location={location}
        onKeywordChange={setKeyword}
        onLocationChange={setLocation}
        onSearch={() => handleSearch(1)}
        loading={loading}
      />

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
        </div>
      )}

      {results && !loading && (
        <div className="flex gap-6">
          <div className="w-1/2 space-y-3">
            <p className="text-sm text-gray-500">
              {results.total.toLocaleString()} jobs found
            </p>
            <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-2">
              {results.results.map((job) => (
                <JobCard
                  key={job.adzuna_id}
                  job={job}
                  selected={selectedJob?.adzuna_id === job.adzuna_id}
                  onClick={() => { setSelectedJob(job); setPrepData(null) }}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  onClick={() => handleSearch(results.page - 1)}
                  disabled={results.page <= 1}
                  className="rounded-lg border border-gray-300 p-2 hover:bg-gray-50 disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-sm text-gray-600">
                  Page {results.page} of {totalPages}
                </span>
                <button
                  onClick={() => handleSearch(results.page + 1)}
                  disabled={results.page >= totalPages}
                  className="rounded-lg border border-gray-300 p-2 hover:bg-gray-50 disabled:opacity-50"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          <div className="w-1/2">
            {selectedJob ? (
              <div className="sticky top-6 space-y-6">
                <JobDetailPanel
                  job={selectedJob}
                  onPrepare={handlePrepare}
                  onApply={handleApply}
                  preparing={preparing}
                  applied={appliedJobs.has(selectedJob.adzuna_id)}
                />
                {prepData && <ApplicationPrep data={prepData as Parameters<typeof ApplicationPrep>[0]['data']} />}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <Briefcase className="h-12 w-12 mb-3" />
                <p className="text-sm">Select a job to view details</p>
              </div>
            )}
          </div>
        </div>
      )}

      {!results && !loading && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Briefcase className="h-16 w-16 mb-4" />
          <p className="text-lg font-medium">Search for jobs to get started</p>
          <p className="text-sm mt-1">Enter a keyword and location above</p>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Create layout file**

```typescript
export default function JobsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/(protected)/jobs/search/page.tsx src/app/(protected)/jobs/layout.tsx
git commit -m "feat: add job search page"
```

---

### Task 10: Sidebar Nav

**Files:**
- Modify: `src/components/layout/Sidebar.tsx`

- [ ] **Step 1: Add Job Search nav item**

Add import:
```typescript
import { Briefcase, Building2, ChevronLeft, LayoutDashboard, LogOut, Menu, ScrollText, Search, Settings, Shield, Users, X } from 'lucide-react'
```

Add after skill-gap nav item:
```typescript
    { href: '/skills', label: 'Skill Gap', icon: Search },
    { href: '/jobs/search', label: 'Job Search', icon: Briefcase },
    { href: '/tracker', label: 'Job Tracker', icon: Briefcase },
```

And remove the duplicate `Briefcase` import issue — actually `Briefcase` is already imported. Need to add the new item between skill-gap and tracker. The Briefcase icon is already used for tracker — let's use a different icon like `ExternalLink` or `Globe` for the search page.

Actually let me re-check. The current Sidebar has:
```
import { Briefcase, Building2, ChevronLeft, LayoutDashboard, LogOut, Menu, ScrollText, Search, Settings, Shield, Users, X } from 'lucide-react'
```

`Briefcase` is already imported. For job search, I'll use a `Search` icon too — wait, `Search` is already used for Skill Gap. Let me use `ExternalLink` or just reuse `Briefcase`.

Better to add a new import like `Globe` from lucide-react:

```typescript
import { Briefcase, Building2, ChevronLeft, Globe, LayoutDashboard, LogOut, Menu, ScrollText, Search, Settings, Shield, Users, X } from 'lucide-react'
```

And add the nav item:
```typescript
    { href: '/skill-gap', label: 'Skill Gap', icon: Search },
    { href: '/jobs/search', label: 'Job Search', icon: Globe },
    { href: '/tracker', label: 'Job Tracker', icon: Briefcase },
```

- [ ] **Step 2: Commit**

```bash
git add src/components/layout/Sidebar.tsx
git commit -m "feat: add Job Search to sidebar navigation"
```

---

### Task 11: Full Typecheck & Test Run

- [ ] **Step 1: Run typecheck**

Run: `npm run typecheck`
Expected: No errors

- [ ] **Step 2: Run tests**

Run: `npm test`
Expected: All existing + new tests pass

- [ ] **Step 3: Run lint**

Run: `npm run lint`
Expected: No errors
