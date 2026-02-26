import React, { useState, useMemo } from 'react'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import FormControl from '@mui/material/FormControl'
import { LineChart } from '@mui/x-charts/LineChart'
import ShowChartIcon from '@mui/icons-material/ShowChart'
import type { DailyMetricSnapshot, MetricKey, DateRange } from '../../types/metrics'
import { METRIC_OPTIONS } from '../../types/metrics'
import { formatDateLocal, parseLocalDate } from '../../utils/dateUtils'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MetricSeries {
  id: string
  label: string
  data: DailyMetricSnapshot[]
  color?: string
}

interface Props {
  series: MetricSeries[]
  title?: string
  defaultMetric?: MetricKey
  defaultRange?: DateRange
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Generate the last N calendar days as YYYY-MM-DD strings (oldest → newest).
 *
 * Uses formatDateLocal (getFullYear/getMonth/getDate) — never toISOString().
 * toISOString() converts to UTC first, which shifts the date for any timezone
 * behind UTC (all of the Americas). At 11pm EST, toISOString() returns tomorrow.
 */
function lastNDays(n: DateRange): string[] {
  const days: string[] = []
  const now = new Date()
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    days.push(formatDateLocal(d))
  }
  return days
}

/**
 * Format a YYYY-MM-DD string for x-axis labels (e.g. "Feb 19").
 *
 * Uses parseLocalDate (new Date(y, m-1, d)) — never new Date(isoString) on a
 * bare date, which would parse as UTC midnight and shift in negative-UTC zones.
 */
function fmtDate(iso: string): string {
  const d = parseLocalDate(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function getSnapshotValue(snap: DailyMetricSnapshot, key: MetricKey): number {
  if (key === 'ctr') {
    return snap.impressions > 0 ? (snap.clicks / snap.impressions) * 100 : 0
  }
  return snap[key] ?? 0
}

// ─── Palette ──────────────────────────────────────────────────────────────────

const DEFAULT_COLORS = ['#1976d2', '#9c27b0', '#2e7d32', '#e65100', '#00838f']

// ─── Component ────────────────────────────────────────────────────────────────

const MetricsChart: React.FC<Props> = ({
  series,
  title = 'Performance',
  defaultMetric = 'impressions',
  defaultRange = 30,
}) => {
  const [metric, setMetric] = useState<MetricKey>(defaultMetric)
  const [range, setRange] = useState<DateRange>(defaultRange)

  const dates = useMemo(() => lastNDays(range), [range])
  const xLabels = useMemo(() => dates.map(fmtDate), [dates])

  /** Map each series' snapshots onto the fixed date axis, filling gaps with 0. */
  const chartSeries = useMemo(
    () =>
      series.map((s, idx) => {
        const byDate = new Map(s.data.map((snap) => [snap.date, snap]))
        const values = dates.map((d) => {
          const snap = byDate.get(d)
          return snap ? getSnapshotValue(snap, metric) : 0
        })
        return {
          id: s.id,
          label: s.label,
          data: values,
          area: true,
          color: s.color ?? DEFAULT_COLORS[idx % DEFAULT_COLORS.length],
          showMark: false,
        }
      }),
    [series, dates, metric]
  )

  const hasAnyData = useMemo(
    () => chartSeries.some((s) => s.data.some((v) => v > 0)),
    [chartSeries]
  )

  const metricDef = METRIC_OPTIONS.find((m) => m.value === metric)!

  return (
    <Paper
      variant="outlined"
      sx={{ borderRadius: 2, p: 3, mb: 4 }}
      aria-label={`${title} chart`}
    >
      {/* ── Header ── */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 1.5,
          mb: 2.5,
        }}
      >
        <Typography variant="h6" fontWeight={600}>
          {title}
        </Typography>

        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Metric selector */}
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <Select
              value={metric}
              onChange={(e) => setMetric(e.target.value as MetricKey)}
              aria-label="Select metric"
              sx={{ fontSize: 14 }}
            >
              {METRIC_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Date range toggle */}
          <ToggleButtonGroup
            value={range}
            exclusive
            size="small"
            onChange={(_, v) => { if (v !== null) setRange(v as DateRange) }}
            aria-label="Date range"
          >
            <ToggleButton value={7} aria-label="Last 7 days">7D</ToggleButton>
            <ToggleButton value={14} aria-label="Last 14 days">14D</ToggleButton>
            <ToggleButton value={30} aria-label="Last 30 days">30D</ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>

      {/* ── Chart or empty state ── */}
      {!hasAnyData ? (
        <Box
          sx={{
            height: 240,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            bgcolor: 'action.hover',
            borderRadius: 1.5,
          }}
          role="status"
          aria-label="No metrics data available"
        >
          <ShowChartIcon sx={{ fontSize: 40, color: 'text.disabled' }} />
          <Typography variant="body2" color="text.secondary" fontWeight={500}>
            No data yet
          </Typography>
          <Typography variant="caption" color="text.disabled" textAlign="center" maxWidth={320}>
            Metrics will appear here once your campaign is live and serving impressions.
          </Typography>
        </Box>
      ) : (
        <LineChart
          xAxis={[
            {
              data: xLabels,
              scaleType: 'band',
              tickLabelStyle: { fontSize: 11 },
            },
          ]}
          yAxis={[
            {
              valueFormatter: metricDef.format,
              tickLabelStyle: { fontSize: 11 },
            },
          ]}
          series={chartSeries}
          height={260}
          sx={{
            '& .MuiLineElement-root': { strokeWidth: 2 },
            '& .MuiAreaElement-root': { fillOpacity: 0.12 },
          }}
          slotProps={{ legend: { hidden: chartSeries.length <= 1 } }}
        />
      )}
    </Paper>
  )
}

export default MetricsChart
