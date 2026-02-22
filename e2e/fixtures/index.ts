import { test as base } from '@playwright/test'
import { LandingPage } from '../pages/LandingPage'
import { ProductsPage } from '../pages/ProductsPage'
import { PricingPage } from '../pages/PricingPage'

/**
 * Custom fixture that extends Playwright's base `test` with typed page objects.
 * Specs import `{ test, expect }` from here instead of from `@playwright/test`
 * so page objects are automatically constructed and injected per test.
 */
type Fixtures = {
  landingPage: LandingPage
  productsPage: ProductsPage
  pricingPage: PricingPage
}

export const test = base.extend<Fixtures>({
  landingPage: async ({ page }, use) => {
    await use(new LandingPage(page))
  },
  productsPage: async ({ page }, use) => {
    await use(new ProductsPage(page))
  },
  pricingPage: async ({ page }, use) => {
    await use(new PricingPage(page))
  },
})

export { expect } from '@playwright/test'
