import React, { useEffect, useMemo, useState } from 'react'
import { Link as RouterLink, useParams, useSearchParams } from 'react-router-dom'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import CreditCardOutlinedIcon from '@mui/icons-material/CreditCardOutlined'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'
import HourglassTopOutlinedIcon from '@mui/icons-material/HourglassTopOutlined'
import Nav from '../components/common/Nav'
import { useCampaigns } from '../hooks/useCampaigns'
import { adsBillingService } from '../services/billing/billingServiceInstance'
import type { Campaign, PaymentStatus } from '../types/campaign'
import { displayDate } from '../utils/dateUtils'

const BILLING_SCALE_SX = {
  '& .MuiTypography-overline': {
    fontSize: { xs: '1rem', md: '1.15rem' },
    letterSpacing: '0.08em',
  },
  '& .MuiTypography-h3': {
    fontSize: { xs: '2.7rem', md: '3.8rem' },
    lineHeight: 1.08,
  },
  '& .MuiTypography-h6': {
    fontSize: { xs: '1.7rem', md: '2rem' },
    lineHeight: 1.2,
  },
  '& .MuiTypography-body1': {
    fontSize: { xs: '1.28rem', md: '1.45rem' },
    lineHeight: 1.65,
  },
  '& .MuiTypography-body2': {
    fontSize: { xs: '1.12rem', md: '1.32rem' },
    lineHeight: 1.6,
  },
  '& .MuiChip-root': {
    fontSize: { xs: '1rem', md: '1.15rem' },
    height: { xs: 38, md: 44 },
  },
  '& .MuiButton-root': {
    fontSize: { xs: '1.08rem', md: '1.25rem' },
    minHeight: { xs: 50, md: 58 },
    borderRadius: 2,
  },
}

const PAYMENT_LABELS: Record<PaymentStatus, string> = {
  unpaid: 'Unpaid',
  checkout_created: 'Checkout started',
  paid: 'Paid',
  payment_failed: 'Payment failed',
}

function formatCurrency(cents: number | undefined, currency = 'usd'): string {
  if (typeof cents !== 'number' || Number.isNaN(cents)) {
    return 'N/A'
  }

  const normalizedCurrency = typeof currency === 'string' ? currency.trim().toUpperCase() : 'USD'
  const safeCurrency = /^[A-Z]{3}$/.test(normalizedCurrency) ? normalizedCurrency : 'USD'

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: safeCurrency,
    }).format(cents / 100)
  } catch {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(cents / 100)
    } catch {
      return 'N/A'
    }
  }
}

function parseBudgetAmountCents(budgetAmount: string | undefined): number {
  const parsed = parseFloat(budgetAmount ?? '0')
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed * 100) : 0
}

function chipColor(status: PaymentStatus | undefined): 'default' | 'success' | 'warning' | 'error' {
  switch (status) {
    case 'paid':
      return 'success'
    case 'checkout_created':
      return 'warning'
    case 'payment_failed':
      return 'error'
    default:
      return 'default'
  }
}

function statusMessage(campaign: Campaign, checkoutState: string | null): { severity: 'success' | 'info' | 'warning' | 'error'; text: string } | null {
  if (campaign.paymentStatus === 'paid') {
    return { severity: 'success', text: 'Payment confirmed. This campaign is funded and eligible for delivery once other serving checks pass.' }
  }

  if (checkoutState === 'success') {
    return { severity: 'info', text: 'Stripe returned successfully. Payment confirmation may take a few seconds while the webhook updates this campaign.' }
  }

  if (checkoutState === 'cancel') {
    return { severity: 'warning', text: 'Checkout was canceled. You can restart payment whenever you are ready.' }
  }

  if (campaign.paymentStatus === 'checkout_created') {
    return { severity: 'info', text: 'A checkout session has already been created for this campaign. You can start a fresh checkout if needed.' }
  }

  if (campaign.paymentStatus === 'payment_failed') {
    return { severity: 'error', text: 'The last payment attempt failed. Start a new checkout to complete funding.' }
  }

  return null
}

const BillingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const { campaigns, loading, error, refetch } = useCampaigns()
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const campaign = useMemo(() => campaigns.find((item) => item.id === id), [campaigns, id])
  const checkoutState = searchParams.get('checkout')
  const effectiveCurrency = campaign?.paymentCurrency ?? 'usd'
  const requiredCents = campaign?.paymentRequiredCents ?? parseBudgetAmountCents(campaign?.budgetAmount)
  const statusAlert = campaign ? statusMessage(campaign, checkoutState) : null

  useEffect(() => {
    if (checkoutState === 'success') {
      refetch()
    }
  }, [checkoutState, refetch])

  async function handleStartCheckout() {
    if (!campaign) {
      return
    }

    setCreateError(null)
    setIsCreating(true)

    try {
      const result = await adsBillingService.createCheckoutSession({
        campaignId: campaign.id,
        origin: window.location.origin,
      })

      window.open(result.url, '_self')
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to start checkout. Please try again.')
      setIsCreating(false)
    }
  }

  if (loading) {
    return (
      <>
        <Nav />
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress aria-label="Loading billing page" />
        </Box>
      </>
    )
  }

  if (error) {
    return (
      <>
        <Nav />
        <Box component="main" sx={{ maxWidth: 980, mx: 'auto', px: 2, py: 8, ...BILLING_SCALE_SX }}>
          <Alert severity="error">{error}</Alert>
        </Box>
      </>
    )
  }

  if (!campaign) {
    return (
      <>
        <Nav />
        <Box component="main" sx={{ maxWidth: 980, mx: 'auto', px: 2, py: 8, textAlign: 'center', ...BILLING_SCALE_SX }}>
          <Typography variant="h5" gutterBottom>Campaign not found</Typography>
          <Typography color="text.secondary" mb={3}>
            We could not load billing for this campaign.
          </Typography>
          <Button component={RouterLink} to="/dashboard" startIcon={<ArrowBackIcon />} variant="outlined">
            Back to dashboard
          </Button>
        </Box>
      </>
    )
  }

  return (
    <>
      <Nav />
      <Box
        component="main"
        sx={{
          maxWidth: 1200,
          mx: 'auto',
          px: { xs: 2, sm: 3 },
          py: 6,
          ...BILLING_SCALE_SX,
        }}
      >
        <Button
          component={RouterLink}
          to={`/campaigns/${campaign.id}`}
          startIcon={<ArrowBackIcon />}
          sx={{ mb: 2.5, px: 0 }}
          size="medium"
        >
          Back to campaign
        </Button>

        <Stack spacing={3}>
          <Box>
            <Typography variant="overline" color="text.secondary">Campaign Billing</Typography>
            <Typography variant="h3" fontWeight={700} sx={{ mt: 0.5 }}>
              {campaign.name}
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} sx={{ mt: 1.75 }}>
              <Chip label={PAYMENT_LABELS[campaign.paymentStatus ?? 'unpaid']} color={chipColor(campaign.paymentStatus)} variant="outlined" />
              <Chip label={`Budget ${formatCurrency(requiredCents, effectiveCurrency)}`} variant="outlined" />
              <Chip label={`${displayDate(campaign.startDate)} - ${displayDate(campaign.endDate)}`} variant="outlined" />
            </Stack>
          </Box>

          {statusAlert && <Alert severity={statusAlert.severity}>{statusAlert.text}</Alert>}
          {createError && <Alert severity="error">{createError}</Alert>}

          <Box
            sx={{
              display: 'grid',
              gap: 2.5,
              gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1.35fr) minmax(320px, 0.65fr)' },
            }}
          >
            <Card variant="outlined">
              <CardContent sx={{ p: { xs: 2.5, md: 3.25 } }}>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  Payment summary
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3.5 }}>
                  Stripe Checkout handles one-time payment for this campaign budget and supports promotion codes.
                </Typography>

                <Stack spacing={2.25} divider={<Divider flexItem />}>
                  <Stack direction="row" justifyContent="space-between" spacing={2}>
                    <Typography variant="body2" color="text.secondary">Required budget payment</Typography>
                    <Typography variant="body2" fontWeight={600}>{formatCurrency(requiredCents, effectiveCurrency)}</Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between" spacing={2}>
                    <Typography variant="body2" color="text.secondary">Paid so far</Typography>
                    <Typography variant="body2" fontWeight={600}>{formatCurrency(campaign.paymentPaidCents, effectiveCurrency)}</Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between" spacing={2}>
                    <Typography variant="body2" color="text.secondary">Discount applied</Typography>
                    <Typography variant="body2" fontWeight={600}>{formatCurrency(campaign.paymentDiscountCents, effectiveCurrency)}</Typography>
                  </Stack>
                </Stack>

                {campaign.paymentCompletedAt && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
                    Confirmed on {new Date(campaign.paymentCompletedAt).toLocaleString()}
                  </Typography>
                )}
              </CardContent>
            </Card>

            <Card
              variant="outlined"
              sx={{
                background: 'linear-gradient(180deg, rgba(10,111,84,0.08) 0%, rgba(10,111,84,0.02) 100%)',
              }}
            >
              <CardContent sx={{ p: { xs: 2.5, md: 3.25 } }}>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  Checkout
                </Typography>
                <Stack spacing={1.8} sx={{ mb: 3.5 }}>
                  <Stack direction="row" spacing={1.25} alignItems="center">
                    <CreditCardOutlinedIcon fontSize="small" color="action" />
                    <Typography variant="body2">One-time Stripe Checkout session</Typography>
                  </Stack>
                  <Stack direction="row" spacing={1.25} alignItems="center">
                    <CheckCircleOutlineIcon fontSize="small" color="action" />
                    <Typography variant="body2">Promotion codes supported at checkout</Typography>
                  </Stack>
                  <Stack direction="row" spacing={1.25} alignItems="center">
                    {campaign.paymentStatus === 'paid'
                      ? <CheckCircleOutlineIcon fontSize="small" color="success" />
                      : campaign.paymentStatus === 'payment_failed'
                        ? <ErrorOutlineIcon fontSize="small" color="error" />
                        : <HourglassTopOutlinedIcon fontSize="small" color="warning" />}
                    <Typography variant="body2">
                      {campaign.paymentStatus === 'paid'
                        ? 'This campaign has already been funded.'
                        : 'Campaign delivery stays blocked until payment is marked paid.'}
                    </Typography>
                  </Stack>
                </Stack>

                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={handleStartCheckout}
                  disabled={isCreating || campaign.paymentStatus === 'paid' || requiredCents <= 0}
                  sx={{ py: 1.4 }}
                >
                  {campaign.paymentStatus === 'paid'
                    ? 'Campaign funded'
                    : isCreating
                      ? 'Redirecting to Stripe...'
                      : 'Pay with Stripe'}
                </Button>

                {campaign.paymentStatus !== 'paid' && (
                  <Button
                    component={RouterLink}
                    to={`/campaigns/${campaign.id}/edit`}
                    fullWidth
                    variant="outlined"
                    sx={{ mt: 1.6 }}
                  >
                    Edit campaign before paying
                  </Button>
                )}

                {requiredCents <= 0 && (
                  <Typography variant="body2" color="error" sx={{ mt: 1.5 }}>
                    This campaign does not have a valid billable budget.
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Box>
        </Stack>
      </Box>
    </>
  )
}

export default BillingPage