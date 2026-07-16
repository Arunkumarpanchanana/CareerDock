'use client'

import { Button, Input } from '@/components/ui'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import type { JobApplication } from '@/types/database'
import { Briefcase, DollarSign, ExternalLink, Plus, Search, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

type Status = 'Wishlist' | 'Applied' | 'Interviewing' | 'Offered' | 'Rejected'

const COLUMNS: { key: Status; label: string; color: string; hint: string }[] = [
  { key: 'Wishlist', label: 'Wishlist', color: 'bg-gray-100 text-gray-700', hint: 'Jobs you are researching or planning to apply to' },
  { key: 'Applied', label: 'Applied', color: 'bg-blue-100 text-blue-700', hint: 'Applications you have submitted' },
  { key: 'Interviewing', label: 'Interviewing', color: 'bg-amber-100 text-amber-700', hint: 'You have a phone screen, tech interview, or onsite scheduled' },
  { key: 'Offered', label: 'Offered', color: 'bg-green-100 text-green-700', hint: 'You received an offer — congratulations!' },
  { key: 'Rejected', label: 'Rejected', color: 'bg-red-100 text-red-700', hint: 'The company passed or you withdrew' },
]

const STATUS_ORDER: Status[] = ['Wishlist', 'Applied', 'Interviewing', 'Offered', 'Rejected']

const INITIAL_FORM = {
  company_name: '',
  job_title: '',
  salary_range: '',
  job_url: '',
  notes: '',
  status: 'Wishlist' as Status,
}

export default function TrackerPage() {
  const [jobs, setJobs] = useState<JobApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<JobApplication | null>(null)
  const [form, setForm] = useState(INITIAL_FORM)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const [draggedJob, setDraggedJob] = useState<string | null>(null)
  const [dragOverCol, setDragOverCol] = useState<Status | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [trackerError, setTrackerError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/jobs')
      .then((res) => res.json())
      .then((data) => { setJobs(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const fetchJobs = useCallback(async () => {
    try {
      const res = await fetch('/api/jobs')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setJobs(data)
    } catch (e) {
      console.error(e)
    }
  }, [])

  const filteredJobs = searchQuery
    ? jobs.filter((j) =>
        j.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        j.job_title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : jobs

  const jobsByStatus = (status: Status) =>
    filteredJobs.filter((j) => j.status === status)

  const openNew = () => {
    setEditing(null)
    setForm(INITIAL_FORM)
    setSubmitAttempted(false)
    setShowForm(true)
  }

  const openEdit = (job: JobApplication) => {
    setEditing(job)
    setForm({
      company_name: job.company_name,
      job_title: job.job_title,
      salary_range: job.salary_range || '',
      job_url: job.job_url || '',
      notes: job.notes || '',
      status: job.status,
    })
    setSubmitAttempted(false)
    setShowForm(true)
  }

  const handleSave = async () => {
    setSubmitAttempted(true)
    if (!form.company_name || !form.job_title) return
    setSaving(true)
    try {
      const method = editing ? 'PUT' : 'POST'
      const body = editing
        ? { id: editing.id, ...form, salary_range: form.salary_range || null, job_url: form.job_url || null, notes: form.notes || null }
        : { ...form, salary_range: form.salary_range || null, job_url: form.job_url || null, notes: form.notes || null }

      const res = await fetch('/api/jobs', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error('Save failed')
      await fetchJobs()
      setShowForm(false)
      setTrackerError(null)
    } catch (e) {
      setTrackerError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      const res = await fetch(`/api/jobs?id=${deleteTarget}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      await fetchJobs()
      setTrackerError(null)
    } catch (e) {
      setTrackerError(e instanceof Error ? e.message : 'Delete failed')
    } finally {
      setDeleteTarget(null)
    }
  }

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedJob(id)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, status: Status) => {
    e.preventDefault()
    setDragOverCol(status)
  }

  const handleDrop = async (status: Status) => {
    if (!draggedJob) return
    const job = filteredJobs.find((j) => j.id === draggedJob)
    if (!job || job.status === status) {
      setDraggedJob(null)
      return
    }

    const prev = [...jobs]
    setJobs((prev) =>
      prev.map((j) => (j.id === draggedJob ? { ...j, status } : j))
    )
    setDraggedJob(null)

    try {
      const res = await fetch('/api/jobs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: draggedJob, status }),
      })
      if (!res.ok) throw new Error('Update failed')
    } catch {
      setJobs(prev)
    }
  }

  const counts = (() => {
    const total = jobs.length
    const interviewing = jobs.filter((j) => j.status === 'Interviewing').length
    const offered = jobs.filter((j) => j.status === 'Offered').length
    return { total, interviewing, offered }
  })()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Job Pipeline</h1>
          <p className="mt-1 text-sm text-gray-600">
            {counts.total} application{counts.total !== 1 ? 's' : ''}
            {counts.interviewing > 0 && ` · ${counts.interviewing} interviewing`}
            {counts.offered > 0 && ` · ${counts.offered} offered`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by company or title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-56 rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <Button onClick={openNew}>
            <Plus className="h-4 w-4 mr-1.5" /> Add Job
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-4">
        {COLUMNS.map(({ key, label, color, hint }) => (
          <div
            key={key}
            onDragOver={(e) => handleDragOver(e, key)}
            onDragLeave={() => setDragOverCol(null)}
            onDrop={() => handleDrop(key)}
            className={`rounded-xl bg-gray-50 border min-h-[400px] flex flex-col transition-shadow ${
              dragOverCol === key ? 'shadow-md border-blue-300' : 'border-gray-200'
            }`}
          >
            <div className="px-3 py-2.5 border-b border-gray-200 flex items-center justify-between group">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${color}`}>
                {label}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 font-medium">
                  {jobsByStatus(key).length}
                </span>
                <span className="hidden group-hover:inline-block text-xs text-gray-400 max-w-[140px] truncate" title={hint}>
                  {hint}
                </span>
              </div>
            </div>
            <div className="flex-1 p-2 space-y-2 overflow-y-auto">
              {jobsByStatus(key).length === 0 && (
                <p className="text-xs text-gray-400 text-center pt-4">
                  Drop jobs here
                </p>
              )}
              {jobsByStatus(key).map((job) => (
                <div
                  key={job.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, job.id)}
                  onClick={() => openEdit(job)}
                  className="bg-white rounded-lg border border-gray-200 p-3 cursor-grab active:cursor-grabbing hover:shadow-sm transition-shadow space-y-1.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold text-gray-900 leading-tight">
                      {job.job_title}
                    </h3>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteTarget(job.id) }}
                      className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Briefcase className="h-3 w-3" />
                    {job.company_name}
                  </div>
                  {job.salary_range && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <DollarSign className="h-3 w-3" />
                      {job.salary_range}
                    </div>
                  )}
                  {job.job_url && (
                    <div className="flex items-center gap-1.5 text-xs text-blue-600">
                      <ExternalLink className="h-3 w-3" />
                      <span className="truncate">{job.job_url.replace(/^https?:\/\//, '')}</span>
                    </div>
                  )}
                  {job.notes && (
                    <div className="flex items-start gap-1.5 text-xs text-gray-400 pt-1 border-t border-gray-100">
                      <span className="leading-tight line-clamp-2">{job.notes}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {trackerError && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {trackerError}
        </div>
      )}

      <ConfirmModal
        open={!!deleteTarget}
        title="Delete application"
        message="Are you sure you want to delete this job application? This cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6 space-y-5" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-gray-900">
              {editing ? 'Edit Job' : 'Add Job Application'}
            </h2>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company *</label>
                  <Input
                    placeholder="Company name"
                    value={form.company_name}
                    onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                    error={submitAttempted && !form.company_name ? 'Company name is required' : undefined}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Job Title *</label>
                  <Input
                    placeholder="Job title"
                    value={form.job_title}
                    onChange={(e) => setForm({ ...form, job_title: e.target.value })}
                    error={submitAttempted && !form.job_title ? 'Job title is required' : undefined}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Salary Range</label>
                  <Input
                    placeholder="e.g. $80k-$100k"
                    value={form.salary_range}
                    onChange={(e) => setForm({ ...form, salary_range: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as Status })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {STATUS_ORDER.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Job URL</label>
                <Input
                  placeholder="https://..."
                  value={form.job_url}
                  onChange={(e) => setForm({ ...form, job_url: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  placeholder="Recruiter contact, interview notes, etc."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : editing ? 'Save Changes' : 'Add Job'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
