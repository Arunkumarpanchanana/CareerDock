import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateCoverLetter } from '@/lib/ai'
import { rateLimitByIp } from '@/lib/rate-limit'

export async function GET(request: Request) {
  const limit = rateLimitByIp(request, 20, 60_000)
  if (limit instanceof NextResponse) return limit

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data, error } = await supabase
      .from('cover_letters')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    console.error('Cover letter GET error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const limit = rateLimitByIp(request, 10, 60_000)
  if (limit instanceof NextResponse) return limit

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    if (!body.jobTitle || !body.company) {
      return NextResponse.json({ error: 'jobTitle and company are required' }, { status: 400 })
    }

    const content = await generateCoverLetter({
      resume: body.resume || '',
      jobTitle: body.jobTitle,
      company: body.company,
      jobDescription: body.jobDescription || '',
    })

    const { data, error } = await supabase
      .from('cover_letters')
      .insert({
        user_id: user.id,
        title: `Cover Letter — ${body.company}`,
        content,
        job_title: body.jobTitle,
        company: body.company,
        job_description: body.jobDescription || '',
      })
      .select('*')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ id: data.id, content: data.content })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    console.error('Cover letter POST error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const limit = rateLimitByIp(request, 20, 60_000)
  if (limit instanceof NextResponse) return limit

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    const body = await request.json()
    if (!body.content) return NextResponse.json({ error: 'content is required' }, { status: 400 })

    const { data, error } = await supabase
      .from('cover_letters')
      .update({ content: body.content, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id)
      .select('*')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    console.error('Cover letter PUT error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
