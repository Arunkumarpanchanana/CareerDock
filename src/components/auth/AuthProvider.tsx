'use client'

import { createClient, signOutAndClear } from '@/lib/supabase/client'
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import type { Profile } from '@/types/database'
import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js'

interface AuthContext {
  user: User | null
  profile: Profile | null
  loading: boolean
  refreshProfile: () => Promise<void>
  signOut: () => Promise<void>
  getAccessToken: () => string | null
}

const AuthContext = createContext<AuthContext>({
  user: null,
  profile: null,
  loading: true,
  refreshProfile: async () => {},
  signOut: async () => {},
  getAccessToken: () => null,
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null)
  const accessTokenRef = useRef<string | null>(null)

  const getSupabase = () => {
    if (!supabaseRef.current) {
      supabaseRef.current = createClient()
    }
    return supabaseRef.current
  }

  const fetchProfile = async (userId: string) => {
    try {
      const supabase = getSupabase()
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      if (error) {
        console.error('Profile fetch error:', error)
        setProfile({ id: userId, plan_tier: 'free' } as Profile)
        return
      }
      setProfile(data as Profile | null)
    } catch (e) {
      console.error('Profile fetch exception:', e)
      setProfile({ id: userId, plan_tier: 'free' } as Profile)
    }
  }

  const withTimeout = (promise: Promise<any>, ms: number): Promise<any> =>
    new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('timeout')), ms)
      promise.then(
        (v: any) => { clearTimeout(timer); resolve(v) },
        (e: any) => { clearTimeout(timer); reject(e) },
      )
    })

  useEffect(() => {
    const supabase = getSupabase()
    let cancelled = false

    const initialize = async () => {
      try {
        const { data: { session } } = await withTimeout(supabase.auth.getSession(), 5000)
        if (session?.user) {
          accessTokenRef.current = session.access_token
          setUser(session.user)
          await withTimeout(fetchProfile(session.user.id), 5000)
        }
      } catch {
        // session fetch failed or timed out — proceed with null
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    initialize()

    // Safety: force loading to false after 8s regardless of hangs
    const safetyTimer = setTimeout(() => {
      cancelled = true
      setLoading(false)
    }, 8000)

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event: AuthChangeEvent, session: Session | null) => {
        accessTokenRef.current = session?.access_token ?? null
        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchProfile(session.user.id)
        } else {
          setProfile(null)
        }
      }
    )

    return () => {
      cancelled = true
      clearTimeout(safetyTimer)
      subscription.unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const refreshProfile = async () => {
    setLoading(true)
    if (user) await fetchProfile(user.id)
    setLoading(false)
  }

  const signOut = async () => {
    await signOutAndClear()
  }

  const getAccessToken = () => accessTokenRef.current

  return (
    <AuthContext.Provider value={{ user, profile, loading, refreshProfile, signOut, getAccessToken }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
