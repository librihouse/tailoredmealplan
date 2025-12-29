/**
 * Plans Service
 * Fetches subscription plans from database with fallback to hardcoded plans
 */

import { supabaseAdmin, supabase } from "../supabase";
import { B2C_PLANS, type Plan, type PlanId } from "@shared/plans";

// Use admin client if available, otherwise fallback to regular client
const getSupabaseClient = () => supabaseAdmin || supabase;

export interface DatabasePlan {
  id: string;
  name: string;
  description: string | null;
  category: 'b2c' | 'b2b';
  price_monthly: number;
  price_annual: number;
  limits: {
    clients: number;
    weeklyPlans: number;
    monthlyPlans: number;
    teamSeats: number;
    monthlyCredits: number;
  };
  features: Record<string, boolean>;
  support: string;
  cta: string | null;
  popular: boolean;
  is_active: boolean;
  sort_order: number;
}

/**
 * Convert database plan to shared Plan format
 */
function convertDatabasePlanToPlan(dbPlan: DatabasePlan): Plan {
  return {
    id: dbPlan.id as PlanId,
    name: dbPlan.name,
    description: dbPlan.description || '',
    price: {
      monthly: dbPlan.price_monthly,
      annual: dbPlan.price_annual,
    },
    limits: dbPlan.limits,
    features: dbPlan.features,
    support: dbPlan.support as Plan['support'],
    cta: dbPlan.cta || 'Get Started',
    popular: dbPlan.popular,
  };
}

/**
 * Fetch all active plans from database
 */
export async function getPlans(category?: 'b2c' | 'b2b'): Promise<Plan[]> {
  const dbClient = getSupabaseClient();
  
  if (!dbClient) {
    // Fallback to hardcoded plans if database is unavailable
    console.warn("Database client not available, using hardcoded plans");
    return getHardcodedPlans(category);
  }

  try {
    let query = dbClient
      .from('plans')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching plans from database:", error);
      return getHardcodedPlans(category);
    }

    if (!data || data.length === 0) {
      console.warn("No plans found in database, using hardcoded plans");
      return getHardcodedPlans(category);
    }

    return data.map(convertDatabasePlanToPlan);
  } catch (error) {
    console.error("Exception fetching plans from database:", error);
    return getHardcodedPlans(category);
  }
}

/**
 * Get a single plan by ID
 */
export async function getPlan(planId: string): Promise<Plan | null> {
  const dbClient = getSupabaseClient();
  
  if (!dbClient) {
    // Fallback to hardcoded plan
    return B2C_PLANS[planId as PlanId] || null;
  }

  try {
    const { data, error } = await dbClient
      .from('plans')
      .select('*')
      .eq('id', planId)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      // Fallback to hardcoded plan
      return B2C_PLANS[planId as PlanId] || null;
    }

    return convertDatabasePlanToPlan(data as DatabasePlan);
  } catch (error) {
    console.error("Exception fetching plan from database:", error);
    return B2C_PLANS[planId as PlanId] || null;
  }
}

/**
 * Get plan limits for a specific plan
 */
export async function getPlanLimits(planId: string): Promise<Plan['limits'] | null> {
  const plan = await getPlan(planId);
  return plan?.limits || null;
}

/**
 * Fallback: Get hardcoded plans
 */
function getHardcodedPlans(category?: 'b2c' | 'b2b'): Plan[] {
  if (category === 'b2c') {
    return [
      B2C_PLANS.free,
      B2C_PLANS.individual,
      B2C_PLANS.family,
    ];
  } else if (category === 'b2b') {
    return []; // No B2B plans in simplified structure
  } else {
    return [
      B2C_PLANS.free,
      B2C_PLANS.individual,
      B2C_PLANS.family,
    ];
  }
}

