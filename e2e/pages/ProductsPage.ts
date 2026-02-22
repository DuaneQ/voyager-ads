import { type Page, type Locator } from '@playwright/test'
import { NavComponent } from './NavComponent'

/**
 * ProductsPage encapsulates locators and actions for /products.
 */
export class ProductsPage {
  readonly page: Page
  readonly nav: NavComponent

  // ─── Product cards ───────────────────────────────────────────────────────
  readonly itineraryFeedHeading: Locator
  readonly videoFeedHeading: Locator
  readonly aiItineraryHeading: Locator

  // ─── Pricing model buttons ────────────────────────────────────────────────
  readonly itineraryPricingBtn: Locator
  readonly videoPricingBtn: Locator
  readonly aiPricingBtn: Locator

  // ─── Dialog ───────────────────────────────────────────────────────────────
  readonly dialog: Locator
  readonly dialogCloseButton: Locator

  // ─── Creative specs ───────────────────────────────────────────────────────
  readonly creativeSpecsHeading: Locator
  readonly imageAdSpecHeading: Locator
  readonly videoAdSpecHeading: Locator
  readonly nativeAiSpecHeading: Locator

  // ─── Footer pricing link ──────────────────────────────────────────────────
  readonly pricingFooterLink: Locator

  constructor(page: Page) {
    this.page = page
    this.nav = new NavComponent(page)

    this.itineraryFeedHeading = page.getByRole('heading', { name: 'Itinerary Feed' })
    this.videoFeedHeading = page.getByRole('heading', { name: 'Video Feed' })
    this.aiItineraryHeading = page.getByRole('heading', { name: 'AI Itinerary Placement' })

    this.itineraryPricingBtn = page.getByRole('button', { name: 'CPC / CPM' })
    this.videoPricingBtn = page.getByRole('button', { name: 'CPV / CPM' })
    this.aiPricingBtn = page.getByRole('button', { name: 'CPC / Premium CPM' })

    this.dialog = page.getByRole('dialog')
    this.dialogCloseButton = page.getByLabel('Close')

    this.creativeSpecsHeading = page.getByRole('heading', { name: 'Creative specs' })
    this.imageAdSpecHeading = page.getByRole('heading', { name: 'Image Ad (Itinerary Card)' })
    this.videoAdSpecHeading = page.getByRole('heading', { name: 'Video Ad (Feed)' })
    this.nativeAiSpecHeading = page.getByRole('heading', { name: 'Native AI Item' })

    this.pricingFooterLink = page.getByRole('link', { name: 'Pricing' }).last()
  }

  async goto() {
    await this.page.goto('/products')
  }

  async openItineraryPricingModal() {
    await this.itineraryPricingBtn.click()
  }

  async openVideoPricingModal() {
    await this.videoPricingBtn.click()
  }

  async openAiPricingModal() {
    await this.aiPricingBtn.click()
  }

  async closeDialog() {
    await this.dialogCloseButton.click()
  }

  async dismissDialogWithEscape() {
    await this.page.keyboard.press('Escape')
  }
}
