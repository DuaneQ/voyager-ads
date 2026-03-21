# Consumer-Side Ad Delivery — Implementation Plan

**Date:** March 2, 2026  
**Status:** ✅ Implemented — Deployed to `mundo1-dev`; production deployment pending  
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
| RN full test suite | 2,386 | ✅ All pass (143 suites) |
| Ads portal tests | 626 | ✅ All pass (58 suites) |
| Live integration tests (`selectAds`) | 14 | ✅ All pass (includes 2 new location tests) |
| Live integration tests (`logAdEvents`) | 14 | ✅ All pass |

---

## 14. Production Debugging Session — 2026-03-02

After initial deployment to `mundo1-dev`, four issues were identified through testing and Cloud Function logs and resolved in this session.

### Issue 1 — `processAdVideoWithMux` HTTP 500 Unauthorized

**Symptom:** New campaign video uploaded via advertiser PWA caused a 500 error: `Error: Unauthorized: caller does not own this campaign`.

**Root cause:** The ownership check in `processAdVideoWithMux` compared `campaignSnap.data()?.advertiserId !== request.auth.uid`, but Firestore stores the campaign owner under the `uid` field (not `advertiserId`).

**Fix applied to `voyager-pwa/functions/src/muxVideoProcessing.ts`:**
```ts
// Before
if (campaignSnap.data()?.advertiserId !== request.auth.uid)

// After
if (campaignSnap.data()?.uid !== request.auth.uid)
```

**Deployed to `mundo1-dev` ✅**

---

### Issue 2 — Mux signed URL failing on dev (wrong Cloud Storage bucket)

**Symptom:** After the ownership fix, Mux asset creation still failed on dev with a bucket access error.

**Root cause:** `processAdVideoWithMux` used `admin.storage().bucket("mundo1-1.appspot.com")` — the hardcoded production bucket name. The dev environment's default bucket has a different name, so signed URL generation failed.

**Fix applied to `voyager-pwa/functions/src/muxVideoProcessing.ts`:**
```ts
// Before
const bucket = admin.storage().bucket("mundo1-1.appspot.com");

// After
const bucket = admin.storage().bucket();  // uses project's default bucket in any env
```

**Deployed to `mundo1-dev` ✅**  
**Verified end-to-end:** Cloud logs confirmed `video.asset.created` → `video.asset.ready` → `Updated ads_campaigns/{id} with playback URL`. App confirmed playing new "Winter Beach Escape" campaign via `https://stream.mux.com/*.m3u8`.

---

### Issue 3 — Ad slot appearing at 6th position instead of 5th

**Symptom:** User confirmed the ad was showing at mixed-feed index 5 (the 6th slot) instead of 4 (the 5th slot).

**Root cause:** `FIRST_AD_AFTER = 4` placed the first ad after 4+1 = 5 content items, putting it at mixed-feed index 5.

**Fix applied to `voyager-RN/src/hooks/ads/useAdFrequency.ts`:**
```ts
// Before
const FIRST_AD_AFTER = 4

// After
const FIRST_AD_AFTER = 3
```

**Effect:** Feed layout is now:
```
content[0] content[1] content[2] content[3] AD content[4] content[5] content[6] content[7] content[8] AD ...
index:  0            1            2            3            4   5            6            7            8            9            10
```

All 17 `useAdFrequency` tests updated and passing.

---

### Issue 4 — Web app sending incomplete user context to `selectAds` (only `{gender, age}`)

**Symptom:** Browser DevTools showed `[AdDelivery] fetching` logged with only `{gender, age}` — missing `activityPreferences` and `travelStyles`.

**Root cause:** On **web only**, Firebase Auth restores the session from indexedDB **asynchronously** (unlike iOS/Android where it restores synchronously from secure storage before first render). On cold page load: `currentUser === null` on first render → `useTravelPreferences` returns early (`userId` is null) → `travelProfile` stays `null`. The `lastAdContextKeyRef` dedup key then locks in `"gender:age"` when `userProfile` becomes available, and ignores the subsequent resolution of `travelProfile`.

**Fix applied to `voyager-RN/src/pages/VideoFeedPage.tsx`:**
1. Exposed `loading` state from `useTravelPreferences`
2. Added `travelProfileLoading` to `buildAdContext` `useCallback` dependency array
3. Added `useEffect` with `prevTravelLoadingRef` that resets `lastAdContextKeyRef.current = ''` when `loading` transitions `true → false`, forcing a fresh context evaluation

```tsx
const { defaultProfile: travelProfile, loading: travelProfileLoading } = useTravelPreferences();

const prevTravelLoadingRef = useRef(true);
useEffect(() => {
  if (prevTravelLoadingRef.current && !travelProfileLoading) {
    lastAdContextKeyRef.current = '';
  }
  prevTravelLoadingRef.current = travelProfileLoading;
}, [travelProfileLoading]);
```

**Status:** Code-complete, TS clean, 4/4 `VideoFeedPage` tests passing. **Pending app bundle deploy.**  
**Note:** `VideoFeedPage.android.tsx` has the same pattern and should receive the same fix before Android ships.

---

## 15. Manual Testing Plan

> **Resumed:** 2026-03-03  
> **Environment:** `mundo1-dev` Firebase project  
> **Test device(s):** iOS Simulator (primary), Android Emulator, Web (`localhost:8082`)

---

### Assumptions Going In

| Assumption | Confidence | Impact If Wrong |
|---|---|---|
| `selectAds` + `logAdEvents` deployed to `mundo1-dev` | High — deployed 2026-03-02 | Ads won't appear at all |
| `processAdVideoWithMux` ownership + bucket fixes deployed to `mundo1-dev` | High — verified 2026-03-02 | New video uploads will 500 |
| Campaign `SjgNVINC66OUEHjIAqev` is `status: active` with `budgetCents: 4999` | High — Firestore confirmed 2026-03-02 | No active test ad available |
| `budgetCents: 4999` means billing pipeline is working (1 impression logged → `Math.round(1 × 500 / 1000)` = 1 cent charged) | High — confirmed by CPM formula | — |
| Web travelProfile race condition fix is **NOT yet deployed** as app bundle | High — bundle not rebuilt | Web will send incomplete context `{gender, age}` only |
| `useTravelPreferences` returns full profile on iOS/Android (no race) | High — native Auth restores sync | iOS/Android targeting is complete today; web is incomplete |
| `budgetType: "daily"` has **no automatic daily reset** in `logAdEvents` | High — verified in source | Daily budget campaigns behave as lifetime for now — must be noted in results |
| `FIRST_AD_AFTER = 3`, `AD_INTERVAL = 5` → first ad at mixed-feed index 4 | High — unit tests confirm | Wrong ad position |

---

### Cloud Functions to Verify During Testing

| Function | What to Watch in Cloud Logs | Expected Result |
|---|---|---|
| `selectAds` | Log line: `[selectAds]` with placement, campaign count, scores | Returns top-N ranked campaigns; score descending |
| `logAdEvents` | Log line: `[logAdEvents]` per campaign, processed count, budget deduction | `daily_metrics` updated; `budgetCents` decremented |
| `logAdEvents` — budget exhaustion | `[logAdEvents] Campaign X budget exhausted — paused.` | Campaign `status` flips to `paused` in Firestore |
| `processAdVideoWithMux` | `[Mux]` asset created, `muxStatus: preparing → ready` | Video plays via HLS in feed |
| — Negative: no spam | No repeated `selectAds` calls within same context key | Dedup guard working |

**How to watch logs:**  
```
firebase functions:log --project mundo1-dev --only selectAds,logAdEvents
```

---

### Test Scenarios & TODO

Mark each checkbox as it is verified. Record actual result in the **Result** column.

#### 🟩 A. Ad Delivery — Positive Cases

| # | Scenario | Steps | Expected | CF to Check | Result |
|---|---|---|---|---|---|
| A1 | Active ad is visible in video feed | Open Video Feed with ≥5 videos loaded | Ad card appears at position 5 (mixed-feed index 4) | `selectAds` — returns campaign | ☐ |
| A2 | Ad appears at correct slot — index 4 | Count items in feed: items 0,1,2,3 are content; item 4 is ad | Item at index 4 has `type: 'ad'` | — | ☐ |
| A3 | Ad repeats every 5 videos after first | Scroll past first ad; count to next | Second ad appears 5 content items later (index 10) | — | ☐ |
| A4 | Video ad plays automatically (HLS) | Ad card renders in viewport | Mux HLS stream plays, muted, looping | — | ☐ |
| A5 | "Sponsored" label visible | View ad card | Label is visible on ad | — | ☐ |
| A6 | CTA button tap opens landing URL | Tap ad CTA | Browser opens `landingUrl` from Firestore | `logAdEvents` — click event | ☐ |
| A7 | Impression logged after 1s | Scroll to ad, hold in view ≥1s | Firestore `daily_metrics/{today}.impressions` increments by 1 | `logAdEvents` — impression | ☐ |
| A8 | `budgetCents` decremented after billing threshold | Log ≥1 impression | `budgetCents` decrements by `Math.round(N × 500 / 1000)` cents | `logAdEvents` | ☐ |
| A9 | AI Itinerary slot shows ad | Open an AI Itinerary detail | Promotion slot renders a sponsored item | `selectAds` with `placement: ai_slot` | ☐ |

---

#### 🔴 B. Ad Filtering — Negative Cases (Ads That Must NOT Appear)

| # | Scenario | Setup | Expected | CF to Check | Result |
|---|---|---|---|---|---|
| B1 | Paused campaign does not appear | Set a campaign `status: 'paused'` in Firestore | That campaign never selected | `selectAds` — filters `status == active` | ☐ |
| B2 | Draft campaign does not appear | Set a campaign `status: 'draft'` | Not returned | `selectAds` | ☐ |
| B3 | Campaign under review does not appear | Set `isUnderReview: true` on an active campaign | Not returned | `selectAds` — client-side filter | ☐ |
| B4 | Expired campaign does not appear | Set `endDate` to yesterday (e.g. `2026-03-02`) | Not returned | `selectAds` — date range filter | ☐ |
| B5 | Future campaign does not appear | Set `startDate` to tomorrow (e.g. `2026-03-04`) | Not returned | `selectAds` — date range filter | ☐ |
| B6 | Budget-exhausted campaign does not appear | Manually set `budgetCents: 0` on a campaign | Not returned | `selectAds` — `budgetCents > 0` filter | ☐ |
| B7 | Rejected campaign does not appear | Set `status: 'rejected'` | Not returned | `selectAds` | ☐ |

> **Setup note:** To run B1–B7, temporarily edit a duplicate test campaign in Firestore. Do not modify `SjgNVINC66OUEHjIAqev`.

---

#### 🎯 C. Targeting & Ranking

| # | Scenario | Setup | Expected | Result |
|---|---|---|---|---|
| C1 | Higher-score campaign ranks first | Create two active campaigns: one with `ageFrom/ageTo` matching the test user, one without. User profile has a known age. | Targeted campaign returns first in `selectAds` response (score +2 for age) | ☐ |
| C2 | Destination match boosts rank | Campaign A has `location: "Cancun"`; Campaign B has no destination. Test user context has `destination: "Cancun"`. | Campaign A scores +2 higher than B | ☐ |
| C3 | iOS/Android sends full targeting context | iOS Simulator: verify `[AdDelivery] fetching` DevTools/log includes `activityPreferences` and `travelStyles` | Full context sent (no race condition on native) | ☐ |
| C4 | Web sends INCOMPLETE context (pre-fix) | Web: check `[AdDelivery] fetching` log after app bundle deployed without race fix | Only `{gender, age}` sent — confirms race condition | ☐ |
| C5 | Web sends full context AFTER race fix deploy | Rebuild web bundle with `VideoFeedPage.tsx` fix, refresh | `activityPreferences` + `travelStyles` now present in log | ☐ |
| C6 | Campaign with no targeting fields is eligible | Campaign with all targeting fields empty/`[]` | Still returned in `selectAds` (scores 0, but eligible) | ☐ |

---

#### 🔁 D. Frequency Cap & Deduplication

| # | Scenario | Steps | Expected | Result |
|---|---|---|---|---|
| D1 | Same ad not re-fetched during session | Feed loads; note campaign ID shown. Scroll down and back up. | `selectAds` not called again for same context key — dedup key prevents re-fetch | ☐ |
| D2 | Seen campaigns excluded from next fetch | Note `campaignId` of displayed ad. Force a context-key reset (change destination). | `seenCampaignIds` sent to `selectAds`; that campaign excluded from results | ☐ |
| D3 | Frequency cap prevents over-serving | Trigger ad ≥ frequency cap times in 24h (check AsyncStorage cap value) | Campaign filtered out after cap reached; does not re-appear until next 24h window | ☐ |

---

#### ⚡ E. Billing & Budget

| # | Scenario | Steps | Expected | Result |
|---|---|---|---|---|
| E1 | CPM billing: charge formula correct | Log 1 impression on CPM campaign | `budgetCents` decrements by `Math.round(1 × 500 / 1000)` = 1 cent | ☐ |
| E2 | CPM billing: 1000 impressions = $5 | Log 1000 impressions on CPM campaign | `budgetCents` decrements by 500 cents ($5.00) | ☐ |
| E3 | Budget exhaustion auto-pauses campaign | Manually set `budgetCents: 1`; trigger one more impression | `logAdEvents` sets `status: 'paused'`; Cloud log confirms `budget exhausted` | ☐ |
| E4 | Paused campaign disappears immediately | After E3, reload feed | Campaign no longer returned by `selectAds` | ☐ |
| E5 | Daily budget — no automatic reset (known gap) | Wait until next calendar day with a daily-budget campaign | `budgetCents` does NOT reset at midnight — this is a known design gap | ☐ |

> **Known gap documented:** `budgetType: "daily"` exists in Firestore but `logAdEvents` only decrements a lifetime `budgetCents` counter. No daily reset is implemented. Must be addressed before production launch.

---

#### 🌐 F. Platform Coverage

| # | Scenario | Platform | Expected | Result |
|---|---|---|---|---|
| F1 | Ad displays on iOS Simulator | iOS | Ad at index 4, HLS plays | ☐ |
| F2 | Ad displays on Android Emulator | Android | Ad at index 4, HLS plays | ☐ |
| F3 | Ad displays on Web (`localhost:8082`) | Web | Ad at index 4 (after race fix deploy) | ☐ |
| F4 | Impression/click tracked on iOS | iOS | `logAdEvents` called; Firestore updated | ☐ |
| F5 | Impression/click tracked on Web | Web | `logAdEvents` called; Firestore updated | ☐ |

---

### Questions to Resolve Before Full Testing

1. **Do we have a second campaign** (different status/dates) ready in Firestore to test negative scenarios B1–B7 without touching `SjgNVINC66OUEHjIAqev`? If not, we should create one test campaign and set it to each state.
2. **Web bundle:** Is the travelProfile race fix deployed? If yes, C4 is moot — skip straight to C5. If not, do C4 then deploy and re-run C5.
3. **Which platform to start on?** Recommendation: iOS Simulator first (A1–A9), then billing tests (E1–E4), then negatives (B1–B7), then web (F3, F5, C4/C5).

---

### Observations From Firestore (2026-03-03)

- `SjgNVINC66OUEHjIAqev` — `budgetCents: 4999` (started 5000) confirms billing pipeline is live: 1 cent was charged, consistent with `Math.round(1 × 500 / 1000) = 1` cent for the first impression logged after deployment.
- `billingModel: "cpm"`, `budgetType: "daily"`, `ageFrom: "25"`, `ageTo: "44"`, `audienceName: "Beach & Leisure Travelers"` — targeting is set, will score +2 for age match on users 25–44.
- Five campaigns visible in the left panel — we need to know the status of each to identify which are active vs not, for use in negative test scenarios.

---

## 16. Phase 2 & 3 Implementation Guide — Lessons from Phase 1 (Video Feed)

> **Audience:** The engineer implementing Phase 2 (Itinerary Card Feed) and Phase 3 (AI Itinerary promotions).  
> **Purpose:** Apply the bugs discovered and fixed during Phase 1 from the start, rather than discovering them again mid-implementation.  
> **Date written:** 2026-03-21

---

### 16.1 Double `selectAds` Call — Apply Debounce From Day One

**What happened in Phase 1:** When `useUserProfile` and `useTravelPreferences` resolved on the same render cycle (within milliseconds), the `useEffect` in `VideoFeedPage` fired twice, causing two concurrent `selectAds` calls, duplicate Cloud Function invocations, and confusing log output.

**Fix pattern — copy this into every ad-delivering page:**

```tsx
// 1. Consolidate all targeting fields into a single memoized fn
const buildAdContext = useCallback(() => {
  const ctx: Record<string, string | number | string[] | undefined> = {};
  if (userProfile?.gender) ctx.gender = userProfile.gender;
  if (userProfile?.dob) {
    const age = calculateAge(userProfile.dob);
    if (age > 0) ctx.age = age;
  }
  if (travelProfile?.activities?.length > 0) ctx.activityPreferences = travelProfile.activities;
  if (travelProfile?.travelStyle) ctx.travelStyles = [travelProfile.travelStyle];
  // Add placement-specific fields here (e.g. destination for itinerary_feed)
  return Object.keys(ctx).length > 0 ? (ctx as AdUserContext) : undefined;
}, [userProfile?.gender, userProfile?.dob, travelProfile?.activities, travelProfile?.travelStyle]);

// 2. Debounce the fetch — 300ms window collapses same-cycle re-renders
const fetchAdsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
useEffect(() => {
  if (fetchAdsTimerRef.current) clearTimeout(fetchAdsTimerRef.current);
  fetchAdsTimerRef.current = setTimeout(() => {
    fetchAds(buildAdContext(), getSeenIds());
  }, 300);
  return () => {
    if (fetchAdsTimerRef.current) clearTimeout(fetchAdsTimerRef.current);
  };
}, [fetchAds, getSeenIds, buildAdContext]);
```

**Also applies to:** Android `VideoFeedPage.android.tsx` (not yet fixed as of 2026-03-21).

---

### 16.2 travelProfile Race Condition (Web Only) — Apply Loading Guard

**What happened in Phase 1:** On web, Firebase Auth restores asynchronously. `useTravelPreferences` returned `null` on the first render because `userId` was null. The dedup key locked in `{gender, age}` before `travelProfile` resolved, and never refreshed it.

**Fix pattern — wrap `buildAdContext` and the dedup ref reset:**

```tsx
const { defaultProfile: travelProfile, loading: travelProfileLoading } = useTravelPreferences();

// Include travelProfileLoading in buildAdContext deps to force key change on resolution
const buildAdContext = useCallback(() => {
  if (travelProfileLoading) return undefined; // Don't fetch until travel profile is ready
  // ... rest of context building
}, [userProfile?.gender, userProfile?.dob, travelProfile?.activities, travelProfile?.travelStyle, travelProfileLoading]);

// Reset dedup key when loading transitions true → false
const prevTravelLoadingRef = useRef(true);
useEffect(() => {
  if (prevTravelLoadingRef.current && !travelProfileLoading) {
    lastAdContextKeyRef.current = '';
  }
  prevTravelLoadingRef.current = travelProfileLoading;
}, [travelProfileLoading]);
```

**iOS/Android:** This race does not occur on native (Auth restores synchronously from secure storage), but include the guard anyway for code consistency and to keep web working correctly.

---

### 16.3 `applySeenPenalty` — Use the Shared Helper, Don't Re-implement

**What happened in Phase 1:** The seen-campaign penalty was embedded inline in `scoreCampaign` with no unit test coverage. It was extracted into a named, testable export.

**Rule for Phase 2 & 3:** Import `applySeenPenalty` from `selectAds.ts` — do not re-implement the penalty logic per-placement. The function signature and invariant are:

```typescript
// In voyager-pwa/functions/src/selectAds.ts
export function applySeenPenalty(rawScore: number, seen: boolean): number {
  return seen ? rawScore - 5 : rawScore;
}
// Invariant: unseen score-0 (0) always beats seen max score (score 3 − 5 = −2)
```

When adding Phase 2/3 placements to `selectAds`, call `applySeenPenalty` in the same place (after raw targeting score is computed, before sorting).

---

### 16.4 Daily Budget Reset — Already Implemented, Just Deploy

**What happened in Phase 1:** `budgetType: 'daily'` existed in the data model from the start. No daily reset was implemented. Daily-budget campaigns were effectively lifetime-budget campaigns until `resetDailyBudgets` was written.

**Current state (2026-03-21):** `resetDailyBudgets` is fully implemented and tested in `voyager-pwa/functions/src/resetDailyBudgets.ts`. It runs at 00:05 UTC daily. **Deploy it before Phase 2 or Phase 3 launch** — do not wait until Phase 2 is complete.

```bash
firebase deploy --only functions:resetDailyBudgets --project mundo1-1
```

No code changes needed for Phase 2/3 — the function handles all `budgetType: 'daily'` campaigns regardless of placement.

---

### 16.5 Campaign Creation Duplicate — `createdCampaignRef` Pattern

**What happened in Phase 1:** When Mux processing failed and the advertiser retried, a second Firestore campaign document was created because `campaignRepository.create()` was called unconditionally at the top of `submit()`.

**Fix already in `useCreateCampaign.ts`:** `createdCampaignRef` caches the returned `{ id }` after the first `create()` call. Retry attempts skip `create()` entirely and jump to the Mux step.

**For Phase 2/3 campaign types** (e.g., new placement types, itinerary-feed-specific wizard): if a new `useCreate*Campaign.ts` hook is written, apply the same pattern from day one:

```tsx
const createdCampaignRef = useRef<{ id: string } | null>(null);

// In submit():
let campaign: { id: string };
if (createdCampaignRef.current) {
  campaign = createdCampaignRef.current;       // retry path
} else {
  campaign = await campaignRepository.create(data, uid);
  createdCampaignRef.current = campaign;       // cache for retry
}

// In reset():
createdCampaignRef.current = null;
```

---

### 16.6 Mux Timeout — 480s for All Video Campaigns

**What happened in Phase 1:** `waitForMuxProcessing` had a 90-second timeout. iPhone HDR videos take up to 9 minutes to transcode. Campaigns appeared without a `muxPlaybackUrl`, and retry produced a duplicate campaign (see 16.5).

**Current state:** Timeout is already 480s (8 min) in `voyager-RN/src/hooks/video/useVideoUpload.ts`. No changes needed for Phase 2/3 — this hook is shared.

**If a new video upload flow is written** for Phase 2/3: use the same `waitForMuxProcessing` helper rather than implementing a new timeout, and keep the 480s value.

---

### 16.7 CPM Billing Structure — Industry Standard, No Change Needed

**Discussion during Phase 1:** CPM campaigns receive ad clicks for "free" (clicks are logged but not billed). At $5 CPM and $0.50 CPC, the breakeven CTR is 1% (`$5 ÷ (1,000 × $0.50)`). Typical video feed CTR is 0.3–0.8%, meaning CPM advertisers pay more per click than CPC advertisers at these rates.

**Decision:** The CPM/CPC model is industry standard (Facebook, TikTok, Google all use the same structure). No rate adjustment was made. Revisit with real CTR data after 30 days in production if loophole abuse is detected.

**For Phase 2 (Itinerary Feed) and Phase 3 (AI Slot):** Use the same billing constants already defined in `logAdEvents.ts`. Do not change `CPM_RATE_CENTS` or `CPC_RATE_CENTS` without a product decision and cost analysis.

---

### 16.8 Phase 1 Verification Status (Test Suite)

All Phase 1 tests verified on `mundo1-dev` before Phase 2 begins:

| Test | Description | Status |
|------|-------------|--------|
| T1 | Ad appears in video feed | ✅ Verified |
| T2 | Age targeting scoring | ✅ Verified |
| T3 | Gender scoring + hard filter | ✅ Verified |
| T4 | Impression tracked in Firestore | ✅ Verified |
| T5 | Click tracked + `budgetCents` decremented | ✅ Verified |
| T6 | Seen-campaign deduplication | ✅ Verified |
| T7 | Budget exhaustion → auto-pause | ✅ Verified |
| T8 | Expired campaign filtered (`endDate < today`) | ✅ Verified |
| T9 | CPC billing E2E (click → 50¢ deduction → pause) | ✅ Verified 2026-03-21 — 1 billable click of 3 (24h dedup ✅), `budgetCents: 4949`, `spend: 51`, auto-paused at 0, ad filtered on reload |

**Test suite counts at Phase 1 close (2026-03-21):**
- `voyager-pwa/functions`: **572 passed** (24 suites)
- `voyager-RN`: **2402 passed**
- `voyager-ads`: **701 passed**

---

### 16.9 Pre-Start Checklist for Phase 2 & 3 Engineers

Before writing the first line of Itinerary Feed or AI Slot ad delivery code:

- [ ] Read sections 16.1–16.7 above
- [ ] Confirm `resetDailyBudgets` is deployed to production (`mundo1-1`)
- [ ] Apply `buildAdContext` + debounce pattern (§16.1) to the new page
- [ ] Apply travelProfile loading guard (§16.2) for web compatibility
- [ ] Import `applySeenPenalty` from `selectAds.ts` — do not re-implement (§16.3)
- [ ] If writing a new campaign creation hook, use `createdCampaignRef` pattern (§16.5)
- [ ] Confirm Android variant receives both race fix + debounce before Android ships
- [ ] Add unit tests for any new placement-specific scoring logic before opening PR
