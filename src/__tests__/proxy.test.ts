import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/proxy', () => ({
  updateSession: vi.fn(),
}))

import { proxy } from '@/proxy'
import { updateSession } from '@/lib/supabase/proxy'

function makeRequest(host: string, pathname: string) {
  const url = new URL(`https://${host}${pathname}`)
  return {
    nextUrl: Object.assign(url, {
      clone: () => new URL(url.toString()),
    }),
    headers: new Map([['host', host]]),
    url: url.toString(),
  } as any
}

describe('proxy /admin routing', () => {
  beforeEach(() => {
    vi.mocked(updateSession).mockResolvedValue({
      supabaseResponse: new Response(),
      user: { id: 'admin-1', email: 'admin@test.com' },
    } as any)
  })

  it('serves admin dashboard on app domain (not redirecting to marketing)', async () => {
    const req = makeRequest('app.mycareerdock.com', '/admin')
    const res = await proxy(req)
    expect(res.status).not.toBe(307)
    expect(res.status).not.toBe(308)
  })

  it('redirects /admin to app domain when on marketing domain', async () => {
    const req = makeRequest('mycareerdock.com', '/admin')
    const res = await proxy(req)
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toContain('app.mycareerdock.com/admin')
  })

  it('redirects marketing paths to marketing domain from app domain', async () => {
    const req = makeRequest('app.mycareerdock.com', '/articles')
    const res = await proxy(req)
    expect(res.status).toBe(307)
  })

  it('redirects unauthenticated user on app domain to login', async () => {
    vi.mocked(updateSession).mockResolvedValue({
      supabaseResponse: new Response(),
      user: null,
    } as any)

    const req = makeRequest('app.mycareerdock.com', '/admin')
    const res = await proxy(req)
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toContain('/auth/login')
  })
})
