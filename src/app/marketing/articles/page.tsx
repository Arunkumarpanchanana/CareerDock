import Link from 'next/link'
import { getPublishedArticles } from '@/lib/cms'

export default async function ArticlesPage() {
  const articles = (await getPublishedArticles()) ?? []
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Articles</h1>
      {articles.length === 0 && <p className="text-gray-500">No articles yet.</p>}
      <div className="space-y-6">
        {articles.map(a => (
          <article key={a.slug} className="border-b border-gray-200 pb-6">
            <Link href={`/articles/${a.slug}`} className="block group">
              <h2 className="text-xl font-semibold group-hover:text-blue-600">{a.title}</h2>
              {a.excerpt && <p className="text-gray-600 mt-1">{a.excerpt}</p>}
              <p className="text-sm text-gray-400 mt-2">{new Date(a.created_at).toLocaleDateString()}</p>
            </Link>
          </article>
        ))}
      </div>
    </div>
  )
}
