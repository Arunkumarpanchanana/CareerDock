import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextResponse } from 'next/server'

const mockFetch = vi.fn()
global.fetch = mockFetch

const mockCreateClient = vi.hoisted(() => vi.fn())
vi.mock('@/lib/supabase/server', () => ({
  createClient: mockCreateClient,
}))

const mockRateLimit = vi.hoisted(() => vi.fn())
vi.mock('@/lib/rate-limit', () => ({
  rateLimitByIp: mockRateLimit,
}))

import { POST } from '../route'

describe('POST /api/jobs/search', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRateLimit.mockReturnValue(undefined)
    mockCreateClient.mockReturnValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }) },
    })
    process.env.ADZUNA_API_ID = 'test-id'
    process.env.ADZUNA_API_KEY = 'test-key'
  })

  it('returns 401 when unauthorized', async () => {
    mockCreateClient.mockReturnValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
    })
    const res = await POST(new Request('http://localhost/api/jobs/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keyword: 'engineer' }),
    }))
    expect(res.status).toBe(401)
  })

  it('returns 429 when rate limited', async () => {
    mockRateLimit.mockReturnValue(NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 }))
    const res = await POST(new Request('http://localhost/api/jobs/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keyword: 'engineer' }),
    }))
    expect(res.status).toBe(429)
  })

  it('returns 503 when Adzuna ID not configured', async () => {
    delete process.env.ADZUNA_API_ID
    const res = await POST(new Request('http://localhost/api/jobs/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keyword: 'engineer' }),
    }))
    expect(res.status).toBe(503)
  })

  it('returns 503 when Adzuna key not configured', async () => {
    delete process.env.ADZUNA_API_KEY
    const res = await POST(new Request('http://localhost/api/jobs/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keyword: 'engineer' }),
    }))
    expect(res.status).toBe(503)
  })

  it('returns 500 on malformed body', async () => {
    const res = await POST(new Request('http://localhost/api/jobs/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not-json',
    }))
    expect(res.status).toBe(500)
  })

  it('returns 400 for missing keyword', async () => {
    const res = await POST(new Request('http://localhost/api/jobs/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keyword: '' }),
    }))
    expect(res.status).toBe(400)
  })

  it('returns 502 when Adzuna API fails', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500, text: () => Promise.resolve('error') })
    const res = await POST(new Request('http://localhost/api/jobs/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keyword: 'engineer' }),
    }))
    expect(res.status).toBe(502)
  })

  it('returns listings on success', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        results: [{
          id: '123',
          title: 'Engineer',
          company: { display_name: 'Acme' },
          location: { display_name: 'London' },
          description: 'Job description',
          salary_min: 50000,
          salary_max: 70000,
          salary_is_predicted: '0',
          redirect_url: 'https://apply',
          category: { label: 'Engineering' },
          contract_type: 'permanent',
          created: '2026-06-10T12:00:00Z',
        }],
        count: 1,
        page: 1,
      }),
    })
    const res = await POST(new Request('http://localhost/api/jobs/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keyword: 'engineer' }),
    }))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.results).toHaveLength(1)
    expect(data.results[0].title).toBe('Engineer')
    expect(data.total).toBe(1)
  })
})
