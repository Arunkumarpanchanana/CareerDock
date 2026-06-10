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

function safeJsonArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[]
  return []
}

export function resumeToFormData(resume: Resume | null): ResumeFormData {
  return {
    title: resume?.title ?? 'My Resume',
    summary: resume?.summary ?? '',
    experience: safeJsonArray<Experience>(resume?.experience),
    education: safeJsonArray<Education>(resume?.education),
    projects: safeJsonArray<Project>(resume?.projects),
    skills: resume?.skills ?? [],
    certificates: safeJsonArray<Certificate>(resume?.certificates),
  }
}
