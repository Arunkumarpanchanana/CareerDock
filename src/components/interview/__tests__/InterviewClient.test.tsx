import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { InterviewClient } from '../InterviewClient'

describe('InterviewClient', () => {
  it('renders setup screen by default', () => {
    render(<InterviewClient />)
    expect(screen.getByText('AI Mock Interview')).toBeDefined()
    expect(screen.getByText('Start Interview →')).toBeDefined()
  })

  it('has textarea for job description', () => {
    render(<InterviewClient />)
    expect(screen.getByPlaceholderText('Paste the full job description here...')).toBeDefined()
  })

  it('has textarea for resume', () => {
    render(<InterviewClient />)
    expect(screen.getByPlaceholderText('Paste your full resume text here...')).toBeDefined()
  })
})
