import Link from 'next/link'
import type { ReactNode } from 'react'

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-gray-200">
        <nav className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold">CareerDock</Link>
          <div className="flex gap-6 text-sm">
            <Link href="/articles" className="hover:text-blue-600">Articles</Link>
            <Link href="/offers" className="hover:text-blue-600">Offers</Link>
            <a href="https://app.mycareerdock.com" className="text-blue-600 font-medium">Launch App →</a>
          </div>
        </nav>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-gray-200 py-8 text-center text-sm text-gray-500">
        © 2026 CareerDock
      </footer>
    </div>
  )
}
