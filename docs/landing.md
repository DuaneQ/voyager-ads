# Landing Page — Work Summary and Next Steps

This document summarizes the landing-page and Ads-portal work completed so far, design and billing decisions, instrumentation added, test status, and the most important pending items we need to return to.

## Repository layout (relevant)
- `src/components/landing/` — hero, carousel, rotating headlines, and new `products/` UI
- `src/components/landing/products/Products.tsx` — Products UI, product cards, pricing modal, `trackClick` helper
- `src/components/common/Modal.tsx` — accessible modal used by pricing flows
- `src/pages/` — `Landing.tsx`, added `ProductsPage` and `PricingPage`
- `src/main.tsx` & `src/App.tsx` — React Router wiring for `/`, `/products`, `/pricing`
- `src/App.css` — hero grid forced to stack image + text carousels vertically
- `docs/` — documentation (this file)

## What we changed (high level)
- Enforced vertical stacking of the landing hero carousels so the image carousel and text carousel always render in a single column layout (CSS change in `src/App.css`).
- Added a discoverable Products & Pricing flow:
  - New `Products` UI with three example placements: Itinerary Feed, Video Feed, AI Itinerary Placement.
  - Dedicated routes: `/products` and `/pricing` and updated navigation links.
- Removed CPA and rev-share offers from the public UI and documentation (billing modes deferred for now).
- Added CPC as an option for the AI Itinerary placement and implemented client-side click instrumentation.
- Instrumentation: created `trackClick(placement)` in `Products.tsx` which generates a `tp_click_id` and posts a minimal beacon/fetch to `/api/clicks` (client-side only). This enables later reconciliation for CPC billing.
- Updated tests and test utilities to support routing changes; unit tests pass locally after edits.

## Key design & billing decisions
- State library: decided on Zustand for local/campaign store scaffolding (scaffold pending).
- Billing primitives:
  - Video: recommend CPV and vCPM for view-quality buys.
  - AI Itinerary: CPC (click-based) + premium CPM options shown in UI; CPA deferred until server-side attribution infrastructure exists.
- Measurement: client `tp_click_id` used as a lightweight click receipt; server-side endpoint and persistence required before enabling CPC billing to advertisers.

## Instrumentation details
- Client `trackClick` flow (in `Products.tsx`):
  - Generates `tp_click_id` (cryptographic random fallback) and sends { tp_click_id, placement, ts, referrer } to `/api/clicks` via `navigator.sendBeacon` with a `fetch` fallback.
  - No server implementation exists yet — the beacon currently fires but is not stored or validated.

## RN inspection and creative specs
- We inspected the React Native app to derive practical creative recommendations:
  - `VideoCardV2` uses full-bleed window `width`/`height` and marks a view after ~3000ms (useful for CPV thresholds).
  - `VideoGrid` uses `ITEM_SIZE = (width - 40) / 3` for square thumbnail sizing — useful for thumbnail sprite and sizing guidance.
  - `AIItineraryDisplay` hotel-card minHeight ≈ 280px and uses full-width images; heroes should be 16:9 and many thumbnails 1:1.

## Tests & verification
- Unit tests (Vitest) were run locally; test suite reports all current tests passing.
- Accessibility: `Modal` uses ARIA and focus handling; landing changes preserved semantic HTML.

## Pending / TODO (high priority)
These are the items we should prioritize next:

- Implement server endpoint to accept `/api/clicks` payloads and persist click receipts (Node/Express or serverless). This is required before offering CPC billing to advertisers.
- Scaffold `src/store/campaignStore.ts` (Zustand) and add a minimal campaign-draft UI so advertisers can create campaigns in-app.
- Add uploader validation and automatic resizing on the web UI to enforce recommended image/video sizes and reduce upload errors.
- Decide whether Products should additionally have an in-page modal experience (alternative to dedicated `/products` route) and implement if desired.
- Add server-side attribution & anti-fraud flows before enabling CPA billing.

## Lower priority / nice-to-have
- Add a runtime RN measurement snippet to report device viewport and ITEM_SIZE back to a diagnostics endpoint for further spec refinement.
- Add more robust analytics events (impressions, view thresholds, conversions) and map them to our `tp_*` identifiers.
- Add storybook or visual regression tests for hero and Products components.

## Recommended next steps (short plan)
1. Implement `/api/clicks` server receiver + persistent store (DB or cloud table). Accept the minimal beacon payload and return success for sendBeacon.
2. Scaffold Zustand store and wire a simple campaign draft UI into the landing flow to capture product + budget.
3. Add client-side uploader validation and auto-resize for images/videos.
4. After server receipts are in place, run an internal QA on CPC flows, and then enable CPC offers for select advertisers.

## Who to contact / ownership
- Frontend: landing hero, Products UI, and click-beacon client — `src/components/landing` (current repo owner)
- Backend: needs owner for `/api/clicks` persistence and attribution pipeline
- Data/Analytics: recommend adding a small schema for `tp_clicks` with `tp_click_id, placement, ts, referrer, user_agent`

---
This document should be kept in `docs/landing.md`. Add follow-up docs into `docs/` as server and integration design artifacts are created (e.g., `docs/clicks-api.md`, `docs/campaign-model.md`).
