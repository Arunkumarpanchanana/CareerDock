'use client'

import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/auth/AuthProvider'
import { Button, Input, Card } from '@/components/ui'
import type { Profile } from '@/types/database'
import { Lock, Mail, MapPin, Phone, Briefcase, Globe, ExternalLink, User } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

interface FormFields {
  full_name: string
  role_title: string
  location: string
  email: string
  phone: string
  linkedin: string
  website: string
}

export default function ProfilePage() {
  const { profile, refreshProfile } = useAuth()
  const [fields, setFields] = useState<FormFields>({
    full_name: '',
    role_title: '',
    location: '',
    email: '',
    phone: '',
    linkedin: '',
    website: '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [loadingProfile, setLoadingProfile] = useState(!profile)
  const [pwCurrent, setPwCurrent] = useState('')
  const [pwNew, setPwNew] = useState('')
  const [pwConfirm, setPwConfirm] = useState('')
  const [pwSaving, setPwSaving] = useState(false)
  const [pwError, setPwError] = useState('')
  const [pwDone, setPwDone] = useState(false)

  const populateFields = useCallback((p: Profile) => {
    setFields({
      full_name: p.full_name || '',
      role_title: p.role_title || '',
      location: p.location || '',
      email: p.email || '',
      phone: p.phone || '',
      linkedin: p.linkedin || '',
      website: p.website || '',
    })
  }, [])

  useEffect(() => {
    if (profile) {
      populateFields(profile)
      setLoadingProfile(false)
    }
  }, [profile, populateFields])

  useEffect(() => {
    if (profile) return
    const fetchDirect = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) return
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()
      if (data) {
        populateFields(data as Profile)
      }
      setLoadingProfile(false)
    }
    fetchDirect()
  }, [profile, populateFields])

  const update = useCallback((key: keyof FormFields, value: string) => {
    setFields((prev) => ({ ...prev, [key]: value }))
    setSaved(false)
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSaved(false)
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fields.full_name,
          role_title: fields.role_title || null,
          location: fields.location || null,
          email: fields.email || null,
          phone: fields.phone || null,
          linkedin: fields.linkedin || null,
          website: fields.website || null,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save')
      await refreshProfile()
      setSaved(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const fieldsConfig: { key: keyof FormFields; label: string; icon: typeof User; placeholder: string; type?: string }[] = [
    { key: 'full_name', label: 'Full Name', icon: User, placeholder: 'Your full name' },
    { key: 'role_title', label: 'Role Title', icon: Briefcase, placeholder: 'e.g. Software Engineer' },
    { key: 'location', label: 'Location', icon: MapPin, placeholder: 'e.g. San Francisco, CA' },
    { key: 'email', label: 'Email', icon: Mail, placeholder: 'your@email.com', type: 'email' },
    { key: 'phone', label: 'Phone', icon: Phone, placeholder: '+1 (555) 123-4567', type: 'tel' },
    { key: 'linkedin', label: 'LinkedIn URL', icon: ExternalLink, placeholder: 'https://linkedin.com/in/your-profile' },
    { key: 'website', label: 'Website / Portfolio', icon: Globe, placeholder: 'https://your-site.com' },
  ]

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
        <p className="mt-1 text-gray-600">
          Your details appear on your resume and are shared with expert consultants.
        </p>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-100">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-blue-700">
            {fields.full_name.charAt(0).toUpperCase() || '?'}
          </div>
          <div>
            <p className="font-medium text-gray-900">{fields.full_name || 'Your Name'}</p>
            <p className="text-sm text-gray-500">{fields.role_title || 'Role not set'}</p>
          </div>
        </div>

        <div className="space-y-5">
          {fieldsConfig.map(({ key, label, icon: Icon, placeholder, type }) => (
            <div key={key}>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                <Icon className="h-4 w-4 text-gray-400" />
                {label}
              </label>
              <Input
                type={type || 'text'}
                placeholder={placeholder}
                value={fields[key]}
                onChange={(e) => update(key, e.target.value)}
              />
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center gap-4 pt-4 border-t border-gray-100">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
          {saved && <span className="text-sm text-green-600">Saved successfully!</span>}
          {error && <span className="text-sm text-red-600">{error}</span>}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Lock className="h-5 w-5 text-gray-400" />
          Change Password
        </h2>

        <div className="space-y-4">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
              Current Password
            </label>
            <Input
              type="password"
              placeholder="Enter your current password"
              value={pwCurrent}
              onChange={(e) => { setPwCurrent(e.target.value); setPwDone(false) }}
            />
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
              New Password
            </label>
            <Input
              type="password"
              placeholder="At least 8 characters"
              value={pwNew}
              onChange={(e) => { setPwNew(e.target.value); setPwDone(false) }}
            />
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
              Confirm New Password
            </label>
            <Input
              type="password"
              placeholder="Re-enter your new password"
              value={pwConfirm}
              onChange={(e) => { setPwConfirm(e.target.value); setPwDone(false) }}
            />
          </div>

          {pwError && <p className="text-sm text-red-600">{pwError}</p>}
          {pwDone && <p className="text-sm text-green-600">Password updated successfully!</p>}

          <div className="pt-2">
            <Button
              onClick={async () => {
                setPwError('')
                setPwDone(false)
                if (!pwCurrent) { setPwError('Enter your current password'); return }
                if (pwNew.length < 8) { setPwError('New password must be at least 8 characters'); return }
                if (pwNew !== pwConfirm) { setPwError('Passwords do not match'); return }
                setPwSaving(true)
                try {
                  const supabase = createClient()
                  const { error: signInError } = await supabase.auth.signInWithPassword({
                    email: profile?.email || '',
                    password: pwCurrent,
                  })
                  if (signInError) { setPwError('Current password is incorrect'); setPwSaving(false); return }
                  const { error: updateError } = await supabase.auth.updateUser({ password: pwNew })
                  if (updateError) { setPwError(updateError.message); setPwSaving(false); return }
                  setPwCurrent(''); setPwNew(''); setPwConfirm('')
                  setPwDone(true)
                } catch { setPwError('Something went wrong') }
                finally { setPwSaving(false) }
              }}
              disabled={pwSaving}
            >
              {pwSaving ? 'Updating...' : 'Update Password'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
