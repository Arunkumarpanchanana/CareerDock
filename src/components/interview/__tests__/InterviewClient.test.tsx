import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFetch = vi.hoisted(() => vi.fn())
global.fetch = mockFetch

// Mock WebSocket
vi.stubGlobal('WebSocket', vi.fn(() => ({
  readyState: 1,
  send: vi.fn(),
  close: vi.fn(),
  addEventListener: vi.fn(),
})))

// Mock getUserMedia
vi.stubGlobal('navigator', {
  mediaDevices: {
    getUserMedia: vi.fn().mockRejectedValue(new Error('No mic')),
  },
})

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

  it('renders textareas for job description and resume', () => {
    render(<InterviewClient />)
    expect(screen.getByPlaceholderText('Paste the full job description here...')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Paste your full resume text here...')).toBeInTheDocument()
  })

  it('shows error on token fetch failure', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    render(<InterviewClient />)

    fireEvent.change(screen.getByPlaceholderText('Paste the full job description here...'), {
      target: { value: 'Senior Engineer role' },
    })
    fireEvent.change(screen.getByPlaceholderText('Paste your full resume text here...'), {
      target: { value: 'SWE at Google' },
    })
    fireEvent.click(screen.getByText('Start Call →'))

    await waitFor(() => {
      expect(screen.getByText(/Token fetch failed|Failed to start/)).toBeInTheDocument()
    }, { timeout: 3000 })
  })
})
