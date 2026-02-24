/**
 * Tests for src/utils/dateUtils.ts
 *
 * Critical invariant: no function here may shift a date due to UTC conversion.
 * Every test is authored so that running in any timezone should produce the same result.
 */
import { describe, it, expect } from 'vitest'
import { formatDateLocal, todayLocalDate, parseLocalDate, displayDate } from '../../utils/dateUtils'

// ─── formatDateLocal ──────────────────────────────────────────────────────────

describe('formatDateLocal', () => {
  it('formats a mid-year date correctly', () => {
    // new Date(y, m-1, d) — always local, never UTC
    expect(formatDateLocal(new Date(2026, 5, 15))).toBe('2026-06-15')
  })

  it('pads single-digit month and day', () => {
    expect(formatDateLocal(new Date(2026, 0, 5))).toBe('2026-01-05')
  })

  it('handles December 31', () => {
    expect(formatDateLocal(new Date(2025, 11, 31))).toBe('2025-12-31')
  })

  it('handles leap day', () => {
    expect(formatDateLocal(new Date(2024, 1, 29))).toBe('2024-02-29')
  })

  it('never produces a UTC-shifted date', () => {
    // Construct a date whose UTC representation falls on the previous day in UTC-5
    // e.g. local midnight  →  05:00 UTC of the same day
    const local = new Date(2026, 1, 28) // Feb 28, local midnight
    const result = formatDateLocal(local)
    expect(result).toBe('2026-02-28')
    // The UTC representation may differ — that's fine, we only care about local
  })
})

// ─── todayLocalDate ───────────────────────────────────────────────────────────

describe('todayLocalDate', () => {
  it('returns a YYYY-MM-DD string', () => {
    expect(todayLocalDate()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('matches formatDateLocal(new Date())', () => {
    // Both calls are within milliseconds of each other so dates can't differ
    expect(todayLocalDate()).toBe(formatDateLocal(new Date()))
  })
})

// ─── parseLocalDate ───────────────────────────────────────────────────────────

describe('parseLocalDate', () => {
  it('returns a local-timezone date without shifting', () => {
    const d = parseLocalDate('2026-02-28')
    expect(d.getFullYear()).toBe(2026)
    expect(d.getMonth()).toBe(1)   // 0-indexed → February
    expect(d.getDate()).toBe(28)
  })

  it('round-trips with formatDateLocal', () => {
    const strings = ['2026-01-01', '2026-02-28', '2026-12-31', '2024-02-29']
    for (const s of strings) {
      expect(formatDateLocal(parseLocalDate(s))).toBe(s)
    }
  })

  it('strips ISO time portion before parsing', () => {
    const d = parseLocalDate('2026-02-28T00:00:00.000Z')
    expect(d.getFullYear()).toBe(2026)
    expect(d.getMonth()).toBe(1)
    expect(d.getDate()).toBe(28)
  })

  it('returns Invalid Date for empty string', () => {
    expect(isNaN(parseLocalDate('').getTime())).toBe(true)
  })

  it('returns Invalid Date for wrong format', () => {
    expect(isNaN(parseLocalDate('28/02/2026').getTime())).toBe(true)
  })

  it('returns Invalid Date for non-existent day (Feb 30)', () => {
    expect(isNaN(parseLocalDate('2026-02-30').getTime())).toBe(true)
  })

  it('returns Invalid Date for out-of-range month', () => {
    expect(isNaN(parseLocalDate('2026-13-01').getTime())).toBe(true)
  })
})

// ─── displayDate ──────────────────────────────────────────────────────────────

describe('displayDate', () => {
  it('formats a YYYY-MM-DD string for display', () => {
    expect(displayDate('2026-02-28')).toBe('Feb 28, 2026')
  })

  it('strips ISO time/timezone portion before parsing', () => {
    expect(displayDate('2026-02-28T00:00:00.000Z')).toBe('Feb 28, 2026')
  })

  it('returns — for null', () => {
    expect(displayDate(null)).toBe('—')
  })

  it('returns — for undefined', () => {
    expect(displayDate(undefined)).toBe('—')
  })

  it('returns — for empty string', () => {
    expect(displayDate('')).toBe('—')
  })

  it('handles a Firestore Timestamp-like object with seconds', () => {
    // 2026-02-28T00:00:00Z = 1772150400 seconds (UTC)
    const ts = { seconds: 1772150400, nanoseconds: 0 }
    const result = displayDate(ts)
    // Result is locale-dependent but must be a non-empty string
    expect(typeof result).toBe('string')
    expect(result).not.toBe('—')
    expect(result).toMatch(/2026/)
  })

  it('handles a Firestore Timestamp-like object with toDate()', () => {
    const ts = {
      toDate: () => new Date(2026, 1, 28), // local Feb 28
    }
    const result = displayDate(ts)
    expect(result).toMatch(/Feb/)
    expect(result).toMatch(/2026/)
  })

  it('returns — for a non-string non-object value', () => {
    expect(displayDate(12345)).toBe('—')
  })
})
