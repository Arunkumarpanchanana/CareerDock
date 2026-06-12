import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockParseLinkedInText = vi.hoisted(() => vi.fn())
const mockCreateClient = vi.hoisted(() => vi.fn())

vi.mock('@/lib/linkedin-import', () => ({
  parseLinkedInText: mockParseLinkedInText,
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: mockCreateClient,
}))

vi.mock('@/lib/rate-limit', () => ({
  rateLimitByIp: vi.fn(() => undefined),
}))

import { POST } from '../route'

describe('POST /api/import/linkedin', () => {
  beforeEach(() => {
    mockParseLinkedInText.mockReset()
    mockCreateClient.mockReset()
    mockCreateClient.mockReturnValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }) },
    })
  })

  it('returns 401 without auth', async () => {
    mockCreateClient.mockReturnValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
    })
    const req = new Request('http://localhost/api/import/linkedin', {
      method: 'POST',
      body: JSON.stringify({ text: 'some text' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('returns parsed data for valid text', async () => {
    mockParseLinkedInText.mockReturnValue({
      data: { summary: 'Engineer', experience: [], education: [], projects: [], skills: ['JS'], certificates: [] },
      confidence: 0.8,
      unmatched: [],
      source: 'heuristic',
    })
    const req = new Request('http://localhost/api/import/linkedin', {
      method: 'POST',
      body: JSON.stringify({ text: 'Summary\nEngineer' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.summary).toBe('Engineer')
    expect(body.confidence).toBe(0.8)
  })

  it('requires text field', async () => {
    const req = new Request('http://localhost/api/import/linkedin', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 500 on parse error', async () => {
    mockParseLinkedInText.mockImplementation(() => {
      throw new Error('Parse failure')
    })
    const req = new Request('http://localhost/api/import/linkedin', {
      method: 'POST',
      body: JSON.stringify({ text: 'broken' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBe('Parse failure')
  })
})
