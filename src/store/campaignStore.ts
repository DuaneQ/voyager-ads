import { create } from 'zustand'
import type { PricingModel } from '../config/pricingConstants'

export interface CampaignDraft {
  name: string
  placementKey: string   // matches a key in PRICING_SIMPLE
  billingModel: PricingModel | ''
  dailyBudgetUsd: number | null
  targeting: {
    geoRegions: string[]
    interests: string[]
  }
}

const EMPTY_DRAFT: CampaignDraft = {
  name: '',
  placementKey: '',
  billingModel: '',
  dailyBudgetUsd: null,
  targeting: {
    geoRegions: [],
    interests: [],
  },
}

interface CampaignState {
  draft: CampaignDraft
  isSubmitting: boolean
  submissionError: string | null
  // Actions
  setDraftField: <K extends keyof CampaignDraft>(field: K, value: CampaignDraft[K]) => void
  resetDraft: () => void
  setSubmitting: (value: boolean) => void
  setSubmissionError: (error: string | null) => void
}

/**
 * Holds the in-progress campaign draft for the campaign creation flow.
 * Does not persist — a submitted campaign is handled server-side.
 */
const useCampaignStore = create<CampaignState>((set) => ({
  draft: EMPTY_DRAFT,
  isSubmitting: false,
  submissionError: null,

  setDraftField: (field, value) =>
    set((state) => ({ draft: { ...state.draft, [field]: value } })),

  resetDraft: () => set({ draft: EMPTY_DRAFT, submissionError: null }),

  setSubmitting: (value) => set({ isSubmitting: value }),

  setSubmissionError: (error) => set({ submissionError: error }),
}))

export default useCampaignStore
