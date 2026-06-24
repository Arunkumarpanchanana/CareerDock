import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { code, planTier, amount } = await request.json()
    if (!code) {
      return NextResponse.json({ valid: false, error: 'Coupon code is required' })
    }

    const upperCode = String(code).toUpperCase()
    const { data: coupon } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', upperCode)
      .single()

    if (!coupon) {
      return NextResponse.json({ valid: false, error: 'Invalid coupon code' })
    }

    if (!coupon.is_active) {
      return NextResponse.json({ valid: false, error: 'This coupon is no longer active' })
    }

    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return NextResponse.json({ valid: false, error: 'This coupon has expired' })
    }

    if (coupon.max_uses && coupon.current_uses >= coupon.max_uses) {
      return NextResponse.json({ valid: false, error: 'This coupon has reached its usage limit' })
    }

    if (coupon.plan_tier && coupon.plan_tier !== planTier) {
      return NextResponse.json({ valid: false, error: `This coupon is only valid for ${coupon.plan_tier} plans` })
    }

    if (coupon.min_cart_amount && amount < coupon.min_cart_amount) {
      return NextResponse.json({ valid: false, error: `Minimum cart amount is ₹${coupon.min_cart_amount}` })
    }

    let discountAmount = 0
    if (coupon.discount_type === 'percentage') {
      discountAmount = Math.round(amount * (coupon.discount_value / 100))
    } else {
      discountAmount = Math.min(coupon.discount_value, amount - 1)
    }

    const finalAmount = amount - discountAmount

    return NextResponse.json({
      valid: true,
      code: upperCode,
      discountType: coupon.discount_type,
      discountValue: coupon.discount_value,
      discountAmount,
      finalAmount,
    })
  } catch {
    return NextResponse.json({ valid: false, error: 'Failed to validate coupon' }, { status: 500 })
  }
}
