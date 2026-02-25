import { describe, expect, it } from 'vitest'
import { normalizeDestination, destinationsMatch } from '../../utils/locationUtils'

describe('normalizeDestination', () => {
  it('lowercases the string', () => {
    expect(normalizeDestination('PARIS')).toBe('paris')
  })

  it('trims leading and trailing whitespace', () => {
    expect(normalizeDestination('  Tokyo  ')).toBe('tokyo')
  })

  it('strips country suffix', () => {
    expect(normalizeDestination('Paris, France')).toBe('paris')
  })

  it('strips state and country suffix (two commas)', () => {
    expect(normalizeDestination('New York, NY, USA')).toBe('new york')
  })

  it('strips three-level suffix', () => {
    expect(normalizeDestination('Paris, Île-de-France, France')).toBe('paris')
  })

  it('strips parentheticals', () => {
    expect(normalizeDestination('Bangkok (Krung Thep)')).toBe('bangkok')
  })

  it('collapses multiple spaces', () => {
    expect(normalizeDestination('New   York City')).toBe('new york city')
  })

  it('handles empty string', () => {
    expect(normalizeDestination('')).toBe('')
  })

  it('handles city with no suffix', () => {
    expect(normalizeDestination('Sydney')).toBe('sydney')
  })

  it('multi-word city name with full country', () => {
    expect(normalizeDestination('New York City, NY, USA')).toBe('new york city')
  })
})

describe('destinationsMatch', () => {
  it('matches identical city names', () => {
    expect(destinationsMatch('Paris', 'Paris')).toBe(true)
  })

  it('matches Paris against Paris, France', () => {
    expect(destinationsMatch('Paris', 'Paris, France')).toBe(true)
  })

  it('matches Paris, France against Paris, Île-de-France, France', () => {
    expect(destinationsMatch('Paris, France', 'Paris, Île-de-France, France')).toBe(true)
  })

  it('matches case-insensitively', () => {
    expect(destinationsMatch('new york', 'New York, NY, USA')).toBe(true)
  })

  it('does NOT match different cities', () => {
    expect(destinationsMatch('Tokyo', 'London')).toBe(false)
  })

  it('does NOT match empty strings', () => {
    expect(destinationsMatch('', '')).toBe(false)
  })

  it('same normalised name but different place IDs → no match', () => {
    expect(
      destinationsMatch('Paris', 'Paris', 'place_paris_france', 'place_paris_texas')
    ).toBe(false)
  })

  it('same normalised name and same place IDs → match', () => {
    expect(
      destinationsMatch('Paris', 'Paris, France', 'place_paris_france', 'place_paris_france')
    ).toBe(true)
  })

  it('place ID match overrides slightly different names → match', () => {
    expect(
      destinationsMatch('NYC', 'New York City', 'place_nyc_id', 'place_nyc_id')
    ).toBe(true)
  })

  it('name match with only one side having place ID → match (no contradiction)', () => {
    expect(
      destinationsMatch('Tokyo', 'Tokyo, Japan', 'place_tokyo', undefined)
    ).toBe(true)
  })

  it('name match, neither side has place ID → match', () => {
    expect(
      destinationsMatch('Sydney', 'Sydney, New South Wales, Australia')
    ).toBe(true)
  })
})
