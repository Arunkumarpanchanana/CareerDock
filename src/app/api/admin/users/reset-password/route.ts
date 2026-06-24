import { authAsAdmin } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { rateLimitByIp } from '@/lib/rate-limit'
import { adminResetPasswordSchema } from '@/lib/validation'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const limit = rateLimitByIp(request, 10, 60_000)
  if (limit instanceof NextResponse) return limit

  try {
    const { error } = await authAsAdmin(request)
    if (error) return error

    const body = await request.json()
    const parsed = adminResetPasswordSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }
    const { id, password } = parsed.data

    const adminClient = createAdminClient()
    if (!adminClient) return NextResponse.json({ error: 'Service role key not configured' }, { status: 500 })

    const { error: resetError } = await adminClient.auth.admin.updateUserById(id, { password })
    if (resetError) throw resetError
    return NextResponse.json({ success: true })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
