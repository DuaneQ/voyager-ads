/**
 * DestinationAutocomplete tests
 *
 * Two suites:
 *  1. Degraded mode — no API key set (default in CI/dev).
 *  2. SDK-loaded mode — API key stubbed, Loader mocked, google.maps global stubbed.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, fireEvent, waitFor, act } from '@testing-library/react'
import { render } from '../../../testUtils/test-utils'
import DestinationAutocomplete, { __resetGoogleMapsLoader__ } from '../../../components/common/DestinationAutocomplete'

// ─── Hoisted mocks (must exist before vi.mock factory runs) ──────────────────

const { mockImportLibrary, mockGetPlacePredictions } = vi.hoisted(() => ({
  mockImportLibrary: vi.fn(),
  mockGetPlacePredictions: vi.fn(),
}))

vi.mock('@googlemaps/js-api-loader', () => ({
  setOptions: vi.fn(),
  importLibrary: mockImportLibrary,
}))

function setupGoogleMock() {
  mockGetPlacePredictions.mockReset()
  mockImportLibrary.mockReset()
  // AutocompleteService must be a regular function — it is invoked with `new`
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function AutocompleteService(this: any) {
    this.getPlacePredictions = mockGetPlacePredictions
  }
  const placesLib = { AutocompleteService, PlacesServiceStatus: { OK: 'OK' } }
  mockImportLibrary.mockResolvedValue(placesLib)
}

// ─── Suite 1: Degraded mode (no API key) ─────────────────────────────────────

describe('DestinationAutocomplete — degraded mode (no API key)', () => {
  beforeEach(() => {
    // Ensure the API key is absent even if .env has VITE_GOOGLE_MAPS_API_KEY set
    vi.stubEnv('VITE_GOOGLE_MAPS_API_KEY', '')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    __resetGoogleMapsLoader__()
  })
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

  it('renders the VITE_GOOGLE_MAPS_API_KEY helper text when key is absent', () => {
    render(<DestinationAutocomplete value="" onSelect={vi.fn()} />)
    expect(screen.getByText(/VITE_GOOGLE_MAPS_API_KEY/i)).toBeInTheDocument()
  })

  it('always shows the "no API key" warning in degraded mode, ignoring custom helperText', () => {
    render(
      <DestinationAutocomplete
        value=""
        onSelect={vi.fn()}
        helperText="Select a city from the list"
      />
    )
    // The warning must be visible so the user knows autocomplete is disabled
    expect(screen.getByText(/VITE_GOOGLE_MAPS_API_KEY/i)).toBeInTheDocument()
    // The custom helperText is intentionally NOT shown in degraded mode
    expect(screen.queryByText(/Select a city from the list/i)).toBeNull()
  })

  it('marks the field as required when required prop is true', () => {
    render(<DestinationAutocomplete value="" onSelect={vi.fn()} required />)
    expect(screen.getByLabelText(/Target destination/i)).toBeRequired()
  })
})

// ─── Suite 2: SDK-loaded mode ─────────────────────────────────────────────────

describe('DestinationAutocomplete — SDK-loaded mode', () => {
  beforeEach(() => {
    setupGoogleMock()
    vi.stubEnv('VITE_GOOGLE_MAPS_API_KEY', 'test-key-123')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    __resetGoogleMapsLoader__()
    vi.resetModules()
  })

  it('shows a disabled loading field while the SDK loads', async () => {
    let resolveImport!: (v: unknown) => void
    mockImportLibrary.mockReturnValue(new Promise(r => { resolveImport = r }))

    render(<DestinationAutocomplete value="" onSelect={vi.fn()} />)

    expect(screen.getByLabelText(/Target destination/i)).toBeDisabled()

    // Resolve so pending promises don't bleed into other tests
    function AutocompleteService(this: any) { this.getPlacePredictions = vi.fn() }
    await act(async () => { resolveImport({ AutocompleteService, PlacesServiceStatus: { OK: 'OK' } }) })
  })

  it('renders the enabled Autocomplete input after the SDK loads', async () => {
    render(<DestinationAutocomplete value="" onSelect={vi.fn()} />)
    await waitFor(() => {
      expect(screen.getByLabelText(/Target destination/i)).not.toBeDisabled()
    })
  })

  it('fetches predictions when the user types 2+ characters', async () => {
    mockGetPlacePredictions.mockImplementation((_, cb) => {
      cb([{ description: 'Tokyo, Japan', place_id: 'ChIJTx-place' }], 'OK')
    })

    render(<DestinationAutocomplete value="" onSelect={vi.fn()} />)
    await waitFor(() => expect(screen.getByLabelText(/Target destination/i)).not.toBeDisabled())

    fireEvent.change(screen.getByLabelText(/Target destination/i), { target: { value: 'To' } })

    await waitFor(() => {
      expect(mockGetPlacePredictions).toHaveBeenCalled()
    }, { timeout: 500 })
  })

  it('calls onSelect with description and placeId when a suggestion is chosen', async () => {
    const onSelect = vi.fn()
    mockGetPlacePredictions.mockImplementation((_, cb) => {
      cb([{ description: 'Tokyo, Japan', place_id: 'ChIJTx-place' }], 'OK')
    })

    render(<DestinationAutocomplete value="" onSelect={onSelect} />)
    await waitFor(() => expect(screen.getByLabelText(/Target destination/i)).not.toBeDisabled())

    fireEvent.change(screen.getByLabelText(/Target destination/i), { target: { value: 'Tok' } })

    await waitFor(() => screen.getByText('Tokyo, Japan'), { timeout: 500 })
    fireEvent.click(screen.getByText('Tokyo, Japan'))

    expect(onSelect).toHaveBeenCalledWith('Tokyo, Japan', 'ChIJTx-place')
  })

  it('calls onSelect with empty placeId while user free-types', async () => {
    const onSelect = vi.fn()
    mockGetPlacePredictions.mockImplementation((_, cb) => cb([], 'ZERO_RESULTS'))

    render(<DestinationAutocomplete value="" onSelect={onSelect} />)
    await waitFor(() => expect(screen.getByLabelText(/Target destination/i)).not.toBeDisabled())

    fireEvent.change(screen.getByLabelText(/Target destination/i), { target: { value: 'Par' } })

    expect(onSelect).toHaveBeenCalledWith('Par', '')
  })
})
