'use client'

import { JobSearchBar } from '@/components/jobs/JobSearchBar'
import { JobCard } from '@/components/jobs/JobCard'
import { JobDetailPanel } from '@/components/jobs/JobDetailPanel'
import { ApplicationPrep } from '@/components/jobs/ApplicationPrep'
import type { JobListing } from '@/types/database'
import { ChevronLeft, ChevronRight, Briefcase } from 'lucide-react'
import { useCallback, useState } from 'react'

interface SearchResult {
  results: JobListing[]
  total: number
  page: number
}

export default function JobSearchPage() {
  const [keyword, setKeyword] = useState('')
  const [location, setLocation] = useState('')
  const [loading, setLoading] = useState(false)
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null)
  const [selectedJob, setSelectedJob] = useState<JobListing | null>(null)
  const [preparing, setPreparing] = useState(false)
  const [prepData, setPrepData] = useState<Record<string, unknown> | null>(null)
  const [appliedJobs, setAppliedJobs] = useState<Set<string>>(new Set())
  const [error, setError] = useState('')

  const handleSearch = useCallback(async (page = 1) => {
    if (!keyword.trim()) return
    setLoading(true)
    setError('')
    setPrepData(null)
    try {
      const res = await fetch('/api/jobs/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword, location: location || undefined, page }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Search failed')
      }
      const data = await res.json()
      setSearchResult(data)
      setSelectedJob(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Search failed')
    } finally {
      setLoading(false)
    }
  }, [keyword, location])

  const handlePrepare = async () => {
    if (!selectedJob) return
    setPreparing(true)
    setPrepData(null)
    try {
      const res = await fetch('/api/resume')
      const resumes = await res.json()
      const primaryResume = Array.isArray(resumes) ? resumes[0] : null
      if (!primaryResume) {
        setError('No resume found. Create one in Resume Builder first.')
        return
      }

      const prepRes = await fetch('/api/jobs/prepare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_title: selectedJob.title,
          company: selectedJob.company,
          description: selectedJob.description,
          resume_id: primaryResume.id,
        }),
      })
      if (!prepRes.ok) throw new Error('Preparation failed')
      const data = await prepRes.json()
      setPrepData(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Preparation failed')
    } finally {
      setPreparing(false)
    }
  }

  const handleApply = async () => {
    if (!selectedJob) return
    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: selectedJob.company,
          job_title: selectedJob.title,
          job_url: selectedJob.redirect_url,
          salary_range: selectedJob.salary_min && selectedJob.salary_max
            ? `$${selectedJob.salary_min.toLocaleString()} - $${selectedJob.salary_max.toLocaleString()}`
            : null,
          status: 'Applied',
          source: 'adzuna',
          adzuna_id: selectedJob.adzuna_id,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(err.error || 'Failed to save')
      }
      setAppliedJobs((prev) => new Set(prev).add(selectedJob.adzuna_id))
      window.location.href = selectedJob.redirect_url
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Apply failed')
    }
  }

  const totalPages = searchResult ? Math.ceil(searchResult.total / 20) : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Job Search</h1>
        <p className="mt-1 text-sm text-gray-600">
          Discover jobs and prepare tailored applications with AI assistance
        </p>
      </div>

      <JobSearchBar
        keyword={keyword}
        location={location}
        onKeywordChange={setKeyword}
        onLocationChange={setLocation}
        onSearch={() => handleSearch(1)}
        loading={loading}
      />

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
        </div>
      )}

      {searchResult && !loading && (
        <div className="flex gap-6">
          <div className="w-1/2 space-y-3">
            <p className="text-sm text-gray-500">
              {searchResult.total.toLocaleString()} jobs found
            </p>
            <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-2">
              {searchResult.results.map((job) => (
                <JobCard
                  key={job.adzuna_id}
                  job={job}
                  selected={selectedJob?.adzuna_id === job.adzuna_id}
                  onClick={() => { setSelectedJob(job); setPrepData(null) }}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  onClick={() => handleSearch(searchResult.page - 1)}
                  disabled={searchResult.page <= 1}
                  className="rounded-lg border border-gray-300 p-2 hover:bg-gray-50 disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-sm text-gray-600">
                  Page {searchResult.page} of {totalPages}
                </span>
                <button
                  onClick={() => handleSearch(searchResult.page + 1)}
                  disabled={searchResult.page >= totalPages}
                  className="rounded-lg border border-gray-300 p-2 hover:bg-gray-50 disabled:opacity-50"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          <div className="w-1/2">
            {selectedJob ? (
              <div className="sticky top-6 space-y-6">
                <JobDetailPanel
                  job={selectedJob}
                  onPrepare={handlePrepare}
                  onApply={handleApply}
                  preparing={preparing}
                  applied={appliedJobs.has(selectedJob.adzuna_id)}
                />
                {prepData && (
                  <ApplicationPrep
                    data={prepData as {
                      matchScore: number
                      verdict: string
                      verdict_explanation: string
                      strengths: string[]
                      gaps: string[]
                      missingKeywords: string[]
                      suggestions: string[]
                      coverLetter: string
                    }}
                  />
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <Briefcase className="h-12 w-12 mb-3" />
                <p className="text-sm">Select a job to view details</p>
              </div>
            )}
          </div>
        </div>
      )}

      {!searchResult && !loading && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Briefcase className="h-16 w-16 mb-4" />
          <p className="text-lg font-medium">Search for jobs to get started</p>
          <p className="text-sm mt-1">Enter a keyword and location above</p>
        </div>
      )}
    </div>
  )
}
