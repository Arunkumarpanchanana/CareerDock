# AI Mock Interview

## Overview
Full-screen video-call-style interview where AI (Gemini 2.5 Flash) interviews a
candidate based on a resume + job description. Two-phase flow: live interview,
then feedback review. Voice via Web Speech API. Camera feed displayed as self-view
for realism (not sent to AI).

## Architecture
- **Pattern:** Sequential API calls, stateless backend
- **API:** Single `POST /api/interview` with `phase: "interview"` or `"feedback"`
- **Voice:** Browser Web Speech API (SpeechRecognition for input, SpeechSynthesis for output)
- **Camera:** `getUserMedia` → `<video>` element (cosmetic only)
- **State:** `useState` holds conversation history + timer on client

## Flow
1. **Setup** — User pastes resume + job description, clicks "Start Interview"
2. **Session** — Full-screen view with camera self-view, AI question (text + voice),
   user records answer (voice → text → edit → send)
3. **Adaptive** — Gemini decides when confident. Hard cap at 25 minutes.
4. **Feedback** — Score card + verdict + strengths/gaps/suggestions

## API: POST /api/interview

### Phase 1 - Interview
```
Input:  { phase: "interview", resume, jobDescription, history }
Output: { type: "question" | "complete", content: string }
```

### Phase 2 - Feedback
```
Input:  { phase: "feedback", resume, jobDescription, history }
Output: { score, verdict, verdict_explanation, strengths, gaps, suggestions }
```

## New Files
| File | Purpose |
|------|---------|
| `src/lib/interview.ts` | System prompts, Gemini API call |
| `src/lib/interview-session.ts` | Session helpers (history, timer) |
| `src/app/api/interview/route.ts` | API route |
| `src/components/interview/InterviewClient.tsx` | Full-screen interview UI |
| `src/components/interview/InterviewFeedback.tsx` | Feedback display |
| `src/app/(protected)/interview/page.tsx` | Route page |
| `src/components/interview/__tests__/InterviewClient.test.tsx` | Tests |

## Gemini Integration
- Reuses the existing OpenAI-compatible pattern from `src/lib/ai.ts`
- Configured via `AI_API_KEY`, `AI_API_URL`, `AI_MODEL` env vars (set to Gemini endpoint)
- Uses `temperature: 0.7` for interview phase, `temperature: 0.3` for feedback
- System prompt instructs Gemini to return structured JSON only (no extra text)
