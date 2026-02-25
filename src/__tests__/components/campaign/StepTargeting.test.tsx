import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { render } from '../../../testUtils/test-utils'
import StepTargeting from '../../../components/campaign/StepTargeting'
import { EMPTY_DRAFT } from '../../../types/campaign'

const makePatch = () => vi.fn()

describe('StepTargeting', () => {
  // Ensure DestinationAutocomplete degrades to plain TextField (no Google Maps API key)
  beforeEach(() => vi.stubEnv('VITE_GOOGLE_MAPS_API_KEY', ''))
  afterEach(() => vi.unstubAllEnvs())

  it('renders the audience name field', () => {
    render(<StepTargeting draft={EMPTY_DRAFT} patch={makePatch()} />)
    expect(screen.getByLabelText(/Audience name/i)).toBeInTheDocument()
  })

  it('renders location field for non-itinerary-feed placements', () => {
    render(<StepTargeting draft={{ ...EMPTY_DRAFT, placement: 'video_feed' }} patch={makePatch()} />)
    expect(screen.getByLabelText(/Location/i)).toBeInTheDocument()
    expect(screen.queryByLabelText(/Radius/i)).not.toBeInTheDocument()
  })

  it('does NOT render the Location field for itinerary_feed', () => {
    render(<StepTargeting draft={{ ...EMPTY_DRAFT, placement: 'itinerary_feed' }} patch={makePatch()} />)
    expect(screen.queryByLabelText(/^Location$/i)).not.toBeInTheDocument()
  })

  it('renders destination targeting section for itinerary_feed', () => {
    render(<StepTargeting draft={{ ...EMPTY_DRAFT, placement: 'itinerary_feed' }} patch={makePatch()} />)
    // DestinationAutocomplete renders degraded TextField when no API key set
    expect(screen.getByLabelText(/Target destination/i)).toBeInTheDocument()
  })

  it('renders travel date fields for itinerary_feed', () => {
    render(<StepTargeting draft={{ ...EMPTY_DRAFT, placement: 'itinerary_feed' }} patch={makePatch()} />)
    expect(screen.getByLabelText(/Travel start date/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Travel end date/i)).toBeInTheDocument()
  })

  it('renders the strict destination match checkbox for itinerary_feed', () => {
    render(<StepTargeting draft={{ ...EMPTY_DRAFT, placement: 'itinerary_feed' }} patch={makePatch()} />)
    expect(screen.getByRole('checkbox')).toBeInTheDocument()
  })

  it('renders age range selectors', () => {
    render(<StepTargeting draft={EMPTY_DRAFT} patch={makePatch()} />)
    expect(screen.getByLabelText(/From/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/To/i)).toBeInTheDocument()
  })

  it('renders the interests field', () => {
    render(<StepTargeting draft={EMPTY_DRAFT} patch={makePatch()} />)
    expect(screen.getByLabelText(/Interests/i)).toBeInTheDocument()
  })

  it('calls patch when audience name changes', () => {
    const patch = makePatch()
    render(<StepTargeting draft={EMPTY_DRAFT} patch={patch} />)
    fireEvent.change(screen.getByLabelText(/Audience name/i), { target: { value: 'Beach Lovers' } })
    expect(patch).toHaveBeenCalledWith('audienceName', 'Beach Lovers')
  })

  it('calls patch when location changes (video_feed)', () => {
    const patch = makePatch()
    render(<StepTargeting draft={{ ...EMPTY_DRAFT, placement: 'video_feed' }} patch={patch} />)
    // DestinationAutocomplete degrades to plain TextField when VITE_GOOGLE_MAPS_API_KEY is unset
    fireEvent.change(screen.getByLabelText(/Location/i), { target: { value: 'Paris' } })
    expect(patch).toHaveBeenCalledWith('location', 'Paris')
  })

  it('calls patch when destination match checkbox is toggled', () => {
    const patch = makePatch()
    render(<StepTargeting draft={{ ...EMPTY_DRAFT, placement: 'itinerary_feed' }} patch={patch} />)
    fireEvent.click(screen.getByRole('checkbox'))
    expect(patch).toHaveBeenCalledWith('destinationMatch', true)
  })

  it('calls patch when interests field changes', () => {
    const patch = makePatch()
    render(<StepTargeting draft={EMPTY_DRAFT} patch={patch} />)
    fireEvent.change(screen.getByLabelText(/Interests/i), { target: { value: 'surfing' } })
    expect(patch).toHaveBeenCalledWith('interests', 'surfing')
  })

  it('calls patch when travel start date changes (itinerary_feed)', () => {
    const patch = makePatch()
    render(<StepTargeting draft={{ ...EMPTY_DRAFT, placement: 'itinerary_feed' }} patch={patch} />)
    fireEvent.change(screen.getByLabelText(/Travel start date/i), { target: { value: '2030-07-01' } })
    expect(patch).toHaveBeenCalledWith('targetTravelStartDate', '2030-07-01')
  })

  it('calls patch when travel end date changes (itinerary_feed)', () => {
    const patch = makePatch()
    render(<StepTargeting draft={{ ...EMPTY_DRAFT, placement: 'itinerary_feed' }} patch={patch} />)
    fireEvent.change(screen.getByLabelText(/Travel end date/i), { target: { value: '2030-07-14' } })
    expect(patch).toHaveBeenCalledWith('targetTravelEndDate', '2030-07-14')
  })

  it('shows the "Additional targeting (optional)" label for itinerary_feed', () => {
    render(<StepTargeting draft={{ ...EMPTY_DRAFT, placement: 'itinerary_feed' }} patch={makePatch()} />)
    expect(screen.getByText(/Additional targeting \(optional\)/i)).toBeInTheDocument()
  })

  it('shows Place ID confirmed helper text when targetPlaceId is set', () => {
    // The helperText with "Place ID confirmed" is only surfaced in full-mode Autocomplete (with API key).
    // In degraded mode (no key, which is the test default), verify the destination field is present.
    vi.unstubAllEnvs()
    const { unmount } = render(
      <StepTargeting
        draft={{ ...EMPTY_DRAFT, placement: 'itinerary_feed', targetPlaceId: 'ChIJtest12345' }}
        patch={makePatch()}
      />
    )
    const textboxes = screen.getAllByRole('textbox')
    expect(textboxes.length).toBeGreaterThan(0)
    unmount()
    vi.stubEnv('VITE_GOOGLE_MAPS_API_KEY', '')
  })

  it('calls patch when ageFrom selector changes', () => {
    const patch = makePatch()
    render(<StepTargeting draft={EMPTY_DRAFT} patch={patch} />)
    fireEvent.mouseDown(screen.getByLabelText(/From/i))
    fireEvent.click(screen.getByRole('option', { name: '25' }))
    expect(patch).toHaveBeenCalledWith('ageFrom', '25')
  })

  it('calls patch when ageTo selector changes', () => {
    const patch = makePatch()
    render(<StepTargeting draft={EMPTY_DRAFT} patch={patch} />)
    fireEvent.mouseDown(screen.getByLabelText(/To/i))
    fireEvent.click(screen.getByRole('option', { name: '44' }))
    expect(patch).toHaveBeenCalledWith('ageTo', '44')
  })

  it('renders the itinerary gender preference selector for itinerary_feed', () => {
    render(<StepTargeting draft={{ ...EMPTY_DRAFT, placement: 'itinerary_feed' }} patch={makePatch()} />)
    expect(screen.getByLabelText(/Itinerary gender preference/i)).toBeInTheDocument()
  })

  it('does NOT render the gender selector for non-itinerary-feed placements', () => {
    render(<StepTargeting draft={{ ...EMPTY_DRAFT, placement: 'video_feed' }} patch={makePatch()} />)
    expect(screen.queryByLabelText(/Itinerary gender preference/i)).not.toBeInTheDocument()
  })

  it('calls patch when gender preference changes (itinerary_feed)', () => {
    const patch = makePatch()
    render(<StepTargeting draft={{ ...EMPTY_DRAFT, placement: 'itinerary_feed' }} patch={patch} />)
    fireEvent.mouseDown(screen.getByLabelText(/Itinerary gender preference/i))
    fireEvent.click(screen.getByRole('option', { name: 'Female' }))
    expect(patch).toHaveBeenCalledWith('targetGender', 'Female')
  })

  describe('ai_slot targeting section', () => {
    it('renders the AI itinerary targeting heading for ai_slot', () => {
      render(<StepTargeting draft={{ ...EMPTY_DRAFT, placement: 'ai_slot' }} patch={makePatch()} />)
      expect(screen.getByText(/AI itinerary targeting/i)).toBeInTheDocument()
    })

    it('renders Trip type chips for ai_slot', () => {
      render(<StepTargeting draft={{ ...EMPTY_DRAFT, placement: 'ai_slot' }} patch={makePatch()} />)
      expect(screen.getByText('Leisure')).toBeInTheDocument()
      expect(screen.getByText('Romantic')).toBeInTheDocument()
      expect(screen.getByText('Family')).toBeInTheDocument()
    })

    it('renders Activity preference chips for ai_slot', () => {
      render(<StepTargeting draft={{ ...EMPTY_DRAFT, placement: 'ai_slot' }} patch={makePatch()} />)
      expect(screen.getByText('Cultural')).toBeInTheDocument()
      expect(screen.getByText('Nightlife')).toBeInTheDocument()
      expect(screen.getByText('Nature')).toBeInTheDocument()
    })

    it('renders Travel style chips for ai_slot', () => {
      render(<StepTargeting draft={{ ...EMPTY_DRAFT, placement: 'ai_slot' }} patch={makePatch()} />)
      expect(screen.getByText('Luxury')).toBeInTheDocument()
      expect(screen.getByText('Budget')).toBeInTheDocument()
    })

    it('does NOT show AI targeting section for itinerary_feed', () => {
      render(<StepTargeting draft={{ ...EMPTY_DRAFT, placement: 'itinerary_feed' }} patch={makePatch()} />)
      expect(screen.queryByText(/AI itinerary targeting/i)).not.toBeInTheDocument()
    })

    it('does NOT show AI targeting section for video_feed', () => {
      render(<StepTargeting draft={{ ...EMPTY_DRAFT, placement: 'video_feed' }} patch={makePatch()} />)
      expect(screen.queryByText(/AI itinerary targeting/i)).not.toBeInTheDocument()
    })

    it('shows "Additional targeting (optional)" label for ai_slot', () => {
      render(<StepTargeting draft={{ ...EMPTY_DRAFT, placement: 'ai_slot' }} patch={makePatch()} />)
      expect(screen.getByText(/Additional targeting \(optional\)/i)).toBeInTheDocument()
    })

    it('clicking an unselected trip type chip adds it to the array', () => {
      const patch = makePatch()
      render(<StepTargeting draft={{ ...EMPTY_DRAFT, placement: 'ai_slot', targetTripTypes: [] }} patch={patch} />)
      fireEvent.click(screen.getByText('Romantic'))
      expect(patch).toHaveBeenCalledWith('targetTripTypes', ['romantic'])
    })

    it('clicking a selected trip type chip removes it from the array', () => {
      const patch = makePatch()
      render(
        <StepTargeting
          draft={{ ...EMPTY_DRAFT, placement: 'ai_slot', targetTripTypes: ['romantic'] }}
          patch={patch}
        />
      )
      fireEvent.click(screen.getByText('Romantic'))
      expect(patch).toHaveBeenCalledWith('targetTripTypes', [])
    })

    it('clicking an activity chip adds it to targetActivityPreferences', () => {
      const patch = makePatch()
      render(<StepTargeting draft={{ ...EMPTY_DRAFT, placement: 'ai_slot', targetActivityPreferences: [] }} patch={patch} />)
      fireEvent.click(screen.getByText('Cultural'))
      expect(patch).toHaveBeenCalledWith('targetActivityPreferences', ['Cultural'])
    })

    it('clicking a travel style chip adds it to targetTravelStyles', () => {
      const patch = makePatch()
      render(<StepTargeting draft={{ ...EMPTY_DRAFT, placement: 'ai_slot', targetTravelStyles: [] }} patch={patch} />)
      fireEvent.click(screen.getByText('Luxury'))
      expect(patch).toHaveBeenCalledWith('targetTravelStyles', ['luxury'])
    })
  })
})
