import { authAsAdmin } from '@/lib/admin-auth'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { client, error: authError } = await authAsAdmin(request)
  if (authError) return authError

  const { data } = await client.from('articles').select('*').order('created_at', { ascending: false })
  return NextResponse.json(data || [])
}

export async function POST(request: Request) {
  const { client, user, error: authError } = await authAsAdmin(request)
  if (authError) return authError

  const body = await request.json()
  const { data, error } = await client.from('articles').insert({ ...body, author_id: user.id }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

export async function PUT(request: Request) {
  const { client, error: authError } = await authAsAdmin(request)
  if (authError) return authError

  const { id, ...updates } = await request.json()
  const { data, error } = await client.from('articles').update(updates).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

export async function DELETE(request: Request) {
  const { client, error: authError } = await authAsAdmin(request)
  if (authError) return authError

  const { id } = await request.json()
  const { error } = await client.from('articles').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}
