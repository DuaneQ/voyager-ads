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
  })

  describe('StepReview integration', () => {
    it('renders the Ad Preview section on the review step', async () => {
      // Lazy import to avoid circular issues with StepReview
      const { default: StepReview } = await import('../../../components/campaign/StepReview')
      const { vi } = await import('vitest')
      render(<StepReview draft={EMPTY_DRAFT} patch={vi.fn()} />)
      expect(screen.getByText('Ad Preview')).toBeInTheDocument()
    })
  })
})
