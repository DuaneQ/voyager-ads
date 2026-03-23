import React from 'react'
import { Helmet } from 'react-helmet-async'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Nav from '../components/common/Nav'
import CampaignWizard from '../components/campaign/CampaignWizard'

const CreateCampaignPage: React.FC = () => {
  return (
    <Box component="main">
      <Helmet>
        <title>Create Campaign — TravalPass Ads</title>
        <meta name="description" content="Create a new TravalPass Ads campaign to reach high-intent travelers." />
        <link rel="canonical" href="https://travalpass-ads.web.app/create-campaign" />
      </Helmet>
      <Nav />
      <Container 
        maxWidth={false}
        sx={{ 
          maxWidth: { xs: '100%', sm: 768, md: 960, lg: 2000 },
          mx: 'auto',
          px: { xs: 0.8, sm: 0.8, md: 0.6, lg: 0.4, xl: 0.2 },
          py: 5 
        }}
      >
        <Typography variant="h1" sx={{ mb: 0.5 }}>Create a campaign</Typography>
        <Typography color="text.secondary" sx={{ mb: 4 }}>
          Reach travelers who are actively planning trips.
        </Typography>
        <CampaignWizard />
      </Container>
    </Box>
  )
}

export default CreateCampaignPage
