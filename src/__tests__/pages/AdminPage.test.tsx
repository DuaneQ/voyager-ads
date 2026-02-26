import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Campaign } from '../../types/campaign'

const mockGetPendingCampaigns = vi.hoisted(() => vi.fn())
const mockReviewCampaign = vi.hoisted(() => vi.fn())

// ── Stub Nav ──────────────────────────────────────────────────────────────────
vi.mock('../../components/common/Nav', () => ({
  __esModule: true,
  default: () => <nav data-testid="nav" />,
}))

// ── Stub CampaignReviewCard — exposes approve/reject buttons for action tests ──
vi.mock('../../components/admin/CampaignReviewCard', () => ({
  __esModule: true,
  default: ({
    campaign,
    onApprove,
    onReject,
  }: {
    campaign: Campaign
    onApprove: (id: string) => void
    onReject: (id: string, note: string) => void
  }) => (
    <div data-testid={`campaign-card-${campaign.id}`}>
      <span>{campaign.name}</span>
      <button onClick={() => onApprove(campaign.id)}>Approve {campaign.id}</button>
      <button onClick={() => onReject(campaign.id, 'bad content')}>Reject {campaign.id}</button>
    </div>
  ),
}))

// ── Mock adminService ─────────────────────────────────────────────────────────
vi.mock('../../services/admin/adminServiceInstance', () => ({
  adminService: {
    getPendingCampaigns: mockGetPendingCampaigns,
    reviewCampaign: mockReviewCampaign,
  },
}))

import AdminPage from '../../pages/AdminPage'

// ── Helpers ───────────────────────────────────────────────────────────────────
function makeCampaign(n: number): Campaign {
  return {
    id: `camp-${n}`,
    uid: 'admin',
    name: `Campaign ${n}`,
    status: 'active',
    isUnderReview: true,
    placement: 'video_feed',
    objective: 'Awareness',
    startDate: '2025-01-01',
    endDate: '2025-12-31',
    budgetAmount: '100',
    budgetType: 'daily',
    createdAt: '2025-01-01',
    creativeName: '',
    creativeType: 'image',
    assetFile: null,
    primaryText: '',
    cta: '',
    landingUrl: '',
    businessType: '',
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
    billingModel: 'cpm',
  } as unknown as Campaign
}

function renderPage() {
  return render(
    <HelmetProvider>
      <MemoryRouter>
        <AdminPage />
      </MemoryRouter>
    </HelmetProvider>
  )
}

describe('AdminPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Suppress window.scrollTo not implemented in jsdom
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
  })

  // ── Loading state ─────────────────────────────────────────────────────────
  it('shows a loading spinner while fetching', () => {
    // Never resolve so we stay in loading state
    mockGetPendingCampaigns.mockReturnValue(new Promise(() => {}))
    renderPage()
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('hides the spinner after data loads', async () => {
    mockGetPendingCampaigns.mockResolvedValue([])
    renderPage()
    await waitFor(() => expect(screen.queryByRole('progressbar')).not.toBeInTheDocument())
  })

  // ── Empty state ───────────────────────────────────────────────────────────
  it('shows empty state when no pending campaigns', async () => {
    mockGetPendingCampaigns.mockResolvedValue([])
    renderPage()
    await waitFor(() => expect(screen.getByText(/No campaigns pending review/i)).toBeInTheDocument())
  })

  it('shows error alert when loading fails', async () => {
    mockGetPendingCampaigns.mockRejectedValue(new Error('Network error'))
    renderPage()
    await waitFor(() => expect(screen.getByText('Network error')).toBeInTheDocument())
  })

  // ── Campaign list rendering ───────────────────────────────────────────────
  it('renders a card for each pending campaign', async () => {
    mockGetPendingCampaigns.mockResolvedValue([makeCampaign(1), makeCampaign(2)])
    renderPage()
    await waitFor(() => {
      expect(screen.getByTestId('campaign-card-camp-1')).toBeInTheDocument()
      expect(screen.getByTestId('campaign-card-camp-2')).toBeInTheDocument()
    })
  })

  it('shows the campaign count summary', async () => {
    mockGetPendingCampaigns.mockResolvedValue([makeCampaign(1), makeCampaign(2)])
    renderPage()
    await waitFor(() => expect(screen.getByText(/2 campaigns pending/i)).toBeInTheDocument())
  })

  it('uses singular "campaign" when only one is pending', async () => {
    mockGetPendingCampaigns.mockResolvedValue([makeCampaign(1)])
    renderPage()
    await waitFor(() => expect(screen.getByText(/1 campaign pending/i)).toBeInTheDocument())
  })

  // ── Pagination ────────────────────────────────────────────────────────────
  it('does not render pagination when campaigns fit on one page', async () => {
    mockGetPendingCampaigns.mockResolvedValue(Array.from({ length: 5 }, (_, i) => makeCampaign(i + 1)))
    renderPage()
    await waitFor(() => expect(screen.queryByRole('navigation', { name: /pagination/i })).not.toBeInTheDocument())
  })

  it('renders pagination when campaigns exceed PAGE_SIZE (10)', async () => {
    mockGetPendingCampaigns.mockResolvedValue(Array.from({ length: 11 }, (_, i) => makeCampaign(i + 1)))
    renderPage()
    await waitFor(() => expect(screen.getByRole('navigation', { name: /pagination/i })).toBeInTheDocument())
  })

  it('shows only PAGE_SIZE campaigns on the first page', async () => {
    mockGetPendingCampaigns.mockResolvedValue(Array.from({ length: 11 }, (_, i) => makeCampaign(i + 1)))
    renderPage()
    await waitFor(() => {
      // First 10 visible, 11th on page 2
      expect(screen.getByTestId('campaign-card-camp-1')).toBeInTheDocument()
      expect(screen.getByTestId('campaign-card-camp-10')).toBeInTheDocument()
      expect(screen.queryByTestId('campaign-card-camp-11')).not.toBeInTheDocument()
    })
  })

  // ── Approve action ────────────────────────────────────────────────────────
  it('removes a campaign from the list after successful approve', async () => {
    mockGetPendingCampaigns.mockResolvedValue([makeCampaign(1), makeCampaign(2)])
    mockReviewCampaign.mockResolvedValue(undefined)
    renderPage()

    await waitFor(() => expect(screen.getByTestId('campaign-card-camp-1')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: /Approve camp-1/i }))

    await waitFor(() => {
      expect(screen.queryByTestId('campaign-card-camp-1')).not.toBeInTheDocument()
      expect(screen.getByTestId('campaign-card-camp-2')).toBeInTheDocument()
    })
  })

  it('calls reviewCampaign with approve action', async () => {
    mockGetPendingCampaigns.mockResolvedValue([makeCampaign(1)])
    mockReviewCampaign.mockResolvedValue(undefined)
    renderPage()

    await waitFor(() => expect(screen.getByTestId('campaign-card-camp-1')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: /Approve camp-1/i }))

    await waitFor(() => expect(mockReviewCampaign).toHaveBeenCalledWith('camp-1', 'approve'))
  })

  it('shows actionError alert when approve fails', async () => {
    mockGetPendingCampaigns.mockResolvedValue([makeCampaign(1)])
    mockReviewCampaign.mockRejectedValue(new Error('Failed to approve campaign.'))
    renderPage()

    await waitFor(() => expect(screen.getByTestId('campaign-card-camp-1')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: /Approve camp-1/i }))

    await waitFor(() => expect(screen.getByText('Failed to approve campaign.')).toBeInTheDocument())
  })

  // ── Reject action ─────────────────────────────────────────────────────────
  it('removes a campaign from the list after successful reject', async () => {
    mockGetPendingCampaigns.mockResolvedValue([makeCampaign(1), makeCampaign(2)])
    mockReviewCampaign.mockResolvedValue(undefined)
    renderPage()

    await waitFor(() => expect(screen.getByTestId('campaign-card-camp-1')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: /Reject camp-1/i }))

    await waitFor(() => {
      expect(screen.queryByTestId('campaign-card-camp-1')).not.toBeInTheDocument()
      expect(screen.getByTestId('campaign-card-camp-2')).toBeInTheDocument()
    })
  })

  it('calls reviewCampaign with reject action and note', async () => {
    mockGetPendingCampaigns.mockResolvedValue([makeCampaign(1)])
    mockReviewCampaign.mockResolvedValue(undefined)
    renderPage()

    await waitFor(() => expect(screen.getByTestId('campaign-card-camp-1')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: /Reject camp-1/i }))

    await waitFor(() => expect(mockReviewCampaign).toHaveBeenCalledWith('camp-1', 'reject', 'bad content'))
  })

  it('shows actionError alert when reject fails', async () => {
    mockGetPendingCampaigns.mockResolvedValue([makeCampaign(1)])
    mockReviewCampaign.mockRejectedValue(new Error('Failed to reject campaign.'))
    renderPage()

    await waitFor(() => expect(screen.getByTestId('campaign-card-camp-1')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: /Reject camp-1/i }))

    await waitFor(() => expect(screen.getByText('Failed to reject campaign.')).toBeInTheDocument())
  })
})
