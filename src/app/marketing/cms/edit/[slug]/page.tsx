import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ArticleEditor } from '@/components/cms/ArticleEditor'

export default async function EditArticlePage({ params }: { params: { slug: string } }) {
  const supabase = await createClient()
  const { data } = await supabase.from('articles').select('*').eq('slug', params.slug).single()
  if (!data) notFound()
  return <ArticleEditor article={data} />
}
