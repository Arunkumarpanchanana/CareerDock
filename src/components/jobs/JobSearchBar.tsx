'use client'

import { Search, Clock, Building2 } from 'lucide-react'

const POSTED_OPTIONS = [
  { label: 'Any time', value: undefined },
  { label: 'Past 24 hours', value: 1 },
  { label: 'Past 3 days', value: 3 },
  { label: 'Past week', value: 7 },
  { label: 'Past 2 weeks', value: 14 },
  { label: 'Past month', value: 30 },
] as const

interface JobSearchBarProps {
  keyword: string
  location: string
  company: string
  postedWithin: number | undefined
  onKeywordChange: (v: string) => void
  onLocationChange: (v: string) => void
  onCompanyChange: (v: string) => void
  onPostedWithinChange: (v: number | undefined) => void
  onSearch: () => void
  loading: boolean
}

export function JobSearchBar({ keyword, location, company, postedWithin, onKeywordChange, onLocationChange, onCompanyChange, onPostedWithinChange, onSearch, loading }: JobSearchBarProps) {
  return (
    <div className="space-y-3">
      <div className="flex gap-3 flex-wrap">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Job title, keyword, or company..."
            value={keyword}
            onChange={(e) => onKeywordChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSearch()}
            className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <input
          type="text"
          placeholder="Location"
          value={location}
          onChange={(e) => onLocationChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSearch()}
          className="w-44 rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={onSearch}
          disabled={loading || !keyword.trim()}
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Company (optional)"
            value={company}
            onChange={(e) => onCompanyChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSearch()}
            className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="relative w-44">
          <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <select
            value={postedWithin ?? ''}
            onChange={(e) => onPostedWithinChange(e.target.value ? Number(e.target.value) : undefined)}
            className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2.5 text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {POSTED_OPTIONS.map((opt) => (
              <option key={opt.label} value={opt.value ?? ''}>{opt.label}</option>
            ))}
          </select>
        </div>
        <p className="text-xs text-gray-400 self-center">Separate multiple titles with commas</p>
      </div>
    </div>
  )
}
