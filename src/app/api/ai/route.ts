import { createClient } from '@/lib/supabase/server'
import { rateLimitByIp } from '@/lib/rate-limit'
import { generateBullets, generateSummary, rewriteText } from '@/lib/ai'
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

    // Check AI quota
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan_tier')
      .eq('id', user.id)
      .single()

    const planTier = (profile?.plan_tier as string) || 'free'
    const aiLimit = planTier === 'premium' ? 100 : 10

    const { count } = await supabase
      .from('ai_usage')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

    if ((count ?? 0) >= aiLimit) {
      return NextResponse.json(
        { error: `AI usage limit reached (${count}/${aiLimit}). ${planTier === 'free' ? 'Upgrade to premium for more.' : ''}` },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { action, data } = body as { action: string; data: Record<string, unknown> }

    let result: string | string[]

    switch (action) {
      case 'bullets': {
        result = await generateBullets(
          (data.role as string) ?? '',
          (data.context as string) ?? ''
        )
        break
      }
      case 'summary': {
        result = await generateSummary(
          (data.experience as string[]) ?? [],
          (data.targetRole as string) ?? ''
        )
        break
      }
      case 'rewrite': {
        result = await rewriteText((data.text as string) ?? '')
        break
      }
      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }

    // Log usage
    await supabase.from('ai_usage').insert({
      user_id: user.id,
      action,
    })

    return NextResponse.json({ result })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    console.error('AI API error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
