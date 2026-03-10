import React, { useRef, useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import Popover from '@mui/material/Popover'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import { type CampaignDraft, type CreativeType, type BusinessType } from '../../types/campaign'
import { ASSET_CONSTRAINTS, getImageDimensions } from '../../services/campaign/CampaignAssetService'
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
  video_feed: 'Vertical video (portrait 9:16) · MP4 or MOV · 5–60 seconds · max 500 MB',
  itinerary_feed: 'Square image (1:1) · Recommended 1080×1080 px · JPEG, PNG, or WebP · max 10 MB',
  ai_slot: 'Landscape image (16:9) · Recommended 1920×1080 px · JPEG, PNG, or WebP · max 5 MB',
}

/**
 * Per-placement image spec guide shown in the info popover.
 * Mirrors Google Ads' "Image requirements" panel pattern:
 *   - visual ratio diagram
 *   - accepted ratio range
 *   - recommended & minimum pixel dimensions
 *   - file type + size limits
 *   - a brief "how to resize" tip
 */
interface PlacementSpecGuide {
  label: string
  ratioLabel: string
  /** SVG viewBox width:height ratio for the diagram box */
  diagramW: number
  diagramH: number
  recommended: string
  minimum: string
  formats: string
  maxSize: string
  tipTitle: string
  tip: string
}

const IMAGE_SPEC_GUIDE: Record<string, PlacementSpecGuide> = {
  itinerary_feed: {
    label: 'Itinerary Feed',
    ratioLabel: '1:1  (square)',
    diagramW: 1,
    diagramH: 1,
    recommended: '1080 × 1080 px',
    minimum: '600 × 600 px',
    formats: 'JPEG, PNG, WebP',
    maxSize: '10 MB',
    tipTitle: 'How to resize quickly',
    tip: 'Open your image in any photo editor (Preview, Canva, Photoshop) and crop or export at 1080 × 1080 px. Accepted range: 4:5 (portrait) to 5:4 (slight landscape).',
  },
  ai_slot: {
    label: 'AI Itinerary Slot',
    ratioLabel: '16:9  (landscape)',
    diagramW: 16,
    diagramH: 9,
    recommended: '1920 × 1080 px',
    minimum: '1280 × 720 px',
    formats: 'JPEG, PNG, WebP',
    maxSize: '5 MB',
    tipTitle: 'How to resize quickly',
    tip: 'Export your creative at 1920 × 1080 px (standard HD). Most design tools (Canva, Figma, Photoshop) have a "Presentation 16:9" preset. Minimum accepted ratio: 4:3.',
  },
}

/** SVG diagram that visualises the target aspect ratio with accepted range shading. */
function RatioDiagram({ w, h }: { w: number; h: number }) {
  const scale = 80 / Math.max(w, h)
  const pw = Math.round(w * scale)
  const ph = Math.round(h * scale)
  return (
    <svg width={pw + 4} height={ph + 4} aria-hidden="true">
      {/* shadow */}
      <rect x={3} y={3} width={pw} height={ph} rx={3} fill="rgba(0,0,0,0.08)" />
      {/* box */}
      <rect x={1} y={1} width={pw} height={ph} rx={3} fill="#e8f0fe" stroke="#4285f4" strokeWidth={1.5} />
      {/* dimension label */}
      <text
        x={pw / 2 + 1}
        y={ph / 2 + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={10}
        fill="#1a73e8"
        fontWeight="600"
        fontFamily="sans-serif"
      >
        {w}:{h}
      </text>
    </svg>
  )
}

/** Info icon + Popover showing per-placement image requirements (image placements only). */
function AssetSpecPopover({ placement }: { placement: string }) {
  const spec = IMAGE_SPEC_GUIDE[placement]
  const [anchor, setAnchor] = useState<HTMLButtonElement | null>(null)
  if (!spec) return null

  return (
    <>
      <IconButton
        size="small"
        aria-label="Image requirements guide"
        onClick={e => setAnchor(e.currentTarget)}
        sx={{ ml: 0.5, color: '#5f6368', '&:hover': { color: '#1a73e8' } }}
      >
        <InfoOutlinedIcon fontSize="small" />
      </IconButton>

      <Popover
        open={Boolean(anchor)}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        PaperProps={{
          sx: {
            width: 320,
            p: 2.5,
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0,0,0,0.14)',
          },
        }}
      >
        {/* Header */}
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
          Image requirements — {spec.label}
        </Typography>

        {/* Ratio diagram + key facts side-by-side */}
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ flexShrink: 0, pt: 0.5 }}>
            <RatioDiagram w={spec.diagramW} h={spec.diagramH} />
            <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', color: '#5f6368', mt: 0.5 }}>
              {spec.ratioLabel}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
            <SpecRow label="Recommended" value={spec.recommended} />
            <SpecRow label="Minimum" value={spec.minimum} />
            <SpecRow label="Formats" value={spec.formats} />
            <SpecRow label="Max size" value={spec.maxSize} />
          </Box>
        </Box>

        <Divider sx={{ mb: 1.5 }} />

        {/* Tip */}
        <Typography variant="caption" sx={{ fontWeight: 700, color: '#3c4043', display: 'block', mb: 0.5 }}>
          💡 {spec.tipTitle}
        </Typography>
        <Typography variant="caption" sx={{ color: '#5f6368', lineHeight: 1.55 }}>
          {spec.tip}
        </Typography>
      </Popover>
    </>
  )
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ display: 'flex', gap: 0.5 }}>
      <Typography variant="caption" sx={{ color: '#5f6368', minWidth: 80 }}>{label}</Typography>
      <Typography variant="caption" sx={{ fontWeight: 600, color: '#3c4043' }}>{value}</Typography>
    </Box>
  )
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
   * Validates type, size, and (for images) aspect ratio as soon as a file is
   * selected — the same rules CampaignAssetService enforces at submit time, so
   * the user gets feedback immediately rather than at the final step.
   */
  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
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
        if (fileRef.current) fileRef.current.value = ''
        return
      }
      if (file.size > constraints.maxSizeBytes) {
        const actualMb = (file.size / (1024 * 1024)).toFixed(1)
        setFileError(`File is ${actualMb} MB — exceeds the ${constraints.maxSizeDisplay} limit.`)
        if (fileRef.current) fileRef.current.value = ''
        return
      }
      // Aspect-ratio check for image placements — run async before committing the file
      if (
        constraints.minAspectRatio !== null ||
        constraints.maxAspectRatio !== null
      ) {
        try {
          const { width, height } = await getImageDimensions(file)
          const ratio = width / height
          if (constraints.minAspectRatio !== null && ratio < constraints.minAspectRatio) {
            setFileError(
              `Image dimensions ${width}×${height} (ratio ${ratio.toFixed(2)}) are too tall. ${
                constraints.aspectRatioGuidance ?? 'Please use a wider image.'
              }`
            )
            if (fileRef.current) fileRef.current.value = ''
            return
          }
          if (constraints.maxAspectRatio !== null && ratio > constraints.maxAspectRatio) {
            setFileError(
              `Image dimensions ${width}×${height} (ratio ${ratio.toFixed(2)}) are too wide. ${
                constraints.aspectRatioGuidance ?? 'Please use a taller image.'
              }`
            )
            if (fileRef.current) fileRef.current.value = ''
            return
          }
        } catch {
          // Non-fatal: if we can't read dimensions, let the server-side validate
        }
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
        {/* Upload button + info icon (opens image spec guide for image placements) */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Button variant="outlined" size="small" onClick={() => fileRef.current?.click()}>
            {draft.assetFile ? 'Replace asset' : 'Upload asset'}
          </Button>
          <AssetSpecPopover placement={draft.placement} />
          {draft.assetFile && (
            <Typography variant="caption" sx={{ ml: 1 }} color="text.secondary">
              {draft.assetFile.name}
            </Typography>
          )}
        </Box>
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
