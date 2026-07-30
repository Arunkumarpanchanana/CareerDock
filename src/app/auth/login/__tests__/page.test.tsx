import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import LoginPage from '../page'

const mockRouterPush = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockRouterPush }),
  useSearchParams: () => new URLSearchParams(),
}))

const mockSignInWithPassword = vi.fn()
const mockSignInWithOAuth = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    auth: {
      signInWithPassword: mockSignInWithPassword,
      signInWithOAuth: mockSignInWithOAuth,
    },
  })),
}))

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders login form with all fields', () => {
    render(<LoginPage />)
    expect(screen.getByText('Welcome back')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Sign In/ })).toBeInTheDocument()
    expect(screen.getByText('Continue with Google')).toBeInTheDocument()
  })

  it('shows error on failed email login', async () => {
    mockSignInWithPassword.mockResolvedValue({
      error: { message: 'Invalid login credentials' },
    })
    render(<LoginPage />)
    fireEvent.change(screen.getByPlaceholderText('you@example.com'), { target: { value: 'bad@email.com' } })
    fireEvent.change(screen.getByPlaceholderText('Enter your password'), { target: { value: 'wrong' } })
    fireEvent.click(screen.getByRole('button', { name: /Sign In/ }))
    expect(await screen.findByText('Invalid login credentials')).toBeInTheDocument()
  })

  it('redirects to /dashboard on successful email login', async () => {
    mockSignInWithPassword.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
    render(<LoginPage />)
    fireEvent.change(screen.getByPlaceholderText('you@example.com'), { target: { value: 'a@b.com' } })
    fireEvent.change(screen.getByPlaceholderText('Enter your password'), { target: { value: 'ok' } })
    fireEvent.click(screen.getByRole('button', { name: /Sign In/ }))
    await waitFor(() => {
      expect(mockSignInWithPassword).toHaveBeenCalled()
    })
  })

  it('calls Google OAuth on button click', async () => {
    mockSignInWithOAuth.mockResolvedValue({ error: null })
    render(<LoginPage />)
    fireEvent.click(screen.getByText('Continue with Google'))
    await waitFor(() => {
      expect(mockSignInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: { redirectTo: 'http://localhost:3000/auth/callback' },
      })
    })
  })

  it('shows error when Google OAuth fails', async () => {
    mockSignInWithOAuth.mockResolvedValue({ error: { message: 'Popup blocked' } })
    render(<LoginPage />)
    fireEvent.click(screen.getByText('Continue with Google'))
    expect(await screen.findByText('Popup blocked')).toBeInTheDocument()
  })

  it('clears previous error on new submission', async () => {
    mockSignInWithPassword
      .mockResolvedValueOnce({ error: { message: 'First error' } })
      .mockResolvedValueOnce({ error: { message: 'Second error' } })
    render(<LoginPage />)
    const emailInput = screen.getByPlaceholderText('you@example.com')
    const passwordInput = screen.getByPlaceholderText('Enter your password')
    const submitButton = screen.getByRole('button', { name: /Sign In/ })
    fireEvent.change(emailInput, { target: { value: 'a@b.com' } })
    fireEvent.change(passwordInput, { target: { value: 'w' } })
    fireEvent.click(submitButton)
    expect(await screen.findByText('First error')).toBeInTheDocument()
    fireEvent.click(submitButton)
    expect(await screen.findByText('Second error')).toBeInTheDocument()
    expect(screen.queryByText('First error')).not.toBeInTheDocument()
  })

  it('links to signup page', () => {
    render(<LoginPage />)
    const signupLink = screen.getByRole('link', { name: /Sign up/ })
    expect(signupLink).toHaveAttribute('href', '/auth/signup')
  })

  it('links to forgot password', () => {
    render(<LoginPage />)
    const forgotLink = screen.getByRole('link', { name: /Forgot password/ })
    expect(forgotLink).toHaveAttribute('href', '/auth/forgot-password')
  })
})
