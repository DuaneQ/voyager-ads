import React from 'react'
import { Box, Typography } from '@mui/material'
import Nav from '../components/common/Nav'

/**
 * Campaign dashboard — displays the advertiser's active, paused and draft campaigns
 * alongside performance metrics.
 *
 * Phase 1 (current): scaffold with auth wiring.
 * Phase 2: campaign list, KPI cards, and MUI X Charts.
 */
const DashboardPage: React.FC = () => {
  return (
    <>
      <Nav />
      <Box component="main" sx={{ maxWidth: 1200, mx: 'auto', px: 3, py: 5 }}>
        <Typography variant="h2" fontWeight={700} mb={1}>
          My Campaigns
        </Typography>
        <Typography color="text.secondary">
          Your campaigns will appear here once they have been submitted.
        </Typography>
      </Box>
    </>
  )
}

export default DashboardPage
