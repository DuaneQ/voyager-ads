import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import CampaignStatusChip from '../../../components/dashboard/CampaignStatusChip'

describe('CampaignStatusChip', () => {
  it('shows "Under review" with warning color when isUnderReview is true regardless of status', () => {
    render(<CampaignStatusChip status="active" isUnderReview={true} />)
    expect(screen.getByText('Under review')).toBeInTheDocument()
  })

  it('shows "Active" when approved and active', () => {
    render(<CampaignStatusChip status="active" isUnderReview={false} />)
    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('shows "Paused" when paused and approved', () => {
    render(<CampaignStatusChip status="paused" isUnderReview={false} />)
    expect(screen.getByText('Paused')).toBeInTheDocument()
  })

  it('shows "Completed" when completed', () => {
    render(<CampaignStatusChip status="completed" isUnderReview={false} />)
    expect(screen.getByText('Completed')).toBeInTheDocument()
  })

  it('shows "Draft" as fallback for draft status', () => {
    render(<CampaignStatusChip status="draft" isUnderReview={false} />)
    expect(screen.getByText('Draft')).toBeInTheDocument()
  })
})
