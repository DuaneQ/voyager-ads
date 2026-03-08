import React, { useCallback, useEffect, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'
import Nav from '../components/common/Nav'
import CampaignSummaryCards from '../components/dashboard/CampaignSummaryCards'
import CampaignTable from '../components/dashboard/CampaignTable'
import MetricsChart from '../components/dashboard/MetricsChart'
import { useCampaigns } from '../hooks/useCampaigns'
import { useCampaignStatus } from '../hooks/useCampaignStatus'
import { useMultiCampaignMetrics } from '../hooks/useMultiCampaignMetrics'
import { useAppAlert } from '../context/AppAlertContext'
import type { Campaign } from '../types/campaign'

/**
 * Campaign dashboard — lists the advertiser's campaigns with KPI summary cards
 * and inline sparkline trend charts.
 */
const DashboardPage: React.FC = () => {
  const { campaigns, loading, error, refetch } = useCampaigns()
  const { toggle: toggleStatus } = useCampaignStatus(refetch)
  const campaignIds = useMemo(() => campaigns.map(c => c.id), [campaigns])
  const { metricsMap } = useMultiCampaignMetrics(campaignIds)
  const { showSuccess } = useAppAlert()
  const location = useLocation()

  const onToggleStatus = useCallback(
    (campaign: Campaign) => toggleStatus(campaign.id, campaign.uid, campaign.status),
    [toggleStatus],
  )

  // Show success banner when redirected here after a wizard submission
  useEffect(() => {
    const state = location.state as { submitted?: boolean } | null
    if (state?.submitted) {
      showSuccess('Campaign submitted! It is now under review.')
      // Clear the state so a refresh doesn't re-show the banner
      window.history.replaceState({}, '')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Build one series per campaign for the aggregate chart
  const chartSeries = useMemo(
    () => campaigns.map((c) => ({ id: c.id, label: c.name, data: metricsMap[c.id] ?? [] })),
    [campaigns, metricsMap]
  )

  return (
    <>
      <Nav />
      <Box component="main" sx={{ maxWidth: 1200, mx: 'auto', px: 3, py: 5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h2" fontWeight={700}>
            My Campaigns
          </Typography>
        </Box>

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }} aria-label="Loading campaigns">
            <CircularProgress />
          </Box>
        )}

        {error && !loading && (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography color="error" gutterBottom>{error}</Typography>
            <Button variant="outlined" onClick={refetch}>Retry</Button>
          </Box>
        )}

        {!loading && !error && (
          <>
            <CampaignSummaryCards campaigns={campaigns} />
            <MetricsChart series={chartSeries} title="Performance" />
            <CampaignTable campaigns={campaigns} onToggleStatus={onToggleStatus} />
          </>
        )}
      </Box>
    </>
  )
}

export default DashboardPage
