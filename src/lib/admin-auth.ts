import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function authAsAdmin(request: Request) {
  const adminClient = createAdminClient()
  if (adminClient) {
    const authHeader = request.headers.get('Authorization') || ''
    const token = authHeader.replace('Bearer ', '')
    if (!token) return { client: null as never, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
    const { data: { user }, error: userError } = await adminClient.auth.getUser(token)
    if (userError || !user) return { client: null as never, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
    const { data: profile } = await adminClient.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return { client: null as never, error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
    return { client: adminClient, error: null }
  }
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { client: null as never, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { client: null as never, error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  return { client: supabase, error: null }
}
