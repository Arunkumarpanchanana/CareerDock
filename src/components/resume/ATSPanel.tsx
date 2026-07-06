'use client'

import { analyzeResume, type ATSScore } from '@/lib/ats-score'
import type { ResumeFormData } from '@/lib/resume'
import { AlertCircle, CheckCircle, Info, Loader2, Search, X } from 'lucide-react'
import { useState } from 'react'

export function ATSPanel({
  data,
  persona = 'professional',
}: {
  data: ResumeFormData
  persona?: string
}) {
  const [score, setScore] = useState<ATSScore | null>(null)
  const [jobDescription, setJobDescription] = useState('')
  const [scanning, setScanning] = useState(false)
  const [expandedIssue, setExpandedIssue] = useState<number | null>(null)

  const runScan = async () => {
    setScanning(true)
    // Simulate brief delay for UX
    await new Promise((r) => setTimeout(r, 300))
    const result = analyzeResume(data, jobDescription, persona)
    setScore(result)
    setScanning(false)
  }

  const severityIcon = (severity: string) => {
    switch (severity) {
      case 'error': return <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
      case 'warning': return <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
      case 'info': return <Info className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
      default: return <Info className="h-4 w-4 text-gray-500 flex-shrink-0 mt-0.5" />
    }
  }

  const scoreColor = (value: number) => {
    if (value >= 80) return 'text-green-600'
    if (value >= 60) return 'text-amber-600'
    return 'text-red-600'
  }

  const scoreBg = (value: number) => {
    if (value >= 80) return 'bg-green-50 border-green-200'
    if (value >= 60) return 'bg-amber-50 border-amber-200'
    return 'bg-red-50 border-red-200'
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">ATS Resume Checker</h3>
        {score && (
          <button
            onClick={() => { setScore(null); setExpandedIssue(null) }}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-gray-500">
          Job Description (optional — paste for keyword matching)
        </label>
        <textarea
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          rows={4}
          className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Paste a job description to check keyword alignment..."
        />
      </div>

      <button
        onClick={runScan}
        disabled={scanning}
        className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {scanning ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Search className="h-4 w-4" />
        )}
        {scanning ? 'Scanning...' : 'Scan Resume'}
      </button>

      {scanning && (
        <div className="flex items-center gap-3 text-gray-500 text-sm py-8">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
          Analyzing your resume against ATS criteria...
        </div>
      )}

      {score && (
        <div className="space-y-4">
          {/* Overall score */}
          <div className={`rounded-xl border p-4 text-center ${scoreBg(score.overall)}`}>
            <div className={`text-4xl font-bold ${scoreColor(score.overall)}`}>
              {score.overall}
            </div>
            <div className="text-xs font-medium text-gray-500 mt-1">ATS Score</div>
            <div className="flex items-center justify-center gap-4 mt-3 text-xs">
              <span className="text-gray-500">
                Formatting: <span className={scoreColor(score.formatting)}>{score.formatting}</span>
              </span>
              <span className="text-gray-500">
                Keywords: <span className={scoreColor(score.keywordMatch)}>{score.keywordMatch}</span>
              </span>
              <span className="text-gray-500">
                Content: <span className={scoreColor(score.contentQuality)}>{score.contentQuality}</span>
              </span>
            </div>
          </div>

          {/* Issues list */}
          {score.issues.length > 0 && (
            <div className="space-y-1.5">
              <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                {score.issues.length} {score.issues.length === 1 ? 'Issue' : 'Issues'} Found
              </h4>
              {score.issues.map((issue, i) => (
                <div key={i} className="rounded-lg border border-gray-200">
                  <button
                    onClick={() => setExpandedIssue(expandedIssue === i ? null : i)}
                    className="w-full flex items-start gap-2 p-3 text-left"
                  >
                    {severityIcon(issue.severity)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-medium text-gray-900">{issue.message}</p>
                        {issue.section && (
                          <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded flex-shrink-0">
                            {issue.section}
                          </span>
                        )}
                      </div>
                      {expandedIssue === i && issue.suggestion && (
                        <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                          {issue.suggestion}
                        </p>
                      )}
                    </div>
                  </button>
                </div>
              ))}
            </div>
          )}

          {score.issues.length === 0 && (
            <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 p-3">
              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
              <p className="text-xs text-green-700">No issues found. Your resume looks great!</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
