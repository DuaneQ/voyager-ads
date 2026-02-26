import { useState, useCallback } from 'react'
import { type CampaignDraft, type CampaignData, EMPTY_DRAFT } from '../types/campaign'
import { campaignRepository } from '../repositories/campaignRepositoryInstance'
import useAuthStore from '../store/authStore'

export const STEP_COUNT = 5

/**
 * Manages wizard step navigation and campaign draft form state.
 * All mutation goes through `patch` to keep updates predictable.
 */
export function useCreateCampaign() {
  const user = useAuthStore(state => state.user)
  const [step, setStep] = useState(0) // 0-indexed internally
  const [draft, setDraft] = useState<CampaignDraft>(EMPTY_DRAFT)
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const patch = useCallback(<K extends keyof CampaignDraft>(key: K, value: CampaignDraft[K]) => {
    setDraft(prev => ({ ...prev, [key]: value }))
  }, [])

  const next = useCallback(() => setStep(s => Math.min(s + 1, STEP_COUNT - 1)), [])
  const back = useCallback(() => setStep(s => Math.max(s - 1, 0)), [])
  const goTo = useCallback((target: number) => setStep(target), [])

  const submit = useCallback(async () => {
    setSubmitError(null)
    // In E2E preview builds the auth store may not have hydrated yet because
    // onAuthStateChanged fires asynchronously. Fall back to a placeholder uid
    // so the UI flow completes; the stub repository handles the create call.
    const uid = user?.uid ?? (import.meta.env.VITE_E2E_AUTH_BYPASS === 'true' ? 'e2e-user' : null)
    if (!uid) {
      setSubmitError('You must be signed in to submit a campaign.')
      return
    }
    try {
      // Build CampaignData: strip File object, add assetUrl placeholder.
      // File upload to Firebase Storage is a future step; the URL will be
      // filled in by the upload flow before the campaign goes live.
      //
      // DATE SERIALIZATION NOTE: startDate, endDate, targetTravelStartDate,
      // and targetTravelEndDate are already YYYY-MM-DD strings from the form.
      // Store them as plain strings — do NOT convert to Timestamps or call
      // toISOString() (that coerces to UTC and shifts dates in negative-UTC
      // timezones). Use displayDate(raw) for display and parseLocalDate(raw)
      // for Date objects on reads.
      const { assetFile: _discarded, ...rest } = draft
      const campaignData: CampaignData = { ...rest, assetUrl: null, userEmail: user?.email ?? '' }
      await campaignRepository.create(campaignData, uid)
      setSubmitted(true)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to submit campaign. Please try again.'
      setSubmitError(message)
    }
  }, [draft, user])

  const reset = useCallback(() => {
    setDraft(EMPTY_DRAFT)
    setStep(0)
    setSubmitted(false)
    setSubmitError(null)
  }, [])

  return { step, draft, patch, next, back, goTo, submit, reset, submitted, submitError }
}
