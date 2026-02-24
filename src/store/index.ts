/**
 * Central re-export for all Zustand stores.
 * Import stores from here rather than their individual files.
 *
 * Usage:
 *   import { useAuthStore, useCampaignStore, useBillingStore } from '../store'
 *
 * For campaign draft types, import from '../types/campaign' — that is the
 * single source of truth and avoids the store being a type proxy.
 */
export { default as useAuthStore } from './authStore'
export { default as useCampaignStore } from './campaignStore'
export { default as useBillingStore } from './billingStore'

export type { User } from './authStore'
export type { BillingStatus } from './billingStore'
