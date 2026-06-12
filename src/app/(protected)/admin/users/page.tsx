'use client'

import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types/database'
import { useEffect, useState } from 'react'

const PLAN_COLORS: Record<string, string> = {
  free: 'bg-gray-100 text-gray-700',
  premium: 'bg-green-100 text-green-700',
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`
      try {
        const res = await fetch('/api/admin/users', { headers })
        const data = await res.json()
        if (Array.isArray(data)) setUsers(data)
        else setError('Failed to load users')
      } catch {
        setError('Failed to load users')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const togglePlan = async (user: Profile) => {
    const newTier = user.plan_tier === 'premium' ? 'free' : 'premium'
    setUpdating(user.id)
    setError(null)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers,
        body: JSON.stringify({ id: user.id, plan_tier: newTier }),
      })
      if (!res.ok) throw new Error('Update failed')
      setUsers(prev => prev.map(u => (u.id === user.id ? { ...u, plan_tier: newTier } : u)))
    } catch {
      setError('Failed to update plan')
    } finally {
      setUpdating(null)
    }
  }

  const filtered = users.filter(u =>
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  )

  const freeCount = users.filter(u => u.plan_tier === 'free').length
  const premiumCount = users.filter(u => u.plan_tier === 'premium').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="mt-1 text-sm text-gray-600">
            {users.length} total · {freeCount} free · {premiumCount} premium
          </p>
        </div>
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-64 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Role</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Plan</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Referral Code</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{u.full_name}</td>
                <td className="px-4 py-3 text-gray-600">{u.email || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${PLAN_COLORS[u.plan_tier] || 'bg-gray-100 text-gray-500'}`}>
                    {u.plan_tier}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-500 font-mono">{u.referral_code || '—'}</td>
                  <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => togglePlan(u)}
                    disabled={updating === u.id}
                    className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                      u.plan_tier === 'premium'
                        ? 'border-red-200 text-red-600 hover:bg-red-50'
                        : 'border-green-200 text-green-600 hover:bg-green-50'
                    }`}
                  >
                    {updating === u.id ? '...' : u.plan_tier === 'premium' ? 'Downgrade' : 'Upgrade'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && filtered.length === 0 && (
          <p className="text-center text-gray-400 py-8">No users found.</p>
        )}
        {loading && (
          <p className="text-center text-gray-400 py-8">Loading...</p>
        )}
      </div>
    </div>
  )
}
