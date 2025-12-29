/**
 * Quota Management and Checking (Supabase Version)
 * Handles quota validation for meal plan generation using Supabase
 */

import { supabaseAdmin, supabase } from "./supabase";
import { getPlan as getPlanFromShared, type PlanId } from "@shared/plans";
import { getPlan as getPlanFromDB } from "./services/plans";
import { getCreditsRequired, type PlanType } from "./credits";

export type { PlanType };

// Use admin client if available, otherwise fallback to regular client
const getSupabaseClient = () => supabaseAdmin || supabase;

export class QuotaExceededError extends Error {
  constructor(
    message: string,
    public code: "WEEKLY_QUOTA_EXCEEDED" | "MONTHLY_QUOTA_EXCEEDED" | "CLIENT_QUOTA_EXCEEDED" | "CREDITS_EXCEEDED",
    public details: {
      used: number;
      limit: number;
      resetDate: Date;
      creditsRequired?: number;
    }
  ) {
    super(message);
    this.name = "QuotaExceededError";
  }
}

interface PlanUsage {
  id: string;
  user_id: string;
  subscription_id: string | null;
  billing_period_start: string;
  billing_period_end: string;
  weekly_plans_used: number;
  monthly_plans_used: number;
  credits_used?: number; // Credits used this period
  credits_limit?: number; // Credits limit from plan
  credits_purchased?: number; // NEW: Purchased credits from add-ons
  credits_expires_at?: string | null; // NEW: When purchased credits expire
  created_at: string;
  updated_at: string;
}

interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
}

/**
 * Auto-fix subscription with missing billing period dates
 * Returns fixed billing period dates (start, end)
 */
async function fixSubscriptionBillingPeriods(
  subscription: Subscription,
  dbClient: any
): Promise<{ start: string; end: string }> {
  // If billing periods exist, return them
  if (subscription.current_period_start && subscription.current_period_end) {
    return {
      start: subscription.current_period_start,
      end: subscription.current_period_end,
    };
  }

  // Calculate default billing period: current date to 30 days from now
  const now = new Date();
  const defaultStart = now.toISOString();
  const defaultEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days

  // Update subscription with default billing periods
  const { error: updateError } = await dbClient
    .from("subscriptions")
    .update({
      current_period_start: defaultStart,
      current_period_end: defaultEnd,
      updated_at: new Date().toISOString(),
    })
    .eq("id", subscription.id);

  if (updateError) {
    console.error(`Failed to fix subscription billing periods: ${updateError.message}`);
    // Still return the calculated dates even if update fails
  } else {
    console.log(`Auto-fixed subscription ${subscription.id} with default billing periods`);
  }

  return {
    start: defaultStart,
    end: defaultEnd,
  };
}

/**
 * Get current usage for a user in the current billing period
 * Handles both subscribed users and free tier users (no subscription)
 */
export async function getCurrentUsage(
  userId: string
): Promise<PlanUsage | null> {
  const dbClient = getSupabaseClient();
  if (!dbClient) return null;

  // Get active subscription
  const { data: subscriptions, error: subError } = await dbClient
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .limit(1);

    // Handle free tier users (no subscription)
    if (subError || !subscriptions || subscriptions.length === 0) {
      // Check if free tier usage record exists
      const now = new Date().toISOString();
      const { data: freeTierUsage, error: freeTierError } = await dbClient
        .from("plan_usage")
        .select("*")
        .eq("user_id", userId)
        .is("subscription_id", null)
        .limit(1);

      if (freeTierError) {
        console.error("Error fetching free tier usage:", freeTierError);
      }

      // If free tier usage record exists, return it
      if (freeTierUsage && freeTierUsage.length > 0) {
        return freeTierUsage[0] as PlanUsage;
      }

      // Create new free tier usage record (lifetime, no reset)
      // Try to get plan from database, fallback to hardcoded
      const freePlan = await getPlanFromDB("free") || getPlanFromShared("free");
    const nowDate = new Date();
    // Use far-future date for billing_period_end to represent lifetime
    const farFuture = new Date(nowDate.getFullYear() + 100, 0, 1).toISOString();
    
    const { data: newFreeTierUsage, error: createFreeTierError } = await dbClient
      .from("plan_usage")
      .insert({
        user_id: userId,
        subscription_id: null, // Free tier has no subscription
        billing_period_start: nowDate.toISOString(),
        billing_period_end: farFuture, // Lifetime tracking
        weekly_plans_used: 0,
        monthly_plans_used: 0,
        credits_used: 0,
        credits_limit: freePlan.limits.monthlyCredits, // 7 credits for free tier
        credits_purchased: 0,
        credits_expires_at: null,
      })
      .select()
      .single();

    if (createFreeTierError) {
      console.error("Error creating free tier usage record:", createFreeTierError);
      return null;
    }

    return newFreeTierUsage as PlanUsage;
  }

  // Handle subscribed users
  const sub = subscriptions[0] as Subscription;
  const now = new Date().toISOString();

  // Find usage record for current billing period
  const { data: usage, error: usageError } = await dbClient
    .from("plan_usage")
    .select("*")
    .eq("user_id", userId)
    .eq("subscription_id", sub.id)
    .lte("billing_period_start", now)
    .gte("billing_period_end", now)
    .limit(1);

  if (usageError) {
    console.error("Error fetching usage:", usageError);
    return null;
  }

  if (usage && usage.length > 0) {
    return usage[0] as PlanUsage;
  }

  // Create new usage record for this billing period
  // Auto-fix missing billing periods
  const billingPeriods = await fixSubscriptionBillingPeriods(sub, dbClient);
  const plan = await getPlanFromDB(sub.plan_id) || getPlanFromShared(sub.plan_id as PlanId);
  
  const { data: newUsage, error: createError } = await dbClient
    .from("plan_usage")
    .insert({
      user_id: userId,
      subscription_id: sub.id,
      billing_period_start: billingPeriods.start,
      billing_period_end: billingPeriods.end,
      weekly_plans_used: 0,
      monthly_plans_used: 0,
      credits_used: 0,
      credits_limit: plan.limits.monthlyCredits,
      credits_purchased: 0,
      credits_expires_at: null,
    })
    .select()
    .single();

  if (createError) {
    console.error("Error creating usage record:", createError);
    return null;
  }

  return newUsage as PlanUsage;
}

/**
 * Check if user can generate a meal plan of the given type
 */
export async function checkQuota(
  userId: string,
  planType: PlanType
): Promise<{ allowed: boolean; error?: QuotaExceededError; creditsRequired?: number }> {
  const quotaDbClient = getSupabaseClient();
  if (!quotaDbClient) {
    // In development without Supabase, allow everything
    return { allowed: true };
  }

  const creditsRequired = getCreditsRequired(planType);

  // Get active subscription
  const { data: subscriptions, error: subError } = await quotaDbClient
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .limit(1);

  if (subError || !subscriptions || subscriptions.length === 0) {
    // No active subscription - check free tier
    const freePlan = await getPlanFromDB("free") || getPlanFromShared("free");
    const usage = await getCurrentUsage(userId);
    
    if (!usage) {
      // No usage record yet, allow (will be created on first generation)
      return { allowed: true, creditsRequired };
    }
    
    // Check credits for free tier (no purchased credits for free tier)
    const creditsUsed = usage.credits_used || 0;
    const creditsLimit = usage.credits_limit || freePlan.limits.monthlyCredits;
    
    if (creditsUsed + creditsRequired > creditsLimit) {
      return {
        allowed: false,
        creditsRequired,
        error: new QuotaExceededError(
          `Insufficient credits. You need ${creditsRequired} credits but only have ${creditsLimit - creditsUsed} remaining. Free tier includes ${creditsLimit} lifetime credits.`,
          "CREDITS_EXCEEDED",
          {
            used: creditsUsed,
            limit: creditsLimit,
            resetDate: new Date(usage.billing_period_end), // Far future for free tier
            creditsRequired,
          }
        ),
      };
    }
    
    return { allowed: true, creditsRequired };
  }

  const sub = subscriptions[0] as Subscription;
  // Try to get plan from database, fallback to hardcoded
  const plan = await getPlanFromDB(sub.plan_id) || getPlanFromShared(sub.plan_id as PlanId);
  const usage = await getCurrentUsage(userId);

  if (!usage) {
    return { allowed: true, creditsRequired }; // No usage record yet, allow
  }

  // Check credits (primary quota system)
  // Credits are the primary limiting factor - if user has enough credits, allow the request
  const creditsUsed = usage.credits_used || 0;
  const creditsLimit = usage.credits_limit || plan.limits.monthlyCredits;
  const remainingCredits = creditsLimit - creditsUsed;

  if (creditsUsed + creditsRequired > creditsLimit) {
    return {
      allowed: false,
      creditsRequired,
      error: new QuotaExceededError(
        `Insufficient credits. You need ${creditsRequired} credits but only have ${remainingCredits} remaining.`,
        "CREDITS_EXCEEDED",
        {
          used: creditsUsed,
          limit: creditsLimit,
          resetDate: new Date(usage.billing_period_end),
          creditsRequired,
        }
      ),
    };
  }

  // If credits are sufficient, allow the request
  // The backward compatibility checks for weekly/monthly plan counts are removed
  // because we're using a credit-based system where credits are the primary limit
  // Plan-specific counts (weekly_plans_used, monthly_plans_used) are still tracked
  // for display purposes but don't block generation if credits are available

  return { allowed: true, creditsRequired };
}

/**
 * Increment usage after generating a meal plan
 * Now uses credits system
 * Throws error if update fails
 */
export async function incrementUsage(
  userId: string,
  planType: PlanType
): Promise<void> {
  const incrementDbClient = getSupabaseClient();
  if (!incrementDbClient) {
    console.warn("Supabase client not available, skipping usage increment");
    return;
  }

  let usage = await getCurrentUsage(userId);
  
  // If no usage record exists, try to create one
  if (!usage) {
    // Get active subscription
    const { data: subscriptions, error: subError } = await incrementDbClient
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .limit(1);

    // Handle free tier users (no subscription)
    if (subError || !subscriptions || subscriptions.length === 0) {
      // Create free tier usage record
      const freePlan = await getPlanFromDB("free") || getPlanFromShared("free");
      const nowDate = new Date();
      // Use far-future date for billing_period_end to represent lifetime
      const farFuture = new Date(nowDate.getFullYear() + 100, 0, 1).toISOString();
      
      const { data: newFreeTierUsage, error: createFreeTierError } = await incrementDbClient
        .from("plan_usage")
        .insert({
          user_id: userId,
          subscription_id: null, // Free tier has no subscription
          billing_period_start: nowDate.toISOString(),
          billing_period_end: farFuture, // Lifetime tracking
          weekly_plans_used: 0,
          monthly_plans_used: 0,
          credits_used: 0,
          credits_limit: freePlan.limits.monthlyCredits, // 4 credits for free tier
        })
        .select()
        .single();

      if (createFreeTierError || !newFreeTierUsage) {
        throw new Error(`Failed to create free tier usage record: ${createFreeTierError?.message || "Unknown error"}`);
      }
      
      usage = newFreeTierUsage as PlanUsage;
    } else {
      // Handle subscribed users
      const sub = subscriptions[0] as Subscription;
      // Try to get plan from database, fallback to hardcoded
      const plan = await getPlanFromDB(sub.plan_id) || getPlanFromShared(sub.plan_id as PlanId);
      
      // Auto-fix missing billing periods
      const billingPeriods = await fixSubscriptionBillingPeriods(sub, incrementDbClient);
      
      const { data: newUsage, error: createError } = await incrementDbClient
        .from("plan_usage")
        .insert({
          user_id: userId,
          subscription_id: sub.id,
          billing_period_start: billingPeriods.start,
          billing_period_end: billingPeriods.end,
          weekly_plans_used: 0,
          monthly_plans_used: 0,
          credits_used: 0,
          credits_limit: plan.limits.monthlyCredits,
        })
        .select()
        .single();

      if (createError || !newUsage) {
        throw new Error(`Failed to create usage record: ${createError?.message || "Unknown error"}`);
      }
      
      usage = newUsage as PlanUsage;
    }
  }

  const creditsRequired = getCreditsRequired(planType);

  // Deduct from base credits
  const currentCreditsUsed = usage.credits_used || 0;
  const newCreditsUsed = currentCreditsUsed + creditsRequired;

  const updateData: any = {
    updated_at: new Date().toISOString(),
    credits_used: newCreditsUsed,
  };

  // Keep backward compatibility - also increment plan counts
  if (planType === "monthly") {
    updateData.monthly_plans_used = usage.monthly_plans_used + 1;
  } else {
    updateData.weekly_plans_used = usage.weekly_plans_used + 1;
  }

  const { error } = await incrementDbClient
    .from("plan_usage")
    .update(updateData)
    .eq("id", usage.id);

  if (error) {
    console.error("Error incrementing usage:", error);
    throw new Error(`Failed to increment usage: ${error.message}`);
  }
  
  console.log(`Successfully incremented usage: ${creditsRequired} credits deducted for ${planType} plan`);
}

/**
 * Get quota information for display
 */
export async function getQuotaInfo(userId: string): Promise<{
  weeklyPlans: { used: number; limit: number };
  monthlyPlans: { used: number; limit: number };
  clients: { used: number; limit: number };
  credits: { used: number; limit: number };
  resetDate: Date | null; // null for free tier (lifetime plans)
} | null> {
  // Always return quota info - if supabaseAdmin is not available, return free tier defaults
  const plan = await getPlanFromDB("free") || getPlanFromShared("free");
  const freeTierDefaults = {
    weeklyPlans: { used: 0, limit: plan.limits.weeklyPlans },
    monthlyPlans: { used: 0, limit: plan.limits.monthlyPlans },
    clients: { used: 0, limit: plan.limits.clients },
    credits: { used: 0, limit: plan.limits.monthlyCredits },
    resetDate: null as Date | null, // Free tier is lifetime, no reset date
  };

  const quotaInfoDbClient = getSupabaseClient();
  if (!quotaInfoDbClient) {
    console.warn("[WARN] Supabase client not available, returning free tier defaults");
    return freeTierDefaults;
  }

  // Get active subscription
  const { data: subscriptions, error: subError } = await quotaInfoDbClient
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .limit(1);

  if (subError || !subscriptions || subscriptions.length === 0) {
    // No active subscription - check for free tier usage record
    const usage = await getCurrentUsage(userId);
    
    if (usage) {
      // Return actual usage for free tier
      return {
        weeklyPlans: {
          used: usage.weekly_plans_used,
          limit: freeTierDefaults.weeklyPlans.limit,
        },
        monthlyPlans: {
          used: usage.monthly_plans_used,
          limit: freeTierDefaults.monthlyPlans.limit,
        },
        clients: {
          used: 0,
          limit: freeTierDefaults.clients.limit,
        },
        credits: {
          used: usage.credits_used || 0,
          limit: usage.credits_limit || freeTierDefaults.credits.limit,
        },
        resetDate: null, // Free tier is lifetime, no reset
      };
    }
    
    // No usage record yet - return free tier defaults (lifetime, no reset)
    return freeTierDefaults;
  }

  const sub = subscriptions[0] as Subscription;
  // Try to get plan from database, fallback to hardcoded
  const subscriptionPlan = await getPlanFromDB(sub.plan_id) || getPlanFromShared(sub.plan_id as PlanId);
  const usage = await getCurrentUsage(userId);

  if (!usage) {
    return {
      weeklyPlans: { used: 0, limit: subscriptionPlan.limits.weeklyPlans },
      monthlyPlans: { used: 0, limit: subscriptionPlan.limits.monthlyPlans },
      clients: { used: 0, limit: subscriptionPlan.limits.clients === -1 ? Infinity : subscriptionPlan.limits.clients },
      credits: { used: 0, limit: subscriptionPlan.limits.monthlyCredits },
      resetDate: sub.current_period_end ? new Date(sub.current_period_end) : new Date(),
    };
  }

  return {
    weeklyPlans: {
      used: usage.weekly_plans_used,
      limit: subscriptionPlan.limits.weeklyPlans,
    },
    monthlyPlans: {
      used: usage.monthly_plans_used,
      limit: subscriptionPlan.limits.monthlyPlans,
    },
    clients: {
      used: 0, // TODO: Track client usage
      limit: subscriptionPlan.limits.clients === -1 ? Infinity : subscriptionPlan.limits.clients,
    },
    credits: {
      used: usage.credits_used || 0,
      limit: usage.credits_limit || subscriptionPlan.limits.monthlyCredits,
    },
    resetDate: new Date(usage.billing_period_end),
  };
}

