import { notFound } from 'next/navigation'
import { getArticle, getArticles } from '@/lib/articles'
import ReactMarkdown from 'react-markdown'

export function generateStaticParams() {
  return getArticles().map(a => ({ slug: a.slug }))
}

export default function ArticlePage({ params }: { params: { slug: string } }) {
  const article = getArticle(params.slug)
  if (!article) notFound()

  return (
    <article className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">{article.title}</h1>
      <p className="text-gray-400 text-sm mb-8">{new Date(article.date).toLocaleDateString()}</p>
      <div className="prose max-w-none">
        <ReactMarkdown>{article.content}</ReactMarkdown>
      </div>
    </article>
  )
}
