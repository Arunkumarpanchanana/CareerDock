'use client'

export function SummarySection({
  summary,
  onChange,
}: {
  summary: string
  onChange: (value: string) => void
}) {
  return (
    <div className="space-y-4 max-w-2xl">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Professional Summary</h2>
        <p className="text-sm text-gray-500 mt-1">
          A brief overview of your experience, skills, and career goals.
        </p>
      </div>
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
