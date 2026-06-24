import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ premium: false, planTier: 'free' }, { status: 401 })
    }

    const { data } = await supabase
      .from('profiles')
      .select('plan_tier')
      .eq('id', user.id)
      .single()

    const planTier = data?.plan_tier || 'free'
    const premium = planTier === 'premium' || planTier === 'premium_pro'
    return NextResponse.json({ premium, planTier })
  } catch {
    return NextResponse.json({ premium: false, planTier: 'free' })
  }
}
