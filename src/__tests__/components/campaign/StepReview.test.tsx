import React from 'react'
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
    expect(screen.getByText('Discover the best beaches')).toBeInTheDocument()
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
})
