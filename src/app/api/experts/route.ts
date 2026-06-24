import { createClient } from '@/lib/supabase/server'
import { rateLimitByIp } from '@/lib/rate-limit'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const limit = rateLimitByIp(request, 30, 60_000)
  if (limit instanceof NextResponse) return limit

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
    if (planTier !== 'premium_pro') {
      return NextResponse.json(
        { error: 'Expert Consultants is a Premium Pro feature. Upgrade to access.' },
        { status: 403 }
      )
    }

    const { data, error } = await supabase
      .from('expert_consultants')
      .select('*')
      .eq('is_active', true)
      .order('name')

    if (error) throw error
    return NextResponse.json(data)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
