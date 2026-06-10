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

  // Clear all Supabase cookies from the browser
  const cookies = document.cookie.split('; ')
  for (const cookie of cookies) {
    const name = cookie.split('=')[0]
    if (name.includes('sb-') || name.includes('supabase')) {
      document.cookie = `${name}=; max-age=0; path=/; domain=${window.location.hostname}`
      document.cookie = `${name}=; max-age=0; path=/`
    }
  }

  // Hit the server to clear cookies server-side as well
  try {
    await fetch('/api/auth/signout', { method: 'POST', credentials: 'include' })
  } catch (e) {
    console.error('signOut server error:', e)
  }

  window.location.href = '/auth/login'
}
