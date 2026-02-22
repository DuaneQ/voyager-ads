// Minimal, easy-to-import pricing constants for MVP.
// Keep this file intentionally simple so components can `import PRICING_SIMPLE`.
//
// NOTE: Ranges are useful because ad costs vary by targeting, geography,
// creative, seasonality and auction dynamics. We keep arrays for min/max
// so teams can later compute midpoints, floors or apply multipliers.
// For the MVP we expose a single `price` per placement so
// components and Stripe mappings can use a stable value.
// | Placement            | Model | Price          |
// | -------------------- | ----- | -------------- |
// | Video feed           | CPV   | $0.05/view     |
// | Video feed           | CPM   | $22            |
// | Itinerary feed       | CPM   | $25            |
// | Promoted itineraries | CPC   | $2.25          |

/** Billing models supported across all placements. */
export type PricingModel = 'CPC' | 'CPM' | 'CPV'

export const PRICING_SIMPLE = [
  {
    key: 'itineraryFeed',
    title: 'Itinerary Feed',
    models: ['CPC', 'CPM'],
    CPC: [0.3, 1.5],
    CPM: [6, 18],
    price: { CPM: 25 },
    description: 'Best for direct-response placements (bookings, leads) served in itinerary and discovery contexts.',
  },
  {
    key: 'videoFeed',
    title: 'Video Feed',
    models: ['CPV', 'CPM'],
    CPV: [0.01, 0.06],
    CPM: [8, 25],
    description: 'Best for awareness and storytelling alongside user-generated travel videos.',
    // Definitive single-price values to use in the MVP UI / Stripe mapping
    price: { CPV: 0.05, CPM: 22 },
  },
  {
    key: 'aiItinerary',
    title: 'Promoted itineraries',
    models: ['CPC', 'CPM'],
    CPC: [0.5, 3.0],
    CPM: [15, 50],
    description: 'High-intent placements inside generated itineraries. CPC recommended where direct actions matter.',
    price: { CPC: 2.25 },
  },
]

export default PRICING_SIMPLE
