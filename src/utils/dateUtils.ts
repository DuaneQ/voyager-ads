/**
 * dateUtils.ts
 *
 * Safe date helpers for the campaign wizard.
 *
 * WHY THIS EXISTS
 * ---------------
 * `new Date('2026-02-28')` parses as UTC midnight.  In any timezone behind UTC
 * (Americas, etc.) that renders as 2026-02-27 locally — a one-day shift.
 * `date.toISOString()` has the same bug in the other direction.
 *
 * The fix for WRITE: use `formatDateLocal` (getFullYear/getMonth/getDate, never UTC).
 * The fix for READ:  use `parseLocalDate` (new Date(y, m-1, d) constructor, not
 *                    new Date(string) on a bare YYYY-MM-DD value).
 *
 * All four date fields in CampaignDraft (startDate, endDate, targetTravelStartDate,
 * targetTravelEndDate) are stored as YYYY-MM-DD plain strings — never as
 * Timestamps or ISO strings — which keeps the representation timezone-neutral.
 * When Firebase returns them back, they must go through `displayDate` below
 * rather than `new Date(rawString)`.
 */

// ─── WRITE helpers ────────────────────────────────────────────────────────────

/**
 * Format a Date object as YYYY-MM-DD in the **local** timezone.
 *
 * ✅ Safe for writing to Firebase and for `<input type="date">` values.
 * ❌ Never use `date.toISOString().slice(0, 10)` — that converts to UTC first.
 */
export function formatDateLocal(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Returns today's date as YYYY-MM-DD in the local timezone.
 * Used for `min` constraints on date inputs so past dates are blocked.
 */
export function todayLocalDate(): string {
  return formatDateLocal(new Date())
}

// ─── READ helpers ─────────────────────────────────────────────────────────────

/**
 * Parse a YYYY-MM-DD string as a local-timezone Date (not UTC).
 *
 * @param dateString - e.g. "2026-02-28"
 * @returns Date object in local time, or `Invalid Date` if the input is bad.
 *
 * ✅ Use this whenever converting a stored date string back to a Date object.
 * ❌ Never use `new Date('2026-02-28')` — that parses as UTC midnight and shifts.
 */
export function parseLocalDate(dateString: string): Date {
  if (!dateString || typeof dateString !== 'string') {
    return new Date(NaN)
  }

  // Strip time portion if caller accidentally passes an ISO string
  const dateOnly = dateString.includes('T') ? dateString.split('T')[0] : dateString

  const parts = dateOnly.split('-')
  if (parts.length !== 3) return new Date(NaN)

  const year = Number(parts[0])
  const month = Number(parts[1])
  const day = Number(parts[2])

  if (isNaN(year) || isNaN(month) || isNaN(day)) return new Date(NaN)
  if (month < 1 || month > 12 || day < 1 || day > 31) return new Date(NaN)

  // `new Date(y, m-1, d)` always uses the local timezone — no UTC shift.
  const result = new Date(year, month - 1, day)

  // Reject non-existent calendar days (e.g. Feb 31)
  if (
    result.getFullYear() !== year ||
    result.getMonth() !== month - 1 ||
    result.getDate() !== day
  ) {
    return new Date(NaN)
  }

  return result
}

// ─── DISPLAY helper ───────────────────────────────────────────────────────────

/**
 * Format a Firebase date value (YYYY-MM-DD string, ISO string, or Firestore
 * Timestamp object) for human display, e.g. "Feb 28, 2026".
 *
 * Handles every shape that can come back from Firestore without shifting the date.
 *
 * @param raw - The raw value stored in Firestore
 * @returns A human-readable date string, or "—" for missing/invalid values.
 */
// ─── VALIDATION helpers ───────────────────────────────────────────────────────

/**
 * Returns true if a YYYY-MM-DD date string represents a day strictly before
 * today in the local timezone.
 *
 * String comparison works correctly here because both values are in YYYY-MM-DD
 * format (lexicographic order equals chronological order for ISO dates).
 */
export function isPastDate(dateStr: string): boolean {
  if (!dateStr) return false
  const parsed = parseLocalDate(dateStr)
  if (isNaN(parsed.getTime())) return false
  // Compare as YYYY-MM-DD strings — safe because the format is fixed-width and
  // lexicographic order is identical to chronological order for ISO dates.
  return dateStr < todayLocalDate()
}

export interface TravelDateValidation {
  startError: string | null
  endError: string | null
}

/**
 * Validates a pair of travel date strings (YYYY-MM-DD).
 *
 * Rules:
 *  - Neither date may be in the past.
 *  - endDate, when provided, must be on or after startDate.
 *
 * Returns `null` for each field that has no error.
 */
export function validateTravelDates(
  startDate: string,
  endDate: string
): TravelDateValidation {
  const startError =
    startDate && isPastDate(startDate) ? 'Start date cannot be in the past' : null

  let endError: string | null = null
  if (endDate) {
    if (isPastDate(endDate)) {
      endError = 'End date cannot be in the past'
    } else if (startDate && endDate < startDate) {
      endError = 'End date must be on or after the start date'
    }
  }

  return { startError, endError }
}

// ─── DISPLAY helper ───────────────────────────────────────────────────────────

export function displayDate(raw: unknown): string {
  if (!raw) return '—'

  // Firestore Timestamp: { seconds: number, nanoseconds: number }
  if (
    typeof raw === 'object' &&
    raw !== null &&
    'seconds' in raw &&
    typeof (raw as { seconds: unknown }).seconds === 'number'
  ) {
    const ts = raw as { seconds: number }
    const d = new Date(ts.seconds * 1000)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  // Firestore Timestamp with toDate() method
  if (
    typeof raw === 'object' &&
    raw !== null &&
    typeof (raw as { toDate?: unknown }).toDate === 'function'
  ) {
    const d = (raw as { toDate: () => Date }).toDate()
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  if (typeof raw !== 'string') return '—'

  // Strip ISO time portion before parsing to avoid UTC shift
  const dateOnly = raw.includes('T') ? raw.split('T')[0] : raw

  const parsed = parseLocalDate(dateOnly)
  if (isNaN(parsed.getTime())) return raw // Return as-is if unparseable

  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
