import type { Vibe } from '@/hooks/useVibe'

interface CareerConfig {
  vibe: Vibe
  persona: string
  plan: string
  skills: string[]
  summary: string
  activeApplications: { company: string; role: string; status: string }[]
  skillTargets: string[]
  preferredRoles: string[]
}

export function generateCareerConfig(config: CareerConfig): string {
  const frontmatter = [
    '---',
    `vibe: ${config.vibe}`,
    `persona: ${config.persona}`,
    `plan: ${config.plan}`,
    '---',
    '',
  ].join('\n')

  const sections = [
    '# Career Configuration',
    '',
    '## Skills',
    config.skills.length > 0 ? config.skills.map((s) => `- ${s}`).join('\n') : '- None listed',
    '',
    '## Resume Summary',
    config.summary || '- No summary',
    '',
    '## Active Applications',
    ...(config.activeApplications.length > 0
      ? config.activeApplications.map((a) => `- ${a.company} - ${a.role} (${a.status})`)
      : ['- None active']),
    '',
    '## Skill Targets',
    ...(config.skillTargets.length > 0
      ? config.skillTargets.map((s) => `- ${s}`)
      : ['- None specified']),
    '',
    '## Preferred Roles',
    ...(config.preferredRoles.length > 0
      ? config.preferredRoles.map((r) => `- ${r}`)
      : ['- None specified']),
  ].join('\n')

  return frontmatter + sections
}

export function parseCareerConfig(markdown: string): Partial<CareerConfig> {
  const config: Partial<CareerConfig> = {}

  const frontmatch = markdown.match(/^---\n([\s\S]*?)\n---/)
  if (frontmatch) {
    const fm = parseFrontmatter(frontmatch[1])
    if (fm.vibe) config.vibe = fm.vibe as Vibe
    if (fm.persona) config.persona = fm.persona
    if (fm.plan) config.plan = fm.plan
  }

  const skillsMatch = markdown.match(/## Skills\n([\s\S]*?)(?=\n## |$)/)
  if (skillsMatch) {
    config.skills = skillsMatch[1].split('\n').filter((l) => l.startsWith('- ')).map((l) => l.slice(2))
  }

  const summaryMatch = markdown.match(/## Resume Summary\n([\s\S]*?)(?=\n## |$)/)
  if (summaryMatch) {
    config.summary = summaryMatch[1].trim().replace(/^- /, '')
  }

  const appsMatch = markdown.match(/## Active Applications\n([\s\S]*?)(?=\n## |$)/)
  if (appsMatch) {
    config.activeApplications = appsMatch[1].split('\n').filter((l) => l.startsWith('- ')).map((l) => {
      const parts = l.slice(2).split(' - ')
      return { company: parts[0] || '', role: parts[1] || '', status: parts[2]?.replace(/[()]/g, '') || '' }
    })
  }

  const targetsMatch = markdown.match(/## Skill Targets\n([\s\S]*?)(?=\n## |$)/)
  if (targetsMatch) {
    config.skillTargets = targetsMatch[1].split('\n').filter((l) => l.startsWith('- ')).map((l) => l.slice(2))
  }

  const rolesMatch = markdown.match(/## Preferred Roles\n([\s\S]*?)(?=\n## |$)/)
  if (rolesMatch) {
    config.preferredRoles = rolesMatch[1].split('\n').filter((l) => l.startsWith('- ')).map((l) => l.slice(2))
  }

  return config
}

function parseFrontmatter(text: string): Record<string, string> {
  const result: Record<string, string> = {}
  text.split('\n').forEach((line) => {
    const [key, ...rest] = line.split(':')
    if (key && rest.length > 0) result[key.trim()] = rest.join(':').trim()
  })
  return result
}
