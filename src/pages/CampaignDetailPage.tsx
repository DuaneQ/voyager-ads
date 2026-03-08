import React, { useEffect, useMemo } from 'react'
import { useParams, Link as RouterLink, useLocation } from 'react-router-dom'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import PauseCircleOutlinedIcon from '@mui/icons-material/PauseCircleOutlined'
import PlayCircleOutlinedIcon from '@mui/icons-material/PlayCircleOutlined'
import Nav from '../components/common/Nav'
import CampaignStatusChip from '../components/dashboard/CampaignStatusChip'
import CampaignMetricsKPIs from '../components/dashboard/CampaignMetricsKPIs'
import MetricsChart from '../components/dashboard/MetricsChart'
import CampaignAdPreview from '../components/campaign/CampaignAdPreview'
import { useCampaigns } from '../hooks/useCampaigns'
import { useCampaignMetrics } from '../hooks/useCampaignMetrics'
import { useCampaignStatus } from '../hooks/useCampaignStatus'
import { useAppAlert } from '../context/AppAlertContext'
import type { Placement } from '../types/campaign'
import { displayDate } from '../utils/dateUtils'
import { formatBudgetRemaining, budgetRemainingPercent } from '../utils/budgetUtils'

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
  const { campaigns, loading: campaignsLoading, refetch } = useCampaigns()
  const { showSuccess } = useAppAlert()
  const { toggle: toggleStatus, loading: statusLoading, error: statusError } = useCampaignStatus(refetch)
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
            {!campaign.isUnderReview && campaign.status !== 'completed' && (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={campaign.status === 'active'
                    ? <PauseCircleOutlinedIcon />
                    : <PlayCircleOutlinedIcon />}
                  onClick={() => toggleStatus(campaign.id, campaign.uid, campaign.status)}
                  disabled={statusLoading}
                  aria-label={campaign.status === 'active'
                    ? `Pause campaign: ${campaign.name}`
                    : `Resume campaign: ${campaign.name}`}
                >
                  {campaign.status === 'active' ? 'Pause' : 'Resume'}
                </Button>
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
              </Box>
            )}
          </Box>
          {statusError && (
            <Alert severity="error" sx={{ mt: 1 }}>{statusError}</Alert>
          )}

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
            {typeof campaign.budgetCents === 'number' && (
              <Chip
                label={`Remaining: ${formatBudgetRemaining(campaign.budgetCents)}`}
                size="small"
                variant="outlined"
                color={(budgetRemainingPercent(campaign.budgetCents, campaign.budgetAmount) ?? 100) < 20
                  ? 'warning'
                  : 'default'}
                aria-label={`Budget remaining: ${formatBudgetRemaining(campaign.budgetCents)}`}
              />
            )}
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

        {/* ── Ad preview ── */}
        {(campaign.assetUrl || campaign.muxPlaybackUrl) && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle1" fontWeight={600} mb={2} color="text.secondary">
              Your Ad
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: { xs: 'center', sm: 'flex-start' } }}>
              <CampaignAdPreview
                draft={campaign as any}
                assetUrl={campaign.assetUrl ?? undefined}
                muxPlaybackUrl={campaign.muxPlaybackUrl ?? undefined}
                maxWidth={campaign.placement === 'video_feed' ? 300 : undefined}
              />
            </Box>
            {campaign.placement === 'video_feed' && campaign.muxStatus && campaign.muxStatus !== 'ready' && (
              <Typography variant="caption" color={campaign.muxStatus === 'errored' ? 'error' : 'text.secondary'} sx={{ display: 'block', mt: 1 }}>
                {campaign.muxStatus === 'errored'
                  ? `Video processing failed${campaign.muxError ? `: ${campaign.muxError}` : '.'}`
                  : 'Video is still being optimised for all platforms — check back shortly.'}
              </Typography>
            )}
          </Box>
        )}

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
