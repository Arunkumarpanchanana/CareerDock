import Link from 'next/link'
import { Building2 } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-gray-200">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <Building2 className="h-7 w-7 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">CareerDock</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/auth/login"
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              Sign In
            </Link>
            <Link
              href="/auth/signup"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
              Accelerate Your
              <span className="text-blue-600"> Career Journey</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
              Build ATS-optimized resumes, track job applications, and get AI-powered insights
              to land your dream role faster.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link
                href="/auth/signup"
                className="rounded-lg bg-blue-600 px-8 py-3 text-base font-medium text-white hover:bg-blue-700 transition-colors"
              >
                Start Free
              </Link>
              <Link
                href="/auth/login"
                className="rounded-lg border border-gray-300 bg-white px-8 py-3 text-base font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Sign In
              </Link>
            </div>
          </div>
        </section>

        <section className="border-t border-gray-200 bg-white py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-8 md:grid-cols-3">
              {[
                {
                  title: 'ATS-Optimized Resume',
                  description: 'Build resumes that pass Applicant Tracking Systems with clean, structured formatting.',
                },
                {
                  title: 'Job Pipeline Tracker',
                  description: 'Track applications from wishlist to offer with a visual Kanban board.',
                },
                {
                  title: 'AI Co-Pilot',
                  description: 'Get AI-powered resume scoring and bullet-point enhancements against any job description.',
                },
              ].map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-xl border border-gray-200 p-6 text-center"
                >
                  <h3 className="text-lg font-semibold text-gray-900">{feature.title}</h3>
                  <p className="mt-2 text-sm text-gray-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-200 py-8">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-gray-500 sm:px-6 lg:px-8">
          &copy; {new Date().getFullYear()} CareerDock. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
