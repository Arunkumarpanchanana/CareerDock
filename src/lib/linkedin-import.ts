import type { ResumeFormData } from '@/lib/resume'

export interface ParseResult {
  data: ResumeFormData
  confidence: number
  unmatched: string[]
  source: 'heuristic' | 'ai'
}

const SECTION_HEADINGS = [
  'Summary',
  'About',
  'Experience',
  'Education',
  'Skills',
  'Projects',
  'Certifications',
  'Licenses & Certifications',
]

function findSections(text: string): Map<string, string> {
  const sections = new Map<string, string>()
  const lines = text.split('\n')
  let currentSection = ''
  let currentContent: string[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    const heading = SECTION_HEADINGS.find(
      (h) => trimmed.toLowerCase() === h.toLowerCase()
    )
    if (heading) {
      if (currentSection && currentContent.length > 0) {
        sections.set(currentSection, currentContent.join('\n').trim())
      }
      currentSection = heading
      currentContent = []
    } else if (currentSection) {
      currentContent.push(trimmed)
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
    if (lines.length < 3) continue

    const degree = lines[0].trim()
    const field = lines[1].trim()
    const institution = lines[2].trim()
    let year = ''
    if (lines.length > 3 && /\d{4}/.test(lines[3])) {
      year = lines[3].trim()
    }

    entries.push({
      institution,
      degree,
      field,
      year,
    })
  }
  return entries
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

  for (const block of blocks) {
    const lines = block.split('\n').filter((l) => l.trim())
    if (lines.length >= 1) {
      const name = lines[0].trim()
      const desc = lines.slice(1).find((l) => l.length > 30) || ''
      const tech = lines.find((l) => /^[A-Z][a-z]+[,;]/.test(l.trim())) || ''
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

  const expectedSection = ['Summary', 'Experience', 'Education', 'Skills'].filter(
    (h) => sections.has(h) || sections.get('About')
  ).length + (sections.has('Projects') ? 1 : 0) + (sections.has('Certifications') || sections.has('Licenses & Certifications') ? 1 : 0)

  const parsedCount = [summary ? 1 : 0, experience.length > 0 ? 1 : 0, education.length > 0 ? 1 : 0, skills.length > 0 ? 1 : 0, projects.length > 0 ? 1 : 0, certificates.length > 0 ? 1 : 0].filter(Boolean).length

  const confidence = expectedSection > 0 ? parsedCount / expectedSection : 0

  const unmatched: string[] = []
  if (experienceText && experience.length === 0) unmatched.push('Experience')
  if (educationText && education.length === 0) unmatched.push('Education')

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
