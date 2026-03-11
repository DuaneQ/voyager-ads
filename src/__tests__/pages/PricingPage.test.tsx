import { describe, it, expect } from 'vitest'
import { render, screen } from '../../testUtils/test-utils'
import PricingPage from '../../pages/PricingPage'
import PRICING_SIMPLE from '../../config/pricingConstants'

describe('PricingPage', () => {
  it('renders the page heading', () => {
    render(<PricingPage />)
    // Use heading role to avoid matching the Nav "Pricing" link
    expect(screen.getByRole('heading', { name: 'Pricing' })).toBeTruthy()
  })

  it('renders a card for every placement in PRICING_SIMPLE', () => {
    render(<PricingPage />)
    PRICING_SIMPLE.forEach((placement) => {
      expect(screen.getByText(placement.title)).toBeTruthy()
    })
  })

  it('renders Itinerary Feed with CPM price ($5 per 1,000 impressions)', () => {
    render(<PricingPage />)
    expect(screen.getAllByText(/\$5.*per 1,000 impressions/).length).toBeGreaterThan(0)
  })

  it('renders Video Feed with CPM price', () => {
    render(<PricingPage />)
    // Video Feed shows CPM at $5
    expect(screen.getByText('Video Feed')).toBeTruthy()
  })

  it('renders AI Itinerary Slot with CPC price ($0.50)', () => {
    render(<PricingPage />)
    expect(screen.getAllByText(/\$0\.5.*per click/).length).toBeGreaterThan(0)
  })

  it('renders the Notes section', () => {
    render(<PricingPage />)
    expect(screen.getByText('Notes')).toBeTruthy()
    expect(screen.getByText(/Video views and completions are tracked/)).toBeTruthy()
  })

  it('renders the contact sales link', () => {
    render(<PricingPage />)
    expect(screen.getByText('contact sales')).toBeTruthy()
  })

  it('renders the See our Products link pointing to /products', () => {
    render(<PricingPage />)
    const link = screen.getByRole('link', { name: /See our Products/i })
    expect(link).toBeTruthy()
    expect(link.getAttribute('href')).toBe('/products')
  })
})
