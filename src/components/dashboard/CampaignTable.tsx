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
import { Link as RouterLink } from 'react-router-dom'
import type { Campaign, Placement } from '../../types/campaign'
import CampaignStatusChip from './CampaignStatusChip'
import { displayDate } from '../../utils/dateUtils'

interface Props {
  campaigns: Campaign[]
}

const PLACEMENT_LABELS: Record<Placement, string> = {
  video_feed:      'Video Feed',
  itinerary_feed:  'Itinerary Feed',
  ai_slot:         'AI Slots',
}

/**
 * Format a campaign date range for display.
 * Delegates to displayDate() from dateUtils, which uses parseLocalDate
 * internally — no raw new Date(string) calls on bare YYYY-MM-DD values.
 */
function formatDateRange(start: string, end: string): string {
  if (!start && !end) return '—'
  const fmt = (d: string) => d ? displayDate(d) : '?'
  return `${fmt(start)} – ${fmt(end)}`
}

function formatBudget(amount: string, type: string): string {
  const n = parseFloat(amount)
  if (isNaN(n)) return '—'
  const formatted = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
  return `${formatted} / ${type === 'daily' ? 'day' : 'lifetime'}`
}

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
            <TableCell>Status</TableCell>
            <TableCell>Schedule</TableCell>
            <TableCell>Budget</TableCell>
            <TableCell align="right">
              <Tooltip title="Total impressions served">
                <span>Impressions</span>
              </Tooltip>
            </TableCell>
            <TableCell align="right">
              <Tooltip title="Total link clicks">
                <span>Clicks</span>
              </Tooltip>
            </TableCell>
            <TableCell align="right">
              <Tooltip title="Click-through rate: clicks ÷ impressions">
                <span>CTR</span>
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
                <Typography
                  component={RouterLink}
                  to={`/campaigns/${campaign.id}`}
                  variant="body2"
                  fontWeight={600}
                  sx={{ color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                >
                  {campaign.name}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  {campaign.objective}
                </Typography>
              </TableCell>

              <TableCell>
                <Typography variant="body2">
                  {PLACEMENT_LABELS[campaign.placement] ?? campaign.placement}
                </Typography>
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

              {/* Metrics columns — sourced from lifetime counters on the campaign root doc */}
              {(() => {
                const impr = campaign.totalImpressions
                const clks = campaign.totalClicks
                const hasCounts = typeof impr === 'number' && typeof clks === 'number'
                const ctr = hasCounts && impr > 0
                  ? `${((clks / impr) * 100).toFixed(2)}%`
                  : '—'
                const fmt = new Intl.NumberFormat('en-US')
                const color = (!hasCounts || campaign.isUnderReview) ? 'text.disabled' : 'text.primary'
                return (
                  <>
                    <TableCell align="right">
                      <Typography variant="body2" color={color}>
                        {hasCounts ? fmt.format(impr!) : '—'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" color={color}>
                        {hasCounts ? fmt.format(clks!) : '—'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" color={color}>
                        {ctr}
                      </Typography>
                    </TableCell>
                  </>
                )
              })()}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

export default CampaignTable
