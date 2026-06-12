import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PersonaSelector } from '../PersonaSelector'

describe('PersonaSelector', () => {
  it('renders all three persona options', () => {
    render(<PersonaSelector onSelect={() => {}} />)
    expect(screen.getByText('Fresher')).toBeInTheDocument()
    expect(screen.getByText('Professional')).toBeInTheDocument()
    expect(screen.getByText('Executive')).toBeInTheDocument()
  })

  it('shows skip option when onSkip provided', () => {
    render(<PersonaSelector onSelect={() => {}} onSkip={() => {}} />)
    expect(screen.getByText(/skip for now/i)).toBeInTheDocument()
  })

  it('does not show skip option when onSkip not provided', () => {
    render(<PersonaSelector onSelect={() => {}} />)
    expect(screen.queryByText(/skip for now/i)).not.toBeInTheDocument()
  })

  it('shows descriptions for each persona', () => {
    render(<PersonaSelector onSelect={() => {}} />)
    expect(screen.getByText(/students, new graduates/i)).toBeInTheDocument()
    expect(screen.getByText(/mid-career professionals/i)).toBeInTheDocument()
    expect(screen.getByText(/senior leaders/i)).toBeInTheDocument()
  })
})
