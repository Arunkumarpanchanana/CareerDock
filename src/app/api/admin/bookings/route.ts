import { authAsAdmin } from '@/lib/admin-auth'
import { rateLimitByIp } from '@/lib/rate-limit'
import { NextResponse } from 'next/server'
import { bookingUpdateSchema } from '@/lib/validation'

export async function GET(request: Request) {
  const limit = rateLimitByIp(request, 30, 60_000)
  if (limit instanceof NextResponse) return limit

  try {
    const { client, error } = await authAsAdmin(request)
    if (error) return error

    const { data, error: dbError } = await client
      .from('bookings')
      .select('*, expert_consultants(name, domain_expertise), profiles!inner(full_name, email)')
      .order('scheduled_at', { ascending: false })

    if (dbError) throw dbError
    return NextResponse.json(data)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const limit = rateLimitByIp(request, 20, 60_000)
  if (limit instanceof NextResponse) return limit

  try {
    const { client, error } = await authAsAdmin(request)
    if (error) return error

    const body = await request.json()
    const parsed = bookingUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }
    const { id, ...payload } = parsed.data

    const { data, error: dbError } = await client.from('bookings').update(payload).eq('id', id).select().single()
    if (dbError) throw dbError
    return NextResponse.json(data)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
