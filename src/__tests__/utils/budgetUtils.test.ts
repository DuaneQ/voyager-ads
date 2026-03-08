import { describe, it, expect } from 'vitest'
import { formatBudgetRemaining, budgetRemainingPercent } from '../../utils/budgetUtils'

// ─── formatBudgetRemaining ────────────────────────────────────────────────────

describe('formatBudgetRemaining', () => {
  it('returns "—" when budgetCents is undefined', () => {
    expect(formatBudgetRemaining(undefined)).toBe('—')
  })

  it('formats 0 cents as $0.00', () => {
    expect(formatBudgetRemaining(0)).toBe('$0.00')
  })

  it('formats 1 cent as $0.01', () => {
    expect(formatBudgetRemaining(1)).toBe('$0.01')
  })

  it('formats 4991 cents as $49.91', () => {
    expect(formatBudgetRemaining(4991)).toBe('$49.91')
  })

  it('formats 5000 cents as $50.00', () => {
    expect(formatBudgetRemaining(5000)).toBe('$50.00')
  })

  it('formats 10000 cents as $100.00', () => {
    expect(formatBudgetRemaining(10000)).toBe('$100.00')
  })

  it('formats an odd amount like 1337 cents correctly', () => {
    expect(formatBudgetRemaining(1337)).toBe('$13.37')
  })
})

// ─── budgetRemainingPercent ───────────────────────────────────────────────────

describe('budgetRemainingPercent', () => {
  it('returns null when budgetCents is undefined', () => {
    expect(budgetRemainingPercent(undefined, '50')).toBeNull()
  })

  it('returns null when budgetAmount is not a valid number', () => {
    expect(budgetRemainingPercent(5000, 'bad')).toBeNull()
  })

  it('returns null when budgetAmount is zero', () => {
    expect(budgetRemainingPercent(5000, '0')).toBeNull()
  })

  it('returns null when budgetAmount is an empty string', () => {
    expect(budgetRemainingPercent(5000, '')).toBeNull()
  })

  it('returns 100 when budgetCents equals the full budget', () => {
    expect(budgetRemainingPercent(5000, '50')).toBe(100)
  })

  it('returns 50 when half the budget remains', () => {
    expect(budgetRemainingPercent(2500, '50')).toBe(50)
  })

  it('returns 0 when budgetCents is 0', () => {
    expect(budgetRemainingPercent(0, '50')).toBe(0)
  })

  it('clamps to 0 when budgetCents is negative', () => {
    // Should not normally happen but guard against it
    expect(budgetRemainingPercent(-100, '50')).toBe(0)
  })

  it('clamps to 100 when budgetCents exceeds total (e.g. budget was increased after spend)', () => {
    expect(budgetRemainingPercent(6000, '50')).toBe(100)
  })

  it('reflects a near-depleted budget correctly', () => {
    // 100 cents remaining of 5000 = 2%
    expect(budgetRemainingPercent(100, '50')).toBeCloseTo(2)
  })

  it('works with lifetime budget amounts', () => {
    // $10,000 budget, $9,500 remaining = 95%
    expect(budgetRemainingPercent(950000, '10000')).toBe(95)
  })
})
