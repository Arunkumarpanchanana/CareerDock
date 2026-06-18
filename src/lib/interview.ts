const AI_API_KEY = process.env.AI_API_KEY
const AI_API_URL = process.env.AI_API_URL ?? 'https://api.openai.com/v1/chat/completions'
const AI_MODEL = process.env.AI_MODEL ?? 'gpt-4o-mini'

interface Message {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export function getInterviewPrompt(resume: string, jobDescription: string): string {
  return `You are a professional interviewer conducting a job interview for the following role:

Job Description:
${jobDescription}

Candidate Resume:
${resume}

Interview the candidate for this role. Ask one question at a time. Start with general questions about their background, then probe deeper into skills relevant to the role. Adapt your questions based on their answers — if they answer well, go deeper; if they struggle, pivot to related areas.

After each answer, decide if you have enough information to evaluate the candidate. When you have enough signal, respond with exactly: __INTERVIEW_COMPLETE__

Otherwise, ask the next question. Be concise — one question per response.`
}

export function getFeedbackPrompt(): string {
  return `You are an expert hiring manager reviewing an interview transcript. Evaluate the candidate based on the interview conversation.

Return a JSON object with these exact fields:
- score: number 0-100 (overall performance)
- verdict: string ("Strong fit", "Possible fit", or "Weak fit")
- verdict_explanation: string (2-3 sentences explaining the score)
- strengths: string[] (2-4 things they did well, with specific examples from the interview)
- gaps: string[] (2-4 areas where they fell short, with specific examples)
- suggestions: string[] (2-4 actionable recommendations to improve)

Be honest and specific. Base your evaluation on actual answers given, not the resume.

Return ONLY valid JSON, no other text.`
}

export function parseInterviewResponse(content: string): { type: 'question' | 'complete'; content?: string } {
  if (content.includes('__INTERVIEW_COMPLETE__')) {
    return { type: 'complete' }
  }
  return { type: 'question', content }
}

export async function callGemini(messages: Message[], temperature = 0.7): Promise<string | null> {
  if (!AI_API_KEY) return null

  try {
    const response = await fetch(AI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages,
        temperature,
        max_tokens: 500,
      }),
    })

    if (!response.ok) return null

    const data = await response.json()
    return data.choices?.[0]?.message?.content?.trim() ?? null
  } catch {
    return null
  }
}

export async function handleInterviewTurn(params: {
  resume: string
  jobDescription: string
  history: { role: 'ai' | 'user'; content: string }[]
}): Promise<{ type: 'question' | 'complete'; content?: string }> {
  const messages: Message[] = [
    { role: 'system', content: getInterviewPrompt(params.resume, params.jobDescription) },
  ]

  for (const entry of params.history) {
    messages.push({ role: entry.role === 'ai' ? 'assistant' : 'user', content: entry.content })
  }

  const response = await callGemini(messages)
  if (!response) return { type: 'question', content: 'Could you tell me more about your experience?' }
  return parseInterviewResponse(response)
}

export async function handleFeedback(params: {
  resume: string
  jobDescription: string
  history: { role: 'ai' | 'user'; content: string }[]
}): Promise<{
  score: number
  verdict: string
  verdict_explanation: string
  strengths: string[]
  gaps: string[]
  suggestions: string[]
} | null> {
  const transcript = params.history
    .map((h) => `${h.role === 'ai' ? 'Interviewer' : 'Candidate'}: ${h.content}`)
    .join('\n')

  const messages: Message[] = [
    { role: 'system', content: getFeedbackPrompt() },
    {
      role: 'user',
      content: `Job Description:\n${params.jobDescription}\n\nResume:\n${params.resume}\n\nInterview Transcript:\n${transcript}\n\nEvaluate the candidate.`,
    },
  ]

  const response = await callGemini(messages, 0.3)
  if (!response) return null

  try {
    const parsed = JSON.parse(response)
    return {
      score: Math.max(0, Math.min(100, parsed.score ?? 50)),
      verdict: parsed.verdict || 'Possible fit',
      verdict_explanation: parsed.verdict_explanation || '',
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      gaps: Array.isArray(parsed.gaps) ? parsed.gaps : [],
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
    }
  } catch {
    return null
  }
}
