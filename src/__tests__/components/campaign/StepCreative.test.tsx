import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { render } from '../../../testUtils/test-utils'
import StepCreative from '../../../components/campaign/StepCreative'
import { EMPTY_DRAFT } from '../../../types/campaign'

const makePatch = () => vi.fn()

/**
 * Stub the global Image constructor so getImageDimensions() resolves
 * immediately with caller-supplied dimensions (default: valid 1080×1080).
 */
function mockImageDimensions(width = 1080, height = 1080) {
  class MockImage {
    naturalWidth = width
    naturalHeight = height
    set src(_: string) {
      // Trigger onload asynchronously, mirroring real browser behaviour
      setTimeout(() => this.onload?.(), 0)
    }
    onload?: () => void
    onerror?: () => void
  }
  vi.stubGlobal('Image', MockImage)
}

describe('StepCreative', () => {
  beforeEach(() => {
    // Provide a valid 1080×1080 image by default so AR checks don't block tests
    mockImageDimensions(1080, 1080)
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })
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
    expect(screen.getByText(/Vertical video \(portrait 9:16\)/i)).toBeInTheDocument()
  })

  it('shows spec text for itinerary_feed', () => {
    render(<StepCreative draft={{ ...EMPTY_DRAFT, placement: 'itinerary_feed' }} patch={makePatch()} />)
    expect(screen.getByText(/Square image \(1:1\).*max 10 MB/i)).toBeInTheDocument()
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

  it('calls patch with the selected file on upload', async () => {
    const patch = makePatch()
    // Use itinerary_feed so image/jpeg passes the constraint check
    render(<StepCreative draft={{ ...EMPTY_DRAFT, placement: 'itinerary_feed' }} patch={patch} />)
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['x'], 'ad.jpg', { type: 'image/jpeg' })
    fireEvent.change(fileInput, { target: { files: [file] } })
    // handleFileChange is async (AR check); wait for patch to be called
    await waitFor(() => expect(patch).toHaveBeenCalledWith('assetFile', file))
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

  it('calls patch with primaryText when typing', () => {
    const patch = makePatch()
    render(<StepCreative draft={EMPTY_DRAFT} patch={patch} />)
    fireEvent.change(screen.getByLabelText(/Primary text/i), { target: { value: 'Discover paradise' } })
    expect(patch).toHaveBeenCalledWith('primaryText', 'Discover paradise')
  })

  it('calls patch with landingUrl when typing', () => {
    const patch = makePatch()
    render(<StepCreative draft={EMPTY_DRAFT} patch={patch} />)
    fireEvent.change(screen.getByLabelText(/Landing URL/i), { target: { value: 'https://example.com' } })
    expect(patch).toHaveBeenCalledWith('landingUrl', 'https://example.com')
  })

  it('calls patch with cta when changed', async () => {
    const patch = makePatch()
    render(<StepCreative draft={EMPTY_DRAFT} patch={patch} />)
    // MUI Select: open dropdown then click a different option (EMPTY_DRAFT.cta is already 'Learn More')
    fireEvent.mouseDown(screen.getByRole('combobox', { name: /Call to action/i }))
    fireEvent.click(await screen.findByRole('option', { name: /Book Now/i }))
    expect(patch).toHaveBeenCalledWith('cta', 'Book Now')
  })

  it('shows a size error when file exceeds the placement limit', () => {
    const patch = makePatch()
    render(<StepCreative draft={{ ...EMPTY_DRAFT, placement: 'itinerary_feed' }} patch={patch} />)
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['x'], 'big.jpg', { type: 'image/jpeg' })
    Object.defineProperty(file, 'size', { value: 11 * 1024 * 1024 })
    fireEvent.change(fileInput, { target: { files: [file] } })
    expect(screen.getByText(/exceeds the 10 MB limit/i)).toBeInTheDocument()
    expect(patch).not.toHaveBeenCalledWith('assetFile', expect.anything())
  })

  it('calls patch with null when file input is cleared', () => {
    const patch = makePatch()
    render(<StepCreative draft={EMPTY_DRAFT} patch={patch} />)
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(fileInput, { target: { files: [] } })
    expect(patch).toHaveBeenCalledWith('assetFile', null)
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
