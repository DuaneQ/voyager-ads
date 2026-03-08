import { useState, useCallback } from 'react'
import type { CampaignStatus } from '../types/campaign'
import { campaignRepository } from '../repositories/campaignRepositoryInstance'

export interface UseCampaignStatusResult {
  /**
   * Toggle a campaign between 'active' and 'paused'.
   * Calls the repository update and then fires `onSuccess` on completion.
   */
  toggle: (campaignId: string, uid: string, currentStatus: CampaignStatus) => Promise<void>
  loading: boolean
  error: string | null
}

/**
 * Hook to pause or resume a campaign without going through the edit + review flow.
 *
 * Only writes `status` — does NOT touch `isUnderReview`, so no admin re-approval
 * is triggered. Pass a `refetch` callback from `useCampaigns` as `onSuccess` to
 * keep the local campaigns list in sync after the Firestore write.
 *
 * @param onSuccess - Optional callback invoked after a successful status change
 *   (e.g. `refetch` from `useCampaigns`).
 */
export function useCampaignStatus(onSuccess?: () => void): UseCampaignStatusResult {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toggle = useCallback(
    async (campaignId: string, uid: string, currentStatus: CampaignStatus) => {
      const next: CampaignStatus = currentStatus === 'active' ? 'paused' : 'active'
      setLoading(true)
      setError(null)
      try {
        await campaignRepository.update(campaignId, uid, { status: next })
        onSuccess?.()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update campaign status.')
      } finally {
        setLoading(false)
      }
    },
    [onSuccess],
  )

  return { toggle, loading, error }
}
