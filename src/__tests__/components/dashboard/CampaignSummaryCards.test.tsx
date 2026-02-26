import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import CampaignSummaryCards from '../../../components/dashboard/CampaignSummaryCards'
import type { Campaign } from '../../../types/campaign'

const base: Campaign = {
  id: 'c1',
  uid: 'u1',
  name: 'Campaign A',
  placement: 'video_feed',
  objective: 'Awareness',
  startDate: '2026-03-01',
  endDate: '2026-03-31',
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
  targetDestination: '',
  targetPlaceId: '',
  targetTravelStartDate: '',
  targetTravelEndDate: '',
  targetGender: '',
  targetTripTypes: [],
  targetActivityPreferences: [],
  targetTravelStyles: [],
  budgetType: 'daily',
  budgetAmount: '100',
  billingModel: 'cpm',
  agreePolicy: true,
  status: 'draft',
  isUnderReview: true,
  createdAt: '2026-02-25T00:00:00.000Z',
  updatedAt: '2026-02-25T00:00:00.000Z',
}

describe('CampaignSummaryCards', () => {
  it('shows total campaign count', () => {
    render(<CampaignSummaryCards campaigns={[base, { ...base, id: 'c2' }]} />)
    expect(screen.getByLabelText('Total campaigns')).toHaveTextContent('2')
  })

  it('shows zero state correctly', () => {
    render(<CampaignSummaryCards campaigns={[]} />)
    expect(screen.getByLabelText('Total campaigns')).toHaveTextContent('0')
    expect(screen.getByLabelText('Total budget')).toHaveTextContent('$0')
  })

  it('counts under-review campaigns', () => {
    const approved: Campaign = { ...base, id: 'c2', isUnderReview: false, status: 'active' }
    render(<CampaignSummaryCards campaigns={[base, approved]} />)
    expect(screen.getByLabelText('Under review')).toHaveTextContent('1')
  })

  it('counts only non-under-review active campaigns as Active', () => {
    const active: Campaign = { ...base, id: 'c2', isUnderReview: false, status: 'active' }
    const paused: Campaign = { ...base, id: 'c3', isUnderReview: false, status: 'paused' }
    render(<CampaignSummaryCards campaigns={[base, active, paused]} />)
    expect(screen.getByLabelText('Active')).toHaveTextContent('1')
  })

  it('sums budgets across campaigns', () => {
    const c2: Campaign = { ...base, id: 'c2', budgetAmount: '250' }
    render(<CampaignSummaryCards campaigns={[base, c2]} />)
    // $100 + $250 = $350
    expect(screen.getByLabelText('Total budget')).toHaveTextContent('$350')
  })

  it('ignores campaigns with non-numeric budgetAmount', () => {
    const invalid: Campaign = { ...base, id: 'c2', budgetAmount: '' }
    render(<CampaignSummaryCards campaigns={[base, invalid]} />)
    expect(screen.getByLabelText('Total budget')).toHaveTextContent('$100')
  })
})
