% TravalPass — Ads Requirements (Single Doc)

Status: **In Progress** — single source of truth for Ads PWA (ads.travalpass.com)

> **Implementation tracking:** See [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) for full technical detail, file map, and a pending-work breakdown.
>
> Legend used in this document:
> - ✅ **Implemented** — code shipped, tests passing
> - 🔄 **Partial** — core built, some sub-features pending
> - ❌ **Not started** — planned, no code yet

---

1. Purpose ✅
- Build a self‑serve advertiser PWA (ads.travalpass.com) for local businesses and travel brands. The PWA will allow advertisers to create campaigns, upload creatives (images/videos), set targeting (location, itinerary destination, travel dates, demographics, behaviors), and pay via Stripe. Ads are delivered into the existing TravalPass apps (React Native mobile + web) in three placements: Video Feed, Itinerary Feed, and Promotion slots in AI Itinerary / Add Itinerary.
- **Status:** Advertiser PWA is live. Consumer-side delivery (rendering ads in the TravalPass apps) is not yet implemented.

2. High Level Goals 🔄
- ✅ Monetize via predictable pricing for advertisers (CPM primary, CPC optional) — pricing tiers defined, Stripe prepay active.
- 🔄 Preserve end‑user experience and privacy, allow opt‑out and ad flagging — privacy UI and flagging not yet built.
- ✅ Reuse repo components (video upload, feeds, Cloud Functions, Stripe) — `CampaignAssetService` reuses storage patterns; Stripe Cloud Functions reused.

3. Scope (MVP) 🔄
- ✅ Advertiser PWA: account onboarding, campaign CRUD, creative upload, targeting, budget, Stripe prepay.
- 🔄 Backend: campaign store ✅, creatives store ✅, ad selection callable ❌, impression/click event ingestion ❌, reporting counters ❌.
- ❌ Client changes: render ads in Video Feed, Itinerary Feed, AI Itinerary/ Add Itinerary slots (not started — requires `selectAd` endpoint).
- 🔄 Moderation: file type/size checks at upload ✅, manual admin review queue ✅; automated content policy checks ❌, user flagging UI ❌.

4. Placements & UX 🔄
- ✅ Video Feed ad preview exists in advertiser PWA (phone-frame `CampaignAdPreview` with HLS auto-play).
- ❌ Video Feed: not yet rendered in consumer apps (voyager-RN / voyager-pwa).
- ❌ Itinerary Feed: promoted card rendering not yet implemented.
- ❌ AI Itinerary / Add Itinerary: promotion slot not yet implemented.
- **UX rules (hard requirements):**
  - ❌ Ads must never block core flows (not enforced — delivery layer not built).
  - ❌ Frequency caps (not yet implemented).
  - ❌ "Sponsored" label always visible (delivery layer not built).
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
- ❌ Spend tracking: `budgetCents` decrement on billable events not implemented (depends on event ingestion).
- **Decision locked:** Prepay only (no postpay).

7. Key Metrics (must capture) 🔄
- ❌ Impressions — event ingestion not built.
- ❌ Clicks — event ingestion not built.
- ❌ CTR, Spend, eCPM — derived from events; not available.
- ❌ Video metrics (VCR 25/50/100%) — not logged.
- ✅ Reporting UI shell exists in `CampaignDetailPage` (placeholder until real events flow in).

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
- ✅ Mux pipeline — `processAdVideoWithMux` Cloud Function transcodes to HLS; `muxWebhook` writes playback URL back to Firestore.
- ❌ Video renderer in consumer feeds — not yet integrated.
- ✅ Stripe integration — prepay checkout + portal active.
- ❌ `selectAd` / `events` Cloud Functions — not yet implemented.

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

14. Security & Anti‑Fraud ❌
- ❌ Rate limiting on event ingestion — not applicable yet (no event endpoint).
- ❌ Click deduplication — not implemented.
- ❌ Frequency caps — not implemented.
- ❌ Budget pacing — not implemented.
- ❌ Anomaly detection (CTR spike flagging) — not implemented.
- ✅ Firestore security rules exist for `ads_campaigns` (advertiser-scoped read/write).
  - **Action needed:** Verify rules allow Cloud Function service account to write Mux fields.

15. Operational & Cost Considerations 🔄
- ✅ Creatives stored in Cloud Storage (`campaign-assets/{uid}/{filename}`).
- ✅ Mux handles CDN delivery of transcoded HLS video (no egress from Cloud Storage per view).
- ❌ BigQuery event streaming — deferred until event ingestion is built.
- **Reminder:** Mux billing is per minute of video stored + delivered. Monitor usage after pilot.

16. Deliverables & Next Steps (updated)
1. ✅ Advertiser PWA skeleton with auth, campaign CRUD, creative upload.
2. ✅ Mux video transcoding pipeline (Cloud Function + webhook).
3. ✅ Admin review flow with video preview.
4. 🔄 Deploy Cloud Functions to production (`processAdVideoWithMux`, updated `muxWebhook`).
5. ❌ Register Mux webhook URL in Mux dashboard.
6. ❌ Implement `selectAd` + `logAdEvent` Cloud Functions.
7. ❌ Integrate ad rendering in voyager-RN and voyager-pwa consumer apps.
8. ❌ Impression/click logging + spend tracking.
9. ❌ Frequency caps + budget pacing.
10. ❌ Pilot with 3–5 local advertisers; iterate on pricing.

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
