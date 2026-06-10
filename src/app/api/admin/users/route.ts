import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const adminClient = createAdminClient()
    if (!adminClient) {
      return NextResponse.json({ error: 'Admin client not configured. Add SUPABASE_SERVICE_ROLE_KEY to .env.local' }, { status: 500 })
    }

    const { email, password, full_name, role } = await request.json()
    if (!email || !password || !full_name) {
      return NextResponse.json({ error: 'email, password, and full_name are required' }, { status: 400 })
    }

    const { data: authUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name },
    })

    if (createError) throw createError
    if (!authUser.user) throw new Error('User creation returned no user')

    if (role === 'admin') {
      const { error: updateError } = await supabase
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
