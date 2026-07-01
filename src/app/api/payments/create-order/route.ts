import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { planTier, billing, couponCode } = await request.json()

    if (!['premium', 'premium_pro'].includes(planTier)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }
    if (!['monthly', 'yearly'].includes(billing)) {
      return NextResponse.json({ error: 'Invalid billing period' }, { status: 400 })
    }

    const { data: priceRow } = await supabase
      .from('plan_prices')
      .select('*')
      .eq('plan_tier', planTier)
      .single()

    if (!priceRow) {
      return NextResponse.json({ error: 'Plan pricing not found' }, { status: 500 })
    }

    const originalAmount = billing === 'monthly' ? priceRow.monthly_price : priceRow.yearly_price
    let finalAmount = originalAmount
    let appliedCoupon = null
    let discountAmount = 0

    if (couponCode) {
      const validateRes = await fetch(new URL('/api/coupons/validate', request.url), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode, planTier, amount: originalAmount }),
      })
      const validateData = await validateRes.json()
      if (validateData.valid) {
        finalAmount = validateData.finalAmount
        discountAmount = validateData.discountAmount
        appliedCoupon = couponCode.toUpperCase()
      }
    }

    // Get active gateway
    const { data: gateway } = await supabase
      .from('payment_configs')
      .select('*')
      .eq('is_active', true)
      .limit(1)
      .single()

    if (!gateway) {
      return NextResponse.json({ error: 'No payment gateway configured' }, { status: 503 })
    }

    // Create order in Instamojo
    const gatewayRes = await fetch('https://www.instamojo.com/api/1.1/payment-requests/', {
      method: 'POST',
      headers: {
        'X-Api-Key': gateway.api_key,
        'X-Auth-Token': gateway.api_secret,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        amount: String(finalAmount),
        purpose: `My Career Dock ${planTier} - ${billing}`,
        buyer_name: user.email ?? 'User',
        email: user.email ?? '',
        redirect_url: `${new URL(request.url).origin}/payments/callback?plan=${planTier}`,
        webhook: `${new URL(request.url).origin}/api/webhooks/instamojo`,
      }),
    })

    const gatewayData = await gatewayRes.json()

    if (!gatewayRes.ok) {
      return NextResponse.json(
        { error: 'Failed to create payment order. Please try again.' },
        { status: 502 }
      )
    }

    const paymentRequest = gatewayData.payment_request
    const orderId = paymentRequest.id

    // Log transaction
    await supabase.from('payment_transactions').insert({
      user_id: user.id,
      plan_tier: planTier,
      billing,
      original_amount: originalAmount,
      discount_amount: discountAmount,
      final_amount: finalAmount,
      coupon_code: appliedCoupon,
      gateway: gateway.gateway,
      gateway_order_id: orderId,
      status: 'pending',
    })

    return NextResponse.json({
      checkoutUrl: paymentRequest.longurl,
      orderId,
      finalAmount,
      originalAmount,
      discountAmount,
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    console.error('Create order error:', message)
    return NextResponse.json({ error: 'Payment processing error' }, { status: 500 })
  }
}
