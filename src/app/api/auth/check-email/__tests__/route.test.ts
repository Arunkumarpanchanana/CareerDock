import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockAdminListUsers = vi.hoisted(() => vi.fn())
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({
    auth: { admin: { listUsers: mockAdminListUsers } },
  })),
}))

import { POST } from '../route'

describe('POST /api/auth/check-email', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns exists: true when email is taken', async () => {
    mockAdminListUsers.mockResolvedValue({
      data: { users: [{ email: 'taken@test.com', id: 'u1' }] },
      error: null,
    })
    const req = new Request('http://localhost/api/auth/check-email', {
      method: 'POST',
      body: JSON.stringify({ email: 'taken@test.com' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    const body = await res.json()
    expect(body.exists).toBe(true)
  })

  it('returns exists: false when email is free', async () => {
    mockAdminListUsers.mockResolvedValue({
      data: { users: [] },
      error: null,
    })
    const req = new Request('http://localhost/api/auth/check-email', {
      method: 'POST',
      body: JSON.stringify({ email: 'new@test.com' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    const body = await res.json()
    expect(body.exists).toBe(false)
  })

  it('returns 400 for missing email', async () => {
    const req = new Request('http://localhost/api/auth/check-email', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})
