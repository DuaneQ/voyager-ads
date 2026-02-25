import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { render } from '../../../testUtils/test-utils'
import CampaignAdPreview from '../../../components/campaign/CampaignAdPreview'
import { EMPTY_DRAFT } from '../../../types/campaign'

describe('CampaignAdPreview', () => {
  describe('itinerary_feed', () => {
    it('renders the itinerary feed preview label', () => {
      render(<CampaignAdPreview draft={{ ...EMPTY_DRAFT, placement: 'itinerary_feed' }} />)
      expect(screen.getByText(/Preview · Itinerary Feed/i)).toBeInTheDocument()
    })

    it('shows the destination when provided', () => {
      render(
        <CampaignAdPreview
          draft={{ ...EMPTY_DRAFT, placement: 'itinerary_feed', targetDestination: 'Bali, Indonesia' }}
        />
      )
      expect(screen.getByText('Bali, Indonesia')).toBeInTheDocument()
    })

    it('shows primary text when provided', () => {
      render(
        <CampaignAdPreview
          draft={{ ...EMPTY_DRAFT, placement: 'itinerary_feed', primaryText: 'Discover paradise' }}
        />
      )
      expect(screen.getByText('Discover paradise')).toBeInTheDocument()
    })

    it('has accessible aria-label', () => {
      render(<CampaignAdPreview draft={{ ...EMPTY_DRAFT, placement: 'itinerary_feed' }} />)
      expect(screen.getByRole('img', { name: /traveler feed/i })).toBeInTheDocument()
    })
  })

  describe('video_feed', () => {
    it('renders the video feed preview label', () => {
      render(<CampaignAdPreview draft={{ ...EMPTY_DRAFT, placement: 'video_feed' }} />)
      expect(screen.getByText(/Preview · Video Feed/i)).toBeInTheDocument()
    })

    it('has accessible aria-label', () => {
      render(<CampaignAdPreview draft={{ ...EMPTY_DRAFT, placement: 'video_feed' }} />)
      expect(screen.getByRole('img', { name: /video feed/i })).toBeInTheDocument()
    })

    it('shows primary text in the overlay', () => {
      render(
        <CampaignAdPreview
          draft={{ ...EMPTY_DRAFT, placement: 'video_feed', primaryText: 'Best surf spots' }}
        />
      )
      expect(screen.getByText('Best surf spots')).toBeInTheDocument()
    })

    it('shows the CTA button', () => {
      render(
        <CampaignAdPreview draft={{ ...EMPTY_DRAFT, placement: 'video_feed', cta: 'Book Now' }} />
      )
      expect(screen.getByText('Book Now')).toBeInTheDocument()
    })
  })

  describe('ai_slot', () => {
    it('renders the AI slot preview label', () => {
      render(<CampaignAdPreview draft={{ ...EMPTY_DRAFT, placement: 'ai_slot' }} />)
      expect(screen.getByText(/Preview · AI Itinerary Slot/i)).toBeInTheDocument()
    })

    it('has accessible aria-label', () => {
      render(<CampaignAdPreview draft={{ ...EMPTY_DRAFT, placement: 'ai_slot' }} />)
      expect(screen.getByRole('img', { name: /AI itinerary slot/i })).toBeInTheDocument()
    })

    it('shows the Sponsored badge', () => {
      render(<CampaignAdPreview draft={{ ...EMPTY_DRAFT, placement: 'ai_slot' }} />)
      expect(screen.getByText('Sponsored')).toBeInTheDocument()
    })

    it('shows the AI Pick badge', () => {
      render(<CampaignAdPreview draft={{ ...EMPTY_DRAFT, placement: 'ai_slot' }} />)
      expect(screen.getByText('AI Pick')).toBeInTheDocument()
    })

    it('shows primary text when provided', () => {
      render(
        <CampaignAdPreview
          draft={{ ...EMPTY_DRAFT, placement: 'ai_slot', primaryText: 'Top winter escapes' }}
        />
      )
      expect(screen.getByText('Top winter escapes')).toBeInTheDocument()
    })


    it('shows the business type chip when set', () => {
      render(
        <CampaignAdPreview
          draft={{ ...EMPTY_DRAFT, placement: 'ai_slot', businessType: 'restaurant' }}
        />
      )
      expect(screen.getByText('restaurant')).toBeInTheDocument()
    })

    it('shows the promo code chip when set', () => {
      render(
        <CampaignAdPreview
          draft={{ ...EMPTY_DRAFT, placement: 'ai_slot', promoCode: 'TRAVEL20' }}
        />
      )
      expect(screen.getByText(/TRAVEL20/)).toBeInTheDocument()
    })

    it('does not show promo chip when promoCode is empty', () => {
      render(<CampaignAdPreview draft={{ ...EMPTY_DRAFT, placement: 'ai_slot', promoCode: '' }} />)
      expect(screen.queryByText(/🏷/)).not.toBeInTheDocument()
    })

    it('shows image upload placeholder when no asset file', () => {
      render(<CampaignAdPreview draft={{ ...EMPTY_DRAFT, placement: 'ai_slot' }} />)
      expect(screen.getByText(/Upload a landscape image to preview/i)).toBeInTheDocument()
    })

    it('shows "No contact info" when address, phone and email are all empty', () => {
      render(<CampaignAdPreview draft={{ ...EMPTY_DRAFT, placement: 'ai_slot', address: '', phone: '', email: '' }} />)
      expect(screen.getByText('No contact info')).toBeInTheDocument()
    })

    it('shows contact details when address, phone and email are provided', () => {
      render(
        <CampaignAdPreview
          draft={{
            ...EMPTY_DRAFT, placement: 'ai_slot',
            address: '1 Beach Rd', phone: '+1 555 0000', email: 'hi@place.com',
          }}
        />
      )
      expect(screen.getByText(/1 Beach Rd/)).toBeInTheDocument()
      expect(screen.getByText(/\+1 555 0000/)).toBeInTheDocument()
      expect(screen.getByText(/hi@place.com/)).toBeInTheDocument()
    })

    it('falls back to "LEARN MORE" when cta is empty', () => {
      render(<CampaignAdPreview draft={{ ...EMPTY_DRAFT, placement: 'ai_slot', cta: '' }} />)
      expect(screen.getByText('LEARN MORE')).toBeInTheDocument()
    })
  })
})
