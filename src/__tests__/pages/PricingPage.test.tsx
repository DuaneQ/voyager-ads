import React from 'react'
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

  it('renders Itinerary Feed with CPM price ($25 per 1,000 impressions)', () => {
    render(<PricingPage />)
    // Use a regex that matches the unique $25 CPM span (Video Feed has $22)
    expect(screen.getByText(/\$25.*per 1,000 impressions/)).toBeTruthy()
  })

  it('renders Video Feed with CPV and CPM prices', () => {
    render(<PricingPage />)
    expect(screen.getByText(/\$0\.05.*per view/)).toBeTruthy()
    // Video Feed CPM is $22 (Itinerary Feed CPM is $25)
    expect(screen.getByText(/\$22.*per 1,000 impressions/)).toBeTruthy()
  })

  it('renders Promoted itineraries with CPC price', () => {
    render(<PricingPage />)
    expect(screen.getByText(/\$2\.25/)).toBeTruthy()
    expect(screen.getByText(/per click/)).toBeTruthy()
  })

  it('renders the Notes section', () => {
    render(<PricingPage />)
    expect(screen.getByText('Notes')).toBeTruthy()
    expect(screen.getByText(/Video views are counted/)).toBeTruthy()
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
