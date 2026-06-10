import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const supabase = await createClient()
    await supabase.auth.signOut()
  } catch (e) {
    console.error('Server signout error:', e)
  }

  return NextResponse.json({ success: true })
}
