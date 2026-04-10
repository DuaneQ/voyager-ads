import { type Functions, httpsCallable } from 'firebase/functions'

export interface CreateAdsCampaignCheckoutSessionRequest {
  campaignId: string
  origin?: string
}

export interface CreateAdsCampaignCheckoutSessionResponse {
  url: string
  sessionId: string
}

export interface IAdsBillingService {
  createCheckoutSession(
    request: CreateAdsCampaignCheckoutSessionRequest,
  ): Promise<CreateAdsCampaignCheckoutSessionResponse>
}

export class FirebaseAdsBillingService implements IAdsBillingService {
  constructor(private readonly functions: Functions) {}

  async createCheckoutSession(
    request: CreateAdsCampaignCheckoutSessionRequest,
  ): Promise<CreateAdsCampaignCheckoutSessionResponse> {
    const fn = httpsCallable<
      CreateAdsCampaignCheckoutSessionRequest,
      CreateAdsCampaignCheckoutSessionResponse
    >(this.functions, 'createAdsCampaignCheckoutSession')

    const result = await fn(request)
    return result.data
  }
}