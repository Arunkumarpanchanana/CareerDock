'use client'

import type { Persona } from './templates'
import { FresherTemplate } from './templates/FresherTemplate'
import { ProfessionalTemplate } from './templates/ProfessionalTemplate'
import { ExecutiveTemplate } from './templates/ExecutiveTemplate'
import type { ResumeFormData } from '@/lib/resume'
import { Check, Grid3X3, X } from 'lucide-react'
import { useState } from 'react'

interface TemplateOption {
  id: string
  name: string
  description: string
  persona: Persona
  component: React.FC<{ profile: null; data: ResumeFormData }>
}

const TEMPLATES: TemplateOption[] = [
  { id: 'fresher-classic', name: 'Fresher Classic', description: 'Education-first layout, ideal for students and recent graduates', persona: 'fresher', component: FresherTemplate as React.FC<{ profile: null; data: ResumeFormData }> },
  { id: 'professional-classic', name: 'Professional Classic', description: 'Chronological experience-first layout for career professionals', persona: 'professional', component: ProfessionalTemplate as React.FC<{ profile: null; data: ResumeFormData }> },
  { id: 'executive', name: 'Executive', description: 'Leadership-focused with strategic summary and scope metrics', persona: 'executive', component: ExecutiveTemplate as React.FC<{ profile: null; data: ResumeFormData }> },
]

export function TemplateGallery({
  data,
  currentTemplate,
  currentPersona,
  onSelect,
  onClose,
}: {
  data: ResumeFormData
  currentTemplate?: string
  currentPersona?: Persona
  onSelect: (templateId: string) => void
  onClose: () => void
}) {
  const [filter, setFilter] = useState<'all' | Persona>(currentPersona ?? 'all')

  const filtered = filter === 'all'
    ? TEMPLATES
    : TEMPLATES.filter((t) => t.persona === filter)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Grid3X3 className="h-5 w-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">Choose a Template</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2 px-6 py-3 border-b border-gray-100">
          <span className="text-xs font-medium text-gray-500">Filter:</span>
          {(['all', 'fresher', 'professional', 'executive'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                filter === f
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Template Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((template) => {
              const isSelected = currentTemplate === template.id
              const TemplatePreview = template.component
              return (
                <button
                  key={template.id}
                  onClick={() => onSelect(template.id)}
                  className={`relative rounded-xl border-2 overflow-hidden transition-all text-left ${
                    isSelected
                      ? 'border-blue-600 ring-2 ring-blue-200'
                      : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-3 right-3 z-10 h-6 w-6 rounded-full bg-blue-600 flex items-center justify-center">
                      <Check className="h-3.5 w-3.5 text-white" />
                    </div>
                  )}
                  {/* Mini preview */}
                  <div className="h-48 overflow-hidden bg-white pointer-events-none scale-[0.3] origin-top-left" style={{ width: '333%', height: '160px' }}>
                    <div className="p-4" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                      <TemplatePreview profile={null} data={data} />
                    </div>
                  </div>
                  {/* Info bar */}
                  <div className="p-3 border-t border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-900">{template.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{template.description}</p>
                  </div>
                </button>
              )
            })}
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-12">
              <p className="text-sm text-gray-400">No templates match this filter.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
