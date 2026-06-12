'use client'

import type { JobListing } from '@/types/database'
import { Building2, MapPin, DollarSign, CalendarDays } from 'lucide-react'

interface JobCardProps {
  job: JobListing
  selected: boolean
  onClick: () => void
}

export function JobCard({ job, selected, onClick }: JobCardProps) {
  const daysAgo = job.daysAgo

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-lg border p-4 transition-all hover:shadow-sm ${
        selected ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-gray-200 bg-white'
      }`}
    >
      <div className="space-y-2">
        <div>
          <h3 className="font-semibold text-gray-900 leading-tight">{job.title}</h3>
          <div className="flex items-center gap-1.5 text-sm text-gray-600 mt-0.5">
            <Building2 className="h-3.5 w-3.5" />
            {job.company}
          </div>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
          {job.location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {job.location}
            </span>
          )}
          {(job.salary_min || job.salary_max) && (
            <span className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              {job.salary_min ? `$${job.salary_min.toLocaleString()}` : ''}
              {job.salary_min && job.salary_max ? ' - ' : ''}
              {job.salary_max ? `$${job.salary_max.toLocaleString()}` : ''}
            </span>
          )}
          {daysAgo !== null && (
            <span className="flex items-center gap-1">
              <CalendarDays className="h-3 w-3" />
              {daysAgo === 0 ? 'Today' : `${daysAgo}d ago`}
            </span>
          )}
          {job.contract_type && (
            <span className="capitalize">{job.contract_type}</span>
          )}
        </div>
      </div>
    </button>
  )
}
