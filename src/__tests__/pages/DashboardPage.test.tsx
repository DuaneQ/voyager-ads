import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi } from 'vitest'
import { AppAlertProvider } from '../../context/AppAlertContext'
import type { User } from 'firebase/auth'

vi.mock('../../components/common/Nav', () => ({
  __esModule: true,
  default: () => (
    <nav>
      <a href="/create-campaign">New campaign</a>
    </nav>
  ),
}))

vi.mock('../../store/authStore', () => ({
  default: (selector: (s: { user: User | null }) => unknown) =>
    selector({ user: { uid: 'test-user' } as User }),
}))

vi.mock('../../hooks/useCampaigns', () => ({
  useCampaigns: vi.fn().mockReturnValue({
    campaigns: [],
    loading: false,
    error: null,
    refetch: vi.fn(),
  }),
}))

import DashboardPage from '../../pages/DashboardPage'

function renderDashboard(initialEntries = ['/dashboard']) {
  return render(
    <AppAlertProvider>
      <MemoryRouter initialEntries={initialEntries}>
        <DashboardPage />
      </MemoryRouter>
    </AppAlertProvider>
  )
}

describe('DashboardPage', () => {
  it('renders heading', () => {
    renderDashboard()
    expect(screen.getByRole('heading', { name: /My Campaigns/i })).toBeInTheDocument()
  })

  it('renders New campaign button', () => {
    renderDashboard()
    expect(screen.getByRole('link', { name: /New campaign/i })).toBeInTheDocument()
  })

  it('shows empty state in campaign table when no campaigns', () => {
    renderDashboard()
    expect(screen.getByText(/No campaigns yet/i)).toBeInTheDocument()
  })

  it('shows loading spinner while fetching', async () => {
    const { useCampaigns } = await import('../../hooks/useCampaigns')
    vi.mocked(useCampaigns).mockReturnValueOnce({
      campaigns: [],
      loading: true,
      error: null,
      refetch: vi.fn(),
    })
    renderDashboard()
    expect(screen.getByLabelText(/Loading campaigns/i)).toBeInTheDocument()
  })

  it('shows error message and Retry button on fetch failure', async () => {
    const { useCampaigns } = await import('../../hooks/useCampaigns')
    vi.mocked(useCampaigns).mockReturnValueOnce({
      campaigns: [],
      loading: false,
      error: 'Firestore unavailable',
      refetch: vi.fn(),
    })
    renderDashboard()
    expect(screen.getByText('Firestore unavailable')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument()
  })
})
