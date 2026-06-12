import type { ResumeFormData } from './resume'

export interface ATSIssue {
  type: 'keyword' | 'formatting' | 'content' | 'missing'
  severity: 'error' | 'warning' | 'info'
  message: string
  section?: string
  suggestion?: string
}

export interface ATSScore {
  overall: number
  keywordMatch: number
  formatting: number
  contentQuality: number
  length: number
  issues: ATSIssue[]
}

const ACTION_VERBS = new Set([
  'led', 'built', 'developed', 'designed', 'implemented', 'optimized', 'architected',
  'managed', 'delivered', 'created', 'launched', 'drove', 'established', 'reduced',
  'improved', 'increased', 'generated', 'transformed', 'negotiated', 'mentored',
  'coached', 'spearheaded', 'championed', 'orchestrated', 'pioneered', 'streamlined',
  'accelerated', 'expanded', 'consolidated', 'reorganized', 'restructured',
])

const BUZZWORDS = new Set([
  'synergy', 'synergize', 'rockstar', 'ninja', 'guru', 'thought leader',
  'hardworking', 'go-getter', 'team player', 'self-starter', 'detail-oriented',
  'results-driven', 'proactive', 'dynamic', 'motivated', 'passionate',
])

const STANDARD_HEADINGS = [
  'experience', 'work experience', 'professional experience',
  'education', 'academic background',
  'skills', 'core competencies', 'technical skills',
  'projects', 'professional projects',
  'certificates', 'certifications', 'professional certifications',
  'summary', 'professional summary', 'executive summary',
]

export function checkFormatting(resume: ResumeFormData, _persona: string = 'professional'): ATSIssue[] {
  const issues: ATSIssue[] = []

  // Check for empty sections
  if (!resume.summary) {
    issues.push({
      type: 'missing',
      severity: 'warning',
      message: 'No professional summary provided',
      section: 'Summary',
      suggestion: 'Add a 2-3 sentence summary highlighting your key qualifications and career goals.',
    })
  }

  if (resume.experience.length === 0) {
    issues.push({
      type: 'missing',
      severity: 'warning',
      message: 'No work experience listed',
      section: 'Experience',
      suggestion: 'Add your work history. For entry-level positions, include internships and part-time work.',
    })
  }

  // Check for bullet points with action verbs
  let totalBullets = 0
  let bulletsWithVerbs = 0
  for (const exp of resume.experience) {
    for (const bullet of exp.bullets) {
      const firstWord = bullet.trim().toLowerCase().split(/\s+/)[0]
      if (ACTION_VERBS.has(firstWord)) bulletsWithVerbs++
      totalBullets++
    }
  }

  if (totalBullets > 0 && bulletsWithVerbs / totalBullets < 0.5) {
    issues.push({
      type: 'content',
      severity: 'warning',
      message: 'Less than 50% of bullet points start with strong action verbs',
      section: 'Experience',
      suggestion: 'Start bullets with action verbs like "Led", "Built", "Optimized", "Implemented".',
    })
  }

  // Check for quantified metrics
  let quantifiedBullets = 0
  for (const exp of resume.experience) {
    for (const bullet of exp.bullets) {
      if (/\d+/.test(bullet)) quantifiedBullets++
    }
  }

  if (totalBullets >= 3 && quantifiedBullets < Math.ceil(totalBullets / 3)) {
    issues.push({
      type: 'content',
      severity: 'warning',
      message: 'Fewer than 1/3 of bullet points include quantified results',
      section: 'Experience',
      suggestion: 'Add numbers: "Reduced costs by 20%", "Led team of 5", "Served 10K+ users".',
    })
  }

  // Check for buzzwords
  for (const exp of resume.experience) {
    for (const bullet of exp.bullets) {
      const lower = bullet.toLowerCase()
      for (const buzz of BUZZWORDS) {
        if (lower.includes(buzz)) {
          issues.push({
            type: 'content',
            severity: 'info',
            message: `Buzzword detected: "${buzz}"`,
            section: 'Experience',
            suggestion: `Replace "${buzz}" with specific, concrete examples of your impact.`,
          })
        }
      }
    }
  }

  if (resume.skills.length === 0) {
    issues.push({
      type: 'missing',
      severity: 'error',
      message: 'No skills listed',
      section: 'Skills',
      suggestion: 'Add at least 5-10 relevant skills to help ATS match your resume.',
    })
  }

  return issues
}

export function checkKeywordDensity(resume: ResumeFormData, jobDescription: string): ATSIssue[] {
  const issues: ATSIssue[] = []

  if (!jobDescription.trim()) return issues

  const resumeText = [
    resume.summary,
    ...resume.experience.flatMap((e) => [e.role, e.company, ...e.bullets]),
    ...resume.education.flatMap((e) => [e.institution, e.degree, e.field ?? '']),
    ...resume.projects.flatMap((p) => [p.name, p.description, p.tech_stack]),
    resume.skills.join(' '),
    ...resume.certificates.flatMap((c) => [c.name, c.issuer]),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  // Extract keywords from JD (words that appear 2+ times, excluding common words)
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be',
    'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
    'would', 'could', 'should', 'may', 'might', 'shall', 'can', 'need',
    'this', 'that', 'these', 'those', 'we', 'you', 'they', 'he', 'she',
    'it', 'about', 'between', 'through', 'during', 'before', 'after',
    'above', 'below', 'up', 'down', 'out', 'off', 'over', 'under',
    'again', 'further', 'then', 'once', 'here', 'there', 'all', 'each',
    'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such',
    'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too',
    'very', 'just', 'also', 'if', 'while', 'because', 'skills',
  ])

  const words = jobDescription.toLowerCase().match(/\b[a-z]{3,}\b/g) ?? []
  const wordFreq = new Map<string, number>()
  for (const w of words) {
    if (!stopWords.has(w)) wordFreq.set(w, (wordFreq.get(w) ?? 0) + 1)
  }

  // Keywords that appear 3+ times in JD
  const jdKeywords = [...wordFreq.entries()]
    .filter(([, count]) => count >= 3)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 30)
    .map(([word]) => word)

  const missingKeywords: string[] = []
  const matchedKeywords: string[] = []

  for (const kw of jdKeywords) {
    if (resumeText.includes(kw)) {
      matchedKeywords.push(kw)
    } else {
      missingKeywords.push(kw)
    }
  }

  if (missingKeywords.length > 0) {
    const topMissing = missingKeywords.slice(0, 10)
    issues.push({
      type: 'keyword',
      severity: missingKeywords.length > 5 ? 'error' : 'warning',
      message: `${missingKeywords.length} keywords from job description missing from your resume`,
      section: 'Overall',
      suggestion: `Consider adding: ${topMissing.join(', ')}${missingKeywords.length > 10 ? ` and ${missingKeywords.length - 10} more` : ''}`,
    })
  }

  if (matchedKeywords.length > 0) {
    issues.push({
      type: 'keyword',
      severity: 'info',
      message: `${matchedKeywords.length} keywords matched from job description`,
      section: 'Overall',
      suggestion: `Matched: ${matchedKeywords.join(', ')}`,
    })
  }

  return issues
}

export function checkContentQuality(resume: ResumeFormData): ATSIssue[] {
  const issues: ATSIssue[] = []

  const allText = [
    resume.summary,
    ...resume.experience.flatMap((e) => e.bullets),
    ...resume.projects.map((p) => p.description),
  ]
    .filter(Boolean)
    .join(' ')

  // Check for passive voice indicators (word boundary aware)
  const passivePattern = /\b(was\s|were\s|been\s|being\s|have been\s|has been\s)/i
  if (passivePattern.test(allText)) {
    issues.push({
      type: 'content',
      severity: 'info',
      message: 'Passive voice detected — use active voice for stronger impact',
      section: 'Experience',
      suggestion: 'Replace passive phrases with active verbs. "Was responsible for" → "Led".',
    })
  }

  // Check for bullet consistency (tense)
  for (const exp of resume.experience) {
    const tenses = new Set<string>()
    for (const bullet of exp.bullets) {
      const firstWord = bullet.trim().toLowerCase().split(/\s+/)[0] ?? ''
      const isPast = ACTION_VERBS.has(firstWord) || firstWord.endsWith('ed')
      tenses.add(isPast ? 'past' : 'present')
    }
    if (tenses.size > 1 && exp.bullets.length > 1) {
      issues.push({
        type: 'content',
        severity: 'warning',
        message: `Inconsistent verb tense in "${exp.role}" at ${exp.company}`,
        section: 'Experience',
        suggestion: 'Use past tense for completed roles and present tense for your current role.',
      })
    }
  }

  return issues
}

export function calculateLengthScore(resume: ResumeFormData, persona: string): ATSIssue[] {
  const issues: ATSIssue[] = []

  const textLength = [
    resume.summary,
    ...resume.experience.flatMap((e) => [e.role, e.company, ...e.bullets]),
    ...resume.education.flatMap((e) => [e.institution, e.degree, e.field ?? '']),
    ...resume.projects.flatMap((p) => [p.name, p.description, p.tech_stack]),
    resume.skills.join(' '),
  ]
    .filter(Boolean)
    .join(' ')
    .split(/\s+/)
    .length

  if (persona === 'fresher' || persona === 'professional') {
    if (textLength > 600) {
      issues.push({
        type: 'formatting',
        severity: 'warning',
        message: `Resume may be too long for 1 page (~${textLength} words)`,
        section: 'Overall',
        suggestion: 'Target 400-600 words for a 1-page resume. Consider condensing older or less relevant experience.',
      })
    }
  } else if (persona === 'executive') {
    if (textLength > 1200) {
      issues.push({
        type: 'formatting',
        severity: 'warning',
        message: `Resume may exceed 2 pages (~${textLength} words)`,
        section: 'Overall',
        suggestion: 'Target 800-1200 words for a 2-page executive resume. Focus on strategic impact.',
      })
    } else if (textLength < 300) {
      issues.push({
        type: 'formatting',
        severity: 'info',
        message: `Resume may be too short for executive level (~${textLength} words)`,
        section: 'Overall',
        suggestion: 'As an executive, aim for 800-1200 words covering strategic achievements and scope.',
      })
    }
  }

  return issues
}

export function calculateOverallScore(scores: Partial<ATSScore>): ATSScore {
  const keyword = scores.keywordMatch ?? 0
  const formatting = scores.formatting ?? 100
  const content = scores.contentQuality ?? 0
  const length = scores.length ?? 100
  const issues = scores.issues ?? []

  const overall = Math.round(
    keyword * 0.35 + formatting * 0.25 + content * 0.25 + length * 0.15
  )

  return {
    overall,
    keywordMatch: keyword,
    formatting,
    contentQuality: content,
    length,
    issues,
  }
}

export function analyzeResume(resume: ResumeFormData, jobDescription: string = '', persona: string = 'professional'): ATSScore {
  const formattingIssues = checkFormatting(resume, persona)
  const keywordIssues = checkKeywordDensity(resume, jobDescription)
  const contentIssues = checkContentQuality(resume)
  const lengthIssues = calculateLengthScore(resume, persona)

  const allIssues = [...formattingIssues, ...keywordIssues, ...contentIssues, ...lengthIssues]

  // Calculate sub-scores based on issues
  const errorCount = allIssues.filter((i) => i.severity === 'error').length
  const warningCount = allIssues.filter((i) => i.severity === 'warning').length
  const infoCount = allIssues.filter((i) => i.severity === 'info').length

  const formattingScore = Math.max(0, 100 - formattingIssues.filter((i) => i.severity !== 'info').length * 20)

  // For keyword score, penalize per missing keyword beyond the first
  let keywordScore = 100
  if (jobDescription.trim()) {
    const missingCounts = allIssues
      .filter((i) => i.type === 'keyword' && i.message.includes('missing'))
      .reduce((sum, i) => {
        const match = i.message.match(/^(\d+) keywords/)
        return sum + (match ? parseInt(match[1]) : 0)
      }, 0)
    keywordScore = Math.max(0, 100 - missingCounts * 8)
  }

  const contentScore = Math.max(0, 100 - (errorCount * 15 + warningCount * 8 + infoCount * 3))

  const lengthScore = lengthIssues.length > 0
    ? lengthIssues.some((i) => i.severity === 'error') ? 50
      : lengthIssues.some((i) => i.severity === 'warning') ? 70
      : 90
    : 100

  return calculateOverallScore({
    keywordMatch: keywordScore,
    formatting: formattingScore,
    contentQuality: contentScore,
    length: lengthScore,
    issues: allIssues,
  })
}
