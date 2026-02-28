import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { render } from '../../../testUtils/test-utils'
import CampaignReviewCard from '../../../components/admin/CampaignReviewCard'
import type { Campaign } from '../../../types/campaign'

// CampaignAdPreview is a heavy visual component — stub it out
vi.mock('../../../components/campaign/CampaignAdPreview', () => ({
  __esModule: true,
  default: () => <div data-testid="ad-preview" />,
}))

const BASE_CAMPAIGN: Campaign = {
  id: 'camp-1',
  uid: 'user-abc',
  name: 'Summer Escape',
  status: 'active',
  isUnderReview: true,
  placement: 'video_feed',
  objective: 'Awareness',
  startDate: '2026-06-01',
  endDate: '2026-06-30',
  billingModel: 'cpm',
  budgetType: 'daily',
  budgetAmount: '50',
  creativeName: 'Summer creative',
  creativeType: 'image',
  assetUrl: null,
  primaryText: 'Discover paradise',
  cta: 'Learn More',
  landingUrl: 'https://example.com',
  businessType: '',
  address: '',
  phone: '',
  email: '',
  promoCode: '',
  audienceName: 'Beach lovers',
  location: 'Miami, FL',
  radius: '25',
  destinationMatch: false,
  ageFrom: '18',
  ageTo: '34',
  interests: 'Travel',
  targetDestination: '',
  targetPlaceId: '',
  targetTravelStartDate: '',
  targetTravelEndDate: '',
  targetGender: '',
  targetTripTypes: [],
  targetActivityPreferences: [],
  targetTravelStyles: [],
  userEmail: 'advertiser@example.com',
  createdAt: '2026-02-01T00:00:00.000Z',
  updatedAt: '2026-02-01T00:00:00.000Z',
}

const makeHandlers = () => ({
  onApprove: vi.fn().mockResolvedValue(undefined),
  onReject: vi.fn().mockResolvedValue(undefined),
})

describe('CampaignReviewCard', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders campaign name, placement chip, and objective chip', () => {
    const h = makeHandlers()
    render(<CampaignReviewCard campaign={BASE_CAMPAIGN} {...h} />)
    expect(screen.getByText('Summer Escape')).toBeInTheDocument()
    expect(screen.getByText('Video Feed')).toBeInTheDocument()
    expect(screen.getByText('Awareness')).toBeInTheDocument()
  })

  it('renders Approve and Reject buttons', () => {
    const h = makeHandlers()
    render(<CampaignReviewCard campaign={BASE_CAMPAIGN} {...h} />)
    expect(screen.getByRole('button', { name: /Approve/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Reject/i })).toBeInTheDocument()
  })

  it('calls onApprove with campaign id when Approve is clicked', async () => {
    const h = makeHandlers()
    render(<CampaignReviewCard campaign={BASE_CAMPAIGN} {...h} />)
    fireEvent.click(screen.getByRole('button', { name: /Approve/i }))
    await waitFor(() => expect(h.onApprove).toHaveBeenCalledWith('camp-1'))
  })

  it('shows rejection form when Reject is clicked', () => {
    const h = makeHandlers()
    render(<CampaignReviewCard campaign={BASE_CAMPAIGN} {...h} />)
    fireEvent.click(screen.getByRole('button', { name: /Reject/i }))
    expect(screen.getByLabelText(/Rejection note/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Confirm reject/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument()
  })

  it('"Confirm reject" is disabled when rejection note is empty', () => {
    const h = makeHandlers()
    render(<CampaignReviewCard campaign={BASE_CAMPAIGN} {...h} />)
    fireEvent.click(screen.getByRole('button', { name: /Reject/i }))
    expect(screen.getByRole('button', { name: /Confirm reject/i })).toBeDisabled()
  })

  it('calls onReject with id and note when confirm is clicked', async () => {
    const h = makeHandlers()
    render(<CampaignReviewCard campaign={BASE_CAMPAIGN} {...h} />)
    fireEvent.click(screen.getByRole('button', { name: /Reject/i }))
    fireEvent.change(screen.getByLabelText(/Rejection note/i), { target: { value: 'Content policy' } })
    fireEvent.click(screen.getByRole('button', { name: /Confirm reject/i }))
    await waitFor(() => expect(h.onReject).toHaveBeenCalledWith('camp-1', 'Content policy'))
  })

  it('cancelling rejection form returns to Approve/Reject buttons', () => {
    const h = makeHandlers()
    render(<CampaignReviewCard campaign={BASE_CAMPAIGN} {...h} />)
    fireEvent.click(screen.getByRole('button', { name: /Reject/i }))
    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }))
    expect(screen.getByRole('button', { name: /Approve/i })).toBeInTheDocument()
    expect(screen.queryByLabelText(/Rejection note/i)).not.toBeInTheDocument()
  })

  it('shows an error alert when onApprove throws', async () => {
    const h = {
      onApprove: vi.fn().mockRejectedValue(new Error('Permission denied')),
      onReject: vi.fn(),
    }
    render(<CampaignReviewCard campaign={BASE_CAMPAIGN} {...h} />)
    fireEvent.click(screen.getByRole('button', { name: /Approve/i }))
    await waitFor(() => expect(screen.getByText('Permission denied')).toBeInTheDocument())
  })

  it('toggles ad preview visibility', () => {
    const h = makeHandlers()
    render(<CampaignReviewCard campaign={BASE_CAMPAIGN} {...h} />)
    expect(screen.queryByTestId('ad-preview')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Show ad preview/i }))
    expect(screen.getByRole('button', { name: /Hide preview/i })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Hide preview/i }))
    expect(screen.getByRole('button', { name: /Show ad preview/i })).toBeInTheDocument()
  })

  it('shows advertiser email and UID rows', () => {
    const h = makeHandlers()
    render(<CampaignReviewCard campaign={BASE_CAMPAIGN} {...h} />)
    expect(screen.getByText('advertiser@example.com')).toBeInTheDocument()
    expect(screen.getByText('user-abc')).toBeInTheDocument()
  })

  it('renders image asset when assetUrl is set and creativeType is image', () => {
    const h = makeHandlers()
    const campaign = { ...BASE_CAMPAIGN, assetUrl: 'https://cdn.example.com/banner.jpg', creativeType: 'image' as const }
    render(<CampaignReviewCard campaign={campaign} {...h} />)
    expect(screen.getByRole('img', { name: /Ad creative/i })).toHaveAttribute('src', 'https://cdn.example.com/banner.jpg')
  })

  it('renders no raw video link when assetUrl is set and creativeType is video (video is watched via the ad preview)', () => {
    const h = makeHandlers()
    const campaign = { ...BASE_CAMPAIGN, assetUrl: 'https://cdn.example.com/video.mp4', creativeType: 'video' as const }
    render(<CampaignReviewCard campaign={campaign} {...h} />)
    expect(screen.queryByRole('link', { name: /View video asset/i })).not.toBeInTheDocument()
    // The "Show ad preview" toggle is present so the reviewer can watch in-frame
    expect(screen.getByRole('button', { name: /show ad preview/i })).toBeInTheDocument()
  })

  it('shows ai_slot specific fields for ai_slot placement', () => {
    const h = makeHandlers()
    const campaign = {
      ...BASE_CAMPAIGN,
      placement: 'ai_slot' as const,
      businessType: 'Restaurant',
      address: '5 Rue de Rivoli',
      phone: '+1-800-555-0199',
      email: 'info@biz.com',
      promoCode: 'SAVE10',
    }
    render(<CampaignReviewCard campaign={campaign} {...h} />)
    expect(screen.getByText('Restaurant')).toBeInTheDocument()
    expect(screen.getByText('5 Rue de Rivoli')).toBeInTheDocument()
    expect(screen.getByText('SAVE10')).toBeInTheDocument()
  })

  it('shows itinerary_feed targeting rows for itinerary_feed placement', () => {
    const h = makeHandlers()
    const campaign = {
      ...BASE_CAMPAIGN,
      placement: 'itinerary_feed' as const,
      targetDestination: 'Paris, France',
      targetTravelStartDate: '2026-07-01',
      targetTravelEndDate: '2026-07-14',
      targetGender: 'female',
    }
    render(<CampaignReviewCard campaign={campaign} {...h} />)
    expect(screen.getByText('Paris, France')).toBeInTheDocument()
    expect(screen.getByText('female')).toBeInTheDocument()
  })
})
