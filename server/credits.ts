/**
 * Credit System Utilities
 * Handles credit costs and calculations for meal plan generation
 */

export type PlanType = "daily" | "weekly" | "monthly";

/**
 * Credit costs for each meal plan type
 * Based on API costs: Daily=$0.001, Weekly=$0.0022, Monthly=$0.0043
 */
export const CREDIT_COSTS = {
  daily: 1,
  weekly: 2,
  monthly: 4,
} as const;

/**
 * Get the number of credits required for a meal plan type
 */
export function getCreditsRequired(planType: PlanType): number {
  return CREDIT_COSTS[planType];
}

/**
 * Calculate total credits for a combination of plans
 */
export function calculateTotalCredits(
  dailyPlans: number,
  weeklyPlans: number,
  monthlyPlans: number
): number {
  return (
    dailyPlans * CREDIT_COSTS.daily +
    weeklyPlans * CREDIT_COSTS.weekly +
    monthlyPlans * CREDIT_COSTS.monthly
  );
}

/**
 * Format credit breakdown for display
 */
export function formatCreditBreakdown(credits: number): string {
  const monthly = Math.floor(credits / CREDIT_COSTS.monthly);
  const weekly = Math.floor((credits % CREDIT_COSTS.monthly) / CREDIT_COSTS.weekly);
  const daily = credits % CREDIT_COSTS.weekly;

  const parts: string[] = [];
  if (monthly > 0) parts.push(`${monthly} monthly`);
  if (weekly > 0) parts.push(`${weekly} weekly`);
  if (daily > 0) parts.push(`${daily} daily`);

  if (parts.length === 0) return "0 plans";
  if (parts.length === 1) return parts[0] + " plan(s)";
  if (parts.length === 2) return parts.join(" OR ");
  return parts.slice(0, -1).join(", ") + " OR " + parts[parts.length - 1];
}

