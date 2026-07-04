import { callAI } from './ai'

interface Message {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface HistoryEntry {
  role: 'ai' | 'user'
  content: string
}

const COMPLETE_SIGNAL = '__COACHING_COMPLETE__'

export function getCoachingPrompt(context: string): string {
  return `You are Kavya, a warm, thoughtful, and calm female career coach. Your voice is gentle and supportive. You help people reflect on their career journey with curiosity and compassion.

Your goal is to guide a thoughtful conversation. Ask ONE question at a time. Listen to their answer and ask a follow-up that goes deeper. Cover these areas naturally as the conversation unfolds:
- Their current career situation and what brought them here
- What matters most to them in their work (values, motivations)
- Their strengths and what they're proud of
- What doubts or fears they're sitting with
- What they envision for their future
- How their job search is going, and where they feel stuck
- How they can use the tools available (resume builder, skill gap analysis, job tracker, mock interviews) to move forward

Adapt to whatever they share. Don't rush. Don't lecture. Be present.

When you feel you have enough understanding to offer meaningful guidance, respond with exactly: ${COMPLETE_SIGNAL} followed by a brief, warm closing message.

${context ? `\nThe user shared this about themselves:\n${context}` : ''}`
}

export function getCoachingSummaryPrompt(): string {
  return `You are Kavya, a warm career coach summarizing a coaching conversation.

Return a JSON object with these exact fields:
- insights: string[] (3-5 key realizations or themes that emerged from the conversation)
- strengths: string[] (2-4 strengths the person identified or demonstrated)
- blindSpots: string[] (2-3 areas they could explore further or patterns worth noticing)
- nextSteps: string[] (3-4 actionable suggestions, including how MyCareerDock tools can help)

Be warm, specific, and insightful. Base everything on the actual conversation.

Return ONLY valid JSON, no other text.`
}

export function parseCoachingResponse(content: string): { type: 'question' | 'complete' | 'error'; content?: string } {
  if (content.includes(COMPLETE_SIGNAL)) {
    const remaining = content.replace(COMPLETE_SIGNAL, '').trim()
    return { type: 'complete', content: remaining || undefined }
  }
  return { type: 'question', content }
}

export async function handleCoachingTurn(params: {
  context: string
  history: HistoryEntry[]
}): Promise<{ type: 'question' | 'complete' | 'error'; content?: string }> {
  const messages: Message[] = [
    { role: 'system', content: getCoachingPrompt(params.context) },
  ]

  for (const entry of params.history) {
    messages.push({ role: entry.role === 'ai' ? 'assistant' : 'user', content: entry.content })
  }

  if (messages.length === 1) {
    messages.push({ role: 'user', content: 'I\'m ready to begin our coaching conversation.' })
  }

  const response = await callAI(messages, 0.7, 800)
  if (!response) return { type: 'error', content: 'AI service unavailable. Please try again.' }
  return parseCoachingResponse(response)
}

export async function handleCoachingSummary(params: {
  context: string
  history: HistoryEntry[]
}): Promise<{
  insights: string[]
  strengths: string[]
  blindSpots: string[]
  nextSteps: string[]
} | null> {
  const transcript = params.history
    .map((h) => `${h.role === 'ai' ? 'Kavya' : 'User'}: ${h.content}`)
    .join('\n')

  const messages: Message[] = [
    { role: 'system', content: getCoachingSummaryPrompt() },
    {
      role: 'user',
      content: `Context: ${params.context || 'No additional context'}\n\nConversation:\n${transcript}\n\nGenerate the coaching summary.`,
    },
  ]

  const response = await callAI(messages, 0.3, 1000)
  if (!response) return null

  return extractCoachingJson(response)
}

function extractCoachingJson(text: string): {
  insights: string[]
  strengths: string[]
  blindSpots: string[]
  nextSteps: string[]
} | null {
  const jsonBlock = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  const target = jsonBlock ? jsonBlock[1] : text

  try {
    const parsed = JSON.parse(target)
    return {
      insights: Array.isArray(parsed.insights) ? parsed.insights : [],
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      blindSpots: Array.isArray(parsed.blindSpots) ? parsed.blindSpots : [],
      nextSteps: Array.isArray(parsed.nextSteps) ? parsed.nextSteps : [],
    }
  } catch {
    const braceMatch = target.match(/\{[\s\S]*\}/)
    if (!braceMatch) return null
    const cleaned = braceMatch[0].replace(/,\s*}/g, '}').replace(/,\s*]/g, ']')
    try {
      const parsed = JSON.parse(cleaned)
      return {
        insights: Array.isArray(parsed.insights) ? parsed.insights : [],
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
        blindSpots: Array.isArray(parsed.blindSpots) ? parsed.blindSpots : [],
        nextSteps: Array.isArray(parsed.nextSteps) ? parsed.nextSteps : [],
      }
    } catch {
      return null
    }
  }
}
