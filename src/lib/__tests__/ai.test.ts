import { describe, it, expect } from 'vitest'
import { generateBullets, generateSummary, rewriteText, generateCoverLetter } from '../ai'

describe('generateBullets', () => {
  it('returns array of 3 bullet points for engineer role', async () => {
    const bullets = await generateBullets('Software Engineer', 'React, Node.js, PostgreSQL')
    expect(Array.isArray(bullets)).toBe(true)
    expect(bullets.length).toBe(3)
  })

  it('returns array of 3 bullet points for manager role', async () => {
    const bullets = await generateBullets('Engineering Manager', 'team of 12')
    expect(Array.isArray(bullets)).toBe(true)
    expect(bullets.length).toBe(3)
  })

  it('returns array of 3 bullet points for unknown role', async () => {
    const bullets = await generateBullets('Designer', 'Figma, UX research')
    expect(Array.isArray(bullets)).toBe(true)
    expect(bullets.length).toBe(3)
  })

  it('handles empty context gracefully', async () => {
    const bullets = await generateBullets('Developer', '')
    expect(Array.isArray(bullets)).toBe(true)
    expect(bullets.length).toBe(3)
  })
})

describe('generateSummary', () => {
  it('generates a summary with experience', async () => {
    const summary = await generateSummary(
      ['Led team of 5 engineers', 'Built scalable microservices'],
      'Engineering Manager'
    )
    expect(typeof summary).toBe('string')
    expect(summary.length).toBeGreaterThan(20)
  })

  it('generates an entry-level summary when no experience', async () => {
    const summary = await generateSummary([], 'Junior Developer')
    expect(typeof summary).toBe('string')
    expect(summary.length).toBeGreaterThan(20)
  })
})

describe('rewriteText', () => {
  it('returns 3 rewrite variants', async () => {
    const rewrites = await rewriteText('Was responsible for the frontend development')
    expect(Array.isArray(rewrites)).toBe(true)
    expect(rewrites.length).toBe(3)
  })

  it('generates improved versions', async () => {
    const rewrites = await rewriteText('Did some coding')
    expect(Array.isArray(rewrites)).toBe(true)
    expect(rewrites.length).toBe(3)
  })
})

describe('generateCoverLetter', () => {
  it('generates a cover letter from resume data and job description', async () => {
    const letter = await generateCoverLetter({
      resume: 'Experienced software engineer with 5 years in React and Node.js.',
      jobTitle: 'Senior Frontend Engineer',
      company: 'Tech Corp',
      jobDescription: 'We are looking for a senior frontend engineer with React expertise.',
    })
    expect(typeof letter).toBe('string')
    expect(letter.length).toBeGreaterThan(50)
    expect(letter).toContain('Tech Corp')
    expect(letter).toContain('Senior Frontend Engineer')
  })

  it('handles empty job description gracefully', async () => {
    const letter = await generateCoverLetter({
      resume: 'Entry-level developer.',
      jobTitle: 'Junior Developer',
      company: 'Startup Inc',
      jobDescription: '',
    })
    expect(typeof letter).toBe('string')
    expect(letter.length).toBeGreaterThan(50)
  })
})
