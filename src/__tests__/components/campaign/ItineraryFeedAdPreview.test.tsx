import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { render } from '../../../testUtils/test-utils'
import ItineraryFeedAdPreview from '../../../components/campaign/ItineraryFeedAdPreview'

const baseProps = {
  imageUrl: null,
  destination: 'Paris, France',
  primaryText: 'Best places to stay in Paris',
  cta: 'Book Now',
  advertiserName: 'Acme Travel',
}

describe('ItineraryFeedAdPreview', () => {
  it('renders the Sponsored pill', () => {
    render(<ItineraryFeedAdPreview {...baseProps} />)
    expect(screen.getByText('Sponsored')).toBeInTheDocument()
  })

  it('renders the destination', () => {
    render(<ItineraryFeedAdPreview {...baseProps} />)
    expect(screen.getByText('Paris, France')).toBeInTheDocument()
  })

  it('renders the primary text', () => {
    render(<ItineraryFeedAdPreview {...baseProps} />)
    expect(screen.getByText('Best places to stay in Paris')).toBeInTheDocument()
  })

  it('renders the CTA button', () => {
    render(<ItineraryFeedAdPreview {...baseProps} />)
    // CTA is a disabled button; aria-label includes the cta text
    expect(screen.getByRole('button', { name: /Book Now/i })).toBeInTheDocument()
  })

  it('renders the advertiser name', () => {
    render(<ItineraryFeedAdPreview {...baseProps} />)
    expect(screen.getByText('Acme Travel')).toBeInTheDocument()
  })

  it('defaults advertiserName to "Your business" when not provided', () => {
    render(<ItineraryFeedAdPreview imageUrl={null} />)
    expect(screen.getByText('Your business')).toBeInTheDocument()
  })

  it('defaults cta to "Learn More" when not provided', () => {
    render(<ItineraryFeedAdPreview imageUrl={null} />)
    expect(screen.getByRole('button', { name: /Learn More/i })).toBeInTheDocument()
  })

  it('shows placeholder text when no image uploaded', () => {
    render(<ItineraryFeedAdPreview {...baseProps} imageUrl={null} />)
    expect(screen.getByText(/Upload an image above to preview/i)).toBeInTheDocument()
  })

  it('renders an img element when imageUrl is provided', () => {
    render(<ItineraryFeedAdPreview {...baseProps} imageUrl="blob:fake-url" />)
    expect(screen.getByAltText('Ad creative')).toBeInTheDocument()
  })
})
