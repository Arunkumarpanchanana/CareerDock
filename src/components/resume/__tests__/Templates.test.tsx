import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FresherTemplate } from '../templates/FresherTemplate'
import { ProfessionalTemplate } from '../templates/ProfessionalTemplate'
import { ExecutiveTemplate } from '../templates/ExecutiveTemplate'
import type { ResumeFormData } from '@/lib/resume'

const mockData: ResumeFormData = {
  title: 'Test Resume',
  summary: 'A dedicated professional with 5 years of experience.',
  experience: [
    { company: 'Acme Corp', role: 'Software Engineer', start_date: 'Jan 2020', end_date: 'Present', bullets: ['Built scalable APIs', 'Led team of 3'] },
  ],
  education: [
    { institution: 'MIT', degree: 'B.S.', field: 'Computer Science', year: '2018', gpa: '3.8/4.0', relevant_coursework: ['Algorithms', 'Data Structures'] },
  ],
  projects: [
    { name: 'Project X', description: 'A web app', tech_stack: 'React, Node', url: 'https://example.com' },
  ],
  skills: ['JavaScript', 'React', 'Node.js', 'Python'],
  certificates: [
    { name: 'AWS Certified', issuer: 'Amazon', date: '2023', url: '' },
  ],
}

describe('FresherTemplate', () => {
  it('renders education before experience', () => {
    const { container } = render(<FresherTemplate profile={null} data={mockData} />)
    const html = container.innerHTML
    const eduIndex = html.indexOf('MIT')
    const expIndex = html.indexOf('Acme Corp')
    expect(eduIndex).toBeLessThan(expIndex)
  })

  it('renders projects before experience', () => {
    const { container } = render(<FresherTemplate profile={null} data={mockData} />)
    const html = container.innerHTML
    const projIndex = html.indexOf('Project X')
    const expIndex = html.indexOf('Acme Corp')
    expect(projIndex).toBeLessThan(expIndex)
  })

  it('shows GPA and relevant coursework', () => {
    render(<FresherTemplate profile={null} data={mockData} />)
    expect(screen.getByText(/GPA: 3.8\/4.0/)).toBeInTheDocument()
    expect(screen.getByText(/Relevant Coursework:/)).toBeInTheDocument()
  })

  it('shows empty state when no data', () => {
    const empty: ResumeFormData = { title: '', summary: '', experience: [], education: [], projects: [], skills: [], certificates: [] }
    render(<FresherTemplate profile={null} data={empty} />)
    expect(screen.getByText(/Fill in your resume details/)).toBeInTheDocument()
  })
})

describe('ProfessionalTemplate', () => {
  it('renders experience before education', () => {
    const { container } = render(<ProfessionalTemplate profile={null} data={mockData} />)
    const html = container.innerHTML
    const expIndex = html.indexOf('Acme Corp')
    const eduIndex = html.indexOf('MIT')
    expect(expIndex).toBeLessThan(eduIndex)
  })

  it('renders all sections', () => {
    render(<ProfessionalTemplate profile={null} data={mockData} />)
    expect(screen.getByText('Acme Corp')).toBeInTheDocument()
    expect(screen.getByText('MIT')).toBeInTheDocument()
    expect(screen.getByText('Project X')).toBeInTheDocument()
  })
})

describe('ExecutiveTemplate', () => {
  it('uses Executive Summary heading', () => {
    render(<ExecutiveTemplate profile={null} data={mockData} />)
    expect(screen.getByText('Executive Summary')).toBeInTheDocument()
  })

  it('uses Leadership Experience heading', () => {
    render(<ExecutiveTemplate profile={null} data={mockData} />)
    expect(screen.getByText('Leadership Experience')).toBeInTheDocument()
  })

  it('uses Core Competencies heading', () => {
    render(<ExecutiveTemplate profile={null} data={mockData} />)
    expect(screen.getByText('Core Competencies')).toBeInTheDocument()
  })

  it('renders all data sections', () => {
    render(<ExecutiveTemplate profile={null} data={mockData} />)
    expect(screen.getByText('Acme Corp')).toBeInTheDocument()
    expect(screen.getByText('MIT')).toBeInTheDocument()
    expect(screen.getByText('AWS Certified')).toBeInTheDocument()
  })
})

describe('Template index', () => {
  it('exports all three templates', async () => {
    const { TEMPLATES } = await import('../templates')
    expect(TEMPLATES.fresher).toBeDefined()
    expect(TEMPLATES.professional).toBeDefined()
    expect(TEMPLATES.executive).toBeDefined()
  })
})
