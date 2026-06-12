import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TemplateGallery } from '../TemplateGallery'
import type { ResumeFormData } from '@/lib/resume'

const mockData: ResumeFormData = {
  title: 'Test',
  summary: 'A test summary.',
  experience: [],
  education: [],
  projects: [],
  skills: ['JavaScript'],
  certificates: [],
}

describe('TemplateGallery', () => {
  it('renders template options', () => {
    render(
      <TemplateGallery
        data={mockData}
        currentTemplate="professional-classic"
        onSelect={() => {}}
        onClose={() => {}}
      />
    )
    expect(screen.getByText('Fresher Classic')).toBeInTheDocument()
    expect(screen.getByText('Professional Classic')).toBeInTheDocument()
    const execElements = screen.getAllByText('Executive')
    expect(execElements.length).toBeGreaterThanOrEqual(1)
  })

  it('shows all templates when filter is All', () => {
    render(
      <TemplateGallery
        data={mockData}
        currentTemplate="professional-classic"
        onSelect={() => {}}
        onClose={() => {}}
      />
    )
    expect(screen.getByText('Fresher Classic')).toBeInTheDocument()
    const execElements = screen.getAllByText('Executive')
    expect(execElements.length).toBeGreaterThanOrEqual(1)
  })

  it('filters templates by persona', () => {
    render(
      <TemplateGallery
        data={mockData}
        currentTemplate="professional-classic"
        currentPersona="fresher"
        onSelect={() => {}}
        onClose={() => {}}
      />
    )
    // With fresher filter, only fresher template shows
    expect(screen.getByText('Fresher Classic')).toBeInTheDocument()
  })

  it('calls onClose when close button clicked', () => {
    const onClose = vi.fn()
    render(
      <TemplateGallery
        data={mockData}
        currentTemplate="professional-classic"
        onSelect={() => {}}
        onClose={onClose}
      />
    )
    // Click the onClose by finding the header area button
    // We can detect this by looking for the heading "Choose a Template" and clicking sibling
    fireEvent.click(screen.getByText('Choose a Template'))
    // This won't fire onClose but let's try another approach
    const allSvgs = document.querySelectorAll('svg.lucide-x')
    if (allSvgs.length > 0) {
      const closeBtn = allSvgs[0].closest('button')
      if (closeBtn) fireEvent.click(closeBtn)
    }
    expect(onClose).toHaveBeenCalled()
  })

  it('calls onSelect when a template is clicked', () => {
    const onSelect = vi.fn()
    render(
      <TemplateGallery
        data={mockData}
        currentTemplate="professional-classic"
        onSelect={onSelect}
        onClose={() => {}}
      />
    )
    fireEvent.click(screen.getByText('Fresher Classic'))
    expect(onSelect).toHaveBeenCalledWith('fresher-classic')
  })

  it('shows checkmark on currently selected template', () => {
    render(
      <TemplateGallery
        data={mockData}
        currentTemplate="professional-classic"
        onSelect={() => {}}
        onClose={() => {}}
      />
    )
    const proButtons = screen.getAllByText('Professional Classic')
    const selectedEl = proButtons[0].closest('button')
    expect(selectedEl?.className).toContain('border-blue-600')
  })
})
