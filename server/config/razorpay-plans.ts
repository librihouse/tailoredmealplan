/**
 * Razorpay Plan Configuration
 * Maps our plan IDs to Razorpay pricing in USD (amounts in cents)
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
  // B2C Plans
  individual_monthly: {
    planId: "individual_monthly",
    amount: 900, // $9.00
    currency: "USD",
    interval: "monthly",
    name: "Individual Monthly",
    description: "Individual plan - Monthly billing",
  },
  individual_annual: {
    planId: "individual_annual",
    amount: 8900, // $89.00
    currency: "USD",
    interval: "annual",
    name: "Individual Annual",
    description: "Individual plan - Annual billing (Save $19/year)",
  },
  family_monthly: {
    planId: "family_monthly",
    amount: 1900, // $19.00
    currency: "USD",
    interval: "monthly",
    name: "Family Monthly",
    description: "Family plan - Monthly billing",
  },
  family_annual: {
    planId: "family_annual",
    amount: 18900, // $189.00
    currency: "USD",
    interval: "annual",
    name: "Family Annual",
    description: "Family plan - Annual billing (Save $39/year)",
  },
  
  // B2B Plans
  starter_monthly: {
    planId: "starter_monthly",
    amount: 1500, // $15.00
    currency: "USD",
    interval: "monthly",
    name: "Starter Monthly",
    description: "Starter plan for professionals - Monthly billing",
  },
  starter_annual: {
    planId: "starter_annual",
    amount: 14400, // $144.00 ($12/month)
    currency: "USD",
    interval: "annual",
    name: "Starter Annual",
    description: "Starter plan for professionals - Annual billing (Save $36/year)",
  },
  growth_monthly: {
    planId: "growth_monthly",
    amount: 3900, // $39.00
    currency: "USD",
    interval: "monthly",
    name: "Growth Monthly",
    description: "Growth plan for professionals - Monthly billing",
  },
  growth_annual: {
    planId: "growth_annual",
    amount: 37200, // $372.00 ($31/month)
    currency: "USD",
    interval: "annual",
    name: "Growth Annual",
    description: "Growth plan for professionals - Annual billing (Save $96/year)",
  },
  professional_monthly: {
    planId: "professional_monthly",
    amount: 3900, // $39.00
    currency: "USD",
    interval: "monthly",
    name: "Professional Monthly",
    description: "Professional plan - Monthly billing",
  },
  professional_annual: {
    planId: "professional_annual",
    amount: 37200, // $372.00 ($31/month)
    currency: "USD",
    interval: "annual",
    name: "Professional Annual",
    description: "Professional plan - Annual billing (Save $96/year)",
  },
  enterprise_monthly: {
    planId: "enterprise_monthly",
    amount: 7900, // $79.00
    currency: "USD",
    interval: "monthly",
    name: "Enterprise Monthly",
    description: "Enterprise plan - Monthly billing",
  },
  enterprise_annual: {
    planId: "enterprise_annual",
    amount: 75600, // $756.00 ($63/month)
    currency: "USD",
    interval: "annual",
    name: "Enterprise Annual",
    description: "Enterprise plan - Annual billing (Save $192/year)",
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

