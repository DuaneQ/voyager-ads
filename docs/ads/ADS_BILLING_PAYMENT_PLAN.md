# TravalPass Ads Billing and Promo Plan

Status: Draft for implementation
Last updated: 2026-04-05
Owners: Ads Product + Engineering

---

## 1. Objective

Implement a dedicated Ads billing flow that charges one-time campaign budget amounts in Stripe, supports promotion codes, and keeps campaign-level credit depletion in Firestore as the source of delivery truth.

This plan intentionally reuses as much existing Stripe and ads budget logic as possible while introducing an Ads-specific checkout and webhook path.

---

## 2. Confirmed Product Decisions

1. Ads billing is prepaid, one-time payment per campaign (not subscription).
2. Campaign credits are equal to campaign budget amount.
3. Promo code support is required.
4. Promo code may reduce payment amount; campaign credit remains the full campaign budget amount.
5. Promo implementation should leverage Stripe where possible.
6. Promo can be used by new or returning customers.
7. Dedicated Billing page is required.
8. No strict admin approval gate on payment completion.
9. Flow must be fully tested in dev before release.

---

## 3. Current System Baseline (Verified)

### 3.1 Existing campaign credit behavior

1. budgetCents is initialized from budgetAmount on admin approval in voyager-pwa/functions/src/reviewCampaign.ts.
2. selectAds excludes campaigns with no remaining budget in voyager-pwa/functions/src/selectAds.ts.
3. logAdEvents decrements budgetCents and pauses campaigns when budget reaches zero in voyager-pwa/functions/src/logAdEvents.ts.

### 3.2 Existing Stripe behavior

1. createStripeCheckoutSession currently creates subscription Checkout sessions in voyager-pwa/functions/src/createStripeCheckoutSession.ts.
2. stripeWebhook currently updates premium subscription fields on users documents in voyager-pwa/functions/src/index.ts.
3. This is consumer subscription behavior and does not match Ads prepaid campaign billing.

### 3.3 Ads UI baseline

1. At the time this baseline was captured, no dedicated Billing page route existed in voyager-ads/src/App.tsx; this is now superseded by the /billing/:id route.
2. Campaign wizard captures budgetAmount and billingModel but does not trigger dedicated Ads payment collection flow.

---

## 4. Target Architecture

### 4.1 High-level flow

1. Advertiser creates or edits campaign with budgetAmount.
2. Advertiser opens dedicated Billing page for that campaign.
3. Billing page calls a new Ads-specific callable to create one-time Stripe Checkout session.
4. Stripe Checkout supports promotion code entry.
5. checkout.session.completed webhook marks campaign payment status fields.
6. Campaign credit remains campaign budget amount.
7. Existing delivery logic continues spending budgetCents from campaign events.
8. Campaign is paused automatically by existing logic when budgetCents reaches zero.

### 4.2 Enforcement model

1. Admin review remains independent (no strict payment gate at review step).
2. Delivery enforcement occurs at ad serving filter level by requiring campaign payment status to be paid before eligibility.
3. This prevents unpaid campaigns from serving while preserving non-blocking admin workflow.

---

## 5. Data Model Additions (ads_campaigns)

Add Ads payment fields on campaign documents.

Required fields:
1. paymentStatus: unpaid | checkout_created | paid | payment_failed
2. paymentRequiredCents: integer (campaign budget cents)
3. paymentPaidCents: integer (amount actually paid after discounts)
4. paymentCurrency: string, default usd
5. paymentSessionId: Stripe Checkout session id
6. paymentCompletedAt: timestamp
7. paymentPromoCode: optional string (customer-entered code, if redeemed)
8. paymentDiscountCents: integer (derived from checkout totals)

Notes:
1. budgetCents remains the spend ledger for delivery.
2. budgetCents should not be reduced by promo amount.
3. payment fields are fulfillment/audit fields.

---

## 6. Stripe Setup Plan

### 6.1 Dashboard configuration

1. Create Ads one-time product/price strategy:
   - Preferred: dynamic line item with price_data and unit_amount from campaign budget.
   - Alternative: predefined price tiers.
2. Configure Coupons and Promotion Codes in Stripe Dashboard.
3. Use amount_off coupons for free-credit style campaigns.
4. Optionally use percent_off coupons for campaign promotions.
5. Set redemption constraints as needed:
   - max redemptions
   - expiry
   - optional minimum amount

### 6.2 Checkout configuration

1. Use mode=payment (one-time).
2. Enable allow_promotion_codes=true.
3. Include campaign metadata:
   - flow=ads
   - uid
   - campaignId
   - paymentRequiredCents
4. Use success and cancel URLs pointing to Ads app Billing route.
5. Use API version compatible with no-cost orders (2023-08-16 or later) for Ads checkout path.

### 6.3 Tax handling

1. Stripe can handle tax in Checkout with automatic_tax enabled.
2. Tax decision for Ads MVP:
   - Phase 1 default: automatic_tax disabled unless business/legal requires immediate tax collection.
   - Phase 2 optional: enable automatic_tax and customer address collection.

---

## 7. Implementation Phases

### Phase 1: Backend Ads payment foundation

Scope:
1. Add new callable createAdsCampaignCheckoutSession in voyager-pwa/functions/src.
2. Keep existing subscription callable unchanged.
3. Add helper module for Ads payment metadata and validation.
4. Export new callable from functions index.

Acceptance criteria:
1. Callable validates auth and campaign ownership.
2. Callable validates campaign exists and has valid budgetAmount.
3. Callable returns Stripe checkout url.
4. Callable stores paymentStatus=checkout_created and session id.

### Phase 2: Webhook fulfillment for Ads flow

Scope:
1. Extend stripeWebhook in voyager-pwa/functions/src/index.ts with Ads branch:
   - if metadata.flow=ads and event type checkout.session.completed.
2. Resolve campaign by metadata.campaignId.
3. Update campaign payment fields and set paymentStatus=paid.
4. Persist paid amount, discount amount, and promo code where available.

Acceptance criteria:
1. Subscription webhook behavior remains unchanged.
2. Ads paid campaigns are reliably marked paid.
3. No-cost checkout sessions are fulfilled via checkout.session.completed.

### Phase 3: Delivery enforcement

Scope:
1. Update selectAds eligibility checks to require paymentStatus=paid.
2. Maintain existing budget and creative eligibility filters.

Acceptance criteria:
1. Unpaid campaigns are never returned by selectAds.
2. Paid campaigns continue normal delivery and budget depletion.

### Phase 4: Dedicated Ads Billing page

Scope:
1. Add route in voyager-ads/src/App.tsx for Billing page.
2. Create page and service hook to:
   - show campaign budget and payment status
   - start checkout via callable
   - handle success/cancel return states
3. Add entry points from campaign detail and/or dashboard.

Acceptance criteria:
1. Advertiser can pay for a campaign from a dedicated page.
2. Promo code entry appears in Stripe Checkout.
3. Post-checkout state is visible in Ads UI.

### Phase 5: Test suite and dev validation

Scope:
1. Add unit tests for new callable and webhook Ads branch in functions.
2. Add UI tests for Billing page behavior in ads app.
3. Execute end-to-end test checklist in dev environment.

Acceptance criteria:
1. Automated tests pass.
2. Manual dev test matrix completed.
3. Release checklist signed off.

---

## 8. SOLID Design Approach

1. Single Responsibility:
   - Separate Ads checkout creation from existing subscription checkout function.
   - Separate webhook Ads fulfillment branch from subscription branch.
2. Open/Closed:
   - Add Ads-specific modules without rewriting stable subscription code.
3. Interface Segregation:
   - Billing page depends on small Ads billing service API, not generic monolith services.
4. Dependency Inversion:
   - Stripe calls isolated behind helper/service functions so testing can mock external SDK.

---

## 9. Dev Test Matrix (Required Before Release)

### 9.1 Checkout outcomes

1. Paid campaign without promo code.
2. Paid campaign with percent discount code.
3. Paid campaign with amount-off code.
4. Fully discounted campaign (total due = 0).
5. Invalid promo code entered.
6. Expired promo code entered.

### 9.2 Campaign delivery outcomes

1. Paid campaign serves when active and in budget.
2. Unpaid campaign does not serve.
3. budgetCents depletes on billable events.
4. Campaign pauses automatically when budgetCents <= 0.

### 9.3 Regression coverage

1. Existing subscription checkout and portal behavior unchanged.
2. Existing stripeWebhook subscription event handling unchanged.
3. Existing daily budget reset behavior unchanged.

---

## 10. Rollout and Safety

1. Implement and deploy in dev first.
2. Validate webhook events with Stripe test mode.
3. Validate no-cost order fulfillment event path.
4. Promote to production only after full matrix pass.
5. Keep rollback option by gating new Billing page links behind feature flag if needed.

---

## 11. Alternatives Considered

1. Advertiser wallet ledger separate from campaigns:
   - More flexible long-term.
   - Higher implementation complexity now.
2. Postpaid metered billing:
   - Better charge precision.
   - Much higher dispute and reconciliation complexity.
3. Decision: stay with campaign-level prepaid credits for MVP speed and compatibility.

---

## 12. Deliverables Checklist

1. New plan document (this file).
2. Ads-specific checkout callable.
3. Ads webhook fulfillment branch.
4. Delivery payment-status filter.
5. Dedicated Billing page and route.
6. Unit tests and integration tests.
7. Dev verification report.

---

## 13. Executable QA Test Plan

This section is the required step-by-step test script to run in dev before release.

### 13.1 Environments and prerequisites

1. Firebase project: mundo1-dev.
2. Functions deployed to dev with Ads billing changes.
3. Ads web app running against dev firebase config.
4. Stripe test mode enabled.
5. Stripe webhook endpoint configured for dev and receiving events.
6. Test advertiser account available.
7. At least one campaign in ads_campaigns with:
   - valid budgetAmount
   - status active or draft
   - creative ready

### 13.2 Stripe promo fixtures (create once)

Create these test promo assets in Stripe Dashboard:

1. PROMO10PCT:
   - coupon: percent_off=10
   - promotion code: PROMO10PCT
2. PROMO25USD:
   - coupon: amount_off=2500 (usd)
   - promotion code: PROMO25USD
3. PROMOFREE100:
   - coupon: percent_off=100
   - promotion code: PROMOFREE100
4. PROMOEXPIRED:
   - any coupon with expired promotion code.

### 13.3 Firestore fields to assert on campaigns

For each test case below, verify these fields on the tested campaign document:

1. paymentStatus
2. paymentRequiredCents
3. paymentPaidCents
4. paymentDiscountCents
5. paymentCurrency
6. paymentSessionId
7. paymentPromoCode
8. paymentCompletedAt
9. budgetCents (must reflect campaign credit model)

### 13.4 Stripe events to assert

For each successful checkout path, verify:

1. checkout.session.completed is received by webhook.
2. metadata contains flow=ads and campaignId.
3. amount_total and total_details.amount_discount match Firestore payment fields.

For free checkouts (100 percent off):

1. checkout.session.completed still fires.
2. No reliance on PaymentIntent events for fulfillment.

### 13.5 Core manual scenarios

#### Scenario A: Payment without promo code

1. Create or open campaign with budgetAmount=100.
2. Open Billing page and start checkout.
3. Complete payment in Stripe test checkout.
4. Return to success URL.
5. Verify campaign fields:
   - paymentStatus=paid
   - paymentRequiredCents=10000
   - paymentPaidCents=10000 (assuming no tax)
   - paymentDiscountCents=0
6. Verify budget/credit behavior:
   - budgetCents equals campaign budget credits per model.

#### Scenario B: Payment with percent promo code

1. Open campaign with budgetAmount=100.
2. Checkout and enter PROMO10PCT.
3. Complete payment.
4. Verify campaign fields:
   - paymentStatus=paid
   - paymentRequiredCents=10000
   - paymentPaidCents=9000 (assuming no tax)
   - paymentDiscountCents=1000
   - paymentPromoCode set to PROMO10PCT (if available from session data path).
5. Verify budgetCents still equals full campaign credit amount (not discounted amount).

#### Scenario C: Payment with fixed amount-off promo code

1. Open campaign with budgetAmount=100.
2. Checkout and enter PROMO25USD.
3. Complete payment.
4. Verify campaign fields:
   - paymentStatus=paid
   - paymentRequiredCents=10000
   - paymentPaidCents=7500 (assuming no tax)
   - paymentDiscountCents=2500
5. Verify budgetCents remains aligned to full campaign credit amount.

#### Scenario D: Fully free checkout (no-cost order)

1. Open campaign with budgetAmount=100.
2. Checkout and enter PROMOFREE100.
3. Complete checkout with no payment method collected.
4. Verify webhook received checkout.session.completed.
5. Verify campaign fields:
   - paymentStatus=paid
   - paymentRequiredCents=10000
   - paymentPaidCents=0
   - paymentDiscountCents=10000
6. Verify campaign is eligible to serve once active and otherwise valid.

#### Scenario E: Invalid promo code

1. Start checkout for any campaign.
2. Enter an invalid code.
3. Verify Stripe checkout shows validation error and cannot apply discount.
4. Complete payment without code (optional) and verify payment fields are non-discounted.

#### Scenario F: Expired promo code

1. Start checkout.
2. Enter PROMOEXPIRED.
3. Verify Stripe rejects code.
4. Verify no incorrect campaign payment fields are written before successful completion.

### 13.6 Delivery enforcement scenarios

#### Scenario G: Unpaid campaign should not serve

1. Campaign state:
   - status active
   - paymentStatus unpaid (or missing)
   - budgetCents > 0
2. Call selectAds for relevant placement.
3. Verify campaign is excluded from results.

#### Scenario H: Paid campaign should serve

1. Campaign state:
   - status active
   - paymentStatus paid
   - budgetCents > 0
2. Call selectAds.
3. Verify campaign is eligible and can be returned based on scoring.

### 13.7 Budget depletion scenarios

#### Scenario I: spend and pause at zero

1. Use a paid campaign with small budgetCents.
2. Send billable events through logAdEvents.
3. Verify:
   - budgetCents decreases according to billing model.
   - status becomes paused when budgetCents <= 0.

#### Scenario J: daily budget reset behavior unaffected

1. Use daily campaign that has budgetCents depleted and paused.
2. Run resetDailyBudgets schedule path in dev.
3. Verify:
   - budgetCents resets from budgetAmount.
   - paused daily campaign can be reactivated by existing reset logic.
4. Verify paymentStatus fields remain unchanged by reset.

### 13.8 Automated test requirements

Functions tests to add/update:

1. createAdsCampaignCheckoutSession:
   - auth required
   - ownership validation
   - budget validation
   - mode=payment
   - allow_promotion_codes=true
   - metadata contains flow=ads and campaignId
2. stripeWebhook Ads branch:
   - checkout.session.completed with no promo
   - checkout.session.completed with discount
   - checkout.session.completed with free order
   - does not regress subscription event handling
3. selectAds enforcement:
   - excludes unpaid campaigns
   - includes paid campaigns

Ads app tests to add/update:

1. Billing page route renders and loads campaign state.
2. Start checkout action calls Ads checkout callable.
3. Success/cancel URL state handling messages render accessibly.

### 13.9 Release sign-off checklist

All must be true before production release:

1. All automated tests pass in both repos.
2. All manual scenarios A-J pass in dev.
3. Stripe webhook logs show no unhandled errors.
4. No regressions in existing subscription checkout flow.
5. Dev verification report recorded with timestamps, campaign IDs, and Stripe session IDs.

---

## 14. Dev Verification Report Template

Use this template during test execution. One row per scenario run.

### 14.1 Scenario execution log

| Run ID | Date/Time (UTC) | Tester | Environment | Scenario ID | Campaign ID | Stripe Session ID | Promo Code | Result (Pass/Fail) | Notes |
|---|---|---|---|---|---|---|---|---|---|
| RUN-001 | 2026-04-05T00:00:00Z |  | mundo1-dev | A |  |  |  |  |  |
| RUN-002 | 2026-04-05T00:00:00Z |  | mundo1-dev | B |  |  | PROMO10PCT |  |  |
| RUN-003 | 2026-04-05T00:00:00Z |  | mundo1-dev | C |  |  | PROMO25USD |  |  |
| RUN-004 | 2026-04-05T00:00:00Z |  | mundo1-dev | D |  |  | PROMOFREE100 |  |  |
| RUN-005 | 2026-04-05T00:00:00Z |  | mundo1-dev | E |  |  | INVALID |  |  |
| RUN-006 | 2026-04-05T00:00:00Z |  | mundo1-dev | F |  |  | PROMOEXPIRED |  |  |
| RUN-007 | 2026-04-05T00:00:00Z |  | mundo1-dev | G |  |  |  |  |  |
| RUN-008 | 2026-04-05T00:00:00Z |  | mundo1-dev | H |  |  |  |  |  |
| RUN-009 | 2026-04-05T00:00:00Z |  | mundo1-dev | I |  |  |  |  |  |
| RUN-010 | 2026-04-05T00:00:00Z |  | mundo1-dev | J |  |  |  |  |  |

### 14.2 Firestore assertion log

Record observed values after each successful checkout scenario.

| Run ID | paymentStatus | paymentRequiredCents | paymentPaidCents | paymentDiscountCents | paymentCurrency | paymentSessionId | paymentPromoCode | paymentCompletedAt | budgetCents |
|---|---|---:|---:|---:|---|---|---|---|---:|
| RUN-001 |  |  |  |  |  |  |  |  |  |
| RUN-002 |  |  |  |  |  |  |  |  |  |
| RUN-003 |  |  |  |  |  |  |  |  |  |
| RUN-004 |  |  |  |  |  |  |  |  |  |

### 14.3 Webhook evidence log

| Run ID | Event ID | Event Type | Webhook Response | Metadata flow | Metadata campaignId | amount_total | amount_discount | Notes |
|---|---|---|---|---|---|---:|---:|---|
| RUN-001 |  | checkout.session.completed | 200 | ads |  |  |  |  |
| RUN-002 |  | checkout.session.completed | 200 | ads |  |  |  |  |
| RUN-003 |  | checkout.session.completed | 200 | ads |  |  |  |  |
| RUN-004 |  | checkout.session.completed | 200 | ads |  |  |  |  |

### 14.4 Regression check log

| Check | Expected | Actual | Pass/Fail | Notes |
|---|---|---|---|---|
| Subscription checkout unchanged | Existing consumer flow works |  |  |  |
| Subscription portal unchanged | Existing portal opens and returns |  |  |  |
| Subscription webhook branch unchanged | premium fields continue updating |  |  |  |
| resetDailyBudgets unchanged | daily campaigns reset correctly |  |  |  |

### 14.5 Final sign-off block

| Item | Status | Owner | Date |
|---|---|---|---|
| Automated tests pass |  |  |  |
| Manual scenarios A-J pass |  |  |  |
| Webhook error log clean |  |  |  |
| Release approved |  |  |  |

---

## 15. Functions and Stripe Version Strategy

This section defines what to upgrade now versus later.

### 15.1 Current version snapshot

Observed in voyager-pwa/functions:

1. Node runtime in package engines is 20.
2. Stripe SDK dependency is ^12.18.0.
3. Stripe client instances use apiVersion 2022-11-15.
4. Ads delivery functions are mostly v2 callable style.
5. Existing Stripe checkout and portal callables are still v1 callable style.

### 15.2 Why upgrade is needed

1. Ads flow requires support for modern Checkout behavior including no-cost orders and promotion handling.
2. Stripe API version 2022-11-15 is older than recommended for no-cost-order-first implementation.
3. Mixed v1 and v2 callable patterns increase migration complexity as Node and firebase-functions major upgrades continue.

### 15.3 Recommended approach

Do not perform a repo-wide Stripe upgrade in one step. Use a low-risk phased approach:

Phase A (required for Ads billing MVP):
1. Create a new Ads-only Stripe client/module for Ads checkout and Ads webhook handling.
2. Pin this Ads module to a newer Stripe API version compatible with no-cost orders.
3. Keep existing subscription checkout and portal functions on their current Stripe API version during MVP build.
4. Add regression tests proving subscription behavior is unchanged.

Phase B (post-MVP hardening):
1. Migrate existing subscription Stripe callables from v1 callable style to v2 callable style.
2. Upgrade shared Stripe SDK to a current supported major.
3. Align all Stripe clients to a single target API version after passing regression suite.

### 15.4 Guardrails for version changes

1. Any Stripe API version bump must include webhook fixture updates and tests.
2. Treat webhook payload shape differences as breaking changes until proven otherwise.
3. Keep Ads metadata contract stable: flow, uid, campaignId, paymentRequiredCents.
4. Release by environment sequence: dev validation first, then production.

### 15.5 Acceptance criteria for version work

1. Ads checkout supports promo codes and no-cost completion in dev.
2. Ads webhook fulfillment works for paid and fully discounted sessions.
3. Existing subscription checkout, portal, and webhook paths remain unchanged.
4. Full test matrix in this document passes.
