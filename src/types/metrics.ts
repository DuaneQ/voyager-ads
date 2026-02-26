/**
 * Metrics types for the Voyager Ads campaign analytics system.
 *
 * Data model (for future tracking wiring):
 *   Firestore path: ads_campaigns/{campaignId}/daily_metrics/{YYYY-MM-DD}
 *   Each document contains one DailyMetricSnapshot.
 *
 * Metric relevance by placement:
 *   video_feed      → impressions, clicks, views, completions, spend
 *   itinerary_feed  → impressions, clicks, spend
 *   ai_slot         → impressions, clicks, spend
 */

// ─── Raw time-series snapshot ─────────────────────────────────────────────────

export interface DailyMetricSnapshot {
  date: string        // YYYY-MM-DD
  impressions: number
  clicks: number
  /** video_feed only: 3-second+ views */
  views?: number
  /** video_feed only: full watches to completion */
  completions?: number
  spend: number       // USD actually spent that day
}

// ─── Aggregated KPI row (computed from DailyMetricSnapshot[]) ────────────────

export interface CampaignMetricsSummary {
  impressions: number
  clicks: number
  /** Click-through rate — percentage (0–100) */
  ctr: number
  /** Cost per 1 000 impressions in USD */
  cpm: number
  /** Cost per click in USD (Infinity / shown as '—' when clicks = 0) */
  cpc: number
  /** Total USD spent */
  spend: number
  // ── Video Feed-specific ───────────────────────────────────────────────────
  /** 3-second+ views (video_feed only) */
  views?: number
  /** View rate — views / impressions × 100 (video_feed only) */
  viewRate?: number
  /** Complete watches (video_feed only) */
  completions?: number
  /** Completion rate — completions / views × 100 (video_feed only) */
  completionRate?: number
  /** Cost per view in USD (video_feed only) */
  cpv?: number
}

// ─── Chart selectors ──────────────────────────────────────────────────────────

export type MetricKey = 'impressions' | 'clicks' | 'ctr' | 'spend'
export type DateRange = 7 | 14 | 30

export const METRIC_OPTIONS: { value: MetricKey; label: string; format: (n: number) => string }[] = [
  {
    value: 'impressions',
    label: 'Impressions',
    format: (n) => new Intl.NumberFormat('en-US').format(Math.round(n)),
  },
  {
    value: 'clicks',
    label: 'Clicks',
    format: (n) => new Intl.NumberFormat('en-US').format(Math.round(n)),
  },
  {
    value: 'ctr',
    label: 'CTR (%)',
    format: (n) => `${n.toFixed(2)}%`,
  },
  {
    value: 'spend',
    label: 'Spend ($)',
    format: (n) =>
      new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n),
  },
]

// ─── Placement-specific metric definitions ────────────────────────────────────

export interface KpiDefinition {
  key: keyof CampaignMetricsSummary
  label: string
  /** Format a numeric value for display */
  format: (n: number) => string
  tooltip: string
}

export const UNIVERSAL_KPIS: KpiDefinition[] = [
  {
    key: 'impressions',
    label: 'Impressions',
    format: (n) => new Intl.NumberFormat('en-US').format(Math.round(n)),
    tooltip: 'Number of times your ad was shown.',
  },
  {
    key: 'clicks',
    label: 'Clicks',
    format: (n) => new Intl.NumberFormat('en-US').format(Math.round(n)),
    tooltip: 'Number of times someone clicked your ad.',
  },
  {
    key: 'ctr',
    label: 'CTR',
    format: (n) => `${n.toFixed(2)}%`,
    tooltip: 'Click-through rate: clicks ÷ impressions.',
  },
  {
    key: 'cpm',
    label: 'CPM',
    format: (n) =>
      new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n),
    tooltip: 'Cost per 1 000 impressions.',
  },
  {
    key: 'cpc',
    label: 'CPC',
    format: (n) =>
      n === Infinity || isNaN(n)
        ? '—'
        : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n),
    tooltip: 'Average cost per click.',
  },
  {
    key: 'spend',
    label: 'Spend',
    format: (n) =>
      new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n),
    tooltip: 'Total amount spent.',
  },
]

export const VIDEO_FEED_KPIS: KpiDefinition[] = [
  ...UNIVERSAL_KPIS,
  {
    key: 'views',
    label: 'Views',
    format: (n) => new Intl.NumberFormat('en-US').format(Math.round(n)),
    tooltip: '3-second+ video watches.',
  },
  {
    key: 'viewRate',
    label: 'View Rate',
    format: (n) => `${n.toFixed(2)}%`,
    tooltip: 'Percentage of impressions that became views.',
  },
  {
    key: 'completions',
    label: 'Completions',
    format: (n) => new Intl.NumberFormat('en-US').format(Math.round(n)),
    tooltip: 'Number of times the video was watched in full.',
  },
  {
    key: 'completionRate',
    label: 'Completion Rate',
    format: (n) => `${n.toFixed(2)}%`,
    tooltip: 'Percentage of views that reached 100%.',
  },
  {
    key: 'cpv',
    label: 'CPV',
    format: (n) =>
      n === Infinity || isNaN(n)
        ? '—'
        : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 3 }).format(n),
    tooltip: 'Average cost per video view.',
  },
]

/** Returns the KPI definitions for a given placement. */
export function getKpisForPlacement(placement: string): KpiDefinition[] {
  return placement === 'video_feed' ? VIDEO_FEED_KPIS : UNIVERSAL_KPIS
}

// ─── Utility: compute summary from snapshots ─────────────────────────────────

export function computeSummary(snapshots: DailyMetricSnapshot[]): CampaignMetricsSummary {
  const totals = snapshots.reduce(
    (acc, s) => ({
      impressions: acc.impressions + s.impressions,
      clicks: acc.clicks + s.clicks,
      views: acc.views + (s.views ?? 0),
      completions: acc.completions + (s.completions ?? 0),
      spend: acc.spend + s.spend,
    }),
    { impressions: 0, clicks: 0, views: 0, completions: 0, spend: 0 }
  )

  const ctr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0
  const cpm = totals.impressions > 0 ? (totals.spend / totals.impressions) * 1000 : 0
  const cpc = totals.clicks > 0 ? totals.spend / totals.clicks : Infinity
  const viewRate = totals.impressions > 0 ? (totals.views / totals.impressions) * 100 : 0
  const completionRate = totals.views > 0 ? (totals.completions / totals.views) * 100 : 0
  const cpv = totals.views > 0 ? totals.spend / totals.views : Infinity

  return {
    impressions: totals.impressions,
    clicks: totals.clicks,
    ctr,
    cpm,
    cpc,
    spend: totals.spend,
    views: totals.views,
    viewRate,
    completions: totals.completions,
    completionRate,
    cpv,
  }
}
