/**
 * Quota Management and Checking
 * Handles quota validation for meal plan generation
 */

import { db } from "./db";
import { planUsage, subscriptions } from "@shared/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { getPlan, type PlanId } from "@shared/plans";
import type { PlanUsage } from "@shared/schema";

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

/**
 * Get current usage for a user in the current billing period
 */
export async function getCurrentUsage(
  userId: string
): Promise<PlanUsage | null> {
  if (!db) return null;

  const subscription = await db
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.status, "active")
      )
    )
    .limit(1);

  if (subscription.length === 0) {
    return null;
  }

  const sub = subscription[0];
  const now = new Date();

  // Find usage record for current billing period
  const usage = await db
    .select()
    .from(planUsage)
    .where(
      and(
        eq(planUsage.userId, userId),
        eq(planUsage.subscriptionId, sub.id),
        lte(planUsage.billingPeriodStart, now),
        gte(planUsage.billingPeriodEnd, now)
      )
    )
    .limit(1);

  if (usage.length === 0) {
    // Create new usage record for this billing period
    return await createUsageRecord(userId, sub.id, sub.currentPeriodStart, sub.currentPeriodEnd);
  }

  return usage[0];
}

/**
 * Create a new usage record for a billing period
 */
async function createUsageRecord(
  userId: string,
  subscriptionId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<PlanUsage> {
  if (!db) throw new Error("Database not configured");

  const result = await db
    .insert(planUsage)
    .values({
      userId,
      subscriptionId,
      billingPeriodStart: periodStart,
      billingPeriodEnd: periodEnd,
      weeklyPlansUsed: 0,
      monthlyPlansUsed: 0,
      clientsUsed: 0,
    })
    .returning();

  return result[0];
}

/**
 * Check if user can generate a meal plan of the given type
 */
export async function checkQuota(
  userId: string,
  planType: PlanType
): Promise<{ allowed: boolean; error?: QuotaExceededError }> {
  if (!db) {
    // In development without DB, allow everything
    return { allowed: true };
  }

  const subscription = await db
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.status, "active")
      )
    )
    .limit(1);

  if (subscription.length === 0) {
    // No active subscription - check free tier
    const plan = getPlan("free");
    // Free tier allows 1 lifetime plan, would need additional tracking
    return { allowed: true }; // Simplified for now
  }

  const sub = subscription[0];
  const plan = getPlan(sub.planId as PlanId);
  const usage = await getCurrentUsage(userId);

  if (!usage) {
    return { allowed: true }; // No usage record yet, allow
  }

  // Determine which quota to check
  if (planType === "monthly") {
    if (usage.monthlyPlansUsed >= plan.limits.monthlyPlans) {
      return {
        allowed: false,
        error: new QuotaExceededError(
          "Monthly plan limit reached",
          "MONTHLY_QUOTA_EXCEEDED",
          {
            used: usage.monthlyPlansUsed,
            limit: plan.limits.monthlyPlans,
            resetDate: usage.billingPeriodEnd,
          }
        ),
      };
    }
  } else {
    // Daily and weekly count toward weekly quota
    if (usage.weeklyPlansUsed >= plan.limits.weeklyPlans) {
      return {
        allowed: false,
        error: new QuotaExceededError(
          "Weekly plan limit reached",
          "WEEKLY_QUOTA_EXCEEDED",
          {
            used: usage.weeklyPlansUsed,
            limit: plan.limits.weeklyPlans,
            resetDate: usage.billingPeriodEnd,
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
  if (!db) return;

  const usage = await getCurrentUsage(userId);
  if (!usage) return;

  if (planType === "monthly") {
    await db
      .update(planUsage)
      .set({
        monthlyPlansUsed: usage.monthlyPlansUsed + 1,
        updatedAt: new Date(),
      })
      .where(eq(planUsage.id, usage.id));
  } else {
    await db
      .update(planUsage)
      .set({
        weeklyPlansUsed: usage.weeklyPlansUsed + 1,
        updatedAt: new Date(),
      })
      .where(eq(planUsage.id, usage.id));
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
  if (!db) return null;

  const subscription = await db
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.status, "active")
      )
    )
    .limit(1);

  if (subscription.length === 0) {
    const plan = getPlan("free");
    return {
      weeklyPlans: { used: 0, limit: plan.limits.weeklyPlans },
      monthlyPlans: { used: 0, limit: plan.limits.monthlyPlans },
      clients: { used: 0, limit: plan.limits.clients },
      resetDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
    };
  }

  const sub = subscription[0];
  const plan = getPlan(sub.planId as PlanId);
  const usage = await getCurrentUsage(userId);

  if (!usage) {
    return {
      weeklyPlans: { used: 0, limit: plan.limits.weeklyPlans },
      monthlyPlans: { used: 0, limit: plan.limits.monthlyPlans },
      clients: { used: 0, limit: plan.limits.clients },
      resetDate: sub.currentPeriodEnd,
    };
  }

  return {
    weeklyPlans: {
      used: usage.weeklyPlansUsed,
      limit: plan.limits.weeklyPlans,
    },
    monthlyPlans: {
      used: usage.monthlyPlansUsed,
      limit: plan.limits.monthlyPlans,
    },
    clients: {
      used: usage.clientsUsed,
      limit: plan.limits.clients === -1 ? Infinity : plan.limits.clients,
    },
    resetDate: usage.billingPeriodEnd,
  };
}

