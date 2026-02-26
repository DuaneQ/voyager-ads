import React, { useEffect, useMemo } from 'react'
import { useParams, Link as RouterLink, useLocation } from 'react-router-dom'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import Typography from '@mui/material/Typography'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import Nav from '../components/common/Nav'
import CampaignStatusChip from '../components/dashboard/CampaignStatusChip'
import CampaignMetricsKPIs from '../components/dashboard/CampaignMetricsKPIs'
import MetricsChart from '../components/dashboard/MetricsChart'
import { useCampaigns } from '../hooks/useCampaigns'
import { useCampaignMetrics } from '../hooks/useCampaignMetrics'
import { useAppAlert } from '../context/AppAlertContext'
import type { Placement } from '../types/campaign'
import { displayDate } from '../utils/dateUtils'

const PLACEMENT_LABELS: Record<Placement, string> = {
  video_feed:     'Video Feed',
  itinerary_feed: 'Itinerary Feed',
  ai_slot:        'AI Slots',
}

// Re-use the centralized displayDate from dateUtils rather than inlining
// new Date(d + 'T00:00:00') — keeps all date display logic in one auditable place.
const formatDate = displayDate

function formatBudget(amount: string, type: string): string {
  const n = parseFloat(amount)
  if (isNaN(n)) return '—'
  const f = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n)
  return `${f} / ${type === 'daily' ? 'day' : 'lifetime'}`
}

const CampaignDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { campaigns, loading: campaignsLoading } = useCampaigns()
  const { showSuccess } = useAppAlert()
  const location = useLocation()

  // Show success banner when returning from a successful edit
  useEffect(() => {
    const state = location.state as { edited?: boolean } | null
    if (state?.edited) {
      showSuccess('Campaign saved! It is now under review.')
      window.history.replaceState({}, '')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const campaign = useMemo(
    () => campaigns.find((c) => c.id === id),
    [campaigns, id]
  )

  const { metrics, loading: metricsLoading } = useCampaignMetrics(campaign?.id)

  // Build a single-series array for the chart
  const chartSeries = useMemo(
    () =>
      campaign
        ? [{ id: campaign.id, label: campaign.name, data: metrics }]
        : [],
    [campaign, metrics]
  )

  if (campaignsLoading) {
    return (
      <>
        <Nav />
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress aria-label="Loading campaign" />
        </Box>
      </>
    )
  }

  if (!campaign) {
    return (
      <>
        <Nav />
        <Box sx={{ maxWidth: 800, mx: 'auto', px: 3, py: 8, textAlign: 'center' }}>
          <Typography variant="h5" gutterBottom>Campaign not found</Typography>
          <Typography color="text.secondary" mb={3}>
            This campaign may have been removed or you don't have access to it.
          </Typography>
          <Button
            component={RouterLink}
            to="/dashboard"
            variant="outlined"
            startIcon={<ArrowBackIcon />}
          >
            Back to dashboard
          </Button>
        </Box>
      </>
    )
  }

  return (
    <>
      <Nav />
      <Box
        component="main"
        sx={{ maxWidth: 1200, mx: 'auto', px: 3, py: 5 }}
        aria-label={`Campaign detail: ${campaign.name}`}
      >
        {/* ── Back link ── */}
        <Button
          component={RouterLink}
          to="/dashboard"
          startIcon={<ArrowBackIcon />}
          sx={{ mb: 2 }}
          size="small"
        >
          All campaigns
        </Button>

        {/* ── Campaign header ── */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 0.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
              <Typography variant="h2" fontWeight={700} lineHeight={1.2}>
                {campaign.name}
              </Typography>
              <CampaignStatusChip
                status={campaign.status}
                isUnderReview={campaign.isUnderReview}
              />
            </Box>
            {!campaign.isUnderReview && (campaign.status === 'paused' || campaign.status === 'draft') && (
              <Button
                component={RouterLink}
                to={`/campaigns/${campaign.id}/edit`}
                variant="outlined"
                size="small"
                startIcon={<EditOutlinedIcon />}
                aria-label={`Edit campaign: ${campaign.name}`}
              >
                Edit campaign
              </Button>
            )}
          </Box>

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1.5 }}>
            <Chip
              label={PLACEMENT_LABELS[campaign.placement] ?? campaign.placement}
              size="small"
              variant="outlined"
            />
            <Chip label={campaign.objective} size="small" variant="outlined" />
            <Chip
              label={`${formatDate(campaign.startDate)} – ${formatDate(campaign.endDate)}`}
              size="small"
              variant="outlined"
            />
            <Chip
              label={formatBudget(campaign.budgetAmount, campaign.budgetType)}
              size="small"
              variant="outlined"
            />
          </Box>

          {/* Rejection note (if any) */}
          {!campaign.isUnderReview && campaign.status === 'paused' && campaign.reviewNote && (
            <Box
              sx={{
                mt: 2,
                p: 2,
                bgcolor: 'warning.50',
                border: '1px solid',
                borderColor: 'warning.200',
                borderRadius: 1.5,
              }}
              role="alert"
            >
              <Typography variant="body2" fontWeight={600} color="warning.dark">
                Review note
              </Typography>
              <Typography variant="body2" color="text.secondary" mt={0.5}>
                {campaign.reviewNote}
              </Typography>
            </Box>
          )}
        </Box>

        <Divider sx={{ mb: 4 }} />

        {/* ── KPI cards ── */}
        <Typography variant="subtitle1" fontWeight={600} mb={2} color="text.secondary">
          Totals
        </Typography>
        <CampaignMetricsKPIs
          placement={campaign.placement}
          metrics={metrics}
          loading={metricsLoading}
        />

        {/* ── Performance chart ── */}
        <MetricsChart
          series={chartSeries}
          title="Performance over time"
        />
      </Box>
    </>
  )
}

export default CampaignDetailPage
