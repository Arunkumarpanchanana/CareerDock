import { createClient } from '@/lib/supabase/server'
import { rateLimitByIp } from '@/lib/rate-limit'
import { analyzeResume } from '@/lib/ats-score'
import type { ResumeFormData } from '@/lib/resume'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const limit = rateLimitByIp(request, 10, 60_000)
  if (limit instanceof NextResponse) return limit

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { resume, jobDescription, persona } = body as {
      resume: ResumeFormData
      jobDescription?: string
      persona?: string
    }

    if (!resume) {
      return NextResponse.json({ error: 'Resume data is required' }, { status: 400 })
    }

    const score = analyzeResume(resume, jobDescription ?? '', persona ?? 'professional')
    return NextResponse.json(score)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    console.error('ATS API error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
