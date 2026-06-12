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
  const lines = text.split('\n').filter((l) => l.trim())
  if (lines.length < 3) return entries

  const isBullet = (l: string) => /^[•\-*]\s/.test(l)
  const isDateLine = (l: string) => /\d{4}|Present|Current/i.test(l) && /[-–—]/.test(l)

  let i = 0
  while (i < lines.length) {
    if (isBullet(lines[i])) { i++; continue }

    const role = lines[i].trim()
    const company = i + 1 < lines.length && !isBullet(lines[i + 1]) && !isDateLine(lines[i + 1])
      ? lines[i + 1].trim() : ''
    const dateIdx = company ? i + 2 : i + 1
    const dateLine = dateIdx < lines.length ? lines[dateIdx].trim() : ''
    const dateMatch = dateLine.match(/^(.+?)\s*[-–—]\s*(.+)$/)
    const startDate = dateMatch ? dateMatch[1].trim() : ''
    const endDate = dateMatch ? dateMatch[2].trim() : ''

    if (!company || !dateMatch) {
      i++
      continue
    }

    // Collect bullets until next entry boundary
    const bullets: string[] = []
    let j = dateIdx + 1
    while (j < lines.length) {
      const next = lines[j].trim()
      if (!next) { j++; continue }
      if (!isBullet(next) && j + 2 < lines.length && !isBullet(lines[j + 1]) && isDateLine(lines[j + 2])) break
      if (!isBullet(next) && j + 1 < lines.length && isDateLine(lines[j + 1])) break
      if (isBullet(next)) bullets.push(next.replace(/^[•\-*]\s*/, ''))
      j++
    }

    entries.push({ company, role, start_date: startDate, end_date: endDate || null, bullets })
    i = j
  }
  return entries
}

function parseEducation(text: string) {
  const entries: ResumeFormData['education'] = []
  const lines = text.split('\n').filter((l) => l.trim())
  if (lines.length < 2) return entries

  const institutionIndicators = /university|college|institute|school|academy|^mit$/i
  const degreeIndicators = /^(bachelor|master|doctor|ph\.?d|associate|b\.?s\.?|m\.?s\.?|b\.?a\.?|m\.?a\.?|mba|diploma|certificate|engineer)/i

  const yearPattern = /\b(19|20)\d{2}\b/
  const dateIdx: number[] = []
  for (let i = 0; i < lines.length; i++) {
    if (yearPattern.test(lines[i])) dateIdx.push(i)
  }

  let prevDate: number | null = null
  for (const di of dateIdx) {
    const year = lines[di].trim()
    const startIdx = prevDate !== null ? prevDate + 1 : 0
    const entryLines = lines.slice(startIdx, di)
    if (entryLines.length < 2) { prevDate = di; continue }

    const [a, b, c] = [entryLines[0]?.trim() || '', entryLines[1]?.trim() || '', entryLines[2]?.trim() || '']
    const edu: { institution: string; degree: string; field: string; year: string } = {
      institution: '', degree: '', field: '', year,
    }

    if (institutionIndicators.test(a) || degreeIndicators.test(b)) {
      edu.institution = a
      const df = parseDegreeField(b)
      edu.degree = df.degree
      edu.field = df.field
      if (c && !degreeIndicators.test(c) && !institutionIndicators.test(c)) edu.field = c
    } else if (degreeIndicators.test(a) || c && institutionIndicators.test(c)) {
      edu.degree = a
      edu.field = b
      edu.institution = c
    } else if (c) {
      edu.institution = c
      edu.degree = a
      edu.field = b
    } else {
      edu.institution = a
      edu.degree = b
    }

    entries.push(edu)
    prevDate = di
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
