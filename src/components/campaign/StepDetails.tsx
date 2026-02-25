import React from 'react'
import Box from '@mui/material/Box'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormLabel from '@mui/material/FormLabel'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { type CampaignDraft, type Placement, type Objective } from '../../types/campaign'
import { todayLocalDate } from '../../utils/dateUtils'

interface Props {
  draft: CampaignDraft
  patch: <K extends keyof CampaignDraft>(key: K, value: CampaignDraft[K]) => void
}

const PLACEMENTS: { value: Placement; label: string; ratio: string; desc: string }[] = [
  { value: 'video_feed', label: 'Video Feed', ratio: '9:16', desc: 'Full-screen short vertical videos' },
  { value: 'itinerary_feed', label: 'Itinerary Feed', ratio: '1:1', desc: 'Inline posts within the traveler matching feed' },
  { value: 'ai_slot', label: 'AI Slots', ratio: '3:2', desc: 'Contextual suggestions alongside AI itineraries' },
]

const PLACEMENT_DETAILS: Record<Placement, { headline: string; bullets: string[] }> = {
  itinerary_feed: {
    headline: 'Your ad appears as a native card inside the itinerary matching feed.',
    bullets: [
      'Shown to users whose travel destination matches your target city',
      'Matched by travel date overlap — your ad surfaces when users are actively planning',
      'Same card layout as organic itineraries with a "Sponsored" label',
      'Image only · 1:1 square · max 10 MB',
    ],
  },
  video_feed: {
    headline: 'Your ad plays inline in the full-screen vertical video feed.',
    bullets: [
      'Reaches users browsing travel inspiration videos',
      'Video or image creative · 9:16 vertical format',
      'Supports frequency caps and platform targeting',
    ],
  },
  ai_slot: {
    headline: 'Your ad appears as a contextual recommendation inside AI-generated itineraries.',
    bullets: [
      'Surfaces when AI creates a plan that matches your destination',
      'High-intent placement — user is in active trip-planning mode',
      'Image only · 3:2 landscape · max 5 MB',
    ],
  },
}

const OBJECTIVES: { value: Objective; label: string; billingModel: 'cpm' | 'cpc'; desc: string }[] = [
  { value: 'Awareness', label: 'Awareness', billingModel: 'cpm', desc: 'Maximise reach — billed per 1,000 impressions (CPM)' },
  { value: 'Traffic', label: 'Traffic', billingModel: 'cpc', desc: 'Drive clicks to your site — billed per click (CPC)' },
]

const StepDetails: React.FC<Props> = ({ draft, patch }) => {
  // todayLocalDate() uses local-time getFullYear/getMonth/getDate, never toISOString()
  const today = todayLocalDate()
  const [startDateError, setStartDateError] = React.useState<string | null>(null)
  const [endDateError, setEndDateError]     = React.useState<string | null>(null)

  const handleObjective = (value: Objective) => {
    patch('objective', value)
    const model = OBJECTIVES.find(o => o.value === value)?.billingModel
    if (model) patch('billingModel', model)
  }

  const handleStartDate = (value: string) => {
    // Only validate once the user has typed a complete YYYY-MM-DD (10 chars)
    if (value.length === 10 && value < today) {
      setStartDateError('Start date cannot be in the past')
      patch('startDate', '')
      return
    }
    setStartDateError(null)
    patch('startDate', value)
    // Clear end date if it's now before the new start date
    if (draft.endDate && draft.endDate < value) {
      patch('endDate', '')
      setEndDateError(null)
    }
  }

  const handleEndDate = (value: string) => {
    const minEnd = draft.startDate >= today ? draft.startDate : today
    if (value.length === 10 && value < minEnd) {
      const msg = draft.startDate && value < draft.startDate
        ? 'End date cannot be before start date'
        : 'End date cannot be in the past'
      setEndDateError(msg)
      patch('endDate', '')
      return
    }
    setEndDateError(null)
    patch('endDate', value)
  }

  const placementDetail = PLACEMENT_DETAILS[draft.placement]

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <TextField
        label="Campaign name"
        required
        inputProps={{ minLength: 3, maxLength: 100 }}
        value={draft.name}
        onChange={e => patch('name', e.target.value)}
        helperText="3–100 characters"
      />

      <FormControl component="fieldset">
        <FormLabel component="legend" sx={{ mb: 1, fontWeight: 500 }}>Placement</FormLabel>
        <RadioGroup
          value={draft.placement}
          onChange={e => patch('placement', e.target.value as Placement)}
          sx={{ gap: 1 }}
        >
          {PLACEMENTS.map(p => (
            <Box
              key={p.value}
              sx={{
                border: '1px solid',
                borderColor: draft.placement === p.value ? 'primary.main' : 'divider',
                borderRadius: 2,
                p: 1.5,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                cursor: 'pointer',
              }}
              onClick={() => patch('placement', p.value)}
            >
              <FormControlLabel
                value={p.value}
                control={<Radio size="small" />}
                label=""
                sx={{ m: 0 }}
              />
              <Box
                sx={{
                  width: 48,
                  height: 36,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.7rem',
                  color: 'text.secondary',
                  flexShrink: 0,
                }}
              >
                {p.ratio}
              </Box>
              <Box sx={{ textAlign: 'left' }}>
                <Typography variant="body2" fontWeight={600}>{p.label}</Typography>
                <Typography variant="caption" color="text.secondary">{p.desc}</Typography>
              </Box>
            </Box>
          ))}
        </RadioGroup>
      </FormControl>

      {/* Contextual placement detail panel */}
      <Paper
        variant="outlined"
        sx={{ p: 2, borderColor: 'primary.main', borderRadius: 2, bgcolor: 'rgba(26,115,232,0.03)', textAlign: 'left' }}
        role="note"
        aria-label={`${draft.placement} placement details`}
      >
        <Typography variant="body2" fontWeight={500} sx={{ mb: 1, textAlign: 'left' }}>
          {placementDetail.headline}
        </Typography>
        <Box component="ul" sx={{ m: 0, pl: 2.5, textAlign: 'left' }}>
          {placementDetail.bullets.map(b => (
            <Box component="li" key={b} sx={{ mb: 0.25 }}>
              <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'left' }}>{b}</Typography>
            </Box>
          ))}
        </Box>
      </Paper>

      <TextField
        select
        label="Objective"
        required
        value={draft.objective}
        onChange={e => handleObjective(e.target.value as Objective)}
        helperText={OBJECTIVES.find(o => o.value === draft.objective)?.desc}
      >
        {OBJECTIVES.map(o => (
          <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
        ))}
      </TextField>

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          label="Campaign start date"
          type="date"
          required
          sx={{ flex: 1, minWidth: 160 }}
          InputLabelProps={{ shrink: true }}
          inputProps={{ min: today }}
          value={draft.startDate}
          onChange={e => handleStartDate(e.target.value)}
          error={!!startDateError}
          helperText={startDateError ?? undefined}
        />
        <TextField
          label="Campaign end date"
          type="date"
          sx={{ flex: 1, minWidth: 160 }}
          InputLabelProps={{ shrink: true }}
          inputProps={{ min: draft.startDate >= today ? draft.startDate : today }}
          value={draft.endDate}
          onChange={e => handleEndDate(e.target.value)}
          error={!!endDateError}
          helperText={endDateError ?? undefined}
        />
      </Box>
    </Box>
  )
}

export default StepDetails
