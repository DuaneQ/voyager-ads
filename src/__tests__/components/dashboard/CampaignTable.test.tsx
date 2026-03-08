import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
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

function renderTableWithToggle(campaigns: Campaign[], onToggleStatus: (c: Campaign) => Promise<void>) {
  return render(
    <BrowserRouter>
      <CampaignTable campaigns={campaigns} onToggleStatus={onToggleStatus} />
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

  // ── Remaining column ────────────────────────────────────────────────────────

  it('renders a "Remaining" column header', () => {
    renderTable([base])
    expect(screen.getByText('Remaining')).toBeInTheDocument()
  })

  it('shows "—" in Remaining cell when budgetCents is undefined', () => {
    renderTable([{ ...base, budgetCents: undefined }])
    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBeGreaterThanOrEqual(1)
  })

  it('shows formatted value in Remaining cell when budgetCents is set', () => {
    renderTable([{ ...base, budgetCents: 4991 }])
    expect(screen.getByText('$49.91')).toBeInTheDocument()
  })

  it('shows "$0.00" in Remaining cell when budgetCents is 0', () => {
    renderTable([{ ...base, budgetCents: 0 }])
    expect(screen.getByText('$0.00')).toBeInTheDocument()
  })

  // ── Pause / Resume actions ───────────────────────────────────────────────────

  it('does not show Pause/Resume buttons when onToggleStatus is not provided', () => {
    renderTable([{ ...base, status: 'active', isUnderReview: false }])
    expect(screen.queryByRole('button', { name: /Pause/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Resume/i })).not.toBeInTheDocument()
  })

  it('shows Pause button for active campaign when onToggleStatus is provided', () => {
    const onToggle = vi.fn().mockResolvedValue(undefined)
    renderTableWithToggle([{ ...base, status: 'active', isUnderReview: false }], onToggle)
    expect(screen.getByRole('button', { name: /Pause/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Resume/i })).not.toBeInTheDocument()
  })

  it('shows Resume button for paused campaign when onToggleStatus is provided', () => {
    const onToggle = vi.fn().mockResolvedValue(undefined)
    renderTableWithToggle([{ ...base, status: 'paused', isUnderReview: false }], onToggle)
    expect(screen.getByRole('button', { name: /Resume/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Pause/i })).not.toBeInTheDocument()
  })

  it('calls onToggleStatus with the campaign when Pause is clicked', () => {
    const onToggle = vi.fn().mockResolvedValue(undefined)
    const campaign = { ...base, status: 'active' as const, isUnderReview: false }
    renderTableWithToggle([campaign], onToggle)
    fireEvent.click(screen.getByRole('button', { name: /Pause/i }))
    expect(onToggle).toHaveBeenCalledWith(campaign)
  })

  it('calls onToggleStatus with the campaign when Resume is clicked', () => {
    const onToggle = vi.fn().mockResolvedValue(undefined)
    const campaign = { ...base, status: 'paused' as const, isUnderReview: false }
    renderTableWithToggle([campaign], onToggle)
    fireEvent.click(screen.getByRole('button', { name: /Resume/i }))
    expect(onToggle).toHaveBeenCalledWith(campaign)
  })

  it('does not show Pause/Resume for under-review campaign even with onToggleStatus', () => {
    const onToggle = vi.fn().mockResolvedValue(undefined)
    renderTableWithToggle([{ ...base, status: 'active', isUnderReview: true }], onToggle)
    expect(screen.queryByRole('button', { name: /Pause/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Resume/i })).not.toBeInTheDocument()
  })
})
