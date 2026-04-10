import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../components/common/Nav', () => ({
  __esModule: true,
  default: () => <nav data-testid="nav" />,
}))

vi.mock('../../hooks/useCampaigns', () => ({
  useCampaigns: vi.fn(),
}))

vi.mock('../../services/billing/billingServiceInstance', () => ({
  adsBillingService: {
    createCheckoutSession: vi.fn(),
  },
}))

import BillingPage from '../../pages/BillingPage'
import { useCampaigns } from '../../hooks/useCampaigns'
import { adsBillingService } from '../../services/billing/billingServiceInstance'

const baseCampaign = {
  id: 'camp-1',
  uid: 'user-1',
  name: 'Summer Promo',
  status: 'active' as const,
  paymentStatus: 'unpaid' as const,
  paymentRequiredCents: 50000,
  paymentPaidCents: undefined,
  paymentDiscountCents: undefined,
  paymentCurrency: 'usd',
  isUnderReview: false,
  placement: 'video_feed' as const,
  objective: 'Awareness' as const,
  startDate: '2025-06-01',
  endDate: '2025-08-31',
  budgetAmount: '500',
  budgetType: 'daily' as const,
  createdAt: '2025-05-01T00:00:00.000Z',
  updatedAt: '2025-05-01T00:00:00.000Z',
  creativeName: 'Banner',
  creativeType: 'image' as const,
  assetFile: null,
  assetUrl: null,
  primaryText: 'text',
  cta: 'Learn More',
  landingUrl: 'https://example.com',
  businessType: '' as const,
  address: '',
  phone: '',
  email: '',
  promoCode: '',
  audienceName: '',
  location: '',
  radius: '',
  destinationMatch: false,
  ageFrom: '',
  ageTo: '',
  interests: '',
  targetDestination: '',
  targetPlaceId: '',
  targetTravelStartDate: '',
  targetTravelEndDate: '',
  targetGender: '',
  targetTripTypes: [],
  targetActivityPreferences: [],
  targetTravelStyles: [],
  billingModel: 'cpm' as const,
  reviewNote: undefined,
  userEmail: 'owner@example.com',
}

function renderPage(path = '/billing/camp-1') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/billing/:id" element={<BillingPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('BillingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useCampaigns).mockReturnValue({
      campaigns: [baseCampaign],
      loading: false,
      error: null,
      refetch: vi.fn(),
    })
  })

  it('renders campaign payment summary', () => {
    renderPage()
    expect(screen.getByRole('heading', { name: /summer promo/i })).toBeInTheDocument()
    expect(screen.getByText(/campaign billing/i)).toBeInTheDocument()
    expect(screen.getByText(/one-time stripe checkout session/i)).toBeInTheDocument()
    expect(screen.getByText('$500.00')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /edit campaign before paying/i })).toHaveAttribute('href', '/campaigns/camp-1/edit')
  })

  it('starts checkout and redirects to the returned Stripe URL', async () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)
    vi.mocked(adsBillingService.createCheckoutSession).mockResolvedValue({
      url: 'https://checkout.stripe.com/pay/cs_test_123',
      sessionId: 'cs_test_123',
    })

    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /pay with stripe/i }))

    await waitFor(() => {
      expect(adsBillingService.createCheckoutSession).toHaveBeenCalledWith({
        campaignId: 'camp-1',
        origin: window.location.origin,
      })
    })
    expect(openSpy).toHaveBeenCalledWith('https://checkout.stripe.com/pay/cs_test_123', '_self')
    openSpy.mockRestore()
  })

  it('shows the checkout return-state message and refetches on success', () => {
    const refetch = vi.fn()
    vi.mocked(useCampaigns).mockReturnValue({
      campaigns: [baseCampaign],
      loading: false,
      error: null,
      refetch,
    })

    renderPage('/billing/camp-1?checkout=success&session_id=cs_test_456')

    expect(screen.getByText(/payment confirmation may take a few seconds/i)).toBeInTheDocument()
    expect(screen.queryByText('cs_test_456')).not.toBeInTheDocument()
    expect(refetch).toHaveBeenCalled()
  })

  it('disables payment when the campaign is already paid', () => {
    vi.mocked(useCampaigns).mockReturnValue({
      campaigns: [{
        ...baseCampaign,
        paymentStatus: 'paid',
        paymentPaidCents: 50000,
        paymentCompletedAt: '2025-05-03T12:00:00.000Z',
      }],
      loading: false,
      error: null,
      refetch: vi.fn(),
    })

    renderPage()

    expect(screen.getByRole('button', { name: /campaign funded/i })).toBeDisabled()
    expect(screen.getByText(/payment confirmed/i)).toBeInTheDocument()
  })
})