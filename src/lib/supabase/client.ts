'use client'

import { createBrowserClient } from '@supabase/ssr'

let client: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  if (typeof window === 'undefined') {
    throw new Error('createClient() should only be called on the client')
  }
  if (!client) {
    client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return client
}

export async function signOutAndClear() {
  try {
    const supabase = createClient()
    await supabase.auth.signOut()
  } catch (e) {
    console.error('signOut client error:', e)
  }

  // Force redirect to login — clears browser state entirely
  window.location.assign('/auth/login')
}
