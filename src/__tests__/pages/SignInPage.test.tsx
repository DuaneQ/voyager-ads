import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, vi, beforeEach } from 'vitest'

vi.mock('../../services/auth/authServiceInstance', () => ({
  __esModule: true,
  authService: {
    signInWithGoogle: vi.fn().mockResolvedValue({}),
    signInWithEmail: vi.fn().mockResolvedValue({}),
    signUpWithEmail: vi.fn().mockResolvedValue({}),
    sendPasswordReset: vi.fn().mockResolvedValue(undefined),
  }
}))

// Mock Nav to avoid rendering app chrome in unit tests
vi.mock('../../components/common/Nav', () => ({ __esModule: true, default: () => <div /> }))

// Keep router hooks simple for the component
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useLocation: () => ({ state: {} }),
  }
})

import SignInPage from '../../pages/SignInPage'
import { authService } from '../../services/auth/authServiceInstance'
import { MemoryRouter } from 'react-router-dom'

describe('SignInPage', () => {
  beforeEach(() => vi.clearAllMocks())

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

  it('submits sign up flow when switching to Sign up', async () => {
    render(<SignInPage />, { wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter> })

    fireEvent.click(screen.getByText(/Sign up/i))
    expect(screen.getByRole('heading', { name: /Create account/i })).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'new@u.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'newpw' } })

    fireEvent.click(screen.getByRole('button', { name: /Create account/i }))
    await waitFor(() => expect((authService.signUpWithEmail as any)).toHaveBeenCalledWith('new@u.com', 'newpw'))
  })

  it('shows info message after successful password reset', async () => {
    render(<SignInPage />, { wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter> })

    fireEvent.click(screen.getByText(/Forgot password\?/i))
    const email = screen.getByLabelText('Email address') as HTMLInputElement
    fireEvent.change(email, { target: { value: 'x@y.com' } })
    fireEvent.click(screen.getByRole('button', { name: /Send reset email/i }))

    await waitFor(() => expect(screen.getByText(/Password reset email sent/i)).toBeInTheDocument())
  })
})
