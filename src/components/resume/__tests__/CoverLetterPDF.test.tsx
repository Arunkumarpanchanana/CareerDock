import { describe, it, expect, vi, beforeEach } from 'vitest'

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
}))

import { render, screen } from '@testing-library/react'
import { CoverLetterPDFDocument } from '../CoverLetterPDF'
import type { Profile } from '@/types/database'

const mockProfile: Profile = {
  id: '1',
  full_name: 'Jane Doe',
  email: 'jane@example.com',
  phone: '555-0100',
  linkedin: null,
  website: null,
  location: 'New York',
  role_title: 'Software Engineer',
  role: 'user',
  plan_tier: 'free',
  persona: 'professional',
  referral_code: null,
  referred_by: null,
  updated_at: '2024-01-01',
}

describe('CoverLetterPDFDocument', () => {
  it('renders sender info', () => {
    render(
      <CoverLetterPDFDocument
        profile={mockProfile}
        content="Dear Hiring Manager, I am excited to apply..."
        jobTitle="Software Engineer"
        company="Acme Corp"
      />
    )
    expect(screen.getAllByText('Jane Doe')).toHaveLength(2)
    expect(screen.getByText(/jane@example.com/)).toBeInTheDocument()
  })

  it('renders cover letter body', () => {
    render(
      <CoverLetterPDFDocument
        profile={mockProfile}
        content="I am excited to apply for this position."
        jobTitle="Engineer"
        company="Acme Corp"
      />
    )
    expect(screen.getByText(/excited to apply/)).toBeInTheDocument()
  })

  it('renders recipient line', () => {
    render(
      <CoverLetterPDFDocument
        profile={mockProfile}
        content="Dear Hiring Manager,"
        jobTitle="Engineer"
        company="Acme Corp"
      />
    )
    expect(screen.getByText(/Acme Corp/)).toBeInTheDocument()
  })
})
