# TravalPass Ads — Implementation Status

> Last updated: 2026-03-02  
> Project: `voyager-ads` (React + TypeScript + Vite) + `voyager-RN` (Expo) + `voyager-pwa/functions` (Cloud Functions)  
> Test suite: **626 tests passing** (voyager-ads) · **2386 tests passing** (voyager-RN) | TypeScript: **clean (0 errors)** on all projects

---

## Table of Contents
1. [Architecture Overview](#1-architecture-overview)
2. [What Is Implemented](#2-what-is-implemented)
3. [Technical Implementation Details](#3-technical-implementation-details)
4. [File Map](#4-file-map)
5. [Test Coverage](#5-test-coverage)
6. [What Is Pending](#6-what-is-pending)
7. [Known Issues & Notes](#7-known-issues--notes)

---

## 1. Architecture Overview

```
advertiser browser (ads.travalpass.com)
  └── voyager-ads (Vite / React 18 + TypeScript)
        ├── CampaignWizard   → create new campaign
        ├── EditCampaignWizard → edit existing campaign
        ├── AdminPage        → review / approve / reject campaigns
        └── CampaignDetailPage → per-campaign KPIs + ad preview

voyager-pwa/functions (Cloud Functions v2 — Node 18)
  ├── processAdVideoWithMux(campaignId, storagePath) → callable
  ├── muxWebhook → receives Mux lifecycle events, routes to ads_campaigns
  ├── createStripeCheckoutSession / createStripePortalSession
  └── (existing) generateItineraryWithAI, searchFlights, searchAccommodations …

Firebase (shared dev + prod)
  ├── Firestore: ads_campaigns, ads_events, ads_creatives (planned)
  └── Cloud Storage: campaign-assets/{uid}/{filename}

Mux (video transcoding + HLS CDN)
  ├── Asset created from Cloud Storage URL
  ├── Transcodes to HLS (adaptive bitrate)
  └── Webhook notifies muxWebhook CF on ready / errored

voyager-RN (Expo — iOS + Android)
  └── useVideoUpload → waitForMuxProcessing (onSnapshot listener)
```

### Advertiser Campaign Lifecycle

```
1. Advertiser uploads creative (image or video) via StepCreative
       ↓ CampaignAssetService.upload() → Cloud Storage
2. Campaign document written to Firestore (ads_campaigns)
       ↓ useCreateCampaign / useEditCampaign
3. processAdVideoWithMux callable fired (async, non-blocking)
       ↓ Cloud Function calls Mux API → creates asset from storage URL
4. Mux transcodes → fires webhook to muxWebhook CF
       ↓ Writes muxPlaybackUrl, muxPlaybackId, muxStatus = 'ready' to campaign doc
5. CampaignAdPreview picks up muxPlaybackUrl → plays HLS stream in phone frame
```

---

## 2. What Is Implemented

### ✅ Advertiser PWA (voyager-ads)

| Area | Status | Notes |
|------|--------|-------|
| Firebase project setup | ✅ Done | `src/config/firebaseConfig.ts` — auth, firestore, storage, functions all exported |
| Authentication (email + Google) | ✅ Done | `AuthService`, `authStore`, `SignInPage` |
| Campaign create wizard | ✅ Done | 5-step: Details → Targeting → Creative → Budget → Review |
| Campaign edit wizard | ✅ Done | `EditCampaignWizard` — same steps, pre-populated from Firestore |
| Campaign list / dashboard | ✅ Done | `DashboardPage`, `CampaignTable`, summary cards |
| Campaign detail page | ✅ Done | KPI chips, performance chart, **"Your Ad" preview section** |
| Creative upload (image + video) | ✅ Done | `CampaignAssetService` — uploads to Cloud Storage, returns `storageUrl` |
| Mux video processing trigger | ✅ Done | `processAdVideoWithMux` called after campaign create/edit when video present |
| HLS video playback | ✅ Done | `CampaignAdPreview` — hls.js (Chrome/FF/Edge), native (Safari), raw fallback |
| Phone-frame video preview | ✅ Done | `VideoFeedPreview` inner component with mute toggle overlay |
| Mute/unmute toggle (TikTok-style) | ✅ Done | Speaker icon overlay, top-left corner of phone frame |
| Auto-play + loop | ✅ Done | `video.muted = true; video.loop = true; video.play()` on all HLS branches |
| Image ad preview | ✅ Done | Static `<img>` in phone frame for image creatives |
| Itinerary feed ad preview | ✅ Done | `ItineraryFeedAdPreview` component |
| Admin review queue | ✅ Done | `AdminPage` + `CampaignReviewCard` — approve/reject with phone-frame preview |
| Admin video preview | ✅ Done | `CampaignAdPreview maxWidth={360}` in admin card (expandable on review) |
| Edit wizard video preview | ✅ Done | `StepReview` shows existing video at `maxWidth={280}` |
| User ad preview on detail page | ✅ Done | "Your Ad" section in `CampaignDetailPage` at `maxWidth={300}` |
| Mux status messaging | ✅ Done | "Video is being processed" / error message shown in detail page |
| Stripe prepay (checkout + portal) | ✅ Done | `billingStore` + Cloud Functions calls |
| Pricing page | ✅ Done | `PricingPage` with tier cards |
| Targeting step | ✅ Done | Location (country/region/city), date range, placement selection |
| Campaign status management | ✅ Done | `CampaignStatusChip`, status transitions in `CampaignRepository` |
| Reporting UI | ✅ Done | `CampaignDetailPage` — KPIs + `MetricsChart` (daily aggregates) |

### ✅ Mux Pipeline (voyager-pwa/functions)

| Area | Status | Notes |
|------|--------|-------|
| `processAdVideoWithMux` callable | ✅ Done | Creates Mux asset from storage signed URL; writes initial status |
| `muxWebhook` routing for ads | ✅ Done | Routes `video.asset.ready` / `video.asset.errored` to `ads_campaigns` doc |
| Mux fields on campaign doc | ✅ Done | `muxAssetId`, `muxPlaybackId`, `muxPlaybackUrl`, `muxThumbnailUrl`, `muxStatus`, `muxError`, `assetStoragePath` |
| **Ownership check fix** | ✅ Fixed 2026-03-02 | Changed `advertiserId` → `uid` — Firestore stores the campaign owner as `uid`, not `advertiserId`. Was causing HTTP 500 `Unauthorized: caller does not own this campaign` for all new ad uploads. |
| **Bucket fix** | ✅ Fixed 2026-03-02 | Changed `admin.storage().bucket("mundo1-1.appspot.com")` → `admin.storage().bucket()` — hardcoded prod bucket caused signed-URL failures on dev environment. Now uses the project's default bucket in both envs. |
| **Deployed to `mundo1-dev`** | ✅ 2026-03-02 | Both fixes deployed. Pipeline verified end-to-end: `video.asset.created` → `video.asset.ready` → `Updated ads_campaigns/{id} with playback URL`. New "Winter Beach Escape" campaign confirmed playing via `https://stream.mux.com/*.m3u8`. |

### ✅ voyager-RN (mobile) — Advertiser Tools

| Area | Status | Notes |
|------|--------|-------|
| `waitForMuxProcessing` in `useVideoUpload` | ✅ Done | Single `onSnapshot` listener; self-cancels when status = `ready` or `errored`; 90-second hard timeout |

### ✅ voyager-RN (mobile) — Consumer Ad Delivery

| Area | Status | Notes |
|------|--------|-------|
| `selectAds` Cloud Function | ✅ Done | `voyager-pwa/functions/src/selectAds.ts` — queries `ads_campaigns` for active campaigns matching placement + dates + budget. Scores by targeting match (destination, gender, age, activity prefs, travel styles, trip types). Returns ranked `AdUnit[]`. |
| `logAdEvents` Cloud Function | ✅ Done | `voyager-pwa/functions/src/logAdEvents.ts` — ingests batched impression/click events. Increments `daily_metrics/{YYYY-MM-DD}`, increments `totalImpressions`/`totalClicks` on campaign doc, decrements `budgetCents`. Auto-pauses campaign when budget exhausted. |
| `useAdDelivery` hook | ✅ Done | `src/hooks/ads/useAdDelivery.ts` — calls `selectAds` on feed load with user context. Returns `AdUnit[]` for the given placement. Deduplicates fetches via context-key memoization. |
| `useAdFrequency` hook | ✅ Done | `src/hooks/ads/useAdFrequency.ts` — `FIRST_AD_AFTER = 3`, `AD_INTERVAL = 5`. Produces mixed content+ad array; first ad appears at mixed-feed index 4 (5th slot overall), then every 5 content items. 24h AsyncStorage frequency cap per user×campaign. |
| `useAdTracking` hook | ✅ Done | `src/hooks/ads/useAdTracking.ts` — 1s IAB viewability timer, buffers impression/click events in memory, flushes batch to `logAdEvents` every 30s or on unmount. Exposes `getSeenCampaignIds()` for cross-session deduplication. |
| VideoFeedPage ad interleaving | ✅ Done | `src/pages/VideoFeedPage.tsx` — splices ads at index 4, 9, 14… in video feed. Renders `AdCard` component with `VideoAd` component wired to tracking hooks. |
| AIItineraryDisplay promotions wiring | ✅ Done | Promotion slots in AI Itinerary detail wired to `useAdDelivery` for `ai_slot` placement. |
| Web travelProfile race condition fix | ✅ Done 2026-03-02 | On web, Firebase Auth restores the session asynchronously — `currentUser` is null on first render, so `travelProfile` stays null and the dedup key locks in an incomplete `{gender, age}` context. Fix: exposes `loading` from `useTravelPreferences`, adds `travelProfileLoading` to `buildAdContext` deps, and resets `lastAdContextKeyRef` when loading transitions `true → false`. Code verified (TS clean, 4/4 tests pass). **Not yet deployed as app bundle.** |

---

## 3. Technical Implementation Details

### 3.1 Mux Video Processing (Cloud Functions)

**File:** `voyager-pwa/functions/src/muxVideoProcessing.ts`

The `processAdVideoWithMux` callable:
1. Receives `{ campaignId, storagePath }` from the advertiser.
2. Verifies the caller owns the campaign by checking `campaignSnap.data().uid === request.auth.uid` (**Note:** the ownership field is `uid`, not `advertiserId` — bug fixed 2026-03-02).  
3. Generates a short-lived signed URL for the project's **default** Cloud Storage bucket (`admin.storage().bucket()` — bucket fix 2026-03-02 removed a hardcoded prod bucket name that broke dev).
4. Creates a Mux asset via the Mux API, passing the signed URL as `input`.
5. Writes `muxAssetId`, `muxStatus: 'preparing'` to `ads_campaigns/{campaignId}`.

The `muxWebhook` HTTP function:
- Validates the Mux webhook signature.
- On `video.asset.ready`: writes `muxPlaybackId`, `muxPlaybackUrl`, `muxThumbnailUrl`, `muxStatus: 'ready'` to the campaign doc.
- On `video.asset.errored`: writes `muxStatus: 'errored'`, `muxError: event.data.errors`.
- Routes based on `event.data.passthrough` or metadata to distinguish user-content vs ad-content assets.

### 3.2 HLS Playback Stack (CampaignAdPreview)

**File:** `src/components/campaign/CampaignAdPreview.tsx`

`VideoFeedPreview` uses a `useEffect` with this priority order:
```
1. muxPlaybackUrl present AND Hls.isSupported()
   → Attach hls.js, load HLS manifest, then play()
2. muxPlaybackUrl present AND video.canPlayType('application/vnd.apple.mpegurl')
   → Set .src directly (Safari native HLS), then play()
3. assetUrl present (raw MP4 fallback)
   → Set .src directly, then play()
```

All three branches set:
```ts
video.muted = true;
video.loop = true;
video.play().catch(() => {});   // catch silences autoplay-policy errors
```

**Props:**
```ts
interface Props {
  assetUrl?: string;
  muxPlaybackUrl?: string;
  assetType?: 'image' | 'video_feed' | 'video_story';
  headline?: string;
  body?: string;
  cta?: string;
  maxWidth?: number;  // default: 200; admin uses 360, edit uses 280, detail uses 300
}
```

**Mute toggle:** A MUI `IconButton` in the top-left corner of the phone frame overlays `VolumeOffIcon` / `VolumeUpIcon`. Toggling sets `video.muted` directly on the `<video>` element via a `videoRef`.

### 3.3 useCreateCampaign / useEditCampaign Hooks

**Files:** `src/hooks/useCreateCampaign.ts`, `src/hooks/useEditCampaign.ts`

After persisting the campaign document to Firestore:
1. If the creative is a video AND `storagePath` is available, call:
   ```ts
   const fn = httpsCallable(functions, 'processAdVideoWithMux');
   await fn({ campaignId, storagePath });
   ```
2. This call is made **non-blocking** (no await at the UI layer) so the wizard completes immediately.
3. `muxStatus` updates arrive asynchronously via Firestore `onSnapshot` in the campaign store.

### 3.4 waitForMuxProcessing (voyager-RN)

**File:** `voyager-RN/src/hooks/video/useVideoUpload.ts`

```ts
waitForMuxProcessing(campaignId: string): Promise<void>
```
- Opens a single `onSnapshot` listener on `ads_campaigns/{campaignId}`.
- Resolves when `muxStatus === 'ready'` or rejects when `muxStatus === 'errored'`.
- Hard 90-second timeout prevents indefinite waiting.
- Unsubscribes the listener on all exit paths (ready, errored, timeout).

### 3.5 Admin Approval Flow

**Files:** `src/pages/AdminPage.tsx`, `src/components/admin/CampaignReviewCard.tsx`

- Admin sees all campaigns with `status: 'pending_review'`.
- Each `CampaignReviewCard` is collapsed by default; expanding reveals:
  - Campaign metadata (type, budget, targeting, dates).
  - `CampaignAdPreview` at `maxWidth={360}` — full phone-frame preview with mute toggle.
  - Approve / Reject buttons with optional rejection reason.
- Approval changes status to `'active'`; rejection changes to `'rejected'`.

### 3.6 CampaignDetailPage "Your Ad" Section

**File:** `src/pages/CampaignDetailPage.tsx`

Rendered between the header chips row and the metrics divider:
```tsx
{(campaign.assetUrl || campaign.muxPlaybackUrl) && (
  <Box>
    <Typography variant="h6">Your Ad</Typography>
    <CampaignAdPreview
      assetUrl={campaign.assetUrl ?? undefined}
      muxPlaybackUrl={campaign.muxPlaybackUrl ?? undefined}
      assetType={campaign.assetType}
      headline={campaign.headline}
      body={campaign.body}
      cta={campaign.cta}
      maxWidth={300}
    />
    {/* muxStatus messages when processing/errored */}
  </Box>
)}
```

### 3.7 Test Infrastructure

- **`vitest.setup.ts`**: Global jsdom stubs for `HTMLMediaElement.prototype.play` (returns `Promise.resolve()`), `.pause()`, `.load()` — prevents "Not implemented" errors in any test rendering `<video>`.
- **hls.js mock pattern**: Uses `vi.hoisted()` to ensure mock variables are hoisted before imports:
  ```ts
  const { mockHlsInstance, MockHls } = vi.hoisted(() => { … });
  vi.mock('hls.js', () => ({ default: MockHls }));
  ```
- **CampaignAdPreview test file** covers: image render, HLS via hls.js, Safari native HLS, raw MP4 fallback, mute toggle visibility.

---

## 4. File Map

### voyager-ads

```
src/
├── config/
│   └── firebaseConfig.ts          auth, firestore, storage, functions exports
├── types/
│   └── campaign.ts                CampaignData interface (incl. all Mux fields)
├── repositories/
│   └── CampaignRepository.ts      Firestore CRUD for ads_campaigns
├── services/
│   ├── auth/AuthService.ts
│   ├── admin/AdminService.ts      approve / reject helpers
│   └── campaign/CampaignAssetService.ts  Cloud Storage upload
├── hooks/
│   ├── useCreateCampaign.ts       create + processAdVideoWithMux trigger
│   ├── useEditCampaign.ts         edit + processAdVideoWithMux trigger
│   ├── useCampaigns.ts            real-time campaign list listener
│   ├── useCampaignMetrics.ts      single campaign KPI fetcher
│   └── useMultiCampaignMetrics.ts dashboard aggregate metrics
├── store/
│   ├── authStore.ts               Zustand — user session
│   ├── campaignStore.ts           Zustand — campaign list + real-time listener
│   └── billingStore.ts            Zustand — Stripe billing state
├── components/
│   ├── campaign/
│   │   ├── CampaignAdPreview.tsx  ← HLS + phone frame + mute toggle (CORE)
│   │   ├── CampaignWizard.tsx     5-step create flow
│   │   ├── EditCampaignWizard.tsx edit flow
│   │   ├── StepCreative.tsx       file upload step
│   │   ├── StepReview.tsx         final review (passes asset URLs to preview)
│   │   ├── StepDetails.tsx
│   │   ├── StepTargeting.tsx
│   │   ├── StepBudget.tsx
│   │   ├── ItineraryFeedAdPreview.tsx
│   │   └── AdvertisingPolicyModal.tsx
│   ├── admin/
│   │   └── CampaignReviewCard.tsx ← admin review with 360px phone frame
│   ├── common/
│   │   ├── HlsVideoPlayer.tsx     generic <video controls> for HLS (currently unused)
│   │   ├── Nav.tsx
│   │   ├── Modal.tsx
│   │   ├── AdminRoute.tsx
│   │   ├── ProtectedRoute.tsx
│   │   ├── DestinationAutocomplete.tsx
│   │   ├── ErrorBoundary.tsx
│   │   └── ResponsiveImage.tsx
│   ├── dashboard/
│   │   ├── CampaignTable.tsx
│   │   ├── CampaignMetricsKPIs.tsx
│   │   ├── CampaignSummaryCards.tsx
│   │   ├── CampaignStatusChip.tsx
│   │   └── MetricsChart.tsx
│   └── landing/
│       ├── Carousel.tsx
│       ├── Hero.tsx
│       ├── HeadlineList.tsx
│       ├── RotatingHeadline.tsx
│       ├── LandingQuestions.tsx
│       └── products/Products.tsx
├── pages/
│   ├── AdminPage.tsx
│   ├── CampaignDetailPage.tsx     ← "Your Ad" section added
│   ├── CreateCampaignPage.tsx
│   ├── DashboardPage.tsx
│   ├── EditCampaignPage.tsx
│   ├── Landing.tsx
│   ├── PricingPage.tsx
│   ├── ProductsPage.tsx
│   ├── SignInPage.tsx
│   └── TermsOfServicePage.tsx
└── utils/
    ├── dateUtils.ts
    ├── locationUtils.ts
    └── wizardUtils.ts
```

### voyager-pwa/functions (relevant files)

```
src/
├── muxVideoProcessing.ts   processAdVideoWithMux callable + muxWebhook HTTP fn
├── selectAds.ts            selectAds onCall — ad selection + targeting score
├── logAdEvents.ts          logAdEvents onCall — impression/click ingestion, budget decrement, auto-pause
├── adTypes.ts              Shared types: AdUnit, SelectAdsRequest/Response, LogAdEventsRequest/Response
└── index.ts                Function exports
```

### voyager-RN (relevant files)

```
src/
├── hooks/
│   ├── ads/
│   │   ├── useAdDelivery.ts     calls selectAds, returns AdUnit[] per placement
│   │   ├── useAdFrequency.ts    mixed-feed interleaving (FIRST_AD_AFTER=3, AD_INTERVAL=5)
│   │   ├── useAdTracking.ts     IAB viewability + batched event flush to logAdEvents
│   │   └── index.ts
│   └── video/
│       └── useVideoUpload.ts    waitForMuxProcessing helper
└── pages/
    └── VideoFeedPage.tsx        ad splicing + AdCard rendering; web travelProfile race fix (2026-03-02)
```

---

## 5. Test Coverage

| File | Stmts | Branch | Funcs | Lines |
|------|-------|--------|-------|-------|
| `CampaignAdPreview.tsx` | 100 | 94.54 | 80 | 100 |
| `CampaignDetailPage.tsx` | covered | covered | covered | covered |
| `CampaignReviewCard.tsx` | covered | covered | covered | covered |
| `useCreateCampaign.ts` | covered | covered | covered | covered |
| `useEditCampaign.ts` | covered | covered | covered | covered |

**Total test count (voyager-ads):** 626 passing, 0 failing.  
**Total test count (voyager-RN):** 2386 passing across 143 suites, 0 failing.

**Key test patterns:**
- `vi.hoisted()` used for hls.js mock to avoid temporal dead-zone errors
- `vitest.setup.ts` supplies global `HTMLMediaElement.prototype.play/pause/load` stubs
- `CampaignAdPreview` mock (`vi.mock`) used in page-level tests that import it
- `useAdTracking` mock in voyager-RN must include `getSeenCampaignIds: () => []` (added 2026-03-02 to fix 4 failing tests)
- E2e campaign wizard tests must call `wizard.fillLandingUrl()` in the Creative step — `landingUrl` is required for step validation

---

## 6. What Is Pending

### High Priority (blocking production launch)

| Item | Details |
|------|---------|
| **Deploy Cloud Functions to production** | `selectAds`, `logAdEvents`, `processAdVideoWithMux` (ownership + bucket fixes), and updated `muxWebhook` routing have been deployed to `mundo1-dev` ✅. Production deployment (`mundo1-1`) still required before ads are live for real users. Run `firebase deploy --only functions --project mundo1-1` from `voyager-pwa/functions/`. |
| **Deploy voyager-RN app bundle (web travelProfile fix)** | `VideoFeedPage.tsx` race condition fix (2026-03-02) is code-complete and tested but not yet deployed. Rebuild/reload the web hosting bundle to activate. |
| **Firestore security rules audit** | Verify `ads_campaigns` rules allow `logAdEvents` / `selectAds` service-account writes, and restrict advertiser reads to own docs. |

### Medium Priority (product completeness)

| Item | Details |
|------|---------|
| **Android `VideoFeedPage.android.tsx` — travelProfile race** | The web fix (2026-03-02) was not applied to the Android variant. Likely has the same `lastAdContextKeyRef` dedup race. Needs review and the same `loading: true → false` reset before Android ad targeting is reliable. |
| **Video metrics (VCR quartiles)** | `useAdTracking` logs impressions and clicks. VCR quartile events (25/50/75/100% watch completion) are not yet emitted client-side. `logAdEvents` schema already supports them. |
| **Itinerary Feed ad rendering** | `selectAds` + `logAdEvents` are implemented and deployed to dev. Itinerary Feed placement UI in voyager-RN not yet wired. |
| **Budget pacing** | `logAdEvents` decrements `budgetCents` and auto-pauses at zero but no daily smoothing — campaigns can spend their full budget in a burst. |
| **CSV export for reporting** | PRD requires CSV export of daily aggregates from `CampaignDetailPage`. Not yet implemented. |
| **Anomaly detection / anti-fraud** | Client-side 24h click dedup exists in `useAdTracking`. Server-side CTR spike detection / automated campaign suspension not implemented. |
| **`HlsVideoPlayer.tsx` cleanup** | `src/components/common/HlsVideoPlayer.tsx` is unused. Safely deletable unless a video lightbox use case arises. |

### Lower Priority (pre-pilot)

| Item | Details |
|------|---------|
| **"Why am I seeing this?" explanation** | Required by PRD §4 (UX hard requirements). A simple dialog explaining targeting criteria. |
| **User ad flagging** | Consumer apps need a "Flag this ad" option. Flagged items appear in admin moderation queue. |
| **Privacy/consent UI** | Personalized ads opt-out toggle in user profile. |
| **Demographic targeting consent enforcement** | Age/gender targeting UI exists in wizard but ATT/consent gating not enforced client-side. |
| **BigQuery event streaming** | High-volume event logging currently writes directly to Firestore. Should stream to BigQuery for analytics and billing reconciliation at scale. |
| **Automated creative moderation** | File type/size checks exist at upload; content policy checks (e.g., explicit content detection) not yet in place. |
| **iOS ATT compliance** | App Tracking Transparency prompt needed before serving personalized ads on iOS 14.5+. |
| **App Store / Play Store policy review** | Required before ads go live in production mobile apps. |

---

## 7. Known Issues & Notes

### ✅ RESOLVED 2026-03-02 — `processAdVideoWithMux` HTTP 500 Unauthorized
Symptomatic error: `Error: Unauthorized: caller does not own this campaign` for all new ad uploads. Root cause: ownership check used `campaignSnap.data()?.advertiserId` but Firestore stores the owner as `uid`. Fixed by changing to `campaignSnap.data()?.uid`. Deployed to `mundo1-dev`.

### ✅ RESOLVED 2026-03-02 — Mux signed URL failing on dev
`processAdVideoWithMux` had `admin.storage().bucket("mundo1-1.appspot.com")` hardcoded. Dev function uses a different default bucket, causing signed-URL generation to fail. Fixed by changing to `admin.storage().bucket()` (project's default). Deployed to `mundo1-dev`.

### ✅ RESOLVED 2026-03-02 — Mux pipeline verified end-to-end
After both fixes above: Cloud logs confirmed `video.asset.created` → `video.asset.ready` → `Updated ads_campaigns/{id} with playback URL`. Simulator confirmed new "Winter Beach Escape" video ad playing via HLS stream (`stream.mux.com/*.m3u8`).

### ✅ RESOLVED 2026-03-02 — Web sending incomplete targeting context
On web, Firebase Auth restores the auth session asynchronously. `useTravelPreferences` returns early when `userId` is null on first render, leaving `travelProfile = null`. The ad context dedup guard (`lastAdContextKeyRef`) then locked in an incomplete `{gender, age}` key, blocking re-fetch when the travel profile later resolved. **Fix:** `VideoFeedPage.tsx` now exposes `loading` from `useTravelPreferences`, includes `travelProfileLoading` in `buildAdContext` deps, and resets the dedup key when loading transitions `true → false`. Code-complete and tested. **Pending app bundle deploy.**

### ✅ RESOLVED 2026-03-02 — Ad slot at wrong position (showed at index 5 instead of 4)
`FIRST_AD_AFTER` was `4`, which placed the first ad at mixed-feed index 5 (6th slot). Changed to `3` so the first ad appears at mixed-feed index 4 (5th slot overall): `c c c c AD c c c c c AD …`. All 17 `useAdFrequency` tests updated and passing.

### ⚠️ OPEN — Android `VideoFeedPage.android.tsx` — same race condition unverified
The web travelProfile race fix was applied to `VideoFeedPage.tsx`. The Android-specific `VideoFeedPage.android.tsx` uses the same `useTravelPreferences` hook and likely has the same `lastAdContextKeyRef` dedup pattern. Needs review and the same fix before Android ad targeting is reliable.

### ⚠️ OPEN — `HlsVideoPlayer.tsx` — Unused File
`src/components/common/HlsVideoPlayer.tsx` was superseded by the phone-frame approach. Safely deletable unless a video lightbox use case arises.

### Raw MP4 Auto-play
The `else` branch (raw MP4 fallback) previously failed to call `play()` after setting `video.src`. Fixed — all three branches now call `play()`. Tests verify this.
