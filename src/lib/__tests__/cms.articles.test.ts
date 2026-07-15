import { describe, it, expect, vi } from 'vitest'

const mockCreateClient = vi.hoisted(() => vi.fn())

vi.mock('@/lib/supabase/server', () => ({
  createClient: mockCreateClient,
}))

import { getPublishedArticles } from '../cms'

describe('cms lib', () => {
  it('returns articles from getPublishedArticles', async () => {
    const mockData = [
      { id: '1', title: 'Test', slug: 'test', published: true, created_at: '2024-01-01' },
    ]
    mockCreateClient.mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn().mockResolvedValue({ data: mockData, error: null }),
          })),
        })),
      })),
    })
    const result = await getPublishedArticles()
    expect(result).toEqual(mockData)
  })

  it('returns null on error', async () => {
    mockCreateClient.mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn().mockResolvedValue({ data: null, error: new Error('DB error') }),
          })),
        })),
      })),
    })
    const result = await getPublishedArticles()
    expect(result).toBeNull()
  })
})
