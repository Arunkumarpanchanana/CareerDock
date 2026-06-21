'use client'

import { Button, Card, PremiumGate } from '@/components/ui'
import { CardSkeleton } from '@/components/ui/CardSkeleton'
import type { ExpertConsultant } from '@/types/database'
import { Calendar, ExternalLink, GraduationCap } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function ExpertsPage() {
  const [experts, setExperts] = useState<ExpertConsultant[]>([])
  const [loading, setLoading] = useState(true)
  const [error] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    setLoading(true)
    fetch('/api/experts')
      .then((res) => res.json())
      .then((data) => setExperts(data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <PremiumGate feature="Expert Consultants">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expert Consultants</h1>
          <p className="mt-1 text-gray-600">
            Book 1:1 sessions with industry experts for resume reviews, interview prep, and career guidance.
          </p>
        </div>

        {loading ? (
          <CardSkeleton count={3} />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {experts.map((expert) => (
            <Card key={expert.id} className="p-6 flex flex-col">
              <div className="flex items-start gap-4 mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-lg font-bold text-blue-700 flex-shrink-0">
                  {expert.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-900">{expert.name}</h3>
                  <div className="flex items-center gap-1 text-xs text-blue-600 mt-0.5">
                    <GraduationCap className="h-3 w-3" />
                    <span>{expert.domain_expertise}</span>
                  </div>
                </div>
              </div>

              {expert.bio && (
                <p className="text-sm text-gray-600 leading-relaxed mb-4 flex-1">
                  {expert.bio}
                </p>
              )}

              <a
                href={expert.scheduling_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-auto"
              >
                <Button className="w-full">
                  <Calendar className="h-4 w-4 mr-1.5" />
                  Book a Session
                  <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
                </Button>
              </a>
            </Card>
          ))}
        </div>
        )}

        {error && (
          <div className="text-center py-8">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {!error && experts.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <GraduationCap className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No experts available yet</p>
            <p className="text-sm mt-1">Check back soon for new consultants.</p>
          </div>
        )}
      </div>
    </PremiumGate>
  )
}
