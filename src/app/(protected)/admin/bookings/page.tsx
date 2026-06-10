'use client'

import type { Booking, ExpertConsultant, Profile } from '@/types/database'
import { useEffect, useState } from 'react'

type BookingRow = Booking & { expert_consultants: Pick<ExpertConsultant, 'name' | 'domain_expertise'>; profiles: Pick<Profile, 'full_name' | 'email'> }

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<BookingRow[]>([])
  const [updating, setUpdating] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    fetch('/api/admin/bookings').then(r => r.json()).then(data => {
      if (Array.isArray(data)) setBookings(data)
      else console.error('Unexpected response format')
    }).catch(console.error)
  }, [])

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id)
    setError(null)
    try {
      const res = await fetch('/api/admin/bookings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      })
      if (!res.ok) throw new Error('Update failed')
      setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status: status as Booking['status'] } : b)))
    } catch { setError('Failed to update booking status') }
    finally { setUpdating(null) }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
        <p className="mt-1 text-sm text-gray-600">{bookings.length} session{bookings.length !== 1 ? 's' : ''}</p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">User</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Expert</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Scheduled</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Notes</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {bookings.map((b) => (
              <tr key={b.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{b.profiles?.full_name}</p>
                  {b.profiles?.email && <p className="text-xs text-gray-500">{b.profiles.email}</p>}
                </td>
                <td className="px-4 py-3">
                  <p className="text-gray-900">{b.expert_consultants?.name}</p>
                  <p className="text-xs text-gray-500">{b.expert_consultants?.domain_expertise}</p>
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {new Date(b.scheduled_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[b.status]}`}>
                    {b.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500 max-w-[150px] truncate">{b.notes || '—'}</td>
                <td className="px-4 py-3 text-right">
                  <select
                    value={b.status}
                    onChange={(e) => updateStatus(b.id, e.target.value)}
                    disabled={updating === b.id}
                    className="text-xs rounded-lg border border-gray-300 px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {bookings.length === 0 && <p className="text-center text-gray-400 py-8">No bookings yet.</p>}
      </div>
    </div>
  )
}
