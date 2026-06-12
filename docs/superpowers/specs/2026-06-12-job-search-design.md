# Job Search Feature Design

## Overview
Add a job search page that lets users discover jobs via Adzuna API, prepare applications using AI, and track them in the existing pipeline.

## Data Model

### New Env Vars
- `ADZUNA_API_ID` — Adzuna application ID (free tier)
- `ADZUNA_API_KEY` — Adzuna API key (free tier)
- `ADZUNA_API_URL` — defaults to `https://api.adzuna.com/v1/api/jobs`

### New Types
```typescript
interface JobListing {
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

### DB Changes (migration 013)
Add to `job_applications`:
- `adzuna_id TEXT` (nullable, unique per user)
- `source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'adzuna'))`

## API Layer

### POST /api/jobs/search
- Input: `{ keyword, location?, page? }`
- Proxies Adzuna search API, returns sanitized JobListing[]
- Rate-limited: 10 req/min per IP

### POST /api/jobs/prepare
- Input: `{ job_title, company, description, resume_id }`
- Runs `analyzeSkillGap()` and `generateCoverLetter()` in parallel
- Returns: `{ matchScore, verdict, verdict_explanation, strengths, gaps, missingKeywords, suggestions, coverLetter }`
- Authenticated, checks AI usage quota

### GET /api/jobs (existing) + POST /api/jobs (existing)
- Unchanged. Used to save/sync applied jobs to tracker.

## UI Components

### New route: `/jobs/search`
Two-column layout: results list (left) + detail/prep panel (right).

### Components
- **JobSearchBar** — keyword + location inputs + search button + pagination
- **JobCard** — displays title, company, location, salary range, posted date
- **JobDetailPanel** — full description + company info + "Prepare Application" + "Apply Now"
- **ApplicationPrep** — match score gauge, strengths vs gaps, editable cover letter, resume tips
- **JobSearchSidebar** — filters (category, contract type, salary range)

### Nav
Add "Job Search" item to Sidebar between "Skill Gap" and "Job Tracker".

## AI Integration (On-Demand)

When "Prepare Application" clicked:
1. Fetch user's primary resume
2. Call `POST /api/jobs/prepare` (parallel skill-gap + cover-letter)
3. Display results in ApplicationPrep component
4. Cover letter is editable (same pattern as existing cover letter page)
5. Falls back gracefully if no AI API key

## Apply Flow
1. Save to `job_applications` with `source: 'adzuna'`, `adzuna_id`, `status: 'Applied'`
2. Save cover letter to `cover_letters` if AI prep was done
3. Open `redirect_url` in new tab
4. Show success toast with link to tracker
5. Dedup check on `adzuna_id` per user

## Files to Create
- `src/app/(protected)/jobs/search/page.tsx` — search page
- `src/app/api/jobs/search/route.ts` — Adzuna proxy
- `src/app/api/jobs/prepare/route.ts` — AI prep endpoint
- `src/components/jobs/JobSearchBar.tsx`
- `src/components/jobs/JobCard.tsx`
- `src/components/jobs/JobDetailPanel.tsx`
- `src/components/jobs/ApplicationPrep.tsx`
- `src/components/jobs/JobSearchSidebar.tsx`

## Files to Modify
- `supabase/migrations/013_add_job_source.sql` — new migration
- `src/types/database.ts` — add JobListing type, update JobApplication
- `src/components/layout/Sidebar.tsx` — add nav item
- `src/lib/ai.ts` — add resume-tailoring prompt

## Testing
- Unit tests for Adzuna API proxy (mock fetch)
- Unit tests for AI integration (mock AI calls)
- Component tests for JobCard, ApplicationPrep
- E2E: search → view detail → prepare → apply flow
