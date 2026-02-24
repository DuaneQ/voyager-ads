import React, { useRef, useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { type CampaignDraft, type CreativeType } from '../../types/campaign'
import ItineraryFeedAdPreview from './ItineraryFeedAdPreview'

interface Props {
  draft: CampaignDraft
  patch: <K extends keyof CampaignDraft>(key: K, value: CampaignDraft[K]) => void
}

const CTA_OPTIONS = ['Learn More', 'Book Now', 'Sign Up', 'Visit Shop']

const SPECS: Record<string, Record<CreativeType, string>> = {
  video_feed: {
    image: 'Square or vertical image · JPG or PNG · max 10 MB',
    video: 'Vertical video (portrait) · MP4 · 15–60 seconds · max 50 MB',
  },
  itinerary_feed: {
    image: 'Square image · JPG or PNG · max 10 MB',
    video: 'Square video · MP4 · max 50 MB',
  },
  ai_slot: {
    image: 'Landscape image · JPG or PNG · max 5 MB',
    video: 'Video not supported for AI Slots — use an image',
  },
}

/** Placements that only accept image creatives */
const IMAGE_ONLY_PLACEMENTS = new Set(['itinerary_feed', 'ai_slot'])

const StepCreative: React.FC<Props> = ({ draft, patch }) => {
  const fileRef = useRef<HTMLInputElement>(null)
  const isImageOnly = IMAGE_ONLY_PLACEMENTS.has(draft.placement)
  // Automatically enforce image when placement requires it
  const effectiveType: CreativeType = isImageOnly ? 'image' : draft.creativeType
  const specText = SPECS[draft.placement]?.[effectiveType] ?? ''

  // Revoke previous object URL to avoid memory leaks
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!draft.assetFile) {
      setPreviewUrl(null)
      return
    }
    const url = URL.createObjectURL(draft.assetFile)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [draft.assetFile])

  // 1:1 preview dimensions for itinerary_feed
  const previewAspect = draft.placement === 'itinerary_feed' ? '1 / 1'
    : draft.placement === 'ai_slot' ? '3 / 2'
    : '9 / 16'

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <TextField
        label="Creative name"
        required
        value={draft.creativeName}
        onChange={e => patch('creativeName', e.target.value)}
      />

      {isImageOnly ? (
        <Typography variant="body2" color="text.secondary">
          Creative type: <strong>Image</strong> — video is not supported for this placement.
        </Typography>
      ) : (
        <TextField
          select
          label="Creative type"
          value={draft.creativeType}
          onChange={e => patch('creativeType', e.target.value as CreativeType)}
        >
          <MenuItem value="image">Image</MenuItem>
          <MenuItem value="video">Video</MenuItem>
        </TextField>
      )}

      {specText && (
        <Typography variant="caption" color="text.secondary">{specText}</Typography>
      )}

      <Box>
        <input
          ref={fileRef}
          type="file"
          accept={effectiveType === 'video' ? 'video/*' : 'image/*'}
          style={{ display: 'none' }}
          aria-label="Upload creative asset"
          onChange={e => {
            const file = e.target.files?.[0] ?? null
            patch('assetFile', file)
          }}
        />
        <Button variant="outlined" size="small" onClick={() => fileRef.current?.click()}>
          {draft.assetFile ? 'Replace asset' : 'Upload asset'}
        </Button>
        {draft.assetFile && (
          <Typography variant="caption" sx={{ ml: 1.5 }} color="text.secondary">
            {draft.assetFile.name}
          </Typography>
        )}
      </Box>

      {/* ── Ad preview ── */}
      {draft.placement === 'itinerary_feed' ? (
        /* Full card preview — mirrors SponsoredItineraryCard from the mobile app */
        <ItineraryFeedAdPreview
          imageUrl={previewUrl}
          destination={draft.targetDestination || draft.location}
          primaryText={draft.primaryText}
          cta={draft.cta}
        />
      ) : previewUrl && effectiveType === 'image' ? (
        /* Simple aspect-ratio frame for video_feed / ai_slot */
        <Box
          sx={{
            aspectRatio: previewAspect,
            maxWidth: draft.placement === 'video_feed' ? 180 : '100%',
            maxHeight: 360,
            overflow: 'hidden',
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            position: 'relative',
          }}
        >
          <Box
            component="img"
            src={previewUrl}
            alt="Asset preview"
            sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <Box
            sx={{
              position: 'absolute',
              bottom: 8,
              left: 8,
              bgcolor: 'rgba(0,0,0,0.5)',
              color: '#fff',
              fontSize: '0.65rem',
              px: 0.75,
              py: 0.25,
              borderRadius: 0.5,
              lineHeight: 1.4,
            }}
          >
            Sponsored
          </Box>
        </Box>
      ) : !previewUrl && (draft.placement as string) !== 'itinerary_feed' ? (
        <Box
          sx={{
            aspectRatio: previewAspect,
            maxWidth: draft.placement === 'video_feed' ? 180 : 320,
            border: '1px dashed',
            borderColor: 'divider',
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          aria-label={`${previewAspect} preview placeholder`}
        >
          <Typography variant="caption" color="text.secondary">Upload an image to preview</Typography>
        </Box>
      ) : null}

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
        value={draft.landingUrl}
        onChange={e => patch('landingUrl', e.target.value)}
        placeholder="https://"
      />
    </Box>
  )
}

export default StepCreative
