import { describe, it, expect, vi } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { render } from '../../../testUtils/test-utils'
import StepReview from '../../../components/campaign/StepReview'
import { EMPTY_DRAFT } from '../../../types/campaign'

const fullDraft = {
  ...EMPTY_DRAFT,
  name: 'Summer Promo',
  placement: 'itinerary_feed' as const,
  objective: 'Traffic' as const,
  startDate: '2030-06-01',
  endDate: '2030-08-31',
  creativeName: 'Beach Banner',
  creativeType: 'image' as const,
  assetFile: null,
  primaryText: 'Discover the best beaches',
  cta: 'Book Now',
  landingUrl: 'https://example.com',
  audienceName: 'Beach Lovers',
  location: 'Sydney',
  radius: '50',
  destinationMatch: true,
  ageFrom: '25',
  ageTo: '44',
  interests: 'beach, surfing',
  budgetType: 'daily' as const,
  budgetAmount: '30',
  billingModel: 'cpc' as const,
  agreePolicy: false,
}

describe('StepReview', () => {
  it('renders the campaign name', () => {
    render(<StepReview draft={fullDraft} patch={vi.fn()} />)
    expect(screen.getByText('Summer Promo')).toBeInTheDocument()
  })

  it('renders the placement label', () => {
    render(<StepReview draft={fullDraft} patch={vi.fn()} />)
    expect(screen.getByText('Itinerary Feed')).toBeInTheDocument()
  })

  it('renders the objective', () => {
    render(<StepReview draft={fullDraft} patch={vi.fn()} />)
    expect(screen.getByText('Traffic')).toBeInTheDocument()
  })

  it('renders formatted start date', () => {
    render(<StepReview draft={fullDraft} patch={vi.fn()} />)
    // displayDate('2030-06-01') → 'Jun 1, 2030'
    expect(screen.getByText('Jun 1, 2030')).toBeInTheDocument()
  })

  it('renders formatted end date', () => {
    render(<StepReview draft={fullDraft} patch={vi.fn()} />)
    expect(screen.getByText('Aug 31, 2030')).toBeInTheDocument()
  })

  it('shows "No end date" when endDate is empty', () => {
    render(<StepReview draft={{ ...fullDraft, endDate: '' }} patch={vi.fn()} />)
    expect(screen.getByText('No end date')).toBeInTheDocument()
  })

  it('renders the creative name', () => {
    render(<StepReview draft={fullDraft} patch={vi.fn()} />)
    expect(screen.getByText('Beach Banner')).toBeInTheDocument()
  })

  it('renders the primary text', () => {
    render(<StepReview draft={fullDraft} patch={vi.fn()} />)
    // primaryText appears in both the Creative section detail row and the ad preview
    expect(screen.getAllByText('Discover the best beaches').length).toBeGreaterThanOrEqual(1)
  })

  it('renders the audience name', () => {
    render(<StepReview draft={fullDraft} patch={vi.fn()} />)
    expect(screen.getByText('Beach Lovers')).toBeInTheDocument()
  })

  it('renders the age range', () => {
    render(<StepReview draft={fullDraft} patch={vi.fn()} />)
    expect(screen.getByText('25 – 44')).toBeInTheDocument()
  })

  it('renders Daily budget type', () => {
    render(<StepReview draft={fullDraft} patch={vi.fn()} />)
    expect(screen.getByText('Daily')).toBeInTheDocument()
  })

  it('renders the budget amount with currency', () => {
    render(<StepReview draft={fullDraft} patch={vi.fn()} />)
    expect(screen.getByText('$30 USD')).toBeInTheDocument()
  })

  it('renders billing model as uppercase', () => {
    render(<StepReview draft={fullDraft} patch={vi.fn()} />)
    expect(screen.getByText('CPC')).toBeInTheDocument()
  })

  it('renders the policy checkbox unchecked by default', () => {
    render(<StepReview draft={fullDraft} patch={vi.fn()} />)
    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).not.toBeChecked()
  })

  it('calls patch with agreePolicy true when checkbox is clicked', () => {
    const patch = vi.fn()
    render(<StepReview draft={fullDraft} patch={patch} />)
    fireEvent.click(screen.getByRole('checkbox'))
    expect(patch).toHaveBeenCalledWith('agreePolicy', true)
  })

  it('renders "—" for missing optional values', () => {
    render(<StepReview draft={{ ...fullDraft, interests: '' }} patch={vi.fn()} />)
    // interests row should show em dash for empty string
    expect(screen.getAllByText('—').length).toBeGreaterThan(0)
  })

  it('opens the policy modal when Enter is pressed on the policy link', () => {
    render(<StepReview draft={fullDraft} patch={vi.fn()} />)
    const policyLink = screen.getByRole('button', { name: /TravalPass Advertising Policy/i })
    fireEvent.keyDown(policyLink, { key: 'Enter' })
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  describe('ai_slot targeting rows', () => {
    const aiDraft = {
      ...fullDraft,
      placement: 'ai_slot' as const,
      targetTripTypes: ['adventure', 'romantic'],
      targetActivityPreferences: ['Cultural', 'Nightlife'],
      targetTravelStyles: ['luxury'],
    }

    it('shows Trip types chips for ai_slot when non-empty', () => {
      render(<StepReview draft={aiDraft} patch={vi.fn()} />)
      expect(screen.getByText('Trip types')).toBeInTheDocument()
      expect(screen.getByText('adventure')).toBeInTheDocument()
      expect(screen.getByText('romantic')).toBeInTheDocument()
    })

    it('shows Activities chips for ai_slot when non-empty', () => {
      render(<StepReview draft={aiDraft} patch={vi.fn()} />)
      expect(screen.getByText('Activities')).toBeInTheDocument()
      expect(screen.getByText('Cultural')).toBeInTheDocument()
      expect(screen.getByText('Nightlife')).toBeInTheDocument()
    })

    it('shows Travel styles chips for ai_slot when non-empty', () => {
      render(<StepReview draft={aiDraft} patch={vi.fn()} />)
      expect(screen.getByText('Travel styles')).toBeInTheDocument()
      expect(screen.getByText('luxury')).toBeInTheDocument()
    })

    it('does NOT show Trip types row when array is empty', () => {
      render(<StepReview draft={{ ...aiDraft, targetTripTypes: [] }} patch={vi.fn()} />)
      expect(screen.queryByText('Trip types')).not.toBeInTheDocument()
    })

    it('does NOT show Activities row when array is empty', () => {
      render(<StepReview draft={{ ...aiDraft, targetActivityPreferences: [] }} patch={vi.fn()} />)
      expect(screen.queryByText('Activities')).not.toBeInTheDocument()
    })

    it('does NOT show Travel styles row when array is empty', () => {
      render(<StepReview draft={{ ...aiDraft, targetTravelStyles: [] }} patch={vi.fn()} />)
      expect(screen.queryByText('Travel styles')).not.toBeInTheDocument()
    })

    it('does NOT show targeting rows for non-ai_slot placement', () => {
      render(<StepReview draft={{ ...aiDraft, placement: 'itinerary_feed' }} patch={vi.fn()} />)
      expect(screen.queryByText('Trip types')).not.toBeInTheDocument()
      expect(screen.queryByText('Activities')).not.toBeInTheDocument()
      expect(screen.queryByText('Travel styles')).not.toBeInTheDocument()
    })
  })
})
