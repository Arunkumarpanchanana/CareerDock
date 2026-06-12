'use client'

import type { JobListing } from '@/types/database'
import { Building2, MapPin, DollarSign, ExternalLink, CalendarDays, Briefcase, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui'

interface JobDetailPanelProps {
  job: JobListing
  onPrepare: () => void
  onApply: () => void
  preparing: boolean
  applied: boolean
}

export function JobDetailPanel({ job, onPrepare, onApply, preparing, applied }: JobDetailPanelProps) {
  const daysAgo = job.created
    ? Math.floor((Date.now() - new Date(job.created).getTime()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">{job.title}</h2>
        <div className="flex items-center gap-1.5 mt-1 text-gray-600">
          <Building2 className="h-4 w-4" />
          <span className="font-medium">{job.company}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 text-sm text-gray-500">
        {job.location && (
          <span className="flex items-center gap-1.5 bg-gray-100 rounded-full px-3 py-1">
            <MapPin className="h-3.5 w-3.5" /> {job.location}
          </span>
        )}
        {(job.salary_min || job.salary_max) && (
          <span className="flex items-center gap-1.5 bg-green-100 text-green-700 rounded-full px-3 py-1">
            <DollarSign className="h-3.5 w-3.5" />
            {job.salary_min ? `$${job.salary_min.toLocaleString()}` : ''}
            {job.salary_min && job.salary_max ? ' - ' : ''}
            {job.salary_max ? `$${job.salary_max.toLocaleString()}` : ''}
          </span>
        )}
        {daysAgo !== null && (
          <span className="flex items-center gap-1.5 bg-gray-100 rounded-full px-3 py-1">
            <CalendarDays className="h-3.5 w-3.5" />
            {daysAgo === 0 ? 'Today' : `${daysAgo} days ago`}
          </span>
        )}
        {job.contract_type && (
          <span className="flex items-center gap-1.5 bg-gray-100 rounded-full px-3 py-1 capitalize">
            <Briefcase className="h-3.5 w-3.5" /> {job.contract_type}
          </span>
        )}
      </div>

      <div className="border-t border-gray-200 pt-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Job Description</h3>
        <div
          className="prose prose-sm max-w-none text-gray-600"
          dangerouslySetInnerHTML={{ __html: job.description }}
        />
      </div>

      <div className="flex gap-3 pt-2">
        <Button onClick={onPrepare} disabled={preparing}>
          {preparing ? (
            <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Preparing...</>
          ) : (
            'Prepare Application'
          )}
        </Button>
        <Button
          variant={applied ? 'secondary' : 'primary'}
          onClick={onApply}
          disabled={applied}
        >
          {applied ? 'Applied' : (
            <><ExternalLink className="h-4 w-4 mr-1.5" /> Apply Now</>
          )}
        </Button>
      </div>
    </div>
  )
}
