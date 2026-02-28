import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, vi, beforeEach } from 'vitest'

vi.mock('../../services/auth/authServiceInstance', () => ({
  __esModule: true,
  authService: {
    signInWithGoogle: vi.fn().mockResolvedValue({ emailVerified: true }),
    signInWithEmail: vi.fn().mockResolvedValue({ emailVerified: true }),
    signUpWithEmail: vi.fn().mockResolvedValue({ emailVerified: false }),
    sendPasswordReset: vi.fn().mockResolvedValue(undefined),
    resendVerificationEmail: vi.fn().mockResolvedValue(undefined),
    signOut: vi.fn().mockResolvedValue(undefined),
  }
}))

// Mock Nav to avoid rendering app chrome in unit tests
vi.mock('../../components/common/Nav', () => ({ __esModule: true, default: () => <div /> }))

// Default: not yet authenticated; individual tests can override via mockImplementation
vi.mock('../../store/authStore', () => ({
  default: vi.fn((selector: (s: { isAuthenticated: boolean; isInitialized: boolean; user: null | { emailVerified: boolean } }) => unknown) =>
    selector({ isAuthenticated: false, isInitialized: true, user: null })
  ),
}))

// Shared navigate mock — stable reference so redirect tests can assert on it
const mockNavigate = vi.fn()
const mockUseLocation = vi.fn().mockReturnValue({ state: {} })

// Keep router hooks simple for the component
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => mockUseLocation(),
  }
})

import SignInPage from '../../pages/SignInPage'
import { authService } from '../../services/auth/authServiceInstance'
import useAuthStore from '../../store/authStore'
import { MemoryRouter } from 'react-router-dom'

describe('SignInPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockNavigate.mockReset()
  })

  it('renders sign in heading and google button', () => {
    render(<SignInPage />, { wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter> })
    expect(screen.getByRole('heading', { name: /Sign in/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Sign in with Google/i })).toBeInTheDocument()
  })

  it('toggles to reset mode when clicking Forgot password and sends reset email', async () => {
    render(<SignInPage />, { wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter> })

    fireEvent.click(screen.getByText(/Forgot password\?/i))
    expect(screen.getByRole('heading', { name: /Reset password/i })).toBeInTheDocument()

    const email = screen.getByLabelText('Email address') as HTMLInputElement
    fireEvent.change(email, { target: { value: 'x@y.com' } })

    fireEvent.click(screen.getByRole('button', { name: /Send reset email/i }))

    await waitFor(() => expect((authService.sendPasswordReset as any)).toHaveBeenCalledWith('x@y.com'))
  })

  it('calls signInWithGoogle when clicking Google button', async () => {
    render(<SignInPage />, { wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter> })
    fireEvent.click(screen.getByRole('button', { name: /Sign in with Google/i }))
    await waitFor(() => expect((authService.signInWithGoogle as any)).toHaveBeenCalled())
  })

  it('submits email/password for sign in', async () => {
    render(<SignInPage />, { wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter> })

    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'a@b.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'pw' } })

    const submit = screen.getAllByRole('button', { name: /Sign in/i }).find(b => b.getAttribute('type') === 'submit')!
    fireEvent.click(submit)
    await waitFor(() => expect((authService.signInWithEmail as any)).toHaveBeenCalledWith('a@b.com', 'pw'))
  })

  it('shows friendly error message on auth error', async () => {
    ;(authService.signInWithEmail as any).mockRejectedValue({ code: 'auth/wrong-password' })
    render(<SignInPage />, { wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter> })

    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'a@b.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'bad' } })

    const submitBtn = screen.getAllByRole('button', { name: /Sign in/i }).find(b => b.getAttribute('type') === 'submit')!
    fireEvent.click(submitBtn)
    await waitFor(() => expect(screen.getByText(/Incorrect password\./i)).toBeInTheDocument())
  })

  it('submits sign up flow and shows verify screen', async () => {
    render(<SignInPage />, { wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter> })

    fireEvent.click(screen.getByText(/Sign up/i))
    expect(screen.getByRole('heading', { name: /Create account/i })).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'new@u.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'newpw' } })

    fireEvent.click(screen.getByRole('button', { name: /Create account/i }))
    await waitFor(() => expect((authService.signUpWithEmail as any)).toHaveBeenCalledWith('new@u.com', 'newpw'))
    await waitFor(() => expect(screen.getByRole('heading', { name: /Verify your email/i })).toBeInTheDocument())
  })

  it('shows verify screen when signing in with unverified email', async () => {
    ;(authService.signInWithEmail as any).mockResolvedValue({ emailVerified: false })
    render(<SignInPage />, { wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter> })

    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'a@b.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'pw' } })

    const submit = screen.getAllByRole('button', { name: /Sign in/i }).find(b => b.getAttribute('type') === 'submit')!
    fireEvent.click(submit)
    await waitFor(() => expect(screen.getByRole('heading', { name: /Verify your email/i })).toBeInTheDocument())
  })

  it('shows verify screen immediately when needsVerification location state is set', () => {
    // Simulate ProtectedRoute redirect: user is authenticated but unverified
    ;(useAuthStore as ReturnType<typeof vi.fn>).mockImplementation(
      (selector: (s: { isAuthenticated: boolean; isInitialized: boolean; user: { emailVerified: boolean } | null }) => unknown) =>
        selector({ isAuthenticated: true, isInitialized: true, user: { emailVerified: false } })
    )
    mockUseLocation.mockReturnValueOnce({ state: { needsVerification: true } })
    render(<SignInPage />, { wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter> })
    expect(screen.getByRole('heading', { name: /Verify your email/i })).toBeInTheDocument()
    const resendBtn = screen.getByRole('button', { name: /Resend verification email/i })
    expect(resendBtn).toBeInTheDocument()
    expect(resendBtn).not.toBeDisabled()

    // Restore default so subsequent tests are not affected
    ;(useAuthStore as ReturnType<typeof vi.fn>).mockImplementation(
      (selector: (s: { isAuthenticated: boolean; isInitialized: boolean; user: null | { emailVerified: boolean } }) => unknown) =>
        selector({ isAuthenticated: false, isInitialized: true, user: null })
    )
  })

  it('shows info message after successful password reset', async () => {
    render(<SignInPage />, { wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter> })

    fireEvent.click(screen.getByText(/Forgot password\?/i))
    const email = screen.getByLabelText('Email address') as HTMLInputElement
    fireEvent.change(email, { target: { value: 'x@y.com' } })
    fireEvent.click(screen.getByRole('button', { name: /Send reset email/i }))

    await waitFor(() => expect(screen.getByText(/Password reset email sent/i)).toBeInTheDocument())
  })

  it('shows unverified warning with resend link on sign-in form when session is unverified', () => {
    ;(useAuthStore as ReturnType<typeof vi.fn>).mockImplementation(
      (selector: (s: { isAuthenticated: boolean; isInitialized: boolean; user: { emailVerified: boolean } | null }) => unknown) =>
        selector({ isAuthenticated: true, isInitialized: true, user: { emailVerified: false } })
    )
    render(<SignInPage />, { wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter> })
    // Should still show the sign-in form (not auto-bounced to verify)
    expect(screen.getByRole('heading', { name: /Sign in/i })).toBeInTheDocument()
    // Warning notice with a resend link should be visible
    expect(screen.getByText(/Email not verified\./i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Resend verification email/i })).toBeInTheDocument()

    // Restore default
    ;(useAuthStore as ReturnType<typeof vi.fn>).mockImplementation(
      (selector: (s: { isAuthenticated: boolean; isInitialized: boolean; user: null | { emailVerified: boolean } }) => unknown) =>
        selector({ isAuthenticated: false, isInitialized: true, user: null })
    )
  })

  it('shows success info after resending verification email from verify screen', async () => {
    render(<SignInPage />, { wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter> })

    // Get to verify screen via sign-up flow (signUpWithEmail returns emailVerified: false by default)
    fireEvent.click(screen.getByText(/Sign up/i))
    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'u@x.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'pass123' } })
    fireEvent.click(screen.getByRole('button', { name: /Create account/i }))
    await waitFor(() => screen.getByRole('heading', { name: /Verify your email/i }))

    fireEvent.click(screen.getByRole('button', { name: /Resend verification email/i }))
    await waitFor(() => expect(authService.resendVerificationEmail as any).toHaveBeenCalled())
    await waitFor(() => expect(screen.getByText(/Verification email resent/i)).toBeInTheDocument())
  })

  it('shows error when resend verification email fails', async () => {
    ;(authService.resendVerificationEmail as any).mockRejectedValueOnce({ code: 'auth/too-many-requests' })
    render(<SignInPage />, { wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter> })

    fireEvent.click(screen.getByText(/Sign up/i))
    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'u@x.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'pass123' } })
    fireEvent.click(screen.getByRole('button', { name: /Create account/i }))
    await waitFor(() => screen.getByRole('heading', { name: /Verify your email/i }))

    fireEvent.click(screen.getByRole('button', { name: /Resend verification email/i }))
    await waitFor(() => expect(screen.getByText(/Too many attempts/i)).toBeInTheDocument())
  })

  it('returns to sign-in from verify screen via "Back to sign in"', async () => {
    render(<SignInPage />, { wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter> })

    fireEvent.click(screen.getByText(/Sign up/i))
    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'u@x.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'pass123' } })
    fireEvent.click(screen.getByRole('button', { name: /Create account/i }))
    await waitFor(() => screen.getByRole('heading', { name: /Verify your email/i }))

    fireEvent.click(screen.getByRole('button', { name: /Back to sign in/i }))
    expect(screen.getByRole('heading', { name: /Sign in/i })).toBeInTheDocument()
  })

  it('shows friendly error for auth/email-already-in-use on sign up', async () => {
    ;(authService.signUpWithEmail as any).mockRejectedValueOnce({ code: 'auth/email-already-in-use' })
    render(<SignInPage />, { wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter> })

    fireEvent.click(screen.getByText(/Sign up/i))
    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'taken@x.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'pass123' } })
    fireEvent.click(screen.getByRole('button', { name: /Create account/i }))
    await waitFor(() => expect(screen.getByText(/An account with this email already exists/i)).toBeInTheDocument())
  })

  it('shows friendly error for unknown error code', async () => {
    ;(authService.signInWithEmail as any).mockRejectedValueOnce({ code: 'auth/network-request-failed' })
    render(<SignInPage />, { wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter> })

    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'a@b.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'pw' } })
    const submit = screen.getAllByRole('button', { name: /Sign in/i }).find(b => b.getAttribute('type') === 'submit')!
    fireEvent.click(submit)
    await waitFor(() => expect(screen.getByText(/Network error/i)).toBeInTheDocument())
  })

  it('does NOT redirect when authenticated but email unverified', async () => {
    ;(useAuthStore as ReturnType<typeof vi.fn>).mockImplementation(
      (selector: (s: { isAuthenticated: boolean; isInitialized: boolean; user: { emailVerified: boolean } | null }) => unknown) =>
        selector({ isAuthenticated: true, isInitialized: true, user: { emailVerified: false } })
    )

    render(<SignInPage />, { wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter> })

    // navigate should never be called — the verify screen should hold
    await new Promise((r) => setTimeout(r, 50))
    expect(mockNavigate).not.toHaveBeenCalled()

    // Restore default
    ;(useAuthStore as ReturnType<typeof vi.fn>).mockImplementation(
      (selector: (s: { isAuthenticated: boolean; isInitialized: boolean; user: null | { emailVerified: boolean } }) => unknown) =>
        selector({ isAuthenticated: false, isInitialized: true, user: null })
    )
  })

  it('redirects to /dashboard when already authenticated on mount', async () => {
    ;(useAuthStore as ReturnType<typeof vi.fn>).mockImplementation(
      (selector: (s: { isAuthenticated: boolean; isInitialized: boolean; user: { emailVerified: boolean } | null }) => unknown) =>
        selector({ isAuthenticated: true, isInitialized: true, user: { emailVerified: true } })
    )

    render(<SignInPage />, { wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter> })

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true }))

    // Restore default
    ;(useAuthStore as ReturnType<typeof vi.fn>).mockImplementation(
      (selector: (s: { isAuthenticated: boolean; isInitialized: boolean; user: null | { emailVerified: boolean } }) => unknown) =>
        selector({ isAuthenticated: false, isInitialized: true, user: null })
    )
  })
})
