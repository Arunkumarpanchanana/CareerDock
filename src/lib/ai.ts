const AI_API_KEY = process.env.AI_API_KEY
const AI_API_URL = process.env.AI_API_URL ?? 'https://api.openai.com/v1/chat/completions'
const AI_MODEL = process.env.AI_MODEL ?? 'gpt-4o-mini'

const AI_FALLBACK_KEY = process.env.AI_FALLBACK_API_KEY
const AI_FALLBACK_URL = process.env.AI_FALLBACK_API_URL ?? 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions'
const AI_FALLBACK_MODEL = process.env.AI_FALLBACK_MODEL ?? 'gemini-2.0-flash'

export async function callAI(
  messages: { role: string; content: string }[],
  temperature: number,
  maxTokens: number
): Promise<string | null> {
  const tryProvider = async (key: string, url: string, model: string): Promise<string | null> => {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
      body: JSON.stringify({ model, messages, temperature, max_tokens: maxTokens }),
    })
    if (!response.ok) return null
    const data = await response.json()
    return data.choices?.[0]?.message?.content?.trim() ?? null
  }

  if (AI_API_KEY) {
    try {
      const result = await tryProvider(AI_API_KEY, AI_API_URL, AI_MODEL)
      if (result) return result
    } catch (e) {
      console.error('Primary AI API failed:', e)
    }
  }

  if (AI_FALLBACK_KEY) {
    try {
      const result = await tryProvider(AI_FALLBACK_KEY, AI_FALLBACK_URL, AI_FALLBACK_MODEL)
      if (result) return result
    } catch (e) {
      console.error('Fallback AI API failed:', e)
    }
  }

  if (AI_API_KEY) {
    try {
      const result = await tryProvider(AI_API_KEY, AI_API_URL, AI_MODEL)
      if (result) return result
    } catch (e) {
      console.error('Primary retry AI API failed:', e)
    }
  }

  return null
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

  skillGap: `You are an expert recruitment analyst. Given a resume and job description, analyze the fit.

Return a JSON object with these exact fields:
- score: number 0-100 (overall match score)
- verdict: string ("Strong fit", "Possible fit", or "Weak fit")
- verdict_explanation: string (2-3 sentences explaining the score)
- strengths: string[] (2-4 specific skills or experiences from the resume that match the JD)
- gaps: string[] (2-4 specific areas where the resume falls short)
- missing_keywords: string[] (8-15 specific keywords from the JD not found in the resume)
- suggestions: string[] (2-4 actionable steps to close the gaps)

Be honest and specific. Base strengths on actual matches, gaps on real deficiencies.

Return ONLY valid JSON, no other text.`,

  coverLetter: `You are an expert cover letter writer. Given a resume summary and a job description, generate a professional cover letter.

The cover letter should:
- Be 3-4 paragraphs
- Start with a compelling opening expressing interest in the role and company
- Highlight 2-3 key qualifications from the resume that match the job requirements
- Include specific skills and experience relevant to the position
- End with a confident closing and call to action
- Be written in first person
- Sound natural and professional, not like a template

Return ONLY the letter text, no other text.`,
}

export async function generateBullets(role: string, context: string): Promise<string[]> {
  const content = await callAI(
    [
      { role: 'system', content: SYSTEM_PROMPTS.bullets },
      { role: 'user', content: `Role: ${role}\nContext: ${context}\n\nGenerate 3 achievement bullet points.` },
    ],
    0.7,
    300
  )
  if (!content) {
    if (AI_API_KEY || AI_FALLBACK_KEY) throw new Error('AI servers are busy, please try again after sometime')
    return generateFallbackBullets(role, context)
  }

  try {
    const parsed = JSON.parse(content)
    return Array.isArray(parsed) ? parsed.slice(0, 3) : generateFallbackBullets(role, context)
  } catch {
    if (AI_API_KEY || AI_FALLBACK_KEY) throw new Error('AI servers are busy, please try again after sometime')
    return generateFallbackBullets(role, context)
  }
}

export async function generateSummary(experience: string[], targetRole: string): Promise<string> {
  const history = experience.length > 0
    ? experience.join('\n')
    : 'No prior experience listed (entry-level candidate)'

  const content = await callAI(
    [
      { role: 'system', content: SYSTEM_PROMPTS.summary },
      { role: 'user', content: `Background:\n${history}\n\nTarget Role: ${targetRole}\n\nGenerate a professional summary.` },
    ],
    0.7,
    200
  )
  if (!content) {
    if (AI_API_KEY || AI_FALLBACK_KEY) throw new Error('AI servers are busy, please try again after sometime')
    return generateFallbackSummary(experience, targetRole)
  }

  return content
}

export async function rewriteText(text: string): Promise<string[]> {
  const content = await callAI(
    [
      { role: 'system', content: SYSTEM_PROMPTS.rewrite },
      { role: 'user', content: `Original: "${text}"\n\nGenerate 3 improved versions.` },
    ],
    0.7,
    300
  )
  if (!content) {
    if (AI_API_KEY || AI_FALLBACK_KEY) throw new Error('AI servers are busy, please try again after sometime')
    return generateFallbackRewrites(text)
  }

  try {
    const parsed = JSON.parse(content)
    return Array.isArray(parsed) ? parsed.slice(0, 3) : generateFallbackRewrites(text)
  } catch {
    if (AI_API_KEY || AI_FALLBACK_KEY) throw new Error('AI servers are busy, please try again after sometime')
    return generateFallbackRewrites(text)
  }
}

export async function generateCoverLetter(params: {
  resume: string
  jobTitle: string
  company: string
  jobDescription: string
}): Promise<string> {
  const content = await callAI(
    [
      { role: 'system', content: SYSTEM_PROMPTS.coverLetter },
      {
        role: 'user',
        content: `Resume: ${params.resume}\n\nJob Title: ${params.jobTitle}\nCompany: ${params.company}\n\nJob Description: ${params.jobDescription || 'No specific description provided.'}\n\nGenerate a professional cover letter.`,
      },
    ],
    0.7,
    500
  )
  if (!content) {
    if (AI_API_KEY || AI_FALLBACK_KEY) throw new Error('AI servers are busy, please try again after sometime')
    return generateFallbackCoverLetter(params)
  }

  return content
}

export async function analyzeSkillGap(params: {
  resume: string
  jobTitle: string
  jobDescription: string
}): Promise<{
  score: number
  verdict: string
  verdict_explanation: string
  strengths: string[]
  gaps: string[]
  missingKeywords: string[]
  suggestions: string[]
}> {
  const content = await callAI(
    [
      { role: 'system', content: SYSTEM_PROMPTS.skillGap },
      {
        role: 'user',
        content: `Job Title: ${params.jobTitle}\n\nJob Description:\n${params.jobDescription}\n\nResume:\n${params.resume}\n\nAnalyze the fit.`,
      },
    ],
    0.3,
    800
  )
  if (!content) {
    if (AI_API_KEY || AI_FALLBACK_KEY) throw new Error('AI servers are busy, please try again after sometime')
    return generateFallbackSkillGap(params)
  }

  try {
    const parsed = JSON.parse(content)
    return {
      score: Math.max(0, Math.min(100, parsed.score ?? 50)),
      verdict: parsed.verdict || 'Possible fit',
      verdict_explanation: parsed.verdict_explanation || '',
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      gaps: Array.isArray(parsed.gaps) ? parsed.gaps : [],
      missingKeywords: Array.isArray(parsed.missing_keywords) ? parsed.missing_keywords : [],
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
    }
  } catch {
    if (AI_API_KEY || AI_FALLBACK_KEY) throw new Error('AI servers are busy, please try again after sometime')
    return generateFallbackSkillGap(params)
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

function generateFallbackCoverLetter(params: {
  resume: string
  jobTitle: string
  company: string
  jobDescription: string
}): string {
  const date = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return `${date}

Dear Hiring Manager at ${params.company},

I am writing to express my strong interest in the ${params.jobTitle} position at ${params.company}. With my background in ${params.resume.slice(0, 100)}, I am confident that I would be a valuable addition to your team.

${params.jobDescription ? `Your requirement for a ${params.jobTitle} aligns perfectly with my experience. ${params.resume.slice(0, 150)} I am eager to bring these skills to ${params.company} and contribute to your continued success.` : `Based on my experience, I believe I am well-positioned to excel in this role and make meaningful contributions to ${params.company}'s team.`}

I am particularly drawn to ${params.company} because of your reputation for innovation and excellence in the industry. I would welcome the opportunity to discuss how my experience and skills can benefit your organization.

Thank you for considering my application. I look forward to the possibility of discussing this opportunity further.

Sincerely,
[Your Name]`
}

const COMMON_SKILLS = [
  'react', 'angular', 'vue', 'node', 'typescript', 'javascript', 'python', 'java',
  'go', 'rust', 'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'sql', 'mongodb',
  'postgresql', 'redis', 'graphql', 'rest', 'api', 'microservices', 'ci/cd',
  'git', 'agile', 'scrum', 'machine learning', 'ai', 'data science', 'devops',
  'leadership', 'management', 'communication', 'team building', 'strategy',
]

function generateFallbackSkillGap(params: {
  resume: string
  jobTitle: string
  jobDescription: string
}): {
  score: number
  verdict: string
  verdict_explanation: string
  strengths: string[]
  gaps: string[]
  missingKeywords: string[]
  suggestions: string[]
} {
  const resumeLower = params.resume.toLowerCase()
  const jdLower = params.jobDescription.toLowerCase()

  if (!params.resume.trim() || !params.jobDescription.trim()) {
    return {
      score: 0,
      verdict: 'Insufficient data',
      verdict_explanation: 'Provide both resume and job description for analysis.',
      strengths: [],
      gaps: [],
      missingKeywords: [],
      suggestions: ['Paste your resume and the job description to get started.'],
    }
  }

  const matched: string[] = []
  const missing: string[] = []

  for (const skill of COMMON_SKILLS) {
    const inResume = resumeLower.includes(skill)
    const inJD = jdLower.includes(skill)
    if (inResume && inJD) matched.push(skill)
    else if (inJD && !inResume) missing.push(skill)
  }

  const score = matched.length + missing.length > 0
    ? Math.round((matched.length / (matched.length + missing.length)) * 100)
    : 50

  const strengths = matched.length > 0
    ? matched.slice(0, 4).map((s) => `Your experience with ${s} aligns with this role's requirements.`)
    : ['Your resume shows general qualifications. Consider highlighting specific skills from the job description.']

  const gaps = missing.length > 0
    ? missing.slice(0, 4).map((s) => `The role mentions ${s}, which isn't evident in your resume.`)
    : ['No major skill gaps detected based on keyword analysis.']

  let verdict: string
  let explanation: string
  if (score >= 70) {
    verdict = 'Strong fit'
    explanation = `Your resume matches ${matched.length} key requirements for ${params.jobTitle || 'this role'}. Highlight your strongest matches in your application.`
  } else if (score >= 40) {
    verdict = 'Possible fit'
    explanation = `Your resume covers ${matched.length} of ${matched.length + missing.length} identified requirements for ${params.jobTitle || 'this role'}. Consider addressing the gaps below.`
  } else {
    verdict = 'Weak fit'
    explanation = `Your resume only matches ${matched.length} of ${matched.length + missing.length} key requirements. You may need to gain experience in the missing areas.`
  }

  const suggestions = missing.slice(0, 3).map((s) =>
    `Gain experience with ${s} through projects, certifications, or coursework to strengthen your application.`
  )
  if (suggestions.length === 0) {
    suggestions.push('Tailor your resume to emphasize the specific skills and experiences mentioned in the job description.')
  }

  return {
    score,
    verdict,
    verdict_explanation: explanation,
    strengths,
    gaps,
    missingKeywords: missing.slice(0, 15),
    suggestions,
  }
}
