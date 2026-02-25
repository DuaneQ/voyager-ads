/**
 * ItineraryFeedAdPreview
 *
 * A pixel-faithful web port of the itinerary feed ad card that shows advertisers
 * exactly how their ad will render inside the traveler matching feed — same card
 * dimensions, same typography scale, same Sponsored pill, same CTA button.
 *
 * Purely presentational: no network calls, no side-effects.
 *
 * ─── RN INTEGRATION TODO ────────────────────────────────────────────────────
 * When the ad-serving backend is ready, a SponsoredItineraryCard component must
 * be created in voyager-RN and wired into SearchPage BEFORE doing so:
 *
 *  1. Get explicit approval to modify voyager-RN (separate repo/app).
 *  2. Define the ItineraryFeedAd shape in a shared types file or copy it from
 *     the backend ad-selection endpoint response contract.
 *  3. Create `src/components/search/SponsoredItineraryCard.tsx` in voyager-RN
 *     matching the visual spec here (keep in sync with this component).
 *  4. Inject the sponsored card into the SearchPage results list at a controlled
 *     position (e.g. every N organic results) — do NOT modify SearchPage until
 *     the ad-selection endpoint exists and is tested.
 *  5. Add impression + click logging callbacks before going live.
 *
 * This component (voyager-ads) owns the PREVIEW only.
 * voyager-RN owns the LIVE RENDER — those are two separate concerns in two
 * separate repos and must be treated as independent work items.
 * ────────────────────────────────────────────────────────────────────────────
 */
import React from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

export interface ItineraryFeedAdPreviewProps {
  /** Object URL (URL.createObjectURL) or null when no asset is uploaded yet */
  imageUrl: string | null
  /** campaign draft destination — for itinerary_feed this is targetDestination */
  destination?: string
  primaryText?: string
  cta?: string
  /** Shown above the destination, mirrors advertiser branding */
  advertiserName?: string
}

const CARD_MAX_WIDTH = 360
const IMAGE_BG = '#e8f0fe'

const ItineraryFeedAdPreview: React.FC<ItineraryFeedAdPreviewProps> = ({
  imageUrl,
  destination,
  primaryText,
  cta = 'Learn More',
  advertiserName = 'Your business',
}) => {
  return (
    /**
     * Outer wrapper — mimics a phone viewport so proportions look right.
     * 360 px = the narrowest common Android screen (same reference as the RN
     * CARD_WIDTH = screenWidth − 32 calculation in SponsoredItineraryCard).
     */
    <Box
      sx={{
        maxWidth: CARD_MAX_WIDTH,
        width: '100%',
        mx: 'auto', // center in any flex/block container
        // Subtle phone-chrome feel
        bgcolor: '#f1f5f9',
        borderRadius: 4,
        p: 1.5,
      }}
      role="img"
      aria-label="Ad preview — how your ad will appear in the traveler feed"
    >
      {/* Feed context label */}
      <Typography
        variant="caption"
        sx={{ display: 'block', mb: 1, color: '#64748b', textAlign: 'center', letterSpacing: 0.4 }}
      >
        Preview · Itinerary Feed
      </Typography>

      {/* ── Card shell — mirrors SponsoredItineraryCard styles.card ── */}
      <Box
        sx={{
          bgcolor: '#ffffff',
          borderRadius: '12px',
          overflow: 'hidden',
          border: '1px solid rgba(26,115,232,0.2)',
          boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
        }}
      >
        {/* ── Image (1:1 square) — styles.imageContainer + styles.image ── */}
        <Box sx={{ position: 'relative', width: '100%', aspectRatio: '1 / 1', bgcolor: IMAGE_BG }}>
          {imageUrl ? (
            <Box
              component="img"
              src={imageUrl}
              alt="Ad creative"
              sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          ) : (
            // Empty state — dashed border + placeholder text
            <Box
              sx={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: 1,
                border: '2px dashed #bfdbfe',
              }}
            >
              <Typography variant="caption" color="text.disabled" sx={{ textAlign: 'center', px: 2 }}>
                Upload an image above to preview your ad
              </Typography>
            </Box>
          )}

          {/* Sponsored pill — styles.sponsoredPill — bottom-left, matching Meta's placement */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 8,
              left: 8,
              bgcolor: 'rgba(0,0,0,0.52)',
              borderRadius: '4px',
              px: '6px',
              py: '2px',
              lineHeight: 1,
            }}
          >
            <Typography
              sx={{
                color: '#fff',
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: 0.2,
                lineHeight: '16px',
              }}
            >
              Sponsored
            </Typography>
          </Box>
        </Box>

        {/* ── Card body — styles.body ── */}
        <Box sx={{ px: '14px', pt: '12px', pb: '4px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {/* Advertiser name — styles.advertiserName */}
          <Typography
            noWrap
            sx={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}
          >
            {advertiserName}
          </Typography>

          {/* Destination — styles.destination */}
          <Typography
            noWrap
            sx={{ fontSize: 20, fontWeight: 700, color: '#213547', mt: '2px' }}
          >
            {destination || <Box component="span" sx={{ color: '#cbd5e1', fontWeight: 400, fontStyle: 'italic' }}>Destination</Box>}
          </Typography>

          {/* Primary text — styles.primaryText */}
          {primaryText ? (
            <Typography
              sx={{
                fontSize: 14,
                color: '#475569',
                lineHeight: '20px',
                mt: '4px',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {primaryText}
            </Typography>
          ) : (
            <Typography sx={{ fontSize: 14, color: '#cbd5e1', fontStyle: 'italic', mt: '4px' }}>
              Primary text will appear here
            </Typography>
          )}
        </Box>

        {/* ── CTA button — styles.actions + styles.ctaButton ── */}
        <Box sx={{ px: '14px', py: '12px' }}>
          <Box
            component="button"
            disabled
            aria-label={`${cta} button preview`}
            sx={{
              width: '100%',
              bgcolor: '#1a73e8',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              py: '10px',
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: 0.3,
              cursor: 'default',
              fontFamily: 'inherit',
            }}
          >
            {cta || 'Learn More'}
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

export default ItineraryFeedAdPreview
