'use client'

import { ATSPanel } from '@/components/resume/ATSPanel'
import { PersonaSelector, type Persona } from '@/components/resume/PersonaSelector'

import { ResumePreview } from '@/components/resume/ResumePreview'
import { SummarySection } from '@/components/resume/SummarySection'
import { ExperienceSection } from '@/components/resume/ExperienceSection'
import { EducationSection } from '@/components/resume/EducationSection'
import { ProjectsSection } from '@/components/resume/ProjectsSection'
import { SkillsSection } from '@/components/resume/SkillsSection'
import { CertificatesSection } from '@/components/resume/CertificatesSection'
import { TemplateGallery } from '@/components/resume/TemplateGallery'
import { Button } from '@/components/ui'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { resumeToFormData, type ResumeFormData } from '@/lib/resume'
import { Eye, EyeOff, FileDown, GraduationCap, Grid3X3, Plus, Search, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
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
  initialResumes,
}: {
  profile: Profile | null
  initialResumes: Resume[]
}) {
  const [resumes, setResumes] = useState<Resume[]>(initialResumes)
  const [activeId, setActiveId] = useState<string | null>(initialResumes[0]?.id ?? null)
  const [data, setData] = useState<ResumeFormData>(() =>
    activeId ? resumeToFormData(initialResumes.find((r) => r.id === activeId)!) : resumeToFormData(null)
  )
  const [activeTab, setActiveTab] = useState<Tab>('summary')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [renaming, setRenaming] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [showATS, setShowATS] = useState(false)
  const [showGallery, setShowGallery] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const router = useRouter()
  const [persona, setPersona] = useState<Persona | null>(
    (profile?.persona as Persona) ?? null
  )
  const autosaveRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const isDirtyRef = useRef(false)

  const activeResume = resumes.find((r) => r.id === activeId) ?? null

  useEffect(() => {
    if (saved) {
      const timer = setTimeout(() => setSaved(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [saved])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        save()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  })

  useEffect(() => {
    if (autosaveRef.current) clearTimeout(autosaveRef.current)
    if (isDirtyRef.current) {
      autosaveRef.current = setTimeout(() => {
        save()
      }, 30000)
    }
    return () => { if (autosaveRef.current) clearTimeout(autosaveRef.current) }
  }, [data])

  const switchResume = (id: string) => {
    const r = resumes.find((res) => res.id === id)
    if (r) {
      setActiveId(id)
      setData(resumeToFormData(r))
      setActiveTab('summary')
    }
  }

  async function save() {
    if (!activeResume && !activeId) {
      await createNew()
      return
    }
    setError(null)
    setSaving(true)
    try {
      const payload = {
        id: activeResume?.id,
        title: data.title,
        summary: data.summary,
        experience: data.experience,
        education: data.education,
        projects: data.projects,
        certificates: data.certificates,
        skills: data.skills,
      }

      const res = await fetch('/api/resume', {
        method: activeResume?.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        setError('Failed to save resume')
        return
      }

      const savedRes = await res.json()
      const savedResume = savedRes as Resume
      setResumes((prev) => {
        const exists = prev.find((r) => r.id === savedResume.id)
        if (exists) {
          return prev.map((r) => (r.id === savedResume.id ? savedResume : r))
        }
        return [savedResume, ...prev]
      })
      if (!activeResume?.id) setActiveId(savedResume.id)
      setSaved(true)
      isDirtyRef.current = false
    } catch {
      setError('Failed to save resume')
    } finally {
      setSaving(false)
      router.refresh()
    }
  }

  async function createNew() {
    setError(null)
    try {
      const res = await fetch('/api/resume', { method: 'POST' })
      if (!res.ok) {
        setError('Failed to create resume')
        return
      }
      const created = await res.json()
      const newResume = created as Resume
      setResumes((prev) => [newResume, ...prev])
      setActiveId(newResume.id)
      setData(resumeToFormData(newResume))
      setActiveTab('summary')
    } catch {
      setError('Failed to create resume')
    }
  }

  async function deleteResume() {
    if (!deleteTarget) return
    setError(null)
    try {
      const res = await fetch(`/api/resume?id=${deleteTarget}`, { method: 'DELETE' })
      if (!res.ok) {
        setError('Failed to delete resume')
        return
      }
      setResumes((prev) => prev.filter((r) => r.id !== deleteTarget))
      if (activeId === deleteTarget) {
        const next = resumes.find((r) => r.id !== deleteTarget)
        if (next) {
          setActiveId(next.id)
          setData(resumeToFormData(next))
        } else {
          setActiveId(null)
          setData(resumeToFormData(null))
        }
      }
    } catch {
      setError('Failed to delete resume')
    } finally {
      setDeleteTarget(null)
    }
  }

  async function renameResume(id: string, newTitle: string) {
    if (!newTitle.trim()) return
    try {
      await fetch('/api/resume', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, title: newTitle.trim() }),
      })
      setResumes((prev) => prev.map((r) => (r.id === id ? { ...r, title: newTitle.trim() } : r)))
      setRenaming(null)
    } catch (err) {
      console.error('Rename error:', err)
    }
  }

  const downloadPDF = async () => {
    setError(null)
    try {
      const { ResumePDFDocument } = await import('@/components/resume/ResumePDF')
      const { pdf } = await import('@react-pdf/renderer')
      const name = profile?.full_name || 'Resume'
      const blob = await pdf(<ResumePDFDocument profile={profile} data={data} />).toBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${name.replace(/\s+/g, '_')}_Resume.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      setError('Failed to generate PDF. Please try again.')
    }
  }

  const updateField = useCallback(<K extends keyof ResumeFormData>(key: K, value: ResumeFormData[K]) => {
    setData((prev) => ({ ...prev, [key]: value }))
    isDirtyRef.current = true
  }, [])

  if (!persona) {
    return (
      <div className="max-w-3xl mx-auto py-12">
        <PersonaSelector
          onSelect={(p) => setPersona(p)}
          onSkip={() => setPersona('professional')}
        />
      </div>
    )
  }

  return (
    <div className="flex gap-6 h-[calc(100vh-4rem)]">
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-4 gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {persona && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 mr-2">
                <GraduationCap className="h-3 w-3" />
                {persona.charAt(0).toUpperCase() + persona.slice(1)}
              </span>
            )}
            {renaming === activeId ? (
              <input
                autoFocus
                defaultValue={activeResume?.title ?? ''}
                onBlur={(e) => renameResume(activeId!, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') renameResume(activeId!, (e.target as HTMLInputElement).value)
                  if (e.key === 'Escape') setRenaming(null)
                }}
                className="rounded-lg border border-blue-500 px-2 py-1 text-lg font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <div className="flex items-center gap-2 min-w-0">
                <select
                  value={activeId ?? ''}
                  onChange={(e) => switchResume(e.target.value)}
                  className="text-2xl font-bold text-gray-900 bg-transparent border-none focus:outline-none cursor-pointer"
                >
                  {resumes.length === 0 && <option value="">No resumes</option>}
                  {resumes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.title}
                    </option>
                  ))}
                </select>
                {activeResume && (
                  <button
                    onClick={() => setRenaming(activeId)}
                    className="text-xs text-gray-400 hover:text-gray-600"
                  >
                    Rename
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            {saved && <span className="text-sm text-green-600">Saved!</span>}
            {error && <span className="text-sm text-red-600">{error}</span>}
            <button
              onClick={() => { setShowATS(!showATS); setShowPreview(false) }}
              className={`p-2 transition-colors ${showATS ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
              title="ATS Resume Checker"
            >
              <Search className="h-4 w-4" />
            </button>
            <button
              onClick={() => { setShowPreview(!showPreview); setShowATS(false) }}
              className={`xl:hidden p-2 transition-colors ${showPreview ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
              title={showPreview ? 'Hide preview' : 'Show preview'}
            >
              {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
            <Button variant="secondary" size="sm" onClick={downloadPDF}>
              <FileDown className="h-4 w-4 mr-1.5" />
              Download PDF
            </Button>
            <Button onClick={save} loading={saving} size="sm">
              Save Resume
            </Button>
          </div>
        </div>

        {resumes.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center border-2 border-dashed border-gray-200 rounded-xl">
            <p className="text-gray-500 mb-4">You haven&apos;t created any resumes yet.</p>
            <Button onClick={createNew}>
              <Plus className="h-4 w-4 mr-1.5" /> Create Your First Resume
            </Button>
          </div>
        ) : activeResume ? (
          <>
            <div className="flex items-center justify-between border-b border-gray-200 mb-6">
              <div className="flex gap-1">
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
              <button
                onClick={() => setDeleteTarget(activeResume.id)}
                className="text-gray-400 hover:text-red-500 transition-colors p-2"
                title="Delete resume"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <div className="flex items-center gap-2 mb-4">
              <Button variant="ghost" size="sm" onClick={createNew}>
                <Plus className="h-4 w-4 mr-1" /> New Resume
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowGallery(true)}>
                <Grid3X3 className="h-4 w-4 mr-1" /> Templates
              </Button>
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
          </>
        ) : null}
      </div>

      <div className={`w-[500px] flex-shrink-0 ${showPreview || showATS ? 'block' : 'hidden xl:block'}`}>
        {showATS ? (
          <div className="h-full overflow-y-auto bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <ATSPanel data={data} persona={persona} />
          </div>
        ) : (
          <ResumePreview profile={profile} data={data} persona={persona} />
        )}
      </div>

      <ConfirmModal
        open={!!deleteTarget}
        title="Delete resume"
        message="Delete this resume? This cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={deleteResume}
        onCancel={() => setDeleteTarget(null)}
      />

      {showGallery && (
        <TemplateGallery
          data={data}
          currentTemplate="professional-classic"
          currentPersona={persona}
          onSelect={(templateId) => {
            // Template selection is primarily visual — content is preserved
            setShowGallery(false)
          }}
          onClose={() => setShowGallery(false)}
        />
      )}
    </div>
  )
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
