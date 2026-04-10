import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import LinearProgress from '@mui/material/LinearProgress'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import Step from '@mui/material/Step'
import StepLabel from '@mui/material/StepLabel'
import Stepper from '@mui/material/Stepper'
import { useCreateCampaign } from '../../hooks/useCreateCampaign'
import { useAppAlert } from '../../context/AppAlertContext'
import { type CampaignDraft } from '../../types/campaign'
import { TEST_DRAFT } from '../../__tests__/utils/campaignTestFixtures'
import { isStepValid, STEP_LABELS } from '../../utils/wizardUtils'
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

const CampaignWizard: React.FC = () => {
  const {
    step,
    draft,
    patch,
    next,
    back,
    submit,
    reset,
    submitted,
    submittedCampaignId,
    submitError,
    isUploading,
    uploadProgress,
  } = useCreateCampaign()
  const { showError } = useAppAlert()
  const navigate = useNavigate()
  const isLast = step === STEP_LABELS.length - 1
  const isValid = isStepValid(step, draft)

  const fillTestData = import.meta.env.MODE !== 'production'
    ? () => {
        (Object.keys(TEST_DRAFT) as (keyof CampaignDraft)[]).forEach((key) => {
          patch(key, TEST_DRAFT[key] as CampaignDraft[typeof key])
        })
      }
    : undefined

  // Surface async submit errors through the global Snackbar
  useEffect(() => {
    if (submitError) showError(submitError)
  }, [submitError, showError])

  // Redirect to billing after successful submission so campaign funding is the immediate next action.
  useEffect(() => {
    if (submitted && submittedCampaignId) {
      const campaignId = submittedCampaignId
      reset()
      navigate(`/billing/${campaignId}`, { state: { submitted: true } })
    }
  }, [submitted, submittedCampaignId, navigate, reset])

  return (
    <Box data-testid="campaign-wizard" sx={WIZARD_SCALE_SX}>
      {fillTestData && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
          <Tooltip title="Fills all wizard steps with realistic test data (dev only)">
            <Button
              size="small"
              variant="outlined"
              color="warning"
              onClick={fillTestData}
              data-testid="fill-test-data"
            >
              Fill test data
            </Button>
          </Tooltip>
        </Box>
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
          {step === 4 && <StepReview draft={draft} patch={patch} />}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button
            onClick={back}
            disabled={step === 0}
            variant="text"
          >
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
                {isUploading ? `Uploading… ${uploadProgress}%` : 'Submit campaign'}
              </Button>
              {isUploading && (
                <Box sx={{ width: 180 }}>
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
            <Button
              variant="contained"
              onClick={next}
              disabled={!isValid}
            >
              Next
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  )
}

export default CampaignWizard
