import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextResponse } from 'next/server'

const mockAnalyze = vi.hoisted(() => vi.fn())
const mockGenerateCoverLetter = vi.hoisted(() => vi.fn())

vi.mock('@/lib/ai', () => ({
  analyzeSkillGap: mockAnalyze,
  generateCoverLetter: mockGenerateCoverLetter,
}))

const mockCreateClient = vi.hoisted(() => vi.fn())
vi.mock('@/lib/supabase/server', () => ({
  createClient: mockCreateClient,
}))

const mockRateLimit = vi.hoisted(() => vi.fn())
vi.mock('@/lib/rate-limit', () => ({
  rateLimitByIp: mockRateLimit,
}))

import { POST } from '../route'

describe('POST /api/jobs/prepare', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRateLimit.mockReturnValue(undefined)
    mockCreateClient.mockReturnValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }) },
    })
  })

  it('returns 429 when rate limited', async () => {
    mockRateLimit.mockReturnValue(NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 }))
    const res = await POST(new Request('http://localhost/api/jobs/prepare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ job_title: 'Engineer', company: 'Acme', description: 'desc', resume_id: '550e8400-e29b-41d4-a716-446655440001' }),
    }))
    expect(res.status).toBe(429)
  })

  it('returns 401 when unauthorized', async () => {
    mockCreateClient.mockReturnValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
    })
    const res = await POST(new Request('http://localhost/api/jobs/prepare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ job_title: 'Engineer', company: 'Acme', description: 'desc',       resume_id: '550e8400-e29b-41d4-a716-446655440001' }),
    }))
    expect(res.status).toBe(401)
  })

  it('returns 400 for missing fields', async () => {
    const res = await POST(new Request('http://localhost/api/jobs/prepare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    }))
    expect(res.status).toBe(400)
  })

  it('returns 404 when resume not found', async () => {
    mockCreateClient.mockReturnValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }) },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      }),
    })
    const res = await POST(new Request('http://localhost/api/jobs/prepare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ job_title: 'Engineer', company: 'Acme', description: 'desc',       resume_id: '550e8400-e29b-41d4-a716-446655440099' }),
    }))
    expect(res.status).toBe(404)
  })

  it('returns 500 when AI service fails', async () => {
    mockCreateClient.mockReturnValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }) },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { summary: '', experience: [], skills: [] }, error: null }),
      }),
    })
    mockAnalyze.mockRejectedValue(new Error('AI service down'))
    const res = await POST(new Request('http://localhost/api/jobs/prepare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ job_title: 'Engineer', company: 'Acme', description: 'desc', resume_id: '550e8400-e29b-41d4-a716-446655440001' }),
    }))
    expect(res.status).toBe(500)
  })

  it('returns AI analysis results on success', async () => {
    const mockResume = {
      summary: 'Experienced engineer',
      experience: [{ role: 'Engineer', company: 'Co', bullets: ['Built X'] }],
      skills: ['React', 'TypeScript'],
    }
    mockCreateClient.mockReturnValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }) },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockResume, error: null }),
      }),
    })
    mockAnalyze.mockResolvedValue({
      score: 80, verdict: 'Strong fit', verdict_explanation: 'Good match',
      strengths: ['React experience'], gaps: ['No Docker'],
      missingKeywords: ['Docker'], suggestions: ['Learn Docker'],
    })
    mockGenerateCoverLetter.mockResolvedValue('Dear Hiring Manager...')

    const res = await POST(new Request('http://localhost/api/jobs/prepare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ job_title: 'Engineer', company: 'Acme', description: 'desc',       resume_id: '550e8400-e29b-41d4-a716-446655440001' }),
    }))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.matchScore).toBe(80)
    expect(data.coverLetter).toBe('Dear Hiring Manager...')
    expect(data.strengths).toContain('React experience')
  })

  it('returns 500 on malformed body', async () => {
    const res = await POST(new Request('http://localhost/api/jobs/prepare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'garbage',
    }))
    expect(res.status).toBe(500)
  })
})
