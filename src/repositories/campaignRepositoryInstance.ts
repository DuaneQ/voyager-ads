import { db } from '../config/firebaseConfig'
import { FirestoreCampaignRepository } from './CampaignRepository'

/**
 * App-wide singleton for campaign persistence.
 * In tests, mock this module: vi.mock('../repositories/campaignRepositoryInstance')
 */
export const campaignRepository = new FirestoreCampaignRepository(db)
