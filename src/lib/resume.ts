'use client'

import type { Resume, Experience, Education, Project, Certificate } from '@/types/database'

export type ResumeFormData = {
  title: string
  summary: string
  experience: Experience[]
  education: Education[]
  projects: Project[]
  skills: string[]
  certificates: Certificate[]
}

export function resumeToFormData(resume: Resume | null): ResumeFormData {
  return {
    title: resume?.title ?? 'My Resume',
    summary: resume?.summary ?? '',
    experience: (resume?.experience as unknown as Experience[]) ?? [],
    education: (resume?.education as unknown as Education[]) ?? [],
    projects: (resume?.projects as unknown as Project[]) ?? [],
    skills: resume?.skills ?? [],
    certificates: (resume?.certificates as unknown as Certificate[]) ?? [],
  }
}
