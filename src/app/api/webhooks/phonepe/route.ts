import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import crypto from 'crypto'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const checksum = request.headers.get('X-VERIFY') || ''
    const transactionId = body.transactionId
    const orderId = body.merchantOrderId
    const state = body.state

    if (!transactionId || !orderId || state !== 'COMPLETED') {
      return NextResponse.json({ error: 'Invalid webhook' }, { status: 400 })
    }

    const supabase = createAdminClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Server config error' }, { status: 500 })
    }

    // Idempotency: check if this transactionId was already processed
    const { data: existing } = await supabase
      .from('payment_transactions')
      .select('id')
      .eq('gateway_payment_id', transactionId)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ success: true })
    }

    const { data: config } = await supabase
      .from('payment_configs')
      .select('*')
      .eq('gateway', 'phonepe')
      .eq('is_active', true)
      .single()

    if (config) {
      const expectedChecksum = crypto
        .createHash('sha256')
        .update(JSON.stringify(body) + config.salt_key)
        .digest('hex')
      if (checksum !== expectedChecksum) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
      }
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
        gateway_payment_id: transactionId,
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
    console.error('PhonePe webhook error:', e)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
