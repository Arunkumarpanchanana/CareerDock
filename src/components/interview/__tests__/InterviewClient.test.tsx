import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFetch = vi.hoisted(() => vi.fn())
global.fetch = mockFetch

const mockSpeechSynthesis = vi.hoisted(() => ({
  speak: vi.fn(),
  cancel: vi.fn(),
  getVoices: vi.fn().mockReturnValue([]),
}))
Object.defineProperty(window, 'speechSynthesis', { value: mockSpeechSynthesis, writable: true })

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { InterviewClient } from '../InterviewClient'

describe('InterviewClient', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  it('renders setup screen by default', () => {
    render(<InterviewClient />)
    expect(screen.getByText('AI Mock Interview')).toBeInTheDocument()
    expect(screen.getByText('Start Call →')).toBeInTheDocument()
  })

  it('has textarea for job description', () => {
    render(<InterviewClient />)
    expect(screen.getByPlaceholderText('Paste the full job description here...')).toBeInTheDocument()
  })

  it('has textarea for resume', () => {
    render(<InterviewClient />)
    expect(screen.getByPlaceholderText('Paste your full resume text here...')).toBeInTheDocument()
  })

  it('shows error on API failure', async () => {
    mockFetch.mockRejectedValueOnce(new Error('API down'))

    render(<InterviewClient />)

    const jdInput = screen.getByPlaceholderText('Paste the full job description here...')
    fireEvent.change(jdInput, { target: { value: 'Senior Engineer role' } })

    const resumeInput = screen.getByPlaceholderText('Paste your full resume text here...')
    fireEvent.change(resumeInput, { target: { value: 'SWE at Google' } })

    fireEvent.click(screen.getByText('Start Call →'))

    await waitFor(() => {
      expect(screen.getByText('Failed to start.')).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('shows error when API returns error type', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ type: 'error', content: 'AI unavailable.' }),
    })

    render(<InterviewClient />)

    fireEvent.change(screen.getByPlaceholderText('Paste the full job description here...'), { target: { value: 'Senior Engineer role' } })
    fireEvent.change(screen.getByPlaceholderText('Paste your full resume text here...'), { target: { value: 'SWE at Google' } })
    fireEvent.click(screen.getByText('Start Call →'))

    await waitFor(() => {
      expect(screen.getByText(/AI unavailable/)).toBeInTheDocument()
    }, { timeout: 3000 })
  })
})
