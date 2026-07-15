import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import SignupPage from '../page'

const mockRouterPush = vi.fn()
const mockRouterRefresh = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockRouterPush, refresh: mockRouterRefresh }),
  useSearchParams: () => new URLSearchParams(),
}))

const mockSignUp = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    auth: { signUp: mockSignUp },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        })),
      })),
      upsert: vi.fn().mockResolvedValue({ error: null }),
      insert: vi.fn().mockResolvedValue({ error: null }),
    })),
  })),
}))

const validPassword = 'Test1234!'

function fillForm() {
  fireEvent.change(screen.getByPlaceholderText('John Doe'), { target: { value: 'Test User' } })
  fireEvent.change(screen.getByPlaceholderText('you@example.com'), { target: { value: 'test@example.com' } })
  fireEvent.change(screen.getByPlaceholderText(/Create a password/), { target: { value: validPassword } })
}

describe('SignupPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders signup form with all fields', () => {
    render(<SignupPage />)
    expect(screen.getByText('Create account')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('John Doe')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Create a password/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Create Account/ })).toBeInTheDocument()
  })

  it('shows password strength indicators', () => {
    render(<SignupPage />)
    const pwInput = screen.getByPlaceholderText(/Create a password/)
    expect(pwInput).toBeInTheDocument()
    fireEvent.change(pwInput, { target: { value: 'weak' } })
    const weakLabel = screen.getByText('Weak')
    expect(weakLabel).toBeInTheDocument()
  })

  it('validates password before submission', async () => {
    render(<SignupPage />)
    fillForm()
    fireEvent.change(screen.getByPlaceholderText(/Create a password/), { target: { value: 'short' } })
    fireEvent.click(screen.getByRole('button', { name: /Create Account/ }))
    expect(await screen.findByText(/Password must be at least/)).toBeInTheDocument()
    expect(mockSignUp).not.toHaveBeenCalled()
  })

  it('calls signUp on valid submission and redirects', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ exists: false }),
    })
    mockSignUp.mockResolvedValue({
      data: { session: { access_token: 'tok' }, user: { id: 'user-1' } },
      error: null,
    })
    render(<SignupPage />)
    fillForm()
    fireEvent.click(screen.getByRole('button', { name: /Create Account/ }))
    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'test@example.com', password: validPassword })
      )
    })
    expect(mockRouterPush).toHaveBeenCalledWith('/dashboard')
    expect(mockRouterRefresh).toHaveBeenCalled()
  })

  it('shows info message when email confirmation is needed (no session)', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ exists: false }),
    })
    mockSignUp.mockResolvedValue({
      data: { session: null, user: { id: 'user-2' } },
      error: null,
    })
    render(<SignupPage />)
    fillForm()
    fireEvent.click(screen.getByRole('button', { name: /Create Account/ }))
    expect(await screen.findByText(/Please check your email/)).toBeInTheDocument()
    expect(mockRouterPush).not.toHaveBeenCalled()
  })

  it('shows error when email is already taken', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ exists: true }),
    })
    render(<SignupPage />)
    fillForm()
    fireEvent.click(screen.getByRole('button', { name: /Create Account/ }))
    expect(await screen.findByText(/already exists/)).toBeInTheDocument()
    expect(mockSignUp).not.toHaveBeenCalled()
  })

  it('shows error when Supabase signUp returns error', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ exists: false }),
    })
    mockSignUp.mockResolvedValue({
      data: { session: null, user: null },
      error: { message: 'Email rate limit exceeded' },
    })
    render(<SignupPage />)
    fillForm()
    fireEvent.click(screen.getByRole('button', { name: /Create Account/ }))
    expect(await screen.findByText('Email rate limit exceeded')).toBeInTheDocument()
  })

  it('shows fallback error when signUp throws', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ exists: false }),
    })
    mockSignUp.mockRejectedValue(new Error('Network error'))
    render(<SignupPage />)
    fillForm()
    fireEvent.click(screen.getByRole('button', { name: /Create Account/ }))
    expect(await screen.findByText('Network error')).toBeInTheDocument()
  })

  it('shows generic error when signUp throws non-Error', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ exists: false }),
    })
    mockSignUp.mockRejectedValue('Raw string error')
    render(<SignupPage />)
    fillForm()
    fireEvent.click(screen.getByRole('button', { name: /Create Account/ }))
    expect(await screen.findByText('Something went wrong. Please try again.')).toBeInTheDocument()
  })
})
