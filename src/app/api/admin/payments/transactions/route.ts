import { authAsAdmin } from '@/lib/admin-auth'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { client, error } = await authAsAdmin(request)
    if (error) return error

    const { data } = await client.from('payment_transactions').select('*').order('created_at', { ascending: false }).limit(50)
    return NextResponse.json(data ?? [])
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
