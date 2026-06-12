'use client'

import type { Profile } from '@/types/database'
import type { ResumeFormData } from '@/lib/resume'
import { TEMPLATES, type Persona } from './templates'

export function ResumePreview({
  profile,
  data,
  persona = 'professional',
  id = 'resume-preview',
}: {
  profile: Profile | null
  data: ResumeFormData
  persona?: Persona
  id?: string
}) {
  const Template = TEMPLATES[persona]

  return (
    <div id={id} className="h-full overflow-y-auto bg-white rounded-xl border border-gray-200 shadow-sm">
      <Template profile={profile} data={data} />
    </div>
  )
}
