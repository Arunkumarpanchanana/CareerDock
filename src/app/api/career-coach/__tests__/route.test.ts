import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGetUser = vi.fn()

function createClient(planTier = 'premium', sessionCount = 0) {
  const eq = vi.fn(() => ({
    eq: vi.fn(() => Promise.resolve({ count: sessionCount, data: null, error: null })),
    single: vi.fn(() => Promise.resolve({ data: { plan_tier: planTier }, error: null })),
  }))
  return {
    auth: { getUser: mockGetUser },
    from: vi.fn(() => ({
      select: vi.fn(() => ({ eq })),
      insert: vi.fn(() => Promise.resolve({ error: null })),
    })),
  }
}

const { mockCreateClient } = vi.hoisted(() => ({
  mockCreateClient: vi.fn(() => createClient()),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: mockCreateClient,
}))

vi.mock('@/lib/coach', () => ({
  handleCoachingTurn: vi.fn(),
  handleCoachingSummary: vi.fn(),
}))

import { POST } from '../route'
import { handleCoachingTurn, handleCoachingSummary } from '@/lib/coach'

describe('POST /api/career-coach', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: { id: 'test-user' } }, error: null })
    mockCreateClient.mockReset()
    mockCreateClient.mockImplementation(() => createClient())
  })

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null })
    const req = new Request('http://localhost/api/career-coach', {
      method: 'POST',
      body: JSON.stringify({ phase: 'conversation', context: '', history: [] }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(401)
  })

  it('returns 403 for free plan', async () => {
    mockCreateClient.mockImplementation(() => createClient('free'))
    const req = new Request('http://localhost/api/career-coach', {
      method: 'POST',
      body: JSON.stringify({ phase: 'conversation', context: '', history: [] }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(403)
  })

  it('returns 403 when premium user exceeds 15 sessions', async () => {
    mockCreateClient.mockImplementation(() => createClient('premium', 15))
    const req = new Request('http://localhost/api/career-coach', {
      method: 'POST',
      body: JSON.stringify({ phase: 'conversation', context: '', history: [] }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(403)
  })

  it('returns 400 for missing fields', async () => {
    const req = new Request('http://localhost/api/career-coach', {
      method: 'POST',
      body: JSON.stringify({}),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(400)
  })

  it('handles conversation phase for premium', async () => {
    vi.mocked(handleCoachingTurn).mockResolvedValue({ type: 'question', content: 'Tell me about yourself.' })
    const req = new Request('http://localhost/api/career-coach', {
      method: 'POST',
      body: JSON.stringify({ phase: 'conversation', context: '', history: [] }),
    })
    const res = await POST(req as any)
    const data = await res.json()
    expect(data.type).toBe('question')
    expect(data.content).toBe('Tell me about yourself.')
  })

  it('handles summary phase for premium', async () => {
    vi.mocked(handleCoachingSummary).mockResolvedValue({
      insights: ['You value growth'],
      strengths: ['Communication'],
      blindSpots: ['Work-life balance'],
      nextSteps: ['Update resume'],
    })
    const req = new Request('http://localhost/api/career-coach', {
      method: 'POST',
      body: JSON.stringify({ phase: 'summary', context: '', history: [] }),
    })
    const res = await POST(req as any)
    const data = await res.json()
    expect(data.insights).toEqual(['You value growth'])
  })

  it('allows premium_pro unlimited sessions', async () => {
    mockCreateClient.mockImplementation(() => createClient('premium_pro', 99))
    vi.mocked(handleCoachingTurn).mockResolvedValue({ type: 'question', content: 'What brings you here?' })
    const req = new Request('http://localhost/api/career-coach', {
      method: 'POST',
      body: JSON.stringify({ phase: 'conversation', context: '', history: [] }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(200)
  })
})
