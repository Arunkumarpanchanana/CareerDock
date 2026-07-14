'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

type Status = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error'

interface HistoryEntry {
  role: 'user' | 'assistant'
  content: string
}

interface RealtimeFunction {
  name: string
  description: string
  parameters: Record<string, unknown>
}

interface UseRealtimeVoiceOptions {
  agentId: string
  instructions: string
  functions?: RealtimeFunction[]
  initialMessage?: string
  onFunctionCall?: (name: string, callId: string, args: Record<string, unknown>) => void
  onStatusChange?: (status: Status) => void
  onError?: (error: string) => void
}

interface UseRealtimeVoiceReturn {
  status: Status
  start: () => Promise<void>
  stop: () => void
  sendText: (text: string) => void
  sendFunctionResult: (callId: string, result: unknown) => void
  aiTranscript: string
  userTranscript: string
  isAiSpeaking: boolean
  history: HistoryEntry[]
}

export function useRealtimeVoice(options: UseRealtimeVoiceOptions): UseRealtimeVoiceReturn {
  const [status, setStatus] = useState<Status>('idle')
  const [aiTranscript, setAiTranscript] = useState('')
  const [userTranscript, setUserTranscript] = useState('')
  const [isAiSpeaking, setIsAiSpeaking] = useState(false)
  const [history, setHistory] = useState<HistoryEntry[]>([])

  const wsRef = useRef<WebSocket | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const micStreamRef = useRef<MediaStream | null>(null)
  const processorRef = useRef<ScriptProcessorNode | null>(null)
  const gainNodeRef = useRef<GainNode | null>(null)
  const isActiveRef = useRef(false)
  const currentAiTextRef = useRef('')
  const historyRef = useRef<HistoryEntry[]>([])
  const aiTranscriptRef = useRef('')
  const scheduledTimeRef = useRef(0)

  const updateStatus = useCallback(
    (s: Status) => {
      setStatus(s)
      options.onStatusChange?.(s)
    },
    [options.onStatusChange],
  )

  const stop = useCallback(() => {
    isActiveRef.current = false

    if (processorRef.current && audioCtxRef.current) {
      try {
        processorRef.current.disconnect()
      } catch {}
      processorRef.current = null
    }

    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop())
      micStreamRef.current = null
    }

    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close().catch(() => {})
      audioCtxRef.current = null
    }

    if (wsRef.current) {
      try {
        wsRef.current.close()
      } catch {}
      wsRef.current = null
    }

    scheduledTimeRef.current = 0
    currentAiTextRef.current = ''
    aiTranscriptRef.current = ''
    setAiTranscript('')
    setUserTranscript('')
    setIsAiSpeaking(false)
    updateStatus('disconnected')
  }, [updateStatus])

  const sendText = useCallback((text: string) => {
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return
    ws.send(
      JSON.stringify({
        type: 'conversation.item.create',
        item: {
          type: 'message',
          role: 'user',
          content: [{ type: 'input_text', text }],
        },
      }),
    )
    ws.send(JSON.stringify({ type: 'response.create' }))
  }, [])

  const sendFunctionResult = useCallback((callId: string, result: unknown) => {
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return
    ws.send(
      JSON.stringify({
        type: 'conversation.item.create',
        item: { type: 'function_call_output', call_id: callId, output: JSON.stringify(result) },
      }),
    )
  }, [])

  const start = useCallback(async () => {
    if (isActiveRef.current) return
    isActiveRef.current = true
    updateStatus('connecting')

    try {
      const tokenRes = await fetch('/api/voice/token', { method: 'POST' })
      if (!tokenRes.ok) {
        const errBody = await tokenRes.json().catch(() => ({ error: 'Token fetch failed' }))
        throw new Error(errBody.error || 'Token fetch failed')
      }
      const { token } = await tokenRes.json()
      if (!token) throw new Error('No token received')

      const url = `wss://api.x.ai/v1/realtime?agent_id=${options.agentId}`
      const ws = new WebSocket(url, [`xai-client-secret.${token}`])

      ws.onopen = () => {
        wsRef.current = ws

        ws.send(
          JSON.stringify({
            type: 'session.update',
            session: {
              instructions: options.instructions,
              turn_detection: { type: 'server_vad' },
              audio: {
                input: { format: { type: 'audio/pcm', rate: 24000 } },
                output: { format: { type: 'audio/pcm', rate: 24000 } },
              },
              ...(options.functions && options.functions.length > 0
                ? {
                    tools: options.functions.map((f) => ({ type: 'function', ...f })),
                  }
                : {}),
            },
          }),
        )

        if (options.initialMessage) {
          ws.send(
            JSON.stringify({
              type: 'conversation.item.create',
              item: {
                type: 'message',
                role: 'user',
                content: [{ type: 'input_text', text: options.initialMessage }],
              },
            }),
          )
          ws.send(JSON.stringify({ type: 'response.create' }))
        }

        updateStatus('connected')
      }

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data)

        switch (msg.type) {
          case 'session.created':
          case 'session.updated':
          case 'conversation.created':
          case 'response.created':
          case 'input_audio_buffer.speech_stopped':
            break

          case 'input_audio_buffer.speech_started': {
            setIsAiSpeaking(false)
            currentAiTextRef.current = ''
            setAiTranscript('')
            scheduledTimeRef.current = 0
            break
          }

          case 'conversation.item.created': {
            const item = msg.item
            if (item.type === 'message' && item.role === 'user') {
              const text = item.content?.find(
                (c: { type: string }) => c.type === 'input_audio_transcript',
              )?.transcript
              if (text) {
                setUserTranscript(text)
                const updated = [...historyRef.current, { role: 'user' as const, content: text }]
                historyRef.current = updated
                setHistory(updated)
              }
            } else if (item.type === 'message' && item.role === 'assistant') {
              const text = item.content?.find(
                (c: { type: string }) => c.type === 'text' || c.type === 'output_text',
              )?.text
              if (text) {
                const updated = [...historyRef.current, { role: 'assistant' as const, content: text }]
                historyRef.current = updated
                setHistory(updated)
              }
            }
            break
          }

          case 'response.output_audio.delta': {
            setIsAiSpeaking(true)
            playAudioChunk(msg.delta)
            break
          }

          case 'response.output_audio_transcript.delta': {
            currentAiTextRef.current += msg.delta
            aiTranscriptRef.current = currentAiTextRef.current
            setAiTranscript(currentAiTextRef.current)
            break
          }

          case 'response.output_audio_transcript.done': {
            const finalText = msg.transcript || currentAiTextRef.current
            currentAiTextRef.current = finalText
            aiTranscriptRef.current = finalText
            setAiTranscript(finalText)
            break
          }

          case 'response.done': {
            setIsAiSpeaking(false)
            break
          }

          case 'response.function_call_arguments.done': {
            options.onFunctionCall?.(msg.name, msg.call_id, JSON.parse(msg.arguments || '{}'))
            break
          }

          case 'error': {
            const errMsg = msg.error?.message || msg.message || 'Unknown error'
            options.onError?.(errMsg)
            break
          }
        }
      }

      ws.onerror = () => {
        options.onError?.('WebSocket connection error')
        updateStatus('error')
        isActiveRef.current = false
      }

      ws.onclose = () => {
        wsRef.current = null
        if (isActiveRef.current) {
          updateStatus('disconnected')
        }
      }

      // Start mic capture
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      micStreamRef.current = stream

      const audioCtx = new AudioContext({ sampleRate: 24000 })
      audioCtxRef.current = audioCtx

      const source = audioCtx.createMediaStreamSource(stream)
      const gainNode = audioCtx.createGain()
      gainNode.gain.value = 1
      gainNodeRef.current = gainNode
      source.connect(gainNode)
      gainNode.connect(audioCtx.destination)

      const processor = audioCtx.createScriptProcessor(4096, 1, 1)
      processor.onaudioprocess = (e) => {
        const w = wsRef.current
        if (!w || w.readyState !== WebSocket.OPEN) return
        const input = e.inputBuffer.getChannelData(0)
        const pcm16 = new Int16Array(input.length)
        for (let i = 0; i < input.length; i++) {
          const s = Math.max(-1, Math.min(1, input[i]))
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff
        }
        const bytes = new Uint8Array(pcm16.buffer)
        let binary = ''
        for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
        w.send(JSON.stringify({ type: 'input_audio_buffer.append', audio: btoa(binary) }))
      }
      gainNode.connect(processor)
      processor.connect(audioCtx.destination)
      processorRef.current = processor
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error'
      options.onError?.(msg)
      updateStatus('error')
      isActiveRef.current = false
      throw e
    }
  }, [options.agentId, options.instructions, options.functions, options.initialMessage, options.onFunctionCall, options.onError, updateStatus])

  const playAudioChunk = useCallback((base64PCM16: string) => {
    const ctx = audioCtxRef.current
    if (!ctx || ctx.state === 'closed') return

    try {
      const binary = atob(base64PCM16)
      const bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
      const pcm16 = new Int16Array(bytes.buffer)
      const float32 = new Float32Array(pcm16.length)
      for (let i = 0; i < pcm16.length; i++) float32[i] = pcm16[i] / 32768.0

      const buffer = ctx.createBuffer(1, float32.length, 24000)
      buffer.copyToChannel(float32, 0)

      const now = ctx.currentTime
      if (scheduledTimeRef.current < now) scheduledTimeRef.current = now

      const source = ctx.createBufferSource()
      source.buffer = buffer
      source.connect(gainNodeRef.current || ctx.destination)
      source.start(scheduledTimeRef.current)
      scheduledTimeRef.current += buffer.duration
    } catch {}
  }, [])

  useEffect(() => {
    return () => {
      if (isActiveRef.current) stop()
    }
  }, [stop])

  return {
    status,
    start,
    stop,
    sendText,
    sendFunctionResult,
    aiTranscript,
    userTranscript,
    isAiSpeaking,
    history,
  }
}
