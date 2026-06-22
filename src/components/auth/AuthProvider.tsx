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
}

const AuthContext = createContext<AuthContext>({
  user: null,
  profile: null,
  loading: true,
  refreshProfile: async () => {},
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null)

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

  useEffect(() => {
    const supabase = getSupabase()
    let cancelled = false

    const initialize = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          setUser(session.user)
          await fetchProfile(session.user.id)
        }
      } catch {
        // session fetch failed
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

  return (
    <AuthContext.Provider value={{ user, profile, loading, refreshProfile, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
