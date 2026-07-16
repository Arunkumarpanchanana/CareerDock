import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Profile } from '@/types/database'

function getConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key || !url.startsWith('http')) return null
  return { url, key }
}

export async function createClient() {
  const config = getConfig()
  if (!config) throw new Error('Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local')

  const cookieStore = await cookies()

  return createServerClient(config.url, config.key, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // cookies() cannot be modified in Server Components — only in
          // Server Actions / Route Handlers / Middleware. The middleware
          // handles session refresh, so this is safe to skip.
        }
      },
    },
  })
}

export async function getSession() {
  try {
    const supabase = await createClient()
    const { data } = await supabase.auth.getSession()
    return data.session
  } catch {
    return null
  }
}

export async function getProfile(): Promise<Profile | null> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    return data as Profile | null
  } catch {
    return null
  }
}
