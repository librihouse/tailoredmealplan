/**
 * Cleanup Service
 * Handles automatic cleanup of expired meal plans and share links
 */

import { supabaseAdmin, supabase } from "../supabase";
import { log } from "../index";
import { checkCreditExpiry } from "./credit-addon";

// Use admin client if available, otherwise fallback to regular client
const getSupabaseClient = () => supabaseAdmin || supabase;

/**
 * Cleanup expired free tier meal plans (older than 12 hours)
 */
export async function cleanupExpiredFreeTierPlans(): Promise<{
  deleted: number;
  error?: string;
}> {
  const dbClient = getSupabaseClient();
  if (!dbClient) {
    return { deleted: 0, error: "Database not configured" };
  }

  try {
    const twelveHoursAgo = new Date();
    twelveHoursAgo.setHours(twelveHoursAgo.getHours() - 12);

    // Find free tier meal plans older than 12 hours
    // Free tier users either have no subscription or have plan_id = 'free'
    const { data: expiredPlans, error: findError } = await dbClient
      .from("meal_plans")
      .select("id, user_id, created_at")
      .lt("created_at", twelveHoursAgo.toISOString());

    if (findError) {
      log(`Error finding expired plans: ${findError.message}`, "cleanup");
      return { deleted: 0, error: findError.message };
    }

    if (!expiredPlans || expiredPlans.length === 0) {
      log("No expired free tier plans found", "cleanup");
      return { deleted: 0 };
    }

    // Check which plans belong to free tier users
    const freeTierPlanIds: string[] = [];

    for (const plan of expiredPlans) {
      // Check if user has active subscription
      const { data: subscriptions } = await dbClient
        .from("subscriptions")
        .select("plan_id, status")
        .eq("user_id", plan.user_id)
        .eq("status", "active")
        .limit(1);

      // If no subscription or plan_id is 'free', it's a free tier plan
      const isFreeTier = !subscriptions || 
                        subscriptions.length === 0 || 
                        subscriptions[0].plan_id === "free";

      if (isFreeTier) {
        freeTierPlanIds.push(plan.id);
      }
    }

    if (freeTierPlanIds.length === 0) {
      log("No free tier plans to delete", "cleanup");
      return { deleted: 0 };
    }

    // Delete expired free tier plans
    const { error: deleteError } = await dbClient
      .from("meal_plans")
      .delete()
      .in("id", freeTierPlanIds);

    if (deleteError) {
      log(`Error deleting expired plans: ${deleteError.message}`, "cleanup");
      return { deleted: 0, error: deleteError.message };
    }

    log(`Deleted ${freeTierPlanIds.length} expired free tier meal plans`, "cleanup");
    return { deleted: freeTierPlanIds.length };
  } catch (error: any) {
    log(`Error in cleanupExpiredFreeTierPlans: ${error.message}`, "cleanup");
    return { deleted: 0, error: error.message };
  }
}

/**
 * Cleanup expired share links
 */
export async function cleanupExpiredShareLinks(): Promise<{
  deleted: number;
  error?: string;
}> {
  const dbClient = getSupabaseClient();
  if (!dbClient) {
    return { deleted: 0, error: "Database not configured" };
  }

  try {
    const now = new Date().toISOString();

    // Delete expired share links
    const { data: deletedLinks, error: deleteError } = await dbClient
      .from("shared_meal_plans")
      .delete()
      .lt("expires_at", now)
      .not("expires_at", "is", null)
      .select("id");

    if (deleteError) {
      log(`Error deleting expired share links: ${deleteError.message}`, "cleanup");
      return { deleted: 0, error: deleteError.message };
    }

    const deletedCount = deletedLinks?.length || 0;
    if (deletedCount > 0) {
      log(`Deleted ${deletedCount} expired share links`, "cleanup");
    }

    return { deleted: deletedCount };
  } catch (error: any) {
    log(`Error in cleanupExpiredShareLinks: ${error.message}`, "cleanup");
    return { deleted: 0, error: error.message };
  }
}

/**
 * Cleanup expired purchased credits
 */
export async function cleanupExpiredCredits(): Promise<{
  processed: number;
  error?: string;
}> {
  const dbClient = getSupabaseClient();
  if (!dbClient) {
    return { processed: 0, error: "Database not configured" };
  }

  try {
    const now = new Date().toISOString();

    // Find all users with expired credits
    const { data: expiredPurchases, error: findError } = await dbClient
      .from("credit_purchases")
      .select("user_id")
      .eq("status", "completed")
      .lt("expires_at", now);

    if (findError) {
      log(`Error finding expired credit purchases: ${findError.message}`, "cleanup");
      return { processed: 0, error: findError.message };
    }

    if (!expiredPurchases || expiredPurchases.length === 0) {
      log("No expired credit purchases found", "cleanup");
      return { processed: 0 };
    }

    // Get unique user IDs
    const userIds = [...new Set(expiredPurchases.map(p => p.user_id))];

    // Process each user's expired credits
    let processed = 0;
    for (const userId of userIds) {
      try {
        await checkCreditExpiry(userId);
        processed++;
      } catch (error: any) {
        log(`Error processing expired credits for user ${userId}: ${error.message}`, "cleanup");
      }
    }

    log(`Processed expired credits for ${processed} users`, "cleanup");
    return { processed };
  } catch (error: any) {
    log(`Error in cleanupExpiredCredits: ${error.message}`, "cleanup");
    return { processed: 0, error: error.message };
  }
}

/**
 * Run all cleanup tasks
 */
export async function runCleanupTasks(): Promise<{
  freeTierPlans: { deleted: number; error?: string };
  shareLinks: { deleted: number; error?: string };
  expiredCredits: { processed: number; error?: string };
}> {
  log("Starting cleanup tasks...", "cleanup");
  
  const [freeTierPlans, shareLinks, expiredCredits] = await Promise.all([
    cleanupExpiredFreeTierPlans(),
    cleanupExpiredShareLinks(),
    cleanupExpiredCredits(),
  ]);

  log("Cleanup tasks completed", "cleanup");
  
  return {
    freeTierPlans,
    shareLinks,
    expiredCredits,
  };
}

