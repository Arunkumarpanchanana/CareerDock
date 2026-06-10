'use client'

import { SUMMARY_TEMPLATES } from '@/lib/suggestions'
import { Sparkles } from 'lucide-react'
import { useState } from 'react'

export function SummarySection({
  summary,
  onChange,
}: {
  summary: string
  onChange: (value: string) => void
}) {
  const [showTemplates, setShowTemplates] = useState(false)

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Professional Summary</h2>
          <p className="text-sm text-gray-500 mt-1">
            A brief overview of your experience, skills, and career goals.
          </p>
        </div>
        <button
          onClick={() => setShowTemplates(!showTemplates)}
          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
        >
          <Sparkles className="h-3 w-3" />
          Templates
        </button>
      </div>

      {showTemplates && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 space-y-2">
          <p className="text-xs font-medium text-blue-700">Choose a template to get started:</p>
          <div className="grid gap-2">
            {SUMMARY_TEMPLATES.map((tpl) => (
              <button
                key={tpl.label}
                onClick={() => {
                  onChange(tpl.text)
                  setShowTemplates(false)
                }}
                className="block w-full text-left px-3 py-2 rounded-lg bg-white border border-blue-200 hover:border-blue-400 transition-colors"
              >
                <span className="text-xs font-semibold text-gray-900">{tpl.label}</span>
                <p className="text-xs text-gray-600 mt-1 line-clamp-2">{tpl.text}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      <textarea
        value={summary}
        onChange={(e) => onChange(e.target.value)}
        rows={6}
        className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        placeholder="Results-driven software engineer with 3+ years of experience building scalable web applications..."
      />
      <p className="text-xs text-gray-400">{summary.length} characters</p>
    </div>
  )
}
