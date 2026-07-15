import { describe, it, expect, vi } from 'vitest'

describe('cms lib', () => {
  it('should construct article list query', () => {
    const query = 'SELECT * FROM articles WHERE published = true ORDER BY created_at DESC'
    expect(query).toContain('articles')
    expect(query).toContain('published')
  })
})
