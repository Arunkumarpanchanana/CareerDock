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
import { FileDown } from 'lucide-react'
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

  const downloadPDF = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const name = profile?.full_name || 'Resume'

    const sectionsHtml = buildPreviewSections(profile, data)

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${name} - Resume</title>
        <style>
          @page { margin: 0.75in; size: letter; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: Georgia, "Times New Roman", serif;
            font-size: 11pt;
            line-height: 1.5;
            color: #1a1a1a;
          }
          .header {
            text-align: center;
            margin-bottom: 20px;
            padding-bottom: 12px;
            border-bottom: 1px solid #ccc;
          }
          .header h1 { font-size: 18pt; font-weight: 700; }
          .header .meta { font-size: 10pt; color: #555; margin-top: 4px; }
          .header .meta span + span:before { content: " | "; }
          section { margin-bottom: 16px; }
          section h2 {
            font-size: 10pt;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 8px;
            padding-bottom: 3px;
            border-bottom: 1px solid #ddd;
          }
          .exp-item, .edu-item, .proj-item, .cert-item { margin-bottom: 12px; }
          .exp-header, .edu-header, .cert-header {
            display: flex; justify-content: space-between; align-items: baseline;
          }
          .exp-header h3, .edu-header h3, .proj-header h3, .cert-header h3 {
            font-size: 11pt; font-weight: 700;
          }
          .exp-company, .cert-issuer { font-size: 10pt; color: #333; }
          .date { font-size: 9pt; color: #666; white-space: nowrap; margin-left: 16px; }
          ul { margin-top: 4px; padding-left: 16px; }
          li { font-size: 10pt; margin-bottom: 2px; }
          .desc { font-size: 10pt; margin-top: 2px; }
          .tech { font-size: 9pt; color: #555; margin-top: 2px; }
          .skills-line { font-size: 10pt; }
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${escapeHtml(name)}</h1>
          <div class="meta">
            ${profile?.location ? `<span>${escapeHtml(profile.location)}</span>` : ''}
            ${profile?.role_title ? `<span>${escapeHtml(profile.role_title)}</span>` : ''}
          </div>
        </div>
        ${sectionsHtml}
        <script>
          window.onload = function() { window.print(); window.close(); }
        <\/script>
      </body>
      </html>
    `)
    printWindow.document.close()
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
            <Button variant="secondary" size="sm" onClick={downloadPDF}>
              <FileDown className="h-4 w-4 mr-1.5" />
              Download PDF
            </Button>
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

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function buildPreviewSections(profile: Profile | null, data: ResumeFormData): string {
  let html = ''

  if (data.summary) {
    html += `<section><h2>Professional Summary</h2><p class="desc">${escapeHtml(data.summary)}</p></section>`
  }

  if (data.experience.length > 0) {
    html += '<section><h2>Experience</h2>'
    for (const exp of data.experience) {
      html += `<div class="exp-item">
        <div class="exp-header">
          <div>
            <h3>${escapeHtml(exp.role)}</h3>
            <div class="exp-company">${escapeHtml(exp.company)}</div>
          </div>
          <div class="date">${escapeHtml(exp.start_date)} – ${escapeHtml(exp.end_date || 'Present')}</div>
        </div>`
      const bullets = exp.bullets.filter((b) => b.trim())
      if (bullets.length > 0) {
        html += '<ul>' + bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join('') + '</ul>'
      }
      html += '</div>'
    }
    html += '</section>'
  }

  if (data.education.length > 0) {
    html += '<section><h2>Education</h2>'
    for (const edu of data.education) {
      html += `<div class="edu-item">
        <div class="edu-header">
          <div>
            <h3>${escapeHtml(edu.institution)}</h3>
            <div class="desc">${escapeHtml(edu.degree)}${edu.field ? ` in ${escapeHtml(edu.field)}` : ''}</div>
          </div>
          <div class="date">${escapeHtml(edu.year)}</div>
        </div>
      </div>`
    }
    html += '</section>'
  }

  if (data.projects.length > 0) {
    html += '<section><h2>Projects</h2>'
    for (const proj of data.projects) {
      html += `<div class="proj-item">
        <div class="proj-header">
          <h3>${escapeHtml(proj.name)}</h3>
        </div>
        ${proj.description ? `<p class="desc">${escapeHtml(proj.description)}</p>` : ''}
        ${proj.tech_stack ? `<p class="tech"><strong>Technologies:</strong> ${escapeHtml(proj.tech_stack)}</p>` : ''}
      </div>`
    }
    html += '</section>'
  }

  if (data.skills.length > 0) {
    html += `<section><h2>Skills</h2><p class="skills-line">${escapeHtml(data.skills.join(', '))}</p></section>`
  }

  if (data.certificates.length > 0) {
    html += '<section><h2>Certificates</h2>'
    for (const cert of data.certificates) {
      html += `<div class="cert-item">
        <div class="cert-header">
          <div>
            <h3>${escapeHtml(cert.name)}</h3>
            <div class="cert-issuer">${escapeHtml(cert.issuer)}</div>
          </div>
          <div class="date">${escapeHtml(cert.date)}</div>
        </div>
      </div>`
    }
    html += '</section>'
  }

  return html || '<p style="text-align:center;color:#999;padding:40px 0;">No resume content yet.</p>'
}
