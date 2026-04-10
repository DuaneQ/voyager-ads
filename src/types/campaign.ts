export type Placement = 'video_feed' | 'itinerary_feed' | 'ai_slot'
export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed'
export type Objective = 'Awareness' | 'Traffic'
export type BudgetType = 'daily' | 'lifetime'
export type BillingModel = 'cpm' | 'cpc'
export type CreativeType = 'image' | 'video'
export type BusinessType = 'restaurant' | 'hotel' | 'tour' | 'experience' | 'transport' | 'shop' | 'activity' | 'other'
export type PaymentStatus = 'unpaid' | 'checkout_created' | 'paid' | 'payment_failed'

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

// ─── Persisted Campaign ───────────────────────────────────────────────────────

/**
 * CampaignData is the Firestore-safe subset of CampaignDraft.
 * `assetFile` (binary File object) is intentionally excluded — files are uploaded
 * to Firebase Storage separately and the resulting URL stored as `assetUrl`.
 */
export type CampaignData = Omit<CampaignDraft, 'assetFile'> & {
  assetUrl: string | null
  /** Email of the advertiser at submission time — stored for admin review. */
  userEmail: string
  /**
   * Firebase Storage path of the uploaded asset (e.g. `ads/{uid}/{ts}_file.mp4`).
   * Used by the processAdVideoWithMux Cloud Function to generate a signed URL
   * for Mux ingestion. Only set for video_feed campaigns.
   */
  assetStoragePath?: string
  // ─── Mux transcoding fields (video_feed only) ──────────────────────────
  // Written by the processAdVideoWithMux Cloud Function and the muxWebhook.
  // Absent on non-video campaigns and on newly created video campaigns before
  // the Cloud Function has run.
  muxAssetId?: string
  muxPlaybackId?: string
  /** HLS m3u8 URL — use this for playback when present; fall back to assetUrl. */
  muxPlaybackUrl?: string
  muxThumbnailUrl?: string
  muxStatus?: 'preparing' | 'ready' | 'errored'
  muxError?: string
}

/**
 * Campaign is the fully persisted document shape as returned from Firestore.
 * Timestamps are stored as Firestore Timestamps server-side but converted to
 * ISO strings on read by the repository layer.
 */
export interface Campaign extends CampaignData {
  id: string
  uid: string          // Firebase Auth UID of the owning advertiser
  status: CampaignStatus
  paymentStatus?: PaymentStatus
  paymentRequiredCents?: number
  paymentPaidCents?: number
  paymentDiscountCents?: number
  paymentCurrency?: string
  paymentSessionId?: string
  paymentPromoCode?: string
  paymentCompletedAt?: string
  /**
   * Set to `true` on creation. An admin must set it to `false` to allow the
   * campaign to go live. Firestore rules prevent clients from clearing this flag.
   */
  isUnderReview: boolean
  /** Optional note left by the admin when rejecting a campaign. */
  reviewNote?: string
  createdAt: string    // ISO 8601 string (converted from Firestore Timestamp on read)
  updatedAt: string
  /**
   * Lifetime impression and click counters kept in sync by the server-side
   * tracking pipeline via FieldValue.increment. Used in the campaign table so
   * each row can show metrics without querying the daily_metrics subcollection.
   * Absent (undefined) on campaigns that have not yet served any impressions.
   */
  totalImpressions?: number
  totalClicks?: number
  /**
   * Current remaining budget in cents. Written by `logAdEvents` on every
   * chargeable event (impression for CPM, click for CPC). Absent on campaigns
   * that have never served a chargeable event.
   */
  budgetCents?: number
}
