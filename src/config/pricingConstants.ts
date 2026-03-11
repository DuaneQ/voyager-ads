// Pricing constants aligned with the backend billing rates in logAdEvents.ts.
//
// | Placement            | Model | Price                |
// | -------------------- | ----- | -------------------- |
// | Video feed           | CPM   | $5 per 1,000 impr.   |
// | Itinerary feed       | CPM   | $5 per 1,000 impr.   |
// | Itinerary feed       | CPC   | $0.50 per click      |
// | AI itinerary slot    | CPM   | $5 per 1,000 impr.   |
// | AI itinerary slot    | CPC   | $0.50 per click      |
//
// CPC impression floor: all CPC campaigns are charged a $0.50 / 1,000 impression
// floor in addition to the per-click charge. This prevents indefinite free
// brand-awareness delivery when click-through rate is zero.
export const CPC_IMPRESSION_FLOOR_CPM = 0.50 // $0.50 per 1,000 impressions

/** Billing models supported across all placements. */
export type PricingModel = 'CPC' | 'CPM'

export const PRICING_SIMPLE = [
  {
    key: 'itineraryFeed',
    title: 'Itinerary Feed',
    models: ['CPM', 'CPC'],
    description: 'Best for direct-response placements (bookings, leads) served in itinerary and discovery contexts.',
    price: { CPM: 5, CPC: 0.50 },
  },
  {
    key: 'videoFeed',
    title: 'Video Feed',
    models: ['CPM'],
    description: 'Best for awareness and storytelling alongside user-generated travel videos.',
    price: { CPM: 5 },
  },
  {
    key: 'aiItinerary',
    title: 'AI Itinerary Slot',
    models: ['CPM', 'CPC'],
    description: 'High-intent placements inside AI-generated itineraries. CPC recommended where direct actions matter.',
    price: { CPM: 5, CPC: 0.50 },
  },
]

export default PRICING_SIMPLE
