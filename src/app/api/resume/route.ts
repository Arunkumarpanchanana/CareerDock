import { createClient } from '@/lib/supabase/server'
import { rateLimitByIp } from '@/lib/rate-limit'
import { NextResponse } from 'next/server'
import { resumeSchema } from '@/lib/validation'

export async function POST(request: Request) {
  const limit = rateLimitByIp(request, 20, 60_000)
  if (limit instanceof NextResponse) return limit

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { count } = await supabase
      .from('resumes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    const { data, error } = await supabase
      .from('resumes')
      .insert({ user_id: user.id, title: `My Resume ${(count ?? 0) + 1}` })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    console.error('Resume API create error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

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
    const parsed = resumeSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }
    const { id, ...payload } = parsed.data
    const { data, error } = await supabase
      .from('resumes')
      .update(payload)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    console.error('Resume API update error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const limit = rateLimitByIp(request, 20, 60_000)
  if (limit instanceof NextResponse) return limit

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'Missing resume id' }, { status: 400 })
    }

    const { error } = await supabase
      .from('resumes')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    console.error('Resume API delete error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
