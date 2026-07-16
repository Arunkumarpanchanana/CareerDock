import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFetch = vi.hoisted(() => vi.fn())
global.fetch = mockFetch

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CoverLetterClient } from '../CoverLetterClient'
import type { Profile } from '@/types/database'
import type { ResumeFormData } from '@/lib/resume'

const mockProfile: Profile = {
  id: '1', full_name: 'Jane Doe', email: 'jane@example.com', phone: '555-0100',
  linkedin: null, website: null, location: 'NY', role_title: 'Engineer',
  role: 'user', plan_tier: 'free', persona: 'professional',
  referral_code: null, referred_by: null, updated_at: '2024-01-01',
}

const mockData: ResumeFormData = {
  title: 'Test', summary: 'Engineer', experience: [],
  education: [], projects: [], skills: ['React'], certificates: [],
}

describe('CoverLetterClient', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  it('renders job details form', () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => [] })
    render(<CoverLetterClient profile={mockProfile} resumeData={mockData} />)
    expect(screen.getByText('Cover Letter Generator')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('e.g. Senior Frontend Engineer')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('e.g. Tech Corp')).toBeInTheDocument()
  })

  it('generates a cover letter on button click', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: '1', content: 'Dear Hiring Manager, I am excited to apply for this position...' }),
      })

    render(<CoverLetterClient profile={mockProfile} resumeData={mockData} />)

    const titleInput = screen.getByPlaceholderText('e.g. Senior Frontend Engineer')
    fireEvent.change(titleInput, { target: { value: 'Engineer' } })

    const companyInput = screen.getByPlaceholderText('e.g. Tech Corp')
    fireEvent.change(companyInput, { target: { value: 'Acme Corp' } })

    const generateBtn = screen.getByText('Generate')
    fireEvent.click(generateBtn)

    await waitFor(() => {
      expect(screen.getByText(/Hiring Manager/)).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('shows download and save buttons after generation', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: '1', content: 'Dear Hiring Manager...' }),
      })

    render(<CoverLetterClient profile={mockProfile} resumeData={mockData} />)

    fireEvent.change(screen.getByPlaceholderText('e.g. Senior Frontend Engineer'), { target: { value: 'Engineer' } })
    fireEvent.change(screen.getByPlaceholderText('e.g. Tech Corp'), { target: { value: 'Acme Corp' } })
    fireEvent.click(screen.getByText('Generate'))

    await waitFor(() => {
      expect(screen.getByText('Download PDF')).toBeInTheDocument()
      expect(screen.getByText('Save')).toBeInTheDocument()
    }, { timeout: 3000 })
  })
})
