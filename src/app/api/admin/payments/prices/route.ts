import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function PUT(request: Request) {
  try {
    const adminClient = createAdminClient()
    if (!adminClient) return NextResponse.json({ error: 'Not configured' }, { status: 500 })

    const authHeader = request.headers.get('Authorization') || ''
    const token = authHeader.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: { user } } = await adminClient.auth.getUser(token)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await adminClient.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { planTier, monthlyPrice, yearlyPrice } = await request.json()
    const { error } = await adminClient.from('plan_prices').update({
      monthly_price: monthlyPrice,
      yearly_price: yearlyPrice,
      updated_at: new Date().toISOString(),
    }).eq('plan_tier', planTier)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
