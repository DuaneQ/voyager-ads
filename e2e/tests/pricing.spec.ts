import { test, expect } from '../fixtures'
import PRICING_SIMPLE from '../../src/config/pricingConstants'

test.describe('Pricing page', () => {
  test.beforeEach(async ({ pricingPage }) => {
    await pricingPage.goto()
  })

  // ─── Nav ─────────────────────────────────────────────────────────────────

  test('nav brand link is visible', async ({ pricingPage }) => {
    await expect(pricingPage.nav.brandLink).toBeVisible()
  })

  test('nav brand link navigates to home', async ({ pricingPage, page }) => {
    await pricingPage.nav.brandLink.click()
    await expect(page).toHaveURL('/')
  })

  // ─── Page heading & intro ─────────────────────────────────────────────────

  test('renders the Pricing h1 heading', async ({ pricingPage }) => {
    await expect(pricingPage.pageHeading).toBeVisible()
  })

  test('renders the introductory copy', async ({ pricingPage }) => {
    await expect(pricingPage.introCopy).toBeVisible()
  })

  // ─── Placement cards driven from config ───────────────────────────────────

  test('renders a card for every placement in the pricing config', async ({ pricingPage, page }) => {
    for (const placement of PRICING_SIMPLE) {
      await expect(page.getByRole('heading', { name: placement.title })).toBeVisible()
    }
  })

  // ─── Itinerary Feed card ──────────────────────────────────────────────────

  test('Itinerary Feed card shows CPM at $25 per 1,000 impressions', async ({ pricingPage }) => {
    await expect(pricingPage.itineraryFeedCard).toContainText('$25')
    await expect(pricingPage.itineraryFeedCard).toContainText('per 1,000 impressions')
  })

  test('Itinerary Feed card shows billing model label', async ({ pricingPage }) => {
    await expect(pricingPage.itineraryFeedCard).toContainText('CPC or CPM')
  })

  // ─── Video Feed card ──────────────────────────────────────────────────────

  test('Video Feed card shows CPV at $0.05 per view', async ({ pricingPage }) => {
    await expect(pricingPage.videoFeedCard).toContainText('$0.05')
    await expect(pricingPage.videoFeedCard).toContainText('per view')
  })

  test('Video Feed card shows CPM at $22 per 1,000 impressions', async ({ pricingPage }) => {
    await expect(pricingPage.videoFeedCard).toContainText('$22')
    await expect(pricingPage.videoFeedCard).toContainText('per 1,000 impressions')
  })

  test('Video Feed card shows billing model label', async ({ pricingPage }) => {
    await expect(pricingPage.videoFeedCard).toContainText('CPV or CPM')
  })

  // ─── Promoted itineraries card ────────────────────────────────────────────

  test('Promoted itineraries card shows CPC at $2.25 per click', async ({ pricingPage }) => {
    await expect(pricingPage.promotedItinerariesCard).toContainText('$2.25')
    await expect(pricingPage.promotedItinerariesCard).toContainText('per click')
  })

  // ─── Notes section ────────────────────────────────────────────────────────

  test('Notes section heading is visible', async ({ pricingPage }) => {
    await expect(pricingPage.notesHeading).toBeVisible()
  })

  test('notes mention video view counting threshold', async ({ pricingPage }) => {
    await expect(pricingPage.noteVideoViews).toBeVisible()
  })

  test('notes state CPA billing is not yet available', async ({ pricingPage }) => {
    await expect(pricingPage.noteCpaUnavailable).toBeVisible()
  })

  // ─── CTA links ────────────────────────────────────────────────────────────

  test('"See our Products" link navigates to /products', async ({ pricingPage, page }) => {
    await pricingPage.navigateToProducts()
    await expect(page).toHaveURL('/products')
  })

  test('"contact sales" link has the correct mailto href', async ({ pricingPage }) => {
    await expect(pricingPage.contactSalesLink).toBeVisible()
    await expect(pricingPage.contactSalesLink).toHaveAttribute('href', 'mailto:support@TravalPass.com')
  })
})
