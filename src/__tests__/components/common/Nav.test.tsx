import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithRouter } from '../../../testUtils/test-utils'
import type { User } from 'firebase/auth'

// ── Mutable auth state shared across tests ────────────────────────────────────
let mockAuthState = { user: null as User | null, isAuthenticated: false, isInitialized: true }

vi.mock('../../../store/authStore', () => ({
  default: vi.fn((selector?: (s: typeof mockAuthState) => unknown) =>
    selector ? selector(mockAuthState) : mockAuthState
  ),
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock('../../../services/auth/authServiceInstance', () => ({
  authService: { signOut: vi.fn().mockResolvedValue(undefined) },
}))

import Nav from '../../../components/common/Nav'
import { authService } from '../../../services/auth/authServiceInstance'

describe('Nav', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuthState = { user: null, isAuthenticated: false, isInitialized: true }
  })

  describe('unauthenticated', () => {
    it('shows Sign in link', () => {
      renderWithRouter(<Nav />)
      expect(screen.getByRole('link', { name: /Sign in/i })).toBeInTheDocument()
    })

    it('shows Get started button linking to /create-campaign', () => {
      renderWithRouter(<Nav />)
      const btn = screen.getByRole('link', { name: /Get started/i })
      expect(btn).toBeInTheDocument()
      expect(btn).toHaveAttribute('href', '/create-campaign')
    })

    it('does not show Sign out or Dashboard', () => {
      renderWithRouter(<Nav />)
      expect(screen.queryByRole('button', { name: /Sign out/i })).not.toBeInTheDocument()
      expect(screen.queryByRole('link', { name: /Dashboard/i })).not.toBeInTheDocument()
    })
  })

  describe('authenticated', () => {
    beforeEach(() => {
      mockAuthState = { user: { uid: 'u1' } as User, isAuthenticated: true, isInitialized: true }
    })

    it('shows Dashboard link', () => {
      renderWithRouter(<Nav />)
      expect(screen.getByRole('link', { name: /Dashboard/i })).toBeInTheDocument()
    })

    it('shows New campaign button', () => {
      renderWithRouter(<Nav />)
      expect(screen.getByRole('link', { name: /New campaign/i })).toBeInTheDocument()
    })

    it('shows Sign out button', () => {
      renderWithRouter(<Nav />)
      expect(screen.getByRole('button', { name: /Sign out/i })).toBeInTheDocument()
    })

    it('does not show Sign in link', () => {
      renderWithRouter(<Nav />)
      expect(screen.queryByRole('link', { name: /Sign in/i })).not.toBeInTheDocument()
    })

    it('clicking Sign out calls authService.signOut and navigates to /', async () => {
      renderWithRouter(<Nav />)
      fireEvent.click(screen.getByRole('button', { name: /Sign out/i }))
      await waitFor(() => expect(authService.signOut).toHaveBeenCalledOnce())
      expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true })
    })
  })

  describe('not yet initialized', () => {
    it('shows neither Sign out nor Sign in while auth is resolving', () => {
      mockAuthState = { user: null, isAuthenticated: false, isInitialized: false }
      renderWithRouter(<Nav />)
      // isInitialized false → auth branch hidden, only unauthenticated controls shown
      expect(screen.queryByRole('button', { name: /Sign out/i })).not.toBeInTheDocument()
    })
  })
})
