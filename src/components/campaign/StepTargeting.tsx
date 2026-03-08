import React from 'react'
import Box from '@mui/material/Box'
import Checkbox from '@mui/material/Checkbox'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import FormControlLabel from '@mui/material/FormControlLabel'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { type CampaignDraft } from '../../types/campaign'
import DestinationAutocomplete from '../common/DestinationAutocomplete'
import { todayLocalDate, validateTravelDates } from '../../utils/dateUtils'

interface Props {
  draft: CampaignDraft
  patch: <K extends keyof CampaignDraft>(key: K, value: CampaignDraft[K]) => void
}

const AGES = ['18', '25', '35', '45', '55']
const AGES_TO = ['24', '34', '44', '54', '65+']

const TRIP_TYPES = [
  'leisure', 'business', 'adventure', 'romantic', 'family', 'bachelor', 'spiritual',
]

const ACTIVITY_PREFERENCES = [
  'Cultural', 'Adventure', 'Relaxation', 'Nightlife', 'Shopping',
  'Food & Dining', 'Nature', 'Photography',
]

const TRAVEL_STYLES = ['budget', 'mid-range', 'luxury', 'backpacker']

/** Matches the gender options on itinerary documents in Firestore. '' = no filter. */
const GENDER_OPTIONS: { label: string; value: string }[] = [
  { label: 'All genders', value: '' },
  { label: 'Male', value: 'Male' },
  { label: 'Female', value: 'Female' },
  { label: 'Non-binary', value: 'Non-binary' },
  { label: 'Transgender Woman', value: 'Transgender Woman' },
  { label: 'Transgender Man', value: 'Transgender Man' },
  { label: 'Gender Neutral', value: 'Gender Neutral' },
  { label: 'Prefer not to say', value: 'Prefer not to say' },
  { label: 'No Preference', value: 'No Preference' },
]

const StepTargeting: React.FC<Props> = ({ draft, patch }) => {
  const isItineraryFeed = draft.placement === 'itinerary_feed'
  const isAiSlot = draft.placement === 'ai_slot'

  /** Toggle a value in one of the string[] targeting arrays */
  function toggleArrayValue<K extends 'targetTripTypes' | 'targetActivityPreferences' | 'targetTravelStyles'>(
    key: K,
    value: string
  ) {
    const current = draft[key] as string[]
    const next = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value]
    patch(key, next as CampaignDraft[K])
  }
  const today = todayLocalDate()
  const travelDateErrors = validateTravelDates(
    draft.targetTravelStartDate,
    draft.targetTravelEndDate
  )

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <TextField
        label="Audience name"
        required
        value={draft.audienceName}
        onChange={e => patch('audienceName', e.target.value)}
      />

      {/* ── Itinerary Feed primary targeting ─────────────────────────────── */}
      {isItineraryFeed && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="body2" fontWeight={600}>
            Itinerary feed targeting
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mt: -1 }}>
            Your ad is matched to users whose itinerary destination and travel dates overlap with these values.
            These map directly to the <code>destination</code>, <code>startDay</code>, and <code>endDay</code> filters
            used by the search feed.
          </Typography>

          <DestinationAutocomplete
            required
            value={draft.targetDestination}
            onSelect={(description, placeId) => {
              patch('targetDestination', description)
              patch('targetPlaceId', placeId)
            }}
            helperText={
              draft.targetPlaceId
                ? `Matched by name · Place ID confirmed (${draft.targetPlaceId.slice(0, 12)}…)`
                : 'Matched by destination name · select from the list to add Place ID disambiguation'
            }
          />

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              label="Travel start date"
              type="date"
              sx={{ flex: 1, minWidth: 160 }}
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: today }}
              value={draft.targetTravelStartDate}
              onChange={e => patch('targetTravelStartDate', e.target.value)}
              error={!!travelDateErrors.startError}
              helperText={travelDateErrors.startError ?? 'Show to users traveling from this date'}
            />
            <TextField
              label="Travel end date"
              type="date"
              sx={{ flex: 1, minWidth: 160 }}
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: draft.targetTravelStartDate || today }}
              value={draft.targetTravelEndDate}
              onChange={e => patch('targetTravelEndDate', e.target.value)}
              error={!!travelDateErrors.endError}
              helperText={travelDateErrors.endError ?? 'Show to users traveling until this date'}
            />
          </Box>

          <FormControlLabel
            control={
              <Checkbox
                checked={draft.destinationMatch}
                onChange={e => patch('destinationMatch', e.target.checked)}
              />
            }
            label="Strict destination match — only show to users whose itinerary destination exactly matches"
          />

          <Divider />
          <Typography variant="caption" color="text.secondary" fontWeight={500}>
            Additional targeting (optional)
          </Typography>
        </Box>
      )}

      {/* ── AI Slot preference targeting ──────────────────────────────────── */}
      {isAiSlot && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="body2" fontWeight={600}>
            AI itinerary targeting
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mt: -1 }}>
            Target users based on the preferences they selected when generating their AI itinerary.
            Leave all unselected to show to everyone.
          </Typography>

          {/* Trip type */}
          <Box>
            <Typography variant="body2" fontWeight={500} sx={{ mb: 0.75 }}>Trip type</Typography>
            <Stack direction="row" flexWrap="wrap" gap={0.75}>
              {TRIP_TYPES.map(t => (
                <Chip
                  key={t}
                  label={t.charAt(0).toUpperCase() + t.slice(1)}
                  size="small"
                  onClick={() => toggleArrayValue('targetTripTypes', t)}
                  color={draft.targetTripTypes.includes(t) ? 'primary' : 'default'}
                  variant={draft.targetTripTypes.includes(t) ? 'filled' : 'outlined'}
                  sx={{ cursor: 'pointer', textTransform: 'capitalize' }}
                />
              ))}
            </Stack>
          </Box>

          {/* Activity preferences */}
          <Box>
            <Typography variant="body2" fontWeight={500} sx={{ mb: 0.75 }}>Activity preferences</Typography>
            <Stack direction="row" flexWrap="wrap" gap={0.75}>
              {ACTIVITY_PREFERENCES.map(a => (
                <Chip
                  key={a}
                  label={a}
                  size="small"
                  onClick={() => toggleArrayValue('targetActivityPreferences', a)}
                  color={draft.targetActivityPreferences.includes(a) ? 'primary' : 'default'}
                  variant={draft.targetActivityPreferences.includes(a) ? 'filled' : 'outlined'}
                  sx={{ cursor: 'pointer' }}
                />
              ))}
            </Stack>
          </Box>

          {/* Travel style */}
          <Box>
            <Typography variant="body2" fontWeight={500} sx={{ mb: 0.75 }}>Travel style</Typography>
            <Stack direction="row" flexWrap="wrap" gap={0.75}>
              {TRAVEL_STYLES.map(s => (
                <Chip
                  key={s}
                  label={s.charAt(0).toUpperCase() + s.slice(1)}
                  size="small"
                  onClick={() => toggleArrayValue('targetTravelStyles', s)}
                  color={draft.targetTravelStyles.includes(s) ? 'primary' : 'default'}
                  variant={draft.targetTravelStyles.includes(s) ? 'filled' : 'outlined'}
                  sx={{ cursor: 'pointer', textTransform: 'capitalize' }}
                />
              ))}
            </Stack>
          </Box>

          <Divider />
          <Typography variant="caption" color="text.secondary" fontWeight={500}>
            Additional targeting (optional)
          </Typography>
        </Box>
      )}

      {/* ── General location (ai_slot only — destination context is available from the active itinerary) ── */}
      {isAiSlot && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={draft.location === ''}
                onChange={e => {
                  if (e.target.checked) {
                    patch('location', '')
                  }
                }}
              />
            }
            label={
              <Typography variant="body2">
                Any destination —{' '}
                <Typography component="span" variant="caption" color="text.secondary">
                  show to users traveling anywhere
                </Typography>
              </Typography>
            }
          />
          {draft.location !== '' && (
            <DestinationAutocomplete
              label="Location"
              value={draft.location}
              onSelect={(description) => patch('location', description)}
              helperText="Enter a country, region, or city"
            />
          )}
          {draft.location === '' && (
            <Typography variant="caption" color="text.secondary" sx={{ pl: 0.5 }}>
              Your ad will be eligible regardless of the user's travel destination.
            </Typography>
          )}
        </Box>
      )}

      {/* ── Age range ────────────────────────────────────────────────────── */}
      <Box>
        <Typography variant="body2" fontWeight={500} sx={{ mb: 1 }}>
          Age range{' '}
          <Typography component="span" variant="caption" color="text.secondary">
            (requires user consent)
          </Typography>
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <TextField
            select
            label="From"
            size="small"
            sx={{ width: 100 }}
            value={draft.ageFrom}
            onChange={e => patch('ageFrom', e.target.value)}
          >
            {AGES.map(a => <MenuItem key={a} value={a}>{a}</MenuItem>)}
          </TextField>
          <Typography variant="body2" color="text.secondary">to</Typography>
          <TextField
            select
            label="To"
            size="small"
            sx={{ width: 100 }}
            value={draft.ageTo}
            onChange={e => patch('ageTo', e.target.value)}
          >
            {AGES_TO.map(a => <MenuItem key={a} value={a}>{a}</MenuItem>)}
          </TextField>
        </Box>
      </Box>

      <TextField
        select
        label="Gender"
        value={draft.targetGender}
        onChange={e => patch('targetGender', e.target.value)}
        helperText="Target users by gender identity. Leave as 'All genders' to show to everyone."
      >
        {GENDER_OPTIONS.map(opt => (
          <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
        ))}
      </TextField>

    </Box>
  )
}

export default StepTargeting
