/**
 * Vibe PayOS SDK — Subscription Period Calculator (Deno-compatible)
 *
 * Pure date logic for subscription period end calculation.
 * Mirrors vibe-subscription/billing-period.ts for Deno Edge Functions.
 * Eliminates duplicated period math across webhook handlers.
 */

/**
 * Calculate the subscription period end date from a start date.
 * @param startDate - Period start
 * @param billingCycle - 'monthly' or 'yearly'
 * @returns Period end date
 */
export function computeSubscriptionPeriodEnd(
  startDate: Date,
  billingCycle: string,
): Date {
  const end = new Date(startDate)
  if (billingCycle === 'yearly') {
    end.setFullYear(end.getFullYear() + 1)
  } else {
    end.setMonth(end.getMonth() + 1)
  }
  return end
}
