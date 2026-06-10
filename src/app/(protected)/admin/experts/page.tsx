'use client'

import { Button, Input } from '@/components/ui'
import type { ExpertConsultant } from '@/types/database'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'

interface ExpertForm {
  name: string
  domain_expertise: string
  bio: string
  scheduling_url: string
  is_active: boolean
}

const EMPTY_FORM: ExpertForm = { name: '', domain_expertise: '', bio: '', scheduling_url: '', is_active: true }

export default function AdminExpertsPage() {
  const [experts, setExperts] = useState<ExpertConsultant[]>([])
  const [editing, setEditing] = useState<ExpertConsultant | null>(null)
  const [form, setForm] = useState<ExpertForm>(EMPTY_FORM)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    fetch('/api/admin/experts').then(r => r.json()).then(data => {
      if (Array.isArray(data)) setExperts(data)
      else console.error('Unexpected response format')
    }).catch(console.error)
  }, [])

  const openNew = () => { setEditing(null); setForm(EMPTY_FORM); setShowForm(true) }

  const openEdit = (ex: ExpertConsultant) => {
    setEditing(ex)
    setForm({ name: ex.name, domain_expertise: ex.domain_expertise, bio: ex.bio || '', scheduling_url: ex.scheduling_url, is_active: ex.is_active })
    setShowForm(true)
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const method = editing ? 'PUT' : 'POST'
      const body = editing ? { id: editing.id, ...form, bio: form.bio || null } : { ...form, bio: form.bio || null }
      const res = await fetch('/api/admin/experts', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) throw new Error('Save failed')
      const saved = await res.json()
      setExperts((prev) => {
        if (editing) return prev.map((e) => (e.id === saved.id ? saved : e))
        return [...prev, saved]
      })
      setShowForm(false)
    } catch { setError('Failed to save expert') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this expert?')) return
    setError(null)
    try {
      const res = await fetch(`/api/admin/experts?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      setExperts((prev) => prev.filter((e) => e.id !== id))
    } catch { setError('Failed to delete expert') }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Experts</h1>
          <p className="mt-1 text-sm text-gray-600">{experts.length} consultant{experts.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-1.5" /> Add Expert</Button>
      </div>

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Domain</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {experts.map((ex) => (
              <tr key={ex.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{ex.name}</td>
                <td className="px-4 py-3 text-gray-600">{ex.domain_expertise}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ex.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {ex.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => openEdit(ex)} className="p-1.5 text-gray-400 hover:text-blue-600"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => handleDelete(ex.id)} className="p-1.5 text-gray-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {experts.length === 0 && <p className="text-center text-gray-400 py-8">No experts yet.</p>}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6 space-y-5" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-gray-900">{editing ? 'Edit Expert' : 'Add Expert'}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Domain Expertise *</label>
                <Input value={form.domain_expertise} onChange={(e) => setForm({ ...form, domain_expertise: e.target.value })} placeholder="e.g. Resume Strategy" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3} className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" placeholder="Short bio" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Scheduling URL *</label>
                <Input value={form.scheduling_url} onChange={(e) => setForm({ ...form, scheduling_url: e.target.value })} placeholder="https://calendly.com/..." />
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700">Active</label>
                <button
                  onClick={() => setForm({ ...form, is_active: !form.is_active })}
                  className={`w-10 h-5 rounded-full transition-colors ${form.is_active ? 'bg-blue-600' : 'bg-gray-300'} relative`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.is_active ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving || !form.name || !form.domain_expertise || !form.scheduling_url}>
                {saving ? 'Saving...' : editing ? 'Save Changes' : 'Add Expert'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
