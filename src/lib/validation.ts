import { z } from 'zod'

export const jobApplicationSchema = z.object({
  company_name: z.string().min(1, 'Company name is required'),
  job_title: z.string().min(1, 'Job title is required'),
  salary_range: z.string().nullable().optional(),
  job_url: z.string().url().nullable().optional().or(z.literal('')),
  notes: z.string().nullable().optional(),
  status: z.enum(['Wishlist', 'Applied', 'Interviewing', 'Offered', 'Rejected']).optional(),
})

export const jobApplicationUpdateSchema = jobApplicationSchema.partial().extend({
  id: z.string().uuid(),
})

export const resumeSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1).optional(),
  summary: z.string().nullable().optional(),
  experience: z.array(z.any()).optional(),
  education: z.array(z.any()).optional(),
  projects: z.array(z.any()).optional(),
  certificates: z.array(z.any()).optional(),
  skills: z.array(z.string()).optional(),
})

export const profileUpdateSchema = z.object({
  full_name: z.string().min(1).optional(),
  role_title: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  email: z.string().email().nullable().optional().or(z.literal('')),
  phone: z.string().nullable().optional(),
  linkedin: z.string().url().nullable().optional().or(z.literal('')),
  website: z.string().url().nullable().optional().or(z.literal('')),
})
