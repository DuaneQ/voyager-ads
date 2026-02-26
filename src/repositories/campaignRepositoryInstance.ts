import { db } from '../config/firebaseConfig'
import { FirestoreCampaignRepository, type ICampaignRepository } from './CampaignRepository'
import type { Campaign, CampaignData } from '../types/campaign'

// ── E2E stub ────────────────────────────────────────────────────────────────
// When VITE_E2E_AUTH_BYPASS=true (CI preview builds only) we skip real Firestore
// writes so Playwright tests exercise the UI flow without depending on a live
// database. This mirrors the auth bypass pattern used in main.tsx / ProtectedRoute.
const e2eStub: ICampaignRepository = {
  async create(data: CampaignData, uid: string): Promise<Campaign> {
    return {
      ...data,
      id: `e2e-${Date.now()}`,
      uid,
      status: 'draft',
      isUnderReview: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  },
  async getAllByUser() {
    return []
  },
  async update() {
    // no-op
  },
}

/**
 * App-wide singleton for campaign persistence.
 * In unit tests, mock this module: vi.mock('../repositories/campaignRepositoryInstance')
 * In E2E builds (VITE_E2E_AUTH_BYPASS=true), an in-memory stub is used instead.
 */
export const campaignRepository: ICampaignRepository =
  import.meta.env.VITE_E2E_AUTH_BYPASS === 'true'
    ? e2eStub
    : new FirestoreCampaignRepository(db)
