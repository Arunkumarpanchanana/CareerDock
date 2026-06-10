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

  // Clear Supabase-related keys from localStorage
  try {
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && (key.includes('sb-') || key.includes('supabase'))) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k))
  } catch (e) {
    console.error('localStorage clear error:', e)
  }

  // Clear all sb-* cookies at every path and domain level
  const hostname = window.location.hostname
  const domains = [hostname, '.' + hostname]
  const paths = ['/', '/auth']

  document.cookie.split('; ').forEach((cookie) => {
    const name = cookie.split('=')[0]
    if (name.includes('sb-') || name.includes('supabase')) {
      domains.forEach((d) => paths.forEach((p) => {
        document.cookie = `${name}=; max-age=0; path=${p}; domain=${d}`
      }))
      document.cookie = `${name}=; max-age=0; path=/`
    }
  })

  window.location.assign('/auth/login')
}
