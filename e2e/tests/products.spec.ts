import { test, expect } from '../fixtures'

test.describe('Products page', () => {
  test.beforeEach(async ({ productsPage }) => {
    await productsPage.goto()
  })

  // ─── Nav ─────────────────────────────────────────────────────────────────

  test('nav brand link is visible', async ({ productsPage }) => {
    await expect(productsPage.nav.brandLink).toBeVisible()
  })

  test('nav Products link is visible', async ({ productsPage }) => {
    await expect(productsPage.nav.productsLink).toBeVisible()
  })

  test('nav brand link navigates to home', async ({ productsPage, page }) => {
    await productsPage.nav.brandLink.click()
    await expect(page).toHaveURL('/')
  })

  test('nav Pricing link navigates to /pricing', async ({ productsPage, page }) => {
    await productsPage.nav.pricingLink.click()
    await expect(page).toHaveURL('/pricing')
  })

  // ─── Product card headings ────────────────────────────────────────────────

  test('renders all three product card headings', async ({ productsPage }) => {
    await expect(productsPage.itineraryFeedHeading).toBeVisible()
    await expect(productsPage.videoFeedHeading).toBeVisible()
    await expect(productsPage.aiItineraryHeading).toBeVisible()
  })

  test('renders pricing model buttons for each card', async ({ productsPage }) => {
    await expect(productsPage.itineraryPricingBtn).toBeVisible()
    await expect(productsPage.videoPricingBtn).toBeVisible()
    await expect(productsPage.aiPricingBtn).toBeVisible()
  })

  // ─── Itinerary Feed modal ─────────────────────────────────────────────────

  test('Itinerary Feed CPC/CPM button opens pricing definitions dialog', async ({ productsPage }) => {
    await productsPage.openItineraryPricingModal()
    await expect(productsPage.dialog).toBeVisible()
    await expect(productsPage.dialog).toContainText('Pricing definitions')
    await expect(productsPage.dialog).toContainText('Cost Per Click')
    await expect(productsPage.dialog).toContainText('Cost Per Mille')
  })

  test('Itinerary Feed modal closes via close button', async ({ productsPage }) => {
    await productsPage.openItineraryPricingModal()
    await productsPage.closeDialog()
    await expect(productsPage.dialog).not.toBeVisible()
  })

  test('Itinerary Feed modal closes via Escape key', async ({ productsPage }) => {
    await productsPage.openItineraryPricingModal()
    await productsPage.dismissDialogWithEscape()
    await expect(productsPage.dialog).not.toBeVisible()
  })

  // ─── Video Feed modal ─────────────────────────────────────────────────────

  test('Video Feed CPV/CPM button opens pricing dialog', async ({ productsPage }) => {
    await productsPage.openVideoPricingModal()
    await expect(productsPage.dialog).toBeVisible()
    await expect(productsPage.dialog).toContainText('Cost Per View')
    await expect(productsPage.dialog).toContainText('Cost Per Mille')
  })

  test('Video Feed modal closes via close button', async ({ productsPage }) => {
    await productsPage.openVideoPricingModal()
    await productsPage.closeDialog()
    await expect(productsPage.dialog).not.toBeVisible()
  })

  // ─── AI Itinerary modal ───────────────────────────────────────────────────

  test('AI Placement CPC/Premium CPM button opens pricing dialog', async ({ productsPage }) => {
    await productsPage.openAiPricingModal()
    await expect(productsPage.dialog).toBeVisible()
    await expect(productsPage.dialog).toContainText('Cost Per Click')
  })

  test('AI modal closes via close button', async ({ productsPage }) => {
    await productsPage.openAiPricingModal()
    await productsPage.closeDialog()
    await expect(productsPage.dialog).not.toBeVisible()
  })

  // ─── Creative specs ───────────────────────────────────────────────────────

  test('renders the Creative specs section with all spec cards', async ({ productsPage }) => {
    await expect(productsPage.creativeSpecsHeading).toBeVisible()
    await expect(productsPage.imageAdSpecHeading).toBeVisible()
    await expect(productsPage.videoAdSpecHeading).toBeVisible()
    await expect(productsPage.nativeAiSpecHeading).toBeVisible()
  })

  // ─── Footer link ──────────────────────────────────────────────────────────

  test('footer Pricing link navigates to /pricing', async ({ productsPage, page }) => {
    await productsPage.pricingFooterLink.click()
    await expect(page).toHaveURL('/pricing')
  })
})
