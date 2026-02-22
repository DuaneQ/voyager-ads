import { create } from 'zustand'

export type BillingStatus = 'idle' | 'pending' | 'succeeded' | 'failed'

interface BillingState {
  stripePaymentIntentId: string | null
  status: BillingStatus
  errorMessage: string | null
  // Actions
  setPaymentIntent: (id: string) => void
  setStatus: (status: BillingStatus) => void
  setError: (message: string | null) => void
  reset: () => void
}

/**
 * Tracks Stripe payment intent state during the campaign checkout flow.
 * The payment intent ID is set server-side; status is updated from Stripe webhooks or client confirmation.
 */
const useBillingStore = create<BillingState>((set) => ({
  stripePaymentIntentId: null,
  status: 'idle',
  errorMessage: null,

  setPaymentIntent: (id) => set({ stripePaymentIntentId: id }),
  setStatus: (status) => set({ status }),
  setError: (message) => set({ errorMessage: message }),
  reset: () => set({ stripePaymentIntentId: null, status: 'idle', errorMessage: null }),
}))

export default useBillingStore
