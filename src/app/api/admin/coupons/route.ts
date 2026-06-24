import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

async function checkAdmin(request: Request) {
  const adminClient = createAdminClient()
  if (!adminClient) return null

  const authHeader = request.headers.get('Authorization') || ''
  const token = authHeader.replace('Bearer ', '')
  if (!token) return null

  const { data: { user } } = await adminClient.auth.getUser(token)
  if (!user) return null

  const { data: profile } = await adminClient.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return null

  return adminClient
}

export async function GET(request: Request) {
  try {
    const adminClient = await checkAdmin(request)
    if (!adminClient) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { data } = await adminClient.from('coupons').select('*').order('created_at', { ascending: false })
    return NextResponse.json(data ?? [])
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const adminClient = await checkAdmin(request)
    if (!adminClient) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const { code, discount_type, discount_value, max_uses, plan_tier, expires_at, is_active } = body

    if (!code || !discount_type || !discount_value) {
      return NextResponse.json({ error: 'Code, discount type, and value are required' }, { status: 400 })
    }

    const { data, error } = await adminClient.from('coupons').insert({
      code: String(code).toUpperCase(),
      discount_type,
      discount_value: Number(discount_value),
      max_uses: max_uses ? Number(max_uses) : null,
      plan_tier: plan_tier || null,
      expires_at: expires_at || null,
      is_active: is_active !== false,
    }).select().single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Coupon code already exists' }, { status: 409 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const adminClient = await checkAdmin(request)
    if (!adminClient) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const { id, code, discount_type, discount_value, max_uses, plan_tier, expires_at, is_active } = body

    if (!id) {
      return NextResponse.json({ error: 'Coupon ID is required' }, { status: 400 })
    }

    const { error } = await adminClient.from('coupons').update({
      code: code ? String(code).toUpperCase() : undefined,
      discount_type,
      discount_value: discount_value ? Number(discount_value) : undefined,
      max_uses: max_uses !== undefined ? (max_uses ? Number(max_uses) : null) : undefined,
      plan_tier: plan_tier !== undefined ? (plan_tier || null) : undefined,
      expires_at: expires_at !== undefined ? (expires_at || null) : undefined,
      is_active: is_active !== undefined ? is_active : undefined,
    }).eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
