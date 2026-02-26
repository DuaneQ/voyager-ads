import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { describe, it, vi, beforeEach } from 'vitest'

vi.mock('../../../store/authStore', () => ({
  __esModule: true,
  default: vi.fn(),
}))

import useAuthStore from '../../../store/authStore'
import ProtectedRoute from '../../../components/common/ProtectedRoute'

describe('ProtectedRoute', () => {
  beforeEach(() => vi.clearAllMocks())

  it('shows loading spinner while auth initializes', () => {
    ;(useAuthStore as unknown as any).mockReturnValue({ isInitialized: false, isAuthenticated: false })

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>private</div>
        </ProtectedRoute>
      </MemoryRouter>
    )

    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('redirects unauthenticated users to /signin preserving destination', () => {
    ;(useAuthStore as unknown as any).mockReturnValue({ isInitialized: true, isAuthenticated: false })

    render(
      <MemoryRouter initialEntries={["/protected"]}>
        <Routes>
          <Route path="/signin" element={<div>signin page</div>} />
          <Route path="/protected" element={<ProtectedRoute><div>private</div></ProtectedRoute>} />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText('signin page')).toBeInTheDocument()
  })

  it('renders children for authenticated users', () => {
    ;(useAuthStore as unknown as any).mockReturnValue({ isInitialized: true, isAuthenticated: true })

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>private content</div>
        </ProtectedRoute>
      </MemoryRouter>
    )

    expect(screen.getByText('private content')).toBeInTheDocument()
  })
})
