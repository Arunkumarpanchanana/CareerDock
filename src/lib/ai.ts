const AI_API_KEY = process.env.AI_API_KEY
const AI_API_URL = process.env.AI_API_URL ?? 'https://api.openai.com/v1/chat/completions'
const AI_MODEL = process.env.AI_MODEL ?? 'gpt-4o-mini'

interface AIConfig {
  apiKey: string
  apiUrl: string
  model: string
}

function getConfig(): AIConfig | null {
  if (!AI_API_KEY) return null
  return { apiKey: AI_API_KEY, apiUrl: AI_API_URL, model: AI_MODEL }
}

const SYSTEM_PROMPTS: Record<string, string> = {
  bullets: `You are an expert resume writer. Given a job role and context, generate 3 achievement-oriented bullet points.
Each bullet must:
- Start with a strong action verb (Led, Built, Optimized, Implemented, etc.)
- Include a quantified metric or measurable outcome
- Be concise (10-20 words)
- Focus on impact and results

Return ONLY a JSON array of strings, no other text.`,

  summary: `You are an expert resume writer. Given career history and target role, generate a professional summary.
The summary should:
- Be 2-3 sentences
- Highlight key skills and experience relevant to the target role
- Include seniority level and years of experience
- End with a career goal statement

Return ONLY the summary text, no other text.`,

  rewrite: `You are an expert resume writer. Rewrite the given bullet point to be more impactful.
Improve it by:
- Using stronger action verbs
- Adding metrics or scope where possible
- Making it more concise and powerful
- Focus on achievement over responsibility

Return 3 alternative versions as a JSON array of strings, no other text.`,
}

export async function generateBullets(role: string, context: string): Promise<string[]> {
  const config = getConfig()
  if (!config) return generateFallbackBullets(role, context)

  const response = await fetch(config.apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPTS.bullets },
        { role: 'user', content: `Role: ${role}\nContext: ${context}\n\nGenerate 3 achievement bullet points.` },
      ],
      temperature: 0.7,
      max_tokens: 300,
    }),
  })

  if (!response.ok) return generateFallbackBullets(role, context)

  const data = await response.json()
  try {
    const parsed = JSON.parse(data.choices[0].message.content)
    return Array.isArray(parsed) ? parsed.slice(0, 3) : generateFallbackBullets(role, context)
  } catch {
    return generateFallbackBullets(role, context)
  }
}

export async function generateSummary(experience: string[], targetRole: string): Promise<string> {
  const config = getConfig()
  if (!config) return generateFallbackSummary(experience, targetRole)

  const history = experience.length > 0
    ? experience.join('\n')
    : 'No prior experience listed (entry-level candidate)'

  const response = await fetch(config.apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPTS.summary },
        { role: 'user', content: `Background:\n${history}\n\nTarget Role: ${targetRole}\n\nGenerate a professional summary.` },
      ],
      temperature: 0.7,
      max_tokens: 200,
    }),
  })

  if (!response.ok) return generateFallbackSummary(experience, targetRole)

  const data = await response.json()
  return data.choices[0].message.content?.trim() ?? generateFallbackSummary(experience, targetRole)
}

export async function rewriteText(text: string): Promise<string[]> {
  const config = getConfig()
  if (!config) return generateFallbackRewrites(text)

  const response = await fetch(config.apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPTS.rewrite },
        { role: 'user', content: `Original: "${text}"\n\nGenerate 3 improved versions.` },
      ],
      temperature: 0.7,
      max_tokens: 300,
    }),
  })

  if (!response.ok) return generateFallbackRewrites(text)

  const data = await response.json()
  try {
    const parsed = JSON.parse(data.choices[0].message.content)
    return Array.isArray(parsed) ? parsed.slice(0, 3) : generateFallbackRewrites(text)
  } catch {
    return generateFallbackRewrites(text)
  }
}

// Fallback generators when no AI API key is configured
function generateFallbackBullets(role: string, context: string): string[] {
  const roleLower = role.toLowerCase()
  if (roleLower.includes('engineer') || roleLower.includes('developer')) {
    return [
      `Architected and implemented scalable ${context || 'software solutions'} serving 10K+ users`,
      `Reduced system latency by 40% through optimization of ${context || 'core infrastructure'}`,
      `Led cross-functional team to deliver ${context || 'key features'} 2 weeks ahead of schedule`,
    ]
  }
  if (roleLower.includes('manager') || roleLower.includes('lead')) {
    return [
      `Led a team of ${context || '8 engineers'} to deliver 3 major product launches on schedule`,
      `Improved team velocity by 30% through implementation of ${context || 'agile best practices'}`,
      `Reduced attrition by 25% through career development programs and mentorship initiatives`,
    ]
  }
  return [
    `Drove measurable improvements in ${context || 'key business metrics'} resulting in 25% growth`,
    `Streamlined ${context || 'core processes'} reducing operational costs by 20%`,
    `Collaborated with cross-functional teams to deliver ${context || 'high-impact projects'} on time and under budget`,
  ]
}

function generateFallbackSummary(experience: string[], targetRole: string): string {
  if (experience.length === 0) {
    return `Motivated and detail-oriented candidate with a strong foundation seeking a ${targetRole} position. Quick learner with excellent problem-solving skills and a passion for delivering impactful results.`
  }
  return `Results-driven professional with proven experience in ${experience.slice(0, 2).join(', ') || 'the industry'}. Seeking a ${targetRole} position where I can leverage my skills to drive meaningful business outcomes and continue growing as a leader.`
}

function generateFallbackRewrites(text: string): string[] {
  return [
    text.replace(/^(was|were|been)\s+/i, '').replace(/^./, (c) => c.toUpperCase()),
    `Led initiatives to ${text.replace(/^(was|were|been)\s+/i, '').toLowerCase()}`,
    `Drove ${text.replace(/^(was|were|been)\s+/i, '').toLowerCase()} resulting in significant improvements`,
  ].filter((s) => s.length > 0).slice(0, 3)
}
