'use client'

import { Button, Input } from '@/components/ui'
import { useAuth } from '@/components/auth/AuthProvider'
import type { Profile } from '@/types/database'
import { Mail, MapPin, Phone, Briefcase, Globe, ExternalLink, User } from 'lucide-react'
import { useCallback, useState } from 'react'

const FIELDS: { key: keyof Profile; label: string; icon: typeof User; placeholder: string; type?: string }[] = [
  { key: 'full_name', label: 'Full Name', icon: User, placeholder: 'Your full name' },
  { key: 'role_title', label: 'Role Title', icon: Briefcase, placeholder: 'e.g. Software Engineer' },
  { key: 'location', label: 'Location', icon: MapPin, placeholder: 'e.g. San Francisco, CA' },
  { key: 'email', label: 'Email', icon: Mail, placeholder: 'your@email.com', type: 'email' },
  { key: 'phone', label: 'Phone', icon: Phone, placeholder: '+1 (555) 123-4567', type: 'tel' },
  { key: 'linkedin', label: 'LinkedIn URL', icon: ExternalLink, placeholder: 'https://linkedin.com/in/your-profile' },
  { key: 'website', label: 'Website / Portfolio', icon: Globe, placeholder: 'https://your-site.com' },
]

function getInitials(profile: Profile | null): Record<string, string> {
  const vals: Record<string, string> = {}
  for (const f of FIELDS) {
    vals[f.key] = (profile?.[f.key as keyof Profile] as string) ?? ''
  }
  return vals
}

export function ProfileSection({ profile: serverProfile }: { profile: Profile | null }) {
  const { refreshProfile } = useAuth()
  const [fields, setFields] = useState(() => getInitials(serverProfile))
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const update = useCallback((key: string, value: string) => {
    setFields((prev) => ({ ...prev, [key]: value }))
    setSaved(false)
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    try {
      const payload: Record<string, string | null> = {}
      for (const f of FIELDS) {
        payload[f.key] = fields[f.key] || null
      }
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Save failed')
      await refreshProfile()
      setSaved(true)
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      {FIELDS.map(({ key, label, icon: Icon, placeholder, type }) => (
        <div key={key}>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
            <Icon className="h-4 w-4 text-gray-400" />
            {label}
          </label>
          <Input
            type={type || 'text'}
            placeholder={placeholder}
            value={fields[key] ?? ''}
            onChange={(e) => update(key, e.target.value)}
          />
        </div>
      ))}
      <div className="flex items-center gap-3 pt-2">
        <Button onClick={handleSave} loading={saving} size="sm">
          Save Profile
        </Button>
        {saved && <span className="text-sm text-green-600">Saved!</span>}
      </div>
    </div>
  )
}
