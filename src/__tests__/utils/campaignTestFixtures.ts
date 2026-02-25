/**
 * Shared test fixtures for the Campaign Wizard.
 *
 * Used by:
 *  - CampaignWizard.tsx (dev-only "Fill test data" button — tree-shaken in production)
 *  - Any unit/E2E test that needs a fully-populated CampaignDraft
 */
import type { CampaignDraft } from '../../types/campaign'

export const TEST_DRAFT: Partial<CampaignDraft> = {
  name: 'Summer Beach Escape — test campaign',
  placement: 'video_feed',
  objective: 'Awareness',
  startDate: (() => {
    const d = new Date(); d.setDate(d.getDate() + 1)
    return d.toLocaleDateString('en-CA') // YYYY-MM-DD local time
  })(),
  endDate: (() => {
    const d = new Date(); d.setDate(d.getDate() + 31)
    return d.toLocaleDateString('en-CA')
  })(),
  creativeName: 'Beach Escape Hero',
  creativeType: 'image',
  primaryText: 'Discover paradise — book your dream beach getaway today.',
  cta: 'Book Now',
  landingUrl: 'https://example.com/beach-escape',
  audienceName: 'Beach & Leisure Travelers',
  location: 'Miami, FL',
  radius: '50',
  ageFrom: '25',
  ageTo: '44',
  budgetType: 'daily',
  budgetAmount: '50',
  billingModel: 'cpm',
}
