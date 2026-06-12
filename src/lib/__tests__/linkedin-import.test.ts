import { describe, it, expect } from 'vitest'
import { parseLinkedInText } from '../linkedin-import'

const mockLinkedInText = `
Summary
Experienced software engineer with 5 years building scalable systems.

Experience
Software Engineer
Acme Corp
Jan 2020 - Present
- Built scalable microservices using Node.js
- Led team of 3 engineers
- Reduced API latency by 40%

Senior Developer
Tech Corp
Jun 2017 - Dec 2019
- Architected cloud infrastructure
- Migrated 50+ services to AWS

Education
Master of Science
Computer Science
Stanford University
2015 - 2017

Bachelor of Science
Computer Engineering
MIT
2011 - 2015

Skills
JavaScript, TypeScript, React, Node.js, Python, AWS, Docker

Projects
Portfolio Optimizer
Built a real-time portfolio tracking dashboard
React, D3.js, Node.js

Certifications
AWS Solutions Architect
Amazon
2023
`

describe('parseLinkedInText', () => {
  it('extracts summary from LinkedIn text', () => {
    const result = parseLinkedInText(mockLinkedInText)
    expect(result.data.summary).toContain('Experienced software engineer')
  })

  it('extracts experience entries with correct fields', () => {
    const result = parseLinkedInText(mockLinkedInText)
    expect(result.data.experience.length).toBe(2)
    expect(result.data.experience[0].company).toBe('Acme Corp')
    expect(result.data.experience[0].role).toBe('Software Engineer')
    expect(result.data.experience[0].start_date).toBe('Jan 2020')
    expect(result.data.experience[0].end_date).toBe('Present')
    expect(result.data.experience[0].bullets).toContain('Built scalable microservices using Node.js')
  })

  it('extracts education entries', () => {
    const result = parseLinkedInText(mockLinkedInText)
    expect(result.data.education.length).toBe(2)
    expect(result.data.education[0].institution).toBe('Stanford University')
    expect(result.data.education[0].degree).toBe('Master of Science')
    expect(result.data.education[0].field).toBe('Computer Science')
  })

  it('extracts skills', () => {
    const result = parseLinkedInText(mockLinkedInText)
    expect(result.data.skills).toContain('JavaScript')
    expect(result.data.skills).toContain('TypeScript')
  })

  it('extracts projects', () => {
    const result = parseLinkedInText(mockLinkedInText)
    expect(result.data.projects.length).toBeGreaterThanOrEqual(1)
    expect(result.data.projects[0].name).toBe('Portfolio Optimizer')
  })

  it('extracts certificates', () => {
    const result = parseLinkedInText(mockLinkedInText)
    expect(result.data.certificates.length).toBeGreaterThanOrEqual(1)
    expect(result.data.certificates[0].name).toContain('AWS Solutions Architect')
  })

  it('returns confidence score between 0 and 1', () => {
    const result = parseLinkedInText('Some random text with no sections')
    expect(result.confidence).toBeGreaterThanOrEqual(0)
    expect(result.confidence).toBeLessThanOrEqual(1)
  })

  it('returns unmatched text for low-confidence sections', () => {
    const result = parseLinkedInText('Some random text with no sections')
    expect(result.unmatched).toBeDefined()
  })
})
