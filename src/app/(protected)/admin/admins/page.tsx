'use client'

import { Button } from '@/components/ui'
import type { Profile } from '@/types/database'
import { Shield, ShieldOff } from 'lucide-react'
import { useState } from 'react'

export default function AdminAdminsPage() {
  const [users, setUsers] = useState<Profile[]>([])
  const [updating, setUpdating] = useState<string | null>(null)

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

  const admins = users.filter((u) => u.role === 'admin')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Manage Admins</h1>
        <p className="mt-1 text-sm text-gray-600">
          {admins.length} admin{admins.length !== 1 ? 's' : ''} · {users.length} total users
        </p>
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
    </div>
  )
}
