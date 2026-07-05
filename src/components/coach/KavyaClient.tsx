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
  const submittingRef = useRef(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
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
    if (audioRef.current) {
      try { audioRef.current.pause(); audioRef.current = null } catch {}
    }
  }, [])

  useEffect(() => {
    return () => cleanup()
  }, [cleanup])

  const speak = useCallback(async (text: string): Promise<void> => {
    if (!voiceEnabled) return
    if (audioRef.current) {
      try { audioRef.current.pause(); audioRef.current = null } catch {}
    }
    setAiSpeaking(true)
    setListening(false)
    try {
      const res = await fetch(`/api/tts?voice=kavya&text=${encodeURIComponent(text)}`)
      if (!res.ok) throw new Error('TTS API error')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      audioRef.current = audio
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => { URL.revokeObjectURL(url); resolve() }, 30000)
        audio.onended = () => { clearTimeout(timeout); URL.revokeObjectURL(url); resolve() }
        audio.onerror = () => { clearTimeout(timeout); URL.revokeObjectURL(url); reject(new Error('Audio playback failed')) }
        audio.play().catch(() => { clearTimeout(timeout); URL.revokeObjectURL(url); resolve() })
      })
      if (audioRef.current === audio) audioRef.current = null
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
    if (submittingRef.current) return
    submittingRef.current = true
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
    } finally {
      submittingRef.current = false
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
