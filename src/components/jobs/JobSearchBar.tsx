'use client'

import { useState } from 'react'
import { Search, Clock, Building2, SlidersHorizontal, X } from 'lucide-react'

const POSTED_OPTIONS = [
  { label: 'Any time', value: undefined },
  { label: 'Past 24 hours', value: 1 },
  { label: 'Past 3 days', value: 3 },
  { label: 'Past week', value: 7 },
  { label: 'Past 2 weeks', value: 14 },
  { label: 'Past month', value: 30 },
] as const

const JOB_TYPE_OPTIONS = [
  { label: 'Any', value: '' },
  { label: 'Permanent', value: 'permanent' },
  { label: 'Contract', value: 'contract' },
] as const

const SCHEDULE_OPTIONS = [
  { label: 'Any', value: '' },
  { label: 'Full Time', value: 'full_time' },
  { label: 'Part Time', value: 'part_time' },
] as const

const EDUCATION_OPTIONS = [
  { label: 'Any', value: '' },
  { label: 'Certificate', value: 'certificate' },
  { label: 'High School', value: 'high_school' },
  { label: 'Bachelors Degree', value: 'bachelors' },
  { label: 'Masters Degree', value: 'masters' },
  { label: 'Ignore Education', value: 'ignore' },
] as const

interface JobSearchBarProps {
  keyword: string
  location: string
  company: string
  skills: string
  jobType: string
  workSchedule: string
  experienceYears: number | undefined
  educationLevel: string
  postedWithin: number | undefined
  onKeywordChange: (v: string) => void
  onLocationChange: (v: string) => void
  onCompanyChange: (v: string) => void
  onSkillsChange: (v: string) => void
  onJobTypeChange: (v: string) => void
  onWorkScheduleChange: (v: string) => void
  onExperienceYearsChange: (v: number | undefined) => void
  onEducationLevelChange: (v: string) => void
  onPostedWithinChange: (v: number | undefined) => void
  onSearch: () => void
  loading: boolean
}

export function JobSearchBar({
  keyword, location, company, skills, jobType, workSchedule, experienceYears, educationLevel, postedWithin,
  onKeywordChange, onLocationChange, onCompanyChange, onSkillsChange,
  onJobTypeChange, onWorkScheduleChange, onExperienceYearsChange, onEducationLevelChange,
  onPostedWithinChange, onSearch, loading,
}: JobSearchBarProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)
  const hasActiveFilters = company || skills || jobType || workSchedule || experienceYears !== undefined || educationLevel || postedWithin !== undefined

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
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`rounded-lg border px-3 py-2.5 text-sm transition-colors ${hasActiveFilters ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-gray-300 text-gray-500 hover:bg-gray-50'}`}
        >
          <SlidersHorizontal className="h-4 w-4" />
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

      {showAdvanced && (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-900">Advanced Filters</span>
            <button onClick={() => setShowAdvanced(false)} className="text-gray-400 hover:text-gray-600">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Skills</label>
              <input
                type="text"
                placeholder="e.g. Python, React"
                value={skills}
                onChange={(e) => onSkillsChange(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Job Type</label>
              <select
                value={jobType}
                onChange={(e) => onJobTypeChange(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {JOB_TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Work Schedule</label>
              <select
                value={workSchedule}
                onChange={(e) => onWorkScheduleChange(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {SCHEDULE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Experience (years)</label>
              <input
                type="number"
                min="0"
                max="50"
                placeholder="Min years"
                value={experienceYears ?? ''}
                onChange={(e) => onExperienceYearsChange(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Education</label>
              <select
                value={educationLevel}
                onChange={(e) => onEducationLevelChange(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {EDUCATION_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
