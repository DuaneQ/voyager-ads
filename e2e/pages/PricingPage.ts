import { type Page, type Locator } from '@playwright/test'
import { NavComponent } from './NavComponent'

/**
 * PricingPage encapsulates locators and actions for /pricing.
 */
export class PricingPage {
  readonly page: Page
  readonly nav: NavComponent

  // ─── Headings ─────────────────────────────────────────────────────────────
  readonly pageHeading: Locator
  readonly introCopy: Locator

  // ─── Placement cards ──────────────────────────────────────────────────────
  readonly itineraryFeedCard: Locator
  readonly videoFeedCard: Locator
  readonly promotedItinerariesCard: Locator

  // ─── Notes section ────────────────────────────────────────────────────────
  readonly notesHeading: Locator
  readonly noteVideoViews: Locator
  readonly noteCpaUnavailable: Locator

  // ─── CTA links ────────────────────────────────────────────────────────────
  readonly seeProductsLink: Locator
  readonly contactSalesLink: Locator

  constructor(page: Page) {
    this.page = page
    this.nav = new NavComponent(page)

    this.pageHeading = page.getByRole('heading', { name: 'Pricing', level: 1 })
    this.introCopy = page.getByText('Current prices per placement are shown below.')

    this.itineraryFeedCard = page.locator('.MuiCard-root').filter({ hasText: 'Itinerary Feed' })
    this.videoFeedCard = page.locator('.MuiCard-root').filter({ hasText: 'Video Feed' })
    this.promotedItinerariesCard = page.locator('.MuiCard-root').filter({ hasText: 'Promoted itineraries' })

    this.notesHeading = page.getByRole('heading', { name: 'Notes' })
    this.noteVideoViews = page.getByText('Video views are counted at ~3s per view by default.')
    this.noteCpaUnavailable = page.getByText('CPA-based billing is not yet available.')

    this.seeProductsLink = page.getByRole('link', { name: 'See our Products' })
    this.contactSalesLink = page.getByRole('link', { name: 'contact sales' })
  }

  async goto() {
    await this.page.goto('/pricing')
  }

  async navigateToProducts() {
    await this.seeProductsLink.click()
  }
}
