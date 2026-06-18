import { describe, it, expect } from 'vitest'
import { getInterviewPrompt, getFeedbackPrompt, parseInterviewResponse } from '../interview'

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
    expect(parseInterviewResponse('__INTERVIEW_COMPLETE__')).toEqual({ type: 'complete' })
  })

  it('detects question', () => {
    expect(parseInterviewResponse('Tell me about your experience.')).toEqual({
      type: 'question',
      content: 'Tell me about your experience.',
    })
  })

  it('strips complete signal from content', () => {
    expect(parseInterviewResponse('Great. __INTERVIEW_COMPLETE__')).toEqual({ type: 'complete' })
  })
})
