import React, { useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Checkbox from '@mui/material/Checkbox'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import FormControlLabel from '@mui/material/FormControlLabel'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import CampaignOutlinedIcon from '@mui/icons-material/CampaignOutlined'
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined'
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined'
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined'
import PreviewOutlinedIcon from '@mui/icons-material/PreviewOutlined'
import { type CampaignDraft } from '../../types/campaign'
import { displayDate } from '../../utils/dateUtils'
import AdvertisingPolicyModal from './AdvertisingPolicyModal'
import CampaignAdPreview from './CampaignAdPreview'

interface Props {
  draft: CampaignDraft
  patch: <K extends keyof CampaignDraft>(key: K, value: CampaignDraft[K]) => void
}

interface RowProps {
  label: string
  value: string | undefined | null
}

const Row: React.FC<RowProps> = ({ label, value }) => (
  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between', py: 0.75, alignItems: 'flex-start' }}>
    <Typography variant="body2" color="text.secondary" sx={{ minWidth: 140, flexShrink: 0 }}>{label}</Typography>
    <Typography variant="body2" sx={{ textAlign: 'right', wordBreak: 'break-word', fontWeight: 500 }}>{value || '—'}</Typography>
  </Box>
)

interface SectionCardProps {
  icon: React.ReactNode
  title: string
  accentColor: string
  children: React.ReactNode
}

const SectionCard: React.FC<SectionCardProps> = ({ icon, title, accentColor, children }) => (
  <Paper
    variant="outlined"
    sx={{
      borderRadius: 2,
      overflow: 'hidden',
      borderColor: 'divider',
    }}
  >
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        px: 2,
        py: 1.25,
        borderLeft: `4px solid ${accentColor}`,
        bgcolor: `${accentColor}0d`,
      }}
    >
      <Box sx={{ color: accentColor, display: 'flex', alignItems: 'center' }}>{icon}</Box>
      <Typography variant="subtitle2" sx={{ color: accentColor, fontWeight: 700, letterSpacing: 0.3 }}>
        {title}
      </Typography>
    </Box>
    <Divider />
    <Box sx={{ px: 2, py: 1 }}>{children}</Box>
  </Paper>
)

const PLACEMENT_LABELS: Record<string, string> = {
  video_feed: 'Video Feed',
  itinerary_feed: 'Itinerary Feed',
  ai_slot: 'AI Slots',
}

const PLACEMENT_COLORS: Record<string, 'primary' | 'secondary' | 'success'> = {
  video_feed: 'secondary',
  itinerary_feed: 'primary',
  ai_slot: 'success',
}

const StepReview: React.FC<Props> = ({ draft, patch }) => {
  const [policyOpen, setPolicyOpen] = useState(false)
  const interestChips = draft.interests
    ? draft.interests.split(',').map(s => s.trim()).filter(Boolean)
    : []

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>

      {/* Ad preview */}
      <SectionCard icon={<PreviewOutlinedIcon fontSize="small" />} title="Ad Preview" accentColor="#0891b2">
        <Box sx={{ py: 1 }}>
          <CampaignAdPreview draft={draft} />
        </Box>
      </SectionCard>

      {/* Campaign details */}
      <SectionCard icon={<CampaignOutlinedIcon fontSize="small" />} title="Campaign Details" accentColor="#1a73e8">
        <Row label="Name" value={draft.name} />
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between', py: 0.75, alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary" sx={{ minWidth: 140 }}>Placement</Typography>
          <Chip
            label={PLACEMENT_LABELS[draft.placement] ?? draft.placement}
            color={PLACEMENT_COLORS[draft.placement] ?? 'default'}
            size="small"
            sx={{ fontWeight: 600 }}
          />
        </Box>
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between', py: 0.75, alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary" sx={{ minWidth: 140 }}>Objective</Typography>
          <Chip label={draft.objective || '—'} variant="outlined" size="small" sx={{ fontWeight: 500 }} />
        </Box>
        <Row label="Start date" value={displayDate(draft.startDate)} />
        <Row label="End date" value={draft.endDate ? displayDate(draft.endDate) : 'No end date'} />
      </SectionCard>

      {/* Creative */}
      <SectionCard icon={<ImageOutlinedIcon fontSize="small" />} title="Creative" accentColor="#9c27b0">
        <Row label="Creative name" value={draft.creativeName} />
        <Row label="Type" value={draft.creativeType} />
        <Row label="Asset" value={draft.assetFile?.name} />
        {draft.primaryText && (
          <Box sx={{ py: 0.75 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>Primary text</Typography>
            <Paper variant="outlined" sx={{ px: 1.5, py: 1, borderRadius: 1.5, bgcolor: 'grey.50' }}>
              <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.primary' }}>
                {draft.primaryText}
              </Typography>
            </Paper>
          </Box>
        )}
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between', py: 0.75, alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary" sx={{ minWidth: 140 }}>CTA</Typography>
          {draft.cta
            ? <Chip label={draft.cta} size="small" color="primary" variant="outlined" sx={{ fontWeight: 600 }} />
            : <Typography variant="body2">—</Typography>
          }
        </Box>
        <Row label="Landing URL" value={draft.landingUrl} />
      </SectionCard>

      {/* Targeting */}
      <SectionCard icon={<PeopleOutlinedIcon fontSize="small" />} title="Audience & Targeting" accentColor="#f57c00">
        <Row label="Audience name" value={draft.audienceName} />
        <Row label="Location" value={draft.location + (draft.radius ? ` (${draft.radius} km)` : '')} />
        <Row label="Destination match" value={draft.destinationMatch ? 'Yes' : 'No'} />
        {draft.targetDestination && (
          <Row label="Target destination" value={draft.targetDestination} />
        )}
        {draft.targetTravelStartDate && (
          <Row label="Travel dates" value={`${draft.targetTravelStartDate} → ${draft.targetTravelEndDate || '—'}`} />
        )}
        {draft.targetGender && (
          <Row label="Itinerary gender" value={draft.targetGender} />
        )}
        <Row label="Age range" value={`${draft.ageFrom} – ${draft.ageTo}`} />
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between', py: 0.75, alignItems: 'flex-start' }}>
          <Typography variant="body2" color="text.secondary" sx={{ minWidth: 140, flexShrink: 0 }}>Interests</Typography>
          {interestChips.length > 0 ? (
            <Stack direction="row" flexWrap="wrap" gap={0.5} justifyContent="flex-end">
              {interestChips.map(tag => (
                <Chip key={tag} label={tag} size="small" variant="outlined" sx={{ fontSize: '0.72rem' }} />
              ))}
            </Stack>
          ) : (
            <Typography variant="body2">—</Typography>
          )}
        </Box>
      </SectionCard>

      {/* Budget */}
      <Paper
        variant="outlined"
        sx={{ borderRadius: 2, overflow: 'hidden', borderColor: 'divider' }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: 2,
            py: 1.25,
            borderLeft: '4px solid #2e7d32',
            bgcolor: '#2e7d320d',
          }}
        >
          <Box sx={{ color: '#2e7d32', display: 'flex', alignItems: 'center' }}>
            <AccountBalanceWalletOutlinedIcon fontSize="small" />
          </Box>
          <Typography variant="subtitle2" sx={{ color: '#2e7d32', fontWeight: 700, letterSpacing: 0.3, flexGrow: 1 }}>
            Budget
          </Typography>
          {draft.budgetAmount && (
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="h6" sx={{ color: '#2e7d32', fontWeight: 800, lineHeight: 1 }}>
                ${draft.budgetAmount}
              </Typography>
              <Typography variant="caption" sx={{ color: '#2e7d32', opacity: 0.8 }}>
                {draft.budgetType === 'daily' ? 'per day' : 'total'} · {draft.billingModel.toUpperCase()}
              </Typography>
            </Box>
          )}
        </Box>
        <Divider />
        <Box sx={{ px: 2, py: 1 }}>
          <Row label="Budget type" value={draft.budgetType === 'daily' ? 'Daily' : 'Lifetime'} />
          <Row label="Budget" value={draft.budgetAmount ? `$${draft.budgetAmount} USD` : undefined} />
          <Row label="Billing model" value={draft.billingModel.toUpperCase()} />
        </Box>
      </Paper>

      {/* Policy agreement */}
      <Alert severity="info" variant="outlined" sx={{ borderRadius: 2, alignItems: 'flex-start' }}>
        <FormControlLabel
          sx={{ m: 0 }}
          control={
            <Checkbox
              required
              checked={draft.agreePolicy}
              onChange={e => patch('agreePolicy', e.target.checked)}
              sx={{ pt: 0 }}
            />
          }
          label={
            <Typography variant="body2">
              I agree to the{' '}
              <Typography
                component="span"
                variant="body2"
                color="primary.main"
                sx={{ cursor: 'pointer', fontWeight: 600, textDecoration: 'underline' }}
                onClick={() => setPolicyOpen(true)}
                role="button"
                tabIndex={0}
                onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && setPolicyOpen(true)}
                aria-label="Read TravalPass Advertising Policy"
              >
                TravalPass Advertising Policy
              </Typography>
            </Typography>
          }
        />
      </Alert>

      <AdvertisingPolicyModal open={policyOpen} onClose={() => setPolicyOpen(false)} />

    </Box>
  )
}

export default StepReview
