# AI Mock Interview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a full-screen video-call-style AI interview feature where Gemini 2.5 Flash interviews candidates based on resume + job description, then generates feedback.

**Architecture:** Sequential API calls to single `POST /api/interview` endpoint (stateless backend). Voice via Web Speech API. Camera via `getUserMedia`. Two phases: interview (adaptive Q&A) then feedback (score + strengths/gaps/suggestions).

**Tech Stack:** Next.js 16, React 19, Gemini 2.5 Flash (OpenAI-compatible endpoint), Web Speech API, Tailwind CSS 4

---

### Task 1: Add interview system prompts and Gemini call logic

**Files:**
- Create: `src/lib/interview.ts`
- Create: `src/lib/__tests__/interview.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/lib/__tests__/interview.test.ts
import { describe, it, expect } from 'vitest'
import { getInterviewPrompt, getFeedbackPrompt, parseInterviewResponse } from '../interview'

describe('getInterviewPrompt', () => {
  it('includes resume and job description', () => {
    const prompt = getInterviewPrompt('SWE at Google', 'Senior Engineer role')
    expect(prompt).toContain('SWE at Google')
    expect(prompt).toContain('Senior Engineer role')
  })
})

describe('getFeedbackPrompt', () => {
  it('requests score and strengths/gaps', () => {
    const prompt = getFeedbackPrompt()
    expect(prompt).toContain('score')
    expect(prompt).toContain('strengths')
    expect(prompt).toContain('gaps')
  })
})

describe('parseInterviewResponse', () => {
  it('detects complete signal', () => {
    expect(parseInterviewResponse('__INTERVIEW_COMPLETE__')).toEqual({ type: 'complete' })
  })

  it('detects question', () => {
    expect(parseInterviewResponse('Tell me about your experience.')).toEqual({
      type: 'question',
      content: 'Tell me about your experience.',
    })
  })

  it('strips complete signal from content', () => {
    expect(parseInterviewResponse('Great. __INTERVIEW_COMPLETE__')).toEqual({ type: 'complete' })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/__tests__/interview.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write minimal implementation**

```typescript
// src/lib/interview.ts
const AI_API_KEY = process.env.AI_API_KEY
const AI_API_URL = process.env.AI_API_URL ?? 'https://api.openai.com/v1/chat/completions'
const AI_MODEL = process.env.AI_MODEL ?? 'gpt-4o-mini'

interface Message {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export function getInterviewPrompt(resume: string, jobDescription: string): string {
  return `You are a professional interviewer conducting a job interview for the following role:

Job Description:
${jobDescription}

Candidate Resume:
${resume}

Interview the candidate for this role. Ask one question at a time. Start with general questions about their background, then probe deeper into skills relevant to the role. Adapt your questions based on their answers — if they answer well, go deeper; if they struggle, pivot to related areas.

After each answer, decide if you have enough information to evaluate the candidate. When you have enough signal, respond with exactly: __INTERVIEW_COMPLETE__

Otherwise, ask the next question. Be concise — one question per response.`
}

export function getFeedbackPrompt(): string {
  return `You are an expert hiring manager reviewing an interview transcript. Evaluate the candidate based on the interview conversation.

Return a JSON object with these exact fields:
- score: number 0-100 (overall performance)
- verdict: string ("Strong fit", "Possible fit", or "Weak fit")
- verdict_explanation: string (2-3 sentences explaining the score)
- strengths: string[] (2-4 things they did well, with specific examples from the interview)
- gaps: string[] (2-4 areas where they fell short, with specific examples)
- suggestions: string[] (2-4 actionable recommendations to improve)

Be honest and specific. Base your evaluation on actual answers given, not the resume.

Return ONLY valid JSON, no other text.`
}

export function parseInterviewResponse(content: string): { type: 'question' | 'complete'; content?: string } {
  if (content.includes('__INTERVIEW_COMPLETE__')) {
    return { type: 'complete' }
  }
  return { type: 'question', content }
}

export async function callGemini(messages: Message[], temperature = 0.7): Promise<string | null> {
  if (!AI_API_KEY) return null

  try {
    const response = await fetch(AI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages,
        temperature,
        max_tokens: 500,
      }),
    })

    if (!response.ok) return null

    const data = await response.json()
    return data.choices?.[0]?.message?.content?.trim() ?? null
  } catch {
    return null
  }
}

export async function handleInterviewTurn(params: {
  resume: string
  jobDescription: string
  history: { role: 'ai' | 'user'; content: string }[]
}): Promise<{ type: 'question' | 'complete'; content?: string }> {
  const messages: Message[] = [
    { role: 'system', content: getInterviewPrompt(params.resume, params.jobDescription) },
  ]

  for (const entry of params.history) {
    messages.push({ role: entry.role === 'ai' ? 'assistant' : 'user', content: entry.content })
  }

  const response = await callGemini(messages)
  if (!response) return { type: 'question', content: 'Could you tell me more about your experience?' }
  return parseInterviewResponse(response)
}

export async function handleFeedback(params: {
  resume: string
  jobDescription: string
  history: { role: 'ai' | 'user'; content: string }[]
}): Promise<{
  score: number
  verdict: string
  verdict_explanation: string
  strengths: string[]
  gaps: string[]
  suggestions: string[]
} | null> {
  const transcript = params.history
    .map((h) => `${h.role === 'ai' ? 'Interviewer' : 'Candidate'}: ${h.content}`)
    .join('\n')

  const messages: Message[] = [
    { role: 'system', content: getFeedbackPrompt() },
    {
      role: 'user',
      content: `Job Description:\n${params.jobDescription}\n\nResume:\n${params.resume}\n\nInterview Transcript:\n${transcript}\n\nEvaluate the candidate.`,
    },
  ]

  const response = await callGemini(messages, 0.3)
  if (!response) return null

  try {
    const parsed = JSON.parse(response)
    return {
      score: Math.max(0, Math.min(100, parsed.score ?? 50)),
      verdict: parsed.verdict || 'Possible fit',
      verdict_explanation: parsed.verdict_explanation || '',
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      gaps: Array.isArray(parsed.gaps) ? parsed.gaps : [],
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
    }
  } catch {
    return null
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/lib/__tests__/interview.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/interview.ts src/lib/__tests__/interview.test.ts
git commit -m "feat: add interview prompts and Gemini call logic"
```

---

### Task 2: Add API route for interview & feedback

**Files:**
- Create: `src/app/api/interview/route.ts`

- [ ] **Step 1: Write the failing test**

Add to `src/lib/__tests__/interview.test.ts`:

```typescript
import { callGemini, handleInterviewTurn, handleFeedback } from '../interview'

describe('callGemini', () => {
  it('returns null when API key is not set', async () => {
    const key = process.env.AI_API_KEY
    delete process.env.AI_API_KEY
    const result = await callGemini([{ role: 'user', content: 'test' }])
    expect(result).toBeNull()
    process.env.AI_API_KEY = key
  })
})
```

- [ ] **Step 2: Verify test fails**

Run: `npm test -- src/lib/__tests__/interview.test.ts`
Expected: PASS (callGemini is already exported from Task 1)

- [ ] **Step 3: Create API route**

```typescript
// src/app/api/interview/route.ts
import { handleInterviewTurn, handleFeedback } from '@/lib/interview'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { phase, resume, jobDescription, history } = body

    if (!resume?.trim() || !jobDescription?.trim() || !Array.isArray(history)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (phase === 'interview') {
      const result = await handleInterviewTurn({ resume, jobDescription, history })
      return NextResponse.json(result)
    }

    if (phase === 'feedback') {
      const result = await handleFeedback({ resume, jobDescription, history })
      if (!result) {
        return NextResponse.json({ error: 'Feedback generation failed' }, { status: 500 })
      }
      return NextResponse.json(result)
    }

    return NextResponse.json({ error: 'Invalid phase' }, { status: 400 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 4: Run existing tests**

Run: `npm test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/api/interview/route.ts
git commit -m "feat: add interview API endpoint"
```

---

### Task 3: Build InterviewClient component (setup + full-screen interview + feedback)

**Files:**
- Create: `src/components/interview/InterviewClient.tsx`
- Create: `src/components/interview/__tests__/InterviewClient.test.tsx`

- [ ] **Step 1: Write the failing test**

```typescript
// src/components/interview/__tests__/InterviewClient.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { InterviewClient } from '../InterviewClient'

describe('InterviewClient', () => {
  it('renders setup screen by default', () => {
    render(<InterviewClient />)
    expect(screen.getByText('AI Mock Interview')).toBeDefined()
    expect(screen.getByText('Start Interview →')).toBeDefined()
  })
})
```

- [ ] **Step 2: Verify test fails**

Run: `npm test -- src/components/interview/__tests__/InterviewClient.test.tsx`
Expected: FAIL — module not found

- [ ] **Step 3: Create the InterviewClient component**

```typescript
// src/components/interview/InterviewClient.tsx
'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

interface HistoryEntry {
  role: 'ai' | 'user'
  content: string
}

type Phase = 'setup' | 'recording' | 'answering' | 'feedback' | 'loading'

interface FeedbackResult {
  score: number
  verdict: string
  verdict_explanation: string
  strengths: string[]
  gaps: string[]
  suggestions: string[]
}

export function InterviewClient() {
  const [phase, setPhase] = useState<Phase>('setup')
  const [resume, setResume] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [currentQuestion, setCurrentQuestion] = useState('')
  const [transcript, setTranscript] = useState('')
  const [feedback, setFeedback] = useState<FeedbackResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState(25 * 60)
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [cameraEnabled, setCameraEnabled] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
      setCameraEnabled(true)
    } catch {
      setCameraEnabled(false)
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    setCameraEnabled(false)
  }, [])

  useEffect(() => {
    return () => {
      stopCamera()
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [stopCamera])

  const speak = useCallback((text: string) => {
    if (!voiceEnabled) return
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 1
    utterance.pitch = 1
    speechSynthesis.speak(utterance)
  }, [voiceEnabled])

  const startListening = useCallback(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognitionAPI) {
      setError('Speech recognition not supported in this browser.')
      return
    }

    const recognition = new SpeechRecognitionAPI()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let final = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript
        }
      }
      if (final) setTranscript((prev) => prev + ' ' + final)
    }

    recognition.onerror = () => {
      setTranscript((prev) => prev || '')
      setPhase('answering')
    }

    recognitionRef.current = recognition
    recognition.start()
  }, [])

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    setTranscript((prev) => prev.trim() || '')
  }, [])

  const startInterview = async () => {
    if (!resume.trim() || !jobDescription.trim()) return
    setError(null)
    setPhase('loading')
    startCamera()

    try {
      const res = await fetch('/api/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phase: 'interview', resume, jobDescription, history: [] }),
      })

      if (!res.ok) { setError('Failed to start interview.'); setPhase('setup'); return }

      const data = await res.json()
      setCurrentQuestion(data.content || '')
      setHistory([{ role: 'ai', content: data.content || '' }])
      setPhase('answering')
      speak(data.content || '')

      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) { finishInterview(); return 0 }
          return prev - 1
        })
      }, 1000)
    } catch {
      setError('Failed to start interview.')
      setPhase('setup')
    }
  }

  const sendAnswer = async () => {
    const answer = transcript.trim()
    if (!answer) return

    const updatedHistory = [...history, { role: 'user' as const, content: answer }]
    setHistory(updatedHistory)
    setTranscript('')
    setPhase('loading')

    try {
      const res = await fetch('/api/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phase: 'interview', resume, jobDescription, history: updatedHistory }),
      })

      if (!res.ok) { setError('Failed to get next question.'); setPhase('answering'); return }

      const data = await res.json()
      if (data.type === 'complete') {
        finishInterview(updatedHistory)
      } else {
        const nextHistory = [...updatedHistory, { role: 'ai' as const, content: data.content || '' }]
        setHistory(nextHistory)
        setCurrentQuestion(data.content || '')
        setPhase('answering')
        speak(data.content || '')
      }
    } catch {
      setError('Failed to get next question.')
      setPhase('answering')
    }
  }

  const finishInterview = async (finalHistory?: HistoryEntry[]) => {
    if (timerRef.current) clearInterval(timerRef.current)
    stopListening()

    const hist = finalHistory || history
    setPhase('loading')

    try {
      const res = await fetch('/api/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phase: 'feedback', resume, jobDescription, history: hist }),
      })

      if (!res.ok) { setError('Failed to generate feedback.'); setPhase('feedback'); return }

      setFeedback(await res.json())
      setPhase('feedback')
      stopCamera()
    } catch {
      setError('Failed to generate feedback.')
      setPhase('feedback')
    }
  }

  const startRecording = () => {
    setTranscript('')
    setPhase('recording')
    startListening()
  }

  const stopRecording = () => {
    stopListening()
    setPhase('answering')
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  // Setup screen
  if (phase === 'setup') {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">AI Mock Interview</h1>
          <p className="text-gray-600">
            Practice interviewing with AI. Paste a job description and your resume,
            then go through a realistic voice-based interview.
          </p>
        </div>

        <div className="space-y-4 mb-8">
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Job Description</label>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the full job description here..."
              rows={6}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Your Resume</label>
            <textarea
              value={resume}
              onChange={(e) => setResume(e.target.value)}
              placeholder="Paste your full resume text here..."
              rows={8}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono"
            />
          </div>

          <button
            onClick={startInterview}
            disabled={!resume.trim() || !jobDescription.trim()}
            className="px-6 py-3 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            Start Interview →
          </button>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      </div>
    )
  }

  // Loading screen (before first question)
  if (phase === 'loading' && !currentQuestion) {
    return (
      <div className="fixed inset-0 bg-gray-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p>Starting interview...</p>
        </div>
      </div>
    )
  }

  // Full-screen interview
  if (phase === 'recording' || phase === 'answering' || (phase === 'loading' && currentQuestion)) {
    return (
      <div className="fixed inset-0 bg-gray-900 flex flex-col">
        <div className="flex-1 flex items-center justify-center relative">
          {cameraEnabled ? (
            <video ref={videoRef} autoPlay muted className="w-full h-full object-cover" />
          ) : (
            <button
              onClick={startCamera}
              className="text-white text-center cursor-pointer hover:text-gray-300"
            >
              <p className="text-6xl mb-4">🎥</p>
              <p>Enable Camera</p>
            </button>
          )}

          <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm font-mono">
            {formatTime(timeLeft)}
          </div>

          {phase === 'recording' && (
            <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm animate-pulse">
              Recording...
            </div>
          )}

          <div className="absolute bottom-32 left-1/2 -translate-x-1/2 bg-black/70 text-white px-6 py-3 rounded-xl max-w-2xl text-center">
            <p className="text-lg">{currentQuestion}</p>
          </div>
        </div>

        <div className="bg-gray-800 px-6 py-4 flex items-center justify-center gap-4">
          {phase === 'answering' && !transcript && (
            <button onClick={startRecording} className="px-6 py-3 bg-red-600 text-white rounded-full font-medium hover:bg-red-700">
              🎤 Record Answer
            </button>
          )}

          {phase === 'recording' && (
            <button onClick={stopRecording} className="px-6 py-3 bg-gray-600 text-white rounded-full font-medium hover:bg-gray-700">
              ⏹ Stop Recording
            </button>
          )}

          {phase === 'answering' && transcript && (
            <>
              <div className="bg-gray-700 text-white px-4 py-2 rounded-lg max-w-md truncate">
                {transcript}
              </div>
              <button onClick={sendAnswer} className="px-6 py-3 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700">
                Send Answer
              </button>
            </>
          )}

          {phase === 'loader' && (
            <div className="text-white flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Processing...
            </div>
          )}

          <button
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            className={`px-3 py-2 rounded-full text-sm ${voiceEnabled ? 'bg-blue-600 text-white' : 'bg-gray-600 text-gray-300'}`}
          >
            {voiceEnabled ? '🔊 Voice On' : '🔇 Voice Off'}
          </button>
        </div>

        {phase === 'answering' && transcript && (
          <div className="bg-gray-800 px-6 py-2 border-t border-gray-700">
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm resize-none"
              rows={2}
              placeholder="Edit your answer..."
            />
          </div>
        )}
      </div>
    )
  }

  // Feedback screen
  if (phase === 'feedback') {
    if (!feedback) {
      return (
        <div className="max-w-4xl mx-auto py-8">
          <p className="text-red-600">{error || 'Feedback unavailable.'}</p>
          <button onClick={() => { setPhase('setup'); setError(null) }} className="text-blue-600 underline mt-4">
            Try again
          </button>
        </div>
      )
    }

    const scoreColor = feedback.score >= 70 ? 'text-green-600' : feedback.score >= 40 ? 'text-amber-600' : 'text-red-600'
    const scoreBg = feedback.score >= 70 ? 'bg-green-50 border-green-200' : feedback.score >= 40 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'

    return (
      <div className="max-w-4xl mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Interview Complete</h1>
          <p className="text-gray-600">Here is your performance review.</p>
        </div>

        <div className="space-y-6">
          <div className={`rounded-xl border p-6 ${scoreBg}`}>
            <div className="flex items-center gap-6">
              <div className={`text-4xl font-bold ${scoreColor}`}>{feedback.score}</div>
              <div>
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Interview Score</p>
                <h2 className={`text-xl font-bold ${scoreColor}`}>{feedback.verdict}</h2>
                <p className="text-sm text-gray-600 mt-1">{feedback.verdict_explanation}</p>
              </div>
            </div>
          </div>

          {feedback.strengths.length > 0 && (
            <div className="border border-gray-200 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-green-600 uppercase tracking-wider mb-3">Strengths</h3>
              <ul className="space-y-2">
                {feedback.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-green-500 mt-0.5">✓</span> {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {feedback.gaps.length > 0 && (
            <div className="border border-gray-200 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-red-600 uppercase tracking-wider mb-3">Areas to Improve</h3>
              <ul className="space-y-2">
                {feedback.gaps.map((g, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-red-500 mt-0.5">✗</span> {g}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {feedback.suggestions.length > 0 && (
            <div className="border border-gray-200 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-3">Suggestions</h3>
              <ul className="space-y-2">
                {feedback.suggestions.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-blue-500 mt-0.5">→</span> {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            onClick={() => { setPhase('setup'); setFeedback(null); setHistory([]); setTranscript(''); setTimeLeft(25 * 60) }}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Practice Again
          </button>
        </div>
      </div>
    )
  }

  return null
}
```

- [ ] **Step 4: Verify test passes**

Run: `npm test -- src/components/interview/__tests__/InterviewClient.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/interview/InterviewClient.tsx src/components/interview/__tests__/InterviewClient.test.tsx
git commit -m "feat: add InterviewClient component with full-screen UI"
```

---

### Task 4: Add interview route page

**Files:**
- Create: `src/app/(protected)/interview/page.tsx`

- [ ] **Step 1: Write the failing test**

```typescript
// src/components/interview/__tests__/InterviewClient.test.tsx (add)
describe('InterviewClient', () => {
  // ... existing tests

  it('has textarea for job description', () => {
    render(<InterviewClient />)
    expect(screen.getByPlaceholderText('Paste the full job description here...')).toBeDefined()
  })

  it('has textarea for resume', () => {
    render(<InterviewClient />)
    expect(screen.getByPlaceholderText('Paste your full resume text here...')).toBeDefined()
  })
})
```

- [ ] **Step 2: Verify tests pass**

Run: `npm test -- src/components/interview/__tests__/InterviewClient.test.tsx`
Expected: PASS

- [ ] **Step 3: Create route page**

```typescript
// src/app/(protected)/interview/page.tsx
import { InterviewClient } from '@/components/interview/InterviewClient'

export default function InterviewPage() {
  return <InterviewClient />
}
```

- [ ] **Step 4: Run tests**

Run: `npm test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/(protected)/interview/page.tsx src/components/interview/__tests__/InterviewClient.test.tsx
git commit -m "feat: add interview route page"
```

---

### Task 5: Final verification

**Files:** None — run existing checks.

- [ ] **Step 1: Run type check**

Run: `npm run typecheck`
Expected: No type errors

- [ ] **Step 2: Run lint**

Run: `npm run lint`
Expected: No lint errors

- [ ] **Step 3: Run all tests**

Run: `npm test`
Expected: All tests pass

- [ ] **Step 4: Build**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 5: Final commit if any fixes were needed**

```bash
git add -A
git commit -m "chore: fix lint/type issues"
```
