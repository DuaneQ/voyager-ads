import { type Page, type Locator } from '@playwright/test'
import { NavComponent } from './NavComponent'

/**
 * LandingPage encapsulates all locators and actions for the home route (/).
 * Keeps selectors in one place so specs stay readable and resilient to UI changes.
 */
export class LandingPage {
  readonly page: Page
  readonly nav: NavComponent

  // ─── Features section ────────────────────────────────────────────────────
  readonly featuresHeading: Locator
  readonly featureCards: Locator

  // ─── TravalPass power section ─────────────────────────────────────────────
  readonly powerSectionHeading: Locator

  // ─── Questions section ────────────────────────────────────────────────────
  readonly questionsHeading: Locator
  readonly howAdsWorkButton: Locator
  readonly helpMyBusinessButton: Locator

  // ─── Dialog ───────────────────────────────────────────────────────────────
  readonly dialog: Locator
  readonly dialogCloseButton: Locator

  // ─── FAQ ──────────────────────────────────────────────────────────────────
  readonly faqSection: Locator
  readonly faqButtonTypes: Locator
  readonly faqButtonReach: Locator
  readonly faqAnswerTypes: Locator
  readonly faqAnswerReach: Locator

  // ─── Footer ───────────────────────────────────────────────────────────────
  readonly footer: Locator

  constructor(page: Page) {
    this.page = page
    this.nav = new NavComponent(page)

    this.featuresHeading = page.getByRole('heading', { name: 'Achieve all your goals in one place' })
    this.featureCards = page.locator('section.features .feature')

    this.powerSectionHeading = page.getByRole('heading', {
      name: 'The power of TravalPass Ads, for your business',
    })

    this.questionsHeading = page.getByRole('heading', { name: 'Questions?' })
    this.howAdsWorkButton = page.getByText('How do TravalPass Ads work?')
    this.helpMyBusinessButton = page.getByText('How can TravalPass Ads help my business?')

    this.dialog = page.getByRole('dialog')
    this.dialogCloseButton = page.getByLabel('Close')

    this.faqSection = page.locator('section.faq-section')
    this.faqButtonTypes = page.getByRole('button', { name: /What are the different types/ })
    this.faqButtonReach = page.getByRole('button', { name: /How can I use TravalPass Ads to reach/ })
    this.faqAnswerTypes = page.getByText(/TravalMatch \(swipe\) placements/)
    this.faqAnswerReach = page.getByText(/TravalPass helps you reach travelers/)

    this.footer = page.locator('footer')
  }

  async goto() {
    await this.page.goto('/')
  }

  async openHowAdsWorkModal() {
    await this.howAdsWorkButton.click()
  }

  async openHelpMyBusinessModal() {
    await this.helpMyBusinessButton.click()
  }

  async closeDialog() {
    await this.dialogCloseButton.click()
  }

  async toggleFaqTypes() {
    await this.faqButtonTypes.click()
  }

  async toggleFaqReach() {
    await this.faqButtonReach.click()
  }
}
