import Link from 'next/link'

export default function MarketingHome() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-20 text-center">
      <h1 className="text-5xl font-bold mb-6">Your AI Career Companion</h1>
      <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
        Practice interviews, get coaching, improve your resume — all with AI.
      </p>
      <div className="flex gap-4 justify-center">
        <a
          href="https://app.mycareerdock.com"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
        >
          Go to App →
        </a>
        <Link
          href="/articles"
          className="px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
        >
          Read Articles
        </Link>
      </div>
    </div>
  )
}
