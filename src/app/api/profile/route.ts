import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { rateLimitByIp } from '@/lib/rate-limit'
import { NextResponse } from 'next/server'
import { profileUpdateSchema } from '@/lib/validation'

export async function PUT(request: Request) {
  const limit = rateLimitByIp(request, 20, 60_000)
  if (limit instanceof NextResponse) return limit

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = profileUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    // Use admin client first (bypasses RLS — no INSERT policy on profiles)
    const adminClient = createAdminClient()
    if (adminClient) {
      const { error } = await adminClient
        .from('profiles')
        .upsert({ id: user.id, ...parsed.data })
      if (error) throw error
    } else {
      // Fallback: regular client (needs INSERT policy migration for new users)
      const { error } = await supabase
        .from('profiles')
        .upsert({ id: user.id, ...parsed.data })
      if (error) throw error
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
