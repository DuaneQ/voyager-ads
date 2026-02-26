import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import CampaignTable from '../../../components/dashboard/CampaignTable'
import type { Campaign } from '../../../types/campaign'

// SparkLineChart renders SVG — keep tests fast and focused on table content
vi.mock('@mui/x-charts/SparkLineChart', () => ({
  SparkLineChart: () => <svg data-testid="sparkline" />,
}))

const base: Campaign = {
  id: 'c1',
  uid: 'u1',
  name: 'Summer Vibes',
  placement: 'video_feed',
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
  targetDestination: '',
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
  status: 'draft',
  isUnderReview: true,
  createdAt: '2026-02-25T00:00:00.000Z',
  updatedAt: '2026-02-25T00:00:00.000Z',
}

function renderTable(campaigns: Campaign[]) {
  return render(
    <BrowserRouter>
      <CampaignTable campaigns={campaigns} />
    </BrowserRouter>
  )
}

describe('CampaignTable', () => {
  it('renders empty state with Create campaign CTA when no campaigns', () => {
    renderTable([])
    expect(screen.getByText(/No campaigns yet/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Create campaign/i })).toBeInTheDocument()
  })

  it('renders a row for each campaign', () => {
    renderTable([base, { ...base, id: 'c2', name: 'Campaign B' }])
    expect(screen.getByText('Summer Vibes')).toBeInTheDocument()
    expect(screen.getByText('Campaign B')).toBeInTheDocument()
  })

  it('displays the human-readable placement label', () => {
    renderTable([base])
    expect(screen.getAllByText('Video Feed').length).toBeGreaterThan(0)
  })

  it('displays itinerary feed label correctly', () => {
    renderTable([{ ...base, placement: 'itinerary_feed' }])
    expect(screen.getByText('Itinerary Feed')).toBeInTheDocument()
  })

  it('displays AI Slots label correctly', () => {
    renderTable([{ ...base, placement: 'ai_slot' }])
    expect(screen.getByText('AI Slots')).toBeInTheDocument()
  })

  it('displays formatted budget', () => {
    renderTable([base])
    expect(screen.getByText('$50 / day')).toBeInTheDocument()
  })

  it('displays lifetime budget type', () => {
    renderTable([{ ...base, budgetType: 'lifetime', budgetAmount: '1000' }])
    expect(screen.getByText('$1,000 / lifetime')).toBeInTheDocument()
  })

  it('shows "Under review" status chip for isUnderReview campaigns', () => {
    renderTable([base])
    expect(screen.getByText('Under review')).toBeInTheDocument()
  })

  it('renders a sparkline for each campaign', () => {
    renderTable([base, { ...base, id: 'c2', name: 'B' }])
    expect(screen.getAllByTestId('sparkline')).toHaveLength(2)
  })

  it('shows dash for missing date range', () => {
    renderTable([{ ...base, startDate: '', endDate: '' }])
    expect(screen.getByText('—')).toBeInTheDocument()
  })
})
