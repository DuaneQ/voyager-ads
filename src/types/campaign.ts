export type Placement = 'video_feed' | 'itinerary_feed' | 'ai_slot'
export type Objective = 'Awareness' | 'Traffic'
export type BudgetType = 'daily' | 'lifetime'
export type BillingModel = 'cpm' | 'cpc'
export type CreativeType = 'image' | 'video'
export type BusinessType = 'restaurant' | 'hotel' | 'tour' | 'experience' | 'transport' | 'shop' | 'activity' | 'other'

export interface CampaignDraft {
  // Step 1 — Details
  name: string
  placement: Placement
  objective: Objective
  startDate: string
  endDate: string

  // Step 2 — Creative
  creativeName: string
  creativeType: CreativeType
  assetFile: File | null
  primaryText: string
  cta: string
  landingUrl: string
  // AI Slot specific
  businessType: BusinessType | ''
  address: string              // business address shown on the promotion card
  phone: string                // phone number shown on the promotion card
  email: string                // email shown on the promotion card
  promoCode: string            // optional discount/promo code

  // Step 3 — Targeting
  audienceName: string
  location: string
  radius: string
  destinationMatch: boolean
  ageFrom: string
  ageTo: string
  interests: string
  // Itinerary Feed specific — maps to searchItineraries destination + date range filters
  targetDestination: string
  targetPlaceId: string           // Google Places place_id for canonical destination matching
  targetTravelStartDate: string   // YYYY-MM-DD; converted to startDay epoch ms server-side
  targetTravelEndDate: string     // YYYY-MM-DD; converted to endDay epoch ms server-side
  targetGender: string            // '' = all; matches itinerary gender preference field
  // AI Slot specific targeting — will match fields stored on AI itinerary documents
  targetTripTypes: string[]          // [] = all; e.g. ['adventure', 'romantic']
  targetActivityPreferences: string[] // [] = all; e.g. ['Cultural', 'Nightlife']
  targetTravelStyles: string[]        // [] = all; e.g. ['luxury', 'mid-range']

  // Step 4 — Budget
  budgetType: BudgetType
  budgetAmount: string
  billingModel: BillingModel

  // Step 5 — Review
  agreePolicy: boolean
}

export const EMPTY_DRAFT: CampaignDraft = {
  name: '',
  placement: 'video_feed',
  objective: 'Awareness',
  startDate: '',
  endDate: '',
  creativeName: '',
  creativeType: 'image',
  assetFile: null,
  primaryText: '',
  cta: 'Learn More',
  landingUrl: '',
  businessType: '',
  address: '',
  phone: '',
  email: '',
  promoCode: '',
  audienceName: '',
  location: '',
  radius: '',
  destinationMatch: false,
  ageFrom: '18',
  ageTo: '34',
  interests: '',
  targetDestination: '',
  targetPlaceId: '',
  targetTravelStartDate: '',
  targetTravelEndDate: '',
  targetGender: '',
  targetTripTypes: [],
  targetActivityPreferences: [],
  targetTravelStyles: [],
  budgetType: 'daily',
  budgetAmount: '',
  billingModel: 'cpm',
  agreePolicy: false,
}
