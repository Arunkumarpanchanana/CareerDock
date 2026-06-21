'use client'

import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/auth/AuthProvider'
import { Button, Input, Card, Badge } from '@/components/ui'
import ReferralCard from '@/components/referral/ReferralCard'
import type { Profile } from '@/types/database'
import {
  Lock, Mail, MapPin, Phone, Briefcase, Globe, ExternalLink, User,
  GraduationCap, Crown, Sparkles, ChevronRight,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

type Persona = 'fresher' | 'professional' | 'executive'

const PERSONAS: { id: Persona; label: string; icon: typeof GraduationCap }[] = [
  { id: 'fresher', label: 'Fresher', icon: GraduationCap },
  { id: 'professional', label: 'Professional', icon: Briefcase },
  { id: 'executive', label: 'Executive', icon: Crown },
]

interface FormFields {
  full_name: string
  role_title: string
  location: string
  email: string
  phone: string
  linkedin: string
  website: string
  persona: Persona
}

function initFields(profile: Profile | null): FormFields {
  if (!profile) return {
    full_name: '',
    role_title: '',
    location: '',
    email: '',
    phone: '',
    linkedin: '',
    website: '',
    persona: 'professional',
  }
  return {
    full_name: profile.full_name || '',
    role_title: profile.role_title || '',
    location: profile.location || '',
    email: profile.email || '',
    phone: profile.phone || '',
    linkedin: profile.linkedin || '',
    website: profile.website || '',
    persona: profile.persona || 'professional',
  }
}

export default function ProfilePage() {
  const { profile, refreshProfile, loading: authLoading } = useAuth()
  const [fields, setFields] = useState<FormFields>(() => initFields(profile))
  const [initialized, setInitialized] = useState(!!profile)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [pwCurrent, setPwCurrent] = useState('')
  const [pwNew, setPwNew] = useState('')
  const [pwConfirm, setPwConfirm] = useState('')
  const [pwSaving, setPwSaving] = useState(false)
  const [pwError, setPwError] = useState('')
  const [pwDone, setPwDone] = useState(false)

  useEffect(() => {
    if (initialized) return
    if (authLoading) return

    if (profile) {
      setFields(initFields(profile))
      setInitialized(true)
      return
    }

    const load = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        setInitialized(true)
        return
      }
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()
      if (data) {
        setFields(initFields(data as Profile))
      }
      setInitialized(true)
    }
    load()
  }, [authLoading, profile, initialized])

  const update = useCallback((key: keyof FormFields, value: string) => {
    setFields((prev) => ({ ...prev, [key]: value }))
    setSaved(false)
  }, [])

  const setPersona = async (persona: Persona) => {
    setFields((prev) => ({ ...prev, persona }))
    await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ persona }),
    })
    await refreshProfile()
  }

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
          persona: fields.persona,
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

  const contactFields = useMemo(() => [
    { key: 'email' as const, label: 'Email', icon: Mail, placeholder: 'your@email.com', type: 'email' },
    { key: 'phone' as const, label: 'Phone', icon: Phone, placeholder: '+1 (555) 123-4567', type: 'tel' },
    { key: 'linkedin' as const, label: 'LinkedIn URL', icon: ExternalLink, placeholder: 'https://linkedin.com/in/your-profile' },
    { key: 'website' as const, label: 'Website / Portfolio', icon: Globe, placeholder: 'https://your-site.com' },
  ], [])


  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Profile Settings</h1>
        <p className="mt-1 text-[var(--text-secondary)]">
          Your details appear on your resume and are shared with expert consultants.
        </p>
      </div>

      {/* Personal Information */}
      <Card>
        <div className="flex items-center gap-4 mb-6 pb-4 border-b border-[var(--glass-border)]">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent)]/15 text-xl font-bold text-[var(--accent)]">
            {fields.full_name.charAt(0).toUpperCase() || '?'}
          </div>
          <div>
            <p className="font-medium text-[var(--text-primary)]">{fields.full_name || 'Your Name'}</p>
            <p className="text-sm text-[var(--text-secondary)]">{fields.role_title || 'Role not set'}</p>
          </div>
        </div>

        {/* Persona Selector */}
        <div className="mb-6">
          <label className="flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)] mb-3">
            <Sparkles className="h-4 w-4" />
            Career Stage
          </label>
          <div className="flex gap-2">
            {PERSONAS.map((p) => {
              const Icon = p.icon
              const isSelected = fields.persona === p.id
              return (
                <Button
                  key={p.id}
                  variant={isSelected ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setPersona(p.id)}
                >
                  <Icon className="h-4 w-4 mr-1.5" />
                  {p.label}
                </Button>
              )
            })}
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              <User className="h-4 w-4" />
              Full Name
            </label>
            <Input
              placeholder="Your full name"
              value={fields.full_name}
              onChange={(e) => update('full_name', e.target.value)}
            />
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              <Briefcase className="h-4 w-4" />
              Role Title
            </label>
            <Input
              placeholder="e.g. Software Engineer"
              value={fields.role_title}
              onChange={(e) => update('role_title', e.target.value)}
            />
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              <MapPin className="h-4 w-4" />
              Location
            </label>
            <Input
              placeholder="e.g. San Francisco, CA"
              value={fields.location}
              onChange={(e) => update('location', e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* Contact Details */}
      <Card>
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-5 flex items-center gap-2">
          <Mail className="h-5 w-5 text-[var(--text-tertiary)]" />
          Contact Details
        </h2>
        <div className="space-y-5">
          {contactFields.map(({ key, label, icon: Icon, placeholder, type }) => (
            <div key={key}>
              <label className="flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                <Icon className="h-4 w-4" />
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

        <div className="mt-6 flex items-center gap-4 pt-4 border-t border-[var(--glass-border)]">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
          {saved && <span className="text-sm text-[var(--success)]">Saved successfully!</span>}
          {error && <span className="text-sm text-[var(--danger)]">{error}</span>}
        </div>
      </Card>

      {/* Account */}
      <Card>
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-5 flex items-center gap-2">
          <Lock className="h-5 w-5 text-[var(--text-tertiary)]" />
          Account
        </h2>

        {/* Plan Tier */}
        <div className="flex items-center justify-between p-4 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-xl mb-6">
          <div className="flex items-center gap-3">
            <div className={`rounded-lg p-2 ${
              profile?.plan_tier === 'premium'
                ? 'bg-[var(--accent)]/15 text-[var(--accent)]'
                : 'bg-[var(--warning)]/15 text-[var(--warning)]'
            }`}>
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">
                {profile?.plan_tier === 'premium' ? 'Premium Plan' : 'Free Plan'}
              </p>
              <p className="text-xs text-[var(--text-secondary)]">
                {profile?.plan_tier === 'premium'
                  ? 'Unlimited resumes and job tracking'
                  : 'Upgrade for unlimited resumes and job tracking'}
              </p>
            </div>
          </div>
          {profile?.plan_tier !== 'premium' && (
            <Link
              href="/upgrade"
              className="flex items-center gap-1 px-4 py-2 bg-[var(--accent)] text-white text-sm font-medium rounded-xl hover:bg-[var(--accent-hover)] transition-all"
            >
              Upgrade
              <ChevronRight className="h-4 w-4" />
            </Link>
          )}
          {profile?.plan_tier === 'premium' && (
            <Badge variant="accent">Premium</Badge>
          )}
        </div>

        {/* Change Password */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-[var(--text-secondary)]">Change Password</h3>
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)] mb-1.5">
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
            <label className="flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)] mb-1.5">
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
            <label className="flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              Confirm New Password
            </label>
            <Input
              type="password"
              placeholder="Re-enter your new password"
              value={pwConfirm}
              onChange={(e) => { setPwConfirm(e.target.value); setPwDone(false) }}
            />
          </div>

          {pwError && <p className="text-sm text-[var(--danger)]">{pwError}</p>}
          {pwDone && <p className="text-sm text-[var(--success)]">Password updated successfully!</p>}

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

      {/* Referral */}
      <ReferralCard />
    </div>
  )
}
