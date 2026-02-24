import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { render } from '../../../testUtils/test-utils'
import StepTargeting from '../../../components/campaign/StepTargeting'
import { EMPTY_DRAFT } from '../../../types/campaign'

const makePatch = () => vi.fn()

describe('StepTargeting', () => {
  it('renders the audience name field', () => {
    render(<StepTargeting draft={EMPTY_DRAFT} patch={makePatch()} />)
    expect(screen.getByLabelText(/Audience name/i)).toBeInTheDocument()
  })

  it('renders location and radius fields for non-itinerary-feed placements', () => {
    render(<StepTargeting draft={{ ...EMPTY_DRAFT, placement: 'video_feed' }} patch={makePatch()} />)
    expect(screen.getByLabelText(/Location/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Radius/i)).toBeInTheDocument()
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
})
