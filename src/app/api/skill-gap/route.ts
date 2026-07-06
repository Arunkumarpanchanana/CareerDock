import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { analyzeSkillGap } from '@/lib/ai'
import { rateLimitByIp } from '@/lib/rate-limit'

export const maxDuration = 60
export const runtime = 'nodejs'

export async function POST(request: Request) {
  const limit = rateLimitByIp(request, 10, 60_000)
  if (limit instanceof NextResponse) return limit

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    if (!body.resume || !body.jobDescription) {
      return NextResponse.json({ error: 'resume and jobDescription are required' }, { status: 400 })
    }

    const result = await analyzeSkillGap({
      resume: body.resume,
      jobTitle: body.jobTitle || '',
      jobDescription: body.jobDescription,
    })

    return NextResponse.json(result)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    console.error('Skill gap API error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
