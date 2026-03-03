# Consumer-Side Ad Delivery — Implementation Plan

**Date:** March 1, 2026  
**Status:** Awaiting Approval  
**Related Docs:** [ADS_REQUIREMENTS.md](./ADS_REQUIREMENTS.md) | [AD_PRODUCT_PRD.md](./AD_PRODUCT_PRD.md) | [IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md)

---

## 1. Overview

Connect the ad campaigns created in the advertiser portal (`voyager-ads`) to the consumer app (`voyager-RN`) so real users see sponsored content in their feeds. This requires **new Cloud Functions** for ad selection and event tracking, plus **new hooks and components** in the consumer app.

---

## 2. Repos Affected

| Repo | What Changes | Why |
|---|---|---|
| **voyager-pwa/functions** | 2 new Cloud Functions + 1 shared types file | Server-side ad selection (`selectAds`) and event tracking (`logAdEvents`) must live here — same pattern as all other `onCall` functions |
| **voyager-RN** | 3 new hooks, 2 new components, 1 new type file, modifications to 3 existing pages | Consumer UI: ad interleaving, impression/click tracking, frequency capping |
| **voyager-ads** | **NO CHANGES** | Advertiser portal already writes campaigns to `ads_campaigns` and reads metrics from `daily_metrics`. Nothing to touch. |

---

## 3. Architecture Diagram — Data Flow

```
┌──────────────────────────────────────────────────────────────┐
│  voyager-ads (Advertiser Portal) — NO CHANGES                │
│                                                              │
│  Advertiser creates campaign → Firestore ads_campaigns       │
│  Metrics dashboard reads ← daily_metrics subcollection       │
└──────────────────────┬───────────────────────▲───────────────┘
                       │                       │
                       ▼                       │
┌──────────────────────────────────────────────────────────────┐
│  Firestore                                                   │
│                                                              │
│  ads_campaigns/{id}                                          │
│    ├── status, placement, targeting fields, budgetCents      │
│    ├── totalImpressions, totalClicks  (FieldValue.increment) │
│    └── daily_metrics/{YYYY-MM-DD}                            │
│         └── impressions, clicks, spend                       │
└──────────────────────┬───────────────────────▲───────────────┘
                       │                       │
          ┌────────────┘                       └────────────┐
          ▼                                                 │
┌─────────────────────────────┐    ┌────────────────────────────┐
│  🆕 selectAds CF            │    │  🆕 logAdEvents CF          │
│  (voyager-pwa/functions)    │    │  (voyager-pwa/functions)    │
│                             │    │                             │
│  Input:                     │    │  Input:                     │
│   - placement               │    │   - events[] batch          │
│   - userContext (dest,       │    │     {type, campaignId, ts}  │
│     dates, gender, etc.)    │    │                             │
│                             │    │  Actions:                   │
│  Query: ads_campaigns       │    │   - increment daily_metrics │
│   WHERE status = 'active'   │    │   - increment totalImpr/    │
│   AND placement = X         │    │     totalClicks on campaign │
│   AND startDate <= today    │    │   - decrement budgetCents   │
│   AND endDate >= today      │    │   - auto-pause if budget=0  │
│   AND budgetCents > 0       │    │                             │
│                             │    │  Output: { processed: N }   │
│  Score by targeting match   │    │                             │
│  Return: AdUnit[] batch     │    │                             │
└──────────────┬──────────────┘    └────────────▲───────────────┘
               │                                │
               ▼                                │
┌──────────────────────────────────────────────────────────────┐
│  voyager-RN (Consumer App)                                   │
│                                                              │
│  🆕 useAdDelivery hook                                       │
│    → calls selectAds on feed load                            │
│    → returns AdUnit[] for placement                          │
│                                                              │
│  🆕 useAdFrequency hook                                      │
│    → AsyncStorage 24h rolling cap per user×campaign          │
│    → filters over-cap campaigns from batch                   │
│                                                              │
│  🆕 useAdTracking hook                                       │
│    → buffers impression/click events in memory               │
│    → 1s viewability timer (IAB-compliant)                    │
│    → flushes batch to logAdEvents every 30s or on unmount    │
│                                                              │
│  VideoFeedPage → splice ad every 5th position                │
│  SearchPage → interstitial sponsored card every 4 swipes     │
│  AIItineraryDisplay → wire existing promotions[] UI to data  │
└──────────────────────────────────────────────────────────────┘
```

---

## 4. Sequence Diagram — Video Feed Example

```
Mobile User          VideoFeedPage       useAdDelivery      useAdFrequency     useAdTracking      selectAds CF       logAdEvents CF     Firestore
    │                     │                   │                   │                  │                  │                  │                │
    │  Opens Video Feed   │                   │                   │                  │                  │                  │                │
    │────────────────────>│                   │                   │                  │                  │                  │                │
    │                     │  useAdDelivery('video_feed', ctx)     │                  │                  │                  │                │
    │                     │──────────────────>│                   │                  │                  │                  │                │
    │                     │                   │  httpsCallable    │                  │                  │                  │                │
    │                     │                   │─────────────────────────────────────────────────────────>│                  │                │
    │                     │                   │                   │                  │                  │ Query:            │                │
    │                     │                   │                   │                  │                  │ ads_campaigns     │                │
    │                     │                   │                   │                  │                  │ WHERE active +    │                │
    │                     │                   │                   │                  │                  │ placement +       │                │
    │                     │                   │                   │                  │                  │ date range +      │                │
    │                     │                   │                   │                  │                  │ budget > 0        │                │
    │                     │                   │                   │                  │                  │─────────────────────────────────────>│
    │                     │                   │                   │                  │                  │<─────────────────────────────────────│
    │                     │                   │                   │                  │                  │ Score & rank      │                │
    │                     │                   │<─────────────────────────────────────────────────────────│ AdUnit[] (5 ads) │                │
    │                     │                   │                   │                  │                  │                  │                │
    │                     │                   │ filterByFreqCap   │                  │                  │                  │                │
    │                     │                   │──────────────────>│                  │                  │                  │                │
    │                     │                   │                   │ Check AsyncStorage│                 │                  │                │
    │                     │                   │                   │ 24h rolling window│                 │                  │                │
    │                     │                   │<──────────────────│ Eligible ads     │                  │                  │                │
    │                     │                   │                   │                  │                  │                  │                │
    │                     │<──────────────────│ ads[] ready       │                  │                  │                  │                │
    │                     │                   │                   │                  │                  │                  │                │
    │                     │ Splice ads at positions 4, 9, 14...  │                  │                  │                  │                │
    │                     │                   │                   │                  │                  │                  │                │
    │  Scrolls to ad      │                   │                   │                  │                  │                  │                │
    │────────────────────>│                   │                   │                  │                  │                  │                │
    │                     │ onViewableItemsChanged → ad visible  │                  │                  │                  │                │
    │                     │──────────────────────────────────────────────────────────>│                  │                  │                │
    │                     │                   │                   │                  │ Start 1s timer   │                  │                │
    │                     │                   │                   │                  │ Timer fires →    │                  │                │
    │                     │                   │                   │                  │ buffer impression│                  │                │
    │                     │                   │                   │                  │                  │                  │                │
    │  Taps CTA           │                   │                   │                  │                  │                  │                │
    │────────────────────>│                   │                   │                  │                  │                  │                │
    │                     │──────────────────────────────────────────────────────────>│ buffer click     │                  │                │
    │                     │                   │                   │                  │                  │                  │                │
    │                     │                   │                   │                  │ Flush batch (30s) │                 │                │
    │                     │                   │                   │                  │──────────────────────────────────────>│                │
    │                     │                   │                   │                  │                  │                  │ increment      │
    │                     │                   │                   │                  │                  │                  │ daily_metrics  │
    │                     │                   │                   │                  │                  │                  │───────────────>│
    │                     │                   │                   │                  │                  │                  │ increment      │
    │                     │                   │                   │                  │                  │                  │ totalImpr/Click│
    │                     │                   │                   │                  │                  │                  │───────────────>│
    │                     │                   │                   │                  │                  │                  │ decrement      │
    │                     │                   │                   │                  │                  │                  │ budgetCents    │
    │                     │                   │                   │                  │                  │                  │ if 0 → pause   │
    │                     │                   │                   │                  │                  │                  │───────────────>│
```

---

## 5. Firestore Data Model

### Existing: `ads_campaigns/{id}` (written by voyager-ads portal)

| Field | Type | Notes |
|---|---|---|
| `id` | string | Document ID |
| `uid` | string | Advertiser's Firebase UID |
| `status` | string | `draft` / `active` / `paused` / `completed` |
| `placement` | string | `video_feed` / `itinerary_feed` / `ai_slot` |
| `startDate` | string | YYYY-MM-DD |
| `endDate` | string | YYYY-MM-DD |
| `assetUrl` | string | Image or video URL |
| `muxPlaybackUrl` | string? | HLS URL for video_feed campaigns |
| `primaryText` | string | Ad copy |
| `cta` | string | "Book Now", "Learn More", etc. |
| `landingUrl` | string | Click-through URL |
| `targetDestination` | string | Google Places destination (itinerary_feed) |
| `targetPlaceId` | string | Canonical place_id (itinerary_feed) |
| `location` | string? | Destination string for video_feed / ai_slot placements (fallback when `targetDestination` is absent) |
| `targetTravelStartDate` | string | YYYY-MM-DD |
| `targetTravelEndDate` | string | YYYY-MM-DD |
| `targetGender` | string | '' = all |
| `targetTripTypes` | string[] | [] = all |
| `targetActivityPreferences` | string[] | [] = all |
| `targetTravelStyles` | string[] | [] = all |
| `billingModel` | string | `cpm` / `cpc` |
| `budgetType` | string | `daily` / `lifetime` |
| `budgetAmount` | string | Dollar amount as string |
| `isUnderReview` | boolean | Must be `false` to serve |
| `totalImpressions` | number? | Lifetime counter (FieldValue.increment) |
| `totalClicks` | number? | Lifetime counter (FieldValue.increment) |

### NEW field: `budgetCents` (number)

The `budgetAmount` field is a string ("50" = $50). We need an integer `budgetCents` field (5000 = $50.00) for atomic decrement operations. This will be **set once when admin approves the campaign** (in `reviewCampaign.ts`) by converting `budgetAmount` to cents.

### Existing subcollection: `ads_campaigns/{id}/daily_metrics/{YYYY-MM-DD}`

| Field | Type | Notes |
|---|---|---|
| `impressions` | number | Daily impression count (FieldValue.increment) |
| `clicks` | number | Daily click count (FieldValue.increment) |
| `spend` | number | Daily spend in cents (FieldValue.increment) |

Already seeded by `scripts/seedCampaignMetrics.ts`. Already read by `useCampaignMetrics.ts` and `useMultiCampaignMetrics.ts` in voyager-ads dashboard. The `logAdEvents` CF will **write** to these docs.

---

## 6. Detailed File Plan

### 6A. voyager-pwa/functions — Cloud Functions (2 new files, 2 modified)

#### NEW: `src/selectAds.ts`

**Purpose:** Receive placement + user context, return batch of eligible ad campaigns.

```typescript
// Input
interface SelectAdsRequest {
  placement: 'video_feed' | 'itinerary_feed' | 'ai_slot';
  limit?: number;           // default 5
  userContext?: {
    destination?: string;   // user's current itinerary destination
    placeId?: string;       // Google Places canonical ID
    travelStartDate?: string; // YYYY-MM-DD
    travelEndDate?: string;
    age?: number;           // calculated from userProfile.dob via calculateAge()
    gender?: string;
    tripTypes?: string[];
    activityPreferences?: string[];  // from useTravelPreferences().defaultProfile.activities
    travelStyles?: string[];         // from useTravelPreferences().defaultProfile.travelStyle
    interests?: string[];
  };
}

// Output
interface AdUnit {
  campaignId: string;
  placement: string;
  creativeType: 'image' | 'video';
  assetUrl: string;
  muxPlaybackUrl?: string;
  primaryText: string;
  cta: string;
  landingUrl: string;
  businessType?: string;
  businessName?: string;    // = campaign.name for display
  address?: string;
  phone?: string;
  email?: string;
  promoCode?: string;
  billingModel: 'cpm' | 'cpc';
}

interface SelectAdsResponse {
  ads: AdUnit[];
}
```

**Query logic:**
1. Firestore query: `ads_campaigns` WHERE `status == 'active'` AND `placement == X` AND `isUnderReview == false`
2. Client-side filter: `startDate <= today <= endDate` AND `budgetCents > 0`
3. **Targeting score** (max 12 points):
   - `placeId` exact match: **+3** (itinerary_feed only)
   - `destination` string match: **+2** — resolves `campaign.targetDestination || campaign.location` to support video_feed/ai_slot campaigns that store destination in `location` field
   - Travel date overlap: **+2**
   - `age` within `ageFrom`–`ageTo`: **+2**
   - `gender` match: **+1**
   - `tripTypes` overlap: **+1**
   - `activityPreferences` overlap: **+1** — populated from `useTravelPreferences().defaultProfile.activities`
   - `travelStyles` overlap: **+1** — populated from `useTravelPreferences().defaultProfile.travelStyle` (fallback when itinerary metadata doesn't provide one)
   - `interests` keyword overlap: **+1**
   - Campaigns with no targeting constraints (empty fields) match everyone.
4. Sort by score descending, return top `limit` results
5. Does NOT require authentication (anonymous users can see ads)

#### NEW: `src/logAdEvents.ts`

**Purpose:** Receive batched impression/click events, update Firestore counters atomically.

```typescript
// Input
interface AdEvent {
  type: 'impression' | 'click' | 'video_quartile';
  campaignId: string;
  timestamp: number;       // epoch ms
  quartile?: 25 | 50 | 75 | 100;  // for video_quartile events
}

interface LogAdEventsRequest {
  events: AdEvent[];
}

// Output
interface LogAdEventsResponse {
  processed: number;
}
```

**Write logic (per event):**
1. For `impression` events:
   - `daily_metrics/{YYYY-MM-DD}`: increment `impressions` by 1
   - `ads_campaigns/{id}`: increment `totalImpressions` by 1
   - If `billingModel == 'cpm'`: every 1000th impression, decrement `budgetCents` by CPM rate (initially: fixed $5 CPM = 0.5 cents per impression)
2. For `click` events:
   - `daily_metrics/{YYYY-MM-DD}`: increment `clicks` by 1
   - `ads_campaigns/{id}`: increment `totalClicks` by 1
   - If `billingModel == 'cpc'`: decrement `budgetCents` by CPC rate (initially: fixed $0.50 CPC = 50 cents)
   - `daily_metrics`: increment `spend` by charge amount
3. Budget enforcement: after decrement, if `budgetCents <= 0`, set `status = 'paused'`
4. Uses batched writes for efficiency (single Firestore batch per CF invocation)
5. Does NOT require authentication (events come from anonymous users too)

#### NEW: `src/types/adDelivery.ts`

Shared type definitions for `SelectAdsRequest`, `SelectAdsResponse`, `AdUnit`, `AdEvent`, `LogAdEventsRequest`, `LogAdEventsResponse`. Imported by both CFs.

#### MODIFIED: `src/index.ts`

Add 2 lines:
```typescript
export { selectAds } from './selectAds';
export { logAdEvents } from './logAdEvents';
```

#### MODIFIED: `src/reviewCampaign.ts`

When admin approves a campaign (`action === 'approve'`), also set:
```typescript
budgetCents: Math.round(parseFloat(campaign.budgetAmount) * 100)
```

This converts the string `budgetAmount` ("50") into integer cents (5000) for atomic decrement operations.

---

### 6B. voyager-RN — Consumer App (3 new hooks, 2 new components, 1 new type, 3 modified pages)

#### NEW: `src/types/AdUnit.ts`

Client-side type matching the `AdUnit` returned by `selectAds`:

```typescript
export interface AdUnit {
  campaignId: string;
  placement: 'video_feed' | 'itinerary_feed' | 'ai_slot';
  creativeType: 'image' | 'video';
  assetUrl: string;
  muxPlaybackUrl?: string;
  primaryText: string;
  cta: string;
  landingUrl: string;
  businessType?: string;
  businessName?: string;
  address?: string;
  phone?: string;
  email?: string;
  promoCode?: string;
  billingModel: 'cpm' | 'cpc';
}
```

#### NEW: `src/hooks/ads/useAdDelivery.ts`

**Purpose:** Fetch a batch of ads for a given placement on mount.

```typescript
function useAdDelivery(
  placement: 'video_feed' | 'itinerary_feed' | 'ai_slot',
  userContext?: UserAdContext
): {
  ads: AdUnit[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}
```

- Calls `httpsCallable(functions, 'selectAds')` once on mount
- Passes through `useAdFrequency` to filter over-cap campaigns
- Returns ready-to-render ad units
- `refresh()` for pull-to-refresh scenarios

#### NEW: `src/hooks/ads/useAdTracking.ts`

**Purpose:** Buffer impression/click events, flush to server in batches.

```typescript
function useAdTracking(): {
  trackImpression: (campaignId: string) => void;
  trackClick: (campaignId: string) => void;
  trackVideoQuartile: (campaignId: string, quartile: 25 | 50 | 75 | 100) => void;
}
```

- Maintains in-memory buffer of `AdEvent[]`
- `trackImpression`: starts 1-second viewability timer; only logs after 1s continuous visibility (IAB standard)
- `trackClick`: immediate buffer
- `trackVideoQuartile`: buffers quartile progress events
- Auto-flushes every 30 seconds via `setInterval`
- Also flushes on unmount via `useEffect` cleanup
- Calls `httpsCallable(functions, 'logAdEvents')` with the batch
- Deduplicates: won't log same impression twice for same campaign in same session

#### NEW: `src/hooks/ads/useAdFrequency.ts`

**Purpose:** 24-hour rolling frequency cap per user per campaign.

```typescript
function useAdFrequency(): {
  filterByCap: (ads: AdUnit[], maxPerDay?: number) => AdUnit[];
  recordImpression: (campaignId: string) => void;
}
```

- Reads/writes AsyncStorage key `@ad_impressions` → `{ [campaignId]: timestamp[] }`
- `filterByCap`: removes campaigns where user has seen >= `maxPerDay` (default: 3) impressions in the last 24 hours
- `recordImpression`: appends current timestamp, prunes entries older than 24h
- Lightweight; no network calls

#### NEW: `src/components/ads/SponsoredVideoCard.tsx`

**Purpose:** Render a sponsored video in the Video Feed FlatList.

- Accepts `AdUnit` prop
- For `creativeType: 'video'`: plays `muxPlaybackUrl` (or falls back to `assetUrl`) using the same video player as `VideoCardV2`
- For `creativeType: 'image'`: renders full-screen image
- Displays "Sponsored" label at top
- CTA pill overlay at bottom: `"{primaryText}" · {cta} →` — taps open `landingUrl` via `Linking.openURL()`
- Matches the visual design language of organic `VideoCardV2` cards
- Fires `trackImpression` when visible, `trackClick` on CTA tap

#### NEW: `src/components/ads/SponsoredItineraryCard.tsx`

**Purpose:** Render a sponsored interstitial card in the Itinerary Search swipe flow.

- Accepts `AdUnit` prop
- Renders as a card matching the `ItineraryCard` visual style
- Shows: "Sponsored" badge, business name, ad image, `primaryText`, `cta` button
- CTA button opens `landingUrl` via `Linking.openURL()`
- "Skip" button to dismiss and continue to next organic match
- Fires `trackImpression` when shown, `trackClick` on CTA tap

#### MODIFIED: `src/pages/VideoFeedPage.tsx`

**Current:** FlatList renders `videos: Video[]` from `useVideoFeed()`.

**Change:** 
1. Import `useAdDelivery`, `useAdTracking`, `useUserProfile`, `calculateAge`, and `useTravelPreferences`
2. Build `userContext` with `gender` (from `userProfile.gender`), `age` (from `calculateAge(userProfile.dob)`), `activityPreferences` (from `useTravelPreferences().defaultProfile.activities`), and `travelStyles` (from `useTravelPreferences().defaultProfile.travelStyle`)
3. After `videos` loads, splice `AdUnit` items into the array at every 5th position (indices 4, 9, 14, ...)
4. Create a union type: `type FeedItem = { type: 'video'; data: Video } | { type: 'ad'; data: AdUnit }`
5. Update `renderItem` to branch: organic → `<VideoCardV2 />`, ad → `<SponsoredVideoCard />`
6. `keyExtractor` uses `video.id` for organic, `ad-${campaignId}` for ads
7. Wire `onViewableItemsChanged` to call `trackImpression` for ad items

#### MODIFIED: `src/pages/SearchPage.tsx`

**Current:** Shows one `ItineraryCard` at a time from `matchingItineraries[0]`.

**Change:**
1. Import `useAdDelivery`, `useAdTracking`, `useUserProfile`, `calculateAge`, and `useTravelPreferences`
2. Build `userContext` with `gender`, `age`, `activityPreferences` (from `useTravelPreferences().defaultProfile.activities`), and `travelStyles` (from `useTravelPreferences().defaultProfile.travelStyle`)
3. Track a `swipeCount` counter
4. After every N organic swipes (e.g., 3), show a `<SponsoredItineraryCard />` instead of the next organic match
5. When user taps "Skip" on the ad, increment past it and show next organic match
6. Wire `trackImpression` when ad card appears, `trackClick` on CTA tap

#### MODIFIED: `src/components/ai/AIItineraryDisplay.tsx`

**Current:** Already renders `promotions: AdPromotion[]` in a "Local Deals & Promotions" accordion. Data is currently AI-hallucinated placeholders.

**Change:**
1. Import `useAdDelivery`, `useAdTracking`, `useUserProfile`, `calculateAge`, and `useTravelPreferences`
2. On mount, call `useAdDelivery('ai_slot', { destination, travelStartDate, travelEndDate, tripTypes, ... })` using the itinerary's actual context
3. Build `userContext` with `gender`, `age`, `activityPreferences` (merged & deduplicated from itinerary activities + `useTravelPreferences().defaultProfile.activities`), and `travelStyles` (from itinerary metadata, with fallback to `useTravelPreferences().defaultProfile.travelStyle`)
4. Map returned `AdUnit[]` → `AdPromotion[]` (field mapping: `businessName` ← `campaignName`, `headline` ← `primaryText`, etc.)
5. Replace the AI-hallucinated promotions with the real ad data
6. Wire `trackImpression` when accordion expands, `trackClick` when CTA tapped

---

## 7. Decisions Log

| Decision | Choice | Rationale |
|---|---|---|
| Consumer platform | voyager-RN only | PWA replaced by RN; functions stay in voyager-pwa |
| Ad selection model | Batch fetch on feed load | Single CF call returns ~5 ads; avoids per-item latency |
| Event tracking | Batched client → `logAdEvents` CF | Reduces CF invocations; batched writes are cheaper |
| Video Feed frequency | Every 5th video | Industry standard; not too aggressive |
| Itinerary Feed UX | Interstitial every N swipes | Matches swipe-based flow; "Skip" button for UX |
| AI Itinerary promos | Wire existing UI to real data | UI already built; just need real ad data from `selectAds` |
| Viewability standard | 1s continuous visibility (IAB) | Industry-standard; prevents scroll-through false impressions |
| Video metrics | Quartile tracking (25/50/75/100%) | Standard video ad metric |
| Budget enforcement | Atomic decrement + auto-pause | Prevents overspend; advertiser sees "paused" status |
| Frequency caps | 24h rolling, 3 impressions max per campaign | AsyncStorage client-side; lightweight, no server cost |
| Authentication | Not required for selectAds/logAdEvents | Anonymous users should see and interact with ads |

---

## 8. New Files Summary

### voyager-pwa/functions (4 files)

| File | Type | Description |
|---|---|---|
| `src/selectAds.ts` | NEW | `onCall` CF — ad selection with targeting |
| `src/logAdEvents.ts` | NEW | `onCall` CF — batched event tracking + budget |
| `src/types/adDelivery.ts` | NEW | Shared TypeScript interfaces |
| `src/index.ts` | MODIFIED | Add 2 exports |
| `src/reviewCampaign.ts` | MODIFIED | Set `budgetCents` on approval |

### voyager-RN (9 files)

| File | Type | Description |
|---|---|---|
| `src/types/AdUnit.ts` | NEW | Client-side ad unit type |
| `src/hooks/ads/useAdDelivery.ts` | NEW | Fetch ads for placement |
| `src/hooks/ads/useAdTracking.ts` | NEW | Buffer + flush impression/click events |
| `src/hooks/ads/useAdFrequency.ts` | NEW | AsyncStorage 24h frequency cap |
| `src/components/ads/SponsoredVideoCard.tsx` | NEW | Sponsored card for Video Feed |
| `src/components/ads/SponsoredItineraryCard.tsx` | NEW | Sponsored card for Itinerary Search |
| `src/pages/VideoFeedPage.tsx` | MODIFIED | Splice ads into FlatList |
| `src/pages/SearchPage.tsx` | MODIFIED | Interstitial ad every N swipes |
| `src/components/ai/AIItineraryDisplay.tsx` | MODIFIED | Wire real ad data to existing UI |

### voyager-ads (0 files)

No changes.

---

## 9. Implementation Order

| Phase | What | Depends On |
|---|---|---|
| **Phase 1** | Shared types (`adDelivery.ts`) + `selectAds` CF + `reviewCampaign` budgetCents | Nothing |
| **Phase 2** | `logAdEvents` CF | Phase 1 types |
| **Phase 3** | Deploy both CFs; smoke test with `scripts/smoke-test.js` | Phase 1 + 2 |
| **Phase 4** | `AdUnit.ts` type + `useAdDelivery` hook + `useAdFrequency` hook in voyager-RN | Phase 3 (CFs deployed) |
| **Phase 5** | `useAdTracking` hook | Phase 4 |
| **Phase 6** | `SponsoredVideoCard` component + VideoFeedPage integration | Phase 4 + 5 |
| **Phase 7** | `SponsoredItineraryCard` component + SearchPage integration | Phase 4 + 5 |
| **Phase 8** | AIItineraryDisplay wiring | Phase 4 + 5 |
| **Phase 9** | End-to-end testing on device | All phases |

---

## 10. Cost Analysis

| Resource | Estimated Cost | Notes |
|---|---|---|
| `selectAds` CF invocations | ~$0 (free tier) | One call per feed load; well within 2M free invocations/month |
| `logAdEvents` CF invocations | ~$0 (free tier) | Batched: one call per 30s of active session; far fewer than per-impression calls |
| Firestore reads (selectAds) | ~$0 (free tier) | Each call reads ~10-50 campaign docs; 50K free reads/day |
| Firestore writes (logAdEvents) | Minimal | Batched writes: 2-3 doc writes per batch (daily_metrics + campaign counter). 20K free writes/day |
| No new external APIs | $0 | All data comes from Firestore; no third-party ad exchange |

**Total incremental cost: effectively $0** at current scale. Monitor if daily active users exceed ~10K.

---

## 11. Risk & Mitigations

| Risk | Mitigation |
|---|---|
| No active campaigns → empty ad slots | `useAdDelivery` returns empty array; feed renders organically with no gaps |
| Budget race condition (concurrent decrements) | `FieldValue.increment` is atomic in Firestore; batched writes are transactional |
| Over-serving after budget exhaustion | Auto-pause on `budgetCents <= 0`; `selectAds` filters `budgetCents > 0` |
| Stale frequency cap data | 24h prune on every read; AsyncStorage is synchronous on RN |
| Ad fatigue / user annoyance | Frequency cap (3/day/campaign) + spacing (every 5th video) |
| TypeScript compilation | All new code strictly typed; no `any`; verify with `npx tsc --noEmit` |

---

## 12. Testing Plan

| Test | Scope | Tool |
|---|---|---|
| `selectAds` unit test | Query logic, targeting scoring, date range filtering | Jest (functions) |
| `logAdEvents` unit test | Counter increments, budget decrement, auto-pause | Jest (functions) |
| Smoke test both CFs | Authenticated calls with real payloads | `scripts/smoke-test.js` |
| `useAdDelivery` hook test | Mock `httpsCallable`, verify state management | Jest (voyager-RN) |
| `useAdTracking` hook test | Buffer, flush timing, deduplication | Jest (voyager-RN) |
| `useAdFrequency` hook test | AsyncStorage mock, 24h window, cap filtering | Jest (voyager-RN) |
| Component renders | `SponsoredVideoCard`, `SponsoredItineraryCard` | RNTL (voyager-RN) |
| Manual device testing | Full flow: see ad → impression counted → click tracked → budget decremented | iOS Simulator + Firestore Console |
| Integration tests (live) | `selectAds.real.test.ts` (14 tests), `logAdEvents.real.test.ts` (14 tests) | Jest integration config against mundo1-dev |

---

## 13. Targeting Audit & Fixes

Two targeting audits were performed after the initial implementation to identify and fix gaps in the scoring logic and user context population.

### Audit 1 — Age, Gender, Interests (completed)

| Gap | Fix | Tests Added |
|---|---|---|
| `age` scoring ignored — `calculateAge` never called | Wired `calculateAge(userProfile.dob)` into all 4 RN call sites | 3 unit tests |
| `interests` scoring ignored — field never compared | Added `interests` overlap scoring in `scoreCampaign` | 3 unit tests |
| `gender` + `age` not passed from VideoFeedPage or SearchPage | Added `useUserProfile` + `calculateAge` imports and context enrichment | 9 live targeting tests |

### Audit 2 — Destination, Activity Preferences, Travel Styles (completed)

| Gap | Root Cause | Fix | Tests Added |
|---|---|---|---|
| `location` field ignored by `scoreCampaign` | video_feed/ai_slot campaigns store destination in `location` (not `targetDestination`), but scoring only checked `targetDestination` | Resolve `campDestStr = campaign.targetDestination \|\| campaign.location \|\| ''` in `scoreCampaign()`. Added `location?: string` to `CampaignDoc` type. | 7 unit tests + 2 live integration tests |
| `activityPreferences` never populated from user data | `useTravelPreferences` hook existed but was never called from any ad delivery code path | Wired `useTravelPreferences().defaultProfile.activities` into all 4 RN call sites (VideoFeedPage, VideoFeedPage.android, SearchPage, AIItineraryDisplay) | Verified via existing scoring tests |
| `travelStyles` only from itinerary metadata | User's default travel style preference was not used when itinerary metadata didn't have one | Added fallback to `useTravelPreferences().defaultProfile.travelStyle` in AIItineraryDisplay; direct population in VideoFeedPage and SearchPage | Verified via existing scoring tests |

### Files Modified (Audit 2)

**Cloud Functions:**
- `functions/src/selectAds.ts` — `location` field fallback in destination scoring
- `functions/src/types/adDelivery.ts` — Added `location?: string` to `CampaignDoc`
- `functions/src/__tests__/selectAds.test.ts` — 7 new tests for location scoring

**React Native (4 call sites):**
- `src/pages/VideoFeedPage.tsx` — Added `useTravelPreferences`, enriched context with `activityPreferences` and `travelStyles`
- `src/pages/VideoFeedPage.android.tsx` — Same changes
- `src/pages/SearchPage.tsx` — Same changes
- `src/components/ai/AIItineraryDisplay.tsx` — Added `useTravelPreferences`, merged activities (dedup), travelStyle fallback

**Test Mocks Updated:**
- `src/__tests__/components/AIItineraryDisplay.test.tsx`
- `src/__tests__/components/ai/AIItineraryDisplay.editing.test.tsx`
- `src/__tests__/components/ai/AIItineraryDisplay.flights.simple.test.tsx`
- `src/__tests__/components/ai/AIItineraryDisplay.inline-editing.test.tsx`
- `src/__tests__/pages/VideoFeedPage.upload.test.tsx`

### Targeting Matrix — What's Functional Per Placement

| Targeting Field | video_feed | itinerary_feed | ai_slot | search_page |
|---|---|---|---|---|
| `placeId` exact match (+3) | ❌ Not stored | ✅ | ❌ Not stored | ❌ Not stored |
| `destination` string match (+2) | ✅ via `location` | ✅ via `targetDestination` | ✅ via `location` | ✅ via `targetDestination` |
| Travel date overlap (+2) | ❌ No date context | ✅ | ✅ | ❌ No date context |
| `age` within range (+2) | ✅ | ✅ | ✅ | ✅ |
| `gender` match (+1) | ✅ | ✅ | ✅ | ✅ |
| `tripTypes` overlap (+1) | ❌ No trip context | ✅ | ✅ | ❌ No trip context |
| `activityPreferences` overlap (+1) | ✅ from travel profile | ✅ | ✅ merged itinerary + profile | ✅ from travel profile |
| `travelStyles` overlap (+1) | ✅ from travel profile | ✅ | ✅ itinerary + profile fallback | ✅ from travel profile |
| `interests` keyword overlap (+1) | ✅ | ✅ | ✅ | ✅ |

### Known Limitations (Not Bugs — Design Constraints)

1. **`placeId` only available for `itinerary_feed`** — video_feed and ai_slot campaign forms discard the placeId from DestinationAutocomplete, storing only the description string in `location`.
2. **`destinationMatch` checkbox not enforced as hard filter** — It's a soft signal stored on the campaign; scoring uses it for fuzzy matching but doesn't exclude non-matching users.
3. **`radius` field defined but unused** — Present on `CampaignDraft` type but no form control renders for it.
4. **`activityPreferences` not collected for `itinerary_feed` placement** — The campaign form only shows this field for `ai_slot` placement.

### Test Results Summary (Post-Audit 2)

| Suite | Count | Status |
|---|---|---|
| CF unit tests (`selectAds`) | 72 | ✅ All pass |
| CF unit tests (`logAdEvents`) | 50 | ✅ All pass |
| RN ad unit tests | 64 | ✅ All pass |
| RN full test suite | 2,383 | ✅ All pass (143 suites) |
| Ads portal tests | 623 | ✅ All pass (58 suites) |
| Live integration tests (`selectAds`) | 14 | ✅ All pass (includes 2 new location tests) |
| Live integration tests (`logAdEvents`) | 14 | ✅ All pass |
