/**
 * DestinationAutocomplete tests
 *
 * VITE_GOOGLE_MAPS_API_KEY is not set in the test environment, so the
 * component always renders in degraded mode (plain TextField). This is the
 * expected behaviour for CI and local development without a key.
 */
import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { render } from '../../../testUtils/test-utils'
import DestinationAutocomplete from '../../../components/common/DestinationAutocomplete'

describe('DestinationAutocomplete (degraded mode — no API key)', () => {
  it('renders a text input with the default label', () => {
    render(<DestinationAutocomplete value="" onSelect={vi.fn()} />)
    expect(screen.getByLabelText(/Target destination/i)).toBeInTheDocument()
  })

  it('renders with a custom label', () => {
    render(<DestinationAutocomplete value="" onSelect={vi.fn()} label="Destination" />)
    expect(screen.getByLabelText(/Destination/i)).toBeInTheDocument()
  })

  it('shows the provided value', () => {
    render(<DestinationAutocomplete value="Paris, France" onSelect={vi.fn()} />)
    expect(screen.getByDisplayValue('Paris, France')).toBeInTheDocument()
  })

  it('calls onSelect with text and empty placeId on change', () => {
    const onSelect = vi.fn()
    render(<DestinationAutocomplete value="" onSelect={onSelect} />)
    fireEvent.change(screen.getByLabelText(/Target destination/i), {
      target: { value: 'Tokyo' },
    })
    expect(onSelect).toHaveBeenCalledWith('Tokyo', '')
  })

  it('renders custom helperText when API key is absent', () => {
    render(<DestinationAutocomplete value="" onSelect={vi.fn()} />)
    expect(screen.getByText(/VITE_GOOGLE_MAPS_API_KEY/i)).toBeInTheDocument()
  })

  it('renders custom helperText prop when provided', () => {
    render(
      <DestinationAutocomplete
        value=""
        onSelect={vi.fn()}
        helperText="Select a city from the list"
      />
    )
    expect(screen.getByText(/Select a city from the list/i)).toBeInTheDocument()
  })

  it('marks the field as required when required prop is true', () => {
    render(<DestinationAutocomplete value="" onSelect={vi.fn()} required />)
    // required inputs have aria-required="true" via MUI
    const input = screen.getByLabelText(/Target destination/i)
    expect(input).toBeRequired()
  })
})
