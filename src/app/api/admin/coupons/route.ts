import { authAsAdmin } from '@/lib/admin-auth'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { client, error } = await authAsAdmin(request)
    if (error) return error

    const { data } = await client.from('coupons').select('*').order('created_at', { ascending: false })
    return NextResponse.json(data ?? [])
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { client, error } = await authAsAdmin(request)
    if (error) return error

    const body = await request.json()
    const { code, discount_type, discount_value, max_uses, plan_tier, expires_at, is_active } = body

    if (!code || !discount_type || !discount_value) {
      return NextResponse.json({ error: 'Code, discount type, and value are required' }, { status: 400 })
    }

    const { data, error: dbError } = await client.from('coupons').insert({
      code: String(code).toUpperCase(),
      discount_type,
      discount_value: Number(discount_value),
      max_uses: max_uses ? Number(max_uses) : null,
      plan_tier: plan_tier || null,
      expires_at: expires_at || null,
      is_active: is_active !== false,
    }).select().single()

    if (dbError) {
      if (dbError.code === '23505') {
        return NextResponse.json({ error: 'Coupon code already exists' }, { status: 409 })
      }
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const { client, error } = await authAsAdmin(request)
    if (error) return error

    const body = await request.json()
    const { id, code, discount_type, discount_value, max_uses, plan_tier, expires_at, is_active } = body

    if (!id) {
      return NextResponse.json({ error: 'Coupon ID is required' }, { status: 400 })
    }

    const { error: dbError } = await client.from('coupons').update({
      code: code ? String(code).toUpperCase() : undefined,
      discount_type,
      discount_value: discount_value ? Number(discount_value) : undefined,
      max_uses: max_uses !== undefined ? (max_uses ? Number(max_uses) : null) : undefined,
      plan_tier: plan_tier !== undefined ? (plan_tier || null) : undefined,
      expires_at: expires_at !== undefined ? (expires_at || null) : undefined,
      is_active: is_active !== undefined ? is_active : undefined,
    }).eq('id', id)

    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
