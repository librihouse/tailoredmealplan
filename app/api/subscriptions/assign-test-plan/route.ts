/**
 * POST /api/subscriptions/assign-test-plan
 * Assign a paid plan to test user without payment
 * Only works for the user ID specified in TEST_USER_ID environment variable
 */

import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/api-helpers";
import { supabaseAdmin } from "@/server/supabase";
import { B2C_PLANS } from "@/shared/plans";
import { log } from "@/server/utils/log";

// Get test user ID from environment
const TEST_USER_ID = process.env.TEST_USER_ID || "";

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { userId } = authResult;

    // Only allow test user to assign plans
    if (!TEST_USER_ID) {
      log("TEST_USER_ID not configured in environment", "test-plan");
      return NextResponse.json(
        { error: "Test user feature is not configured" },
        { status: 403 }
      );
    }

    if (userId !== TEST_USER_ID) {
      log(`Unauthorized attempt to assign test plan by user: ${userId}`, "test-plan");
      return NextResponse.json(
        { error: "Unauthorized - Test user only" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { planId, billingInterval = "monthly" } = body;

    if (!planId) {
      return NextResponse.json(
        { error: "Plan ID is required" },
        { status: 400 }
      );
    }

    // Validate plan exists
    const plan = B2C_PLANS[planId as keyof typeof B2C_PLANS];
    if (!plan) {
      return NextResponse.json(
        { error: `Invalid plan ID: ${planId}` },
        { status: 400 }
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 500 }
      );
    }

    log(`Assigning test plan ${planId} to user ${userId}`, "test-plan");

    const now = new Date();
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days for monthly

    // Check if subscription exists
    const { data: existingSub } = await supabaseAdmin
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .single();

    // Build subscription data - use Stripe column names (not Razorpay) based on actual DB schema
    // The database has: stripe_subscription_id, stripe_customer_id
    // Not: razorpay_subscription_id, razorpay_customer_id, billing_interval
    const subscriptionData: any = {
      user_id: userId,
      plan_id: planId,
      status: "active",
      stripe_subscription_id: `test_${Date.now()}`, // Test ID prefix - using Stripe column name
      stripe_customer_id: `test_customer_${userId}`, // Using Stripe column name
      current_period_start: now.toISOString(),
      current_period_end: periodEnd.toISOString(),
      updated_at: now.toISOString(),
    };

    let subscriptionId: string;

    if (existingSub) {
      // Update existing subscription
      const { error: updateError } = await supabaseAdmin
        .from("subscriptions")
        .update(subscriptionData)
        .eq("user_id", userId);

      if (updateError) {
        log(`Error updating subscription: ${updateError.message}`, "test-plan");
        return NextResponse.json(
          { error: "Failed to update subscription" },
          { status: 500 }
        );
      }
      subscriptionId = existingSub.id;
      log(`Updated existing subscription ${subscriptionId} to plan ${planId}`, "test-plan");
    } else {
      // Create new subscription
      const { error: insertError } = await supabaseAdmin
        .from("subscriptions")
        .insert({
          ...subscriptionData,
          created_at: now.toISOString(),
        });

      if (insertError) {
        log(`Error creating subscription: ${insertError.message}`, "test-plan");
        return NextResponse.json(
          { error: "Failed to create subscription" },
          { status: 500 }
        );
      }

      // Get the new subscription ID
      const { data: newSub, error: fetchError } = await supabaseAdmin
        .from("subscriptions")
        .select("id")
        .eq("user_id", userId)
        .single();

      if (fetchError || !newSub) {
        log(`Error fetching subscription after creation: ${fetchError?.message}`, "test-plan");
        subscriptionId = "";
      } else {
        subscriptionId = newSub.id;
        log(`Created new subscription ${subscriptionId} for plan ${planId}`, "test-plan");
      }
    }

    // Create or update plan usage with credits
    const monthlyCredits = plan.limits.monthlyCredits;

    if (subscriptionId) {
      // First, find any existing usage records for this user (regardless of subscription_id)
      // This handles cases where the user had a free tier usage record or old subscription
      const { data: allUsageRecords, error: queryAllError } = await supabaseAdmin
        .from("plan_usage")
        .select("*")
        .eq("user_id", userId);

      if (queryAllError) {
        log(`Error querying all plan usage records: ${queryAllError.message}`, "test-plan");
      }

      // Find usage record matching current subscription
      const existingUsage = allUsageRecords?.find((u) => u.subscription_id === subscriptionId);

      if (!existingUsage) {
        // No usage record found for this subscription - create new one with credits allocated
        const { data: newUsage, error: usageError } = await supabaseAdmin
          .from("plan_usage")
          .insert({
            user_id: userId,
            subscription_id: subscriptionId,
            billing_period_start: now.toISOString(),
            billing_period_end: periodEnd.toISOString(),
            weekly_plans_used: 0,
            monthly_plans_used: 0,
            credits_used: 0,
            credits_limit: monthlyCredits,
            credits_purchased: 0,
            credits_expires_at: null,
          })
          .select()
          .single();

        if (usageError) {
          log(`Error creating plan usage: ${usageError.message}`, "test-plan");
          // Don't fail the whole request - usage can be created later
        } else {
          log(`Plan usage created with ${monthlyCredits} credits allocated for user: ${userId}`, "test-plan");
        }
      } else {
        // Update existing usage record - reset credits for new billing period
        const { error: updateUsageError } = await supabaseAdmin
          .from("plan_usage")
          .update({
            billing_period_start: now.toISOString(),
            billing_period_end: periodEnd.toISOString(),
            credits_limit: monthlyCredits,
            credits_used: 0, // Reset credits used for new billing period
            weekly_plans_used: 0,
            monthly_plans_used: 0,
            updated_at: now.toISOString(),
          })
          .eq("id", existingUsage.id); // Use ID for more reliable update

        if (updateUsageError) {
          log(`Error updating plan usage: ${updateUsageError.message}`, "test-plan");
        } else {
          log(`Plan usage updated with ${monthlyCredits} credits allocated for user: ${userId}`, "test-plan");
        }
      }
    } else {
      log(`Warning: No subscriptionId available, skipping plan usage update for user: ${userId}`, "test-plan");
    }

    log(`Test plan ${planId} successfully assigned to user: ${userId}`, "test-plan");

    return NextResponse.json({
      success: true,
      message: `Successfully assigned ${plan.name} plan (Test Mode)`,
      subscription: subscriptionData,
      credits: monthlyCredits,
    });
  } catch (error: any) {
    log(`Error assigning test plan: ${error.message}`, "test-plan");
    console.error("Error assigning test plan:", error);
    return NextResponse.json(
      { error: error.message || "Failed to assign plan" },
      { status: 500 }
    );
  }
}

