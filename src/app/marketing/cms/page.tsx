'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export const dynamic = 'force-dynamic'
import { Pencil, Trash2, Plus } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Article } from '@/types/database'

export default function CMSList() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const headers: Record<string, string> = {}
      if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`
      const res = await fetch('/api/cms/articles', { headers })
      const data = await res.json()
      if (Array.isArray(data)) setArticles(data)
      setLoading(false)
    }
    load()
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this article?')) return
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch('/api/cms/articles', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}) },
      body: JSON.stringify({ id }),
    })
    if (!res.ok) return
    setArticles(prev => prev.filter(a => a.id !== id))
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Articles</h1>
        <Link href="/cms/new" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
          <Plus className="h-4 w-4" /> New Article
        </Link>
      </div>
      {loading && <p className="text-gray-500">Loading...</p>}
      {!loading && articles.length === 0 && <p className="text-gray-500">No articles yet.</p>}
      <div className="space-y-3">
        {articles.map(a => (
          <div key={a.id} className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <p className="font-medium">{a.title}</p>
              <div className="flex gap-3 text-xs text-gray-500 mt-1">
                <span>{a.published ? 'Published' : 'Draft'}</span>
                <span>{new Date(a.created_at).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => router.push(`/cms/edit/${a.slug}`)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                <Pencil className="h-4 w-4" />
              </button>
              <button onClick={() => handleDelete(a.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
