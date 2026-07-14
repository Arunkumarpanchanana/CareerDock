import { createClient } from '@/lib/supabase/server'
import ProfileForm from './ProfileForm'
import type { Profile } from '@/types/database'

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  let initialProfile: Profile | null = null
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      initialProfile = data as Profile | null
    }
  } catch (e) {
    console.error('[ProfilePage] server fetch failed:', e)
  }

  return <ProfileForm initialProfile={initialProfile} />
}
