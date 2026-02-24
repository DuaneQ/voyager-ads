import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { render } from '../../testUtils/test-utils'
import { AppAlertProvider } from '../../context/AppAlertContext'
import CreateCampaignPage from '../../pages/CreateCampaignPage'
import SignInPage from '../../pages/SignInPage'

describe('CreateCampaignPage', () => {
  it('renders the page heading', () => {
    render(
      <AppAlertProvider>
        <CreateCampaignPage />
      </AppAlertProvider>
    )
    expect(screen.getByRole('heading', { name: /Create a campaign/i })).toBeInTheDocument()
  })

  it('renders the campaign wizard stepper', () => {
    render(
      <AppAlertProvider>
        <CreateCampaignPage />
      </AppAlertProvider>
    )
    expect(screen.getByText('Details')).toBeInTheDocument()
    expect(screen.getByText('Creative')).toBeInTheDocument()
  })

  it('renders the subheading copy', () => {
    render(
      <AppAlertProvider>
        <CreateCampaignPage />
      </AppAlertProvider>
    )
    expect(screen.getByText(/actively planning trips/i)).toBeInTheDocument()
  })
})

describe('SignInPage', () => {
  it('renders the sign-in heading', () => {
    render(<SignInPage />)
    expect(screen.getByRole('heading', { name: /Sign in to TravalPass Ads/i })).toBeInTheDocument()
  })

  it('renders the coming-soon copy', () => {
    render(<SignInPage />)
    expect(screen.getByText(/coming soon/i)).toBeInTheDocument()
  })
})
