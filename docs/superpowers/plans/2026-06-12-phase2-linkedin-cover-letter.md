# Phase 2: LinkedIn Import & Cover Letter Generator — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add LinkedIn PDF resume import and cover letter generation to the resume builder.

**Architecture:** LinkedIn import uses client-side PDF text extraction (`pdfjs-dist`) sent to a heuristic parser API (with AI fallback). Cover letters use a new DB table, reuse the existing AI module, and render via `@react-pdf/renderer`. Both features are independent — no shared state.

**Tech Stack:** Next.js 16, Supabase, Zod v4, `pdfjs-dist`, `@react-pdf/renderer`, Vitest

---

## Task 1: Install pdfjs-dist + Write LinkedIn Import Parser

**Files:**
- Modify: `package.json`
- Create: `src/lib/linkedin-import.ts`
- Create: `src/lib/__tests__/linkedin-import.test.ts`

- [ ] **Step 1: Install pdfjs-dist**

```bash
npm install pdfjs-dist
```

Expected: package.json updated with pdfjs-dist dependency.

- [ ] **Step 2: Write failing tests for the parser**

```ts
// src/lib/__tests__/linkedin-import.test.ts
import { describe, it, expect } from 'vitest'
import { parseLinkedInText } from '../linkedin-import'

const mockLinkedInText = `
Summary
Experienced software engineer with 5 years building scalable systems.

Experience
Software Engineer
Acme Corp
Jan 2020 - Present
- Built scalable microservices using Node.js
- Led team of 3 engineers
- Reduced API latency by 40%

Senior Developer
Tech Corp
Jun 2017 - Dec 2019
- Architected cloud infrastructure
- Migrated 50+ services to AWS

Education
Master of Science
Computer Science
Stanford University
2015 - 2017

Bachelor of Science
Computer Engineering
MIT
2011 - 2015

Skills
JavaScript, TypeScript, React, Node.js, Python, AWS, Docker

Projects
Portfolio Optimizer
Built a real-time portfolio tracking dashboard
React, D3.js, Node.js

Certifications
AWS Solutions Architect
Amazon
2023
`

describe('parseLinkedInText', () => {
  it('extracts summary from LinkedIn text', () => {
    const result = parseLinkedInText(mockLinkedInText)
    expect(result.data.summary).toContain('Experienced software engineer')
  })

  it('extracts experience entries with correct fields', () => {
    const result = parseLinkedInText(mockLinkedInText)
    expect(result.data.experience.length).toBe(2)
    expect(result.data.experience[0].company).toBe('Acme Corp')
    expect(result.data.experience[0].role).toBe('Software Engineer')
    expect(result.data.experience[0].start_date).toBe('Jan 2020')
    expect(result.data.experience[0].end_date).toBe('Present')
    expect(result.data.experience[0].bullets).toContain('Built scalable microservices using Node.js')
  })

  it('extracts education entries', () => {
    const result = parseLinkedInText(mockLinkedInText)
    expect(result.data.education.length).toBe(2)
    expect(result.data.education[0].institution).toBe('Stanford University')
    expect(result.data.education[0].degree).toBe('Master of Science')
    expect(result.data.education[0].field).toBe('Computer Science')
  })

  it('extracts skills', () => {
    const result = parseLinkedInText(mockLinkedInText)
    expect(result.data.skills).toContain('JavaScript')
    expect(result.data.skills).toContain('TypeScript')
  })

  it('extracts projects', () => {
    const result = parseLinkedInText(mockLinkedInText)
    expect(result.data.projects.length).toBeGreaterThanOrEqual(1)
    expect(result.data.projects[0].name).toBe('Portfolio Optimizer')
  })

  it('extracts certificates', () => {
    const result = parseLinkedInText(mockLinkedInText)
    expect(result.data.certificates.length).toBeGreaterThanOrEqual(1)
    expect(result.data.certificates[0].name).toContain('AWS Solutions Architect')
  })

  it('returns confidence score between 0 and 1', () => {
    const result = parseLinkedInText('Some random text with no sections')
    expect(result.confidence).toBeGreaterThanOrEqual(0)
    expect(result.confidence).toBeLessThanOrEqual(1)
  })

  it('returns unmatched text for low-confidence sections', () => {
    const result = parseLinkedInText('Some random text with no sections')
    expect(result.unmatched).toBeDefined()
  })
})
```

- [ ] **Step 3: Run tests to verify they fail**

```bash
npx vitest run src/lib/__tests__/linkedin-import.test.ts 2>&1 | tail -20
```

Expected: FAIL — tests can't find `parseLinkedInText`

- [ ] **Step 4: Write the parser implementation**

```ts
// src/lib/linkedin-import.ts
import type { ResumeFormData } from '@/lib/resume'

export interface ParseResult {
  data: ResumeFormData
  confidence: number
  unmatched: string[]
  source: 'heuristic' | 'ai'
}

const SECTION_HEADINGS = [
  'Summary',
  'About',
  'Experience',
  'Education',
  'Skills',
  'Projects',
  'Certifications',
  'Licenses & Certifications',
]

function findSections(text: string): Map<string, string> {
  const sections = new Map<string, string>()
  const lines = text.split('\n')
  let currentSection = ''
  let currentContent: string[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    const heading = SECTION_HEADINGS.find(
      (h) => trimmed.toLowerCase() === h.toLowerCase()
    )
    if (heading) {
      if (currentSection && currentContent.length > 0) {
        sections.set(currentSection, currentContent.join('\n').trim())
      }
      currentSection = heading
      currentContent = []
    } else if (currentSection && trimmed) {
      currentContent.push(trimmed)
    }
  }
  if (currentSection && currentContent.length > 0) {
    sections.set(currentSection, currentContent.join('\n').trim())
  }
  return sections
}

function parseExperience(text: string) {
  const entries: ResumeFormData['experience'] = []
  const blocks = text.split('\n\n').filter((b) => b.trim())

  let i = 0
  while (i < blocks.length) {
    const roleLine = blocks[i].trim()
    if (i + 1 < blocks.length) {
      const companyLine = blocks[i + 1].trim()
      if (i + 2 < blocks.length && /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i.test(blocks[i + 2])) {
        const dateLine = blocks[i + 2].trim()
        const dateMatch = dateLine.match(/^(.+?)\s*[-–—]\s*(.+)$/)
        const startDate = dateMatch ? dateMatch[1].trim() : dateLine
        const endDate = dateMatch ? dateMatch[2].trim() : ''

        let bullets: string[] = []
        let j = i + 3
        while (j < blocks.length) {
          const bulletBlock = blocks[j].trim()
          if (bulletBlock.startsWith('•') || bulletBlock.startsWith('-') || bulletBlock.startsWith('*')) {
            bullets.push(bulletBlock.replace(/^[•\-*]\s*/, ''))
            j++
          } else if (bullets.length > 0 && !SECTION_HEADINGS.some((h) => bulletBlock.toLowerCase().startsWith(h.toLowerCase()))) {
            bullets.push(bulletBlock)
            j++
          } else {
            break
          }
        }

        entries.push({
          company: companyLine,
          role: roleLine,
          start_date: startDate,
          end_date: endDate || null,
          bullets,
        })
        i = j
        continue
      }
    }
    i++
  }
  return entries
}

function parseEducation(text: string) {
  const entries: ResumeFormData['education'] = []
  const blocks = text.split('\n\n').filter((b) => b.trim())

  let i = 0
  while (i < blocks.length) {
    const degreeLine = blocks[i].trim()
    if (i + 1 < blocks.length) {
      const fieldLine = blocks[i + 1].trim()
      if (i + 2 < blocks.length) {
        const institutionLine = blocks[i + 2].trim()
        let year = ''
        if (i + 3 < blocks.length && /\d{4}/.test(blocks[i + 3])) {
          year = blocks[i + 3].trim()
        }
        entries.push({
          institution: institutionLine,
          degree: degreeLine,
          field: fieldLine,
          year,
        })
        i = year ? i + 4 : i + 3
        continue
      }
    }
    i++
  }
  return entries
}

function parseSkills(text: string): string[] {
  return text
    .split(/[,•\n]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

function parseProjects(text: string) {
  const entries: ResumeFormData['projects'] = []
  const blocks = text.split('\n\n').filter((b) => b.trim())

  for (const block of blocks) {
    const lines = block.split('\n').filter((l) => l.trim())
    if (lines.length >= 1) {
      const name = lines[0].trim()
      const desc = lines.slice(1).find((l) => l.length > 30) || ''
      const tech = lines.find((l) => /^[A-Z][a-z]+[,;]/.test(l.trim())) || ''
      entries.push({
        name,
        description: desc,
        tech_stack: tech,
        url: '',
      })
    }
  }
  return entries
}

function parseCertificates(text: string) {
  const entries: ResumeFormData['certificates'] = []
  const lines = text.split('\n').filter((l) => l.trim())

  for (let i = 0; i < lines.length; i++) {
    const name = lines[i].trim()
    if (name.length < 3) continue
    const issuer = i + 1 < lines.length ? lines[i + 1].trim() : ''
    const date = i + 2 < lines.length && /\d{4}/.test(lines[i + 2]) ? lines[i + 2].trim() : ''
    if (issuer) {
      entries.push({ name, issuer, date, url: '' })
      i += date ? 2 : 1
    }
  }
  return entries
}

export function parseLinkedInText(text: string): ParseResult {
  const sections = findSections(text)

  const summary = (sections.get('Summary') || sections.get('About') || '')
  const experienceText = sections.get('Experience') || ''
  const educationText = sections.get('Education') || ''
  const skillsText = sections.get('Skills') || ''
  const projectsText = sections.get('Projects') || ''
  const certText = sections.get('Certifications') || sections.get('Licenses & Certifications') || ''

  const experience = parseExperience(experienceText)
  const education = parseEducation(educationText)
  const skills = parseSkills(skillsText)
  const projects = parseProjects(projectsText)
  const certificates = parseCertificates(certText)

  const expectedSection = ['Summary', 'Experience', 'Education', 'Skills'].filter(
    (h) => sections.has(h) || sections.get('About')
  ).length + (sections.has('Projects') ? 1 : 0) + (sections.has('Certifications') || sections.has('Licenses & Certifications') ? 1 : 0)

  const parsedCount = [summary ? 1 : 0, experience.length > 0 ? 1 : 0, education.length > 0 ? 1 : 0, skills.length > 0 ? 1 : 0, projects.length > 0 ? 1 : 0, certificates.length > 0 ? 1 : 0].filter(Boolean).length

  const confidence = expectedSection > 0 ? parsedCount / expectedSection : 0

  const unmatched: string[] = []
  if (experienceText && experience.length === 0) unmatched.push('Experience')
  if (educationText && education.length === 0) unmatched.push('Education')

  return {
    data: {
      title: '',
      summary,
      experience,
      education,
      projects,
      skills,
      certificates,
    },
    confidence: Math.round(confidence * 100) / 100,
    unmatched,
    source: 'heuristic',
  }
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npx vitest run src/lib/__tests__/linkedin-import.test.ts 2>&1 | tail -10
```

Expected: ALL PASS

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src/lib/linkedin-import.ts src/lib/__tests__/linkedin-import.test.ts
git commit -m "feat: add LinkedIn PDF import parser"
```

---

## Task 2: LinkedIn Import API Route

**Files:**
- Create: `src/app/api/import/linkedin/route.ts`
- Create: `src/app/api/import/linkedin/__tests__/route.test.ts`

- [ ] **Step 1: Write the failing API test**

```ts
// src/app/api/import/linkedin/__tests__/route.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockParseLinkedInText = vi.hoisted(() => vi.fn())

vi.mock('@/lib/linkedin-import', () => ({
  parseLinkedInText: mockParseLinkedInText,
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }) },
  })),
}))

import { POST } from '../route'

describe('POST /api/import/linkedin', () => {
  beforeEach(() => {
    mockParseLinkedInText.mockReset()
  })

  it('returns 401 without auth', async () => {
    const { createClient } = await import('@/lib/supabase/server')
    ;(createClient as ReturnType<typeof vi.fn>).mockReturnValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
    })
    const req = new Request('http://localhost/api/import/linkedin', {
      method: 'POST',
      body: JSON.stringify({ text: 'some text' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('returns parsed data for valid text', async () => {
    mockParseLinkedInText.mockReturnValue({
      data: { summary: 'Engineer', experience: [], education: [], projects: [], skills: ['JS'], certificates: [] },
      confidence: 0.8,
      unmatched: [],
      source: 'heuristic',
    })
    const req = new Request('http://localhost/api/import/linkedin', {
      method: 'POST',
      body: JSON.stringify({ text: 'Summary\nEngineer' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.summary).toBe('Engineer')
    expect(body.confidence).toBe(0.8)
  })

  it('requires text field', async () => {
    const req = new Request('http://localhost/api/import/linkedin', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/app/api/import/linkedin/__tests__/route.test.ts 2>&1 | tail -10
```

Expected: FAIL (route module not found)

- [ ] **Step 3: Write the API route**

```ts
// src/app/api/import/linkedin/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { parseLinkedInText } from '@/lib/linkedin-import'
import { rateLimitByIp } from '@/lib/rate-limit'

export async function POST(request: Request) {
  const limit = rateLimitByIp(request, 10, 60_000)
  if (limit instanceof NextResponse) return limit

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    if (!body.text || typeof body.text !== 'string') {
      return NextResponse.json({ error: 'text field is required' }, { status: 400 })
    }

    const result = parseLinkedInText(body.text)

    return NextResponse.json(result)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    console.error('Import API error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/app/api/import/linkedin/__tests__/route.test.ts 2>&1 | tail -10
```

Expected: ALL PASS

- [ ] **Step 5 (optional): Add AI fallback for low-confidence parsing**

If the heuristic parser returns confidence < 0.7, fall back to AI parsing. Add a `parseResumeFromText` function to `ai.ts`:

```ts
// Add to src/lib/ai.ts (near other AI functions)
export async function parseResumeFromText(rawText: string): Promise<{
  summary: string
  experience: Array<{ company: string; role: string; start_date: string; end_date: string | null; bullets: string[] }>
  education: Array<{ institution: string; degree: string; field: string; year: string }>
  skills: string[]
} | null> {
  const config = getConfig()
  if (!config) return null

  const response = await fetch(config.apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        {
          role: 'system',
          content: `You are a resume parser. Given raw text extracted from a LinkedIn profile PDF, extract and return structured JSON with the following fields:
- summary: string (the professional summary/about section)
- experience: array of { company, role, start_date, end_date (null if current), bullets (array of strings) }
- education: array of { institution, degree, field, year }
- skills: array of strings

Return ONLY valid JSON, no other text.`,
        },
        { role: 'user', content: `Parse this LinkedIn profile text:\n\n${rawText.slice(0, 4000)}` },
      ],
      temperature: 0.1,
      max_tokens: 1000,
    }),
  })

  if (!response.ok) return null
  const data = await response.json()
  try {
    return JSON.parse(data.choices[0].message.content)
  } catch {
    return null
  }
}
```

Then update the API route to use the fallback:

```ts
// Modify POST in src/app/api/import/linkedin/route.ts
import { parseLinkedInText } from '@/lib/linkedin-import'
import { parseResumeFromText } from '@/lib/ai'

export async function POST(request: Request) {
  // ... auth check ...

  const body = await request.json()
  if (!body.text || typeof body.text !== 'string') {
    return NextResponse.json({ error: 'text field is required' }, { status: 400 })
  }

  let result = parseLinkedInText(body.text)

  if (result.confidence < 0.7) {
    const aiResult = await parseResumeFromText(body.text)
    if (aiResult) {
      result = {
        data: {
          title: '',
          summary: aiResult.summary || '',
          experience: aiResult.experience || [],
          education: aiResult.education || [],
          projects: [],
          skills: aiResult.skills || [],
          certificates: [],
        },
        confidence: 0.9,
        unmatched: [],
        source: 'ai',
      }
    }
  }

  return NextResponse.json(result)
}
```

- [ ] **Step 6: Commit**

```bash
git add src/app/api/import/linkedin/
git commit -m "feat: add LinkedIn import API route"
```

---

## Task 3: LinkedIn Import UI

**Files:**
- Create: `src/components/resume/LinkedInImport.tsx`
- Create: `src/components/resume/__tests__/LinkedInImport.test.tsx`

- [ ] **Step 1: Write the failing UI tests**

```ts
// src/components/resume/__tests__/LinkedInImport.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { LinkedInImport } from '../LinkedInImport'

const mockOnImport = vi.fn()

// Mock pdfjs-dist — returns empty text by default
vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: { workerSrc: '' },
  getDocument: vi.fn(() => ({
    promise: Promise.resolve({
      numPages: 1,
      getPage: vi.fn(() => ({
        getTextContent: vi.fn(() => ({
          items: [{ str: '' }],
        })),
      })),
    }),
  })),
}))

// Mock fetch for the API call
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('LinkedInImport', () => {
  afterEach(() => {
    mockFetch.mockReset()
  })

  it('renders import button', () => {
    render(<LinkedInImport onImport={mockOnImport} />)
    expect(screen.getByText('Import from LinkedIn')).toBeInTheDocument()
  })

  it('shows file picker on button click', () => {
    render(<LinkedInImport onImport={mockOnImport} />)
    const btn = screen.getByText('Import from LinkedIn')
    fireEvent.click(btn)
    // File input should be rendered and clicked — can't fully test file selection in jsdom
    // The dialog should now show "Select your LinkedIn PDF export"
    // We can verify the button click doesn't crash
    expect(screen.getByText('Import from LinkedIn')).toBeInTheDocument()
  })

  it('shows preview dialog after successful import', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          title: '',
          summary: 'Experienced engineer',
          experience: [{ company: 'Acme Corp', role: 'Engineer', start_date: '2020', end_date: 'Present', bullets: ['Built things'] }],
          education: [],
          projects: [],
          skills: ['JavaScript'],
          certificates: [],
        },
        confidence: 0.9,
        unmatched: [],
        source: 'heuristic' as const,
      }),
    })

    render(<LinkedInImport onImport={mockOnImport} />)

    // Trigger file selection with a mock File
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['fake pdf content'], 'profile.pdf', { type: 'application/pdf' })
    if (fileInput) {
      Object.defineProperty(fileInput, 'files', { value: [file] })
      fireEvent.change(fileInput)
    }

    // Wait for the preview dialog to show
    await waitFor(() => {
      expect(screen.getByText('Import Preview')).toBeInTheDocument()
    }, { timeout: 3000 })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/components/resume/__tests__/LinkedInImport.test.tsx 2>&1 | tail -10
```

Expected: FAIL (component not defined)

- [ ] **Step 3: Write the LinkedInImport component**

```tsx
// src/components/resume/LinkedInImport.tsx
'use client'

import { useCallback, useRef, useState } from 'react'
import type { ResumeFormData } from '@/lib/resume'

interface ImportPreview {
  data: ResumeFormData
  confidence: number
  unmatched: string[]
}

interface LinkedInImportProps {
  onImport: (data: ResumeFormData) => void
}

export function LinkedInImport({ onImport }: LinkedInImportProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<ImportPreview | null>(null)

  const handleFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== 'application/pdf') {
      setError('Please select a PDF file')
      return
    }

    setProcessing(true)
    setError(null)

    try {
      const pdfjs = await import('pdfjs-dist')
      pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

      const buffer = await file.arrayBuffer()
      const pdf = await pdfjs.getDocument({ data: buffer }).promise
      let fullText = ''

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const content = await page.getTextContent()
        fullText += content.items.map((item: { str: string }) => item.str).join(' ') + '\n'
      }

      const res = await fetch('/api/import/linkedin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: fullText }),
      })

      if (!res.ok) {
        setError('Failed to parse PDF. Please try again.')
        return
      }

      const result = await res.json()
      setPreview({
        data: result.data,
        confidence: result.confidence,
        unmatched: result.unmatched || [],
      })
    } catch {
      setError('Failed to process PDF. Please try again.')
    } finally {
      setProcessing(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }, [])

  const confirmImport = useCallback(() => {
    if (preview) {
      onImport(preview.data)
      setPreview(null)
    }
  }, [preview, onImport])

  const sectionCount = (data: ResumeFormData) => {
    let count = 0
    if (data.summary) count++
    if (data.experience.length > 0) count++
    if (data.education.length > 0) count++
    if (data.skills.length > 0) count++
    if (data.projects.length > 0) count++
    if (data.certificates.length > 0) count++
    return count
  }

  return (
    <div>
      <input
        ref={fileRef}
        type="file"
        accept=".pdf"
        className="hidden"
        onChange={handleFile}
      />
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={processing}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 disabled:opacity-50 transition-colors"
      >
        {processing ? (
          <>
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Processing...
          </>
        ) : (
          'Import from LinkedIn'
        )}
      </button>

      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}

      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Import Preview</h3>

            {preview.confidence < 0.7 && (
              <p className="text-sm text-amber-600 mb-3 bg-amber-50 px-3 py-2 rounded-lg">
                Low confidence parse — please review the detected fields carefully.
              </p>
            )}

            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Sections detected</span>
                <span className="font-medium">{sectionCount(preview.data)}</span>
              </div>
              {preview.data.summary && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="text-green-500">✓</span> Summary
                </div>
              )}
              {preview.data.experience.map((exp, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="text-green-500">✓</span> {exp.role} at {exp.company}
                </div>
              ))}
              {preview.data.education.map((edu, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="text-green-500">✓</span> {edu.degree} — {edu.institution}
                </div>
              ))}
              {preview.data.skills.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="text-green-500">✓</span> {preview.data.skills.length} skills
                </div>
              )}
              {preview.data.projects.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="text-green-500">✓</span> {preview.data.projects.length} projects
                </div>
              )}
              {preview.data.certificates.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="text-green-500">✓</span> {preview.data.certificates.length} certificates
                </div>
              )}
              {preview.unmatched.length > 0 && (
                <div className="mt-3 p-2 bg-amber-50 rounded text-sm text-amber-700">
                  <p className="font-medium mb-1">Unmatched sections:</p>
                  <ul className="list-disc pl-4">
                    {preview.unmatched.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 justify-end">
              <button
                type="button"
                onClick={() => setPreview(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmImport}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Apply Import
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/components/resume/__tests__/LinkedInImport.test.tsx 2>&1 | tail -10
```

Expected: ALL PASS

- [ ] **Step 5: Integrate button into ResumeClient.tsx** — add the import button in the header area

Add to `src/app/(protected)/resume/ResumeClient.tsx`:
- Import `LinkedInImport` alongside existing imports
- Add the `<LinkedInImport onImport={...} />` button next to the "Templates" button

The onImport handler should call `updateField` for each populated section.

```tsx
// Add import (near line 4):
import { LinkedInImport } from '@/components/resume/LinkedInImport'

// Add handler (near existing handler functions):
const handleLinkedInImport = useCallback((importedData: ResumeFormData) => {
  setData((prev) => ({
    ...prev,
    summary: importedData.summary || prev.summary,
    experience: importedData.experience.length > 0 ? importedData.experience : prev.experience,
    education: importedData.education.length > 0 ? importedData.education : prev.education,
    projects: importedData.projects.length > 0 ? importedData.projects : prev.projects,
    skills: importedData.skills.length > 0 ? importedData.skills : prev.skills,
    certificates: importedData.certificates.length > 0 ? importedData.certificates : prev.certificates,
  }))
  isDirtyRef.current = true
}, [])

// Add button next to Templates button (around line 353):
<LinkedInImport onImport={handleLinkedInImport} />
```

- [ ] **Step 6: Verify all existing tests still pass**

```bash
npx vitest run 2>&1 | tail -10
```

Expected: ALL PASS

- [ ] **Step 7: Commit**

```bash
git add src/components/resume/LinkedInImport.tsx src/components/resume/__tests__/LinkedInImport.test.tsx src/app/(protected)/resume/ResumeClient.tsx
git commit -m "feat: add LinkedIn import UI with preview dialog"
```

---

## Task 4: Cover Letter DB Migration + Type

**Files:**
- Create: `supabase/migrations/012_add_cover_letters.sql`
- Modify: `src/types/database.ts`

- [ ] **Step 1: Write the migration**

```sql
-- supabase/migrations/012_add_cover_letters.sql
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

CREATE INDEX idx_cover_letters_user_id ON cover_letters(user_id);
CREATE INDEX idx_cover_letters_created_at ON cover_letters(created_at DESC);
```

- [ ] **Step 2: Add CoverLetter type to database.ts**

Add after the `Booking` interface (before closing):

```ts
export interface CoverLetter {
  id: string
  user_id: string
  title: string
  content: string
  job_title: string
  company: string
  job_description: string
  resume_snapshot: Record<string, unknown> | null
  created_at: string
  updated_at: string
}
```

Also add a `cover_letters` entry to the `Database.Tables` interface (after `job_applications`):

```ts
cover_letters: {
  Row: CoverLetter
  Insert: Omit<CoverLetter, 'id' | 'created_at' | 'updated_at'>
  Update: Partial<Omit<CoverLetter, 'id' | 'user_id'>>
  Relationships: []
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit --skipLibCheck 2>&1 | grep -v '.next/dev'
```

Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/012_add_cover_letters.sql src/types/database.ts
git commit -m "feat: add cover_letters table and type"
```

---

## Task 5: Cover Letter PDF Component

**Files:**
- Create: `src/components/resume/CoverLetterPDF.tsx`
- Create: `src/components/resume/__tests__/CoverLetterPDF.test.tsx`

- [ ] **Step 1: Write failing tests**

```ts
// src/components/resume/__tests__/CoverLetterPDF.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockRegister = vi.hoisted(() => vi.fn())

vi.mock('@react-pdf/renderer', () => ({
  Document: ({ children }: { children: React.ReactNode }) => {
    const { jsx } = require('react/jsx-runtime')
    return jsx('div', { 'data-testid': 'pdf-document', children })
  },
  Page: ({ children, style }: { children: React.ReactNode; style?: object }) => {
    const { jsx } = require('react/jsx-runtime')
    return jsx('div', { 'data-testid': 'pdf-page', style, children })
  },
  View: ({ children, style }: { children: React.ReactNode; style?: object }) => {
    const { jsx } = require('react/jsx-runtime')
    return jsx('div', { 'data-testid': 'pdf-view', style, children })
  },
  Text: ({ children, style }: { children: React.ReactNode; style?: object }) => {
    const { jsx } = require('react/jsx-runtime')
    return jsx('span', { 'data-testid': 'pdf-text', style, children })
  },
  StyleSheet: { create: (styles: object) => styles },
}))

import { render, screen } from '@testing-library/react'
import { CoverLetterPDFDocument } from '../CoverLetterPDF'
import type { Profile } from '@/types/database'

const mockProfile: Profile = {
  id: '1',
  full_name: 'Jane Doe',
  email: 'jane@example.com',
  phone: '555-0100',
  linkedin: null,
  website: null,
  location: 'New York',
  role_title: 'Software Engineer',
  role: 'user',
  plan_tier: 'free',
  persona: 'professional',
  referral_code: null,
  referred_by: null,
  updated_at: '2024-01-01',
}

describe('CoverLetterPDFDocument', () => {
  it('renders sender info', () => {
    render(
      <CoverLetterPDFDocument
        profile={mockProfile}
        content="Dear Hiring Manager, I am excited to apply..."
        jobTitle="Software Engineer"
        company="Acme Corp"
      />
    )
    expect(screen.getByText('Jane Doe')).toBeInTheDocument()
    expect(screen.getByText(/jane@example.com/)).toBeInTheDocument()
  })

  it('renders cover letter body', () => {
    render(
      <CoverLetterPDFDocument
        profile={mockProfile}
        content="I am excited to apply for this position."
        jobTitle="Engineer"
        company="Acme Corp"
      />
    )
    expect(screen.getByText(/excited to apply/)).toBeInTheDocument()
  })

  it('renders recipient line', () => {
    render(
      <CoverLetterPDFDocument
        profile={mockProfile}
        content="Dear Hiring Manager,"
        jobTitle="Engineer"
        company="Acme Corp"
      />
    )
    expect(screen.getByText(/Acme Corp/)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/components/resume/__tests__/CoverLetterPDF.test.tsx 2>&1 | tail -10
```

Expected: FAIL

- [ ] **Step 3: Write the CoverLetterPDF component**

```tsx
// src/components/resume/CoverLetterPDF.tsx
'use client'

import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { Profile } from '@/types/database'

const styles = StyleSheet.create({
  page: {
    padding: 54,
    fontFamily: 'Helvetica',
    fontSize: 11,
    lineHeight: 1.6,
    color: '#1a1a1a',
  },
  header: {
    marginBottom: 24,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  contact: {
    fontSize: 9,
    color: '#555',
    marginBottom: 2,
  },
  date: {
    fontSize: 10,
    marginBottom: 12,
    color: '#555',
  },
  recipient: {
    fontSize: 10,
    marginBottom: 20,
  },
  body: {
    fontSize: 10,
    lineHeight: 1.7,
  },
  signature: {
    marginTop: 32,
    fontSize: 10,
  },
})

export function CoverLetterPDFDocument({
  profile,
  content,
  jobTitle,
  company,
}: {
  profile: Profile | null
  content: string
  jobTitle: string
  company: string
}) {
  const name = profile?.full_name || 'Applicant'
  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.name}>{name}</Text>
          {profile?.email && <Text style={styles.contact}>{profile.email}</Text>}
          {profile?.phone && <Text style={styles.contact}>{profile.phone}</Text>}
          {profile?.location && <Text style={styles.contact}>{profile.location}</Text>}
        </View>

        <Text style={styles.date}>{today}</Text>

        <View style={styles.recipient}>
          <Text>Hiring Manager</Text>
          <Text>{company}</Text>
        </View>

        <View style={styles.body}>
          {content.split('\n\n').map((paragraph, i) => (
            <Text key={i} style={{ marginBottom: 8 }}>{paragraph}</Text>
          ))}
        </View>

        <View style={styles.signature}>
          <Text>Sincerely,</Text>
          <Text>{name}</Text>
        </View>
      </Page>
    </Document>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/components/resume/__tests__/CoverLetterPDF.test.tsx 2>&1 | tail -10
```

Expected: ALL PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/resume/CoverLetterPDF.tsx src/components/resume/__tests__/CoverLetterPDF.test.tsx
git commit -m "feat: add CoverLetterPDF component"
```

---

## Task 6: Add generateCoverLetter to AI Module

**Files:**
- Modify: `src/lib/ai.ts`
- Modify: `src/lib/__tests__/ai.test.ts`

- [ ] **Step 1: Write failing tests**

Add to `src/lib/__tests__/ai.test.ts`:

```ts
import { generateCoverLetter } from '../ai'

describe('generateCoverLetter', () => {
  it('generates a cover letter from resume data and job description', async () => {
    const letter = await generateCoverLetter({
      resume: 'Experienced software engineer with 5 years in React and Node.js.',
      jobTitle: 'Senior Frontend Engineer',
      company: 'Tech Corp',
      jobDescription: 'We are looking for a senior frontend engineer with React expertise.',
    })
    expect(typeof letter).toBe('string')
    expect(letter.length).toBeGreaterThan(50)
    expect(letter).toContain('Tech Corp')
    expect(letter).toContain('Senior Frontend Engineer')
  })

  it('handles empty job description gracefully', async () => {
    const letter = await generateCoverLetter({
      resume: 'Entry-level developer.',
      jobTitle: 'Junior Developer',
      company: 'Startup Inc',
      jobDescription: '',
    })
    expect(typeof letter).toBe('string')
    expect(letter.length).toBeGreaterThan(50)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/lib/__tests__/ai.test.ts -t "generateCoverLetter" 2>&1 | tail -10
```

Expected: FAIL (function not exported)

- [ ] **Step 3: Add SYSTEM_PROMPT and function to ai.ts**

Add a new system prompt (after the existing `rewrite` prompt):

```ts
coverLetter: `You are an expert cover letter writer. Given a resume summary and a job description, generate a professional cover letter.

The cover letter should:
- Be 3-4 paragraphs
- Start with a compelling opening expressing interest in the role and company
- Highlight 2-3 key qualifications from the resume that match the job requirements
- Include specific skills and experience relevant to the position
- End with a confident closing and call to action
- Be written in first person
- Sound natural and professional, not like a template

Return ONLY the letter text, no other text.`,
```

Add the new function export:

```ts
export async function generateCoverLetter(params: {
  resume: string
  jobTitle: string
  company: string
  jobDescription: string
}): Promise<string> {
  const config = getConfig()
  if (!config) return generateFallbackCoverLetter(params)

  const response = await fetch(config.apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPTS.coverLetter },
        {
          role: 'user',
          content: `Resume: ${params.resume}\n\nJob Title: ${params.jobTitle}\nCompany: ${params.company}\n\nJob Description: ${params.jobDescription || 'No specific description provided.'}\n\nGenerate a professional cover letter.`,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    }),
  })

  if (!response.ok) return generateFallbackCoverLetter(params)

  const data = await response.json()
  return data.choices[0].message.content?.trim() ?? generateFallbackCoverLetter(params)
}
```

Add the fallback function:

```ts
function generateFallbackCoverLetter(params: {
  resume: string
  jobTitle: string
  company: string
  jobDescription: string
}): string {
  const date = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return `${date}

Dear Hiring Manager at ${params.company},

I am writing to express my strong interest in the ${params.jobTitle} position at ${params.company}. With my background in ${params.resume.slice(0, 100)}, I am confident that I would be a valuable addition to your team.

${params.jobDescription ? `Your requirement for a ${params.jobTitle} aligns perfectly with my experience. ${params.resume.slice(0, 150)} I am eager to bring these skills to ${params.company} and contribute to your continued success.` : `Based on my experience, I believe I am well-positioned to excel in this role and make meaningful contributions to ${params.company}'s team.`}

I am particularly drawn to ${params.company} because of your reputation for innovation and excellence in the industry. I would welcome the opportunity to discuss how my experience and skills can benefit your organization.

Thank you for considering my application. I look forward to the possibility of discussing this opportunity further.

Sincerely,
[Your Name]`
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/lib/__tests__/ai.test.ts 2>&1 | tail -10
```

Expected: ALL PASS (including existing bullet/summary/rewrite tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/ai.ts src/lib/__tests__/ai.test.ts
git commit -m "feat: add generateCoverLetter to AI module"
```

---

## Task 7: Cover Letter API Routes

**Files:**
- Create: `src/app/api/cover-letter/route.ts`
- Create: `src/app/api/cover-letter/__tests__/route.test.ts`

- [ ] **Step 1: Write failing API tests**

```ts
// src/app/api/cover-letter/__tests__/route.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGenerateCoverLetter = vi.hoisted(() => vi.fn())

vi.mock('@/lib/ai', () => ({
  generateCoverLetter: mockGenerateCoverLetter,
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }) },
  })),
}))

import { POST, GET, PUT } from '../route'

describe('POST /api/cover-letter', () => {
  beforeEach(() => {
    mockGenerateCoverLetter.mockReset()
  })

  it('returns 401 without auth', async () => {
    const { createClient } = await import('@/lib/supabase/server')
    ;(createClient as ReturnType<typeof vi.fn>).mockReturnValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
    })
    const req = new Request('http://localhost/api/cover-letter', {
      method: 'POST',
      body: JSON.stringify({ resume: 'test', jobTitle: 'Engineer', company: 'Acme' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('generates and returns a cover letter', async () => {
    mockGenerateCoverLetter.mockResolvedValue('Dear Hiring Manager, I am excited...')
    const req = new Request('http://localhost/api/cover-letter', {
      method: 'POST',
      body: JSON.stringify({
        resume: 'Experienced engineer.',
        jobTitle: 'Engineer',
        company: 'Acme Corp',
        jobDescription: 'Building great things.',
      }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.content).toContain('excited')
    expect(body.id).toBeDefined()
  })
})

describe('GET /api/cover-letter', () => {
  it('returns cover letters list', async () => {
    const req = new Request('http://localhost/api/cover-letter')
    const { createClient } = await import('@/lib/supabase/server')
    ;(createClient as ReturnType<typeof vi.fn>).mockReturnValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }) },
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              limit: vi.fn().mockResolvedValue({ data: [{ id: '1', title: 'Test', content: '...', job_title: 'Engineer', company: 'Acme', job_description: '', created_at: '2024-01-01', updated_at: '2024-01-01' }], error: null }),
            })),
          })),
        })),
      })),
    })
    const res = await GET(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
    expect(body[0].title).toBe('Test')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/app/api/cover-letter/__tests__/route.test.ts 2>&1 | tail -10
```

Expected: FAIL

- [ ] **Step 3: Write the API routes**

```ts
// src/app/api/cover-letter/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateCoverLetter } from '@/lib/ai'
import { rateLimitByIp } from '@/lib/rate-limit'

export async function GET(request: Request) {
  const limit = rateLimitByIp(request, 20, 60_000)
  if (limit instanceof NextResponse) return limit

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data, error } = await supabase
      .from('cover_letters')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    console.error('Cover letter GET error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const limit = rateLimitByIp(request, 10, 60_000)
  if (limit instanceof NextResponse) return limit

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    if (!body.jobTitle || !body.company) {
      return NextResponse.json({ error: 'jobTitle and company are required' }, { status: 400 })
    }

    const content = await generateCoverLetter({
      resume: body.resume || '',
      jobTitle: body.jobTitle,
      company: body.company,
      jobDescription: body.jobDescription || '',
    })

    const { data, error } = await supabase
      .from('cover_letters')
      .insert({
        user_id: user.id,
        title: `Cover Letter — ${body.company}`,
        content,
        job_title: body.jobTitle,
        company: body.company,
        job_description: body.jobDescription || '',
      })
      .select('*')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ id: data.id, content: data.content })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    console.error('Cover letter POST error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const limit = rateLimitByIp(request, 20, 60_000)
  if (limit instanceof NextResponse) return limit

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    const body = await request.json()
    if (!body.content) return NextResponse.json({ error: 'content is required' }, { status: 400 })

    const { data, error } = await supabase
      .from('cover_letters')
      .update({ content: body.content, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id)
      .select('*')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    console.error('Cover letter PUT error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/app/api/cover-letter/__tests__/route.test.ts 2>&1 | tail -10
```

Expected: ALL PASS

- [ ] **Step 5: Verify all tests still pass**

```bash
npx vitest run 2>&1 | tail -10
```

Expected: ALL PASS

- [ ] **Step 6: Commit**

```bash
git add src/app/api/cover-letter/
git commit -m "feat: add cover letter API routes"
```

---

## Task 8: Cover Letter Page + Client Component

**Files:**
- Create: `src/app/(protected)/resume/cover-letter/page.tsx`
- Create: `src/components/resume/CoverLetterClient.tsx`
- Create: `src/components/resume/__tests__/CoverLetterClient.test.tsx`

- [ ] **Step 1: Write the failing page and client component tests**

```ts
// src/components/resume/__tests__/CoverLetterClient.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFetch = vi.hoisted(() => vi.fn())
global.fetch = mockFetch

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CoverLetterClient } from '../CoverLetterClient'
import type { Profile } from '@/types/database'
import type { ResumeFormData } from '@/lib/resume'

const mockProfile: Profile = {
  id: '1', full_name: 'Jane Doe', email: 'jane@example.com', phone: '555-0100',
  linkedin: null, website: null, location: 'NY', role_title: 'Engineer',
  role: 'user', plan_tier: 'free', persona: 'professional',
  referral_code: null, referred_by: null, updated_at: '2024-01-01',
}

const mockData: ResumeFormData = {
  title: 'Test', summary: 'Engineer', experience: [],
  education: [], projects: [], skills: ['React'], certificates: [],
}

describe('CoverLetterClient', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  it('renders job details form', () => {
    render(<CoverLetterClient profile={mockProfile} resumeData={mockData} />)
    expect(screen.getByText('Cover Letter Generator')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('e.g. Senior Frontend Engineer')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('e.g. Tech Corp')).toBeInTheDocument()
  })

  it('generates a cover letter on button click', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: '1', content: 'Dear Hiring Manager, I am excited...' }),
    })

    render(<CoverLetterClient profile={mockProfile} resumeData={mockData} />)

    const titleInput = screen.getByPlaceholderText('e.g. Senior Frontend Engineer')
    fireEvent.change(titleInput, { target: { value: 'Engineer' } })

    const companyInput = screen.getByPlaceholderText('e.g. Tech Corp')
    fireEvent.change(companyInput, { target: { value: 'Acme Corp' } })

    const generateBtn = screen.getByText('Generate')
    fireEvent.click(generateBtn)

    await waitFor(() => {
      expect(screen.getByText(/Hiring Manager/)).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('shows download and save buttons after generation', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: '1', content: 'Dear Hiring Manager...' }),
    })

    render(<CoverLetterClient profile={mockProfile} resumeData={mockData} />)

    fireEvent.change(screen.getByPlaceholderText('e.g. Senior Frontend Engineer'), { target: { value: 'Engineer' } })
    fireEvent.change(screen.getByPlaceholderText('e.g. Tech Corp'), { target: { value: 'Acme Corp' } })
    fireEvent.click(screen.getByText('Generate'))

    await waitFor(() => {
      expect(screen.getByText('Download PDF')).toBeInTheDocument()
      expect(screen.getByText('Save')).toBeInTheDocument()
    }, { timeout: 3000 })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/components/resume/__tests__/CoverLetterClient.test.tsx 2>&1 | tail -10
```

Expected: FAIL

- [ ] **Step 3: Write the CoverLetterClient component**

```tsx
// src/components/resume/CoverLetterClient.tsx
'use client'

import { useCallback, useRef, useState } from 'react'
import type { Profile } from '@/types/database'
import type { ResumeFormData } from '@/lib/resume'

interface SavedLetter {
  id: string
  title: string
  content: string
  job_title: string
  company: string
  job_description: string
  created_at: string
  updated_at: string
}

interface CoverLetterClientProps {
  profile: Profile | null
  resumeData: ResumeFormData
}

export function CoverLetterClient({ profile, resumeData }: CoverLetterClientProps) {
  const [jobTitle, setJobTitle] = useState('')
  const [company, setCompany] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [content, setContent] = useState('')
  const [activeId, setActiveId] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [history, setHistory] = useState<SavedLetter[]>([])
  const [error, setError] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const loadedRef = useRef(false)

  const resumeSummary = [
    resumeData.summary,
    ...resumeData.experience.map((e) => `${e.role} at ${e.company}`),
    ...resumeData.skills,
  ].filter(Boolean).join('. ')

  const generate = useCallback(async () => {
    if (!jobTitle.trim() || !company.trim()) return
    setGenerating(true)
    setError(null)

    try {
      const res = await fetch('/api/cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resume: resumeSummary,
          jobTitle: jobTitle.trim(),
          company: company.trim(),
          jobDescription: jobDescription.trim(),
        }),
      })

      if (!res.ok) {
        setError('Failed to generate cover letter.')
        return
      }

      const data = await res.json()
      setContent(data.content)
      setActiveId(data.id)
      if (!loadedRef.current) {
        loadHistory()
        loadedRef.current = true
      }
    } catch {
      setError('Failed to generate cover letter.')
    } finally {
      setGenerating(false)
    }
  }, [jobTitle, company, jobDescription, resumeSummary])

  const save = useCallback(async () => {
    if (!activeId || !content.trim()) return
    setSaving(true)
    setError(null)

    try {
      const res = await fetch(`/api/cover-letter?id=${activeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })

      if (!res.ok) {
        setError('Failed to save cover letter.')
        return
      }

      loadHistory()
    } catch {
      setError('Failed to save cover letter.')
    } finally {
      setSaving(false)
    }
  }, [activeId, content])

  const loadHistory = useCallback(async () => {
    try {
      const res = await fetch('/api/cover-letter')
      if (res.ok) {
        const data = await res.json()
        setHistory(data)
      }
    } catch {
      // Silently fail — history loading is non-critical
    }
  }, [])

  const loadLetter = useCallback((letter: SavedLetter) => {
    setContent(letter.content)
    setActiveId(letter.id)
    setJobTitle(letter.job_title)
    setCompany(letter.company)
    setJobDescription(letter.job_description)
    setShowHistory(false)
  }, [])

  const downloadPDF = useCallback(async () => {
    try {
      const { CoverLetterPDFDocument } = await import('./CoverLetterPDF')
      const { pdf } = await import('@react-pdf/renderer')

      const blob = await pdf(
        <CoverLetterPDFDocument
          profile={profile}
          content={content}
          jobTitle={jobTitle}
          company={company}
        />
      ).toBlob()

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Cover_Letter_${company.replace(/\s+/g, '_')}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      setError('Failed to generate PDF.')
    }
  }, [profile, content, jobTitle, company])

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Cover Letter Generator</h1>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          {showHistory ? 'Hide History' : `History (${history.length})`}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
            <input
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="e.g. Senior Frontend Engineer"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
            <input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g. Tech Corp"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Job Description</label>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description here..."
              rows={6}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={generate}
              disabled={generating || !jobTitle.trim() || !company.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {generating ? 'Generating...' : 'Generate'}
            </button>
            {content && (
              <>
                <button
                  onClick={save}
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={downloadPDF}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Download PDF
                </button>
              </>
            )}
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          {showHistory && history.length > 0 && (
            <div className="border border-gray-200 rounded-lg divide-y divide-gray-200 max-h-64 overflow-y-auto">
              {history.map((letter) => (
                <button
                  key={letter.id}
                  onClick={() => loadLetter(letter)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <p className="text-sm font-medium text-gray-900">{letter.title}</p>
                  <p className="text-xs text-gray-500">
                    {letter.company} — {new Date(letter.created_at).toLocaleDateString()}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          {content ? (
            <div className="border border-gray-200 rounded-lg p-6 bg-white min-h-[400px] whitespace-pre-wrap text-sm text-gray-800 leading-relaxed font-serif">
              {content}
            </div>
          ) : (
            <div className="border border-gray-200 rounded-lg p-6 bg-gray-50 min-h-[400px] flex items-center justify-center text-sm text-gray-400">
              Fill in job details and click Generate to create your cover letter
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Write the page component**

```tsx
// src/app/(protected)/resume/cover-letter/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getResumes } from '@/lib/resume-server'
import { CoverLetterClient } from '@/components/resume/CoverLetterClient'

export default async function CoverLetterPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { profile } = await getProfile(supabase, user.id)
  const resumes = await getResumes()
  const latestResume = resumes[0]
  const { resumeToFormData } = await import('@/lib/resume')
  const resumeData = latestResume ? resumeToFormData(latestResume) : null

  return (
    <CoverLetterClient
      profile={profile}
      resumeData={resumeData ?? {
        title: '',
        summary: '',
        experience: [],
        education: [],
        projects: [],
        skills: [],
        certificates: [],
      }}
    />
  )
}

async function getProfile(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  return { profile }
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npx vitest run src/components/resume/__tests__/CoverLetterClient.test.tsx 2>&1 | tail -10
```

Expected: ALL PASS

- [ ] **Step 6: Verify all tests pass**

```bash
npx vitest run 2>&1 | tail -10
```

Expected: ALL PASS

- [ ] **Step 7: Verify TypeScript**

```bash
npx tsc --noEmit --skipLibCheck 2>&1 | grep -v '.next/dev'
```

Expected: No errors

- [ ] **Step 8: Commit**

```bash
git add src/app/(protected)/resume/cover-letter/ src/components/resume/CoverLetterClient.tsx src/components/resume/__tests__/CoverLetterClient.test.tsx
git commit -m "feat: add cover letter page with generation, editing, and download"
```
