/**
 * Quota Management and Checking (Supabase Version)
 * Handles quota validation for meal plan generation using Supabase
 */

import { supabase } from "./supabase";
import { getPlan, type PlanId } from "@shared/plans";

export type PlanType = "daily" | "weekly" | "monthly";

export class QuotaExceededError extends Error {
  constructor(
    message: string,
    public code: "WEEKLY_QUOTA_EXCEEDED" | "MONTHLY_QUOTA_EXCEEDED" | "CLIENT_QUOTA_EXCEEDED",
    public details: {
      used: number;
      limit: number;
      resetDate: Date;
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
 * Get current usage for a user in the current billing period
 */
export async function getCurrentUsage(
  userId: string
): Promise<PlanUsage | null> {
  if (!supabase) return null;

  // Get active subscription
  const { data: subscriptions, error: subError } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .limit(1);

  if (subError || !subscriptions || subscriptions.length === 0) {
    return null;
  }

  const sub = subscriptions[0] as Subscription;
  const now = new Date().toISOString();

  // Find usage record for current billing period
  const { data: usage, error: usageError } = await supabase
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
  if (sub.current_period_start && sub.current_period_end) {
    const { data: newUsage, error: createError } = await supabase
      .from("plan_usage")
      .insert({
        user_id: userId,
        subscription_id: sub.id,
        billing_period_start: sub.current_period_start,
        billing_period_end: sub.current_period_end,
        weekly_plans_used: 0,
        monthly_plans_used: 0,
      })
      .select()
      .single();

    if (createError) {
      console.error("Error creating usage record:", createError);
      return null;
    }

    return newUsage as PlanUsage;
  }

  return null;
}

/**
 * Check if user can generate a meal plan of the given type
 */
export async function checkQuota(
  userId: string,
  planType: PlanType
): Promise<{ allowed: boolean; error?: QuotaExceededError }> {
  if (!supabase) {
    // In development without Supabase, allow everything
    return { allowed: true };
  }

  // Get active subscription
  const { data: subscriptions, error: subError } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .limit(1);

  if (subError || !subscriptions || subscriptions.length === 0) {
    // No active subscription - check free tier
    const plan = getPlan("free");
    // Free tier allows 1 lifetime plan, would need additional tracking
    return { allowed: true }; // Simplified for now
  }

  const sub = subscriptions[0] as Subscription;
  const plan = getPlan(sub.plan_id as PlanId);
  const usage = await getCurrentUsage(userId);

  if (!usage) {
    return { allowed: true }; // No usage record yet, allow
  }

  // Determine which quota to check
  if (planType === "monthly") {
    if (usage.monthly_plans_used >= plan.limits.monthlyPlans) {
      return {
        allowed: false,
        error: new QuotaExceededError(
          "Monthly plan limit reached",
          "MONTHLY_QUOTA_EXCEEDED",
          {
            used: usage.monthly_plans_used,
            limit: plan.limits.monthlyPlans,
            resetDate: new Date(usage.billing_period_end),
          }
        ),
      };
    }
  } else {
    // Daily and weekly count toward weekly quota
    if (usage.weekly_plans_used >= plan.limits.weeklyPlans) {
      return {
        allowed: false,
        error: new QuotaExceededError(
          "Weekly plan limit reached",
          "WEEKLY_QUOTA_EXCEEDED",
          {
            used: usage.weekly_plans_used,
            limit: plan.limits.weeklyPlans,
            resetDate: new Date(usage.billing_period_end),
          }
        ),
      };
    }
  }

  return { allowed: true };
}

/**
 * Increment usage after generating a meal plan
 */
export async function incrementUsage(
  userId: string,
  planType: PlanType
): Promise<void> {
  if (!supabase) return;

  const usage = await getCurrentUsage(userId);
  if (!usage) return;

  const updateData: any = {
    updated_at: new Date().toISOString(),
  };

  if (planType === "monthly") {
    updateData.monthly_plans_used = usage.monthly_plans_used + 1;
  } else {
    updateData.weekly_plans_used = usage.weekly_plans_used + 1;
  }

  const { error } = await supabase
    .from("plan_usage")
    .update(updateData)
    .eq("id", usage.id);

  if (error) {
    console.error("Error incrementing usage:", error);
  }
}

/**
 * Get quota information for display
 */
export async function getQuotaInfo(userId: string): Promise<{
  weeklyPlans: { used: number; limit: number };
  monthlyPlans: { used: number; limit: number };
  clients: { used: number; limit: number };
  resetDate: Date;
} | null> {
  if (!supabase) return null;

  // Get active subscription
  const { data: subscriptions, error: subError } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .limit(1);

  if (subError || !subscriptions || subscriptions.length === 0) {
    const plan = getPlan("free");
    return {
      weeklyPlans: { used: 0, limit: plan.limits.weeklyPlans },
      monthlyPlans: { used: 0, limit: plan.limits.monthlyPlans },
      clients: { used: 0, limit: plan.limits.clients },
      resetDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
    };
  }

  const sub = subscriptions[0] as Subscription;
  const plan = getPlan(sub.plan_id as PlanId);
  const usage = await getCurrentUsage(userId);

  if (!usage) {
    return {
      weeklyPlans: { used: 0, limit: plan.limits.weeklyPlans },
      monthlyPlans: { used: 0, limit: plan.limits.monthlyPlans },
      clients: { used: 0, limit: plan.limits.clients === -1 ? Infinity : plan.limits.clients },
      resetDate: sub.current_period_end ? new Date(sub.current_period_end) : new Date(),
    };
  }

  return {
    weeklyPlans: {
      used: usage.weekly_plans_used,
      limit: plan.limits.weeklyPlans,
    },
    monthlyPlans: {
      used: usage.monthly_plans_used,
      limit: plan.limits.monthlyPlans,
    },
    clients: {
      used: 0, // TODO: Track client usage
      limit: plan.limits.clients === -1 ? Infinity : plan.limits.clients,
    },
    resetDate: new Date(usage.billing_period_end),
  };
}

