'use client'

import { Button } from '@/components/ui'
import { GraduationCap, Briefcase, Crown } from 'lucide-react'
import { useState } from 'react'

type Persona = 'fresher' | 'professional' | 'executive'

const PERSONAS: { id: Persona; label: string; icon: typeof GraduationCap; description: string; features: string[] }[] = [
  {
    id: 'fresher',
    label: 'Fresher',
    icon: GraduationCap,
    description: 'Students, new graduates, and early career job seekers',
    features: ['Education-first format', 'Project-focused layout', 'GPA & coursework fields', 'Entry-level guidance'],
  },
  {
    id: 'professional',
    label: 'Professional',
    icon: Briefcase,
    description: 'Mid-career professionals and experienced hires',
    features: ['Chronological experience layout', 'ATS-optimized format', 'Quantified achievement bullets', 'Job description matching'],
  },
  {
    id: 'executive',
    label: 'Executive',
    icon: Crown,
    description: 'Senior leaders, VPs, directors, and C-suite',
    features: ['Executive summary first', 'Scope metrics (budget, team size)', 'Board positions section', '2-page layout support'],
  },
]

export function PersonaSelector({
  current,
  onSelect,
  onSkip,
}: {
  current?: Persona | null
  onSelect: (persona: Persona) => void
  onSkip?: () => void
}) {
  const [selected, setSelected] = useState<Persona | null>(current ?? null)
  const [saving, setSaving] = useState(false)

  const handleSelect = async (persona: Persona) => {
    setSelected(persona)
    setSaving(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ persona }),
      })
      if (res.ok) onSelect(persona)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900">What describes you best?</h2>
        <p className="text-sm text-gray-500 mt-1">We&apos;ll tailor your resume experience based on your career stage.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {PERSONAS.map((p) => {
          const Icon = p.icon
          const isSelected = selected === p.id
          return (
            <button
              key={p.id}
              onClick={() => handleSelect(p.id)}
              disabled={saving}
              className={`relative rounded-xl border-2 p-5 text-left transition-all ${
                isSelected
                  ? 'border-blue-600 bg-blue-50 shadow-sm'
                  : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm'
              }`}
            >
              {isSelected && (
                <div className="absolute top-3 right-3 h-5 w-5 rounded-full bg-blue-600 flex items-center justify-center">
                  <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
              <Icon className={`h-8 w-8 mb-3 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`} />
              <h3 className="text-base font-semibold text-gray-900">{p.label}</h3>
              <p className="text-xs text-gray-500 mt-1 mb-3">{p.description}</p>
              <ul className="space-y-1">
                {p.features.map((f) => (
                  <li key={f} className="text-xs text-gray-600 flex items-start gap-1.5">
                    <span className="text-blue-500 mt-0.5">•</span>
                    {f}
                  </li>
                ))}
              </ul>
            </button>
          )
        })}
      </div>

      {onSkip && (
        <div className="text-center">
          <button onClick={onSkip} className="text-sm text-gray-400 hover:text-gray-600 underline">
            Skip for now — I&apos;ll choose later
          </button>
        </div>
      )}
    </div>
  )
}

export type { Persona }
