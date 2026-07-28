import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

type AdminClient = NonNullable<ReturnType<typeof createAdminClient>>

async function verifyAdminAndGetUser(supabase: AdminClient | Awaited<ReturnType<typeof createClient>>, token?: string) {
  const { data: { user } } = token
    ? await supabase.auth.getUser(token)
    : await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return null
  return { client: supabase, user }
}

export async function authAsAdmin(request: Request) {
  const adminClient = createAdminClient()
  if (adminClient) {
    const authHeader = request.headers.get('Authorization') || ''
    const token = authHeader.replace('Bearer ', '')
    if (token) {
      const res = await verifyAdminAndGetUser(adminClient, token)
      if (res) return { client: res.client, user: res.user, error: null }
    }
  }
  const supabase = await createClient()
  const res = await verifyAdminAndGetUser(supabase)
  if (res) return { client: res.client, user: res.user, error: null }
  return { client: null as never, user: null as never, error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
}
