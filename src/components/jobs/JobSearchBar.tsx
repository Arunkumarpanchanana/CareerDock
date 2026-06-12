'use client'

import { Search, Clock } from 'lucide-react'

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
  postedWithin: number | undefined
  onKeywordChange: (v: string) => void
  onLocationChange: (v: string) => void
  onPostedWithinChange: (v: number | undefined) => void
  onSearch: () => void
  loading: boolean
}

export function JobSearchBar({ keyword, location, postedWithin, onKeywordChange, onLocationChange, onPostedWithinChange, onSearch, loading }: JobSearchBarProps) {
  return (
    <div className="flex gap-3">
      <div className="flex-1 relative">
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
        className="w-48 rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <div className="relative">
        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        <select
          value={postedWithin ?? ''}
          onChange={(e) => onPostedWithinChange(e.target.value ? Number(e.target.value) : undefined)}
          className="w-40 rounded-lg border border-gray-300 pl-9 pr-3 py-2.5 text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {POSTED_OPTIONS.map((opt) => (
            <option key={opt.label} value={opt.value ?? ''}>{opt.label}</option>
          ))}
        </select>
      </div>
      <button
        onClick={onSearch}
        disabled={loading || !keyword.trim()}
        className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Searching...' : 'Search'}
      </button>
    </div>
  )
}
