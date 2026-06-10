import { createClient } from '@/lib/supabase/server'
import type { Resume } from '@/types/database'

export async function getResume(): Promise<Resume | null> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data } = await supabase
      .from('resumes')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    return data as Resume | null
  } catch {
    return null
  }
}
