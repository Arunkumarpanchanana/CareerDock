'use client'

import { CheckCircle2, XCircle, Lightbulb, FileText, AlertTriangle } from 'lucide-react'
import { useState } from 'react'

interface ApplicationPrepData {
  matchScore: number
  verdict: string
  verdict_explanation: string
  strengths: string[]
  gaps: string[]
  missingKeywords: string[]
  suggestions: string[]
  coverLetter: string
}

interface ApplicationPrepProps {
  data: ApplicationPrepData
}

function ScoreGauge({ score }: { score: number }) {
  const color = score >= 70 ? 'text-green-600' : score >= 40 ? 'text-amber-600' : 'text-red-600'
  const bgColor = score >= 70 ? 'bg-green-100' : score >= 40 ? 'bg-amber-100' : 'bg-red-100'
  return (
    <div className={`inline-flex items-center gap-2 ${bgColor} rounded-full px-4 py-2`}>
      <span className={`text-2xl font-bold ${color}`}>{score}</span>
      <span className={`text-sm font-medium ${color}`}>/ 100</span>
    </div>
  )
}

export function ApplicationPrep({ data }: ApplicationPrepProps) {
  const [coverLetter, setCoverLetter] = useState(data.coverLetter)

  const scoreColor = data.matchScore >= 70 ? 'text-green-700' : data.matchScore >= 40 ? 'text-amber-700' : 'text-red-700'

  return (
    <div className="space-y-6 border-t border-gray-200 pt-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Application Prep</h3>
        <ScoreGauge score={data.matchScore} />
      </div>

      <p className={`text-sm font-medium ${scoreColor}`}>
        {data.verdict}
      </p>
      <p className="text-sm text-gray-600">{data.verdict_explanation}</p>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-green-700 flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4" /> Strengths
          </h4>
          {data.strengths.length > 0 ? (
            <ul className="space-y-1">
              {data.strengths.map((s, i) => (
                <li key={i} className="text-sm text-gray-600 flex items-start gap-1.5">
                  <span className="text-green-500 mt-0.5">•</span> {s}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-400">No specific strengths identified</p>
          )}
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-red-700 flex items-center gap-1.5">
            <XCircle className="h-4 w-4" /> Gaps
          </h4>
          {data.gaps.length > 0 ? (
            <ul className="space-y-1">
              {data.gaps.map((g, i) => (
                <li key={i} className="text-sm text-gray-600 flex items-start gap-1.5">
                  <span className="text-red-500 mt-0.5">•</span> {g}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-400">No major gaps detected</p>
          )}
        </div>
      </div>

      {data.missingKeywords.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-amber-700 flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4" /> Missing Keywords
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {data.missingKeywords.map((kw, i) => (
              <span key={i} className="text-xs bg-amber-50 text-amber-700 rounded-full px-2.5 py-1">
                {kw}
              </span>
            ))}
          </div>
        </div>
      )}

      {data.suggestions.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-blue-700 flex items-center gap-1.5">
            <Lightbulb className="h-4 w-4" /> Suggestions
          </h4>
          <ul className="space-y-1">
            {data.suggestions.map((s, i) => (
              <li key={i} className="text-sm text-gray-600 flex items-start gap-1.5">
                <span className="text-blue-500 mt-0.5">•</span> {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
          <FileText className="h-4 w-4" /> Cover Letter
        </h4>
        <textarea
          value={coverLetter}
          onChange={(e) => setCoverLetter(e.target.value)}
          rows={10}
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
        />
      </div>
    </div>
  )
}
