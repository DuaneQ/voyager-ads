import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { DailyMetricSnapshot } from '../../hooks/useCampaignMetrics'

// ── Stub heavy/visual child components ────────────────────────────────────────
vi.mock('../../components/common/Nav', () => ({
  __esModule: true,
  default: () => <nav data-testid="nav" />,
}))

vi.mock('../../components/dashboard/CampaignStatusChip', () => ({
  __esModule: true,
  default: ({ status }: { status: string }) => (
    <span data-testid="status-chip">{status}</span>
  ),
}))

vi.mock('../../components/dashboard/CampaignMetricsKPIs', () => ({
  __esModule: true,
  default: ({ loading }: { loading: boolean }) => (
    <div data-testid="metrics-kpis" data-loading={loading} />
  ),
}))

vi.mock('../../components/dashboard/MetricsChart', () => ({
  __esModule: true,
  default: ({ series }: { series: { id: string }[] }) => (
    <div data-testid="metrics-chart" data-series-count={series.length} />
  ),
}))

// ── Hook mocks ─────────────────────────────────────────────────────────────────
vi.mock('../../hooks/useCampaigns', () => ({
  useCampaigns: vi.fn(),
}))

vi.mock('../../hooks/useCampaignMetrics', () => ({
  useCampaignMetrics: vi.fn(),
}))

vi.mock('../../context/AppAlertContext', () => ({
  useAppAlert: () => ({ showSuccess: vi.fn(), showError: vi.fn() }),
}))

import CampaignDetailPage from '../../pages/CampaignDetailPage'
import { useCampaigns } from '../../hooks/useCampaigns'
import { useCampaignMetrics } from '../../hooks/useCampaignMetrics'

// ── Helpers ────────────────────────────────────────────────────────────────────
const baseCampaign = {
  id: 'camp-1',
  uid: 'user-1',
  name: 'Summer Promo',
  status: 'active' as const,
  isUnderReview: false,
  placement: 'video_feed' as const,
  objective: 'Awareness' as const,
  startDate: '2025-06-01',
  endDate: '2025-08-31',
  budgetAmount: '500',
  budgetType: 'daily' as const,
  createdAt: '2025-05-01',
  creativeName: 'Banner',
  creativeType: 'image' as const,
  assetFile: null,
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
}

const noMetrics: DailyMetricSnapshot[] = []

function renderPage(campaignId = 'camp-1') {
  return render(
    <MemoryRouter initialEntries={[`/campaigns/${campaignId}`]}>
      <Routes>
        <Route path="/campaigns/:id" element={<CampaignDetailPage />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('CampaignDetailPage', () => {
  beforeEach(() => {
    vi.mocked(useCampaignMetrics).mockReturnValue({ metrics: noMetrics, loading: false })
  })

  // ── Loading state ────────────────────────────────────────────────────────────
  it('shows a loading spinner while campaigns are loading', () => {
    vi.mocked(useCampaigns).mockReturnValue({ campaigns: [], loading: true, error: null, refetch: vi.fn() })
    renderPage()
    expect(screen.getByLabelText(/Loading campaign/i)).toBeInTheDocument()
  })

  it('renders Nav even during loading', () => {
    vi.mocked(useCampaigns).mockReturnValue({ campaigns: [], loading: true, error: null, refetch: vi.fn() })
    renderPage()
    expect(screen.getByTestId('nav')).toBeInTheDocument()
  })

  // ── Campaign not found ───────────────────────────────────────────────────────
  it('shows not-found message when campaign id does not match', () => {
    vi.mocked(useCampaigns).mockReturnValue({
      campaigns: [baseCampaign],
      loading: false,
      error: null,
      refetch: vi.fn(),
    })
    renderPage('non-existent-id')
    expect(screen.getByText(/Campaign not found/i)).toBeInTheDocument()
  })

  it('shows back-to-dashboard link on not-found screen', () => {
    vi.mocked(useCampaigns).mockReturnValue({
      campaigns: [],
      loading: false,
      error: null,
      refetch: vi.fn(),
    })
    renderPage('missing')
    expect(screen.getByRole('link', { name: /Back to dashboard/i })).toHaveAttribute('href', '/dashboard')
  })

  // ── Campaign details rendering ───────────────────────────────────────────────
  it('renders campaign name as heading', () => {
    vi.mocked(useCampaigns).mockReturnValue({
      campaigns: [baseCampaign],
      loading: false,
      error: null,
      refetch: vi.fn(),
    })
    renderPage()
    expect(screen.getByRole('heading', { name: /Summer Promo/i })).toBeInTheDocument()
  })

  it('renders the status chip', () => {
    vi.mocked(useCampaigns).mockReturnValue({
      campaigns: [baseCampaign],
      loading: false,
      error: null,
      refetch: vi.fn(),
    })
    renderPage()
    expect(screen.getByTestId('status-chip')).toHaveTextContent('active')
  })

  it('renders placement chip label', () => {
    vi.mocked(useCampaigns).mockReturnValue({
      campaigns: [baseCampaign],
      loading: false,
      error: null,
      refetch: vi.fn(),
    })
    renderPage()
    expect(screen.getByText('Video Feed')).toBeInTheDocument()
  })

  it('does not show rejection note for non-rejected campaigns', () => {
    vi.mocked(useCampaigns).mockReturnValue({
      campaigns: [baseCampaign],
      loading: false,
      error: null,
      refetch: vi.fn(),
    })
    renderPage()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('shows review note when campaign is paused with a note', () => {
    const rejected = { ...baseCampaign, status: 'paused' as const, isUnderReview: false, reviewNote: 'Needs revision' }
    vi.mocked(useCampaigns).mockReturnValue({
      campaigns: [rejected],
      loading: false,
      error: null,
      refetch: vi.fn(),
    })
    renderPage()
    expect(screen.getByRole('alert')).toHaveTextContent('Needs revision')
  })

  // ── Metrics display ──────────────────────────────────────────────────────────
  it('renders KPI cards', () => {
    vi.mocked(useCampaigns).mockReturnValue({
      campaigns: [baseCampaign],
      loading: false,
      error: null,
      refetch: vi.fn(),
    })
    renderPage()
    expect(screen.getByTestId('metrics-kpis')).toBeInTheDocument()
  })

  it('renders MetricsChart with one series for the campaign', () => {
    vi.mocked(useCampaigns).mockReturnValue({
      campaigns: [baseCampaign],
      loading: false,
      error: null,
      refetch: vi.fn(),
    })
    renderPage()
    expect(screen.getByTestId('metrics-chart')).toHaveAttribute('data-series-count', '1')
  })

  it('passes metrics loading state to KPI cards', () => {
    vi.mocked(useCampaigns).mockReturnValue({
      campaigns: [baseCampaign],
      loading: false,
      error: null,
      refetch: vi.fn(),
    })
    vi.mocked(useCampaignMetrics).mockReturnValue({ metrics: noMetrics, loading: true })
    renderPage()
    expect(screen.getByTestId('metrics-kpis')).toHaveAttribute('data-loading', 'true')
  })

  // ── Navigation back to dashboard ─────────────────────────────────────────────
  it('renders back-to-dashboard link when campaign is found', () => {
    vi.mocked(useCampaigns).mockReturnValue({
      campaigns: [baseCampaign],
      loading: false,
      error: null,
      refetch: vi.fn(),
    })
    renderPage()
    expect(screen.getByRole('link', { name: /All campaigns/i })).toHaveAttribute('href', '/dashboard')
  })
})
