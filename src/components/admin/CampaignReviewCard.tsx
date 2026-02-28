import React, { useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Collapse from '@mui/material/Collapse'
import Divider from '@mui/material/Divider'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import CampaignAdPreview from '../campaign/CampaignAdPreview'
import type { Campaign } from '../../types/campaign'

interface Props {
  campaign: Campaign
  onApprove: (id: string) => Promise<void>
  onReject: (id: string, note: string) => Promise<void>
}

const Row: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
    <Typography variant="body2" color="text.secondary" sx={{ minWidth: 160, fontWeight: 500 }}>
      {label}
    </Typography>
    <Typography variant="body2" sx={{ flex: 1 }}>{value || '—'}</Typography>
  </Box>
)

const SectionHeading: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Typography variant="overline" color="text.secondary" display="block" sx={{ mt: 2, mb: 0.5 }}>
    {children}
  </Typography>
)

const PLACEMENT_LABELS: Record<string, string> = {
  video_feed: 'Video Feed',
  itinerary_feed: 'Itinerary Feed',
  ai_slot: 'AI Itinerary',
}

const CampaignReviewCard: React.FC<Props> = ({ campaign: c, onApprove, onReject }) => {
  const [busy, setBusy] = useState(false)
  const [rejecting, setRejecting] = useState(false)
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  // Use a loose cast so CampaignAdPreview can render the persisted asset URL
  // without assuming assetFile exists.
  const draftForPreview = c as any

  const handle = async (action: () => Promise<void>) => {
    setError(null)
    setBusy(true)
    try {
      await action()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card variant="outlined" sx={{ mb: 3 }}>
      <CardContent>
        {/* Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={1}>
          <Box>
            <Typography variant="h6" fontWeight={700}>{c.name}</Typography>
            <Stack direction="row" spacing={1} mt={0.5} flexWrap="wrap">
              <Chip label={PLACEMENT_LABELS[c.placement] ?? c.placement} size="small" color="primary" variant="outlined" />
              <Chip label={c.objective} size="small" variant="outlined" />
              <Chip label={`$${c.budgetAmount} / ${c.budgetType}`} size="small" variant="outlined" />
            </Stack>
          </Box>
          <Typography variant="caption" color="text.secondary">
            Submitted {new Date(c.createdAt).toLocaleDateString()}
          </Typography>
        </Stack>

        {/* Ad preview toggle */}
        <Box sx={{ mt: 1.5 }}>
          <Button
            size="small"
            variant="outlined"
            onClick={() => setShowPreview((v) => !v)}
            sx={{ mb: 1 }}
          >
            {showPreview ? 'Hide preview' : 'Show ad preview'}
          </Button>
          <Collapse in={showPreview} unmountOnExit>
            <Box sx={{ py: 2, display: 'flex', justifyContent: 'center' }}>
              <CampaignAdPreview
                draft={draftForPreview}
                assetUrl={c.assetUrl ?? undefined}
                muxPlaybackUrl={c.muxPlaybackUrl ?? undefined}
              />
            </Box>
          </Collapse>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Advertiser */}
        <SectionHeading>Advertiser</SectionHeading>
        <Stack spacing={0.75}>
          <Row label="Email" value={c.userEmail || <em>not recorded</em>} />
          <Row label="UID" value={c.uid} />
        </Stack>

        {/* Campaign details */}
        <SectionHeading>Campaign</SectionHeading>
        <Stack spacing={0.75}>
          <Row label="Schedule" value={`${c.startDate} → ${c.endDate}`} />
          <Row label="Billing model" value={c.billingModel.toUpperCase()} />
        </Stack>

        {/* Creative */}
        <SectionHeading>Creative</SectionHeading>
        <Stack spacing={0.75}>
          <Row label="Type" value={c.creativeType} />
          <Row label="Name" value={c.creativeName} />
          <Row label="Primary text" value={c.primaryText} />
          <Row label="CTA" value={c.cta} />
          <Row label="Landing URL" value={
            c.landingUrl
              ? <a href={c.landingUrl} target="_blank" rel="noreferrer noopener">{c.landingUrl}</a>
              : null
          } />
          {c.assetUrl && (
            <Box sx={{ mt: 1 }}>
              {c.creativeType === 'image'
                ? <img src={c.assetUrl} alt="Ad creative" style={{ maxWidth: 320, borderRadius: 8, border: '1px solid #e0e0e0' }} />
                : c.muxPlaybackUrl
                  ? <video src={c.muxPlaybackUrl} controls style={{ maxWidth: 320, borderRadius: 8 }} aria-label="Ad video (HLS)" />
                  : <a href={c.assetUrl} target="_blank" rel="noreferrer noopener">View video asset</a>
              }
              {c.placement === 'video_feed' && c.muxStatus && c.muxStatus !== 'ready' && (
                <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: c.muxStatus === 'errored' ? 'error.main' : 'text.secondary' }}>
                  Mux status: {c.muxStatus}{c.muxError ? ` — ${c.muxError}` : ''}
                </Typography>
              )}
            </Box>
          )}
          {/* AI slot fields */}
          {c.placement === 'ai_slot' && (
            <>
              <Row label="Business type" value={c.businessType} />
              <Row label="Address" value={c.address} />
              <Row label="Phone" value={c.phone} />
              <Row label="Email" value={c.email} />
              {c.promoCode && <Row label="Promo code" value={c.promoCode} />}
            </>
          )}
        </Stack>

        {/* Targeting */}
        <SectionHeading>Targeting</SectionHeading>
        <Stack spacing={0.75}>
          <Row label="Audience name" value={c.audienceName} />
          <Row label="Location" value={c.location} />
          <Row label="Radius" value={c.radius} />
          <Row label="Age range" value={`${c.ageFrom} – ${c.ageTo}`} />
          <Row label="Interests" value={c.interests} />
          {c.placement === 'itinerary_feed' && (
            <>
              <Row label="Target destination" value={c.targetDestination} />
              <Row label="Travel dates" value={c.targetTravelStartDate && c.targetTravelEndDate ? `${c.targetTravelStartDate} → ${c.targetTravelEndDate}` : null} />
              <Row label="Gender" value={c.targetGender || 'All'} />
            </>
          )}
          {c.placement === 'ai_slot' && (
            <>
              <Row label="Trip types" value={c.targetTripTypes?.join(', ') || 'All'} />
              <Row label="Activity prefs" value={c.targetActivityPreferences?.join(', ') || 'All'} />
              <Row label="Travel styles" value={c.targetTravelStyles?.join(', ') || 'All'} />
            </>
          )}
        </Stack>

        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

        <Divider sx={{ my: 2 }} />

        {/* Actions */}
        {rejecting ? (
          <Stack spacing={1.5}>
            <TextField
              label="Rejection note (shown to advertiser)"
              multiline
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              fullWidth
              size="small"
            />
            <Stack direction="row" spacing={1}>
              <Button
                variant="contained"
                color="error"
                disabled={busy || !note.trim()}
                onClick={() => handle(() => onReject(c.id, note))}
              >
                Confirm reject
              </Button>
              <Button variant="outlined" disabled={busy} onClick={() => { setRejecting(false); setNote('') }}>
                Cancel
              </Button>
            </Stack>
          </Stack>
        ) : (
          <Stack direction="row" spacing={1.5}>
            <Button
              variant="contained"
              color="success"
              disabled={busy}
              onClick={() => handle(() => onApprove(c.id))}
            >
              Approve
            </Button>
            <Button
              variant="outlined"
              color="error"
              disabled={busy}
              onClick={() => setRejecting(true)}
            >
              Reject
            </Button>
          </Stack>
        )}
      </CardContent>
    </Card>
  )
}

export default CampaignReviewCard
