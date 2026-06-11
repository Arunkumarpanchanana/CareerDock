'use client'

import { useEffect, useState } from 'react'
import type { Profile } from '@/types/database'

interface PlanStats {
  total: number
  free: number
  premium: number
  conversionRate: string
  referredCount: number
  withReferralCode: number
}

export default function SalesDashboardPage() {
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/users')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setUsers(data)
        else setError('Failed to load data')
      })
      .catch(() => setError('Failed to load data'))
      .finally(() => setLoading(false))
  }, [])

  const stats: PlanStats = {
    total: users.length,
    free: users.filter(u => u.plan_tier === 'free').length,
    premium: users.filter(u => u.plan_tier === 'premium').length,
    conversionRate: users.length > 0
      ? ((users.filter(u => u.plan_tier === 'premium').length / users.length) * 100).toFixed(1)
      : '0.0',
    referredCount: users.filter(u => u.referred_by).length,
    withReferralCode: users.filter(u => u.referral_code).length,
  }

  const statCards = [
    { label: 'Total Users', value: String(stats.total), sub: 'registered accounts', color: 'text-blue-600 bg-blue-50' },
    { label: 'Free Plan', value: String(stats.free), sub: `${stats.total > 0 ? ((stats.free / stats.total) * 100).toFixed(0) : 0}% of users`, color: 'text-gray-600 bg-gray-50' },
    { label: 'Premium Plan', value: String(stats.premium), sub: `${stats.conversionRate}% conversion rate`, color: 'text-green-600 bg-green-50' },
    { label: 'Referred Users', value: String(stats.referredCount), sub: `${stats.withReferralCode} users with referral codes`, color: 'text-purple-600 bg-purple-50' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Sales Dashboard</h1>
        <p className="mt-1 text-gray-600">Plan adoption and user metrics.</p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-1">
              <div className={`rounded-lg p-2 ${stat.color}`}>
                <div className="h-4 w-4" />
              </div>
              <p className="text-sm font-medium text-gray-500">{stat.label}</p>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-xs text-gray-500 mt-1">{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Plan Distribution</h2>
        {stats.total > 0 ? (
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Free</span>
                <span className="font-medium text-gray-900">{stats.free} ({((stats.free / stats.total) * 100).toFixed(0)}%)</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gray-400 rounded-full transition-all"
                  style={{ width: `${(stats.free / stats.total) * 100}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Premium</span>
                <span className="font-medium text-gray-900">{stats.premium} ({((stats.premium / stats.total) * 100).toFixed(0)}%)</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all"
                  style={{ width: `${(stats.premium / stats.total) * 100}%` }}
                />
              </div>
            </div>
          </div>
        ) : (
          <p className="text-gray-400 text-sm py-4 text-center">No user data available yet.</p>
        )}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Users</h2>
        {users.length > 0 ? (
          <div className="space-y-3">
            {users.slice(-5).reverse().map((u) => (
              <div key={u.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">{u.full_name}</p>
                  <p className="text-xs text-gray-500">{u.email}</p>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  u.plan_tier === 'premium' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {u.plan_tier}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-sm py-4 text-center">No users yet.</p>
        )}
      </div>
    </div>
  )
}
