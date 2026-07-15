'use client'

import { useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Article } from '@/types/database'

interface Props {
  article?: Article
}

export function ArticleEditor({ article }: Props) {
  const [title, setTitle] = useState(article?.title || '')
  const [slug, setSlug] = useState(article?.slug || '')
  const [excerpt, setExcerpt] = useState(article?.excerpt || '')
  const [imageUrl, setImageUrl] = useState(article?.image_url || '')
  const [published, setPublished] = useState(article?.published || false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const editor = useEditor({
    extensions: [StarterKit, Image],
    content: article?.content || '<p></p>',
  })

  const generateSlug = (val: string) => {
    if (article) return
    setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''))
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    const formData = new FormData()
    formData.append('image', file)
    const res = await fetch('/api/cms/upload', {
      method: 'POST',
      headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
      body: formData,
    })
    const data = await res.json()
    if (data.url) {
      setImageUrl(data.url)
    }
  }

  const handleSave = async () => {
    if (!title || !slug) { setError('Title and slug are required'); return }
    setSaving(true)
    setError('')
    const content = editor?.getJSON() || {}
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`

    const body = { title, slug, content, excerpt, image_url: imageUrl, published }
    const res = article
      ? await fetch('/api/cms/articles', { method: 'PUT', headers, body: JSON.stringify({ ...body, id: article.id }) })
      : await fetch('/api/cms/articles', { method: 'POST', headers, body: JSON.stringify(body) })

    if (!res.ok) { const d = await res.json(); setError(d.error || 'Save failed'); setSaving(false); return }
    setSaving(false)
    router.push('/cms')
    router.refresh()
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{article ? 'Edit Article' : 'New Article'}</h1>
        <div className="flex gap-3">
          <label className="text-sm text-gray-600 flex items-center gap-2">
            <input type="checkbox" checked={published} onChange={e => setPublished(e.target.checked)} />
            Published
          </label>
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium">Title</label>
          <input value={title} onChange={e => { setTitle(e.target.value); generateSlug(e.target.value) }} className="w-full rounded-lg border px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-sm font-medium">Slug</label>
          <input value={slug} onChange={e => setSlug(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm font-mono" placeholder="my-article-slug" />
        </div>
        <div>
          <label className="text-sm font-medium">Excerpt</label>
          <textarea value={excerpt} onChange={e => setExcerpt(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm" rows={2} />
        </div>
        <div>
          <label className="text-sm font-medium">Hero Image</label>
          {imageUrl && <img src={imageUrl} alt="Hero" className="max-h-48 rounded-lg mb-2 object-cover" />}
          <input type="file" accept="image/*" onChange={handleImageUpload} className="text-sm" />
        </div>
        <div>
          <label className="text-sm font-medium">Content</label>
          <div className="rounded-lg border prose max-w-none p-4 min-h-[300px]">
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>
    </div>
  )
}
