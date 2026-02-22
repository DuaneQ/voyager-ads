import { test, expect } from '../fixtures'

test.describe('Landing page', () => {
  test.beforeEach(async ({ landingPage }) => {
    await landingPage.goto()
  })

  // ─── Nav ─────────────────────────────────────────────────────────────────

  test('nav brand link is visible', async ({ landingPage }) => {
    await expect(landingPage.nav.brandLink).toBeVisible()
  })

  test('nav brand link navigates to home', async ({ landingPage, page }) => {
    await landingPage.nav.brandLink.click()
    await expect(page).toHaveURL('/')
  })

  test('nav shows Products and Pricing links', async ({ landingPage }) => {
    await expect(landingPage.nav.productsLink).toBeVisible()
    await expect(landingPage.nav.pricingLink).toBeVisible()
  })

  test('nav "Get started" button is visible', async ({ landingPage }) => {
    await expect(landingPage.nav.getStartedLink).toBeVisible()
  })

  // ─── Features section ─────────────────────────────────────────────────────

  test('renders the features section heading', async ({ landingPage }) => {
    await expect(landingPage.featuresHeading).toBeVisible()
  })

  test('renders all five feature cards', async ({ landingPage, page }) => {
    const features = [
      'Maximize bookings and high-quality leads',
      'Increase online bookings and revenue',
      'Drive local visits and in-person bookings',
      'Expand your brand among travelers',
      'Grow app installs and long-term engagement',
    ]
    for (const text of features) {
      await expect(page.getByText(text)).toBeVisible()
    }
  })

  // ─── TravalPass power section ─────────────────────────────────────────────

  test('renders the TravalPass power section heading', async ({ landingPage }) => {
    await expect(landingPage.powerSectionHeading).toBeVisible()
  })

  // ─── Questions section ────────────────────────────────────────────────────

  test('renders the Questions section with both items', async ({ landingPage }) => {
    await expect(landingPage.questionsHeading).toBeVisible()
    await expect(landingPage.howAdsWorkButton).toBeVisible()
    await expect(landingPage.helpMyBusinessButton).toBeVisible()
  })

  test('opens and closes the "How do Ads work" modal', async ({ landingPage }) => {
    await landingPage.openHowAdsWorkModal()
    await expect(landingPage.dialog).toBeVisible()
    await expect(landingPage.dialog).toContainText('How do TravalPass Ads work?')
    await landingPage.closeDialog()
    await expect(landingPage.dialog).not.toBeVisible()
  })

  test('opens and closes the "Help my business" modal', async ({ landingPage }) => {
    await landingPage.openHelpMyBusinessModal()
    await expect(landingPage.dialog).toBeVisible()
    await expect(landingPage.dialog).toContainText('How can TravalPass Ads help my business?')
    await landingPage.closeDialog()
    await expect(landingPage.dialog).not.toBeVisible()
  })

  // ─── FAQ ──────────────────────────────────────────────────────────────────

  test('FAQ answer for first question is hidden by default', async ({ landingPage }) => {
    await expect(landingPage.faqAnswerTypes).toBeHidden()
  })

  test('FAQ answer becomes visible when question is clicked', async ({ landingPage }) => {
    await landingPage.toggleFaqTypes()
    await expect(landingPage.faqAnswerTypes).toBeVisible()
  })

  test('FAQ answer hides again when question is clicked a second time', async ({ landingPage }) => {
    await landingPage.toggleFaqTypes()
    await landingPage.toggleFaqTypes()
    await expect(landingPage.faqAnswerTypes).toBeHidden()
  })

  test('FAQ second question reveals a paragraph answer', async ({ landingPage }) => {
    await landingPage.toggleFaqReach()
    await expect(landingPage.faqAnswerReach).toBeVisible()
  })

  // ─── Footer ───────────────────────────────────────────────────────────────

  test('footer shows the current year', async ({ landingPage }) => {
    const year = new Date().getFullYear().toString()
    await expect(landingPage.footer).toContainText(year)
  })
})
