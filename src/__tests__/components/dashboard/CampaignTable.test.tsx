import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import CampaignTable from '../../../components/dashboard/CampaignTable'
import type { Campaign } from '../../../types/campaign'

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

  it('shows dash for missing date range', () => {
    renderTable([{ ...base, startDate: '', endDate: '' }])
    expect(screen.getAllByText('—').length).toBeGreaterThan(0)
  })

  // ── Metrics columns: totalImpressions / totalClicks / CTR ─────────────────

  it('shows dashes for all metric columns when counters are absent', () => {
    renderTable([base]) // no totalImpressions/totalClicks
    // There should be at least 3 dash cells (Impressions, Clicks, CTR)
    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBeGreaterThanOrEqual(3)
  })

  it('displays formatted impressions and clicks from counters', () => {
    renderTable([{ ...base, isUnderReview: false, status: 'active', totalImpressions: 145637, totalClicks: 1602 }])
    expect(screen.getByText('145,637')).toBeInTheDocument()
    expect(screen.getByText('1,602')).toBeInTheDocument()
  })

  it('shows impressions and 0 clicks (not dashes) when totalImpressions is set but totalClicks is absent', () => {
    // logAdEvents only writes totalClicks when clickCount > 0; campaigns with
    // impressions but no clicks should display the impression count, not dashes.
    renderTable([{ ...base, isUnderReview: false, status: 'active', totalImpressions: 42 }])
    expect(screen.getByText('42')).toBeInTheDocument()
    expect(screen.getByText('0')).toBeInTheDocument()
    expect(screen.getByText('0.00%')).toBeInTheDocument()
  })

  it('computes and displays CTR correctly', () => {
    renderTable([{ ...base, isUnderReview: false, status: 'active', totalImpressions: 10000, totalClicks: 250 }])
    expect(screen.getByText('2.50%')).toBeInTheDocument()
  })

  it('shows dash for CTR when impressions is zero', () => {
    renderTable([{ ...base, isUnderReview: false, status: 'active', totalImpressions: 0, totalClicks: 0 }])
    // Zero impressions → CTR would be 0/0 → dash
    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBeGreaterThanOrEqual(1)
  })

  it('links campaign name to the detail page', () => {
    renderTable([base])
    const link = screen.getByRole('link', { name: /Summer Vibes/i })
    expect(link).toHaveAttribute('href', '/campaigns/c1')
  })
})
