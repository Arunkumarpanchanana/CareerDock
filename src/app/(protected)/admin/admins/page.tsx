'use client'

import { Button, Input } from '@/components/ui'
import type { Profile } from '@/types/database'
import { Shield, ShieldOff, UserPlus, X } from 'lucide-react'
import { useState } from 'react'

export default function AdminAdminsPage() {
  const [users, setUsers] = useState<Profile[]>([])
  const [updating, setUpdating] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ email: '', password: '', full_name: '', role: 'user' as 'user' | 'admin' })
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  useState(() => {
    if (typeof window === 'undefined') return true
    fetch('/api/admin/admins').then(r => r.json()).then(data => {
      if (Array.isArray(data)) setUsers(data)
    }).catch(console.error)
  })

  const toggleRole = async (user: Profile) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin'
    setUpdating(user.id)
    try {
      const res = await fetch('/api/admin/admins', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id, role: newRole }),
      })
      if (!res.ok) throw new Error('Update failed')
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, role: newRole } : u)))
    } catch (e) { console.error(e) }
    finally { setUpdating(null) }
  }

  const handleCreate = async () => {
    setCreating(true)
    setCreateError('')
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Creation failed')
      setShowForm(false)
      setForm({ email: '', password: '', full_name: '', role: 'user' })
      const refresh = await fetch('/api/admin/admins')
      const updated = await refresh.json()
      if (Array.isArray(updated)) setUsers(updated)
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : 'Failed to create user')
    } finally {
      setCreating(false)
    }
  }

  const admins = users.filter((u) => u.role === 'admin')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Users</h1>
          <p className="mt-1 text-sm text-gray-600">
            {admins.length} admin{admins.length !== 1 ? 's' : ''} · {users.length} total users
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <UserPlus className="h-4 w-4 mr-1.5" /> Create User
        </Button>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Role</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-sm font-medium text-gray-700">
                      {u.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{u.full_name}</p>
                      {u.email && <p className="text-xs text-gray-500">{u.email}</p>}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleRole(u)}
                    disabled={updating === u.id}
                  >
                    {u.role === 'admin' ? (
                      <><ShieldOff className="h-4 w-4 mr-1" /> Demote</>
                    ) : (
                      <><Shield className="h-4 w-4 mr-1" /> Make Admin</>
                    )}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6 space-y-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Create User</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="John Doe" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="user@example.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="At least 6 characters" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value as 'user' | 'admin' })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            {createError && <p className="text-sm text-red-600">{createError}</p>}

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={creating || !form.email || !form.password || !form.full_name}>
                {creating ? 'Creating...' : 'Create Account'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
