import type { ResumeFormData } from '@/lib/resume'

export interface ParseResult {
  data: ResumeFormData
  confidence: number
  unmatched: string[]
  source: 'heuristic' | 'ai'
}

const SECTION_RULES: { key: string; patterns: RegExp[] }[] = [
  { key: 'Summary', patterns: [/^summary$/i, /^about$/i] },
  { key: 'Experience', patterns: [/^experience$/i] },
  { key: 'Education', patterns: [/^education$/i] },
  { key: 'Skills', patterns: [/^skills/i, /^top skills/i] },
  { key: 'Projects', patterns: [/^projects$/i] },
  { key: 'Certifications', patterns: [/^certifications$/i, /^licenses? & certifications?$/i, /^licenses?$/i] },
  { key: 'Honors & Awards', patterns: [/^honors?\s*&?\s*awards?$/i] },
  { key: 'Languages', patterns: [/^languages$/i] },
  { key: 'Volunteer', patterns: [/^volunteer/i] },
  { key: 'Publications', patterns: [/^publications$/i] },
  { key: 'Courses', patterns: [/^courses$/i] },
  { key: 'Recommendations', patterns: [/^recommendations$/i] },
]

function findSections(text: string): Map<string, string> {
  const sections = new Map<string, string>()
  const lines = text.split('\n')
  let currentSection = ''
  let currentContent: string[] = []

  for (const line of lines) {
    const trimmed = line.trim().replace(/:$/, '')
    const isEmpty = !trimmed && !currentSection

    const match = !isEmpty && SECTION_RULES.find((r) => r.patterns.some((p) => p.test(trimmed)))
    if (match) {
      if (currentSection && currentContent.length > 0) {
        sections.set(currentSection, currentContent.join('\n').trim())
      }
      currentSection = match.key
      currentContent = []
    } else if (currentSection) {
      currentContent.push(line)
    } else if (trimmed) {
      // Content before any heading — treat as summary
      currentSection = 'Summary'
      currentContent = [line]
    }
  }
  if (currentSection && currentContent.length > 0) {
    sections.set(currentSection, currentContent.join('\n').trim())
  }
  return sections
}

function parseExperience(text: string) {
  const entries: ResumeFormData['experience'] = []
  const blocks = text.split('\n\n').filter((b) => b.trim())

  for (const block of blocks) {
    const lines = block.split('\n').filter((l) => l.trim())
    if (lines.length < 3) continue

    const role = lines[0].trim()
    const company = lines[1].trim()
    const dateLine = lines[2].trim()
    const dateMatch = dateLine.match(/^(.+?)\s*[-–—]\s*(.+)$/)
    const startDate = dateMatch ? dateMatch[1].trim() : dateLine
    const endDate = dateMatch ? dateMatch[2].trim() : ''

    const bullets = lines.slice(3)
      .filter((l) => l.startsWith('•') || l.startsWith('-') || l.startsWith('*'))
      .map((l) => l.replace(/^[•\-*]\s*/, ''))

    entries.push({
      company,
      role,
      start_date: startDate,
      end_date: endDate || null,
      bullets,
    })
  }
  return entries
}

function parseEducation(text: string) {
  const entries: ResumeFormData['education'] = []
  const blocks = text.split('\n\n').filter((b) => b.trim())

  for (const block of blocks) {
    const lines = block.split('\n').filter((l) => l.trim())
    if (lines.length < 2) continue

    const edu: { institution: string; degree: string; field: string; year: string } = {
      institution: '',
      degree: '',
      field: '',
      year: '',
    }

    const first = lines[0].trim()
    const second = lines[1].trim()
    const third = lines.length > 2 ? lines[2].trim() : ''
    const fourth = lines.length > 3 ? lines[3].trim() : ''

    // Detect whether first line is an institution name
    const institutionIndicators = /university|college|institute|school|academy/i
    const degreeIndicators = /^(bachelor|master|doctor|ph\.?d|associate|b\.?s\.?|m\.?s\.?|b\.?a\.?|m\.?a\.?|mba|diploma|certificate)/i

    if (institutionIndicators.test(first) || degreeIndicators.test(second)) {
      // LinkedIn PDF format: institution first, degree+field second
      edu.institution = first
      const df = parseDegreeField(second)
      edu.degree = df.degree
      edu.field = df.field
      if (third && /\d{4}/.test(third)) edu.year = third
      else if (fourth && /\d{4}/.test(fourth)) edu.year = fourth
    } else if (degreeIndicators.test(first) || third && institutionIndicators.test(third)) {
      // Alternative format: degree, field, institution
      edu.degree = first
      edu.field = second
      edu.institution = third
      if (fourth && /\d{4}/.test(fourth)) edu.year = fourth
    } else {
      // Fallback: treat lines[0] as degree, lines[1] as field, lines[2] as institution
      edu.degree = first
      edu.field = second
      edu.institution = third
      if (fourth && /\d{4}/.test(fourth)) edu.year = fourth
      else if (third && /\d{4}/.test(third)) edu.year = third
    }

    entries.push(edu)
  }
  return entries
}

function parseDegreeField(text: string): { degree: string; field: string } {
  const idx = text.search(/,|\bin\b/i)
  if (idx !== -1) {
    const sep = text[idx] === ',' ? ',' : 'in'
    const parts = text.split(sep === ',' ? /,\s*/ : /\bin\s+/i)
    return { degree: parts[0].trim(), field: parts.slice(1).join(', ').trim() }
  }
  return { degree: text, field: '' }
}

function parseSkills(text: string): string[] {
  return text
    .split(/[,•\n]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

function parseProjects(text: string) {
  const entries: ResumeFormData['projects'] = []
  const blocks = text.split('\n\n').filter((b) => b.trim())
  const MIN_DESC_LENGTH = 30

  for (const block of blocks) {
    const lines = block.split('\n').filter((l) => l.trim())
    if (lines.length >= 1) {
      const name = lines[0].trim()
      const desc = lines.slice(1).find((l) => l.length > MIN_DESC_LENGTH) || ''
      const tech = lines.find((l) => /,/.test(l.trim()) && /[A-Z]/.test(l.trim())) || ''
      entries.push({
        name,
        description: desc,
        tech_stack: tech,
        url: '',
      })
    }
  }
  return entries
}

function parseCertificates(text: string) {
  const entries: ResumeFormData['certificates'] = []
  const lines = text.split('\n').filter((l) => l.trim())

  for (let i = 0; i < lines.length; i++) {
    const name = lines[i].trim()
    if (name.length < 3) continue
    const issuer = i + 1 < lines.length ? lines[i + 1].trim() : ''
    const date = i + 2 < lines.length && /\d{4}/.test(lines[i + 2]) ? lines[i + 2].trim() : ''
    if (issuer) {
      entries.push({ name, issuer, date, url: '' })
      i += date ? 2 : 1
    }
  }
  return entries
}

export function parseLinkedInText(text: string): ParseResult {
  const sections = findSections(text)

  const summary = (sections.get('Summary') || sections.get('About') || '')
  const experienceText = sections.get('Experience') || ''
  const educationText = sections.get('Education') || ''
  const skillsText = sections.get('Skills') || ''
  const projectsText = sections.get('Projects') || ''
  const certText = sections.get('Certifications') || sections.get('Licenses & Certifications') || ''

  const experience = parseExperience(experienceText)
  const education = parseEducation(educationText)
  const skills = parseSkills(skillsText)
  const projects = parseProjects(projectsText)
  const certificates = parseCertificates(certText)

  const coreSections = ['Summary', 'Experience', 'Education', 'Skills', 'Projects', 'Certifications']
  const expectedSection = coreSections.filter((h) => sections.has(h)).length

  const contentSections: [string, boolean][] = [
    ['Summary', !!summary],
    ['Experience', experience.length > 0],
    ['Education', education.length > 0],
    ['Skills', skills.length > 0],
    ['Projects', projects.length > 0],
    ['Certifications', certificates.length > 0],
  ]
  const parsedCount = contentSections.filter(([, ok]) => ok).length

  const confidence = expectedSection > 0 ? parsedCount / expectedSection : 0

  const unmatched: string[] = []
  if (experienceText && experience.length === 0) unmatched.push('Experience')
  if (educationText && education.length === 0) unmatched.push('Education')
  if (skillsText && skills.length === 0) unmatched.push('Skills')
  if (projectsText && projects.length === 0) unmatched.push('Projects')
  if (certText && certificates.length === 0) unmatched.push('Certifications')

  return {
    data: {
      title: '',
      summary,
      experience,
      education,
      projects,
      skills,
      certificates,
    },
    confidence: Math.round(confidence * 100) / 100,
    unmatched,
    source: 'heuristic',
  }
}
