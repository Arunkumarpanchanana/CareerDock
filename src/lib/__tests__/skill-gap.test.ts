import { describe, it, expect } from 'vitest'
import { analyzeSkillGap } from '../ai'

describe('analyzeSkillGap', () => {
  it('returns all result fields', async () => {
    const result = await analyzeSkillGap({
      resume: 'Experienced software engineer with React, Node.js, TypeScript. Built scalable microservices and led team of 5.',
      jobTitle: 'Senior Frontend Engineer',
      jobDescription: 'Looking for a senior engineer with React, TypeScript, GraphQL experience. Must have team leadership skills and system design expertise.',
    })
    expect(result).toHaveProperty('score')
    expect(result).toHaveProperty('verdict')
    expect(result).toHaveProperty('strengths')
    expect(result).toHaveProperty('gaps')
    expect(result).toHaveProperty('missingKeywords')
    expect(result).toHaveProperty('suggestions')
  })

  it('returns score between 0 and 100', async () => {
    const result = await analyzeSkillGap({
      resume: 'React developer with JavaScript.',
      jobTitle: 'Engineer',
      jobDescription: 'Looking for a React developer.',
    })
    expect(result.score).toBeGreaterThanOrEqual(0)
    expect(result.score).toBeLessThanOrEqual(100)
  })

  it('identifies matched skills as strengths', async () => {
    const result = await analyzeSkillGap({
      resume: 'Expert in React, TypeScript, Node.js',
      jobTitle: 'Frontend Engineer',
      jobDescription: 'Looking for React, TypeScript expertise',
    })
    expect(result.strengths.length).toBeGreaterThan(0)
  })

  it('handles empty inputs gracefully', async () => {
    const result = await analyzeSkillGap({
      resume: '',
      jobTitle: '',
      jobDescription: '',
    })
    expect(result.score).toBe(0)
    expect(result.verdict).toBeTruthy()
  })
})
