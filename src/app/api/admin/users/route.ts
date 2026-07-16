import { authAsAdmin } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { rateLimitByIp } from '@/lib/rate-limit'
import { NextResponse } from 'next/server'
import { adminCreateUserSchema, adminUpdatePlanSchema } from '@/lib/validation'

export async function GET(request: Request) {
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

export async function POST(request: Request) {
  const limit = rateLimitByIp(request, 10, 60_000)
  if (limit instanceof NextResponse) return limit

  const { error } = await authAsAdmin(request)
  if (error) return error

  const adminClient = createAdminClient()
  if (!adminClient) {
    return NextResponse.json({ error: 'Service role key not configured' }, { status: 500 })
  }

  try {

    const body = await request.json()
    const parsed = adminCreateUserSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }
    const { email, password, full_name, role } = parsed.data

    const { data: authUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name },
    })

    if (createError) throw createError
    if (!authUser.user) throw new Error('User creation returned no user')

    if (role === 'admin') {
      const { error: updateError } = await adminClient
        .from('profiles')
        .update({ role: 'admin', full_name })
        .eq('id', authUser.user.id)
      if (updateError) throw updateError
    }

    return NextResponse.json({ success: true, id: authUser.user.id })
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
    const parsed = adminUpdatePlanSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }
    const { id, plan_tier } = parsed.data

    const { error: dbError } = await client.from('profiles').update({ plan_tier }).eq('id', id)
    if (dbError) throw dbError
    return NextResponse.json({ success: true })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
