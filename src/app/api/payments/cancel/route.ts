import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
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

    if (!profile || profile.plan_tier === 'free') {
      return NextResponse.json({ error: 'No active plan to cancel' }, { status: 400 })
    }

    const { error } = await supabase
      .from('profiles')
      .update({ plan_tier: 'free' })
      .eq('id', user.id)

    if (error) throw error

    return NextResponse.json({ success: true, plan_tier: 'free' })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
