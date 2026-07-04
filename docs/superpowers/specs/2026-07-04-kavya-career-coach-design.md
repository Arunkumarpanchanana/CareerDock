# Kavya — AI Career Coach

## Overview
Full-screen voice coaching session with Kavya, a warm and thoughtful AI career coach. Helps users reflect on their career goals, explore motivations, identify strengths, and improve their job search strategy. Ends with a structured written summary of insights and action items.

## Architecture
- **Pattern:** Sequential API calls, stateless backend (same as interview)
- **API:** Single `POST /api/career-coach` with `phase: "conversation"` or `"summary"`
- **Voice:** Edge TTS (AI output) + Web Speech API SpeechRecognition (user input) — same stack as interview
- **State:** `useState` holds conversation history on client
- **UI Theme:** Warm, calm, light tones (no dark interview UI, no timer, no camera)

## Flow
1. **Setup** — Warm welcome screen. Optional: paste context (current role, goals, resume). One-tap start.
2. **Conversation** — Full-screen calm UI. Kavya asks one reflective question at a time via voice + text. User speaks response. Natural, unhurried pace. No timer. Adapts based on user answers.
3. **Summary** — AI generates structured insights: key realizations, strengths, blind spots, recommended next steps. Displayed on screen, user can copy/download.

## API: POST /api/career-coach

### Phase 1 — Conversation
```
Input:  { phase: "conversation", context: string, history: {role, content}[] }
Output: { type: "question" | "complete", content: string }
```

### Phase 2 — Summary
```
Input:  { phase: "summary", context: string, history: {role, content}[] }
Output: { insights: string[], strengths: string[], blindSpots: string[], nextSteps: string[] }
```

## New Files
| File | Purpose |
|------|---------|
| `src/lib/coach.ts` | Coaching prompts, AI conversation + summary handlers |
| `src/app/api/career-coach/route.ts` | API route (premium-gated) |
| `src/components/coach/KavyaClient.tsx` | Full-screen coaching voice UI component |
| `src/components/coach/CoachSummary.tsx` | Summary/insights display |
| `src/app/(protected)/career-coach/page.tsx` | Route page with PremiumGate |

## AI Prompt Design

### Conversation (system prompt)
Kavya persona: warm, thoughtful, calm female coach. Asks one question at a time. Questions adapt to user's previous answers. Covers: career goals, motivations, values, strengths, doubts, job search strategy. Decides when enough signal gathered and signals completion.

### Summary prompt
Generates JSON: `{ insights: string[], strengths: string[], blindSpots: string[], nextSteps: string[] }`. Structured for easy display.

## Visual Design
- **Background:** Warm light tones (e.g., soft cream/off-white) with subtle gradient
- **Avatar:** Simple circular avatar for Kavya (optional icon/emoji)
- **Text:** Kavya's questions in warm accent color, user transcript in neutral
- **Speaking indicator:** Subtle pulse animation when Kavya is speaking/listening
- **Controls:** Minimal — voice toggle, end session button
- **No timer, no camera, no urgency indicators**

## Security / Access
- Premium-gated (Premium or Premium Pro plans only) — same check as interview
- Rate-limited via existing `rateLimitByIp()`
- Auth check via `supabase.auth.getUser()`

## Data
- No new database tables for v1. Session state is client-only (React state).
- Summary is displayed on screen. Future: persist to DB.
