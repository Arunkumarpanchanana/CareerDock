import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const supabase = await createClient()
    await supabase.auth.signOut()
  } catch (e) {
    console.error('Server signout error:', e)
  }

  const response = NextResponse.json({ success: true })
  // Clear all possible auth cookie names
  const cookiesToClear = ['sb-xrqombtevssqznnkohzy-auth-token', 'supabase-auth-token']
  for (const name of cookiesToClear) {
    response.cookies.set(name, '', { maxAge: 0, path: '/' })
  }
  return response
}
