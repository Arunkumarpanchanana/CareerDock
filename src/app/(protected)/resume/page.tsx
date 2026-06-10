import { getProfile } from '@/lib/supabase/server'
import { getResumes } from '@/lib/resume-server'
import { ResumeClient } from './ResumeClient'

export default async function ResumePage() {
  const [profile, resumes] = await Promise.all([getProfile(), getResumes()])

  return <ResumeClient profile={profile} initialResumes={resumes} />
}
