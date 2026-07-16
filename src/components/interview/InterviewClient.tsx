'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

interface HistoryEntry {
  role: 'ai' | 'user'
  content: string
}

type Phase = 'setup' | 'ai_turn' | 'user_turn' | 'connecting' | 'feedback'

interface FeedbackResult {
  score: number
  verdict: string
  verdict_explanation: string
  strengths: string[]
  gaps: string[]
  suggestions: string[]
}

function Avatar({ label, speaking }: { label: string; speaking: boolean }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className={`w-24 h-24 rounded-full flex items-center justify-center text-2xl font-bold
          ${speaking ? 'ring-4 ring-green-400 shadow-lg shadow-green-400/30' : 'ring-2 ring-gray-600'}
          transition-all duration-300`}
        style={{ backgroundColor: label === 'You' ? '#1e40af' : '#6b21a8' }}
      >
        👤
      </div>
      <p className={`text-sm font-medium ${speaking ? 'text-green-400' : 'text-gray-400'}`}>
        {speaking ? `${label} speaking...` : label}
      </p>
    </div>
  )
}

export function InterviewClient() {
  const [phase, setPhase] = useState<Phase>('setup')
  const [resume, setResume] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [currentQuestion, setCurrentQuestion] = useState('')
  const [transcript, setTranscript] = useState('')
  const [interim, setInterim] = useState('')
  const [feedback, setFeedback] = useState<FeedbackResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState(25 * 60)
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [showCamera, setShowCamera] = useState(false)
  const [aiSpeaking, setAiSpeaking] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const historyRef = useRef(history)
  const finishedRef = useRef(false)
  const resumeRef = useRef(resume)
  const jobDescriptionRef = useRef(jobDescription)
  const transcriptRef = useRef(transcript)
  const recognitionActiveRef = useRef(false)
  const submittingRef = useRef(false)
  const speakResolveRef = useRef<(() => void) | null>(null)

  useEffect(() => { historyRef.current = history }, [history])
  useEffect(() => { resumeRef.current = resume }, [resume])
  useEffect(() => { jobDescriptionRef.current = jobDescription }, [jobDescription])
  useEffect(() => { transcriptRef.current = transcript }, [transcript])

  const cleanup = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop() } catch {}
      recognitionRef.current = null
    }
    recognitionActiveRef.current = false
  }, [])

  useEffect(() => {
    return () => cleanup()
  }, [cleanup])

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
      setShowCamera(true)
    } catch {
      setShowCamera(false)
    }
  }, [])

  const [speakUrl, setSpeakUrl] = useState<string | null>(null)
  const [speakKey, setSpeakKey] = useState(0)

  const onAudioEnded = useCallback(() => {
    speakResolveRef.current?.()
    speakResolveRef.current = null
  }, [])

  const speak = useCallback(async (text: string): Promise<void> => {
    if (!voiceEnabled) return
    setAiSpeaking(true)
    const start = Date.now()
    try {
      const res = await fetch(`/api/tts?text=${encodeURIComponent(text)}`)
      if (!res.ok) throw new Error('TTS API error')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      setSpeakUrl(url)
      setSpeakKey((k) => k + 1)
      await new Promise<void>((resolve) => {
        speakResolveRef.current = resolve
      })
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error('TTS error:', e)
    }
    setAiSpeaking(false)
    const elapsed = Date.now() - start
    const minReadTime = 5000
    if (elapsed < minReadTime) {
      await new Promise((r) => setTimeout(r, minReadTime - elapsed))
    }
  }, [voiceEnabled])

  const startListening = useCallback(() => {
    if (recognitionActiveRef.current) return
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognitionAPI) {
      setError('Speech recognition is not supported in this browser. Type your answers or try Chrome/Edge.')
      return
    }

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
        if (full && full !== transcriptRef.current) submitAnswer(full)
      }, 1500)
    }

    recognition.onerror = () => {
      recognitionActiveRef.current = false
    }

    recognitionRef.current = recognition
    recognitionActiveRef.current = true
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
  }, [])

  const submitAnswer = useCallback(async (text: string) => {
    if (submittingRef.current) return
    submittingRef.current = true
    stopListening()
    setPhase('connecting')
    setInterim('')

    const hist = [...historyRef.current, { role: 'user' as const, content: text }]
    setHistory(hist)
    setTranscript('')

    try {
      const res = await fetch('/api/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phase: 'interview', resume: resumeRef.current, jobDescription: jobDescriptionRef.current, history: hist }),
      })

      if (!res.ok) { setError('Connection lost. Try again.'); setPhase('setup'); return }

      const data = await res.json()
      if (data.type === 'error') { setError(data.content); setPhase('setup'); return }
      if (data.type === 'complete') {
        finishInterview(hist)
      } else {
        const question = data.content || ''
        setCurrentQuestion(question)
        setHistory([...hist, { role: 'ai', content: question }])
        setPhase('ai_turn')
        await speak(question)
        setPhase('user_turn')
        startListening()
      }
    } catch {
      setError('Connection lost.')
      setPhase('setup')
    } finally {
      submittingRef.current = false
    }
  }, [speak, startListening, stopListening])

  const finishInterview = useCallback(async (hist: HistoryEntry[]) => {
    if (finishedRef.current) return
    finishedRef.current = true
    stopListening()
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }

    setPhase('connecting')
    try {
      const res = await fetch('/api/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phase: 'feedback', resume: resumeRef.current, jobDescription: jobDescriptionRef.current, history: hist }),
      })
      if (!res.ok) { setError('Failed to generate feedback.'); setPhase('feedback'); return }
      setFeedback(await res.json())
      setPhase('feedback')
    } catch {
      setError('Failed to generate feedback.')
      setPhase('feedback')
    }
  }, [stopListening])

  useEffect(() => {
    if (timeLeft <= 0 && phase !== 'setup' && phase !== 'feedback') {
      finishInterview(historyRef.current)
    }
  }, [timeLeft, finishInterview, phase])

  const startCall = async () => {
    if (!resume.trim() || !jobDescription.trim()) return
    setError(null)
    finishedRef.current = false
    setPhase('connecting')

    try {
      const res = await fetch('/api/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phase: 'interview', resume, jobDescription, history: [] }),
      })

      if (!res.ok) { setError('Failed to start.'); setPhase('setup'); return }

      const data = await res.json()
      if (data.type === 'error') { setError(data.content); setPhase('setup'); return }
      if (data.type === 'complete') { setError('Interview ended immediately.'); setPhase('setup'); return }

      const question = data.content || ''
      setCurrentQuestion(question)
      setHistory([{ role: 'ai', content: question }])
      setTranscript('')
      setInterim('')
      setTimeLeft(25 * 60)

      timerRef.current = setInterval(() => setTimeLeft((t) => Math.max(0, t - 1)), 1000)

      setPhase('ai_turn')
      await speak(question)
      setPhase('user_turn')
      startListening()
    } catch {
      setError('Failed to start.')
      setPhase('setup')
    }
  }

  const endCall = () => {
    cleanup()
    setSpeakUrl(null)
    setPhase('setup')
    setError(null)
  }

  const toggleCamera = async () => {
    if (showCamera) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      }
      setShowCamera(false)
    } else {
      startCamera()
    }
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  // Setup
  if (phase === 'setup') {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">AI Mock Interview</h1>
          <p className="text-gray-600">
            A voice-only interview experience. The AI will ask you questions — just speak your answers naturally.
          </p>
        </div>

        <div className="space-y-4 mb-8">
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
            onClick={startCall}
            disabled={!resume.trim() || !jobDescription.trim()}
            className="px-6 py-3 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            Start Call →
          </button>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      </div>
    )
  }

  // Connecting
  if (phase === 'connecting') {
    return (
      <div className="fixed inset-0 bg-gray-900 flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-2 border-white border-t-transparent rounded-full animate-spin" />
        <p className="text-white text-sm">{history.length === 0 ? 'Starting interview...' : 'Thinking...'}</p>
      </div>
    )
  }

  // Active call (ai_turn or user_turn)
  if (phase === 'ai_turn' || phase === 'user_turn') {
    const isAi = phase === 'ai_turn'
    const displayText = isAi ? currentQuestion : (transcript
      ? transcript + (interim ? ' ' + interim : '')
      : interim || '')

    return (
      <div className="fixed inset-0 bg-gray-900 flex flex-col">
        {speakUrl && (
          <audio key={speakKey} src={speakUrl} autoPlay onEnded={onAudioEnded} />
        )}
        {showCamera && (
          <div className="absolute top-4 right-4 z-10 w-32 h-24 rounded-lg overflow-hidden border-2 border-gray-700 shadow-lg">
            <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
          </div>
        )}

        <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm font-mono z-20">
          {formatTime(timeLeft)}
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <Avatar label={isAi ? 'Interviewer' : 'You'} speaking={isAi ? aiSpeaking : !isAi} />

          <div className="mt-6 max-w-xl text-center">
            <p className={`text-lg leading-relaxed ${isAi ? 'text-white' : 'text-gray-200'}`}>
              {isAi
                ? currentQuestion || 'Preparing question...'
                : displayText || (aiSpeaking ? 'Listening...' : 'Waiting for your answer...')}
            </p>
          </div>
        </div>

        <div className="bg-gray-800 px-6 py-5 flex items-center justify-center gap-6">
          <button
            onClick={toggleCamera}
            className={`p-3 rounded-full text-sm ${showCamera ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400'}`}
            title="Toggle camera"
          >
            📷
          </button>

          <button
            onClick={endCall}
            className="p-3 rounded-full bg-red-600 text-white hover:bg-red-700"
            title="End call"
          >
            ⏹
          </button>

          <button
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            className={`p-3 rounded-full text-sm ${voiceEnabled ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400'}`}
            title="Toggle voice"
          >
            {voiceEnabled ? '🔊' : '🔇'}
          </button>
        </div>
      </div>
    )
  }

  // Feedback
  if (phase === 'feedback') {
    if (!feedback) {
      return (
        <div className="max-w-4xl mx-auto py-8 px-4">
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
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Interview Complete</h1>
          <p className="text-gray-600">Here is your performance review.</p>
        </div>

        <div className="space-y-6">
          <div className={`rounded-xl border p-6 ${scoreBg}`}>
            <div className="flex items-center gap-6">
              <div className={`text-4xl font-bold ${scoreColor}`}>{feedback.score}</div>
              <div>
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Score</p>
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
            onClick={() => { setPhase('setup'); setFeedback(null); setHistory([]); setTranscript(''); setTimeLeft(25 * 60); finishedRef.current = false; cleanup() }}
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
