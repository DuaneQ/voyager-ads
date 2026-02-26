import { type Functions, httpsCallable } from 'firebase/functions'

// ─── Interface (Dependency Inversion) ────────────────────────────────────────

import type { Campaign } from '../../types/campaign'

export interface IAdminService {
  /**
   * Approve or reject a campaign.
   * Calls the `reviewCampaign` Cloud Function which uses the Admin SDK to
   * update Firestore — clients cannot flip `isUnderReview` directly.
   */
  reviewCampaign(
    campaignId: string,
    action: 'approve' | 'reject',
    note?: string,
  ): Promise<void>
  /** Fetch all campaigns currently awaiting review (Admin SDK, bypasses rules). */
  getPendingCampaigns(): Promise<Campaign[]>
}

// ─── Firebase implementation ──────────────────────────────────────────────────

export class FirebaseAdminService implements IAdminService {
  constructor(private readonly functions: Functions) {}

  async reviewCampaign(
    campaignId: string,
    action: 'approve' | 'reject',
    note?: string,
  ): Promise<void> {
    const fn = httpsCallable<
      { campaignId: string; action: string; note?: string },
      { success: boolean }
    >(this.functions, 'reviewCampaign')
    await fn({ campaignId, action, note })
  }

  async getPendingCampaigns(): Promise<Campaign[]> {
    const fn = httpsCallable<void, { campaigns: Campaign[] }>(this.functions, 'getPendingCampaigns')
    const result = await fn()
    return result.data.campaigns
  }
}
