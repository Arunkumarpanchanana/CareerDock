import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGetUser = vi.fn()
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: mockGetUser },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: { plan_tier: 'premium' },
            error: null,
          })),
        })),
      })),
    })),
  })),
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

  it('returns 400 for missing fields', async () => {
    const req = new Request('http://localhost/api/career-coach', {
      method: 'POST',
      body: JSON.stringify({}),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(400)
  })

  it('handles conversation phase', async () => {
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

  it('handles summary phase', async () => {
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
})
