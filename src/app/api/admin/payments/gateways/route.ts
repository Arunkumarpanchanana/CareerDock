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

    const { data } = await adminClient.from('payment_configs').select('*')
    return NextResponse.json(data ?? [])
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
    const { id, gateway, api_key, api_secret, merchant_id, salt_key, is_active } = body

    if (!gateway || !['instamojo', 'phonepe'].includes(gateway)) {
      return NextResponse.json({ error: 'Invalid gateway' }, { status: 400 })
    }

    if (id) {
      const { error } = await adminClient.from('payment_configs').update({
        gateway, api_key, api_secret, merchant_id, salt_key, is_active,
        updated_at: new Date().toISOString(),
      }).eq('id', id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    } else {
      const { error } = await adminClient.from('payment_configs').insert({
        gateway, api_key, api_secret, merchant_id, salt_key, is_active,
      })
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
