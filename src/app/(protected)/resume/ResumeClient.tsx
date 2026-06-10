'use client'

import { ResumePreview } from '@/components/resume/ResumePreview'
import { SummarySection } from '@/components/resume/SummarySection'
import { ExperienceSection } from '@/components/resume/ExperienceSection'
import { EducationSection } from '@/components/resume/EducationSection'
import { ProjectsSection } from '@/components/resume/ProjectsSection'
import { SkillsSection } from '@/components/resume/SkillsSection'
import { CertificatesSection } from '@/components/resume/CertificatesSection'
import { Button } from '@/components/ui'
import { createClient } from '@/lib/supabase/client'
import { resumeToFormData, type ResumeFormData } from '@/lib/resume'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import type { Profile, Resume } from '@/types/database'

type Tab = 'summary' | 'experience' | 'education' | 'projects' | 'skills' | 'certificates'

const tabs: { id: Tab; label: string }[] = [
  { id: 'summary', label: 'Summary' },
  { id: 'experience', label: 'Experience' },
  { id: 'education', label: 'Education' },
  { id: 'projects', label: 'Projects' },
  { id: 'skills', label: 'Skills' },
  { id: 'certificates', label: 'Certificates' },
]

export function ResumeClient({
  profile,
  initialResume,
}: {
  profile: Profile | null
  initialResume: Resume | null
}) {
  const [data, setData] = useState<ResumeFormData>(() => resumeToFormData(initialResume))
  const [activeTab, setActiveTab] = useState<Tab>('summary')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (saved) {
      const timer = setTimeout(() => setSaved(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [saved])

  async function save() {
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const payload = {
      user_id: user.id,
      title: data.title,
      summary: data.summary,
      experience: data.experience,
      education: data.education,
      projects: data.projects,
      certificates: data.certificates,
      skills: data.skills,
    }

    if (initialResume?.id) {
      await supabase.from('resumes').update(payload).eq('id', initialResume.id)
    } else {
      await supabase.from('resumes').insert(payload)
    }

    setSaving(false)
    setSaved(true)
    router.refresh()
  }

  const updateField = useCallback(<K extends keyof ResumeFormData>(key: K, value: ResumeFormData[K]) => {
    setData((prev) => ({ ...prev, [key]: value }))
  }, [])

  return (
    <div className="flex gap-6 h-[calc(100vh-4rem)]">
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Resume Builder</h1>
          <div className="flex items-center gap-3">
            {saved && <span className="text-sm text-green-600">Saved!</span>}
            <Button onClick={save} loading={saving} size="sm">
              Save Resume
            </Button>
          </div>
        </div>

        <div className="flex gap-1 border-b border-gray-200 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto pr-4">
          {activeTab === 'summary' && (
            <SummarySection summary={data.summary} onChange={(v) => updateField('summary', v)} />
          )}
          {activeTab === 'experience' && (
            <ExperienceSection items={data.experience} onChange={(v) => updateField('experience', v)} />
          )}
          {activeTab === 'education' && (
            <EducationSection items={data.education} onChange={(v) => updateField('education', v)} />
          )}
          {activeTab === 'projects' && (
            <ProjectsSection items={data.projects} onChange={(v) => updateField('projects', v)} />
          )}
          {activeTab === 'skills' && (
            <SkillsSection items={data.skills} onChange={(v) => updateField('skills', v)} />
          )}
          {activeTab === 'certificates' && (
            <CertificatesSection items={data.certificates} onChange={(v) => updateField('certificates', v)} />
          )}
        </div>
      </div>

      <div className="w-[500px] flex-shrink-0 hidden xl:block">
        <ResumePreview profile={profile} data={data} />
      </div>
    </div>
  )
}
