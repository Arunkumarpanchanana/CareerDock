# Phase 2: LinkedIn Import & Cover Letter Generator

## Status: Approved Design

## Overview

Two independent features for the resume builder:
1. **LinkedIn PDF Import** — parse a LinkedIn profile PDF export to populate `ResumeFormData`
2. **Cover Letter Generator** — generate, edit, save, and export cover letters based on resume + job description

---

## Section 1: LinkedIn PDF Import

### Flow

```
User clicks "Import from LinkedIn" button
  → file picker (.pdf only)
  → pdfjs-dist extracts raw text client-side
  → POST /api/import/linkedin { text }
    → heuristic section parser (LinkedIn's stable section headings)
    → confidence check — if < threshold, AI fallback
    → returns { data: ResumeFormData, confidence: number, unmatched: string[] }
  → preview dialog shows mapped fields + unmatched sections
  → user confirms → ResumeFormData is populated in the form
```

### Frontend

- **Trigger:** Button in the resume builder header: "Import from LinkedIn"
- **File handling:** Native `<input type="file" accept=".pdf">` — no extra dependency needed
- **PDF text extraction:** `pdfjs-dist` — loaded dynamically in the browser at import time
- **Preview dialog:** Modal showing detected fields (experience, education, skills, etc.) with confidence indicators and any unmatched raw text for manual paste
- **On confirm:** Sets form data via existing `updateField` for each section

### API: `POST /api/import/linkedin`

**Request:**
```json
{ "text": "..." }
```

**Response:**
```json
{ "data": ResumeFormData, "confidence": 0.85, "unmatched": ["..."], "source": "heuristic" }
```

**Parsing logic (`src/lib/linkedin-import.ts`):**

LinkedIn PDF text has a consistent structure with these section headers:
- `Experience` — job entries with company, title, dates, bullets
- `Education` — institution, degree, field, year
- `Skills` — comma-separated list
- `Projects` — name + description
- `Certifications` / `Licenses & Certifications` — name, issuer, date
- `Summary` / `About` — summary text

**Heuristic parser:**
1. Split text into sections by known LinkedIn section headings (regex)
2. For each section, apply format-specific extraction rules:
   - Experience: `Title at Company` → `Dates` → bullet lines
   - Education: `Degree, Field` → `Institution` → `Dates`
   - Skills: line items
3. Calculate confidence: ratio of successfully parsed entries to expected section count
4. If confidence < 0.7, route through AI fallback (`ai.ts`)

**AI fallback:** Sends raw text to `generateStructuredData(text)` in `ai.ts` which returns `ResumeFormData`. Uses the same quota/rate-limit pattern as existing AI endpoints.

### Data mapping

| LinkedIn Section | ResumeFormData Field |
|-----------------|---------------------|
| Summary / About | `summary` |
| Experience | `experience[]` |
| Education | `education[]` |
| Skills | `skills[]` |
| Projects | `projects[]` |
| Certifications | `certificates[]` |

### Migration

No new database tables — the import populates the in-memory form, not a new DB entity.

### Dependencies

- `pdfjs-dist` — client-side PDF text extraction (`npm install pdfjs-dist`)

### Test plan

- `src/lib/__tests__/linkedin-import.test.ts` — test heuristic parser with mock LinkedIn PDF text
- `src/lib/__tests__/linkedin-import.test.ts` — test low-confidence AI fallback path
- `src/components/resume/__tests__/LinkedInImport.test.tsx` — UI: button renders, file picker opens, preview dialog shows
- `src/app/api/import/__tests__/linkedin.test.ts` — API: valid request returns data, invalid returns error

---

## Section 2: Cover Letter Generator

### Flow

```
/resume/cover-letter page loads
  → fetches latest resume data + saved cover letters
  → left panel: job details form + generated letter editor
  → right panel: preview / download

User fills in: Job Title, Company, Job Description
  → clicks "Generate"
  → POST /api/cover-letter { resume_data, job_title, company, job_description }
    → AI generates cover letter (reuses ai.ts patterns)
    → saves to cover_letters table
  → letter appears in editor

User edits the generated text, can regenerate
  → "Download" → CoverLetterPDF component renders via @react-pdf/renderer
  → "Save" → PUT /api/cover-letter?id=X { content }
```

### Route

`/resume/cover-letter` — new page under `(protected)`

Server component (`page.tsx`):
- Fetches `profile` and latest `resume` via existing `getResumes()` helper
- Passes to client component `CoverLetterClient.tsx`

### Client Component: `CoverLetterClient.tsx`

**State:** `jobTitle`, `company`, `jobDescription`, `content` (generated letter), `history` (saved letters list), `saving`, `generating`

**Layout:**
- **Header:** "Cover Letters" title + "New Cover Letter" button
- **Left panel (form):**
  - Job Title input
  - Company input
  - Job Description textarea
  - "Generate" button
  - Generated content textarea (editable)
  - "Save" / "Download" buttons
- **Right panel (saved history):**
  - List of previous cover letters with title, date
  - Click to load into editor

### API: `POST /api/cover-letter`

**Request:**
```json
{ "resume_data": ResumeFormData, "job_title": "...", "company": "...", "job_description": "..." }
```

**Response:**
```json
{ "id": "...", "content": "..." }
```

**Generation:** Reuses `ai.ts` — calls a new function `generateCoverLetter(params)` which:
1. Builds a prompt from resume data + job details
2. Calls the AI text completion (same openai chat completions path)
3. Falls back to a template-based letter if no API key

### API: `PUT /api/cover-letter?id=X`

Standard update endpoint — saves edited content.

### API: `GET /api/cover-letter`

Returns user's saved cover letters (paginated, newest first).

### DB Migration: `012_add_cover_letters.sql`

```sql
CREATE TABLE cover_letters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled',
  content TEXT NOT NULL DEFAULT '',
  job_title TEXT NOT NULL DEFAULT '',
  company TEXT NOT NULL DEFAULT '',
  job_description TEXT NOT NULL DEFAULT '',
  resume_snapshot JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE cover_letters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their cover letters"
  ON cover_letters FOR ALL
  USING (auth.uid() = user_id);
```

### PDF Export for Cover Letters

New component `CoverLetterPDF.tsx` — similar pattern to `ResumePDF.tsx` but for letters. Uses `@react-pdf/renderer`, no font registration needed (uses built-in Helvetica).

Renders:
- Sender info (name, email, phone from profile)
- Date
- Recipient info (hiring manager or company)
- Body text
- Signature

### Dependencies

- No new libraries — reuses `ai.ts`, `@react-pdf/renderer`, existing API patterns

### Test plan

- `src/lib/__tests__/cover-letter.test.ts` — test AI generation fallback, test prompt construction
- `src/components/resume/__tests__/CoverLetterClient.test.tsx` — UI: form renders, generate button works, history loads
- `src/components/resume/__tests__/CoverLetterPDF.test.tsx` — PDF component renders correctly
- `src/app/api/cover-letter/__tests__/route.test.ts` — API: CRUD operations

---

## Implementation Order

1. Install `pdfjs-dist` dependency
2. Write `src/lib/linkedin-import.ts` (heuristic parser + tests)
3. Write `POST /api/import/linkedin` route + tests
4. Build LinkedIn import UI (button, file picker, preview dialog) + tests
5. Write migration `012_add_cover_letters.sql`
6. Write `CoverLetterPDF.tsx` component + tests
7. Add `generateCoverLetter()` to `src/lib/ai.ts` + tests
8. Write `POST /api/cover-letter`, `PUT`, `GET` routes + tests
9. Build `/resume/cover-letter` page + `CoverLetterClient.tsx` + tests

---

## Rejected Alternatives

- **LinkedIn scraping (profile URL):** Requires scraping infrastructure (puppeteer/playwright), LinkedIn actively blocks scrapers, profile visibility varies
- **LinkedIn API OAuth:** Requires LinkedIn Developer app approval process, API is heavily rate-limited for profile data
- **DOCX export and Skills Gap Analyzer:** Deferred to later phase
