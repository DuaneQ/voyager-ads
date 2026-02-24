import React from 'react'
import Box from '@mui/material/Box'
import Checkbox from '@mui/material/Checkbox'
import Divider from '@mui/material/Divider'
import FormControlLabel from '@mui/material/FormControlLabel'
import Typography from '@mui/material/Typography'
import { type CampaignDraft } from '../../types/campaign'
import { displayDate } from '../../utils/dateUtils'

interface Props {
  draft: CampaignDraft
  patch: <K extends keyof CampaignDraft>(key: K, value: CampaignDraft[K]) => void
}

interface RowProps {
  label: string
  value: string | undefined | null
}

const Row: React.FC<RowProps> = ({ label, value }) => (
  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between', py: 0.75 }}>
    <Typography variant="body2" color="text.secondary" sx={{ minWidth: 140 }}>{label}</Typography>
    <Typography variant="body2" sx={{ textAlign: 'right', wordBreak: 'break-word' }}>{value || '—'}</Typography>
  </Box>
)

const PLACEMENT_LABELS: Record<string, string> = {
  video_feed: 'Video Feed',
  itinerary_feed: 'Itinerary Feed',
  ai_slot: 'AI Slots',
}

const StepReview: React.FC<Props> = ({ draft, patch }) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>Campaign details</Typography>
        <Divider />
        <Row label="Name" value={draft.name} />
        <Row label="Placement" value={PLACEMENT_LABELS[draft.placement]} />
        <Row label="Objective" value={draft.objective} />
        <Row label="Start date" value={displayDate(draft.startDate)} />
        <Row label="End date" value={draft.endDate ? displayDate(draft.endDate) : 'No end date'} />
      </Box>

      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>Creative</Typography>
        <Divider />
        <Row label="Creative name" value={draft.creativeName} />
        <Row label="Type" value={draft.creativeType} />
        <Row label="Asset" value={draft.assetFile?.name} />
        <Row label="Primary text" value={draft.primaryText} />
        <Row label="CTA" value={draft.cta} />
        <Row label="Landing URL" value={draft.landingUrl} />
      </Box>

      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>Targeting</Typography>
        <Divider />
        <Row label="Audience name" value={draft.audienceName} />
        <Row label="Location" value={draft.location + (draft.radius ? ` (${draft.radius} km)` : '')} />
        <Row label="Destination match" value={draft.destinationMatch ? 'Yes' : 'No'} />
        <Row label="Age range" value={`${draft.ageFrom} – ${draft.ageTo}`} />
        <Row label="Interests" value={draft.interests} />
      </Box>

      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>Budget</Typography>
        <Divider />
        <Row label="Budget type" value={draft.budgetType === 'daily' ? 'Daily' : 'Lifetime'} />
        <Row label="Budget" value={draft.budgetAmount ? `$${draft.budgetAmount} USD` : undefined} />
        <Row label="Billing model" value={draft.billingModel.toUpperCase()} />
      </Box>

      <FormControlLabel
        control={
          <Checkbox
            required
            checked={draft.agreePolicy}
            onChange={e => patch('agreePolicy', e.target.checked)}
          />
        }
        label={
          <Typography variant="body2">
            I agree to the{' '}
            <Typography component="span" variant="body2" color="primary.main" sx={{ cursor: 'pointer' }}>
              TravalPass Advertising Policy
            </Typography>
          </Typography>
        }
      />
    </Box>
  )
}

export default StepReview
