import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'

const mockRedirect = vi.hoisted(() => vi.fn())

vi.mock('next/navigation', () => ({
  redirect: mockRedirect,
}))

const mockGetUser = vi.fn()
const mockMaybeSingle = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

import AdminLayout from '../layout'
import { createClient } from '@/lib/supabase/server'

describe('AdminLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRedirect.mockReset()
    mockGetUser.mockReset()
    mockMaybeSingle.mockReset()

    mockRedirect.mockImplementation(() => {
      throw new Error('REDIRECT_CALLED')
    })

    mockGetUser.mockResolvedValue({ data: { user: { id: 'admin-1' } }, error: null })
  })

  function mockSupabaseClient() {
    const client = {
      auth: { getUser: mockGetUser },
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: mockMaybeSingle,
          })),
        })),
      })),
    }
    vi.mocked(createClient).mockResolvedValue(client as never)
    return client
  }

  it('renders children for admin user', async () => {
    mockSupabaseClient()
    mockMaybeSingle.mockResolvedValue({ data: { role: 'admin' }, error: null })

    const result = await AdminLayout({ children: React.createElement('div', null, 'Admin Content') })
    expect(mockRedirect).not.toHaveBeenCalled()
  })

  it('redirects to login when createClient fails', async () => {
    vi.mocked(createClient).mockRejectedValue(new Error('Supabase not configured'))

    try {
      await AdminLayout({ children: null })
    } catch { /* expected */ }

    expect(mockRedirect).toHaveBeenCalledWith('/auth/login')
  })

  it('redirects to login when user is not authenticated', async () => {
    mockSupabaseClient()
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null })

    try {
      await AdminLayout({ children: null })
    } catch { /* expected */ }

    expect(mockRedirect).toHaveBeenCalledWith('/auth/login')
  })

  it('redirects to login when getUser returns error', async () => {
    mockSupabaseClient()
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error('Auth error') })

    try {
      await AdminLayout({ children: null })
    } catch { /* expected */ }

    expect(mockRedirect).toHaveBeenCalledWith('/auth/login')
  })

  it('redirects to login when profile fetch errors', async () => {
    mockSupabaseClient()
    mockMaybeSingle.mockResolvedValue({ data: null, error: new Error('DB error') })

    try {
      await AdminLayout({ children: null })
    } catch { /* expected */ }

    expect(mockRedirect).toHaveBeenCalledWith('/auth/login')
  })

  it('redirects to dashboard when user is not admin', async () => {
    mockSupabaseClient()
    mockMaybeSingle.mockResolvedValue({ data: { role: 'user' }, error: null })

    try {
      await AdminLayout({ children: null })
    } catch { /* expected */ }

    expect(mockRedirect).toHaveBeenCalledWith('/dashboard')
  })

  it('redirects to dashboard when profile is null (no profile row)', async () => {
    mockSupabaseClient()
    mockMaybeSingle.mockResolvedValue({ data: null, error: null })

    try {
      await AdminLayout({ children: null })
    } catch { /* expected */ }

    expect(mockRedirect).toHaveBeenCalledWith('/dashboard')
  })
})
