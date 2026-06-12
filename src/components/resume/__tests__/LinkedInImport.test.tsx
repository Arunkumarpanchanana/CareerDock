import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { LinkedInImport } from '../LinkedInImport'

const mockOnImport = vi.fn()

beforeEach(() => {
  mockOnImport.mockReset()
})

vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: { workerSrc: '' },
  version: '4.0.0',
  getDocument: vi.fn(() => ({
    promise: Promise.resolve({
      numPages: 1,
      getPage: vi.fn(() => ({
        getTextContent: vi.fn(() => ({
          items: [{ str: 'Summary\nExperienced engineer' }],
        })),
      })),
    }),
  })),
}))

const mockFetch = vi.fn()
global.fetch = mockFetch

describe('LinkedInImport', () => {
  afterEach(() => {
    mockFetch.mockReset()
  })

  it('renders import button', () => {
    render(<LinkedInImport onImport={mockOnImport} />)
    expect(screen.getByText('Import from LinkedIn')).toBeInTheDocument()
  })

  it('shows error for non-PDF file', () => {
    render(<LinkedInImport onImport={mockOnImport} />)
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['not pdf'], 'resume.txt', { type: 'text/plain' })
    if (fileInput) {
      Object.defineProperty(fileInput, 'files', { value: [file] })
      fireEvent.change(fileInput)
    }
    expect(screen.getByText('Please select a PDF file')).toBeInTheDocument()
  })

  it('closes preview on cancel', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: { title: '', summary: 'Engineer', experience: [], education: [], projects: [], skills: [], certificates: [] },
        confidence: 0.9,
        unmatched: [],
        source: 'heuristic',
      }),
    })

    render(<LinkedInImport onImport={mockOnImport} />)

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['pdf content'], 'profile.pdf', { type: 'application/pdf' })
    if (fileInput) {
      Object.defineProperty(fileInput, 'files', { value: [file] })
      fireEvent.change(fileInput)
    }

    await waitFor(() => {
      expect(screen.getByText('Import Preview')).toBeInTheDocument()
    }, { timeout: 3000 })

    fireEvent.click(screen.getByText('Cancel'))
    expect(screen.queryByText('Import Preview')).not.toBeInTheDocument()
  })

  it('shows preview dialog after successful import', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          title: '',
          summary: 'Experienced engineer',
          experience: [{ company: 'Acme Corp', role: 'Engineer', start_date: '2020', end_date: 'Present', bullets: ['Built things'] }],
          education: [],
          projects: [],
          skills: ['JavaScript'],
          certificates: [],
        },
        confidence: 0.9,
        unmatched: [],
        source: 'heuristic',
      }),
    })

    render(<LinkedInImport onImport={mockOnImport} />)

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['fake pdf content'], 'profile.pdf', { type: 'application/pdf' })
    if (fileInput) {
      Object.defineProperty(fileInput, 'files', { value: [file] })
      fireEvent.change(fileInput)
    }

    await waitFor(() => {
      expect(screen.getByText('Import Preview')).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('shows error on API failure', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false })

    render(<LinkedInImport onImport={mockOnImport} />)

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['pdf content'], 'profile.pdf', { type: 'application/pdf' })
    if (fileInput) {
      Object.defineProperty(fileInput, 'files', { value: [file] })
      fireEvent.change(fileInput)
    }

    await waitFor(() => {
      expect(screen.getByText('Failed to parse PDF. Please try again.')).toBeInTheDocument()
    }, { timeout: 3000 })
  })
})
