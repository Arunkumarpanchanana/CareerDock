import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const paymentId = formData.get('payment_id') as string
    const orderId = formData.get('payment_request_id') as string
    const status = formData.get('status') as string

    if (!paymentId || !orderId || status !== 'Credit') {
      return NextResponse.json({ error: 'Invalid webhook' }, { status: 400 })
    }

    const supabase = createAdminClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Server config error' }, { status: 500 })
    }

    // Idempotency: check if this payment_id was already processed
    const { data: existing } = await supabase
      .from('payment_transactions')
      .select('id')
      .eq('gateway_payment_id', paymentId)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ success: true })
    }

    const { data: tx } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('gateway_order_id', orderId)
      .single()

    if (!tx || tx.status !== 'pending') {
      return NextResponse.json({ success: true })
    }

    await supabase
      .from('payment_transactions')
      .update({
        gateway_payment_id: paymentId,
        status: 'completed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', tx.id)

    await supabase
      .from('profiles')
      .update({ plan_tier: tx.plan_tier })
      .eq('id', tx.user_id)

    if (tx.coupon_code) {
      await supabase.rpc('increment_coupon_usage', { coupon_code: tx.coupon_code })
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('Instamojo webhook error:', e)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
