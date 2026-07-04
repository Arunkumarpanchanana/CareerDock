import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { handleCoachingTurn, handleCoachingSummary } from '@/lib/coach'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('plan_tier')
      .eq('id', user.id)
      .single()

    const planTier = (profile?.plan_tier as string) || 'free'
    if (planTier !== 'premium' && planTier !== 'premium_pro') {
      return NextResponse.json(
        { error: 'Career Coach is available on Premium and Premium Pro plans. Upgrade to access.' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { phase, context, history } = body

    if (phase !== 'conversation' && phase !== 'summary') {
      return NextResponse.json({ error: 'Invalid phase' }, { status: 400 })
    }

    if (typeof context !== 'string' || !Array.isArray(history)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (phase === 'conversation') {
      const result = await handleCoachingTurn({ context, history })
      return NextResponse.json(result)
    }

    if (phase === 'summary') {
      const result = await handleCoachingSummary({ context, history })
      if (!result) {
        return NextResponse.json({ error: 'Summary generation failed' }, { status: 500 })
      }
      return NextResponse.json(result)
    }

    return NextResponse.json({ error: 'Invalid phase' }, { status: 400 })
  } catch (e) {
    console.error('Career Coach API error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
