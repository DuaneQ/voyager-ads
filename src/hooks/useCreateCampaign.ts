import { useState, useCallback } from 'react'
import { type CampaignDraft, EMPTY_DRAFT } from '../types/campaign'

export const STEP_COUNT = 5

/**
 * Manages wizard step navigation and campaign draft form state.
 * All mutation goes through `patch` to keep updates predictable.
 */
export function useCreateCampaign() {
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
    try {
      /**
       * DATE SERIALIZATION CONTRACT (enforce when wiring to Firestore):
       *
       * WRITE  — all date fields (startDate, endDate, targetTravelStartDate,
       *          targetTravelEndDate) are already YYYY-MM-DD strings produced by
       *          <input type="date"> or formatDateLocal(). Store them as plain
       *          strings — do NOT convert to Timestamps or call toISOString().
       *
       * READ   — use displayDate(raw) for human display and parseLocalDate(raw)
       *          when a Date object is needed. Never use new Date(rawString) on
       *          a bare YYYY-MM-DD value; it parses as UTC and shifts one day
       *          in negative-UTC timezones (Americas).
       */
      setSubmitted(true)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to submit campaign. Please try again.'
      setSubmitError(message)
    }
  }, [])

  const reset = useCallback(() => {
    setDraft(EMPTY_DRAFT)
    setStep(0)
    setSubmitted(false)
    setSubmitError(null)
  }, [])

  return { step, draft, patch, next, back, goTo, submit, reset, submitted, submitError }
}
