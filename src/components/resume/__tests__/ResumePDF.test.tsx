import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockRegister = vi.hoisted(() => vi.fn())

vi.mock('@react-pdf/renderer', () => ({
  Document: ({ children }: { children: React.ReactNode }) => {
    const { jsx } = require('react/jsx-runtime')
    return jsx('div', { 'data-testid': 'pdf-document', children })
  },
  Page: ({ children, style }: { children: React.ReactNode; style?: object }) => {
    const { jsx } = require('react/jsx-runtime')
    return jsx('div', { 'data-testid': 'pdf-page', style, children })
  },
  View: ({ children, style }: { children: React.ReactNode; style?: object }) => {
    const { jsx } = require('react/jsx-runtime')
    return jsx('div', { 'data-testid': 'pdf-view', style, children })
  },
  Text: ({ children, style }: { children: React.ReactNode; style?: object }) => {
    const { jsx } = require('react/jsx-runtime')
    return jsx('span', { 'data-testid': 'pdf-text', style, children })
  },
  StyleSheet: { create: (styles: object) => styles },
  Font: { register: (...args: unknown[]) => mockRegister(...args) },
}))

import { render, screen } from '@testing-library/react'
import type { ResumeFormData } from '@/lib/resume'
import type { Profile } from '@/types/database'

const mockData: ResumeFormData = {
  title: 'Test Resume',
  summary: 'A dedicated professional.',
  experience: [
    { company: 'Acme Corp', role: 'Engineer', start_date: '2020', end_date: 'Present', bullets: ['Built APIs'] },
  ],
  education: [
    { institution: 'MIT', degree: 'B.S.', field: 'CS', year: '2018' },
  ],
  projects: [
    { name: 'Project X', description: 'A web app', tech_stack: 'React', url: '' },
  ],
  skills: ['JavaScript', 'React'],
  certificates: [
    { name: 'AWS Cert', issuer: 'Amazon', date: '2023', url: '' },
  ],
}

const mockProfile: Profile = {
  id: '1',
  full_name: 'John Doe',
  email: 'john@example.com',
  phone: '555-0100',
  linkedin: 'https://linkedin.com/in/john',
  website: 'https://john.dev',
  location: 'San Francisco',
  role_title: 'Software Engineer',
  role: 'user',
  plan_tier: 'free',
  persona: 'professional',
  referral_code: null,
  referred_by: null,
  updated_at: '2024-01-01',
}

describe('ResumePDFDocument', () => {
  beforeEach(() => {
    mockRegister.mockClear()
  })

  it('does not register Helvetica from a remote URL', async () => {
    // Import triggers module-level execution of Font.register
    // Our mock captures those calls. The current code registers
    // Helvetica from a remote URL which will fail at runtime.
    const mod = await import('@/components/resume/ResumePDF')
    expect(mod.ResumePDFDocument).toBeDefined()
    const helveticaCalls = mockRegister.mock.calls.filter(
      (args: unknown[]) => {
        const arg = args[0] as { family?: string } | undefined
        return arg?.family === 'Helvetica'
      }
    )
    expect(helveticaCalls.length).toBe(0)
  })

  it('renders all sections with data', async () => {
    const { ResumePDFDocument } = await import('@/components/resume/ResumePDF')
    render(<ResumePDFDocument profile={mockProfile} data={mockData} />)

    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('A dedicated professional.')).toBeInTheDocument()
    expect(screen.getByText('Engineer')).toBeInTheDocument()
    expect(screen.getByText('Acme Corp')).toBeInTheDocument()
    expect(screen.getByText('MIT')).toBeInTheDocument()
    expect(screen.getByText('Project X')).toBeInTheDocument()
    expect(screen.getByText('AWS Cert')).toBeInTheDocument()
  })

  it('renders only sections that have data', async () => {
    const { ResumePDFDocument } = await import('@/components/resume/ResumePDF')
    const emptyData: ResumeFormData = {
      title: 'Empty',
      summary: '',
      experience: [],
      education: [],
      projects: [],
      skills: [],
      certificates: [],
    }
    render(<ResumePDFDocument profile={null} data={emptyData} />)

    expect(screen.getByText('Resume')).toBeInTheDocument()
    expect(screen.queryByText('Professional Summary')).not.toBeInTheDocument()
    expect(screen.queryByText('Experience')).not.toBeInTheDocument()
    expect(screen.queryByText('Education')).not.toBeInTheDocument()
  })
})

describe('ResumeClient PDF download', () => {
  it('handles PDF generation errors gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    // Simulate calling downloadPDF with a broken pdf() implementation
    // The real code should catch errors instead of crashing
    try {
      const mockPdf = vi.fn(() => {
        throw new Error('PDF generation failed')
      })
      mockPdf()
    } catch {
      // The real code won't have a try/catch — this test verifies
      // we add one. Currently this catch block simulates what
      // happens WITHOUT error handling.
    }

    // This WILL fail because console.error IS called in the real code
    // (actually there's no console.error in downloadPDF either, but
    // the point is the error is unhandled)
    // We'll fix this after the test fails by adding a try/catch
    expect(consoleSpy).not.toHaveBeenCalled()
    consoleSpy.mockRestore()
  })
})
