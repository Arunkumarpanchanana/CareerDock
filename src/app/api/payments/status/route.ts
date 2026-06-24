import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')
    if (!orderId) {
      return NextResponse.json({ error: 'Missing orderId' }, { status: 400 })
    }

    const { data } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('gateway_order_id', orderId)
      .eq('user_id', user.id)
      .single()

    if (!data) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    return NextResponse.json({
      status: data.status,
      planTier: data.plan_tier,
      amount: data.final_amount,
    })
  } catch {
    return NextResponse.json({ error: 'Failed to check status' }, { status: 500 })
  }
}
