'use client'

import { useAuth } from '@/components/auth/AuthProvider'
import { Button, Input, Card } from '@/components/ui'
import { Mail, MapPin, Phone, Briefcase, Globe, ExternalLink, User } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

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

  useEffect(() => {
    if (profile) {
      setFields({
        full_name: profile.full_name || '',
        role_title: profile.role_title || '',
        location: profile.location || '',
        email: profile.email || '',
        phone: profile.phone || '',
        linkedin: profile.linkedin || '',
        website: profile.website || '',
      })
    }
  }, [profile])

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
    </div>
  )
}
