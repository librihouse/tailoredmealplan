/**
 * Plan Configuration
 * Defines all subscription plans with their limits and pricing
 */

export type PlanId = 
  | "free" 
  | "individual" 
  | "family" 
  | "starter" 
  | "growth" 
  | "professional" 
  | "enterprise";

export type BillingInterval = "monthly" | "annual";

export interface PlanLimits {
  clients: number; // -1 means unlimited
  weeklyPlans: number; // Monthly limit for weekly plans (1-7 days)
  monthlyPlans: number; // Monthly limit for monthly plans (30 days)
  teamSeats: number; // -1 means unlimited
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

// B2C Plans (Individual & Family)
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
    },
    features: {},
    support: "email",
    cta: "Get Started Free",
  },
  individual: {
    id: "individual",
    name: "Individual",
    description: "For dedicated health enthusiasts.",
    price: { monthly: 9, annual: 7.4 },
    limits: {
      clients: 1,
      weeklyPlans: 50,
      monthlyPlans: 0,
      teamSeats: 1,
    },
    features: {},
    support: "email",
    cta: "Start 7-Day Trial",
    popular: true,
  },
  family: {
    id: "family",
    name: "Family",
    description: "Healthy habits for the whole house.",
    price: { monthly: 19, annual: 15.75 },
    limits: {
      clients: 5,
      weeklyPlans: 100,
      monthlyPlans: 0,
      teamSeats: 1,
    },
    features: {},
    support: "priority_email",
    cta: "Choose Family",
  },
  // B2B plans below
  starter: {
    id: "starter",
    name: "Starter",
    description: "For solo nutritionists and coaches.",
    price: { monthly: 29, annual: 24 },
    limits: {
      clients: 50,
      weeklyPlans: 80,
      monthlyPlans: 10,
      teamSeats: 1,
    },
    features: {
      basicWhitelabel: true,
      pdfExport: true,
      clientDashboard: true,
    },
    support: "email",
    cta: "Start 14-Day Trial",
  },
  growth: {
    id: "growth",
    name: "Growth",
    description: "For expanding practices.",
    price: { monthly: 49, annual: 39 },
    limits: {
      clients: 150,
      weeklyPlans: 200,
      monthlyPlans: 25,
      teamSeats: 2,
    },
    features: {
      fullWhitelabel: true,
      customBranding: true,
      clientDashboard: true,
    },
    support: "priority_email",
    cta: "Start 14-Day Trial",
  },
  professional: {
    id: "professional",
    name: "Professional",
    description: "For growing clinics and gyms.",
    price: { monthly: 99, annual: 79 },
    limits: {
      clients: 400,
      weeklyPlans: 500,
      monthlyPlans: 60,
      teamSeats: 5,
    },
    features: {
      fullWhitelabel: true,
      customBranding: true,
      bulkGeneration: true,
      apiAccess: true,
    },
    support: "priority",
    cta: "Start 14-Day Trial",
    popular: true,
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    description: "For large organizations.",
    price: { monthly: 199, annual: 159 },
    limits: {
      clients: 1500,
      weeklyPlans: 1500,
      monthlyPlans: 150,
      teamSeats: -1, // unlimited
    },
    features: {
      completeWhitelabel: true,
      customDomain: true,
      dedicatedManager: true,
      slaGuarantee: true,
      advancedAnalytics: true,
      apiAccess: true,
    },
    support: "dedicated",
    cta: "Contact Sales",
  },
};

/**
 * Get plan by ID
 */
export function getPlan(planId: PlanId): Plan {
  return B2C_PLANS[planId];
}

/**
 * Get price for a plan based on billing interval
 */
export function getPlanPrice(planId: PlanId, interval: BillingInterval): number {
  const plan = getPlan(planId);
  return interval === "annual" ? plan.price.annual : plan.price.monthly;
}

/**
 * Check if a plan type is B2B (professional)
 */
export function isB2BPlan(planId: PlanId): boolean {
  return ["starter", "growth", "professional", "enterprise"].includes(planId);
}

/**
 * Get all B2B plans
 */
export function getB2BPlans(): Plan[] {
  return [
    B2C_PLANS.starter,
    B2C_PLANS.growth,
    B2C_PLANS.professional,
    B2C_PLANS.enterprise,
  ];
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

