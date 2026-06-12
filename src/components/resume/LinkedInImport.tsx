'use client'

import { useCallback, useRef, useState } from 'react'
import type { ResumeFormData } from '@/lib/resume'

interface ImportPreview {
  data: ResumeFormData
  confidence: number
  unmatched: string[]
}

interface LinkedInImportProps {
  onImport: (data: ResumeFormData) => void
}

export function LinkedInImport({ onImport }: LinkedInImportProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<ImportPreview | null>(null)

  const handleFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== 'application/pdf') {
      setError('Please select a PDF file')
      return
    }

    setProcessing(true)
    setError(null)

    try {
      const pdfjs = await import('pdfjs-dist')
      pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

      const buffer = await file.arrayBuffer()
      const pdf = await pdfjs.getDocument({ data: buffer }).promise
      let fullText = ''

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const content = await page.getTextContent()
        fullText += content.items.map((item) => ('str' in item ? (item as { str: string }).str : '')).join(' ') + '\n'
      }

      const res = await fetch('/api/import/linkedin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: fullText }),
      })

      if (!res.ok) {
        setError('Failed to parse PDF. Please try again.')
        return
      }

      const result = await res.json()
      setPreview({
        data: result.data,
        confidence: result.confidence,
        unmatched: result.unmatched || [],
      })
    } catch {
      setError('Failed to process PDF. Please try again.')
    } finally {
      setProcessing(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }, [])

  const confirmImport = useCallback(() => {
    if (preview) {
      onImport(preview.data)
      setPreview(null)
    }
  }, [preview, onImport])

  return (
    <div>
      <input
        ref={fileRef}
        type="file"
        accept=".pdf"
        className="hidden"
        onChange={handleFile}
      />
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={processing}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 disabled:opacity-50 transition-colors"
      >
        {processing ? (
          <>
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Processing...
          </>
        ) : (
          'Import from LinkedIn'
        )}
      </button>

      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}

      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Import Preview</h3>

            {preview.confidence < 0.7 && (
              <p className="text-sm text-amber-600 mb-3 bg-amber-50 px-3 py-2 rounded-lg">
                Low confidence parse — please review the detected fields carefully.
              </p>
            )}

            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Sections detected</span>
                <span className="font-medium">{
                  [preview.data.summary && 'Summary',
                   ...preview.data.experience.map(() => 'Experience'),
                   ...preview.data.education.map(() => 'Education'),
                   preview.data.skills.length > 0 && 'Skills',
                   preview.data.projects.length > 0 && 'Projects',
                   preview.data.certificates.length > 0 && 'Certificates',
                  ].filter(Boolean).length
                }</span>
              </div>
              {preview.data.summary && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="text-green-500">✓</span> Summary
                </div>
              )}
              {preview.data.experience.map((exp, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="text-green-500">✓</span> {exp.role} at {exp.company}
                </div>
              ))}
              {preview.data.education.map((edu, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="text-green-500">✓</span> {edu.degree} — {edu.institution}
                </div>
              ))}
              {preview.data.skills.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="text-green-500">✓</span> {preview.data.skills.length} skills
                </div>
              )}
              {preview.data.projects.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="text-green-500">✓</span> {preview.data.projects.length} projects
                </div>
              )}
              {preview.data.certificates.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="text-green-500">✓</span> {preview.data.certificates.length} certificates
                </div>
              )}
              {preview.unmatched.length > 0 && (
                <div className="mt-3 p-2 bg-amber-50 rounded text-sm text-amber-700">
                  <p className="font-medium mb-1">Unmatched sections:</p>
                  <ul className="list-disc pl-4">
                    {preview.unmatched.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 justify-end">
              <button
                type="button"
                onClick={() => setPreview(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmImport}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Apply Import
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
