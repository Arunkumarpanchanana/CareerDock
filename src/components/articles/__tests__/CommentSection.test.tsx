import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CommentSection } from '../CommentSection'

const mockInsert = vi.fn()

function createMockClient(user?: { id: string } | null) {
  return vi.fn(() => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: user ?? { id: 'user-1' } } }),
    },
    from: vi.fn(() => ({
      insert: mockInsert,
    })),
  }))
}

vi.mock('@/lib/supabase/client', () => ({
  createClient: createMockClient(),
}))

describe('CommentSection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders comments passed as props', () => {
    const comments = [
      {
        id: '1',
        article_id: 'article-1',
        user_id: 'user-1',
        content: 'Great article!',
        created_at: '2024-01-01T00:00:00Z',
        profiles: { full_name: 'Alice' },
      },
    ]
    render(<CommentSection articleId="article-1" comments={comments} />)
    expect(screen.getByText('Great article!')).toBeInTheDocument()
    expect(screen.getByText('Alice')).toBeInTheDocument()
  })

  it('shows empty state when no comments', () => {
    render(<CommentSection articleId="article-1" comments={[]} />)
    expect(screen.getByText('No comments yet.')).toBeInTheDocument()
  })

  it('does not post empty content', () => {
    render(<CommentSection articleId="article-1" comments={[]} />)
    fireEvent.click(screen.getByRole('button', { name: 'Post Comment' }))
    expect(mockInsert).not.toHaveBeenCalled()
  })

  it('posts a comment on submit', async () => {
    mockInsert.mockReturnValue({
      select: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({
          data: { id: '3', article_id: 'article-1', user_id: 'user-1', content: 'Nice post!', created_at: '2024-01-03T00:00:00Z', profiles: { full_name: 'Test User' } },
          error: null,
        }),
      })),
    })
    render(<CommentSection articleId="article-1" comments={[]} />)
    const textarea = screen.getByPlaceholderText('Write a comment...')
    fireEvent.change(textarea, { target: { value: 'Nice post!' } })
    fireEvent.click(screen.getByRole('button', { name: 'Post Comment' }))
    await waitFor(() => {
      expect(screen.getByText('Nice post!')).toBeInTheDocument()
    })
  })
})
