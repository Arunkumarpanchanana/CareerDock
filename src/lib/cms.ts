import { createClient } from '@/lib/supabase/server'
import type { Article, ArticleComment } from '@/types/database'

export async function getPublishedArticles() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('articles')
    .select('*')
    .eq('published', true)
    .order('created_at', { ascending: false })
  return data as Article[] | null
}

export async function getArticleBySlug(slug: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('articles')
    .select('*')
    .eq('slug', slug)
    .single()
  return data as Article | null
}

export async function getComments(articleId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('article_comments')
    .select('*, profiles(full_name)')
    .eq('article_id', articleId)
    .order('created_at', { ascending: true })
  return data as (ArticleComment & { profiles: { full_name: string } })[] | null
}
