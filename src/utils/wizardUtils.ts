import type { CampaignDraft } from '../types/campaign'

export const STEP_COUNT = 5

export const STEP_LABELS = ['Details', 'Creative', 'Targeting', 'Budget', 'Review']

export interface StepValidOptions {
  /**
   * When true, a start date in the past is accepted.
   * Used by the edit wizard for campaigns that are already running.
   */
  allowPastStartDate?: boolean
}

/**
 * Returns whether the given wizard step is complete enough to advance.
 * Extracted here so both CampaignWizard (create) and EditCampaignWizard (edit)
 * share the same validation logic — Single Responsibility + Open/Closed.
 */
export function isStepValid(step: number, draft: CampaignDraft, options: StepValidOptions = {}): boolean {
  const isItineraryFeed = draft.placement === 'itinerary_feed'
  switch (step) {
    case 0: {
      const todayStr = new Date().toLocaleDateString('en-CA') // YYYY-MM-DD in local time
      if (draft.name.trim().length < 3) return false
      if (!draft.startDate || (!options.allowPastStartDate && draft.startDate < todayStr)) return false
      if (draft.endDate && draft.endDate < draft.startDate) return false
      return true
    }
    case 1: return draft.creativeName.trim().length > 0
    case 2: {
      if (!draft.audienceName.trim()) return false
      // Itinerary feed uses targetDestination; other placements use location
      return isItineraryFeed
        ? draft.targetDestination.trim().length > 0
        : draft.location.trim().length > 0
    }
    case 3: return parseFloat(draft.budgetAmount) > 0
    case 4: return draft.agreePolicy
    default: return true
  }
}
