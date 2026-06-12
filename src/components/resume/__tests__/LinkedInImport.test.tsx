import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { LinkedInImport } from '../LinkedInImport'

const mockOnImport = vi.fn()

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

  it('shows file picker on button click', () => {
    render(<LinkedInImport onImport={mockOnImport} />)
    const btn = screen.getByText('Import from LinkedIn')
    fireEvent.click(btn)
    expect(screen.getByText('Import from LinkedIn')).toBeInTheDocument()
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
})
