import { EmailVerificationBanner } from '@/components/auth/EmailVerificationBanner'
import { createClient, getProfile } from '@/lib/supabase/server'
import { Briefcase, FileText, TrendingUp, Users } from 'lucide-react'

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
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome{profile?.full_name ? `, ${profile.full_name}` : ''}!
        </h1>
        <p className="mt-1 text-gray-600">
          Here&apos;s an overview of your career journey.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.label}
              className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className={`rounded-lg p-3 ${stat.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm text-center">
        <h2 className="text-lg font-semibold text-gray-900">Get Started</h2>
        <p className="mt-2 text-gray-600 max-w-md mx-auto">
          Use the sidebar to build your resume, track job applications, and connect with career experts.
        </p>
      </div>
    </div>
  )
}
