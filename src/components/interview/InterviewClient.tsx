'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRealtimeVoice } from '@/hooks/useRealtimeVoice'

interface HistoryEntry {
  role: 'user' | 'assistant'
  content: string
}

type Phase = 'setup' | 'session' | 'connecting' | 'feedback'

interface FeedbackResult {
  score: number
  verdict: string
  verdict_explanation: string
  strengths: string[]
  gaps: string[]
  suggestions: string[]
}

const INTERVIEW_DURATION = 25 * 60

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
  const [feedback, setFeedback] = useState<FeedbackResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState(INTERVIEW_DURATION)
  const [showCamera, setShowCamera] = useState(false)
  const [displayText, setDisplayText] = useState('')
  const [connectingMsg, setConnectingMsg] = useState('')

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const resumeRef = useRef(resume)
  const jobDescriptionRef = useRef(jobDescription)
  const historyRef = useRef<HistoryEntry[]>([])
  const feedbackGeneratedRef = useRef(false)

  useEffect(() => {
    resumeRef.current = resume
  }, [resume])
  useEffect(() => {
    jobDescriptionRef.current = jobDescription
  }, [jobDescription])

  const instructions = `You are a professional interviewer conducting a job interview for the following role:

Job Description:
${jobDescription}

Candidate Resume:
${resume}

Interview the candidate for this role. Ask one question at a time. Start with general questions about their background, then probe deeper into skills relevant to the role. Adapt your questions based on their answers — if they answer well, go deeper; if they struggle, pivot to related areas.

When you have enough information to evaluate the candidate, call the generate_interview_feedback function to end the interview. Be concise — one question per response.`

  const { status, start, stop, sendFunctionResult, aiTranscript, userTranscript, isAiSpeaking, history } =
    useRealtimeVoice({
      agentId: 'agent_Lkbete4zcv7fCdJ8',
      instructions,
      initialMessage: 'Begin the interview.',
      functions: [
        {
          name: 'generate_interview_feedback',
          description:
            'Call this when you have enough information to evaluate the candidate and end the interview.',
          parameters: { type: 'object', properties: {}, required: [] },
        },
      ],
      onFunctionCall: async (name, callId) => {
        if (name === 'generate_interview_feedback' && !feedbackGeneratedRef.current) {
          feedbackGeneratedRef.current = true
          await generateFeedback()
          sendFunctionResult(callId, { success: true })
          cleanup()
        }
      },
      onError: (err) => {
        setError(err)
        setPhase('setup')
      },
    })

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

  const generateFeedback = useCallback(async () => {
    setPhase('connecting')
    setConnectingMsg('Generating feedback...')
    const historyForApi = historyRef.current.map((h) => ({
      role: h.role === 'assistant' ? 'ai' as const : 'user' as const,
      content: h.content,
    }))
    try {
      const res = await fetch('/api/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phase: 'feedback',
          resume: resumeRef.current,
          jobDescription: jobDescriptionRef.current,
          history: historyForApi,
        }),
      })
      if (res.ok) {
        setFeedback(await res.json())
        setPhase('feedback')
      } else {
        setError('Failed to generate feedback.')
        setPhase('setup')
      }
    } catch {
      setError('Failed to generate feedback.')
      setPhase('setup')
    }
  }, [])

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    stop()
  }, [stop])

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      }
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

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

  const startCall = async () => {
    if (!resume.trim() || !jobDescription.trim()) return
    setError(null)
    feedbackGeneratedRef.current = false
    setPhase('connecting')
    setConnectingMsg('Connecting...')

    try {
      await start()
      setTimeLeft(INTERVIEW_DURATION)
      timerRef.current = setInterval(() => setTimeLeft((t) => Math.max(0, t - 1)), 1000)
      setPhase('session')
    } catch {
      setError('Failed to start interview.')
      setPhase('setup')
    }
  }

  // Timer expiry: generate feedback directly
  useEffect(() => {
    if (timeLeft <= 0 && phase === 'session' && !feedbackGeneratedRef.current) {
      feedbackGeneratedRef.current = true
      cleanup()
      generateFeedback()
    }
  }, [timeLeft, phase, cleanup, generateFeedback])

  const endCall = () => {
    cleanup()
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
            disabled={!resume.trim() || !jobDescription.trim() || status === 'connecting'}
            className="px-6 py-3 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {status === 'connecting' ? 'Connecting...' : 'Start Call →'}
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
        <p className="text-white text-sm">{connectingMsg}</p>
      </div>
    )
  }

  // Active session
  if (phase === 'session') {
    return (
      <div className="fixed inset-0 bg-gray-900 flex flex-col">
        {showCamera && (
          <div className="absolute top-4 right-4 z-10 w-32 h-24 rounded-lg overflow-hidden border-2 border-gray-700 shadow-lg">
            <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
          </div>
        )}

        <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm font-mono z-20">
          {formatTime(timeLeft)}
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <Avatar label={isAiSpeaking ? 'Interviewer' : 'You'} speaking={isAiSpeaking} />

          <div className="mt-6 max-w-xl text-center">
            <p className={`text-lg leading-relaxed ${isAiSpeaking ? 'text-white' : 'text-gray-200'}`}>
              {displayText || (isAiSpeaking ? 'Preparing question...' : 'Listening...')}
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
          <button
            onClick={() => {
              setPhase('setup')
              setError(null)
            }}
            className="text-blue-600 underline mt-4"
          >
            Try again
          </button>
        </div>
      )
    }

    const scoreColor = feedback.score >= 70 ? 'text-green-600' : feedback.score >= 40 ? 'text-amber-600' : 'text-red-600'
    const scoreBg =
      feedback.score >= 70
        ? 'bg-green-50 border-green-200'
        : feedback.score >= 40
          ? 'bg-amber-50 border-amber-200'
          : 'bg-red-50 border-red-200'

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
            onClick={() => {
              setPhase('setup')
              setFeedback(null)
              setTimeLeft(INTERVIEW_DURATION)
              feedbackGeneratedRef.current = false
            }}
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
