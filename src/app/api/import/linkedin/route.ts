import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { parseLinkedInText } from '@/lib/linkedin-import'
import { rateLimitByIp } from '@/lib/rate-limit'

export async function POST(request: Request) {
  const limit = rateLimitByIp(request, 10, 60_000)
  if (limit instanceof NextResponse) return limit

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    if (!body.text || typeof body.text !== 'string') {
      return NextResponse.json({ error: 'text field is required' }, { status: 400 })
    }

    const result = parseLinkedInText(body.text)

    return NextResponse.json(result)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    console.error('Import API error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
