import { getProfile } from '@/lib/supabase/server'
import { getResume } from '@/lib/resume-server'
import { ResumeClient } from './ResumeClient'

export default async function ResumePage() {
  const [profile, resume] = await Promise.all([getProfile(), getResume()])

  return <ResumeClient profile={profile} initialResume={resume} />
}
