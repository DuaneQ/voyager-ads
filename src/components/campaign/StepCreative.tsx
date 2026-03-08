import React, { useRef, useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { type CampaignDraft, type CreativeType, type BusinessType } from '../../types/campaign'
import { ASSET_CONSTRAINTS } from '../../services/campaign/CampaignAssetService'
import CampaignAdPreview from './CampaignAdPreview'

interface Props {
  draft: CampaignDraft
  patch: <K extends keyof CampaignDraft>(key: K, value: CampaignDraft[K]) => void
}

const CTA_OPTIONS = ['Learn More', 'Book Now', 'Sign Up', 'Visit Shop']

const BUSINESS_TYPE_OPTIONS: { value: BusinessType; label: string }[] = [
  { value: 'restaurant', label: 'Restaurant / Cafe' },
  { value: 'hotel',      label: 'Hotel / Accommodation' },
  { value: 'tour',       label: 'Tour Operator' },
  { value: 'experience', label: 'Experience / Attraction' },
  { value: 'transport',  label: 'Transport / Transfer' },
  { value: 'shop',       label: 'Shop / Retail' },
  { value: 'activity',   label: 'Activity / Sport' },
  { value: 'other',      label: 'Other' },
]

/** The creative type is fully determined by placement — no user choice needed. */
const PLACEMENT_TYPE: Record<string, CreativeType> = {
  video_feed: 'video',
  itinerary_feed: 'image',
  ai_slot: 'image',
}

const SPECS: Record<string, string> = {
  video_feed: 'Vertical video (portrait) · MP4 or MOV · 5–60 seconds · max 500 MB',
  itinerary_feed: 'Square image · JPEG, PNG, or WebP · max 10 MB',
  ai_slot: 'Landscape image · JPEG, PNG, or WebP · max 5 MB',
}

const PLACEMENT_LABELS: Record<string, string> = {
  video_feed: 'Video',
  itinerary_feed: 'Image',
  ai_slot: 'Image',
}

const StepCreative: React.FC<Props> = ({ draft, patch }) => {
  const fileRef = useRef<HTMLInputElement>(null)
  const creativeType = PLACEMENT_TYPE[draft.placement] ?? 'image'
  const specText = SPECS[draft.placement] ?? ''
  const [fileError, setFileError] = useState<string | null>(null)

  /** True when a URL is entered but missing an https?:// scheme. */
  const landingUrlError =
    draft.landingUrl.trim().length > 0 &&
    !/^https?:\/\//i.test(draft.landingUrl.trim())
      ? 'URL must start with https:// (e.g. https://example.com)'
      : null

  /** Normalize bare domains to https:// on blur so the user doesn't have to type the scheme. */
  const handleLandingUrlBlur = () => {
    const url = draft.landingUrl.trim()
    if (url && !/^https?:\/\//i.test(url)) {
      patch('landingUrl', `https://${url}`)
    }
  }

  // Keep draft.creativeType in sync with placement (downstream steps may read it)
  useEffect(() => {
    if (draft.creativeType !== creativeType) patch('creativeType', creativeType)
  }, [draft.placement]) // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Synchronous client-side pre-check (type + size).
   * Video duration is async and is caught at submission time by CampaignAssetService.
   */
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setFileError(null)
    if (!file) {
      patch('assetFile', null)
      return
    }
    const constraints = ASSET_CONSTRAINTS[draft.placement]
    if (constraints) {
      if (!(constraints.acceptedMimeTypes as string[]).includes(file.type)) {
        const allowed = (constraints.acceptedMimeTypes as string[]).join(', ')
        setFileError(`Invalid file type "${file.type}". Accepted: ${allowed}.`)
        // Reset the input so the same file can be re-selected after correction
        if (fileRef.current) fileRef.current.value = ''
        return
      }
      if (file.size > constraints.maxSizeBytes) {
        const actualMb = (file.size / (1024 * 1024)).toFixed(1)
        setFileError(`File is ${actualMb} MB — exceeds the ${constraints.maxSizeDisplay} limit.`)
        if (fileRef.current) fileRef.current.value = ''
        return
      }
    }
    patch('assetFile', file)
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <TextField
        label="Creative name"
        required
        value={draft.creativeName}
        onChange={e => patch('creativeName', e.target.value)}
      />

      {/* Creative type is fixed by placement — no selector needed */}
      <Typography variant="body2" color="text.secondary">
        Creative type: <strong>{PLACEMENT_LABELS[draft.placement]}</strong>
        {creativeType === 'video'
          ? ' — video feed requires a video asset'
          : ' — image required for this placement'}
      </Typography>

      {specText && (
        <Typography variant="caption" color="text.secondary">{specText}</Typography>
      )}

      <Box>
        <input
          ref={fileRef}
          type="file"
          accept={creativeType === 'video' ? 'video/*' : 'image/*'}
          style={{ display: 'none' }}
          aria-label="Upload creative asset"
          onChange={handleFileChange}
        />
        <Button variant="outlined" size="small" onClick={() => fileRef.current?.click()}>
          {draft.assetFile ? 'Replace asset' : 'Upload asset'}
        </Button>
        {draft.assetFile && (
          <Typography variant="caption" sx={{ ml: 1.5 }} color="text.secondary">
            {draft.assetFile.name}
          </Typography>
        )}
        {fileError && (
          <Typography variant="caption" color="error" display="block" sx={{ mt: 0.5 }}>
            {fileError}
          </Typography>
        )}
      </Box>

      {/* ── Ad preview — full fidelity preview matching what the user will see in-app ── */}
      <CampaignAdPreview draft={draft} />

      <TextField
        label="Primary text"
        multiline
        minRows={2}
        inputProps={{ maxLength: 300 }}
        helperText={`${draft.primaryText.length}/300`}
        value={draft.primaryText}
        onChange={e => patch('primaryText', e.target.value)}
      />

      <TextField
        select
        label="Call to action"
        value={draft.cta}
        onChange={e => patch('cta', e.target.value)}
      >
        {CTA_OPTIONS.map(o => (
          <MenuItem key={o} value={o}>{o}</MenuItem>
        ))}
      </TextField>

      <TextField
        label="Landing URL"
        type="url"
        required
        value={draft.landingUrl}
        onChange={e => patch('landingUrl', e.target.value)}
        onBlur={handleLandingUrlBlur}
        placeholder="https://"
        error={!!landingUrlError}
        helperText={landingUrlError ?? 'The page users will land on after tapping your ad'}
      />

      {/* ── AI Slot specific fields ── */}
      {draft.placement === 'ai_slot' && (
        <>
          <Divider>
            <Typography variant="caption" color="text.secondary">AI Slot Details</Typography>
          </Divider>

          <TextField
            select
            label="Business type"
            required
            value={draft.businessType}
            onChange={e => patch('businessType', e.target.value as BusinessType)}
            helperText="How your business will be categorised inside the itinerary card"
          >
            {BUSINESS_TYPE_OPTIONS.map(o => (
              <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
            ))}
          </TextField>

          <TextField
            label="Address"
            value={draft.address}
            onChange={e => patch('address', e.target.value)}
            placeholder="123 Main St, Dubrovnik, Croatia"
            helperText="Business address shown on the promotion card (optional)"
          />

          <TextField
            label="Phone"
            type="tel"
            value={draft.phone}
            onChange={e => patch('phone', e.target.value)}
            placeholder="+1 555 000 0000"
            helperText="Phone number shown on the promotion card (optional)"
          />

          <TextField
            label="Email"
            type="email"
            value={draft.email}
            onChange={e => patch('email', e.target.value)}
            placeholder="hello@yourbusiness.com"
            helperText="Email shown on the promotion card (optional)"
          />

          <TextField
            label="Promo code"
            value={draft.promoCode}
            onChange={e => patch('promoCode', e.target.value)}
            placeholder="e.g. TRAVEL20"
            helperText="Discount code displayed to travellers viewing the itinerary (optional)"
            inputProps={{ style: { textTransform: 'uppercase' } }}
          />
        </>
      )}
    </Box>
  )
}

export default StepCreative
