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
  email: z.string().max(500).nullable().optional(),
  phone: z.string().max(50).nullable().optional(),
  linkedin: z.string().max(500).nullable().optional(),
  website: z.string().max(500).nullable().optional(),
  persona: z.enum(['fresher', 'professional', 'executive']).optional(),
})

export const expertSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  domain_expertise: z.string().min(1, 'Domain expertise is required'),
  bio: z.string().nullable().optional(),
  scheduling_url: z.string().url('Invalid scheduling URL'),
  is_active: z.boolean().optional(),
})

export const expertUpdateSchema = expertSchema.partial().extend({
  id: z.string().uuid(),
})

export const bookingUpdateSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['pending', 'confirmed', 'completed', 'cancelled']),
  notes: z.string().nullable().optional(),
  scheduled_at: z.string().optional(),
})

export const adminRoleUpdateSchema = z.object({
  id: z.string().uuid(),
  role: z.enum(['user', 'admin']),
})

export const adminCreateUserSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  full_name: z.string().min(1, 'Full name is required'),
  role: z.enum(['user', 'admin']).optional(),
})

export const adminUpdatePlanSchema = z.object({
  id: z.string().uuid(),
  plan_tier: z.enum(['free', 'premium']),
})
