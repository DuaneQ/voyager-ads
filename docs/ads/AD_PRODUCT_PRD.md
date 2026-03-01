% TravalPass Ads — PRD (MVP)

**Status: In Progress**  
**Last updated: 2026-02-07**

> ⚠️ This file currently contains two draft versions merged together (see note below §3). For clean implementation status, see [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md). For annotated engineering requirements, see [ADS_REQUIREMENTS.md](ADS_REQUIREMENTS.md).
>
> Legend: ✅ Implemented · 🔄 Partial · ❌ Not started

Purpose ✅ (advertiser PWA) / ❌ (consumer delivery)
- Create a simple, self‑serve advertising product for local businesses and travel brands that delivers ads into:
  - Video Feed (video/image creatives) — ✅ preview in advertiser PWA; ❌ not yet in consumer apps
  - Itinerary feed (promoted itinerary cards) — ❌ not implemented
  - Promotion slots in AI Itinerary and Add Itinerary flows — ❌ not implemented

High‑level goals 🔄
- ✅ Monetize with low operational overhead and predictable pricing — Stripe prepay active, CPM/CPC wizard built.
- 🔄 Preserve user experience and privacy — opt-out and flagging not yet built.
- ✅ Reuse existing repo infrastructure — Cloud Functions, Stripe, Cloud Storage all reused.

Monetization model (MVP) 🔄
- ✅ Supported models: CPM (primary) and CPC (optional). No auction bidding.
- ✅ CPM and CPC selection in campaign wizard.
- ❌ CPA: deferred.
- ❌ Spend tracking (spentCents decrement) not yet implemented — depends on event ingestion.

Metrics (must capture) ❌ (event ingestion not yet built)
- ❌ Impressions: event ingestion not implemented.
- ❌ Clicks: event ingestion not implemented.
- ❌ CTR, Spend, eCPM: derived from events — not available.
- ❌ Video metrics (VCR 25/50/100%): not logged.
- ✅ Reporting UI shell exists in CampaignDetailPage (placeholder until real events flow).
- ✅ MetricsChart and KPI chips built.

Targeting 🔄
- ✅ Location (country / region / city / radius) — wizard step built
- ✅ Itinerary destination matching — wizard step built
- ✅ Travel dates — wizard step built
- 🔄 Demographics from profile (age, gender) — UI built; consent gating not enforced
- ❌ Behavioural signals — no delivery layer

Creative specifications ✅
- ✅ Upload + validation in StepCreative
- ✅ Mux transcodes video to HLS; CampaignAdPreview plays back via hls.js / native HLS / raw fallback
- ✅ Phone-frame preview with mute toggle in wizard, admin review, and campaign detail page
- Image ads
  - Formats: JPG, PNG
  % TravalPass Ads — PRD (MVP)

  Status: Final — Drafted single consolidated PRD

  Owner: TravalPass Product

  Purpose
  - Build a self‑serve advertiser PWA (ads.travalpass.com) for local businesses and travel brands. The PWA enables campaign creation, creative upload, targeting, and Stripe prepay billing. Ads are delivered natively into TravalPass consumer apps (iOS, Android, Web) at these placements: Video Feed, Itinerary Feed, AI Itinerary and Add Itinerary promotion slots.

  Scope (MVP)
  - Advertiser PWA: onboarding, campaign CRUD, creative upload, targeting, budgets, Stripe prepay.
  - Backend: campaign/creative store, server-side ad selection endpoint, impression/click ingestion, basic reporting counters.
  - Client changes: render ads in Video Feed, Itinerary Feed, AI Itinerary/Add Itinerary; log impressions and clicks; user flagging.

  Goals
  - Enable advertisers to launch campaigns quickly with minimal ops.
  - Monetize via CPM (primary) and CPC (optional); no auction bidding.
  - Preserve user trust, privacy, and UX; provide opt‑out and flagging.

  Out of scope (MVP)
  - Auction bidding, CPA billing, native advertiser mobile app, advanced ML fraud detection, automated refunds.

  Ad Placements & UX Rules
  - Video Feed: inline native video/image cards labeled "Sponsored"; frequency caps enforced.
  - Itinerary Feed: promoted itinerary cards displayed inline.
  - AI Itinerary / Add Itinerary: small contextual promotion slot.
  - Ads must not block core flows; users can flag ads and see "why am I seeing this?" info.

  Targeting
  - Supported: location, itinerary destination, travel dates, platform.
  - Conditional (consent required): age, gender.
  - Deferred: retargeting, lookalikes.

  Monetization & Billing
  - Models: CPM (default) and CPC (optional). Both impressions and clicks logged; billing based on campaign model.
  - Pricing: flat tiers (no auction), minimum campaign spend enforced, Stripe prepay (credits) for MVP.

  Billable Event Rules
  - Billable Impression (CPM): >=50% visible and >=1 second on screen, campaign active and within budget, frequency cap not exceeded.
  - Billable Click (CPC): one billable click per user×ad per 24h, must follow a valid impression and pass anomaly checks.

  Creative Specs
  - Image: JPG/PNG; 1:1 (1080×1080) & 1.91:1 (1200×628); max 5 MB.
  - Video: MP4 (H.264), AAC; 9:16, 1:1, 16:9; <=1080p; bitrate <=8 Mbps (<=5 Mbps recommended); 6–30s recommended, <=60s max; max 50 MB; captions recommended.
  - Text: Headline <=60 chars; Body <=125 chars; CTA from standard set.

  Moderation & Abuse
  - Automated upload checks for format and size; user flagging sends creatives to moderation queue; admins can pause/reject creatives.

  Privacy & Compliance
  - App-level personalized ads toggle; hashed identifiers only; no PII exposure to advertisers; ATT respected on iOS; update Privacy Policy/TOS.

  Metrics & Reporting
  - Capture: impressions (total & billable), clicks (total & billable), CTR, spend, eCPM/eCPC, video metrics (starts, watch time, VCR), reach & frequency, geo/platform breakdown.
  - Reporting UI: daily aggregates, CSV export.

  Minimal Data Model
  - Campaign: id, advertiserId, name, startTs, endTs, billingModel, rates, budgetCents, spentCents, placements[], targeting, status, priority.
  - Creative: id, campaignId, type, storageUrl, thumbnailUrl, width, height, durationSec, status.
  - Event: id, type(impression|click), campaignId, creativeId, impressionId, hashedUserId?, placement, ts, billed(bool), nonBillableReason?

  API Surface (high-level)
  - POST /campaigns
  - GET /campaigns/:id
  - POST /campaigns/:id/creatives
  - POST /ads/select
  - POST /events
  - GET /reports/campaign/:id

  Security & Anti‑Fraud (MVP)
  - Rate-limit event ingestion; deduplicate clicks; frequency caps; budget pacing; anomaly flagging; automatic campaign pause and manual review for disputes.

  Operational Notes
  - Store creatives in Cloud Storage + CDN; stream events to BigQuery for analytics if needed; estimate storage/egress costs and include in pricing decisions.

  Delivery Plan (recommended)
  - Week 1: schema + API + ad selection + event ingestion
  - Week 2: PWA advertiser UI (auth, campaign CRUD, upload) + Stripe prepay
  - Week 3: client ad renderer + logging + frequency caps
  - Week 4: moderation + pilot

  Launch Criteria
  - End-to-end campaign flow verified; billing accurate and auditable; ads labeled; no blocking UX issues; pilot advertisers active.

  Decisions Needed
  - Confirm placements UI (full-width promoted itinerary vs inline native card).
  - Confirm prepay vs postpay (recommend prepay).
  - Confirm demographic fields allowed for targeting.

  Document History
  - Created: 2026-02-07
  - Consolidated: 2026-02-07

---
> ⚠️ **Duplicate draft note:** The section below (§4–§17) is a second draft that was merged into this file. It contains the same requirements more formally structured. For the authoritative implementation status of each section, see [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) and [ADS_REQUIREMENTS.md](ADS_REQUIREMENTS.md). TODO: consolidate into a single version.
---

Cloud Storage + CDN for creatives ✅ (Cloud Storage; Mux CDN for video HLS)

Stripe for payments (prepay only) ✅

4. Ad Placements (MVP)
Supported Placements

Video Feed

Inline native cards

Video or image creatives

Clearly labeled “Sponsored”

Itinerary Feed

Promoted itinerary cards

Inline native placement

AI Itinerary / Add Itinerary

Small native promotion slot

Contextual to destination

UX Rules (Hard Requirements)

Ads must never block core flows

Frequency caps enforced

“Sponsored” label always visible

User can flag ads

“Why am I seeing this?” explanation

5. Targeting (MVP)
Supported

Location (country / region / city / radius)

Itinerary destination match

Travel date overlap

Platform (iOS / Android / Web)

Conditional (Consent Required)

Age

Gender

Deferred

Retargeting

Lookalikes

Advanced behavioral segments

6. Monetization & Billing
Billing Models

Each campaign selects one primary model:

CPM (default)

CPC (optional)

Both impressions and clicks are always logged, but only the selected model is billed.

Pricing

Flat pricing tiers (no auction)

Minimum campaign spend enforced

Stripe prepay only (credits)

7. Billable Event Definitions
Billable Impression (CPM)

An impression is billable if:

≥ 50% of creative visible

≥ 1 second on screen

Campaign active, approved, in budget

Frequency cap not exceeded

Billable Click (CPC)

A click is billable only if:

One click per user × ad × 24h

Follows a valid impression

Results in ≥ 800ms meaningful interaction

Passes frequency & anomaly checks

Non-billable clicks are logged but never charged.

8. Anti-Fraud & Safeguards (MVP)
Required

Click deduplication

Frequency caps (impressions & clicks)

Budget pacing

Rate-limited event ingestion

Anomaly flagging (CTR spikes, clustered clicks)

Enforcement

Automatic campaign pause

Manual admin review

Credits issued for approved disputes

9. Metrics & Reporting
Required Metrics

Impressions (total / billable)

Clicks (total / billable)

CTR

Spend

eCPM / eCPC

Video metrics (start, watch time, 25/50/100%)

Reach & frequency

Geo + platform breakdown

MVP Reporting UI

Daily aggregates (table view)

CSV export

No charts required

10. Creative Specifications
Image

JPG / PNG

1:1 (1080×1080), 1.91:1 (1200×628)

Max 5 MB

Video

MP4 (H.264), AAC audio

9:16, 1:1, 16:9

≤ 1080p, ≤ 8 Mbps (≤ 5 Mbps recommended)

6–30s recommended, ≤ 60s max

Max 50 MB

Captions recommended

Text

Headline ≤ 60 chars

Body ≤ 125 chars

CTA from standard set

11. Moderation & Policy

Automated upload checks (type, size, format)

User flagging from consumer apps

Manual moderation queue

Admin ability to pause / reject creatives

12. Privacy & Compliance

Personalized ads opt-out

Hashed identifiers only

No PII exposed to advertisers

ATT respected (iOS)

Updated Privacy Policy & TOS

App Store & Play compliance required

13. Data Model (MVP)
Campaign
id, advertiserId, name, startTs, endTs,
billingModel, rates, budget, spent,
placements[], targeting, status, priority

Creative
id, campaignId, type, storageUrl,
thumbnailUrl, width, height, duration, status

Event
id, type, campaignId, creativeId,
impressionId, hashedUserId?, placement, ts,
billed, nonBillableReason?

14. API Surface (MVP)

POST /campaigns

GET /campaigns/:id

POST /campaigns/:id/creatives

POST /ads/select

POST /events

GET /reports/campaign/:id

15. Delivery Plan
Week 1

Schema + API implementation

Ad selection + event ingestion

Week 2

Advertiser PWA (auth, CRUD, upload)

Stripe prepay

Week 3

Client ad rendering

Logging + frequency caps

Week 4

Moderation + pilot launch

Pricing & pacing tuning

16. Launch Criteria

End-to-end campaign flow works

Billing is accurate and auditable

Ads are clearly labeled

No blocking UX issues

Pilot advertisers active

17. Final Decisions (Locked)

✅ Web dashboard only (ads.travalpass.com)

✅ CPM + guarded CPC

✅ Prepay billing (Stripe credits)

❌ No auction

❌ No CPA in MVP

---

## Implementation Summary (added 2026-02-07)

| Component | Status |
|-----------|--------|
| Advertiser PWA (5-step wizard, dashboard, detail page) | ✅ |
| Creative upload (image + video) to Cloud Storage | ✅ |
| Mux video transcode pipeline (CF + webhook) | ✅ |
| HLS playback in phone-frame preview | ✅ |
| Admin review with video preview | ✅ |
| Stripe prepay checkout + portal | ✅ |
| Ad selection endpoint (`selectAd`) | ❌ |
| Impression / click event ingestion | ❌ |
| Consumer app ad rendering | ❌ |
| Frequency caps + budget pacing | ❌ |
| User flagging + privacy UI | ❌ |

See [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) for full technical detail.