import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  const { email } = await request.json()
  if (!email || typeof email !== 'string') {
    return Response.json({ error: 'Email required' }, { status: 400 })
  }

  const adminClient = createAdminClient()
  if (!adminClient) {
    return Response.json({ error: 'Service role key not configured' }, { status: 500 })
  }

  const { data: users } = await adminClient.auth.admin.listUsers()
  const existing = users?.users.find(u => u.email === email)

  let userId: string

  if (existing) {
    userId = existing.id
  } else {
    const { data, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password: 'Admin@123',
      email_confirm: true,
    })
    if (createError) {
      return Response.json({ error: createError.message }, { status: 500 })
    }
    userId = data.user.id
  }

  const { error: upsertError } = await adminClient
    .from('profiles')
    .upsert({ id: userId, full_name: 'Admin', role: 'admin' }, { onConflict: 'id' })

  if (upsertError) {
    return Response.json({ error: upsertError.message }, { status: 500 })
  }

  return Response.json({
    success: true,
    email,
    created: !existing,
    password: existing ? undefined : 'Admin@123',
  })
}
