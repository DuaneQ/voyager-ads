% TravalPass — Ads Requirements (Single Doc)

Status: **In Progress** — single source of truth for Ads PWA (ads.travalpass.com)

> **Last updated: 2026-03-02**  
> **Implementation tracking:** See [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) for full technical detail, file map, and a pending-work breakdown.
>
> Legend used in this document:
> - ✅ **Implemented** — code shipped, tests passing
> - 🔄 **Partial** — core built, some sub-features pending
> - ❌ **Not started** — planned, no code yet

---

1. Purpose ✅
- Build a self‑serve advertiser PWA (ads.travalpass.com) for local businesses and travel brands. The PWA will allow advertisers to create campaigns, upload creatives (images/videos), set targeting (location, itinerary destination, travel dates, demographics, behaviors), and pay via Stripe. Ads are delivered into the existing TravalPass apps (React Native mobile + web) in three placements: Video Feed, Itinerary Feed, and Promotion slots in AI Itinerary / Add Itinerary.
- **Status:** Advertiser PWA is live. Consumer-side delivery is implemented in voyager-RN (Video Feed + AI slot). Deployed to `mundo1-dev`; production deployment pending.

2. High Level Goals 🔄
- ✅ Monetize via predictable pricing for advertisers (CPM primary, CPC optional) — pricing tiers defined, Stripe prepay active.
- 🔄 Preserve end‑user experience and privacy, allow opt‑out and ad flagging — privacy UI and flagging not yet built.
- ✅ Reuse repo components (video upload, feeds, Cloud Functions, Stripe) — `CampaignAssetService` reuses storage patterns; Stripe Cloud Functions reused.

3. Scope (MVP) 🔄
- ✅ Advertiser PWA: account onboarding, campaign CRUD, creative upload, targeting, budget, Stripe prepay.
- 🔄 Backend: campaign store ✅, creatives store ✅, ad selection callable ✅, impression/click event ingestion ✅, reporting counters ✅ (FieldValue.increment on `daily_metrics`), VCR quartile events ❌.
- 🔄 Client changes: Video Feed ads ✅ (voyager-RN), AI Itinerary slot ✅ (voyager-RN), Itinerary Feed ads ❌ (not wired in consumer app yet).
- 🔄 Moderation: file type/size checks at upload ✅, manual admin review queue ✅; automated content policy checks ❌, user flagging UI ❌.

4. Placements & UX 🔄
- ✅ Video Feed ad preview exists in advertiser PWA (phone-frame `CampaignAdPreview` with HLS auto-play).
- ✅ Video Feed: ads rendered in voyager-RN consumer app. First ad at 5th slot (mixed-feed index 4, `FIRST_AD_AFTER=3`), then every 5 content items (`AD_INTERVAL=5`). HLS video via Mux; end-to-end verified on dev ("Winter Beach Escape" campaign). Web full-targeting context fix deployed pending app bundle rebuild.
- ❌ Itinerary Feed: promoted card rendering not yet implemented in consumer app (backend ready).
- ✅ AI Itinerary / Add Itinerary: promotion slot wired to `useAdDelivery` for `ai_slot` placement in voyager-RN.
- **UX rules (hard requirements):**
  - ❌ Ads must never block core flows (not enforced — no frequency-cap block on core navigation).
  - ✅ Frequency caps: 24h rolling cap per user×campaign in `useAdFrequency` (AsyncStorage).
  - ❌ "Sponsored" label always visible (delivery layer renders label but not audited).
  - ❌ User can flag ads (not built).
  - ❌ "Why am I seeing this?" (not built).

5. Targeting Dimensions 🔄
- ✅ Location (country / region / city) — targeting step in wizard
- ✅ Itinerary destination — `StepTargeting` includes destination field
- ✅ Travel dates — date range targeting in wizard
- 🔄 Demographics (age, gender) — UI exists in wizard, consent gating not enforced
- ❌ Behavioral signals (video engagement, recent searches) — no delivery layer

6. Monetization 🔄
- ✅ CPM / CPC model selection in campaign wizard.
- ✅ Stripe prepay: checkout and portal Cloud Functions integrated.
- ✅ Spend tracking: `logAdEvents` CF decrements `budgetCents` on billable events (impression for CPM, click for CPC) and auto-pauses campaigns when budget reaches zero.
- **Decision locked:** Prepay only (no postpay).

7. Key Metrics (must capture) 🔄
- ✅ Impressions — logged via `useAdTracking` (1s IAB viewability timer), flushed to `logAdEvents` CF. Increments `daily_metrics/{date}.impressions` and `totalImpressions` on campaign doc.
- ✅ Clicks — logged via `useAdTracking`, flushed to `logAdEvents` CF. Increments `daily_metrics/{date}.clicks` and `totalClicks` on campaign doc.
- 🔄 CTR, Spend, eCPM — spend tracking active; CTR and eCPM are derivable from `daily_metrics` but not surfaced in reporting UI yet.
- ❌ Video metrics (VCR 25/50/100%) — `logAdEvents` schema supports quartile events; `useAdTracking` does not yet emit them.

8. Creative Specs (MVP) ✅
- ✅ Image: JPG/PNG; 1:1 and 1.91:1; max 5 MB — enforced at upload in `StepCreative`.
- ✅ Video: MP4 (H.264), AAC; 9:16, 1:1, 16:9; ≤1080p; max 50 MB — enforced at upload.
- ✅ Text: Headline ≤60 chars, Body ≤125 chars, CTA from fixed set — validated in wizard.
- ✅ Mux transcodes uploaded video to HLS; `CampaignAdPreview` plays via hls.js (Chrome/FF/Edge), native HLS (Safari), or raw MP4 fallback.

9. Privacy, Consent & Compliance ❌
- ❌ App-level personalized ads toggle not built.
- ❌ Hashed identifiers in event logs — no event logs exist yet.
- ❌ Privacy Policy / TOS updates pending legal review.
- ❌ iOS ATT prompt not yet integrated.

10. Moderation & Abuse 🔄
- ✅ File type + size validation at upload.
- ✅ Manual admin review queue: `AdminPage` + `CampaignReviewCard` with phone-frame video preview, approve/reject.
- ❌ Automated content policy checks (explicit content, brand safety).
- ❌ User flagging from consumer apps.

11. Integration Points (reuse existing repo) 🔄
- ✅ Video upload + `CampaignAssetService` — Cloud Storage upload implemented.
- ✅ Mux pipeline — `processAdVideoWithMux` Cloud Function transcodes to HLS; `muxWebhook` writes playback URL back to Firestore. Bug fixes deployed to `mundo1-dev` 2026-03-02 (ownership check + default bucket).
- ✅ Video renderer in consumer feeds — integrated in voyager-RN Video Feed and AI slot.
- ✅ Stripe integration — prepay checkout + portal active.
- ✅ `selectAds` Cloud Function — implemented and deployed to `mundo1-dev`.
- ✅ `logAdEvents` Cloud Function — implemented and deployed to `mundo1-dev`.

12. Minimal Data Model (MVP) 🔄
- ✅ `ads_campaigns`: id, advertiserId, name, startTs, endTs, budgetCents, billingModel, placements[], targeting, status, priority + Mux fields (`muxAssetId`, `muxPlaybackId`, `muxPlaybackUrl`, `muxThumbnailUrl`, `muxStatus`, `muxError`, `assetStoragePath`).
- ❌ `ads_creatives`: separate collection not yet used; creative fields are embedded in the campaign document.
- ❌ `ads_events`: collection not yet created.

13. API Surface (high-level) 🔄
- ✅ Campaign CRUD — via `CampaignRepository` (Firestore direct).
- ✅ `processAdVideoWithMux` — httpsCallable: submit video for Mux transcoding.
- ✅ `createStripeCheckoutSession` / `createStripePortalSession` — Stripe prepay.
- ❌ `selectAd` — ad selection endpoint, not implemented.
- ❌ `logAdEvent` — impression/click ingestion, not implemented.
- ❌ Aggregated reporting endpoint — not implemented (UI reads Firestore directly).

14. Security & Anti‑Fraud 🔄
- ❌ Rate limiting on event ingestion — not yet server-enforced.
- ✅ Click deduplication — 24h client-side dedup in `useAdTracking` (1 billable click per user×campaign per 24h).
- ✅ Frequency caps — 24h rolling cap per user×campaign in `useAdFrequency` (AsyncStorage).
- ❌ Budget pacing — `logAdEvents` auto-pauses at zero budget but no daily smoothing.
- ❌ Anomaly detection (CTR spike flagging) — not implemented.
- ✅ Firestore security rules exist for `ads_campaigns` (advertiser-scoped read/write).
  - **Action needed:** Verify rules allow `selectAds` / `logAdEvents` service account writes.

15. Operational & Cost Considerations 🔄
- ✅ Creatives stored in Cloud Storage (`campaign-assets/{uid}/{filename}`).
- ✅ Mux handles CDN delivery of transcoded HLS video (no egress from Cloud Storage per view).
- ❌ BigQuery event streaming — deferred until event ingestion is built.
- **Reminder:** Mux billing is per minute of video stored + delivered. Monitor usage after pilot.

16. Deliverables & Next Steps (updated)
1. ✅ Advertiser PWA skeleton with auth, campaign CRUD, creative upload.
2. ✅ Mux video transcoding pipeline (Cloud Function + webhook). Bugs fixed 2026-03-02 (ownership check + default bucket); deployed to `mundo1-dev`.
3. ✅ Admin review flow with video preview.
4. ✅ `selectAds` + `logAdEvents` Cloud Functions — implemented, deployed to `mundo1-dev`.
5. ✅ Video Feed ad rendering in voyager-RN (first ad at slot 5 / mixed-feed index 4, every 5 after).
6. ✅ Impression + click logging + spend tracking (`logAdEvents` decrements `budgetCents`, auto-pauses).
7. ✅ Frequency caps (24h rolling, AsyncStorage).
8. 🔄 Deploy to production (`mundo1-1`) — all functions and app bundle.
9. 🔄 Apply web travelProfile race condition fix (app bundle rebuild/deploy).
10. 🔄 Wire Itinerary Feed ad rendering in consumer app.
11. 🔄 VCR quartile events in `useAdTracking`.
12. ❌ Pilot with 3–5 local advertisers; iterate on pricing.

17. Decisions (resolved + open)
- ✅ **Prepay only** — locked.
- ✅ **CPM + guarded CPC** — locked.
- ✅ **Web dashboard only** (advertiser PWA) — locked.
- ✅ **No auction** — locked.
- 🔄 **Placements UI** — full-width promoted itinerary vs inline native card — deferred to delivery implementation.
- 🔄 **Demographic targeting fields** — UI exists; consent enforcement/legal sign-off pending.

Document history
- Created: 2026-02-07
- Updated: 2026-02-07 — Added implementation status annotations; see IMPLEMENTATION_STATUS.md for full detail.
- Updated: 2026-03-02 — Reflected consumer-side delivery implementation: `selectAds`, `logAdEvents`, `useAdDelivery`, `useAdFrequency`, `useAdTracking`, VideoFeedPage ad interleaving, AI slot wiring. Mux pipeline bug fixes (`uid` ownership check, default bucket). Web travelProfile race condition fix. Test counts updated (626/2386).
