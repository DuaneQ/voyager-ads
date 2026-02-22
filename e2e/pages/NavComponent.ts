import { type Page, type Locator } from '@playwright/test'

/**
 * NavComponent represents the global navigation bar that appears on every page.
 * Encapsulates all nav locators so other page objects can compose it rather
 * than duplicating selectors.
 */
export class NavComponent {
  readonly brandLink: Locator
  readonly productsLink: Locator
  readonly pricingLink: Locator
  readonly getStartedLink: Locator

  constructor(page: Page) {
    const header = page.locator('header')
    this.brandLink = header.getByRole('link', { name: 'TravalPass Ads' })
    this.productsLink = header.getByRole('link', { name: 'Products' })
    this.pricingLink = header.getByRole('link', { name: 'Pricing' })
    this.getStartedLink = header.getByRole('link', { name: 'Get started' })
  }
}
