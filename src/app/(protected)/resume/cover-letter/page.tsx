import { getProfile } from '@/lib/supabase/server'
import { getResumes } from '@/lib/resume-server'
import { resumeToFormData } from '@/lib/resume'
import { CoverLetterClient } from '@/components/resume/CoverLetterClient'

export const dynamic = 'force-dynamic'

export default async function CoverLetterPage() {
  const [profile, resumes] = await Promise.all([getProfile(), getResumes()])
  const latestResume = resumes[0]
  const resumeData = latestResume ? resumeToFormData(latestResume) : null

  return (
    <CoverLetterClient
      profile={profile}
      resumeData={resumeData ?? {
        title: '',
        summary: '',
        experience: [],
        education: [],
        projects: [],
        skills: [],
        certificates: [],
      }}
    />
  )
}
