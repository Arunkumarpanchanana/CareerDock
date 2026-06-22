import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ premium: false }, { status: 401 })
    }

    const { data } = await supabase
      .from('profiles')
      .select('plan_tier')
      .eq('id', user.id)
      .single()

    return NextResponse.json({ premium: data?.plan_tier === 'premium' })
  } catch {
    return NextResponse.json({ premium: false })
  }
}
