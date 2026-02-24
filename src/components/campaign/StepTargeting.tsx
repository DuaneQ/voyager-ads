import React from 'react'
import Box from '@mui/material/Box'
import Checkbox from '@mui/material/Checkbox'
import Divider from '@mui/material/Divider'
import FormControlLabel from '@mui/material/FormControlLabel'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { type CampaignDraft } from '../../types/campaign'
import DestinationAutocomplete from '../common/DestinationAutocomplete'

interface Props {
  draft: CampaignDraft
  patch: <K extends keyof CampaignDraft>(key: K, value: CampaignDraft[K]) => void
}

const AGES = ['18', '25', '35', '45', '55']
const AGES_TO = ['24', '34', '44', '54', '65+']

const StepTargeting: React.FC<Props> = ({ draft, patch }) => {
  const isItineraryFeed = draft.placement === 'itinerary_feed'

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
              value={draft.targetTravelStartDate}
              onChange={e => patch('targetTravelStartDate', e.target.value)}
              helperText="Show to users traveling from this date"
            />
            <TextField
              label="Travel end date"
              type="date"
              sx={{ flex: 1, minWidth: 160 }}
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: draft.targetTravelStartDate }}
              value={draft.targetTravelEndDate}
              onChange={e => patch('targetTravelEndDate', e.target.value)}
              helperText="Show to users traveling until this date"
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

      {/* ── General location (non-itinerary-feed or additional) ───────────── */}
      {!isItineraryFeed && (
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <TextField
            label="Location"
            required
            sx={{ flex: 2, minWidth: 200 }}
            placeholder="Country or city"
            value={draft.location}
            onChange={e => patch('location', e.target.value)}
            helperText="Enter a country, region, or city"
          />
          <TextField
            label="Radius (km)"
            type="number"
            sx={{ flex: 1, minWidth: 120 }}
            inputProps={{ min: 1 }}
            value={draft.radius}
            onChange={e => patch('radius', e.target.value)}
          />
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
        label="Interests"
        value={draft.interests}
        onChange={e => patch('interests', e.target.value)}
        placeholder="beach, adventure, family travel"
        helperText="Comma-separated interests"
      />
    </Box>
  )
}

export default StepTargeting
