import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithRouter } from '../../../testUtils/test-utils'
import EditCampaignWizard from '../../../components/campaign/EditCampaignWizard'
import type { Campaign } from '../../../types/campaign'
import { EMPTY_DRAFT } from '../../../types/campaign'

// ── Wizard step sub-component stubs ─────────────────────────────────────────
vi.mock('../../../components/campaign/StepDetails', () => ({
  default: () => <div data-testid="step-details" />,
}))
vi.mock('../../../components/campaign/StepCreative', () => ({
  default: () => <div data-testid="step-creative" />,
}))
vi.mock('../../../components/campaign/StepTargeting', () => ({
  default: () => <div data-testid="step-targeting" />,
}))
vi.mock('../../../components/campaign/StepBudget', () => ({
  default: () => <div data-testid="step-budget" />,
}))
vi.mock('../../../components/campaign/StepReview', () => ({
  default: () => <div data-testid="step-review" />,
}))

vi.mock('../../../context/AppAlertContext', () => ({
  useAppAlert: () => ({ showError: vi.fn(), showSuccess: vi.fn() }),
}))

// ── Hook mock ─────────────────────────────────────────────────────────────────
const mockHook = vi.hoisted(() => vi.fn())

vi.mock('../../../hooks/useEditCampaign', () => ({
  useEditCampaign: (...args: unknown[]) => mockHook(...args),
}))

// ── Base hook return value ─────────────────────────────────────────────────────
function makeHookReturn(overrides: Record<string, unknown> = {}) {
  return {
    step: 0,
    draft: { ...EMPTY_DRAFT, name: 'Summer Escape', placement: 'itinerary_feed', creativeName: 'Banner', audienceName: 'Travelers', targetDestination: 'Bali', budgetAmount: '50', agreePolicy: false },
    patch: vi.fn(),
    next: vi.fn(),
    back: vi.fn(),
    goTo: vi.fn(),
    submit: vi.fn(),
    reset: vi.fn(),
    submitted: false,
    submitError: null,
    isUploading: false,
    uploadProgress: 0,
    campaign: undefined as Campaign | undefined,
    campaignLoading: false,
    ...overrides,
  }
}

function makeCampaign(overrides: Partial<Campaign> = {}): Campaign {
  return {
    id: 'c1',
    uid: 'user-1',
    name: 'Summer Escape',
    placement: 'itinerary_feed',
    objective: 'Awareness',
    startDate: '2026-06-01',
    endDate: '2026-06-30',
    creativeName: 'Banner',
    creativeType: 'image',
    assetUrl: null,
    primaryText: '',
    cta: 'Learn More',
    landingUrl: '',
    businessType: '',
    address: '',
    phone: '',
    email: '',
    promoCode: '',
    audienceName: 'Travelers',
    location: 'Paris',
    radius: '',
    destinationMatch: false,
    ageFrom: '18',
    ageTo: '34',
    interests: '',
    targetDestination: 'Bali',
    targetPlaceId: '',
    targetTravelStartDate: '',
    targetTravelEndDate: '',
    targetGender: '',
    targetTripTypes: [],
    targetActivityPreferences: [],
    targetTravelStyles: [],
    budgetType: 'daily',
    budgetAmount: '50',
    billingModel: 'cpm',
    agreePolicy: true,
    userEmail: 'u@test.com',
    status: 'paused',
    isUnderReview: false,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-02T00:00:00Z',
    ...overrides,
  }
}

describe('EditCampaignWizard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows a loading spinner while campaign is loading', () => {
    mockHook.mockReturnValue(makeHookReturn({ campaignLoading: true }))
    renderWithRouter(<EditCampaignWizard campaignId="c1" />)
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('shows "Campaign not found" when campaign is undefined and not loading', () => {
    mockHook.mockReturnValue(makeHookReturn({ campaign: undefined, campaignLoading: false }))
    renderWithRouter(<EditCampaignWizard campaignId="c1" />)
    expect(screen.getByText('Campaign not found')).toBeInTheDocument()
  })

  it('shows "not editable" info when campaign is under review', () => {
    mockHook.mockReturnValue(makeHookReturn({
      campaign: makeCampaign({ isUnderReview: true }),
    }))
    renderWithRouter(<EditCampaignWizard campaignId="c1" />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText(/currently under review/i)).toBeInTheDocument()
  })

  it('renders the wizard for an active, non-under-review campaign', () => {
    mockHook.mockReturnValue(makeHookReturn({
      campaign: makeCampaign({ status: 'active', isUnderReview: false }),
    }))
    renderWithRouter(<EditCampaignWizard campaignId="c1" />)
    expect(screen.getByTestId('edit-campaign-wizard')).toBeInTheDocument()
  })

  it('shows "not editable" when campaign status is completed', () => {
    mockHook.mockReturnValue(makeHookReturn({
      campaign: makeCampaign({ status: 'completed', isUnderReview: false }),
    }))
    renderWithRouter(<EditCampaignWizard campaignId="c1" />)
    expect(screen.getByText(/Completed campaigns cannot be edited/i)).toBeInTheDocument()
  })

  it('renders the wizard for a paused, non-under-review campaign', () => {
    mockHook.mockReturnValue(makeHookReturn({
      campaign: makeCampaign({ status: 'paused', isUnderReview: false }),
    }))
    renderWithRouter(<EditCampaignWizard campaignId="c1" />)
    expect(screen.getByTestId('edit-campaign-wizard')).toBeInTheDocument()
    expect(screen.getByTestId('step-details')).toBeInTheDocument()
  })

  it('renders the wizard for a draft campaign', () => {
    mockHook.mockReturnValue(makeHookReturn({
      campaign: makeCampaign({ status: 'draft', isUnderReview: false }),
    }))
    renderWithRouter(<EditCampaignWizard campaignId="c1" />)
    expect(screen.getByTestId('edit-campaign-wizard')).toBeInTheDocument()
  })

  it('shows the review note alert when campaign has a reviewNote', () => {
    mockHook.mockReturnValue(makeHookReturn({
      campaign: makeCampaign({ status: 'paused', isUnderReview: false, reviewNote: 'Fix the image' }),
    }))
    renderWithRouter(<EditCampaignWizard campaignId="c1" />)
    expect(screen.getByText('Fix the image')).toBeInTheDocument()
    expect(screen.getByText(/Review note/i)).toBeInTheDocument()
  })

  it('submit button shows "Save & resubmit for review" on last step', () => {
    mockHook.mockReturnValue(makeHookReturn({
      campaign: makeCampaign(),
      step: 4,
      draft: { ...EMPTY_DRAFT, agreePolicy: true },
    }))
    renderWithRouter(<EditCampaignWizard campaignId="c1" />)
    expect(screen.getByRole('button', { name: /Save & resubmit for review/i })).toBeInTheDocument()
  })

  it('shows Next button (not submit) on non-last steps', () => {
    mockHook.mockReturnValue(makeHookReturn({
      campaign: makeCampaign(),
      step: 0,
    }))
    renderWithRouter(<EditCampaignWizard campaignId="c1" />)
    expect(screen.getByRole('button', { name: /Next/i })).toBeInTheDocument()
    expect(screen.queryByText(/resubmit/i)).not.toBeInTheDocument()
  })

  it('shows upload progress bar and disabled button while uploading', () => {
    mockHook.mockReturnValue(makeHookReturn({
      campaign: makeCampaign(),
      step: 4,
      draft: { ...EMPTY_DRAFT, agreePolicy: true },
      isUploading: true,
      uploadProgress: 60,
    }))
    renderWithRouter(<EditCampaignWizard campaignId="c1" />)
    expect(screen.getByText(/Uploading.*60%/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Uploading/i })).toBeDisabled()
  })

  it('Back button is disabled on first step', () => {
    mockHook.mockReturnValue(makeHookReturn({
      campaign: makeCampaign(),
      step: 0,
    }))
    renderWithRouter(<EditCampaignWizard campaignId="c1" />)
    expect(screen.getByRole('button', { name: /Back/i })).toBeDisabled()
  })
})
