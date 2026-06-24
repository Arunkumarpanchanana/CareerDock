import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

type AdminClient = NonNullable<ReturnType<typeof createAdminClient>>

async function verifyAdminAndGetUser(supabase: AdminClient | Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return null
  return supabase
}

export async function authAsAdmin(request: Request) {
  const adminClient = createAdminClient()
  if (adminClient) {
    const authHeader = request.headers.get('Authorization') || ''
    const token = authHeader.replace('Bearer ', '')
    if (token) {
      const client = await verifyAdminAndGetUser(adminClient)
      if (client) return { client, error: null }
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return { client: null as never, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      if (profile?.role !== 'admin') return { client: null as never, error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
      return { client: supabase, error: null }
    }
  }
  const supabase = await createClient()
  const client = await verifyAdminAndGetUser(supabase)
  if (client) return { client, error: null }
  return { client: null as never, error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
}
