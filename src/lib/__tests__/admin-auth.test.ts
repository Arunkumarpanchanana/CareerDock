import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockAdminClientGetUser = vi.fn()
const mockServerClientGetUser = vi.fn()

function makeSingle(role: string | null) {
  return vi.fn().mockResolvedValue({ data: role ? { role } : null, error: null })
}

function makeClient(getUser: ReturnType<typeof vi.fn>, singleFn?: ReturnType<typeof vi.fn>) {
  const single = singleFn ?? makeSingle('admin')
  const eq = vi.fn(() => ({ single }))
  const select = vi.fn(() => ({ eq }))
  return {
    auth: { getUser },
    from: vi.fn(() => ({ select })),
  }
}

const mockCreateAdminClient = vi.hoisted(() => vi.fn())
const mockCreateServerClient = vi.hoisted(() => vi.fn())

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: mockCreateAdminClient,
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: mockCreateServerClient,
}))

import { authAsAdmin } from '@/lib/admin-auth'

describe('authAsAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCreateAdminClient.mockReset()
    mockCreateServerClient.mockReset()
    mockAdminClientGetUser.mockReset()
    mockServerClientGetUser.mockReset()
  })

  it('returns admin client when admin token is valid', async () => {
    mockCreateAdminClient.mockReturnValue(makeClient(mockAdminClientGetUser))
    mockAdminClientGetUser.mockResolvedValue({ data: { user: { id: 'admin-1' } }, error: null })

    const req = new Request('http://localhost/api/admin/test', {
      headers: { Authorization: 'Bearer valid-token' },
    })
    const result = await authAsAdmin(req)
    expect(result.error).toBeNull()
    expect(result.client).toBeDefined()
  })

  it('returns 403 when admin token is for non-admin user', async () => {
    mockCreateAdminClient.mockReturnValue(makeClient(mockAdminClientGetUser, makeSingle('user')))
    mockAdminClientGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })
    mockCreateServerClient.mockResolvedValue(makeClient(mockServerClientGetUser, makeSingle('user')))
    mockServerClientGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })

    const req = new Request('http://localhost/api/admin/test', {
      headers: { Authorization: 'Bearer user-token' },
    })
    const result = await authAsAdmin(req)
    expect(result.error).toBeDefined()
    const body = await result.error!.json()
    expect(body.error).toBe('Forbidden')
  })

  it('falls back to server client when no auth header', async () => {
    mockCreateAdminClient.mockReturnValue(makeClient(mockAdminClientGetUser))
    mockCreateServerClient.mockResolvedValue(makeClient(mockServerClientGetUser))
    mockServerClientGetUser.mockResolvedValue({ data: { user: { id: 'admin-1' } }, error: null })

    const req = new Request('http://localhost/api/admin/test')
    const result = await authAsAdmin(req)
    expect(result.error).toBeNull()
  })

  it('falls back to server client when admin client token fails', async () => {
    mockCreateAdminClient.mockReturnValue(makeClient(mockAdminClientGetUser, makeSingle('user')))
    mockAdminClientGetUser.mockResolvedValue({ data: { user: { id: 'not-admin' } }, error: null })
    mockCreateServerClient.mockResolvedValue(makeClient(mockServerClientGetUser))
    mockServerClientGetUser.mockResolvedValue({ data: { user: { id: 'admin-1' } }, error: null })

    const req = new Request('http://localhost/api/admin/test', {
      headers: { Authorization: 'Bearer bad-token' },
    })
    const result = await authAsAdmin(req)
    expect(result.error).toBeNull()
  })

  it('returns 403 when no client can verify admin', async () => {
    mockCreateAdminClient.mockReturnValue(makeClient(mockAdminClientGetUser, makeSingle('user')))
    mockAdminClientGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })
    mockCreateServerClient.mockResolvedValue(makeClient(mockServerClientGetUser, makeSingle('user')))
    mockServerClientGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })

    const req = new Request('http://localhost/api/admin/test')
    const result = await authAsAdmin(req)
    expect(result.error).toBeDefined()
    const body = await result.error!.json()
    expect(body.error).toBe('Forbidden')
  })

  it('returns 403 when admin client is null and server user is unauthenticated', async () => {
    mockCreateAdminClient.mockReturnValue(null)
    mockCreateServerClient.mockResolvedValue(makeClient(mockServerClientGetUser))
    mockServerClientGetUser.mockResolvedValue({ data: { user: null }, error: null })

    const req = new Request('http://localhost/api/admin/test')
    const result = await authAsAdmin(req)
    expect(result.error).toBeDefined()
    const body = await result.error!.json()
    expect(body.error).toBe('Forbidden')
  })

  it('returns 403 when profile fetch returns null (no profile row)', async () => {
    mockCreateAdminClient.mockReturnValue(makeClient(mockAdminClientGetUser, makeSingle(null)))
    mockAdminClientGetUser.mockResolvedValue({ data: { user: { id: 'admin-1' } }, error: null })
    mockCreateServerClient.mockResolvedValue(makeClient(mockServerClientGetUser, makeSingle(null)))
    mockServerClientGetUser.mockResolvedValue({ data: { user: { id: 'admin-1' } }, error: null })

    const req = new Request('http://localhost/api/admin/test', {
      headers: { Authorization: 'Bearer valid-token' },
    })
    const result = await authAsAdmin(req)
    expect(result.error).toBeDefined()
    const body = await result.error!.json()
    expect(body.error).toBe('Forbidden')
  })

  it('skips admin client when createAdminClient returns null', async () => {
    mockCreateAdminClient.mockReturnValue(null)
    mockCreateServerClient.mockResolvedValue(makeClient(mockServerClientGetUser))
    mockServerClientGetUser.mockResolvedValue({ data: { user: { id: 'admin-1' } }, error: null })

    const req = new Request('http://localhost/api/admin/test', {
      headers: { Authorization: 'Bearer some-token' },
    })
    const result = await authAsAdmin(req)
    expect(result.error).toBeNull()
    expect(mockAdminClientGetUser).not.toHaveBeenCalled()
  })
})
