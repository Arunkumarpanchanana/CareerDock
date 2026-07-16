'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { Profile } from '@/types/database'
import type { ResumeFormData } from '@/lib/resume'

interface SavedLetter {
  id: string
  title: string
  content: string
  job_title: string
  company: string
  job_description: string
  created_at: string
  updated_at: string
}

interface CoverLetterClientProps {
  profile: Profile | null
  resumeData: ResumeFormData
}

export function CoverLetterClient({ profile, resumeData }: CoverLetterClientProps) {
  const [jobTitle, setJobTitle] = useState('')
  const [company, setCompany] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [content, setContent] = useState('')
  const [activeId, setActiveId] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [history, setHistory] = useState<SavedLetter[]>([])
  const [error, setError] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const loadedRef = useRef(false)

  const resumeSummary = [
    resumeData.summary,
    ...resumeData.experience.map((e) => `${e.role} at ${e.company}`),
    ...resumeData.skills,
  ].filter(Boolean).join('. ')

  const generate = useCallback(async () => {
    if (!jobTitle.trim() || !company.trim()) return
    setGenerating(true)
    setError(null)

    try {
      const res = await fetch('/api/cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resume: resumeSummary,
          jobTitle: jobTitle.trim(),
          company: company.trim(),
          jobDescription: jobDescription.trim(),
        }),
      })

      if (!res.ok) {
        setError('Failed to generate cover letter.')
        return
      }

      const data = await res.json()
      setContent(data.content)
      setActiveId(data.id)
      if (!loadedRef.current) {
        loadHistory()
        loadedRef.current = true
      }
    } catch {
      setError('Failed to generate cover letter.')
    } finally {
      setGenerating(false)
    }
  }, [jobTitle, company, jobDescription, resumeSummary])

  const save = useCallback(async () => {
    if (!activeId || !content.trim()) return
    setSaving(true)
    setError(null)

    try {
      const res = await fetch(`/api/cover-letter?id=${activeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })

      if (!res.ok) {
        setError('Failed to save cover letter.')
        return
      }

      loadHistory()
    } catch {
      setError('Failed to save cover letter.')
    } finally {
      setSaving(false)
    }
  }, [activeId, content])

  const loadHistory = useCallback(async () => {
    try {
      const res = await fetch('/api/cover-letter')
      if (res.ok) {
        const data = await res.json()
        setHistory(data)
      }
    } catch {
      // non-critical
    }
  }, [])

  useEffect(() => { loadHistory(); loadedRef.current = true }, [loadHistory])

  const loadLetter = useCallback((letter: SavedLetter) => {
    setContent(letter.content)
    setActiveId(letter.id)
    setJobTitle(letter.job_title)
    setCompany(letter.company)
    setJobDescription(letter.job_description)
    setShowHistory(false)
  }, [])

  const downloadPDF = useCallback(async () => {
    try {
      const { CoverLetterPDFDocument } = await import('./CoverLetterPDF')
      const { pdf } = await import('@react-pdf/renderer')

      const blob = await pdf(
        <CoverLetterPDFDocument
          profile={profile}
          content={content}
          jobTitle={jobTitle}
          company={company}
        />
      ).toBlob()

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Cover_Letter_${company.replace(/\s+/g, '_')}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      setError('Failed to generate PDF.')
    }
  }, [profile, content, jobTitle, company])

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Cover Letter Generator</h1>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          {showHistory ? 'Hide History' : `History (${history.length})`}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
            <input
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="e.g. Senior Frontend Engineer"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
            <input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g. Tech Corp"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Job Description</label>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description here..."
              rows={6}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={generate}
              disabled={generating || !jobTitle.trim() || !company.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {generating ? 'Generating...' : 'Generate'}
            </button>
            {content && (
              <>
                <button
                  onClick={save}
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={downloadPDF}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Download PDF
                </button>
              </>
            )}
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          {showHistory && history.length > 0 && (
            <div className="border border-gray-200 rounded-lg divide-y divide-gray-200 max-h-64 overflow-y-auto">
              {history.map((letter) => (
                <button
                  key={letter.id}
                  onClick={() => loadLetter(letter)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <p className="text-sm font-medium text-gray-900">{letter.title}</p>
                  <p className="text-xs text-gray-500">
                    {letter.company} — {new Date(letter.created_at).toLocaleDateString()}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          {content ? (
            <div className="border border-gray-200 rounded-lg p-6 bg-white min-h-[400px] whitespace-pre-wrap text-sm text-gray-800 leading-relaxed font-serif">
              {content}
            </div>
          ) : (
            <div className="border border-gray-200 rounded-lg p-6 bg-gray-50 min-h-[400px] flex items-center justify-center text-sm text-gray-400">
              Fill in job details and click Generate to create your cover letter
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
