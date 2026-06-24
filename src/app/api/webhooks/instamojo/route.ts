import { createClient } from '@/lib/supabase/server'
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

    const supabase = await createClient()

    const { data: tx } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('gateway_order_id', orderId)
      .single()

    if (!tx) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    if (tx.status !== 'pending') {
      return NextResponse.json({ error: 'Already processed' }, { status: 200 })
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
