'use client'

import { createClient } from '@/lib/supabase/client'
import { Briefcase, Calendar, ExternalLink, TrendingUp, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function AdminDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState<{ label: string; value: string; icon: typeof Users; color: string }[]>([])
  const [loadingStats, setLoadingStats] = useState(true)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const load = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const headers: Record<string, string> = {}
      if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`
      try {
        const [experts, users, bookings] = await Promise.all([
          fetch('/api/admin/experts', { headers }).then(r => r.json()),
          fetch('/api/admin/admins', { headers }).then(r => r.json()),
          fetch('/api/admin/bookings', { headers }).then(r => r.json()),
        ])
        const adms = (Array.isArray(users) ? users : []).filter((u: { role: string }) => u.role === 'admin')
        setStats([
          { label: 'Total Users', value: String(Array.isArray(users) ? users.length : 0), icon: Users, color: 'text-blue-600 bg-blue-50' },
          { label: 'Admins', value: String(adms.length), icon: TrendingUp, color: 'text-purple-600 bg-purple-50' },
          { label: 'Experts', value: String(Array.isArray(experts) ? experts.length : 0), icon: Briefcase, color: 'text-green-600 bg-green-50' },
          { label: 'Bookings', value: String(Array.isArray(bookings) ? bookings.length : 0), icon: Calendar, color: 'text-orange-600 bg-orange-50' },
        ])
      } catch { /* stats will show 0 */ }
      finally { setLoadingStats(false) }
    }
    load()
  }, [])

  if (loadingStats) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin h-6 w-6 border-2 border-[var(--accent)] border-t-transparent rounded-full" />
      </div>
    )
  }

  const cards = [
    { label: 'Manage Experts', desc: 'Add, edit, or remove expert consultants', href: '/admin/experts', icon: Briefcase, color: 'border-l-green-500' },
    { label: 'Manage Admins', desc: 'Promote or demote admin users', href: '/admin/admins', icon: Users, color: 'border-l-purple-500' },
    { label: 'View Bookings', desc: 'Track all expert session bookings', href: '/admin/bookings', icon: Calendar, color: 'border-l-orange-500' },
    { label: 'User Management', desc: 'View and manage all users, plans, and referrals', href: '/admin/users', icon: Users, color: 'border-l-blue-500' },
    { label: 'Sales Dashboard', desc: 'View plan adoption and revenue metrics', href: '/admin/sales', icon: TrendingUp, color: 'border-l-amber-500' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Portal</h1>
        <p className="mt-1 text-gray-600">Manage experts, users, and bookings across the platform.</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
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

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map(({ label, desc, href, icon: Icon, color }) => (
          <button
            key={href}
            onClick={() => router.push(href)}
            className={`rounded-xl border border-gray-200 border-l-4 ${color} bg-white p-6 shadow-sm text-left hover:shadow-md transition-shadow`}
          >
            <div className="flex items-center gap-3 mb-2">
              <Icon className="h-5 w-5 text-gray-700" />
              <h3 className="font-semibold text-gray-900">{label}</h3>
              <ExternalLink className="h-3.5 w-3.5 text-gray-400 ml-auto" />
            </div>
            <p className="text-sm text-gray-600">{desc}</p>
          </button>
        ))}
      </div>
    </div>
  )
}
