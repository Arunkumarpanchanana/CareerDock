import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getInterviewPrompt, getFeedbackPrompt, parseInterviewResponse, handleInterviewTurn, handleFeedback, callGemini } from '../interview'

describe('getInterviewPrompt', () => {
  it('includes resume and job description', () => {
    const prompt = getInterviewPrompt('SWE at Google', 'Senior Engineer role')
    expect(prompt).toContain('SWE at Google')
    expect(prompt).toContain('Senior Engineer role')
  })
})

describe('getFeedbackPrompt', () => {
  it('requests score and strengths/gaps', () => {
    const prompt = getFeedbackPrompt()
    expect(prompt).toContain('score')
    expect(prompt).toContain('strengths')
    expect(prompt).toContain('gaps')
  })
})

describe('parseInterviewResponse', () => {
  it('detects complete signal', () => {
    const result = parseInterviewResponse('__INTERVIEW_COMPLETE__')
    expect(result.type).toBe('complete')
  })

  it('detects question', () => {
    const result = parseInterviewResponse('Tell me about your experience.')
    expect(result).toEqual({
      type: 'question',
      content: 'Tell me about your experience.',
    })
  })

  it('preserves preceding content on complete', () => {
    const result = parseInterviewResponse('Great. __INTERVIEW_COMPLETE__')
    expect(result.type).toBe('complete')
    expect(result.content).toContain('Great')
  })
})

describe('callGemini', () => {
  const originalKey = process.env.AI_API_KEY

  beforeEach(() => {
    delete process.env.AI_API_KEY
  })

  afterEach(() => {
    process.env.AI_API_KEY = originalKey
  })

  it('returns null when API key is not set', async () => {
    const result = await callGemini([{ role: 'user', content: 'test' }])
    expect(result).toBeNull()
  })
})

describe('handleInterviewTurn', () => {
  it('returns error type when callGemini returns null', async () => {
    delete process.env.AI_API_KEY
    const result = await handleInterviewTurn({ resume: 'test', jobDescription: 'test', history: [] })
    expect(result.type).toBe('error')
    expect(result.content).toBeTruthy()
  })
})

describe('handleFeedback', () => {
  it('returns null when API key is not set', async () => {
    delete process.env.AI_API_KEY
    const result = await handleFeedback({ resume: 'test', jobDescription: 'test', history: [] })
    expect(result).toBeNull()
  })
})
