import { useState, useEffect, useCallback } from 'react'
import type { Campaign } from '../types/campaign'
import { campaignRepository } from '../repositories/campaignRepositoryInstance'
import useAuthStore from '../store/authStore'

export interface UseCampaignsResult {
  campaigns: Campaign[]
  loading: boolean
  error: string | null
  refetch: () => void
}

/**
 * Fetches all campaigns owned by the currently authenticated user.
 * Re-fetches whenever the auth user changes.
 */
export function useCampaigns(): UseCampaignsResult {
  const user = useAuthStore(state => state.user)
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!user) {
      setCampaigns([])
      return
    }
    setLoading(true)
    setError(null)
    try {
      const result = await campaignRepository.getAllByUser(user.uid)
      setCampaigns(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load campaigns.')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    load()
  }, [load])

  return { campaigns, loading, error, refetch: load }
}
