import { authAsAdmin } from '@/lib/admin-auth'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { client, error } = await authAsAdmin(request)
    if (error) return error

    const { data } = await client.from('payment_configs').select('*')
    return NextResponse.json(data ?? [])
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
    const { id, gateway, api_key, api_secret, merchant_id, salt_key, is_active } = body

    if (!gateway || !['instamojo', 'phonepe'].includes(gateway)) {
      return NextResponse.json({ error: 'Invalid gateway' }, { status: 400 })
    }

    if (id) {
      const { error: dbError } = await client.from('payment_configs').update({
        gateway, api_key, api_secret, merchant_id, salt_key, is_active,
        updated_at: new Date().toISOString(),
      }).eq('id', id)
      if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
    } else {
      const { error: dbError } = await client.from('payment_configs').insert({
        gateway, api_key, api_secret, merchant_id, salt_key, is_active,
      })
      if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
