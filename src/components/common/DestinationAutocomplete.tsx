/**
 * DestinationAutocomplete
 *
 * MUI Autocomplete backed by the Google Places Autocomplete API.
 * Returns both the human-readable description AND the canonical place_id
 * so callers can store both for robust server-side matching.
 *
 * Graceful degradation: if VITE_GOOGLE_MAPS_API_KEY is not set, falls back
 * to a plain TextField so development and CI environments are unaffected.
 *
 * Usage:
 *   <DestinationAutocomplete
 *     value={draft.targetDestination}
 *     onSelect={(description, placeId) => {
 *       patch('targetDestination', description)
 *       patch('targetPlaceId', placeId)
 *     }}
 *   />
 */

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import MuiAutocomplete from '@mui/material/Autocomplete'
import CircularProgress from '@mui/material/CircularProgress'
import TextField from '@mui/material/TextField'
import { Loader } from '@googlemaps/js-api-loader'

// ─── Types ────────────────────────────────────────────────────────────────────

interface PlaceOption {
  description: string
  placeId: string
}

export interface DestinationAutocompleteProps {
  /** Currently stored destination text */
  value: string
  /** Called when the user selects a suggestion. placeId is '' on free-text entry. */
  onSelect: (description: string, placeId: string) => void
  label?: string
  required?: boolean
  helperText?: string
  placeholder?: string
}

// ─── Singleton loader (one SDK load per page) ─────────────────────────────────

let _loader: Loader | null = null
let _loadPromise: Promise<typeof google> | null = null

function ensureLoaded(): Promise<typeof google> | null {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined
  if (!apiKey) return null

  if (!_loader) {
    _loader = new Loader({ apiKey, version: 'weekly', libraries: ['places'] })
  }
  if (!_loadPromise) {
    _loadPromise = _loader.load()
  }
  return _loadPromise
}

// ─── Component ───────────────────────────────────────────────────────────────

const DestinationAutocomplete: React.FC<DestinationAutocompleteProps> = ({
  value,
  onSelect,
  label = 'Target destination',
  required = false,
  helperText,
  placeholder = 'e.g. Paris, Tokyo, New York',
}) => {
  const [inputValue, setInputValue] = useState(value)
  const [options, setOptions] = useState<PlaceOption[]>([])
  const [loading, setLoading] = useState(false)
  const [sdkReady, setSdkReady] = useState(false)

  const serviceRef = useRef<google.maps.places.AutocompleteService | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync controlled value into local input state
  useEffect(() => {
    setInputValue(value)
  }, [value])

  // Load the Google Maps SDK once
  useEffect(() => {
    const promise = ensureLoaded()
    if (!promise) return // no API key — degraded mode
    promise
      .then(() => {
        serviceRef.current = new google.maps.places.AutocompleteService()
        setSdkReady(true)
      })
      .catch(err => {
        console.error('[DestinationAutocomplete] Failed to load Google Maps SDK:', err)
      })
  }, [])

  const fetchSuggestions = useCallback((input: string) => {
    if (!serviceRef.current || input.trim().length < 2) {
      setOptions([])
      return
    }

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setLoading(true)
      serviceRef.current!.getPlacePredictions(
        { input, types: ['(cities)'] },
        (predictions, status) => {
          setLoading(false)
          if (
            status === google.maps.places.PlacesServiceStatus.OK &&
            predictions
          ) {
            setOptions(
              predictions.map(p => ({
                description: p.description,
                placeId: p.place_id,
              }))
            )
          } else {
            setOptions([])
          }
        }
      )
    }, 250)
  }, [])

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  // ── Degraded mode: no API key set ─────────────────────────────────────────
  if (!import.meta.env.VITE_GOOGLE_MAPS_API_KEY) {
    return (
      <TextField
        label={label}
        required={required}
        value={inputValue}
        placeholder={placeholder}
        onChange={e => {
          setInputValue(e.target.value)
          onSelect(e.target.value, '')
        }}
        helperText={
          helperText ??
          'Add VITE_GOOGLE_MAPS_API_KEY to .env to enable location autocomplete'
        }
        fullWidth
      />
    )
  }

  // ── SDK loading: render an empty disabled field while SDK loads ───────────
  if (!sdkReady) {
    return (
      <TextField
        label={label}
        required={required}
        placeholder={placeholder}
        helperText={helperText}
        disabled
        fullWidth
        InputProps={{
          endAdornment: <CircularProgress size={18} />,
        }}
      />
    )
  }

  // ── Full autocomplete mode ────────────────────────────────────────────────
  return (
    <MuiAutocomplete
      freeSolo
      options={options}
      getOptionLabel={o => (typeof o === 'string' ? o : o.description)}
      filterOptions={x => x} // server-side filtering — don't client-filter
      loading={loading}
      inputValue={inputValue}
      onInputChange={(_, newInput, reason) => {
        setInputValue(newInput)
        if (reason === 'input') {
          fetchSuggestions(newInput)
          // If the user is typing freely (not selecting), clear the stored placeId
          onSelect(newInput, '')
        }
      }}
      onChange={(_, selected) => {
        if (selected && typeof selected !== 'string') {
          // User selected a suggestion from the dropdown
          setInputValue(selected.description)
          setOptions([])
          onSelect(selected.description, selected.placeId)
        }
      }}
      renderInput={params => (
        <TextField
          {...params}
          label={label}
          required={required}
          placeholder={placeholder}
          helperText={helperText}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? <CircularProgress size={18} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
    />
  )
}

export default DestinationAutocomplete
