import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGenerateCoverLetter = vi.hoisted(() => vi.fn())

vi.mock('@/lib/ai', () => ({
  generateCoverLetter: mockGenerateCoverLetter,
}))

const mockCreateClient = vi.hoisted(() => vi.fn())
vi.mock('@/lib/supabase/server', () => ({
  createClient: mockCreateClient,
}))

vi.mock('@/lib/rate-limit', () => ({
  rateLimitByIp: vi.fn(() => undefined),
}))

import { POST, GET, PUT } from '../route'

const mockSelect = vi.fn()
const mockEq = vi.fn()
const mockOrder = vi.fn()
const mockLimit = vi.fn()
const mockSingle = vi.fn()
const mockInsert = vi.fn()
const mockUpdate = vi.fn()

function setupDb() {
  mockSelect.mockReturnThis()
  mockEq.mockReturnThis()
  mockOrder.mockReturnThis()
  mockLimit.mockResolvedValue({ data: [], error: null })
  mockSingle.mockResolvedValue({ data: { id: 'cl-1', content: 'Generated letter...' }, error: null })

  const mockFrom = vi.fn((table: string) => {
    if (table === 'profiles') {
      return {
        select: vi.fn(() => ({ eq: vi.fn(() => ({ single: vi.fn().mockResolvedValue({ data: { plan_tier: 'premium' }, error: null }) }) ) })),
      }
    }
    if (table === 'ai_usage') {
      return {
        select: vi.fn(() => ({ eq: vi.fn(() => ({ gte: vi.fn(() => ({ count: 0 })) }) ) })),
        insert: vi.fn(),
      }
    }
    return { select: mockSelect, insert: mockInsert, update: mockUpdate }
  })

  mockCreateClient.mockReturnValue({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }) },
    from: mockFrom,
  })

  return { mockFrom }
}

describe('POST /api/cover-letter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupDb()
  })

  it('returns 401 without auth', async () => {
    mockCreateClient.mockReturnValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
    })
    const req = new Request('http://localhost/api/cover-letter', {
      method: 'POST',
      body: JSON.stringify({ resume: 'test', jobTitle: 'Engineer', company: 'Acme' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('generates and returns a cover letter', async () => {
    mockGenerateCoverLetter.mockResolvedValue('Dear Hiring Manager, I am excited...')
    mockInsert.mockReturnValue({ select: vi.fn(() => ({ single: vi.fn().mockResolvedValue({ data: { id: 'cl-1', content: 'Dear Hiring Manager, I am excited...' }, error: null }) })) })

    const req = new Request('http://localhost/api/cover-letter', {
      method: 'POST',
      body: JSON.stringify({ resume: 'Engineer', jobTitle: 'Engineer', company: 'Acme Corp', jobDescription: 'Building great things.' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.content).toContain('excited')
    expect(body.id).toBe('cl-1')
  })
})

describe('GET /api/cover-letter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupDb()
  })

  it('returns cover letters list', async () => {
    const mockFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn().mockResolvedValue({ data: [{ id: '1', title: 'Test', content: '...', job_title: 'Engineer', company: 'Acme', job_description: '', created_at: '2024-01-01', updated_at: '2024-01-01' }], error: null }),
          })),
        })),
      })),
    }))
    mockCreateClient.mockReturnValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }) },
      from: mockFrom,
    })

    const req = new Request('http://localhost/api/cover-letter')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
    expect(body[0].title).toBe('Test')
  })
})

describe('PUT /api/cover-letter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupDb()
  })

  it('updates cover letter content', async () => {
    const mockSingleFn = vi.fn().mockResolvedValue({ data: { id: 'cl-1', content: 'Updated content' }, error: null })
    const mockSelectFn = vi.fn(() => ({ single: mockSingleFn }))
    const mockEqFn = vi.fn(() => ({ eq: vi.fn(() => ({ select: mockSelectFn })) }))
    mockUpdate.mockReturnValue({ eq: mockEqFn })

    const req = new Request('http://localhost/api/cover-letter?id=cl-1', {
      method: 'PUT',
      body: JSON.stringify({ content: 'Updated content' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await PUT(req)
    expect(res.status).toBe(200)
  })
})
