import { EmailVerificationBanner } from '@/components/auth/EmailVerificationBanner'
import { createClient, getProfile } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
import ReferralCard from '@/components/referral/ReferralCard'
import { Briefcase, FileText, TrendingUp, Users } from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const profile = await getProfile()
  const { data: { user } } = await supabase.auth.getUser()
  const userId = profile?.id
  const emailConfirmed = user?.email_confirmed_at

  const [
    { count: appCount },
    { count: interviewCount },
    { count: resumeCount },
    { count: bookingCount },
  ] = await Promise.all([
    supabase.from('job_applications').select('*', { count: 'exact', head: true }).eq('user_id', userId ?? ''),
    supabase.from('job_applications').select('*', { count: 'exact', head: true }).eq('user_id', userId ?? '').eq('status', 'Interviewing'),
    supabase.from('resumes').select('*', { count: 'exact', head: true }).eq('user_id', userId ?? ''),
    supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('user_id', userId ?? ''),
  ])

  const stats = [
    { label: 'Applications', value: String(appCount ?? 0), icon: Briefcase, color: 'text-blue-600 bg-blue-50' },
    { label: 'Active Interviews', value: String(interviewCount ?? 0), icon: TrendingUp, color: 'text-green-600 bg-green-50' },
    { label: 'Resumes', value: String(resumeCount ?? 0), icon: FileText, color: 'text-purple-600 bg-purple-50' },
    { label: 'Expert Sessions', value: String(bookingCount ?? 0), icon: Users, color: 'text-orange-600 bg-orange-50' },
  ]

  return (
    <div className="space-y-8">
      {user && !emailConfirmed && (
        <EmailVerificationBanner email={user.email ?? ''} />
      )}

      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">
          Welcome{profile?.full_name ? `, ${profile.full_name}` : ''}!
        </h1>
        <p className="mt-1 text-[var(--text-secondary)]">
          Here&apos;s an overview of your career journey.
        </p>
      </div>

      {profile?.plan_tier === 'free' && (
        <div className="rounded-2xl border border-[var(--warning)]/25 bg-[var(--warning)]/10 backdrop-blur-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-[var(--warning)]">Free Plan</p>
            <p className="text-xs text-[var(--text-secondary)]">Upgrade to Premium or Premium Pro for unlimited resumes and job tracking.</p>
          </div>
          <Link
            href="/upgrade"
            className="px-4 py-2 bg-[var(--warning)] text-white text-sm font-medium rounded-xl hover:opacity-90 transition-all"
          >
            Upgrade
          </Link>
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.label}
              className="rounded-2xl border border-[var(--glass-border)] bg-[var(--bg-secondary)] p-6 shadow-sm transition-all duration-200 hover:shadow-[var(--glass-glow)] hover:border-[var(--accent)]/30"
            >
              <div className="flex items-center gap-4">
                <div className={`rounded-xl p-3 ${stat.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[var(--text-primary)]">{stat.value}</p>
                  <p className="text-sm text-[var(--text-secondary)]">{stat.label}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--bg-secondary)] p-8 shadow-sm text-center">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Get Started</h2>
        <p className="mt-2 text-[var(--text-secondary)] max-w-md mx-auto">
          Use the sidebar to build your resume, track job applications, and connect with career experts.
        </p>
      </div>

      <ReferralCard />
    </div>
  )
}
