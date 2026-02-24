/**
 * CampaignAdPreview
 *
 * Shows a live ad preview on the Review step for all three placements:
 *  • itinerary_feed — delegates to ItineraryFeedAdPreview (pixel-faithful card)
 *  • video_feed     — phone chrome frame (9:16 portrait, like TikTok / Reels)
 *  • ai_slot        — landscape content card with branded overlay
 *
 * Purely presentational — no network calls or side effects beyond the object URL
 * lifecycle for the uploaded asset file.
 */
import React, { useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'
import FavoriteIcon from '@mui/icons-material/Favorite'
import ShareIcon from '@mui/icons-material/Share'
import SmartDisplayOutlinedIcon from '@mui/icons-material/SmartDisplayOutlined'
import TextsmsOutlinedIcon from '@mui/icons-material/TextsmsOutlined'
import type { CampaignDraft } from '../../types/campaign'
import ItineraryFeedAdPreview from './ItineraryFeedAdPreview'

interface Props {
  draft: CampaignDraft
}

// ─── Video Feed (portrait phone frame) ───────────────────────────────────────

const VideoFeedPreview: React.FC<{ imageUrl: string | null; primaryText: string; cta: string }> = ({
  imageUrl,
  primaryText,
  cta,
}) => (
  <Box
    sx={{ maxWidth: 200, mx: 'auto', width: '100%' }}
    role="img"
    aria-label="Ad preview — how your ad will appear in the video feed"
  >
    <Typography
      variant="caption"
      sx={{ display: 'block', mb: 1, color: '#64748b', textAlign: 'center', letterSpacing: 0.4 }}
    >
      Preview · Video Feed
    </Typography>

    {/* Phone chrome */}
    <Box
      sx={{
        borderRadius: '24px',
        border: '3px solid #1e293b',
        overflow: 'hidden',
        position: 'relative',
        bgcolor: '#000',
        aspectRatio: '9 / 16',
        boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
      }}
    >
      {/* Asset or placeholder */}
      {imageUrl ? (
        <Box
          component="img"
          src={imageUrl}
          alt="Ad creative"
          sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      ) : (
        <Box
          sx={{
            width: '100%', height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column', gap: 1,
          }}
        >
          <SmartDisplayOutlinedIcon sx={{ fontSize: 36, color: '#334155' }} />
          <Typography variant="caption" sx={{ color: '#475569', textAlign: 'center', px: 2 }}>
            Upload a video or image
          </Typography>
        </Box>
      )}

      {/* Right-rail action icons — like TikTok */}
      <Box
        sx={{
          position: 'absolute', right: 8, bottom: 80,
          display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center',
        }}
      >
        {[
          { icon: <FavoriteIcon sx={{ fontSize: 20 }} />, label: '1.2K' },
          { icon: <TextsmsOutlinedIcon sx={{ fontSize: 20 }} />, label: '84' },
          { icon: <ShareIcon sx={{ fontSize: 20 }} />, label: 'Share' },
        ].map(({ icon, label }) => (
          <Box key={label} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#fff' }}>
            {icon}
            <Typography sx={{ fontSize: 9, color: '#fff', lineHeight: 1.2 }}>{label}</Typography>
          </Box>
        ))}
      </Box>

      {/* Bottom overlay — text + CTA */}
      <Box
        sx={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%)',
          px: 1.5, pb: 1.5, pt: 5,
        }}
      >
        <Box
          sx={{
            display: 'inline-block',
            bgcolor: 'rgba(0,0,0,0.5)',
            borderRadius: '4px',
            px: '5px',
            py: '2px',
            mb: 0.5,
          }}
        >
          <Typography sx={{ color: '#fff', fontSize: 9, fontWeight: 500 }}>Sponsored</Typography>
        </Box>
        <Typography
          sx={{
            color: '#fff', fontSize: 11, fontWeight: 600, lineHeight: 1.3,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
            mb: 1,
          }}
        >
          {primaryText || 'Your primary text will appear here'}
        </Typography>
        <Box
          component="span"
          sx={{
            display: 'inline-block',
            bgcolor: '#1a73e8',
            color: '#fff',
            fontSize: 10,
            fontWeight: 700,
            px: 1.5,
            py: 0.5,
            borderRadius: '6px',
          }}
        >
          {cta || 'Learn More'}
        </Box>
      </Box>
    </Box>
  </Box>
)

// ─── AI Slot (landscape content card) ────────────────────────────────────────

const AiSlotPreview: React.FC<{ imageUrl: string | null; primaryText: string; cta: string }> = ({
  imageUrl,
  primaryText,
  cta,
}) => (
  <Box
    sx={{ maxWidth: 420, mx: 'auto', width: '100%' }}
    role="img"
    aria-label="Ad preview — how your ad will appear as a sponsored AI itinerary slot"
  >
    <Typography
      variant="caption"
      sx={{ display: 'block', mb: 1, color: '#64748b', textAlign: 'center', letterSpacing: 0.4 }}
    >
      Preview · AI Itinerary Slot
    </Typography>

    <Box
      sx={{
        bgcolor: '#fff',
        borderRadius: 3,
        border: '1px solid rgba(26,115,232,0.2)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        overflow: 'hidden',
      }}
    >
      {/* Image — 3:2 landscape */}
      <Box sx={{ position: 'relative', width: '100%', aspectRatio: '3 / 2', bgcolor: '#e8f0fe' }}>
        {imageUrl ? (
          <Box
            component="img"
            src={imageUrl}
            alt="Ad creative"
            sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <Box
            sx={{
              width: '100%', height: '100%', display: 'flex',
              alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 1,
              border: '2px dashed #bfdbfe',
            }}
          >
            <Typography variant="caption" color="text.disabled" sx={{ textAlign: 'center', px: 2 }}>
              Upload a landscape image to preview
            </Typography>
          </Box>
        )}

        {/* Sponsored + AI badge */}
        <Box sx={{ position: 'absolute', top: 8, left: 8, display: 'flex', gap: 0.75 }}>
          <Box sx={{ bgcolor: 'rgba(0,0,0,0.52)', borderRadius: '4px', px: '6px', py: '2px' }}>
            <Typography sx={{ color: '#fff', fontSize: 10, fontWeight: 500 }}>Sponsored</Typography>
          </Box>
          <Box sx={{ bgcolor: '#7c3aed', borderRadius: '4px', px: '6px', py: '2px', display: 'flex', alignItems: 'center', gap: '3px' }}>
            <SmartDisplayOutlinedIcon sx={{ fontSize: 11, color: '#fff' }} />
            <Typography sx={{ color: '#fff', fontSize: 10, fontWeight: 500 }}>AI Pick</Typography>
          </Box>
        </Box>
      </Box>

      {/* Body */}
      <Box sx={{ px: 2, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
        <Typography
          sx={{
            fontSize: 13, color: '#213547', fontWeight: 600, lineHeight: 1.4,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
            flex: 1,
          }}
        >
          {primaryText || <Box component="span" sx={{ color: '#cbd5e1', fontStyle: 'italic', fontWeight: 400 }}>Primary text will appear here</Box>}
        </Typography>
        <Chip
          label={cta || 'Learn More'}
          size="small"
          sx={{ bgcolor: '#1a73e8', color: '#fff', fontWeight: 700, fontSize: 11, flexShrink: 0 }}
        />
      </Box>
    </Box>
  </Box>
)

// ─── Main export ─────────────────────────────────────────────────────────────

const CampaignAdPreview: React.FC<Props> = ({ draft }) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!draft.assetFile) { setPreviewUrl(null); return }
    const url = URL.createObjectURL(draft.assetFile)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [draft.assetFile])

  if (draft.placement === 'itinerary_feed') {
    return (
      <ItineraryFeedAdPreview
        imageUrl={previewUrl}
        destination={draft.targetDestination || draft.location}
        primaryText={draft.primaryText}
        cta={draft.cta}
      />
    )
  }

  if (draft.placement === 'video_feed') {
    return <VideoFeedPreview imageUrl={previewUrl} primaryText={draft.primaryText} cta={draft.cta} />
  }

  return <AiSlotPreview imageUrl={previewUrl} primaryText={draft.primaryText} cta={draft.cta} />
}

export default CampaignAdPreview
