'use client'

import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types/database'
import { useEffect, useState } from 'react'

const PLAN_COLORS: Record<string, string> = {
  free: 'bg-gray-100 text-gray-700',
  premium: 'bg-green-100 text-green-700',
  premium_pro: 'bg-purple-100 text-purple-700',
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [resetPwUser, setResetPwUser] = useState<Profile | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [resettingPw, setResettingPw] = useState(false)
  const [pwError, setPwError] = useState('')

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

  const cyclePlan = async (user: Profile) => {
    const nextTier = user.plan_tier === 'free' ? 'premium' 
      : user.plan_tier === 'premium' ? 'premium_pro' 
      : 'free'
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
        body: JSON.stringify({ id: user.id, plan_tier: nextTier }),
      })
      if (!res.ok) throw new Error('Update failed')
      setUsers(prev => prev.map(u => (u.id === user.id ? { ...u, plan_tier: nextTier } : u)))
    } catch {
      setError('Failed to update plan')
    } finally {
      setUpdating(null)
    }
  }

  const toggleRole = async (user: Profile) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin'
    setUpdating(user.id)
    setError(null)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`
      const res = await fetch('/api/admin/admins', {
        method: 'PUT',
        headers,
        body: JSON.stringify({ id: user.id, role: newRole }),
      })
      if (!res.ok) throw new Error('Update failed')
      setUsers(prev => prev.map(u => (u.id === user.id ? { ...u, role: newRole } : u)))
    } catch {
      setError('Failed to update role')
    } finally {
      setUpdating(null)
    }
  }

  const resetPassword = async () => {
    if (!resetPwUser || newPassword.length < 8) return
    setResettingPw(true)
    setPwError('')
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`
      const res = await fetch('/api/admin/users/reset-password', {
        method: 'POST',
        headers,
        body: JSON.stringify({ id: resetPwUser.id, password: newPassword }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to reset password')
      setResetPwUser(null)
      setNewPassword('')
    } catch (e) {
      setPwError(e instanceof Error ? e.message : 'Failed to reset password')
    } finally {
      setResettingPw(false)
    }
  }

  const filtered = users.filter(u =>
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  )

  const freeCount = users.filter(u => u.plan_tier === 'free').length
  const premiumCount = users.filter(u => u.plan_tier === 'premium').length
  const proCount = users.filter(u => u.plan_tier === 'premium_pro').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="mt-1 text-sm text-gray-600">
            {users.length} total · {freeCount} free · {premiumCount} premium · {proCount} pro
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
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => toggleRole(u)}
                      disabled={updating === u.id}
                      className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                        u.role === 'admin'
                          ? 'border-orange-200 text-orange-600 hover:bg-orange-50'
                          : 'border-purple-200 text-purple-600 hover:bg-purple-50'
                      }`}
                    >
                      {updating === u.id ? '...' : u.role === 'admin' ? 'Demote' : 'Make Admin'}
                    </button>
                    <button
                      onClick={() => cyclePlan(u)}
                      disabled={updating === u.id}
                      className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                        u.plan_tier === 'free'
                          ? 'border-green-200 text-green-600 hover:bg-green-50'
                          : u.plan_tier === 'premium'
                          ? 'border-purple-200 text-purple-600 hover:bg-purple-50'
                          : 'border-red-200 text-red-600 hover:bg-red-50'
                      }`}
                    >
                      {updating === u.id ? '...' : u.plan_tier === 'free' ? 'To Premium' : u.plan_tier === 'premium' ? 'To Pro' : 'To Free'}
                    </button>
                    <button
                      onClick={() => { setResetPwUser(u); setNewPassword(''); setPwError('') }}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 transition-colors"
                    >
                      Reset PW
                    </button>
                  </div>
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

      {resetPwUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-semibold text-gray-900">
              Reset Password: {resetPwUser.full_name}
            </h2>
            <p className="mt-1 text-sm text-gray-500">Enter a new password for this user.</p>
            <input
              type="password"
              placeholder="New password (min 8 characters)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-4 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            {pwError && <p className="mt-2 text-sm text-red-600">{pwError}</p>}
            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => { setResetPwUser(null); setNewPassword(''); setPwError('') }}
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={resetPassword}
                disabled={resettingPw || newPassword.length < 8}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {resettingPw ? 'Resetting...' : 'Reset Password'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
