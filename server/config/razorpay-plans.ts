/**
 * Razorpay Plan Configuration
 * Maps our plan IDs to Razorpay pricing in USD (amounts in cents)
 * Note: Configured for USD payments
 */

export interface RazorpayPlanConfig {
  planId: string;
  amount: number; // in cents (USD)
  currency: string;
  interval: "monthly" | "annual";
  name: string;
  description: string;
}

export const RAZORPAY_PLANS: Record<string, RazorpayPlanConfig> = {
  // B2C Plans - USD
  individual_monthly: {
    planId: "individual_monthly",
    amount: 799, // $7.99 (in cents)
    currency: "USD",
    interval: "monthly",
    name: "Individual Monthly",
    description: "Individual plan - Monthly billing",
  },
  individual_annual: {
    planId: "individual_annual",
    amount: 7992, // $79.92 ($6.66/month - save $16.68/year)
    currency: "USD",
    interval: "annual",
    name: "Individual Annual",
    description: "Individual plan - Annual billing (Save $16.68/year)",
  },
  family_monthly: {
    planId: "family_monthly",
    amount: 1299, // $12.99 (in cents)
    currency: "USD",
    interval: "monthly",
    name: "Family Monthly",
    description: "Family plan - Monthly billing",
  },
  family_annual: {
    planId: "family_annual",
    amount: 12996, // $129.96 ($10.83/month - save $26.04/year)
    currency: "USD",
    interval: "annual",
    name: "Family Annual",
    description: "Family plan - Annual billing (Save $26.04/year)",
  },
  
  // B2B Plans - Domestic (INR)
  starter_monthly: {
    planId: "starter_monthly",
    amount: 119900, // ₹1,199 (in paise)
    currency: "INR",
    interval: "monthly",
    name: "Starter Monthly",
    description: "Starter plan for professionals - Monthly billing",
  },
  starter_annual: {
    planId: "starter_annual",
    amount: 1199000, // ₹11,990 (₹999/month)
    currency: "INR",
    interval: "annual",
    name: "Starter Annual",
    description: "Starter plan for professionals - Annual billing (Save ₹2,398/year)",
  },
  growth_monthly: {
    planId: "growth_monthly",
    amount: 319900, // ₹3,199 (in paise)
    currency: "INR",
    interval: "monthly",
    name: "Growth Monthly",
    description: "Growth plan for professionals - Monthly billing",
  },
  growth_annual: {
    planId: "growth_annual",
    amount: 3199000, // ₹31,990 (₹2,666/month)
    currency: "INR",
    interval: "annual",
    name: "Growth Annual",
    description: "Growth plan for professionals - Annual billing (Save ₹7,798/year)",
  },
  professional_monthly: {
    planId: "professional_monthly",
    amount: 319900, // ₹3,199 (in paise)
    currency: "INR",
    interval: "monthly",
    name: "Professional Monthly",
    description: "Professional plan - Monthly billing",
  },
  professional_annual: {
    planId: "professional_annual",
    amount: 3199000, // ₹31,990 (₹2,666/month)
    currency: "INR",
    interval: "annual",
    name: "Professional Annual",
    description: "Professional plan - Annual billing (Save ₹7,798/year)",
  },
  enterprise_monthly: {
    planId: "enterprise_monthly",
    amount: 639900, // ₹6,399 (in paise)
    currency: "INR",
    interval: "monthly",
    name: "Enterprise Monthly",
    description: "Enterprise plan - Monthly billing",
  },
  enterprise_annual: {
    planId: "enterprise_annual",
    amount: 6399000, // ₹63,990 (₹5,333/month)
    currency: "INR",
    interval: "annual",
    name: "Enterprise Annual",
    description: "Enterprise plan - Annual billing (Save ₹15,798/year)",
  },
};

/**
 * Get plan configuration by plan ID
 */
export function getRazorpayPlan(planId: string): RazorpayPlanConfig | undefined {
  return RAZORPAY_PLANS[planId];
}

/**
 * Get all plans for a specific interval
 */
export function getPlansByInterval(interval: "monthly" | "annual"): RazorpayPlanConfig[] {
  return Object.values(RAZORPAY_PLANS).filter((plan) => plan.interval === interval);
}

/**
 * Convert plan ID from our format to Razorpay format
 * e.g., "individual" + "monthly" -> "individual_monthly"
 */
export function buildPlanId(basePlanId: string, interval: "monthly" | "annual"): string {
  return `${basePlanId}_${interval}`;
}

