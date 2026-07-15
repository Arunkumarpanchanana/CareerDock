'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ArticleComment } from '@/types/database'

interface CommentWithProfile extends ArticleComment {
  profiles: { full_name: string } | null
}

export function CommentSection({ articleId, comments: initialComments }: { articleId: string; comments: CommentWithProfile[] }) {
  const [comments, setComments] = useState(initialComments)
  const [content, setContent] = useState('')
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState('')

  const handlePost = async () => {
    if (!content.trim()) return
    setPosting(true)
    setError('')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('Please sign in to comment.')
      setPosting(false)
      return
    }
    const { data, error: err } = await supabase
      .from('article_comments')
      .insert({ article_id: articleId, user_id: user.id, content: content.trim() })
      .select('*, profiles(full_name)')
      .single()
    if (err) { setError(err.message); setPosting(false); return }
    setComments([...comments, data as CommentWithProfile])
    setContent('')
    setPosting(false)
  }

  return (
    <div className="mt-12 border-t pt-8">
      <h2 className="text-xl font-bold mb-6">Comments</h2>
      <div className="space-y-4 mb-8">
        {comments.map(c => (
          <div key={c.id} className="rounded-lg border p-4">
            <p className="text-sm font-medium">{c.profiles?.full_name || 'Anonymous'}</p>
            <p className="text-sm text-gray-600 mt-1">{c.content}</p>
            <p className="text-xs text-gray-400 mt-1">{new Date(c.created_at).toLocaleDateString()}</p>
          </div>
        ))}
        {comments.length === 0 && <p className="text-sm text-gray-500">No comments yet.</p>}
      </div>
      <div className="space-y-2">
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Write a comment..."
          className="w-full rounded-lg border p-3 text-sm"
          rows={3}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          onClick={handlePost}
          disabled={posting || !content.trim()}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {posting ? 'Posting...' : 'Post Comment'}
        </button>
      </div>
    </div>
  )
}
