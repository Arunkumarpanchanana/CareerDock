import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { analyzeSkillGap } from '@/lib/ai'
import { getAiLimit } from '@/lib/quota'
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

    const { data: profile } = await supabase
      .from('profiles')
      .select('plan_tier')
      .eq('id', user.id)
      .single()

    const planTier = (profile?.plan_tier as string) || 'free'
    const aiLimit = getAiLimit(planTier)

    const { count } = await supabase
      .from('ai_usage')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

    if ((count ?? 0) >= aiLimit) {
      return NextResponse.json(
        { error: `AI usage limit reached (${count}/${aiLimit}). ${planTier === 'free' ? 'Upgrade to Premium or Premium Pro for more.' : ''}` },
        { status: 403 }
      )
    }

    const body = await request.json()
    if (!body.resume || !body.jobDescription) {
      return NextResponse.json({ error: 'resume and jobDescription are required' }, { status: 400 })
    }

    const result = await analyzeSkillGap({
      resume: body.resume,
      jobTitle: body.jobTitle || '',
      jobDescription: body.jobDescription,
    })

    await supabase.from('ai_usage').insert({
      user_id: user.id,
      action: 'skill_gap',
    })

    return NextResponse.json(result)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    console.error('Skill gap API error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
