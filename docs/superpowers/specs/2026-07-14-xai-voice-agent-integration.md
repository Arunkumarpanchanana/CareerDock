# xAI Voice Agent Integration

## Overview

Replace the current turn-based voice system (Web Speech API STT + Gemini TTS) with xAI's Grok Voice Agent API for real-time voice-to-voice conversations in Career Coach and Mock Interview.

## Architecture

```
Browser                          xAI
  │                               │
  ├─ POST /api/voice/token ──────├─ POST /v1/realtime/client_secrets
  │      (get ephemeral token)    │      (returns token)
  │                               │
  ├─ WebSocket ───────────────────├─ wss://api.x.ai/v1/realtime?agent_id=...
  │   (xai-client-secret.TOKEN)   │
  │                               │
  │   input_audio_buffer.append ──┤  (PCM16 mic stream)
  │   ← response.output_audio     │  (PCM16 audio out)
  │   ← response.text             │  (transcript)
  │   ← response.function_call    │  (generate_summary / generate_feedback)
  │                               │
  └─ POST /api/* (existing) ──────┘  (function call results)
```

## Server Changes

### New: `POST /api/voice/token`
- Calls `POST https://api.x.ai/v1/realtime/client_secrets` with `XAI_API_KEY`
- Returns `{ token: string, expires_at: number }`
- Agent ID is configured per-session (coach vs interview)

## Client Changes

### New: `src/hooks/useRealtimeVoice.ts`
Shared hook for both Coach and Interview:
- **Connection lifecycle**: request token → open WebSocket → send session.update → stream audio
- **Audio capture**: getUserMedia → AudioContext → PCM16 → input_audio_buffer.append
- **Audio playback**: response.output_audio.delta → AudioBufferSourceNode
- **Transcript**: response.output_audio_transcript.delta → state
- **Function calls**: response.function_call_arguments.done → callback → response.create
- **Turn detection**: server_vad (automatic)
- **Cleanup**: close WebSocket, release mic, stop audio

### Updated: `src/components/coach/KavyaClient.tsx`
- Remove: Web Speech API, speak(), submitAnswer(), /api/career-coach conversation calls, /api/tts
- Keep: setup UI, summary display, session controls
- Use: `useRealtimeVoice` with coach agent and generate_summary function

### Updated: `src/components/interview/InterviewClient.tsx`
- Remove: Web Speech API, speak(), submitAnswer(), /api/interview conversation calls, /api/tts
- Keep: setup UI, feedback display, timer, camera, session controls
- Use: `useRealtimeVoice` with interview agent and generate_feedback function

## Data Flow

1. User clicks "Begin Conversation" / "Start Call"
2. Client fetches ephemeral token from `/api/voice/token`
3. Client opens WebSocket to xAI with token + agent_id
4. Client sends `session.update` with instructions + server_vad
5. Mic audio streams as `input_audio_buffer.append`
6. xAI detects turn end, generates response (audio + transcript)
7. Audio plays in browser, transcript shown in UI
8. On "generate_summary" / "generate_feedback" function call:
   a. Client calls existing `/api/career-coach` (summary) or `/api/interview` (feedback)
   b. Returns result via `conversation.item.create` + `response.create`
9. Session ends, WebSocket closes, summary/feedback displayed

## Error Handling
- Token fetch failure → show error, retry
- WebSocket disconnect → auto-reconnect with new token
- Mic permission denied → show text-only fallback
- Function call timeout → show error, end session

## Keys & Security
- `XAI_API_KEY` in server env vars only
- Ephemeral tokens (300s expiry) for browser connections
- No API key exposure to client
