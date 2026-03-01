# TravalPass Ads — Implementation Status

> Last updated: 2026-02-07  
> Project: `voyager-ads` (React + TypeScript + Vite) + `voyager-RN` (Expo) + `voyager-pwa/functions` (Cloud Functions)  
> Test suite: **622 tests passing** | TypeScript: **clean (0 errors)** on both projects

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

### ✅ voyager-RN (mobile)

| Area | Status | Notes |
|------|--------|-------|
| `waitForMuxProcessing` in `useVideoUpload` | ✅ Done | Single `onSnapshot` listener; self-cancels when status = `ready` or `errored`; 90-second hard timeout |

---

## 3. Technical Implementation Details

### 3.1 Mux Video Processing (Cloud Functions)

**File:** `voyager-pwa/functions/src/muxVideoProcessing.ts`

The `processAdVideoWithMux` callable:
1. Receives `{ campaignId, storagePath }` from the advertiser.
2. Generates a short-lived signed URL for the Cloud Storage object.
3. Creates a Mux asset via the Mux API, passing the signed URL as `input`.
4. Writes `muxAssetId`, `muxStatus: 'preparing'` to `ads_campaigns/{campaignId}`.

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
└── muxVideoProcessing.ts   processAdVideoWithMux callable + muxWebhook HTTP fn
lib/
├── index.js               Function exports (includes processAdVideoWithMux, muxWebhook)
├── muxVideoProcessing.js  Compiled output
└── …
```

### voyager-RN (relevant files)

```
src/hooks/video/
└── useVideoUpload.ts       waitForMuxProcessing helper
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

**Total test count:** 622 passing, 0 failing.

**Key test patterns:**
- `vi.hoisted()` used for hls.js mock to avoid temporal dead-zone errors
- `vitest.setup.ts` supplies global `HTMLMediaElement.prototype.play/pause/load` stubs
- `CampaignAdPreview` mock (`vi.mock`) used in page-level tests that import it

---

## 6. What Is Pending

### High Priority (blocking production launch)

| Item | Details |
|------|---------|
| **Deploy Cloud Functions** | `processAdVideoWithMux` and updated `muxWebhook` routing have not been deployed to production. Run `firebase deploy --only functions` from `voyager-pwa/functions/`. |
| **Register Mux webhook URL** | The `muxWebhook` Cloud Function URL must be registered in the Mux dashboard under **Settings → Webhooks**. Use the production URL: `https://<region>-<project>.cloudfunctions.net/muxWebhook`. |
| **Firestore security rules** | Verify `ads_campaigns` rules allow the Cloud Function service account to write Mux fields (`muxPlaybackUrl`, `muxStatus`, etc.). Advertisers should only be able to read their own campaign docs. |

### Medium Priority (product completeness)

| Item | Details |
|------|---------|
| **Ad selection / delivery** | `selectAd` callable endpoint (server-side ad selection) not yet implemented. voyager-RN and voyager-pwa need to call this to retrieve and render ads in the Video Feed, Itinerary Feed, and AI Itinerary slots. See §4 of `ADS_REQUIREMENTS.md`. |
| **Impression / click event ingestion** | `POST /events` endpoint not implemented. No impression or click logging exists yet. Required for billing and reporting. |
| **Billing accuracy** | Stripe prepay checkout exists. But spend tracking (decrementing `budgetCents` on billable events) is not implemented — depends on event ingestion. |
| **CSV export for reporting** | PRD requires CSV export of daily aggregates. Not yet implemented. |
| **Video metrics** | VCR (25/50/100% watch completion), video start events not logged. Requires event ingestion infrastructure. |
| **Frequency caps** | No enforcement layer exists. Needed before serving ads to real users. |
| **Budget pacing** | No pacing logic implemented. Campaigns could potentially overspend. |
| **Anomaly detection / anti-fraud** | No click dedup or CTR spike detection. Needed before production traffic. |
| **`HlsVideoPlayer.tsx` cleanup** | `src/components/common/HlsVideoPlayer.tsx` was created but is no longer actively used (phone-frame approach replaced it). Either delete it or find a use case (e.g., a dedicated video lightbox). |

### Lower Priority (pre-pilot)

| Item | Details |
|------|---------|
| **Client-side ad rendering (voyager-RN)** | The mobile app needs to render ads in the Video Feed and other placements. Requires `selectAd` endpoint first. |
| **Client-side ad rendering (voyager-pwa)** | Same for the consumer PWA. |
| **"Why am I seeing this?" explanation** | Required by PRD §4 (UX hard requirements). A simple dialog explaining targeting criteria. |
| **User ad flagging** | Consumer apps need a "Flag this ad" option. Flagged items appear in admin moderation queue. |
| **Privacy/consent UI** | Personalized ads opt-out toggle in user profile. |
| **Demographic targeting enforcement** | Age/gender targeting UI exists in wizard but consent gating not enforced. |
| **BigQuery event streaming** | High-volume event logging should stream to BigQuery rather than Firestore for analytics and billing reconciliation. |
| **Automated creative moderation** | File type/size checks exist at upload; content policy checks (e.g., explicit content detection) not yet in place. |
| **iOS ATT compliance** | App Tracking Transparency prompt needed before serving personalized ads on iOS. |
| **App Store / Play Store policy review** | Required before ads are live in mobile apps. |

---

## 7. Known Issues & Notes

### `HlsVideoPlayer.tsx` — Unused File
`src/components/common/HlsVideoPlayer.tsx` was created as a generic `<video controls>` HLS player but was superseded by the phone-frame approach (inline auto-play, no controls bar). It can be safely deleted unless a use case arises (e.g., a standalone video lightbox for admin review of full-resolution assets).

### Dual-version Content in `AD_PRODUCT_PRD.md`
The PRD file contains two merged drafts (the original spec and a revised version). The content is not duplicated per-section but two separate documents appear to be concatenated. It should be cleaned up into a single authoritative version.

### Cloud Function Deployment Gap
All Mux-related Cloud Function code (`processAdVideoWithMux`, `muxWebhook` ad routing) is written and tested locally but **not deployed**. The advertiser PWA will silently fail to transcode videos until this is deployed.

### Mux Webhook Not Registered
Even after deploying the function, the Mux dashboard webhook pointing to `muxWebhook` must be manually configured. Without it, `muxStatus` will stay `'preparing'` indefinitely.

### Raw MP4 Auto-play
The `else` branch (raw MP4 fallback) previously failed to call `play()` after setting `video.src`. This was fixed — all three branches now call `play()`. Tests verify this.
