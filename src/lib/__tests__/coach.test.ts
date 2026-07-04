import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  getCoachingPrompt,
  getCoachingSummaryPrompt,
  parseCoachingResponse,
  handleCoachingTurn,
  handleCoachingSummary,
} from '../coach'

const originalKey = process.env.AI_API_KEY

beforeEach(() => {
  delete process.env.AI_API_KEY
})

afterEach(() => {
  process.env.AI_API_KEY = originalKey
})

describe('getCoachingPrompt', () => {
  it('includes user context when provided', () => {
    const prompt = getCoachingPrompt('Senior engineer looking for PM role')
    expect(prompt).toContain('Senior engineer')
    expect(prompt).toContain('Kavya')
  })

  it('works without context', () => {
    const prompt = getCoachingPrompt('')
    expect(prompt).toContain('Kavya')
  })
})

describe('getCoachingSummaryPrompt', () => {
  it('asks for structured JSON output', () => {
    const prompt = getCoachingSummaryPrompt()
    expect(prompt).toContain('insights')
    expect(prompt).toContain('strengths')
    expect(prompt).toContain('nextSteps')
  })
})

describe('parseCoachingResponse', () => {
  it('detects complete signal', () => {
    const result = parseCoachingResponse('__COACHING_COMPLETE__')
    expect(result.type).toBe('complete')
  })

  it('detects question', () => {
    const result = parseCoachingResponse('What does success look like for you?')
    expect(result).toEqual({
      type: 'question',
      content: 'What does success look like for you?',
    })
  })

  it('preserves preceding content on complete', () => {
    const result = parseCoachingResponse('Good. __COACHING_COMPLETE__')
    expect(result.type).toBe('complete')
    expect(result.content).toContain('Good')
  })
})

describe('handleCoachingTurn', () => {
  it('returns error type when callAI returns null', async () => {
    const result = await handleCoachingTurn({ context: 'test', history: [] })
    expect(result.type).toBe('error')
    expect(result.content).toBeTruthy()
  })
})

describe('handleCoachingSummary', () => {
  it('returns null when API key is not set', async () => {
    const result = await handleCoachingSummary({ context: 'test', history: [] })
    expect(result).toBeNull()
  })
})
