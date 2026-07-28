import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let supabase
  try {
    supabase = await createClient()
  } catch (e) {
    console.error('AdminLayout: failed to create Supabase client', e)
    redirect('/auth/login')
  }

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    console.error('AdminLayout: no user session', userError)
    redirect('/auth/login')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError) {
    console.error('AdminLayout: profile fetch error', profileError)
    redirect('/auth/login')
  }

  if (profile?.role !== 'admin') {
    redirect('/dashboard')
  }

  return <>{children}</>
}
