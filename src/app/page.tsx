import Link from 'next/link'
import { 
  Building2, 
  FileText, 
  Kanban, 
  Sparkles, 
  Users, 
  ChevronRight,
  CheckCircle2,
  ArrowUpRight,
  Star,
  Quote,
} from 'lucide-react'

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">CareerDock</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/auth/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/auth/signup"
              className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors shadow-sm"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-indigo-50" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-40" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-100 rounded-full blur-3xl opacity-40" />
          
          <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
            <div className="text-center max-w-4xl mx-auto">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-sm font-medium text-blue-700 mb-8">
                <Sparkles className="h-4 w-4" />
                Land your dream job faster
              </div>
              
              <h1 className="text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl lg:text-7xl leading-[1.1]">
                Your{' '}
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Career Accelerator
                </span>
                <br />
                in One Place
              </h1>
              
              <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600 leading-relaxed">
                Build ATS-optimized resumes, track every job application on a visual Kanban board, 
                get AI-powered insights, and book 1:1 sessions with industry experts — all from one dashboard.
              </p>

              <div className="mt-10 flex items-center justify-center gap-4 flex-wrap">
                <Link
                  href="/auth/signup"
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-3.5 text-base font-semibold text-white hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                >
                  Start Free <ArrowUpRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/auth/login"
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-8 py-3.5 text-base font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Sign In <ChevronRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="mt-12 grid grid-cols-3 gap-8 max-w-lg mx-auto">
                {[
                  { label: 'Resume Templates', value: '10+' },
                  { label: 'Job Pipelines', value: 'Unlimited' },
                  { label: 'Expert Sessions', value: '1:1' },
                ].map((stat) => (
                  <div key={stat.label} className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="border-t border-gray-100 bg-white py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
                Everything you need to land the role
              </h2>
              <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
                From resume to offer letter — CareerDock supports every step of your job search.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  icon: FileText,
                  title: 'ATS Resume Builder',
                  desc: 'Create clean, serif-formatted resumes that pass Applicant Tracking Systems. Download as PDF instantly.',
                  color: 'text-blue-600 bg-blue-50',
                },
                {
                  icon: Kanban,
                  title: 'Job Pipeline Tracker',
                  desc: 'Drag applications across Wishlist → Applied → Interviewing → Offered → Rejected. Never lose track.',
                  color: 'text-emerald-600 bg-emerald-50',
                },
                {
                  icon: Sparkles,
                  title: 'AI-Powered Insights',
                  desc: 'Get smart suggestions for bullet points, skills, and summaries. Optimize for every job description.',
                  color: 'text-purple-600 bg-purple-50',
                },
                {
                  icon: Users,
                  title: 'Expert Consultations',
                  desc: 'Book 1:1 sessions with industry professionals for resume reviews, interview prep, and career advice.',
                  color: 'text-orange-600 bg-orange-50',
                },
              ].map(({ icon: Icon, title, desc, color }) => (
                <div key={title} className="group rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:border-blue-200 transition-all duration-200">
                  <div className={`inline-flex rounded-lg p-3 ${color} mb-4`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {title}
                  </h3>
                  <p className="mt-2 text-sm text-gray-600 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="bg-gray-50 py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
                Three steps to your next role
              </h2>
              <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
                Get started in minutes, not hours.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              {[
                { step: '01', title: 'Build Your Resume', desc: 'Fill in your details with our guided editor. Choose from expert-written templates and bullet point suggestions.' },
                { step: '02', title: 'Track Applications', desc: 'Add jobs to your pipeline, move them across stages with drag-and-drop, and never miss a follow-up.' },
                { step: '03', title: 'Get Expert Help', desc: 'Book 1:1 sessions with industry professionals who have been where you want to go. Get feedback that works.' },
              ].map(({ step, title, desc }) => (
                <div key={step} className="relative">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-lg font-bold text-white mb-4">
                    {step}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
                  <p className="mt-2 text-gray-600 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonial */}
        <section className="bg-white py-24">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
            <Quote className="h-8 w-8 text-blue-200 mx-auto mb-6" />
            <blockquote className="text-xl sm:text-2xl text-gray-700 leading-relaxed font-medium">
              &ldquo;I went from sending out scattered applications to running a structured job search 
              with CareerDock. The resume builder alone saved me hours.&rdquo;
            </blockquote>
            <div className="mt-8 flex items-center justify-center gap-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <p className="mt-4 text-sm font-medium text-gray-900">Early Access User</p>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-gradient-to-br from-blue-600 to-indigo-700 py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Ready to accelerate your career?
            </h2>
            <p className="mt-4 text-lg text-blue-100 max-w-xl mx-auto">
              Join CareerDock for free. No credit card required.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4 flex-wrap">
              <Link
                href="/auth/signup"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-blue-700 hover:bg-blue-50 transition-colors shadow-lg"
              >
                Create Free Account <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-8 flex items-center justify-center gap-6 text-sm text-blue-200">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" /> No credit card</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" /> Cancel anytime</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" /> Free updates</span>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-100 bg-gray-50 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-semibold text-gray-900">CareerDock</span>
            </div>
            <p className="text-sm text-gray-500">
              &copy; {new Date().getFullYear()} CareerDock. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
