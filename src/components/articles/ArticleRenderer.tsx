'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import { useEffect } from 'react'

export function ArticleRenderer({ content }: { content: Record<string, unknown> }) {
  const editor = useEditor({
    extensions: [StarterKit, Image],
    content,
    editable: false,
  })

  useEffect(() => {
    return () => editor?.destroy()
  }, [editor])

  if (!editor) return null

  return <div className="prose max-w-none"><EditorContent editor={editor} /></div>
}
