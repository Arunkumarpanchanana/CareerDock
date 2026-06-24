import { authAsAdmin } from '@/lib/admin-auth'
import { rateLimitByIp } from '@/lib/rate-limit'
import { NextResponse } from 'next/server'
import { adminRoleUpdateSchema } from '@/lib/validation'

export async function GET(request: Request) {
  const limit = rateLimitByIp(request, 30, 60_000)
  if (limit instanceof NextResponse) return limit

  try {
    const { client, error } = await authAsAdmin(request)
    if (error) return error

    const { data, error: dbError } = await client.from('profiles').select('*').order('full_name')
    if (dbError) throw dbError
    return NextResponse.json(data)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const limit = rateLimitByIp(request, 10, 60_000)
  if (limit instanceof NextResponse) return limit

  try {
    const { client, error } = await authAsAdmin(request)
    if (error) return error

    const body = await request.json()
    const parsed = adminRoleUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }
    const { id, role } = parsed.data

    const { error: dbError } = await client.from('profiles').update({ role }).eq('id', id)
    if (dbError) throw dbError
    return NextResponse.json({ success: true })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
