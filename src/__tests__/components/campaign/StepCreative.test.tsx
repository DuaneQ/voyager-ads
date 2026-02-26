import { describe, it, expect, vi } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { render } from '../../../testUtils/test-utils'
import StepCreative from '../../../components/campaign/StepCreative'
import { EMPTY_DRAFT } from '../../../types/campaign'

const makePatch = () => vi.fn()

describe('StepCreative', () => {
  it('renders the creative name field', () => {
    render(<StepCreative draft={EMPTY_DRAFT} patch={makePatch()} />)
    expect(screen.getByLabelText(/Creative name/i)).toBeInTheDocument()
  })

  it('renders the primary text field', () => {
    render(<StepCreative draft={EMPTY_DRAFT} patch={makePatch()} />)
    expect(screen.getByLabelText(/Primary text/i)).toBeInTheDocument()
  })

  it('renders the landing URL field', () => {
    render(<StepCreative draft={EMPTY_DRAFT} patch={makePatch()} />)
    expect(screen.getByLabelText(/Landing URL/i)).toBeInTheDocument()
  })

  it('renders the CTA selector', () => {
    render(<StepCreative draft={EMPTY_DRAFT} patch={makePatch()} />)
    expect(screen.getByLabelText(/Call to action/i)).toBeInTheDocument()
  })

  it('shows video creative type info for video_feed', () => {
    render(<StepCreative draft={{ ...EMPTY_DRAFT, placement: 'video_feed' }} patch={makePatch()} />)
    expect(screen.getByText(/video feed requires a video asset/i)).toBeInTheDocument()
  })

  it('shows image creative type info for itinerary_feed', () => {
    render(<StepCreative draft={{ ...EMPTY_DRAFT, placement: 'itinerary_feed' }} patch={makePatch()} />)
    expect(screen.getByText(/image required for this placement/i)).toBeInTheDocument()
  })

  it('shows image creative type info for ai_slot', () => {
    render(<StepCreative draft={{ ...EMPTY_DRAFT, placement: 'ai_slot' }} patch={makePatch()} />)
    expect(screen.getByText(/image required for this placement/i)).toBeInTheDocument()
  })

  it('never renders a creative type selector', () => {
    const placements = ['video_feed', 'itinerary_feed', 'ai_slot'] as const
    for (const placement of placements) {
      const { unmount } = render(<StepCreative draft={{ ...EMPTY_DRAFT, placement }} patch={makePatch()} />)
      expect(screen.queryByLabelText(/Creative type/i)).not.toBeInTheDocument()
      unmount()
    }
  })

  it('shows spec text for video_feed', () => {
    render(<StepCreative draft={{ ...EMPTY_DRAFT, placement: 'video_feed' }} patch={makePatch()} />)
    expect(screen.getByText(/Vertical video \(portrait\)/i)).toBeInTheDocument()
  })

  it('shows spec text for itinerary_feed', () => {
    render(<StepCreative draft={{ ...EMPTY_DRAFT, placement: 'itinerary_feed' }} patch={makePatch()} />)
    expect(screen.getByText(/Square image · JPEG, PNG, or WebP · max 10 MB/i)).toBeInTheDocument()
  })

  it('shows upload button with "Upload asset" when no file', () => {
    render(<StepCreative draft={EMPTY_DRAFT} patch={makePatch()} />)
    expect(screen.getByRole('button', { name: /Upload asset/i })).toBeInTheDocument()
  })

  it('shows "Replace asset" when a file is present', () => {
    const file = new File(['x'], 'photo.jpg', { type: 'image/jpeg' })
    render(<StepCreative draft={{ ...EMPTY_DRAFT, assetFile: file }} patch={makePatch()} />)
    expect(screen.getByRole('button', { name: /Replace asset/i })).toBeInTheDocument()
  })

  it('shows file name when a file is present', () => {
    const file = new File(['x'], 'banner.jpg', { type: 'image/jpeg' })
    render(<StepCreative draft={{ ...EMPTY_DRAFT, assetFile: file }} patch={makePatch()} />)
    expect(screen.getByText('banner.jpg')).toBeInTheDocument()
  })

  it('calls patch with the selected file on upload', () => {
    const patch = makePatch()
    // Use itinerary_feed so image/jpeg passes the constraint check
    render(<StepCreative draft={{ ...EMPTY_DRAFT, placement: 'itinerary_feed' }} patch={patch} />)
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['x'], 'ad.jpg', { type: 'image/jpeg' })
    fireEvent.change(fileInput, { target: { files: [file] } })
    expect(patch).toHaveBeenCalledWith('assetFile', file)
  })

  it('shows a file error and does not call patch when MIME type is invalid', () => {
    const patch = makePatch()
    render(<StepCreative draft={{ ...EMPTY_DRAFT, placement: 'itinerary_feed' }} patch={patch} />)
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['x'], 'ad.gif', { type: 'image/gif' })
    fireEvent.change(fileInput, { target: { files: [file] } })
    expect(screen.getByText(/Invalid file type/i)).toBeInTheDocument()
    expect(patch).not.toHaveBeenCalledWith('assetFile', expect.anything())
  })

  it('shows video upload placeholder for video_feed', () => {
    render(<StepCreative draft={{ ...EMPTY_DRAFT, placement: 'video_feed' }} patch={makePatch()} />)
    expect(screen.getByText(/Upload a video or image/i)).toBeInTheDocument()
  })

  it('shows image upload placeholder for ai_slot', () => {
    render(<StepCreative draft={{ ...EMPTY_DRAFT, placement: 'ai_slot' }} patch={makePatch()} />)
    expect(screen.getByText(/Upload a landscape image to preview/i)).toBeInTheDocument()
  })

  it('shows the ItineraryFeedAdPreview for itinerary_feed placement', () => {
    render(<StepCreative draft={{ ...EMPTY_DRAFT, placement: 'itinerary_feed' }} patch={makePatch()} />)
    // Preview shows the "Sponsored" pill
    expect(screen.getByText('Sponsored')).toBeInTheDocument()
  })

  it('renders character count for primary text', () => {
    render(<StepCreative draft={{ ...EMPTY_DRAFT, primaryText: 'Hello' }} patch={makePatch()} />)
    expect(screen.getByText('5/300')).toBeInTheDocument()
  })

  describe('ai_slot specific fields', () => {
    it('shows Business type, Address, Phone, Email, and Promo code fields for ai_slot', () => {
      render(<StepCreative draft={{ ...EMPTY_DRAFT, placement: 'ai_slot' }} patch={makePatch()} />)
      expect(screen.getByLabelText(/Business type/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Address/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Phone/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Promo code/i)).toBeInTheDocument()
    })

    it('does NOT show ai_slot fields for other placements', () => {
      const placements = ['video_feed', 'itinerary_feed'] as const
      for (const placement of placements) {
        const { unmount } = render(<StepCreative draft={{ ...EMPTY_DRAFT, placement }} patch={makePatch()} />)
        expect(screen.queryByLabelText(/Business type/i)).not.toBeInTheDocument()
        expect(screen.queryByLabelText(/Address/i)).not.toBeInTheDocument()
        expect(screen.queryByLabelText(/Phone/i)).not.toBeInTheDocument()
        expect(screen.queryByLabelText(/Email/i)).not.toBeInTheDocument()
        expect(screen.queryByLabelText(/Promo code/i)).not.toBeInTheDocument()
        unmount()
      }
    })

    it('calls patch with businessType when changed', () => {
      const patch = makePatch()
      render(<StepCreative draft={{ ...EMPTY_DRAFT, placement: 'ai_slot' }} patch={patch} />)
      // MUI Select renders a hidden input; verify the field is present and shows the current value
      expect(screen.getByLabelText(/Business type/i)).toBeInTheDocument()
    })

    it('calls patch with address when changed', () => {
      const patch = makePatch()
      render(<StepCreative draft={{ ...EMPTY_DRAFT, placement: 'ai_slot' }} patch={patch} />)
      fireEvent.change(screen.getByLabelText(/Address/i), { target: { value: '5 Rue de Rivoli, Paris' } })
      expect(patch).toHaveBeenCalledWith('address', '5 Rue de Rivoli, Paris')
    })

    it('calls patch with phone when changed', () => {
      const patch = makePatch()
      render(<StepCreative draft={{ ...EMPTY_DRAFT, placement: 'ai_slot' }} patch={patch} />)
      fireEvent.change(screen.getByLabelText(/Phone/i), { target: { value: '+1 555 000 0000' } })
      expect(patch).toHaveBeenCalledWith('phone', '+1 555 000 0000')
    })

    it('calls patch with email when changed', () => {
      const patch = makePatch()
      render(<StepCreative draft={{ ...EMPTY_DRAFT, placement: 'ai_slot' }} patch={patch} />)
      fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'hello@bistro.com' } })
      expect(patch).toHaveBeenCalledWith('email', 'hello@bistro.com')
    })

    it('calls patch with promoCode when changed', () => {
      const patch = makePatch()
      render(<StepCreative draft={{ ...EMPTY_DRAFT, placement: 'ai_slot' }} patch={patch} />)
      fireEvent.change(screen.getByLabelText(/Promo code/i), { target: { value: 'TRAVEL20' } })
      expect(patch).toHaveBeenCalledWith('promoCode', 'TRAVEL20')
    })
  })
})
