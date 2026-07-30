import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockCreateClient = vi.hoisted(() => vi.fn())
vi.mock('@/lib/supabase/server', () => ({
  createClient: mockCreateClient,
}))

vi.mock('@/lib/rate-limit', () => ({
  rateLimitByIp: vi.fn(() => undefined as unknown),
}))

const mockCheckResumeQuota = vi.hoisted(() => vi.fn())
vi.mock('@/lib/quota', () => ({
  checkResumeQuota: mockCheckResumeQuota,
}))

import { GET, POST, PUT, DELETE } from '../route'

interface QueryResult {
  data: unknown
  error: unknown
  count?: number
}

function chainable(terminal: vi.Mock) {
  const builder = {
    eq: vi.fn(() => builder),
    select: vi.fn(() => ({ single: terminal })),
    order: terminal,
    single: terminal,
  }
  return builder
}

function setupDb(options?: { selectResult?: QueryResult; updateResult?: QueryResult }) {
  const selectResult = options?.selectResult ?? { data: [], error: null }
  const updateResult = options?.updateResult

  const selectTerminal = vi.fn().mockResolvedValue(selectResult)
  const insertSingle = vi.fn().mockResolvedValue({ data: { id: 'res-1', title: 'My Resume 1' }, error: null })

  const selectChain = chainable(selectTerminal)
  const updateChain = updateResult ? chainable(vi.fn().mockResolvedValue(updateResult)) : chainable(vi.fn())

  const mockFrom = vi.fn((table: string) => {
    if (table === 'profiles') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: { plan_tier: 'free' }, error: null }),
          })),
        })),
      }
    }
    return {
      select: vi.fn(() => selectChain),
      update: vi.fn(() => updateChain),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({ single: insertSingle })),
      })),
      delete: vi.fn(() => updateChain),
    }
  })

  mockCreateClient.mockReturnValue({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }) },
    from: mockFrom,
  })

  mockCheckResumeQuota.mockResolvedValue({ allowed: true, current: 0, limit: 3 })

  return { mockFrom, selectTerminal, insertSingle, updateChain }
}

describe('POST /api/resume', () => {
  beforeEach(() => { vi.clearAllMocks(); setupDb() })

  it('returns 401 without auth', async () => {
    mockCreateClient.mockReturnValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
    })
    const res = await POST(new Request('http://localhost/api/resume', { method: 'POST' }))
    expect(res.status).toBe(401)
  })

  it('creates a new resume', async () => {
    const { insertSingle } = setupDb()
    insertSingle.mockResolvedValue({ data: { id: 'res-1', title: 'My Resume 1', user_id: 'user-1' }, error: null })
    const res = await POST(new Request('http://localhost/api/resume', { method: 'POST' }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.id).toBe('res-1')
  })

  it('returns 403 when quota exceeded', async () => {
    mockCheckResumeQuota.mockResolvedValue({ allowed: false, current: 3, limit: 3 })
    const res = await POST(new Request('http://localhost/api/resume', { method: 'POST' }))
    expect(res.status).toBe(403)
  })
})

describe('GET /api/resume', () => {
  beforeEach(() => { vi.clearAllMocks(); setupDb() })

  it('returns 401 without auth', async () => {
    mockCreateClient.mockReturnValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
    })
    const res = await GET(new Request('http://localhost/api/resume'))
    expect(res.status).toBe(401)
  })

  it('returns list of resumes', async () => {
    const resumes = [
      { id: 'r1', title: 'Resume 1', user_id: 'user-1', summary: null, experience: [], education: [], projects: [], certificates: [], skills: [], created_at: '2024-01-01' },
      { id: 'r2', title: 'Resume 2', user_id: 'user-1', summary: null, experience: [], education: [], projects: [], certificates: [], skills: [], created_at: '2024-01-02' },
    ]
    const { selectTerminal } = setupDb({ selectResult: { data: resumes, error: null } })
    const res = await GET(new Request('http://localhost/api/resume'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.length).toBe(2)
    expect(body[0].title).toBe('Resume 1')
  })
})

describe('PUT /api/resume', () => {
  beforeEach(() => { vi.clearAllMocks(); setupDb() })

  it('returns 401 without auth', async () => {
    mockCreateClient.mockReturnValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
    })
    const req = new Request('http://localhost/api/resume', {
      method: 'PUT',
      body: JSON.stringify({ id: 'r1', title: 'Updated' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await PUT(req)
    expect(res.status).toBe(401)
  })

  it('updates resume title', async () => {
    const uid = '550e8400-e29b-41d4-a716-446655440000'
    setupDb({ updateResult: { data: { id: uid, title: 'Updated Resume' }, error: null } })
    const req = new Request('http://localhost/api/resume', {
      method: 'PUT',
      body: JSON.stringify({ id: uid, title: 'Updated Resume' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await PUT(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.title).toBe('Updated Resume')
  })

  it('rejects invalid id format', async () => {
    const req = new Request('http://localhost/api/resume', {
      method: 'PUT',
      body: JSON.stringify({ id: 'not-a-uuid', title: 'Bad' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await PUT(req)
    expect(res.status).toBe(400)
  })
})

describe('DELETE /api/resume', () => {
  beforeEach(() => { vi.clearAllMocks(); setupDb() })

  it('returns 401 without auth', async () => {
    mockCreateClient.mockReturnValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
    })
    const res = await DELETE(new Request('http://localhost/api/resume?id=r1', { method: 'DELETE' }))
    expect(res.status).toBe(401)
  })

  it('deletes a resume', async () => {
    setupDb({ updateResult: { data: null, error: null } })
    const res = await DELETE(new Request('http://localhost/api/resume?id=r1', { method: 'DELETE' }))
    expect(res.status).toBe(200)
  })
})
