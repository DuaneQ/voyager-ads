import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { render } from '@testing-library/react'
import { ThemeProvider } from '@mui/material/styles'
import { HelmetProvider } from 'react-helmet-async'
import theme from '../../styles/theme'
import EditCampaignPage from '../../pages/EditCampaignPage'

// ── Stubs ────────────────────────────────────────────────────────────────────
vi.mock('../../components/common/Nav', () => ({ default: () => <nav data-testid="nav" /> }))
vi.mock('../../components/campaign/EditCampaignWizard', () => ({
  default: ({ campaignId }: { campaignId: string }) => (
    <div data-testid="edit-wizard" data-campaign-id={campaignId} />
  ),
}))

function renderAtRoute(path: string) {
  return render(
    <HelmetProvider>
      <ThemeProvider theme={theme}>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path="/campaigns/:id/edit" element={<EditCampaignPage />} />
            <Route path="/dashboard" element={<div>Dashboard</div>} />
            <Route path="/campaigns/:id" element={<div>Detail</div>} />
          </Routes>
        </MemoryRouter>
      </ThemeProvider>
    </HelmetProvider>,
  )
}

describe('EditCampaignPage', () => {
  it('renders Nav and the edit wizard with the campaign ID from the URL', () => {
    renderAtRoute('/campaigns/campaign-42/edit')
    expect(screen.getByTestId('nav')).toBeInTheDocument()
    expect(screen.getByTestId('edit-wizard')).toBeInTheDocument()
    expect(screen.getByTestId('edit-wizard').getAttribute('data-campaign-id')).toBe('campaign-42')
  })

  it('renders the "Edit campaign" heading', () => {
    renderAtRoute('/campaigns/xyz/edit')
    expect(screen.getByText('Edit campaign')).toBeInTheDocument()
  })

  it('renders a back button for navigating to the campaign detail page', () => {
    renderAtRoute('/campaigns/xyz/edit')
    expect(screen.getByRole('button', { name: /Back to campaign/i })).toBeInTheDocument()
  })

  it('clicking the back button navigates to the campaign detail page', () => {
    renderAtRoute('/campaigns/campaign-99/edit')
    fireEvent.click(screen.getByRole('button', { name: /Back to campaign/i }))
    expect(screen.getByText('Detail')).toBeInTheDocument()
  })

  it('shows "Campaign not found" fallback when no id param is present', () => {
    render(
      <HelmetProvider>
        <ThemeProvider theme={theme}>
          <MemoryRouter initialEntries={['/campaigns/edit']}>
            <Routes>
              <Route path="/campaigns/edit" element={<EditCampaignPage />} />
              <Route path="/dashboard" element={<div>Dashboard</div>} />
            </Routes>
          </MemoryRouter>
        </ThemeProvider>
      </HelmetProvider>,
    )
    expect(screen.getByText('Campaign not found')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Back to dashboard/i })).toBeInTheDocument()
  })

  it('clicking "Back to dashboard" in the fallback navigates to /dashboard', () => {
    render(
      <HelmetProvider>
        <ThemeProvider theme={theme}>
          <MemoryRouter initialEntries={['/campaigns/edit']}>
            <Routes>
              <Route path="/campaigns/edit" element={<EditCampaignPage />} />
              <Route path="/dashboard" element={<div>Dashboard</div>} />
            </Routes>
          </MemoryRouter>
        </ThemeProvider>
      </HelmetProvider>,
    )
    fireEvent.click(screen.getByRole('button', { name: /Back to dashboard/i }))
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })
})
