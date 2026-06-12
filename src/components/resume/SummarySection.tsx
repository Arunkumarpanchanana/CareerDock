'use client'

import { SUMMARY_TEMPLATES } from '@/lib/suggestions'
import { Loader2, Sparkles, Wand2 } from 'lucide-react'
import { useState } from 'react'

export function SummarySection({
  summary,
  onChange,
}: {
  summary: string
  onChange: (value: string) => void
}) {
  const [showTemplates, setShowTemplates] = useState(false)
  const [showAiGenerate, setShowAiGenerate] = useState(false)
  const [targetRole, setTargetRole] = useState('')
  const [keyStrengths, setKeyStrengths] = useState('')
  const [generating, setGenerating] = useState(false)

  const generateAiSummary = async () => {
    setGenerating(true)
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'summary',
          data: {
            experience: keyStrengths ? [keyStrengths] : [],
            targetRole: targetRole || 'professional',
          },
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        if (res.status === 403) { alert(err.error); return }
        throw new Error(err.error)
      }
      const json = await res.json()
      onChange(json.result)
      setShowAiGenerate(false)
    } catch {
      alert('Failed to generate summary. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Professional Summary</h2>
          <p className="text-sm text-gray-500 mt-1">
            A brief overview of your experience, skills, and career goals.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAiGenerate(!showAiGenerate)}
            className="inline-flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700 font-medium"
          >
            <Wand2 className="h-3 w-3" />
            AI Generate
          </button>
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            <Sparkles className="h-3 w-3" />
            Templates
          </button>
        </div>
      </div>

      {showAiGenerate && (
        <div className="rounded-lg border border-purple-200 bg-purple-50 p-3 space-y-2">
          <p className="text-xs font-medium text-purple-700">Generate a tailored summary with AI</p>
          <input
            className="block w-full rounded-lg border border-purple-300 px-3 py-2 text-sm placeholder:text-purple-400 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white"
            placeholder="Target role (e.g. Senior Software Engineer)"
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
          />
          <textarea
            rows={2}
            className="block w-full rounded-lg border border-purple-300 px-3 py-2 text-sm placeholder:text-purple-400 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white"
            placeholder="Key strengths or experience to highlight (optional)"
            value={keyStrengths}
            onChange={(e) => setKeyStrengths(e.target.value)}
          />
          <div className="flex gap-2">
            <button
              onClick={generateAiSummary}
              disabled={generating}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              {generating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
              {generating ? 'Generating...' : 'Generate Summary'}
            </button>
            <button
              onClick={() => { setShowAiGenerate(false); setTargetRole(''); setKeyStrengths('') }}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {showTemplates && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 space-y-2">
          <p className="text-xs font-medium text-blue-700">Choose a template to get started:</p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { onChange(''); setShowTemplates(false) }}
              className="px-3 py-1.5 text-xs font-medium text-red-600 hover:text-red-700 border border-red-200 hover:border-red-300 rounded-lg transition-colors"
            >
              Clear Summary
            </button>
            <p className="text-xs text-gray-500">or pick a template below:</p>
          </div>
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
