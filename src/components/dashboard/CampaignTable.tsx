import React from 'react'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Tooltip from '@mui/material/Tooltip'
import { Link as RouterLink } from 'react-router-dom'
import type { Campaign, Placement } from '../../types/campaign'
import CampaignStatusChip from './CampaignStatusChip'
import { displayDate } from '../../utils/dateUtils'
import { formatBudgetRemaining, budgetRemainingPercent } from '../../utils/budgetUtils'

interface Props {
  campaigns: Campaign[]
  /**
   * Called when the user clicks Pause or Resume in the table Actions column.
   * If omitted the Pause/Resume buttons are not rendered (backward-compatible).
   */
  onToggleStatus?: (campaign: Campaign) => Promise<void>
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

const CampaignTable: React.FC<Props> = ({ campaigns, onToggleStatus }) => {
  if (campaigns.length === 0) {
    return (
      <Paper variant="outlined" sx={{ p: 6, textAlign: 'center', borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>No campaigns yet</Typography>
        <Typography color="text.secondary" mb={3}>
          Create your first campaign to start reaching travellers.
        </Typography>
        <Button
          component={RouterLink}
          to="/create-campaign"
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
            <TableCell>Remaining</TableCell>
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
            <TableCell align="right">Actions</TableCell>
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
                  aria-label={`View details for ${campaign.name}`}
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

              <TableCell>
                <Tooltip title={typeof campaign.budgetCents === 'number'
                  ? `${formatBudgetRemaining(campaign.budgetCents)} of ${formatBudget(campaign.budgetAmount, campaign.budgetType)}`
                  : 'No spend recorded yet'}
                >
                  <Typography
                    variant="body2"
                    noWrap
                    color={(budgetRemainingPercent(campaign.budgetCents, campaign.budgetAmount) ?? 100) < 20
                      ? 'warning.main'
                      : 'text.primary'}
                  >
                    {formatBudgetRemaining(campaign.budgetCents)}
                  </Typography>
                </Tooltip>
              </TableCell>

              {/* Metrics columns — sourced from lifetime counters on the campaign root doc.
                  totalClicks is only written by logAdEvents when clicks > 0, so it may be
                  absent on campaigns with impressions but no clicks. Default it to 0 and
                  gate display only on totalImpressions being present. */}
              {(() => {
                const impr = campaign.totalImpressions
                const clks = campaign.totalClicks ?? 0
                const hasCounts = typeof impr === 'number'
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
              <TableCell align="right">
                <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                  {onToggleStatus && !campaign.isUnderReview && campaign.status === 'active' && (
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => onToggleStatus(campaign)}
                      aria-label={`Pause ${campaign.name}`}
                    >
                      Pause
                    </Button>
                  )}
                  {onToggleStatus && !campaign.isUnderReview && campaign.status === 'paused' && (
                    <Button
                      size="small"
                      variant="outlined"
                      color="success"
                      onClick={() => onToggleStatus(campaign)}
                      aria-label={`Resume ${campaign.name}`}
                    >
                      Resume
                    </Button>
                  )}
                  {!campaign.isUnderReview && (campaign.status === 'paused' || campaign.status === 'draft') && (
                    <Button
                      component={RouterLink}
                      to={`/campaigns/${campaign.id}/edit`}
                      size="small"
                      variant="outlined"
                      aria-label={`Edit ${campaign.name}`}
                    >
                      Edit
                    </Button>
                  )}
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

export default CampaignTable
