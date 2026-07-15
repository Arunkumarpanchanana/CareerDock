import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CommentSection } from '../CommentSection'
import type { ArticleComment } from '@/types/database'

interface CommentWithProfile extends ArticleComment {
  profiles: { full_name: string } | null
}

const mockComments: CommentWithProfile[] = [
  {
    id: '1',
    article_id: 'article-1',
    user_id: 'user-1',
    content: 'Great article!',
    created_at: '2024-01-01T00:00:00Z',
    profiles: { full_name: 'Alice' },
  },
  {
    id: '2',
    article_id: 'article-1',
    user_id: 'user-2',
    content: 'Thanks for sharing.',
    created_at: '2024-01-02T00:00:00Z',
    profiles: { full_name: 'Bob' },
  },
]

describe('CommentSection', () => {
  it('renders comments passed as props', () => {
    render(<CommentSection articleId="article-1" comments={mockComments} />)
    expect(screen.getByText('Great article!')).toBeInTheDocument()
    expect(screen.getByText('Thanks for sharing.')).toBeInTheDocument()
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
  })

  it('shows No comments yet when comments array is empty', () => {
    render(<CommentSection articleId="article-1" comments={[]} />)
    expect(screen.getByText('No comments yet.')).toBeInTheDocument()
  })

  it('renders textarea and post button', () => {
    render(<CommentSection articleId="article-1" comments={[]} />)
    expect(screen.getByPlaceholderText('Write a comment...')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Post Comment' })).toBeInTheDocument()
  })
})
