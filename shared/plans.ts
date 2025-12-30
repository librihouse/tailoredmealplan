/**
 * Plan Configuration
 * Defines all subscription plans with their limits and pricing
 */

export type PlanId = 
  | "free" 
  | "individual" 
  | "family";

export type BillingInterval = "monthly" | "annual";

export interface PlanLimits {
  clients: number; // -1 means unlimited
  weeklyPlans: number; // Monthly limit for weekly plans (1-7 days) - kept for backward compatibility
  monthlyPlans: number; // Monthly limit for monthly plans (30 days) - kept for backward compatibility
  teamSeats: number; // -1 means unlimited
  monthlyCredits: number; // Total credits per month
}

export interface PlanFeatures {
  basicWhitelabel?: boolean;
  fullWhitelabel?: boolean;
  completeWhitelabel?: boolean;
  pdfExport?: boolean;
  customBranding?: boolean;
  customDomain?: boolean;
  clientDashboard?: boolean;
  bulkGeneration?: boolean;
  apiAccess?: boolean;
  dedicatedManager?: boolean;
  slaGuarantee?: boolean;
  advancedAnalytics?: boolean;
}

export interface Plan {
  id: PlanId;
  name: string;
  description: string;
  price: {
    monthly: number;
    annual: number; // per month when billed annually
  };
  limits: PlanLimits;
  features: PlanFeatures;
  support: "email" | "priority_email" | "priority" | "dedicated";
  cta: string;
  popular?: boolean;
}

// B2C Plans (Free, Individual & Family)
export const B2C_PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    name: "Free Tier",
    description: "Perfect for trying out personalized nutrition.",
    price: { monthly: 0, annual: 0 },
      limits: {
        clients: 1,
        weeklyPlans: 1, // Lifetime, not monthly
        monthlyPlans: 0,
        teamSeats: 1,
        monthlyCredits: 7, // 1 daily + 1 weekly + 1 monthly (7 credits lifetime) - NOTE: This is lifetime, not monthly reset
      },
    features: {},
    support: "email",
    cta: "Get Started Free",
  },
  individual: {
    id: "individual",
    name: "Individual",
    description: "For dedicated health enthusiasts.",
    price: { monthly: 9.99, annual: 7.40 },
    limits: {
      clients: 1,
      weeklyPlans: 50,
      monthlyPlans: 0,
      teamSeats: 1,
      monthlyCredits: 42, // 30 daily + 4 weekly + 1 monthly (42 credits)
    },
    features: {},
    support: "email",
    cta: "Start 7-Day Trial",
    popular: true,
  },
  family: {
    id: "family",
    name: "Family",
    description: "Perfect for families with up to 5 members. Each member gets 30 daily plans, 4 weekly plans, and 1 monthly plan per month.",
    price: { monthly: 14.99, annual: 12.99 },
    limits: {
      clients: 5,
      weeklyPlans: 20,
      monthlyPlans: 5,
      teamSeats: 5,
      monthlyCredits: 210, // 30 daily + 4 weekly + 1 monthly per member × 5
    },
    features: {},
    support: "email",
    cta: "Choose Family",
    popular: false,
  },
};

/**
 * Get plan by ID
 * Returns hardcoded plan (for backward compatibility)
 * Use getPlanFromDB() from server/services/plans.ts for database-driven plans
 */
export function getPlan(planId: PlanId): Plan {
  return B2C_PLANS[planId];
}

/**
 * Get price for a plan (monthly only for MVP)
 */
export function getPlanPrice(planId: PlanId, interval: BillingInterval = "monthly"): number {
  const plan = getPlan(planId);
  return plan.price.monthly; // Only monthly billing for MVP
}

/**
 * Check if a plan type is B2B (no B2B plans in simplified structure)
 */
export function isB2BPlan(planId: PlanId): boolean {
  return false; // No B2B plans in simplified structure
}

/**
 * Get all B2B plans (deprecated - no B2B plans)
 */
export function getB2BPlans(): Plan[] {
  return []; // No B2B plans
}

/**
 * Get all B2C plans
 */
export function getB2CPlans(): Plan[] {
  return [
    B2C_PLANS.free,
    B2C_PLANS.individual,
    B2C_PLANS.family,
  ];
}

