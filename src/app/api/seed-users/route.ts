import { createAdminClient } from '@/lib/supabase/admin'

const USERS = [
  { email: 'test-free@mycareerdock.com', password: 'Test@123', tier: 'free' },
  { email: 'test-premium@mycareerdock.com', password: 'Test@123', tier: 'premium' },
  { email: 'test-pro@mycareerdock.com', password: 'Test@123', tier: 'premium_pro' },
]

export async function POST() {
  const adminClient = createAdminClient()
  if (!adminClient) {
    return Response.json({ error: 'Service role key not configured' }, { status: 500 })
  }

  const results: { email: string; created: boolean; tier: string }[] = []

  for (const u of USERS) {
    const { data: existing } = await adminClient.auth.admin.listUsers()
    const found = existing?.users.find(x => x.email === u.email)

    let userId: string
    if (found) {
      userId = found.id
    } else {
      const { data, error } = await adminClient.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
      })
      if (error) {
        results.push({ email: u.email, created: false, tier: u.tier })
        continue
      }
      userId = data.user.id
    }

    await adminClient.from('profiles').upsert(
      { id: userId, full_name: `Test ${u.tier}`, role: 'user', plan_tier: u.tier },
      { onConflict: 'id' }
    )

    results.push({ email: u.email, created: !found, tier: u.tier })
  }

  return Response.json({ success: true, users: results })
}
