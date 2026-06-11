import { createClient } from '@/lib/supabase/server'

export interface QuotaResult {
  allowed: boolean
  current: number
  limit: number
}

export function getPlanLimits(planTier: string): { maxResumes: number; maxJobs: number } {
  if (planTier === 'premium') {
    return { maxResumes: Infinity, maxJobs: Infinity }
  }
  return { maxResumes: 4, maxJobs: 15 }
}

export async function checkResumeQuota(userId: string): Promise<QuotaResult> {
  const supabase = await createClient()
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan_tier')
    .eq('id', userId)
    .single()

  const planTier = (profile?.plan_tier as string) || 'free'
  const { maxResumes } = getPlanLimits(planTier)

  if (maxResumes === Infinity) {
    return { allowed: true, current: 0, limit: Infinity }
  }

  const { count } = await supabase
    .from('resumes')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  const current = count || 0
  return { allowed: current < maxResumes, current, limit: maxResumes }
}

export async function checkJobQuota(userId: string): Promise<QuotaResult> {
  const supabase = await createClient()
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan_tier')
    .eq('id', userId)
    .single()

  const planTier = (profile?.plan_tier as string) || 'free'
  const { maxJobs } = getPlanLimits(planTier)

  if (maxJobs === Infinity) {
    return { allowed: true, current: 0, limit: Infinity }
  }

  const { count } = await supabase
    .from('job_applications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  const current = count || 0
  return { allowed: current < maxJobs, current, limit: maxJobs }
}
