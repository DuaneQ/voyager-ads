import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Tooltip from '@mui/material/Tooltip'
import Step from '@mui/material/Step'
import StepLabel from '@mui/material/StepLabel'
import Stepper from '@mui/material/Stepper'
import { useCreateCampaign } from '../../hooks/useCreateCampaign'
import { useAppAlert } from '../../context/AppAlertContext'
import { type CampaignDraft } from '../../types/campaign'
import { TEST_DRAFT } from '../../__tests__/utils/campaignTestFixtures'
import StepDetails from './StepDetails'
import StepCreative from './StepCreative'
import StepTargeting from './StepTargeting'
import StepBudget from './StepBudget'
import StepReview from './StepReview'

const STEP_LABELS = ['Details', 'Creative', 'Targeting', 'Budget', 'Review']

function isStepValid(step: number, draft: CampaignDraft): boolean {
  const isItineraryFeed = draft.placement === 'itinerary_feed'
  switch (step) {
    case 0: {
      const todayStr = new Date().toLocaleDateString('en-CA') // YYYY-MM-DD in local time
      if (draft.name.trim().length < 3) return false
      if (!draft.startDate || draft.startDate < todayStr) return false
      if (draft.endDate && draft.endDate < draft.startDate) return false
      return true
    }
    case 1: return draft.creativeName.trim().length > 0
    case 2: {
      if (!draft.audienceName.trim()) return false
      // Itinerary feed uses targetDestination; other placements use location
      return isItineraryFeed
        ? draft.targetDestination.trim().length > 0
        : draft.location.trim().length > 0
    }
    case 3: return parseFloat(draft.budgetAmount) > 0
    case 4: return draft.agreePolicy
    default: return true
  }
}

const CampaignWizard: React.FC = () => {
  const { step, draft, patch, next, back, submit, reset, submitted, submitError } = useCreateCampaign()
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

  // Redirect to dashboard after successful submission, carrying a flag to trigger the success banner
  useEffect(() => {
    if (submitted) {
      reset()
      navigate('/dashboard', { state: { submitted: true } })
    }
  }, [submitted, navigate, reset])

  return (
    <Box data-testid="campaign-wizard">
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

      <Box sx={{ maxWidth: 600, mx: 'auto' }}>
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
            <Button
              variant="contained"
              onClick={submit}
              disabled={!isValid}
            >
              Submit campaign
            </Button>
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
