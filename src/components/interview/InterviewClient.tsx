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
      if (data.type === 'error') { setError(data.content || 'AI unavailable.'); setPhase('setup'); return }
      if (data.type === 'complete') { setError('Interview ended immediately.'); setPhase('setup'); return }

      setCurrentQuestion(data.content || '')
      setHistory([{ role: 'ai', content: data.content || '' }])
      setPhase('answering')
      speak(data.content || '')

      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) { handleFinish(); return 0 }
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
      if (data.type === 'error') { setError(data.content); setPhase('answering'); return }
      if (data.type === 'complete') {
        handleFinish(updatedHistory)
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

  const handleFinish = async (finalHistory?: HistoryEntry[]) => {
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
      <div className="max-w-4xl mx-auto py-8 px-4">
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

  // Loading screen before first question
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
  if (phase === 'recording' || phase === 'answering' || phase === 'loading') {
    return (
      <div className="fixed inset-0 bg-gray-900 flex flex-col">
        <div className="flex-1 flex items-center justify-center relative">
          {cameraEnabled ? (
            <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
          ) : (
            <button onClick={startCamera} className="text-white text-center cursor-pointer hover:text-gray-300">
              <p className="text-6xl mb-4">🎥</p>
              <p className="text-sm">Enable Camera</p>
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

          {phase === 'loading' && (
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
