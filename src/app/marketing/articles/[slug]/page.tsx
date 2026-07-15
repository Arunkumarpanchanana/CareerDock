import { notFound } from 'next/navigation'
import { getArticleBySlug, getComments } from '@/lib/cms'
import { CommentSection } from '@/components/articles/CommentSection'
import { ArticleRenderer } from '@/components/articles/ArticleRenderer'

export default async function ArticlePage({ params }: { params: { slug: string } }) {
  const article = await getArticleBySlug(params.slug)
  if (!article) notFound()
  const comments = (await getComments(article.id)) ?? []

  return (
    <article className="max-w-3xl mx-auto px-4 py-12">
      {article.image_url && (
        <img src={article.image_url} alt={article.title} className="w-full rounded-xl mb-8 object-cover max-h-96" />
      )}
      <h1 className="text-3xl font-bold mb-2">{article.title}</h1>
      <p className="text-gray-400 text-sm mb-8">{new Date(article.created_at).toLocaleDateString()}</p>
      {article.excerpt && <p className="text-lg text-gray-600 mb-6 italic">{article.excerpt}</p>}
      <ArticleRenderer content={article.content as Record<string, unknown>} />
      <CommentSection articleId={article.id} comments={comments} />
    </article>
  )
}
