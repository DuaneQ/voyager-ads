import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockCallable = vi.hoisted(() => vi.fn())

vi.mock('firebase/functions', () => ({
  httpsCallable: vi.fn(() => mockCallable),
}))

import { httpsCallable } from 'firebase/functions'
import { FirebaseAdminService } from '../../services/admin/AdminService'
import type { Campaign } from '../../types/campaign'

const fakeFunctions = {} as any

describe('FirebaseAdminService', () => {
  let svc: FirebaseAdminService

  beforeEach(() => {
    vi.clearAllMocks()
    svc = new FirebaseAdminService(fakeFunctions)
  })

  // ── reviewCampaign ──────────────────────────────────────────────────────────
  describe('reviewCampaign', () => {
    it('calls httpsCallable with the reviewCampaign function name', async () => {
      mockCallable.mockResolvedValue({ data: { success: true } })
      await svc.reviewCampaign('camp-1', 'approve')
      expect(httpsCallable).toHaveBeenCalledWith(fakeFunctions, 'reviewCampaign')
    })

    it('passes campaignId and action=approve to the callable', async () => {
      mockCallable.mockResolvedValue({ data: { success: true } })
      await svc.reviewCampaign('camp-1', 'approve')
      expect(mockCallable).toHaveBeenCalledWith({ campaignId: 'camp-1', action: 'approve', note: undefined })
    })

    it('passes campaignId, action=reject and note to the callable', async () => {
      mockCallable.mockResolvedValue({ data: { success: true } })
      await svc.reviewCampaign('camp-99', 'reject', 'Needs revision')
      expect(mockCallable).toHaveBeenCalledWith({ campaignId: 'camp-99', action: 'reject', note: 'Needs revision' })
    })

    it('resolves void on success', async () => {
      mockCallable.mockResolvedValue({ data: { success: true } })
      await expect(svc.reviewCampaign('camp-1', 'approve')).resolves.toBeUndefined()
    })

    it('propagates errors thrown by the Cloud Function', async () => {
      mockCallable.mockRejectedValue(new Error('functions/permission-denied'))
      await expect(svc.reviewCampaign('camp-1', 'approve')).rejects.toThrow('functions/permission-denied')
    })
  })

  // ── getPendingCampaigns ─────────────────────────────────────────────────────
  describe('getPendingCampaigns', () => {
    it('calls httpsCallable with the getPendingCampaigns function name', async () => {
      mockCallable.mockResolvedValue({ data: { campaigns: [] } })
      await svc.getPendingCampaigns()
      expect(httpsCallable).toHaveBeenCalledWith(fakeFunctions, 'getPendingCampaigns')
    })

    it('returns the campaigns array from the response', async () => {
      const fakeCampaigns: Partial<Campaign>[] = [
        { id: 'c1', name: 'Alpha', status: 'active' },
        { id: 'c2', name: 'Beta',  status: 'paused' },
      ]
      mockCallable.mockResolvedValue({ data: { campaigns: fakeCampaigns } })
      const result = await svc.getPendingCampaigns()
      expect(result).toEqual(fakeCampaigns)
    })

    it('returns an empty array when there are no pending campaigns', async () => {
      mockCallable.mockResolvedValue({ data: { campaigns: [] } })
      const result = await svc.getPendingCampaigns()
      expect(result).toEqual([])
    })

    it('propagates errors thrown by the Cloud Function', async () => {
      mockCallable.mockRejectedValue(new Error('functions/internal'))
      await expect(svc.getPendingCampaigns()).rejects.toThrow('functions/internal')
    })
  })
})
