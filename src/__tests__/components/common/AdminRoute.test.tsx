import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { render } from '@testing-library/react'
import AdminRoute from '../../../components/common/AdminRoute'

// ── Auth store mock ───────────────────────────────────────────────────────────
const mockAuthState = vi.hoisted(() => ({
  user: null as { uid: string } | null,
  isInitialized: true,
}))

vi.mock('../../../store/authStore', () => ({
  default: (selector: (s: typeof mockAuthState) => unknown) => selector(mockAuthState),
}))

// VITE_ADMIN_UIDS is a comma-separated list read via import.meta.env in AdminRoute
const ADMIN_UID = 'admin-uid-999'
const ADMIN_UID_2 = 'admin-uid-888'

function renderRoute(children: React.ReactNode = <div data-testid="protected">Admin Panel</div>) {
  return render(
    <MemoryRouter initialEntries={['/admin']}>
      <AdminRoute>{children}</AdminRoute>
    </MemoryRouter>,
  )
}

describe('AdminRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('VITE_ADMIN_UIDS', `${ADMIN_UID},${ADMIN_UID_2}`)
  })

  it('renders null while auth is not initialized', () => {
    mockAuthState.isInitialized = false
    mockAuthState.user = null
    const { container } = renderRoute()
    expect(container.firstChild).toBeNull()
  })

  it('redirects to "/" when user is not signed in', () => {
    mockAuthState.isInitialized = true
    mockAuthState.user = null
    renderRoute()
    expect(screen.queryByTestId('protected')).not.toBeInTheDocument()
  })

  it('redirects when user UID is not in VITE_ADMIN_UIDS', () => {
    mockAuthState.isInitialized = true
    mockAuthState.user = { uid: 'regular-user-123' }
    renderRoute()
    expect(screen.queryByTestId('protected')).not.toBeInTheDocument()
  })

  it('renders children when user UID matches first admin UID', () => {
    mockAuthState.isInitialized = true
    mockAuthState.user = { uid: ADMIN_UID }
    renderRoute()
    expect(screen.getByTestId('protected')).toBeInTheDocument()
  })

  it('renders children when user UID matches second admin UID', () => {
    mockAuthState.isInitialized = true
    mockAuthState.user = { uid: ADMIN_UID_2 }
    renderRoute()
    expect(screen.getByTestId('protected')).toBeInTheDocument()
  })

  it('redirects when VITE_ADMIN_UIDS is not set', () => {
    mockAuthState.isInitialized = true
    mockAuthState.user = { uid: 'some-uid' }
    vi.stubEnv('VITE_ADMIN_UIDS', '')
    renderRoute()
    expect(screen.queryByTestId('protected')).not.toBeInTheDocument()
  })
})
