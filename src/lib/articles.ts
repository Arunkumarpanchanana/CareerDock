import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

export interface Article {
  slug: string
  title: string
  date: string
  excerpt: string
  tags: string[]
  published: boolean
  content: string
}

const articlesDir = path.join(process.cwd(), 'content/articles')

export function getArticles(): Article[] {
  if (!fs.existsSync(articlesDir)) return []
  const files = fs.readdirSync(articlesDir).filter(f => f.endsWith('.md'))
  const articles = files.map(file => {
    const raw = fs.readFileSync(path.join(articlesDir, file), 'utf-8')
    const { data, content } = matter(raw)
    return {
      slug: file.replace('.md', ''),
      title: data.title || '',
      date: data.date ? new Date(data.date).toISOString() : '',
      excerpt: data.excerpt || '',
      tags: data.tags || [],
      published: data.published !== false,
      content,
    }
  })
  return articles.filter(a => a.published).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export function getArticle(slug: string): Article | null {
  return getArticles().find(a => a.slug === slug) || null
}
