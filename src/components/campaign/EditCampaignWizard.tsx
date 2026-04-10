import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import LinearProgress from '@mui/material/LinearProgress'
import Step from '@mui/material/Step'
import StepLabel from '@mui/material/StepLabel'
import Stepper from '@mui/material/Stepper'
import Typography from '@mui/material/Typography'
import { useEditCampaign } from '../../hooks/useEditCampaign'
import { useAppAlert } from '../../context/AppAlertContext'
import { isStepValid, STEP_LABELS, type StepValidOptions } from '../../utils/wizardUtils'
import StepDetails from './StepDetails'
import StepCreative from './StepCreative'
import StepTargeting from './StepTargeting'
import StepBudget from './StepBudget'
import StepReview from './StepReview'

const WIZARD_SCALE_SX = {
  '& .MuiStepLabel-label': {
    fontSize: { xs: '1.15rem', md: '1.35rem' },
    fontWeight: 600,
  },
  '& .MuiStepIcon-root': {
    fontSize: { xs: '1.55rem', md: '1.85rem' },
  },
  '& .MuiTypography-body2': {
    fontSize: { xs: '1.1rem', md: '1.35rem' },
    lineHeight: 1.55,
  },
  '& .MuiTypography-caption': {
    fontSize: { xs: '0.95rem', md: '1.15rem' },
    lineHeight: 1.5,
  },
  '& .MuiFormLabel-root': {
    fontSize: { xs: '1rem', md: '1.25rem' },
  },
  '& .MuiInputBase-root': {
    minHeight: { xs: 64, md: 82 },
    fontSize: { xs: '1.12rem', md: '1.4rem' },
  },
  '& .MuiInputBase-input': {
    fontSize: { xs: '1.12rem', md: '1.4rem' },
    py: { xs: 1.5, md: 2 },
  },
  '& .MuiSelect-select': {
    fontSize: { xs: '1.12rem', md: '1.4rem' },
  },
  '& .MuiFormHelperText-root': {
    fontSize: { xs: '0.95rem', md: '1.15rem' },
    lineHeight: 1.45,
  },
  '& .MuiButton-root': {
    fontSize: { xs: '1.08rem', md: '1.35rem' },
    px: { xs: 2.4, md: 3.4 },
    py: { xs: 1.15, md: 1.55 },
    minHeight: { xs: 48, md: 60 },
    borderRadius: 2,
  },
  '& .MuiChip-root': {
    fontSize: { xs: '1rem', md: '1.2rem' },
    height: { xs: 36, md: 42 },
  },
}

interface Props {
  campaignId: string
}

/**
 * Wizard UI for editing an existing campaign.
 *
 * Open/Closed: extends the wizard pattern without modifying CampaignWizard.
 * The step sub-components (StepDetails, StepCreative, etc.) are reused as-is —
 * they are open for extension through their existing props interface.
 *
 * Dependency Inversion: depends on the useEditCampaign hook abstraction, not
 * directly on Firestore or the repository.
 */
const EditCampaignWizard: React.FC<Props> = ({ campaignId }) => {
  const {
    step, draft, patch, next, back, submit, reset,
    submitted, submitError, isUploading, uploadProgress,
    campaign, campaignLoading,
  } = useEditCampaign(campaignId)
  const { showError } = useAppAlert()
  const navigate = useNavigate()
  const isLast = step === STEP_LABELS.length - 1
  const stepValidOptions: StepValidOptions = { allowPastStartDate: true }
  const isValid = isStepValid(step, draft, stepValidOptions)

  // Surface async submit errors through the global Snackbar
  useEffect(() => {
    if (submitError) showError(submitError)
  }, [submitError, showError])

  // Redirect to campaign detail after successful save
  useEffect(() => {
    if (submitted) {
      reset()
      navigate(`/campaigns/${campaignId}`, { state: { edited: true } })
    }
  }, [submitted, navigate, reset, campaignId])

  if (campaignLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress aria-label="Loading campaign" />
      </Box>
    )
  }

  if (!campaign) {
    return (
      <Box sx={{ textAlign: 'center', py: 6 }}>
        <Typography variant="h6" gutterBottom>Campaign not found</Typography>
        <Typography color="text.secondary" mb={3}>
          This campaign may have been removed or you don't have access to it.
        </Typography>
        <Button variant="outlined" onClick={() => navigate('/dashboard')}>
          Back to dashboard
        </Button>
      </Box>
    )
  }

  // Completed campaigns cannot be edited; under-review campaigns must wait for review to finish
  const isEditable = !campaign.isUnderReview && campaign.status !== 'completed'

  if (!isEditable) {
    return (
      <Box sx={{ textAlign: 'center', py: 6 }}>
        <Alert severity="info" sx={{ mb: 3, textAlign: 'left' }}>
          {campaign.isUnderReview
            ? 'This campaign is currently under review and cannot be edited until the review is complete.'
            : 'Completed campaigns cannot be edited.'}
        </Alert>
        <Button variant="outlined" onClick={() => navigate(`/campaigns/${campaignId}`)}>
          Back to campaign
        </Button>
      </Box>
    )
  }

  return (
    <Box data-testid="edit-campaign-wizard" sx={WIZARD_SCALE_SX}>
      {campaign.reviewNote && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <strong>Review note:</strong> {campaign.reviewNote}
        </Alert>
      )}

      <Stepper activeStep={step} alternativeLabel sx={{ mb: 4 }}>
        {STEP_LABELS.map((label, i) => (
          <Step key={label} completed={i < step}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Box sx={{ maxWidth: 900, mx: 'auto' }}>
        <Box role="group" aria-label={`Step ${step + 1} of ${STEP_LABELS.length}: ${STEP_LABELS[step]}`}>
          {step === 0 && <StepDetails draft={draft} patch={patch} />}
          {step === 1 && <StepCreative draft={draft} patch={patch} />}
          {step === 2 && <StepTargeting draft={draft} patch={patch} />}
          {step === 3 && <StepBudget draft={draft} patch={patch} />}
          {step === 4 && (
            <StepReview
              draft={draft}
              patch={patch}
              assetUrl={campaign.assetUrl ?? undefined}
              muxPlaybackUrl={campaign.muxPlaybackUrl ?? undefined}
            />
          )}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button onClick={back} disabled={step === 0} variant="text">
            Back
          </Button>

          {isLast ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
              <Button
                variant="contained"
                onClick={submit}
                disabled={!isValid || isUploading}
                aria-busy={isUploading}
              >
                {isUploading ? `Uploading… ${uploadProgress}%` : 'Save & resubmit for review'}
              </Button>
              {isUploading && (
                <Box sx={{ width: 200 }}>
                  <LinearProgress
                    variant="determinate"
                    value={uploadProgress}
                    aria-label="Asset upload progress"
                  />
                  <Typography variant="caption" color="text.secondary">
                    Uploading creative asset
                  </Typography>
                </Box>
              )}
            </Box>
          ) : (
            <Button variant="contained" onClick={next} disabled={!isValid}>
              Next
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  )
}

export default EditCampaignWizard
