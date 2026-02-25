import { create } from 'zustand'
import { type CampaignDraft, EMPTY_DRAFT } from '../types/campaign'

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
 * CampaignDraft shape lives in src/types/campaign.ts — the single source of truth.
 * Does not persist — a submitted campaign is handled server-side.
 *
 * Wire this store once the wizard needs cross-route persistence or access from
 * outside the wizard subtree (e.g. a /campaigns dashboard or auth gate).
 */
const useCampaignStore = create<CampaignState>((set) => ({
  draft: EMPTY_DRAFT,
  isSubmitting: false,
  submissionError: null,

  setDraftField: (field, value) =>
    set((state) => ({ draft: { ...state.draft, [field]: value } })),

  resetDraft: () => set({ draft: EMPTY_DRAFT, submissionError: null, isSubmitting: false }),

  setSubmitting: (value) => set({ isSubmitting: value }),

  setSubmissionError: (error) => set({ submissionError: error }),
}))

export default useCampaignStore
