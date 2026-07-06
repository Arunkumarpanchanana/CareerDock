import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { handleInterviewTurn, handleFeedback } from '@/lib/interview'

export const maxDuration = 60
export const runtime = 'nodejs'

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
        { error: 'Mock Interview is available on Premium and Premium Pro plans. Upgrade to access.' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { phase, resume, jobDescription, history } = body

    if (!resume?.trim() || !jobDescription?.trim() || !Array.isArray(history)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (phase === 'interview') {
      const result = await handleInterviewTurn({ resume, jobDescription, history })
      return NextResponse.json(result)
    }

    if (phase === 'feedback') {
      const result = await handleFeedback({ resume, jobDescription, history })
      if (!result) {
        return NextResponse.json({ error: 'Feedback generation failed' }, { status: 500 })
      }
      return NextResponse.json(result)
    }

    return NextResponse.json({ error: 'Invalid phase' }, { status: 400 })
  } catch (e) {
    console.error('Interview API error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
