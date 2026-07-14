'use client'

import { useState, useRef, useEffect } from 'react'
import { useRealtimeVoice } from '@/hooks/useRealtimeVoice'
import { CoachSummary } from './CoachSummary'

interface HistoryEntry {
  role: 'user' | 'assistant'
  content: string
}

interface CoachingSummary {
  insights: string[]
  strengths: string[]
  blindSpots: string[]
  nextSteps: string[]
}

type Phase = 'setup' | 'session' | 'summary'

const COACH_INSTRUCTIONS = `You are Kavya, a warm, thoughtful, and calm female career coach. Your voice is gentle and supportive. You help people reflect on their career journey with curiosity and compassion.

Your goal is to guide a thoughtful conversation. Ask ONE question at a time. Listen to their answer and ask a follow-up that goes deeper. Cover these areas naturally as the conversation unfolds:
- Their current career situation and what brought them here
- What matters most to them in their work (values, motivations)
- Their strengths and what they're proud of
- What doubts or fears they're sitting with
- What they envision for their future
- How their job search is going, and where they feel stuck

Adapt to whatever they share. Don't rush. Don't lecture. Be present.

When you feel you have enough understanding to offer meaningful guidance, call the generate_coaching_summary function to end the session.`

function Avatar({ speaking }: { speaking: boolean }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl transition-all duration-500 ${
          speaking ? 'shadow-lg' : ''
        }`}
        style={{
          backgroundColor: speaking ? 'rgba(0, 82, 255, 0.15)' : 'rgba(0, 82, 255, 0.08)',
          boxShadow: speaking ? '0 0 30px rgba(0, 82, 255, 0.2)' : 'none',
        }}
      >
        <span className={speaking ? 'animate-pulse' : ''}>🌸</span>
      </div>
      <p
        className={`text-sm font-medium transition-colors duration-300 ${
          speaking ? 'text-[var(--accent)]' : 'text-[var(--text-tertiary)]'
        }`}
      >
        {speaking ? 'Kavya is speaking...' : 'Listening...'}
      </p>
    </div>
  )
}

export function KavyaClient() {
  const [phase, setPhase] = useState<Phase>('setup')
  const [context, setContext] = useState('')
  const [summary, setSummary] = useState<CoachingSummary | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [displayText, setDisplayText] = useState('')

  const contextRef = useRef(context)
  const historyRef = useRef<HistoryEntry[]>([])

  const instructions = context
    ? `${COACH_INSTRUCTIONS}\n\nThe user shared this about themselves:\n${context}`
    : COACH_INSTRUCTIONS

  const { status, start, stop, sendFunctionResult, aiTranscript, userTranscript, isAiSpeaking, history } =
    useRealtimeVoice({
      agentId: 'agent_Lkbete4zcv7fCdJ8',
      instructions,
      initialMessage: 'Begin the coaching conversation.',
      functions: [
        {
          name: 'generate_coaching_summary',
          description:
            'Call this when the coaching conversation has reached a natural conclusion and you have enough understanding to offer guidance.',
          parameters: { type: 'object', properties: {}, required: [] },
        },
      ],
      onFunctionCall: async (name, callId) => {
        if (name === 'generate_coaching_summary') {
          const historyForApi = historyRef.current.map((h) => ({
            role: h.role === 'assistant' ? 'ai' as const : 'user' as const,
            content: h.content,
          }))
          try {
            const res = await fetch('/api/career-coach', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                phase: 'summary',
                context: contextRef.current,
                history: historyForApi,
              }),
            })
            if (res.ok) {
              setSummary(await res.json())
              setPhase('summary')
            } else {
              setError('Failed to generate summary.')
            }
          } catch {
            setError('Failed to generate summary.')
          }
          sendFunctionResult(callId, { success: true })
          stop()
        }
      },
      onError: (err) => {
        setError(err)
        if (phase === 'session') setPhase('setup')
      },
    })

  useEffect(() => {
    contextRef.current = context
  }, [context])

  useEffect(() => {
    historyRef.current = history
  }, [history])

  useEffect(() => {
    if (isAiSpeaking && aiTranscript) {
      setDisplayText(aiTranscript)
    } else if (!isAiSpeaking && userTranscript) {
      setDisplayText(userTranscript)
    }
  }, [aiTranscript, userTranscript, isAiSpeaking])

  const startSession = async () => {
    setError(null)
    setDisplayText('')
    setPhase('session')
    try {
      await start()
    } catch {
      setPhase('setup')
    }
  }

  const endSession = () => {
    stop()
    setPhase('setup')
    setError(null)
    setDisplayText('')
  }

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
            Your calm and thoughtful career coach. A gentle conversation to help you reflect, gain clarity, and move
            forward with purpose.
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
            disabled={status === 'connecting'}
            className="w-full px-6 py-3 text-sm font-medium text-white rounded-xl transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            {status === 'connecting' ? 'Connecting...' : 'Begin Conversation'}
          </button>

          {error && <p className="text-sm text-red-500 text-center">{error}</p>}
        </div>
      </div>
    )
  }

  if (phase === 'session') {
    const show = aiTranscript || userTranscript || ''

    return (
      <div className="fixed inset-0 flex flex-col" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <Avatar speaking={isAiSpeaking} />

          <div className="mt-8 max-w-xl text-center">
            <p
              className="text-lg leading-relaxed transition-all duration-300"
              style={{
                color: isAiSpeaking ? 'var(--accent)' : 'var(--text-primary)',
                opacity: show ? 1 : 0.5,
              }}
            >
              {show || 'Waiting for Kavya...'}
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
        </div>
      </div>
    )
  }

  if (phase === 'summary') {
    if (!summary) {
      return (
        <div className="max-w-2xl mx-auto py-8 px-4">
          <p className="text-red-500">{error || 'Summary unavailable.'}</p>
          <button
            onClick={() => {
              setPhase('setup')
              setError(null)
              setSummary(null)
            }}
            className="text-[var(--accent)] underline mt-4"
          >
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
            onClick={() => {
              setPhase('setup')
              setSummary(null)
              setError(null)
            }}
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
