import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockAnalyze = vi.hoisted(() => vi.fn())

vi.mock('@/lib/ai', () => ({
  analyzeSkillGap: mockAnalyze,
}))

const mockCreateClient = vi.hoisted(() => vi.fn())

vi.mock('@/lib/supabase/server', () => ({
  createClient: mockCreateClient,
}))

vi.mock('@/lib/rate-limit', () => ({
  rateLimitByIp: vi.fn(() => undefined),
}))

import { POST } from '../route'

describe('POST /api/skill-gap', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCreateClient.mockReturnValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }) },
    })
  })

  it('returns 401 without auth', async () => {
    mockCreateClient.mockReturnValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
    })
    const res = await POST(new Request('http://localhost/api/skill-gap', {
      method: 'POST',
      body: JSON.stringify({ resume: 'test', jobDescription: 'test' }),
      headers: { 'Content-Type': 'application/json' },
    }))
    expect(res.status).toBe(401)
  })

  it('returns analysis result', async () => {
    mockAnalyze.mockResolvedValue({
      score: 75, verdict: 'Strong fit', verdict_explanation: 'Good match.',
      strengths: ['React experience'], gaps: ['No GraphQL'],
      missingKeywords: ['GraphQL'], suggestions: ['Learn GraphQL'],
    })
    const res = await POST(new Request('http://localhost/api/skill-gap', {
      method: 'POST',
      body: JSON.stringify({ resume: 'React dev', jobTitle: 'Frontend', jobDescription: 'React + GraphQL' }),
      headers: { 'Content-Type': 'application/json' },
    }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.score).toBe(75)
    expect(body.strengths).toContain('React experience')
  })

  it('requires resume and jobDescription', async () => {
    const res = await POST(new Request('http://localhost/api/skill-gap', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    }))
    expect(res.status).toBe(400)
  })
})
