import React from 'react'
import Grid from '@mui/material/Grid'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import Tooltip from '@mui/material/Tooltip'
import Skeleton from '@mui/material/Skeleton'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import type { DailyMetricSnapshot } from '../../types/metrics'
import { computeSummary, getKpisForPlacement } from '../../types/metrics'
import type { Placement } from '../../types/campaign'

interface Props {
  placement: Placement
  metrics: DailyMetricSnapshot[]
  loading?: boolean
}

const CampaignMetricsKPIs: React.FC<Props> = ({ placement, metrics, loading = false }) => {
  const kpis = getKpisForPlacement(placement)
  const summary = computeSummary(metrics)
  const hasData = metrics.length > 0 && summary.impressions > 0

  return (
    <Grid container spacing={2} mb={3} aria-label="Campaign KPIs">
      {kpis.map(({ key, label, format, tooltip }) => {
        const raw = summary[key] ?? 0
        const displayValue = hasData
          ? format(typeof raw === 'number' ? raw : 0)
          : '—'

        return (
          <Grid key={key} size={{ xs: 6, sm: 4, md: 3, lg: 2 }}>
            <Paper
              variant="outlined"
              sx={{ px: 2.5, py: 2, borderRadius: 2 }}
              aria-label={label}
            >
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
              >
                {label}
                <Tooltip title={tooltip} arrow>
                  <InfoOutlinedIcon sx={{ fontSize: 13, cursor: 'help' }} aria-label={tooltip} />
                </Tooltip>
              </Typography>

              {loading ? (
                <Skeleton variant="text" width={60} height={36} />
              ) : (
                <Typography
                  variant="h6"
                  fontWeight={700}
                  lineHeight={1.3}
                  mt={0.25}
                  color={hasData ? 'text.primary' : 'text.disabled'}
                  aria-label={`${label}: ${displayValue}`}
                >
                  {displayValue}
                </Typography>
              )}
            </Paper>
          </Grid>
        )
      })}
    </Grid>
  )
}

export default CampaignMetricsKPIs
