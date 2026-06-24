import { authAsAdmin } from '@/lib/admin-auth'
import { NextResponse } from 'next/server'

export async function PUT(request: Request) {
  try {
    const { client, error } = await authAsAdmin(request)
    if (error) return error

    const { planTier, monthlyPrice, yearlyPrice } = await request.json()
    const { error: dbError } = await client.from('plan_prices').update({
      monthly_price: monthlyPrice,
      yearly_price: yearlyPrice,
      updated_at: new Date().toISOString(),
    }).eq('plan_tier', planTier)

    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
