import { describe, it, expect } from 'vitest'
import { checkFormatting, checkKeywordDensity, checkContentQuality, calculateLengthScore, analyzeResume } from '../ats-score'
import type { ResumeFormData } from '../resume'

const baseResume: ResumeFormData = {
  title: 'Test',
  summary: 'Experienced software engineer with 5 years building web applications.',
  experience: [
    {
      company: 'Acme Corp',
      role: 'Software Engineer',
      start_date: 'Jan 2020',
      end_date: 'Present',
      bullets: [
        'Led development of a customer-facing portal serving 50K+ users',
        'Built RESTful APIs handling 10K requests per minute',
        'Optimized database queries reducing response time by 60%',
      ],
    },
  ],
  education: [{ institution: 'MIT', degree: 'B.S.', field: 'Computer Science', year: '2018' }],
  projects: [],
  skills: ['React', 'Node.js', 'TypeScript', 'Python', 'PostgreSQL'],
  certificates: [],
}

describe('checkFormatting', () => {
  it('returns no issues for a well-formed resume', () => {
    const issues = checkFormatting(baseResume)
    expect(issues.filter((i) => i.severity === 'error')).toHaveLength(0)
  })

  it('flags missing summary', () => {
    const issues = checkFormatting({ ...baseResume, summary: '' })
    expect(issues.some((i) => i.message.includes('summary'))).toBe(true)
  })

  it('flags missing experience', () => {
    const issues = checkFormatting({ ...baseResume, experience: [] })
    expect(issues.some((i) => i.message.includes('experience'))).toBe(true)
  })

  it('flags missing skills', () => {
    const issues = checkFormatting({ ...baseResume, skills: [] })
    expect(issues.some((i) => i.message.includes('skills'))).toBe(true)
  })

  it('flags weak action verb usage', () => {
    const weakResume: ResumeFormData = {
      ...baseResume,
      experience: [
        {
          company: 'Acme Corp',
          role: 'Engineer',
          start_date: 'Jan 2020',
          end_date: 'Present',
          bullets: ['Was responsible for the frontend', 'Worked on the API', 'Did some testing'],
        },
      ],
    }
    const issues = checkFormatting(weakResume)
    expect(issues.some((i) => i.message.includes('action verb'))).toBe(true)
  })

  it('flags lack of quantified metrics', () => {
    const noMetrics: ResumeFormData = {
      ...baseResume,
      experience: [
        {
          company: 'Acme Corp',
          role: 'Engineer',
          start_date: 'Jan 2020',
          end_date: 'Present',
          bullets: ['Led development', 'Built APIs', 'Improved performance'],
        },
      ],
    }
    const issues = checkFormatting(noMetrics)
    expect(issues.some((i) => /quantified/i.test(i.message))).toBe(true)
  })

  it('detects buzzwords', () => {
    const buzzResume: ResumeFormData = {
      ...baseResume,
      experience: [
        {
          company: 'Acme Corp',
          role: 'Engineer',
          start_date: 'Jan 2020',
          end_date: 'Present',
          bullets: ['A results-driven software engineer who creates synergy between teams'],
        },
      ],
    }
    const issues = checkFormatting(buzzResume)
    expect(issues.some((i) => i.message.includes('Buzzword'))).toBe(true)
  })
})

describe('checkKeywordDensity', () => {
  it('returns empty when no job description provided', () => {
    const issues = checkKeywordDensity(baseResume, '')
    expect(issues).toHaveLength(0)
  })

  it('identifies missing keywords from job description', () => {
    const jd = 'We need a React developer with TypeScript, Node.js, and AWS experience. React TypeScript Node.js AWS React TypeScript Node.js AWS.'
    const issues = checkKeywordDensity(baseResume, jd)
    // React, TypeScript, Node.js should be matched; AWS should be missing
    const missingIssue = issues.find((i) => i.type === 'keyword' && i.message.includes('missing'))
    expect(missingIssue).toBeDefined()
    expect(missingIssue?.suggestion?.toLowerCase()).toContain('aws')
  })

  it('reports matched keywords', () => {
    const jd = 'Looking for React developer with TypeScript skills. React TypeScript React TypeScript.'
    const issues = checkKeywordDensity(baseResume, jd)
    const matchedIssue = issues.find((i) => i.type === 'keyword' && i.message.includes('matched'))
    expect(matchedIssue).toBeDefined()
  })
})

describe('checkContentQuality', () => {
  it('detects passive voice', () => {
    const issues = checkContentQuality({
      title: '',
      summary: '',
      experience: [{
        company: 'Acme Corp',
        role: 'Engineer',
        start_date: 'Jan 2020',
        end_date: 'Present',
        bullets: ['Was responsible for the frontend architecture'],
      }],
      education: [],
      projects: [],
      skills: [],
      certificates: [],
    })
    expect(issues.length).toBeGreaterThan(0)
    expect(issues[0].message).toMatch(/passive voice/i)
  })
})

describe('calculateLengthScore', () => {
  it('warns about long resumes for professionals', () => {
    const longResume: ResumeFormData = {
      ...baseResume,
      experience: Array.from({ length: 10 }, (_, i) => ({
        company: `Company ${i}`,
        role: 'Engineer',
        start_date: 'Jan 2020',
        end_date: 'Present',
        bullets: Array.from({ length: 10 }, (_, j) => `Did task number ${j} with great results and impact on the business`),
      })),
    }
    const issues = calculateLengthScore(longResume, 'professional')
    expect(issues.some((i) => i.message.includes('too long'))).toBe(true)
  })

  it('does not warn for short executive resumes', () => {
    const issues = calculateLengthScore(baseResume, 'executive')
    expect(issues.some((i) => i.message.includes('too short'))).toBe(true)
  })
})

describe('analyzeResume', () => {
  it('returns a complete score with all fields', () => {
    const score = analyzeResume(baseResume, '', 'professional')
    expect(score.overall).toBeGreaterThanOrEqual(0)
    expect(score.overall).toBeLessThanOrEqual(100)
    expect(score.keywordMatch).toBeGreaterThanOrEqual(0)
    expect(score.formatting).toBeGreaterThanOrEqual(0)
    expect(score.contentQuality).toBeGreaterThanOrEqual(0)
    expect(Array.isArray(score.issues)).toBe(true)
  })

  it('improves score when job description keywords are matched', () => {
    const jd = 'React Node.js TypeScript Python PostgreSQL React Node.js TypeScript Python PostgreSQL.'
    const scoreWithMatch = analyzeResume(baseResume, jd, 'professional')
    expect(scoreWithMatch.keywordMatch).toBeGreaterThan(50)
  })

  it('penalizes missing keywords from job description', () => {
    const jd = 'AWS Docker Kubernetes Terraform AWS Docker Kubernetes Terraform AWS Docker Kubernetes Terraform.'
    const scoreWithoutMatch = analyzeResume(baseResume, jd, 'professional')
    expect(scoreWithoutMatch.keywordMatch).toBeLessThan(75)
  })
})
