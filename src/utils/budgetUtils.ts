/**
 * Budget utility functions.
 *
 * Pure helpers — no side effects, no imports — safe to test in isolation.
 */

/**
 * Format the remaining budget in cents as a USD currency string.
 *
 * @param budgetCents - Current remaining budget in cents. Absent on campaigns
 *   that have never received a chargeable event (first impression/click hasn't
 *   flushed yet).
 * @returns Formatted string e.g. "$49.91", or "—" when cents are unknown.
 */
export function formatBudgetRemaining(budgetCents: number | undefined): string {
  if (typeof budgetCents !== 'number') return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(budgetCents / 100)
}

/**
 * Compute remaining budget as a percentage of the original budget.
 *
 * @param budgetCents - Current remaining budget in cents.
 * @param budgetAmount - Original budget in dollars as a string (e.g. "50").
 * @returns A value in [0, 100], or null when the calculation is not possible
 *   (missing cents, invalid amount, or zero total).
 */
export function budgetRemainingPercent(
  budgetCents: number | undefined,
  budgetAmount: string,
): number | null {
  if (typeof budgetCents !== 'number') return null
  const totalCents = Math.round(parseFloat(budgetAmount) * 100)
  if (!Number.isFinite(totalCents) || totalCents <= 0) return null
  return Math.max(0, Math.min(100, (budgetCents / totalCents) * 100))
}
