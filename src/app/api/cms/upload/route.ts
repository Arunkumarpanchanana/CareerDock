import { authAsAdmin } from '@/lib/admin-auth'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { client, error: authError } = await authAsAdmin(request)
  if (authError) return authError

  const formData = await request.formData()
  const file = formData.get('image') as File
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  const ext = file.name.split('.').pop()
  const fileName = `${crypto.randomUUID()}.${ext}`
  const { error } = await client.storage.from('article-images').upload(fileName, file)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: { publicUrl } } = client.storage.from('article-images').getPublicUrl(fileName)
  return NextResponse.json({ url: publicUrl })
}
