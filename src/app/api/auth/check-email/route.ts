import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const adminClient = createAdminClient()
    if (!adminClient) return NextResponse.json({ error: 'Server not configured' }, { status: 500 })

    const { data } = await adminClient.auth.admin.listUsers()
    const existing = data?.users?.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    )

    return NextResponse.json({ exists: !!existing })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
