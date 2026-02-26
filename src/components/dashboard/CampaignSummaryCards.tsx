import React from 'react'
import Grid from '@mui/material/Grid'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import type { Campaign } from '../../types/campaign'

interface Props {
  campaigns: Campaign[]
}

function totalBudget(campaigns: Campaign[]): string {
  const sum = campaigns.reduce((acc, c) => {
    const amount = parseFloat(c.budgetAmount)
    return acc + (isNaN(amount) ? 0 : amount)
  }, 0)
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(sum)
}

const CampaignSummaryCards: React.FC<Props> = ({ campaigns }) => {
  const underReview = campaigns.filter(c => c.isUnderReview).length
  const active      = campaigns.filter(c => !c.isUnderReview && c.status === 'active').length

  const stats: { label: string; value: string | number; subtitle: string }[] = [
    {
      label: 'Total campaigns',
      value: campaigns.length,
      subtitle: 'All time',
    },
    {
      label: 'Active',
      value: active,
      subtitle: 'Currently running',
    },
    {
      label: 'Under review',
      value: underReview,
      subtitle: 'Awaiting approval',
    },
    {
      label: 'Total budget',
      value: totalBudget(campaigns),
      subtitle: 'Committed across all campaigns',
    },
  ]

  return (
    <Grid container spacing={2} mb={4}>
      {stats.map(({ label, value, subtitle }) => (
        <Grid key={label} size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper
            variant="outlined"
            sx={{ px: 3, py: 2.5, borderRadius: 2 }}
            aria-label={label}
          >
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {label}
            </Typography>
            <Typography variant="h4" fontWeight={700} lineHeight={1.2}>
              {value}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          </Paper>
        </Grid>
      ))}
    </Grid>
  )
}

export default CampaignSummaryCards
