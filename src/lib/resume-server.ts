import { createClient } from '@/lib/supabase/server'
import type { Resume } from '@/types/database'

export async function getResumes(): Promise<Resume[]> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data } = await supabase
      .from('resumes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    return (data as Resume[]) ?? []
  } catch {
    return []
  }
}
