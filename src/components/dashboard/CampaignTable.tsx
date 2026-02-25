import React from 'react'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Tooltip from '@mui/material/Tooltip'
import { SparkLineChart } from '@mui/x-charts/SparkLineChart'
import { Link as RouterLink } from 'react-router-dom'
import type { Campaign, Placement } from '../../types/campaign'
import CampaignStatusChip from './CampaignStatusChip'

interface Props {
  campaigns: Campaign[]
}

const PLACEMENT_LABELS: Record<Placement, string> = {
  video_feed:      'Video Feed',
  itinerary_feed:  'Itinerary Feed',
  ai_slot:         'AI Slots',
}

function formatDateRange(start: string, end: string): string {
  if (!start && !end) return '—'
  const fmt = (d: string) => d ? new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '?'
  return `${fmt(start)} – ${fmt(end)}`
}

function formatBudget(amount: string, type: string): string {
  const n = parseFloat(amount)
  if (isNaN(n)) return '—'
  const formatted = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
  return `${formatted} / ${type === 'daily' ? 'day' : 'lifetime'}`
}

// Placeholder sparkline data — flat zero until real metrics are available
const PLACEHOLDER_SPARKLINE = [0, 0, 0, 0, 0, 0, 0]

const CampaignTable: React.FC<Props> = ({ campaigns }) => {
  if (campaigns.length === 0) {
    return (
      <Paper variant="outlined" sx={{ p: 6, textAlign: 'center', borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>No campaigns yet</Typography>
        <Typography color="text.secondary" mb={3}>
          Create your first campaign to start reaching travellers.
        </Typography>
        <Button
          component={RouterLink}
          to="/campaigns/new"
          variant="contained"
        >
          Create campaign
        </Button>
      </Paper>
    )
  }

  return (
    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
      <Table aria-label="Campaigns table">
        <TableHead>
          <TableRow sx={{ '& th': { fontWeight: 600 } }}>
            <TableCell>Campaign</TableCell>
            <TableCell>Placement</TableCell>
            <TableCell>Objective</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Schedule</TableCell>
            <TableCell>Budget</TableCell>
            <TableCell align="center">
              <Tooltip title="Impressions trend — populated once campaign goes live">
                <span>Trend</span>
              </Tooltip>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {campaigns.map(campaign => (
            <TableRow
              key={campaign.id}
              hover
              sx={{ '&:last-child td': { border: 0 } }}
            >
              <TableCell>
                <Typography variant="body2" fontWeight={600}>
                  {campaign.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {campaign.objective}
                </Typography>
              </TableCell>

              <TableCell>
                <Typography variant="body2">
                  {PLACEMENT_LABELS[campaign.placement] ?? campaign.placement}
                </Typography>
              </TableCell>

              <TableCell>
                <Typography variant="body2">{campaign.objective}</Typography>
              </TableCell>

              <TableCell>
                <CampaignStatusChip
                  status={campaign.status}
                  isUnderReview={campaign.isUnderReview}
                />
              </TableCell>

              <TableCell>
                <Typography variant="body2" noWrap>
                  {formatDateRange(campaign.startDate, campaign.endDate)}
                </Typography>
              </TableCell>

              <TableCell>
                <Typography variant="body2" noWrap>
                  {formatBudget(campaign.budgetAmount, campaign.budgetType)}
                </Typography>
              </TableCell>

              <TableCell align="center" sx={{ width: 100 }}>
                <Tooltip title={campaign.isUnderReview ? 'Metrics available once approved' : 'Impressions (last 7 days)'}>
                  <span aria-label={`Trend for ${campaign.name}`}>
                    <SparkLineChart
                      data={PLACEHOLDER_SPARKLINE}
                      width={80}
                      height={36}
                      colors={campaign.isUnderReview ? ['#bdbdbd'] : ['#1976d2']}
                      curve="linear"
                    />
                  </span>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

export default CampaignTable
