# Kavya Career Coach Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a full-screen voice coaching session with Kavya, a warm AI career coach that helps users reflect, explore goals, and get a structured summary.

**Architecture:** Stateless API with phases (conversation → summary), same Edge TTS + SpeechRecognition stack as the existing interview feature. Premium-gated.

**Tech Stack:** Next.js App Router, Edge TTS (female voice), Web Speech API, callAI() from src/lib/ai.ts, lucide-react icons

---

### Task 1: Write tests for `src/lib/coach.ts`

**Files:**
- Create: `src/lib/__tests__/coach.test.ts`

- [ ] **Step 1: Write the test file**

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  getCoachingPrompt,
  getCoachingSummaryPrompt,
  parseCoachingResponse,
  handleCoachingTurn,
  handleCoachingSummary,
} from '../coach'

describe('getCoachingPrompt', () => {
  it('includes user context when provided', () => {
    const prompt = getCoachingPrompt('Senior engineer looking for PM role')
    expect(prompt).toContain('Senior engineer')
    expect(prompt).toContain('Kavya')
  })

  it('works without context', () => {
    const prompt = getCoachingPrompt('')
    expect(prompt).toContain('Kavya')
  })
})

describe('getCoachingSummaryPrompt', () => {
  it('asks for structured JSON output', () => {
    const prompt = getCoachingSummaryPrompt()
    expect(prompt).toContain('insights')
    expect(prompt).toContain('strengths')
    expect(prompt).toContain('nextSteps')
  })
})

describe('parseCoachingResponse', () => {
  it('detects complete signal', () => {
    const result = parseCoachingResponse('__COACHING_COMPLETE__')
    expect(result.type).toBe('complete')
  })

  it('detects question', () => {
    const result = parseCoachingResponse('What does success look like for you?')
    expect(result).toEqual({
      type: 'question',
      content: 'What does success look like for you?',
    })
  })

  it('preserves preceding content on complete', () => {
    const result = parseCoachingResponse('Good. __COACHING_COMPLETE__')
    expect(result.type).toBe('complete')
    expect(result.content).toContain('Good')
  })
})

describe('handleCoachingTurn', () => {
  it('returns error type when callAI returns null', async () => {
    const originalKey = process.env.AI_API_KEY
    delete process.env.AI_API_KEY

    const result = await handleCoachingTurn({ context: 'test', history: [] })
    expect(result.type).toBe('error')
    expect(result.content).toBeTruthy()

    process.env.AI_API_KEY = originalKey
  })
})

describe('handleCoachingSummary', () => {
  it('returns null when API key is not set', async () => {
    const originalKey = process.env.AI_API_KEY
    delete process.env.AI_API_KEY

    const result = await handleCoachingSummary({ context: 'test', history: [] })
    expect(result).toBeNull()

    process.env.AI_API_KEY = originalKey
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/__tests__/coach.test.ts 2>&1 || true`
Expected: FAIL — "Cannot find module '../coach'"

- [ ] **Step 3: Commit**

```bash
git add src/lib/__tests__/coach.test.ts
git commit -m "test: add failing tests for coach lib"
```

---

### Task 2: Implement `src/lib/coach.ts`

**Files:**
- Create: `src/lib/coach.ts`

- [ ] **Step 1: Write the coaching lib**

```typescript
import { callAI } from './ai'

interface Message {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface HistoryEntry {
  role: 'ai' | 'user'
  content: string
}

const COMPLETE_SIGNAL = '__COACHING_COMPLETE__'

export function getCoachingPrompt(context: string): string {
  return `You are Kavya, a warm, thoughtful, and calm female career coach. Your voice is gentle and supportive. You help people reflect on their career journey with curiosity and compassion.

Your goal is to guide a thoughtful conversation. Ask ONE question at a time. Listen to their answer and ask a follow-up that goes deeper. Cover these areas naturally as the conversation unfolds:
- Their current career situation and what brought them here
- What matters most to them in their work (values, motivations)
- Their strengths and what they're proud of
- What doubts or fears they're sitting with
- What they envision for their future
- How their job search is going, and where they feel stuck
- How they can use the tools available (resume builder, skill gap analysis, job tracker, mock interviews) to move forward

Adapt to whatever they share. Don't rush. Don't lecture. Be present.

When you feel you have enough understanding to offer meaningful guidance, respond with exactly: ${COMPLETE_SIGNAL} followed by a brief, warm closing message.

${context ? `\nThe user shared this about themselves:\n${context}` : ''}`
}

export function getCoachingSummaryPrompt(): string {
  return `You are Kavya, a warm career coach summarizing a coaching conversation.

Return a JSON object with these exact fields:
- insights: string[] (3-5 key realizations or themes that emerged from the conversation)
- strengths: string[] (2-4 strengths the person identified or demonstrated)
- blindSpots: string[] (2-3 areas they could explore further or patterns worth noticing)
- nextSteps: string[] (3-4 actionable suggestions, including how MyCareerDock tools can help)

Be warm, specific, and insightful. Base everything on the actual conversation.

Return ONLY valid JSON, no other text.`
}

export function parseCoachingResponse(content: string): { type: 'question' | 'complete' | 'error'; content?: string } {
  if (content.includes(COMPLETE_SIGNAL)) {
    const remaining = content.replace(COMPLETE_SIGNAL, '').trim()
    return { type: 'complete', content: remaining || undefined }
  }
  return { type: 'question', content }
}

export async function handleCoachingTurn(params: {
  context: string
  history: HistoryEntry[]
}): Promise<{ type: 'question' | 'complete' | 'error'; content?: string }> {
  const messages: Message[] = [
    { role: 'system', content: getCoachingPrompt(params.context) },
  ]

  for (const entry of params.history) {
    messages.push({ role: entry.role === 'ai' ? 'assistant' : 'user', content: entry.content })
  }

  if (messages.length === 1) {
    messages.push({ role: 'user', content: 'I\'m ready to begin our coaching conversation.' })
  }

  const response = await callAI(messages, 0.7, 800)
  if (!response) return { type: 'error', content: 'AI service unavailable. Please try again.' }
  return parseCoachingResponse(response)
}

export async function handleCoachingSummary(params: {
  context: string
  history: HistoryEntry[]
}): Promise<{
  insights: string[]
  strengths: string[]
  blindSpots: string[]
  nextSteps: string[]
} | null> {
  const transcript = params.history
    .map((h) => `${h.role === 'ai' ? 'Kavya' : 'User'}: ${h.content}`)
    .join('\n')

  const messages: Message[] = [
    { role: 'system', content: getCoachingSummaryPrompt() },
    {
      role: 'user',
      content: `Context: ${params.context || 'No additional context'}\n\nConversation:\n${transcript}\n\nGenerate the coaching summary.`,
    },
  ]

  const response = await callAI(messages, 0.3, 1000)
  if (!response) return null

  return extractCoachingJson(response)
}

function extractCoachingJson(text: string): {
  insights: string[]
  strengths: string[]
  blindSpots: string[]
  nextSteps: string[]
} | null {
  const jsonBlock = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  const target = jsonBlock ? jsonBlock[1] : text

  try {
    const parsed = JSON.parse(target)
    return {
      insights: Array.isArray(parsed.insights) ? parsed.insights : [],
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      blindSpots: Array.isArray(parsed.blindSpots) ? parsed.blindSpots : [],
      nextSteps: Array.isArray(parsed.nextSteps) ? parsed.nextSteps : [],
    }
  } catch {
    const braceMatch = target.match(/\{[\s\S]*\}/)
    if (!braceMatch) return null
    const cleaned = braceMatch[0].replace(/,\s*}/g, '}').replace(/,\s*]/g, ']')
    try {
      const parsed = JSON.parse(cleaned)
      return {
        insights: Array.isArray(parsed.insights) ? parsed.insights : [],
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
        blindSpots: Array.isArray(parsed.blindSpots) ? parsed.blindSpots : [],
        nextSteps: Array.isArray(parsed.nextSteps) ? parsed.nextSteps : [],
      }
    } catch {
      return null
    }
  }
}
```

- [ ] **Step 2: Run tests to verify they pass**

Run: `npx vitest run src/lib/__tests__/coach.test.ts`
Expected: PASS (all tests green)

- [ ] **Step 3: Commit**

```bash
git add src/lib/coach.ts src/lib/__tests__/coach.test.ts
git commit -m "feat: add coaching lib with prompts and AI handlers"
```

---

### Task 3: Write test for API route, then implement `src/app/api/career-coach/route.ts`

**Files:**
- Create: `src/app/api/career-coach/route.ts`
- Create: `src/app/api/career-coach/__tests__/route.test.ts`

- [ ] **Step 1: Write the API route test**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGetUser = vi.fn()
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: mockGetUser },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: { plan_tier: 'premium' },
            error: null,
          })),
        })),
      })),
    })),
  })),
}))

vi.mock('@/lib/coach', () => ({
  handleCoachingTurn: vi.fn(),
  handleCoachingSummary: vi.fn(),
}))

import { POST } from '../route'
import { handleCoachingTurn, handleCoachingSummary } from '@/lib/coach'

describe('POST /api/career-coach', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: { id: 'test-user' } }, error: null })
  })

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null })
    const req = new Request('http://localhost/api/career-coach', {
      method: 'POST',
      body: JSON.stringify({ phase: 'conversation', context: '', history: [] }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(401)
  })

  it('returns 400 for missing fields', async () => {
    const req = new Request('http://localhost/api/career-coach', {
      method: 'POST',
      body: JSON.stringify({}),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(400)
  })

  it('handles conversation phase', async () => {
    vi.mocked(handleCoachingTurn).mockResolvedValue({ type: 'question', content: 'Tell me about yourself.' })
    const req = new Request('http://localhost/api/career-coach', {
      method: 'POST',
      body: JSON.stringify({ phase: 'conversation', context: '', history: [] }),
    })
    const res = await POST(req as any)
    const data = await res.json()
    expect(data.type).toBe('question')
    expect(data.content).toBe('Tell me about yourself.')
  })

  it('handles summary phase', async () => {
    vi.mocked(handleCoachingSummary).mockResolvedValue({
      insights: ['You value growth'],
      strengths: ['Communication'],
      blindSpots: ['Work-life balance'],
      nextSteps: ['Update resume'],
    })
    const req = new Request('http://localhost/api/career-coach', {
      method: 'POST',
      body: JSON.stringify({ phase: 'summary', context: '', history: [] }),
    })
    const res = await POST(req as any)
    const data = await res.json()
    expect(data.insights).toEqual(['You value growth'])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/app/api/career-coach/__tests__/route.test.ts 2>&1 || true`
Expected: FAIL

- [ ] **Step 3: Implement the API route**

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { handleCoachingTurn, handleCoachingSummary } from '@/lib/coach'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('plan_tier')
      .eq('id', user.id)
      .single()

    const planTier = (profile?.plan_tier as string) || 'free'
    if (planTier !== 'premium' && planTier !== 'premium_pro') {
      return NextResponse.json(
        { error: 'Career Coach is available on Premium and Premium Pro plans. Upgrade to access.' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { phase, context, history } = body

    if (phase !== 'conversation' && phase !== 'summary') {
      return NextResponse.json({ error: 'Invalid phase' }, { status: 400 })
    }

    if (typeof context !== 'string' || !Array.isArray(history)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (phase === 'conversation') {
      const result = await handleCoachingTurn({ context, history })
      return NextResponse.json(result)
    }

    if (phase === 'summary') {
      const result = await handleCoachingSummary({ context, history })
      if (!result) {
        return NextResponse.json({ error: 'Summary generation failed' }, { status: 500 })
      }
      return NextResponse.json(result)
    }

    return NextResponse.json({ error: 'Invalid phase' }, { status: 400 })
  } catch (e) {
    console.error('Career Coach API error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/app/api/career-coach/__tests__/route.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/api/career-coach/route.ts src/app/api/career-coach/__tests__/route.test.ts
git commit -m "feat: add career coach API route"
```

---

### Task 4: Implement `src/components/coach/CoachSummary.tsx`

**Files:**
- Create: `src/components/coach/CoachSummary.tsx`

- [ ] **Step 1: Write the CoachSummary component**

```typescript
'use client'

interface CoachingSummary {
  insights: string[]
  strengths: string[]
  blindSpots: string[]
  nextSteps: string[]
}

export function CoachSummary({ summary }: { summary: CoachingSummary }) {
  const textContent = [
    '=== Kavya Coaching Summary ===',
    '',
    '--- Insights ---',
    ...summary.insights.map((s) => `• ${s}`),
    '',
    '--- Strengths ---',
    ...summary.strengths.map((s) => `• ${s}`),
    '',
    '--- Areas to Explore ---',
    ...summary.blindSpots.map((s) => `• ${s}`),
    '',
    '--- Next Steps ---',
    ...summary.nextSteps.map((s) => `• ${s}`),
    '',
    'Powered by MyCareerDock — Kavya Career Coach',
  ].join('\n')

  const copyToClipboard = () => {
    navigator.clipboard.writeText(textContent)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
          Your Coaching Summary
        </h1>
        <p className="text-[var(--text-secondary)]">
          Here is what emerged from our conversation. Take a moment to reflect on these insights.
        </p>
      </div>

      <div className="space-y-6">
        <Section title="Insights" color="var(--accent)" items={summary.insights} />
        <Section title="Strengths" color="#0E833E" items={summary.strengths} />
        <Section title="Areas to Explore" color="#D97706" items={summary.blindSpots} />
        <Section title="Next Steps" color="#0052FF" items={summary.nextSteps} />
      </div>

      <div className="flex gap-3">
        <button
          onClick={copyToClipboard}
          className="px-4 py-2 text-sm font-medium text-white rounded-lg"
          style={{ backgroundColor: 'var(--accent)' }}
        >
          Copy Summary
        </button>
      </div>

      <p className="text-sm text-[var(--text-tertiary)]">
        Come back anytime for another conversation. Your journey evolves, and Kavya will be here.
      </p>
    </div>
  )
}

function Section({ title, color, items }: { title: string; color: string; items: string[] }) {
  if (items.length === 0) return null

  return (
    <div className="rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] p-5">
      <h3 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color }}>
        {title}
      </h3>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-[var(--text-primary)]">
            <span className="mt-0.5 flex-shrink-0" style={{ color }}>•</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/coach/CoachSummary.tsx
git commit -m "feat: add CoachSummary component"
```

---

### Task 5: Implement `src/components/coach/KavyaClient.tsx`

**Files:**
- Create: `src/components/coach/KavyaClient.tsx`

- [ ] **Step 1: Write the KavyaClient component**

```typescript
'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { CoachSummary } from './CoachSummary'

interface HistoryEntry {
  role: 'ai' | 'user'
  content: string
}

interface CoachingSummary {
  insights: string[]
  strengths: string[]
  blindSpots: string[]
  nextSteps: string[]
}

type Phase = 'setup' | 'session' | 'summary'

function Avatar({ speaking, listening }: { speaking: boolean; listening: boolean }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl transition-all duration-500
          ${speaking ? 'shadow-lg' : ''}`}
        style={{
          backgroundColor: speaking ? 'rgba(0, 82, 255, 0.15)' : 'rgba(0, 82, 255, 0.08)',
          boxShadow: speaking ? '0 0 30px rgba(0, 82, 255, 0.2)' : 'none',
        }}
      >
        <span className={speaking ? 'animate-pulse' : ''}>🌸</span>
      </div>
      <p className={`text-sm font-medium transition-colors duration-300 ${speaking ? 'text-[var(--accent)]' : 'text-[var(--text-tertiary)]'}`}>
        {speaking ? 'Kavya is speaking...' : listening ? 'Listening...' : 'Kavya'}
      </p>
    </div>
  )
}

export function KavyaClient() {
  const [phase, setPhase] = useState<Phase>('setup')
  const [context, setContext] = useState('')
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [currentQuestion, setCurrentQuestion] = useState('')
  const [transcript, setTranscript] = useState('')
  const [interim, setInterim] = useState('')
  const [summary, setSummary] = useState<CoachingSummary | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [aiSpeaking, setAiSpeaking] = useState(false)
  const [listening, setListening] = useState(false)

  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const historyRef = useRef(history)
  const contextRef = useRef(context)
  const transcriptRef = useRef(transcript)
  const recognitionActiveRef = useRef(false)
  const audioContextRef = useRef<AudioContext | null>(null)
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null)
  const finishedRef = useRef(false)

  useEffect(() => { historyRef.current = history }, [history])
  useEffect(() => { contextRef.current = context }, [context])
  useEffect(() => { transcriptRef.current = transcript }, [transcript])

  const cleanup = useCallback(() => {
    if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop() } catch {}
      recognitionRef.current = null
    }
    recognitionActiveRef.current = false
    if (sourceNodeRef.current) {
      try { sourceNodeRef.current.stop() } catch {}
      sourceNodeRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => cleanup()
  }, [cleanup])

  const speak = useCallback(async (text: string): Promise<void> => {
    if (!voiceEnabled) return
    if (sourceNodeRef.current) {
      try { sourceNodeRef.current.stop() } catch {}
      sourceNodeRef.current = null
    }
    if (!audioContextRef.current) return
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume()
    }
    setAiSpeaking(true)
    setListening(false)
    try {
      const res = await fetch(`/api/tts?text=${encodeURIComponent(text)}`)
      if (!res.ok) throw new Error('TTS API error')
      const arrayBuffer = await res.arrayBuffer()
      const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer)
      const source = audioContextRef.current.createBufferSource()
      sourceNodeRef.current = source
      source.buffer = audioBuffer
      source.connect(audioContextRef.current.destination)
      source.start(0)
      await new Promise<void>((resolve) => {
        const timeout = setTimeout(() => resolve(), 30000)
        source.onended = () => { clearTimeout(timeout); resolve() }
      })
      if (sourceNodeRef.current === source) sourceNodeRef.current = null
    } catch (e) {
      console.error('TTS error:', e)
    }
    setAiSpeaking(false)
  }, [voiceEnabled])

  const startListening = useCallback(() => {
    if (recognitionActiveRef.current) return
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognitionAPI) return

    const recognition = new SpeechRecognitionAPI()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      if (!recognitionActiveRef.current) return
      let final = ''
      let interimText = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          final += t
        } else {
          interimText += t
        }
      }
      if (final) setTranscript((prev) => (prev ? prev + ' ' + final.trim() : final.trim()))
      setInterim(interimText)

      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = setTimeout(() => {
        if (!recognitionActiveRef.current) return
        const full = (transcriptRef.current + ' ' + final).trim()
        if (full) submitAnswer(full)
      }, 1500)
    }

    recognition.onerror = () => {
      recognitionActiveRef.current = false
      setListening(false)
    }

    recognitionRef.current = recognition
    recognitionActiveRef.current = true
    setListening(true)
    recognition.start()
  }, [])

  const stopListening = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop() } catch {}
      recognitionRef.current = null
    }
    recognitionActiveRef.current = false
    setListening(false)
  }, [])

  const submitAnswer = useCallback(async (text: string) => {
    stopListening()
    setInterim('')

    const hist = [...historyRef.current, { role: 'user' as const, content: text }]
    setHistory(hist)
    setTranscript('')

    try {
      const res = await fetch('/api/career-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phase: 'conversation', context: contextRef.current, history: hist }),
      })

      if (!res.ok) { setError('Connection lost. Please try again.'); setPhase('setup'); return }

      const data = await res.json()
      if (data.type === 'error') { setError(data.content); setPhase('setup'); return }
      if (data.type === 'complete') {
        generateSummary(hist)
      } else {
        const question = data.content || ''
        setCurrentQuestion(question)
        setHistory([...hist, { role: 'ai', content: question }])
        await speak(question)
        startListening()
      }
    } catch {
      setError('Connection lost.')
      setPhase('setup')
    }
  }, [speak, startListening, stopListening])

  const generateSummary = useCallback(async (hist: HistoryEntry[]) => {
    if (finishedRef.current) return
    finishedRef.current = true
    stopListening()

    try {
      const res = await fetch('/api/career-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phase: 'summary', context: contextRef.current, history: hist }),
      })
      if (!res.ok) { setError('Failed to generate summary.'); return }
      setSummary(await res.json())
      setPhase('summary')
    } catch {
      setError('Failed to generate summary.')
    }
  }, [stopListening])

  const startSession = async () => {
    if (typeof AudioContext !== 'undefined' && !audioContextRef.current) {
      audioContextRef.current = new AudioContext()
    }
    setError(null)
    finishedRef.current = false

    try {
      const res = await fetch('/api/career-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phase: 'conversation', context, history: [] }),
      })

      if (!res.ok) { setError('Failed to start.'); return }

      const data = await res.json()
      if (data.type === 'error') { setError(data.content); return }
      if (data.type === 'complete') { setError('Session ended immediately.'); return }

      const question = data.content || ''
      setCurrentQuestion(question)
      setHistory([{ role: 'ai', content: question }])
      setTranscript('')
      setInterim('')
      setPhase('session')

      await speak(question)
      startListening()
    } catch {
      setError('Failed to start.')
    }
  }

  const endSession = () => {
    cleanup()
    setPhase('setup')
    setError(null)
  }

  // Setup phase
  if (phase === 'setup') {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <div className="text-center mb-8">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-2xl mx-auto mb-4"
            style={{ backgroundColor: 'rgba(0, 82, 255, 0.1)' }}
          >
            🌸
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Kavya</h1>
          <p className="text-[var(--text-secondary)]">
            Your calm and thoughtful career coach. A gentle conversation to help you reflect, gain clarity, and move forward with purpose.
          </p>
        </div>

        <div className="space-y-4 mb-8">
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
              What brings you here? <span className="text-[var(--text-tertiary)]">(optional)</span>
            </label>
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Your current role, what you're working toward, or anything you'd like to explore..."
              rows={4}
              className="w-full rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] resize-none"
            />
          </div>

          <button
            onClick={startSession}
            className="w-full px-6 py-3 text-sm font-medium text-white rounded-xl transition-opacity hover:opacity-90"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            Begin Conversation
          </button>

          {error && <p className="text-sm text-red-500 text-center">{error}</p>}
        </div>
      </div>
    )
  }

  // Conversation phase
  if (phase === 'session') {
    const displayText = currentQuestion
      ? currentQuestion
      : (transcript
        ? transcript + (interim ? ' ' + interim : '')
        : interim || '')

    return (
      <div className="fixed inset-0 flex flex-col" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <Avatar speaking={aiSpeaking} listening={listening} />

          <div className="mt-8 max-w-xl text-center">
            <p
              className="text-lg leading-relaxed transition-all duration-300"
              style={{
                color: aiSpeaking ? 'var(--accent)' : 'var(--text-primary)',
                opacity: displayText ? 1 : 0.5,
              }}
            >
              {aiSpeaking
                ? currentQuestion || 'Kavya is gathering her thoughts...'
                : listening
                  ? displayText || 'Listening...'
                  : currentQuestion || '...'}
            </p>
          </div>
        </div>

        <div className="px-6 py-5 flex items-center justify-center gap-6" style={{ borderTop: '1px solid var(--glass-border)' }}>
          <button
            onClick={endSession}
            className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
          >
            End Session
          </button>

          <button
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              voiceEnabled
                ? 'text-white'
                : 'text-[var(--text-secondary)] border border-[var(--glass-border)]'
            }`}
            style={voiceEnabled ? { backgroundColor: 'var(--accent)' } : {}}
          >
            {voiceEnabled ? 'Voice On' : 'Voice Off'}
          </button>
        </div>
      </div>
    )
  }

  // Summary phase
  if (phase === 'summary') {
    if (!summary) {
      return (
        <div className="max-w-2xl mx-auto py-8 px-4">
          <p className="text-red-500">{error || 'Summary unavailable.'}</p>
          <button onClick={() => { setPhase('setup'); setError(null); setSummary(null) }} className="text-[var(--accent)] underline mt-4">
            Start a new session
          </button>
        </div>
      )
    }

    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <CoachSummary summary={summary} />
        <div className="mt-8 text-center">
          <button
            onClick={() => { setPhase('setup'); setSummary(null); setHistory([]); setTranscript(''); finishedRef.current = false; cleanup() }}
            className="px-4 py-2 text-sm font-medium text-white rounded-lg"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            New Session
          </button>
        </div>
      </div>
    )
  }

  return null
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/coach/KavyaClient.tsx
git commit -m "feat: add KavyaClient voice coaching component"
```

---

### Task 6: Implement route page and sidebar entry

**Files:**
- Create: `src/app/(protected)/career-coach/page.tsx`
- Modify: `src/components/layout/Sidebar.tsx`

- [ ] **Step 1: Create the route page**

```typescript
import { PremiumGate } from '@/components/ui/PremiumGate'
import { KavyaClient } from '@/components/coach/KavyaClient'

export default function CareerCoachPage() {
  return (
    <PremiumGate feature="Career Coach">
      <KavyaClient />
    </PremiumGate>
  )
}
```

- [ ] **Step 2: Add nav item to sidebar**

Edit `src/components/layout/Sidebar.tsx`:

In the imports, add `Sparkles`:
```typescript
import {
  Briefcase,
  ChevronLeft,
  CreditCard,
  Globe,
  LayoutDashboard,
  Lock,
  LogOut,
  Menu,
  MessageSquare,
  ScrollText,
  Search,
  Settings,
  Shield,
  Sparkles,
  Users,
  X,
} from 'lucide-react'
```

In the `navItems` array, add after the interview entry:
```typescript
{ href: '/career-coach', label: 'Career Coach', icon: Sparkles, premium: true },
```

- [ ] **Step 3: Commit**

```bash
git add src/app/(protected)/career-coach/page.tsx src/components/layout/Sidebar.tsx
git commit -m "feat: add career coach route page and sidebar entry"
```

---

### Task 7: Update TTS route to support female voice for Kavya

**Files:**
- Modify: `src/app/api/tts/route.ts`

- [ ] **Step 1: Modify the TTS route to accept an optional voice parameter**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { EdgeTTS } from 'edge-tts-universal'

export const runtime = 'nodejs'

const VOICES: Record<string, { voice: string; rate: string }> = {
  default: { voice: 'en-IN-PrabhatNeural', rate: '-10%' },
  kavya: { voice: 'en-IN-NeerjaNeural', rate: '-10%' },
}

export async function GET(req: NextRequest) {
  const text = req.nextUrl.searchParams.get('text')
  const voice = req.nextUrl.searchParams.get('voice') || 'default'

  if (!text) {
    return NextResponse.json({ error: 'Missing text param' }, { status: 400 })
  }

  const config = VOICES[voice] || VOICES.default

  try {
    const tts = new EdgeTTS(text, config.voice, {
      rate: config.rate,
      volume: '+20%',
      pitch: '+0Hz',
    })
    const result = await tts.synthesize()
    const audioBuffer = Buffer.from(await result.audio.arrayBuffer())
    return new NextResponse(audioBuffer, {
      headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'public, max-age=3600' },
    })
  } catch {
    return NextResponse.json({ error: 'TTS synthesis failed' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Update KavyaClient to pass voice=kavya parameter**

Edit `src/components/coach/KavyaClient.tsx`, change the TTS fetch call:
```typescript
const res = await fetch(`/api/tts?voice=kavya&text=${encodeURIComponent(text)}`)
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/tts/route.ts src/components/coach/KavyaClient.tsx
git commit -m "feat: add female voice support for Kavya career coach"
```

---

### Task 8: Run all tests and verify

- [ ] **Step 1: Run all tests**

Run: `npx vitest run`
Expected: All tests pass

- [ ] **Step 2: Build check**

Run: `npm run build 2>&1 | tail -20`
Expected: Build succeeds with no errors
