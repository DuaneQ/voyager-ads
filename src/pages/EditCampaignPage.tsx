import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import Nav from '../components/common/Nav'
import EditCampaignWizard from '../components/campaign/EditCampaignWizard'

/**
 * Route shell for /campaigns/:id/edit.
 * Owns no business logic — delegates entirely to EditCampaignWizard.
 * Single Responsibility: routing context + loading/not-found guards only.
 */
const EditCampaignPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  if (!id) {
    return (
      <>
        <Nav />
        <Box sx={{ maxWidth: 800, mx: 'auto', px: 1.2, py: 8, textAlign: 'center' }}>
          <Typography variant="h5" gutterBottom>Campaign not found</Typography>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/dashboard')}
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
        sx={{ maxWidth: 760, mx: 'auto', px: 1.2, py: 5 }}
        aria-label="Edit campaign"
      >
        <Button
          variant="text"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(`/campaigns/${id}`)}
          sx={{ mb: 3 }}
          aria-label="Back to campaign details"
        >
          Back to campaign
        </Button>
        <Typography variant="h5" fontWeight={700} mb={4}>
          Edit campaign
        </Typography>
        <EditCampaignWizard campaignId={id} />
      </Box>
    </>
  )
}

export default EditCampaignPage
