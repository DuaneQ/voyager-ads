import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import MetricsChart, { type MetricSeries } from '../../../components/dashboard/MetricsChart'
import type { DailyMetricSnapshot } from '../../../types/metrics'

// MUI X charts renders SVG via a complex canvas pipeline; stub it so the test
// environment only cares about the data reaching the chart boundary.
vi.mock('@mui/x-charts/LineChart', () => ({
  LineChart: ({ series }: { series: { id: string; data: number[] }[] }) => (
    <div data-testid="line-chart" data-series={JSON.stringify(series.map(s => ({ id: s.id, len: s.data.length })))} />
  ),
}))

// ── Helpers ────────────────────────────────────────────────────────────────────

function makeSnapshots(n: number, base: Partial<DailyMetricSnapshot> = {}): DailyMetricSnapshot[] {
  const today = new Date()
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(today)
    d.setDate(d.getDate() - (n - 1 - i))
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return {
      date: `${year}-${month}-${day}`,
      impressions: 1000 + i * 100,
      clicks: 20 + i * 2,
      spend: 5 + i,
      ...base,
    }
  })
}

function makeSeries(id = 'camp-1', snapshots: DailyMetricSnapshot[] = []): MetricSeries {
  return { id, label: 'Test Campaign', data: snapshots }
}

describe('MetricsChart', () => {
  it('shows empty state when no series data is provided', () => {
    render(<MetricsChart series={[makeSeries()]} />)
    expect(screen.getByText(/No data yet/i)).toBeInTheDocument()
    expect(screen.getByText(/Metrics will appear here/i)).toBeInTheDocument()
    expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument()
  })

  it('shows empty state when series array is empty', () => {
    render(<MetricsChart series={[]} />)
    expect(screen.getByText(/No data yet/i)).toBeInTheDocument()
  })

  it('renders the LineChart when series has data', () => {
    const snaps = makeSnapshots(7)
    render(<MetricsChart series={[makeSeries('c1', snaps)]} />)
    expect(screen.queryByText(/No data yet/i)).not.toBeInTheDocument()
    expect(screen.getByTestId('line-chart')).toBeInTheDocument()
  })

  it('renders the chart title', () => {
    render(<MetricsChart series={[makeSeries('c1', makeSnapshots(7))]} title="Campaign Performance" />)
    expect(screen.getByText('Campaign Performance')).toBeInTheDocument()
  })

  it('renders date range toggle buttons', () => {
    render(<MetricsChart series={[]} />)
    expect(screen.getByRole('button', { name: /Last 7 days/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Last 14 days/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Last 30 days/i })).toBeInTheDocument()
  })

  it('renders metric selector defaulting to Impressions', () => {
    render(<MetricsChart series={[]} />)
    // MUI Select renders the selected value as visible text
    expect(screen.getByText('Impressions')).toBeInTheDocument()
  })

  it('passes the correct number of data points for a 30-day window', () => {
    const snaps = makeSnapshots(30)
    render(<MetricsChart series={[makeSeries('c1', snaps)]} defaultRange={30} />)
    const chart = screen.getByTestId('line-chart')
    const parsed = JSON.parse(chart.getAttribute('data-series') ?? '[]')
    expect(parsed[0].len).toBe(30)
  })

  it('limits data points to 7 when 7D range is selected', () => {
    const snaps = makeSnapshots(30)
    render(<MetricsChart series={[makeSeries('c1', snaps)]} defaultRange={7} />)
    const chart = screen.getByTestId('line-chart')
    const parsed = JSON.parse(chart.getAttribute('data-series') ?? '[]')
    expect(parsed[0].len).toBe(7)
  })

  it('switches to 14D range when button is clicked', () => {
    const snaps = makeSnapshots(30)
    render(<MetricsChart series={[makeSeries('c1', snaps)]} defaultRange={7} />)
    fireEvent.click(screen.getByRole('button', { name: /Last 14 days/i }))
    const chart = screen.getByTestId('line-chart')
    const parsed = JSON.parse(chart.getAttribute('data-series') ?? '[]')
    expect(parsed[0].len).toBe(14)
  })

  it('fills missing days with zero rather than omitting them', () => {
    // Only provide data for 2 of 7 days; the rest should be 0-filled
    const today = new Date()
    const fmt = (d: Date) => {
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${y}-${m}-${day}`
    }
    const snaps: DailyMetricSnapshot[] = [
      { date: fmt(new Date(today.getFullYear(), today.getMonth(), today.getDate())), impressions: 500, clicks: 10, spend: 3 },
      { date: fmt(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1)), impressions: 300, clicks: 6, spend: 2 },
    ]
    render(<MetricsChart series={[makeSeries('c1', snaps)]} defaultRange={7} />)
    // Chart should still render (not empty state) and have 7 data slots
    const chart = screen.getByTestId('line-chart')
    const parsed = JSON.parse(chart.getAttribute('data-series') ?? '[]')
    expect(parsed[0].len).toBe(7)
  })

  it('renders multiple series when provided', () => {
    const snaps = makeSnapshots(7)
    render(
      <MetricsChart
        series={[
          makeSeries('c1', snaps),
          makeSeries('c2', snaps),
        ]}
      />
    )
    const chart = screen.getByTestId('line-chart')
    const parsed = JSON.parse(chart.getAttribute('data-series') ?? '[]')
    expect(parsed).toHaveLength(2)
    expect(parsed[0].id).toBe('c1')
    expect(parsed[1].id).toBe('c2')
  })

  it('empty state has accessible role=status', () => {
    render(<MetricsChart series={[]} />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })
})
