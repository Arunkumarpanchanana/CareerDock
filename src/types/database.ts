export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'updated_at'>
        Update: Partial<Omit<Profile, 'id'>>
        Relationships: []
      }
      resumes: {
        Row: Resume
        Insert: Omit<Resume, 'id' | 'created_at'>
        Update: Partial<Omit<Resume, 'id' | 'user_id'>>
        Relationships: []
      }
      job_applications: {
        Row: JobApplication
        Insert: Omit<JobApplication, 'id' | 'updated_at'>
        Update: Partial<Omit<JobApplication, 'id' | 'user_id'>>
        Relationships: []
      }
      expert_consultants: {
        Row: ExpertConsultant
        Insert: Omit<ExpertConsultant, 'id'>
        Update: Partial<Omit<ExpertConsultant, 'id'>>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

export interface Profile {
  id: string
  full_name: string
  role_title: string | null
  location: string | null
  email: string | null
  phone: string | null
  linkedin: string | null
  website: string | null
  updated_at: string
}

export interface Resume {
  id: string
  user_id: string
  title: string
  summary: string | null
  experience: Json
  education: Json
  projects: Json
  certificates: Json
  skills: string[]
  created_at: string
}

export interface Experience {
  company: string
  role: string
  start_date: string
  end_date: string | null
  bullets: string[]
}

export interface Education {
  institution: string
  degree: string
  field: string
  year: string
}

export interface Project {
  name: string
  description: string
  tech_stack: string
  url: string
}

export interface Certificate {
  name: string
  issuer: string
  date: string
  url: string
}

export interface JobApplication {
  id: string
  user_id: string
  company_name: string
  job_title: string
  salary_range: string | null
  job_url: string | null
  status: 'Wishlist' | 'Applied' | 'Interviewing' | 'Offered' | 'Rejected'
  notes: string | null
  applied_date: string
  updated_at: string
}

export interface ExpertConsultant {
  id: string
  name: string
  domain_expertise: string
  bio: string | null
  scheduling_url: string
  is_active: boolean
}
