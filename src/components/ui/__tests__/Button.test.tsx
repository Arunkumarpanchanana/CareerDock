import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Button } from '../Button'

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('shows loading spinner when loading', () => {
    render(<Button loading>Save</Button>)
    expect(screen.getByText('Save')).toBeInTheDocument()
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })

  it('applies variant classes', () => {
    render(<Button variant="danger">Delete</Button>)
    const button = screen.getByRole('button')
    expect(button.className).toContain('bg-red-600')
  })
})
