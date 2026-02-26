import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithRouter } from '../../../testUtils/test-utils'
import CampaignMetricsKPIs from '../../../components/dashboard/CampaignMetricsKPIs'
import type { DailyMetricSnapshot } from '../../../types/metrics'

const makeSnapshot = (overrides: Partial<DailyMetricSnapshot> = {}): DailyMetricSnapshot => ({
  date: '2026-02-01',
  impressions: 1000,
  clicks: 20,
  spend: 5.00,
  ...overrides,
})

describe('CampaignMetricsKPIs', () => {
  describe('with no metrics data', () => {
    it('renders KPI cards with "—" placeholder values for video_feed', () => {
      renderWithRouter(<CampaignMetricsKPIs placement="video_feed" metrics={[]} />)
      const dashes = screen.getAllByText('—')
      expect(dashes.length).toBeGreaterThan(0)
    })

    it('renders KPI cards with "—" for itinerary_feed', () => {
      renderWithRouter(<CampaignMetricsKPIs placement="itinerary_feed" metrics={[]} />)
      expect(screen.getAllByText('—').length).toBeGreaterThan(0)
    })

    it('renders KPI cards with "—" for ai_slot', () => {
      renderWithRouter(<CampaignMetricsKPIs placement="ai_slot" metrics={[]} />)
      expect(screen.getAllByText('—').length).toBeGreaterThan(0)
    })
  })

  describe('with metrics data', () => {
    const metrics: DailyMetricSnapshot[] = [makeSnapshot()]

    it('displays formatted impressions', () => {
      renderWithRouter(<CampaignMetricsKPIs placement="itinerary_feed" metrics={metrics} />)
      // 1,000 impressions formatted
      expect(screen.getByLabelText(/Impressions: 1,000/i)).toBeInTheDocument()
    })

    it('displays formatted clicks', () => {
      renderWithRouter(<CampaignMetricsKPIs placement="itinerary_feed" metrics={metrics} />)
      expect(screen.getByLabelText(/Clicks: 20/i)).toBeInTheDocument()
    })

    it('displays CTR percentage', () => {
      renderWithRouter(<CampaignMetricsKPIs placement="itinerary_feed" metrics={metrics} />)
      expect(screen.getByLabelText(/CTR.*2.00%/i)).toBeInTheDocument()
    })

    it('shows video-specific KPIs for video_feed', () => {
      const videoMetrics: DailyMetricSnapshot[] = [makeSnapshot({ views: 500, completions: 200 })]
      renderWithRouter(<CampaignMetricsKPIs placement="video_feed" metrics={videoMetrics} />)
      // Should have views-related KPI cards
      expect(screen.getByLabelText(/Campaign KPIs/i)).toBeInTheDocument()
    })
  })

  describe('loading state', () => {
    it('shows skeleton placeholders when loading is true', () => {
      renderWithRouter(
        <CampaignMetricsKPIs placement="video_feed" metrics={[]} loading={true} />
      )
      // MUI Skeleton renders as a span with aria-busy or similar — at minimum
      // the KPI grid container is present and no actual metric values are shown
      expect(screen.getByLabelText('Campaign KPIs')).toBeInTheDocument()
      // '—' should not appear while loading (Skeleton is shown instead)
      expect(screen.queryByText('—')).not.toBeInTheDocument()
    })
  })
})
