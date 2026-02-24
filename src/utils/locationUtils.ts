/**
 * locationUtils.ts
 *
 * Utilities for normalizing and comparing destination strings.
 *
 * Matching strategy (used both here and server-side):
 *   1. PRIMARY  — compare normalizedDestination(ad) === normalizedDestination(itinerary)
 *   2. SECONDARY — if both sides have a Google Place ID, use it as a tiebreaker:
 *                  a matching place_id confirms a match, a mismatching one
 *                  rejects an otherwise ambiguous name match (e.g. "Paris, TX" vs "Paris, France").
 *
 * This means:
 *   - An itinerary WITHOUT a place_id can still match via name normalisation.
 *   - Two records that share a place_id but have slightly different display names
 *     will still match (place_id used as fallback confirmation).
 */

/**
 * Normalises a destination string for fuzzy comparison.
 *
 * Rules applied in order:
 *  1. Trim surrounding whitespace
 *  2. Lowercase
 *  3. Drop country / state suffix — everything after the last comma
 *     e.g. "Paris, Île-de-France, France" → "paris"
 *         "New York, NY, USA"            → "new york"
 *  4. Strip parentheticals             e.g. "Bangkok (Krung Thep)" → "bangkok "
 *  5. Collapse multiple spaces and re-trim
 *
 * @example
 *   normalizeDestination("Paris, France")          // "paris"
 *   normalizeDestination("New York City, NY, USA") // "new york city"
 *   normalizeDestination("  TOKYO  ")              // "tokyo"
 */
export function normalizeDestination(raw: string): string {
  if (!raw) return ''

  let s = raw.trim().toLowerCase()

  // Drop everything after the last comma (country / state suffix)
  const lastComma = s.lastIndexOf(',')
  if (lastComma !== -1) {
    // Keep stripping trailing commas until we have a non-trivial city name
    // e.g. "Paris, Île-de-France, France" — strip twice to get "paris"
    let stripped = s.slice(0, lastComma).trim()
    const secondComma = stripped.lastIndexOf(',')
    if (secondComma !== -1) {
      stripped = stripped.slice(0, secondComma).trim()
    }
    s = stripped
  }

  // Remove parentheticals
  s = s.replace(/\(.*?\)/g, '')

  // Collapse whitespace
  s = s.replace(/\s+/g, ' ').trim()

  return s
}

/**
 * Returns true when two destination strings refer to the same place.
 *
 * Comparison is performed on normalised strings (see `normalizeDestination`).
 * When both `placeIdA` and `placeIdB` are provided they are used as a
 * secondary disambiguation signal:
 *   - If names match AND place IDs also match (or either is absent) → true
 *   - If names match BUT place IDs differ                           → false
 *     (prevents "Paris, TX" from matching "Paris, France")
 *   - If names don't match BUT place IDs match                      → true
 *     (display name may differ slightly but canonical ID confirms same place)
 *
 * @param destA      Destination text from ad campaign
 * @param destB      Destination text from user itinerary
 * @param placeIdA   Optional Google Place ID stored on the campaign
 * @param placeIdB   Optional Google Place ID stored on the itinerary
 */
export function destinationsMatch(
  destA: string,
  destB: string,
  placeIdA?: string,
  placeIdB?: string,
): boolean {
  const normA = normalizeDestination(destA)
  const normB = normalizeDestination(destB)

  const bothHavePlaceIds = Boolean(placeIdA && placeIdB)
  const placeIdsMatch = bothHavePlaceIds && placeIdA === placeIdB

  // Confirmed match via canonical ID (even if display names differ slightly)
  if (placeIdsMatch) return true

  // Names match — check place IDs don't actively contradict each other
  if (normA === normB && normA !== '') {
    if (bothHavePlaceIds && !placeIdsMatch) {
      // Same normalised name but different IDs → different places (Paris TX vs FR)
      return false
    }
    return true
  }

  return false
}
