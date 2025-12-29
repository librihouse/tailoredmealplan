/**
 * GET /api/mealplan/history
 * Get meal plan history for the current user
 */

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, supabase } from "@/server/supabase";
import { authenticateRequest, log } from "@/lib/api-helpers";

// Use admin client if available, otherwise fallback to regular client
const getSupabaseClient = () => supabaseAdmin || supabase;

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { userId } = authResult;

    const dbClient = getSupabaseClient();
    if (!dbClient) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 500 }
      );
    }

    // Check user's subscription plan to determine if they're on free tier
    const { data: subscription } = await dbClient
      .from("subscriptions")
      .select("plan_id, status")
      .eq("user_id", userId)
      .eq("status", "active")
      .single();

    const isFreeTier = !subscription || subscription.plan_id === "free" || !subscription.plan_id;

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") as "daily" | "weekly" | "monthly" | null;
    const familyMemberId = searchParams.get("familyMemberId");
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 50;
    const offset = searchParams.get("offset") ? parseInt(searchParams.get("offset")!, 10) : 0;

    // Build query
    let query = dbClient
      .from("meal_plans")
      .select("*", { count: "exact" })
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    // Filter by type if provided
    if (type) {
      query = query.eq("plan_type", type);
    }

    // Filter by family member if provided
    if (familyMemberId) {
      query = query.eq("family_member_id", familyMemberId);
    } else {
      // If no family member specified, only show plans without family_member_id (user's own plans)
      query = query.is("family_member_id", null);
    }

    // For free tier users, filter out plans older than 12 hours
    if (isFreeTier) {
      const twelveHoursAgo = new Date();
      twelveHoursAgo.setHours(twelveHoursAgo.getHours() - 12);
      query = query.gte("created_at", twelveHoursAgo.toISOString());
      log(`[INFO] Filtering free tier plans - only showing plans created after ${twelveHoursAgo.toISOString()}`, "mealplan");
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: plans, error, count } = await query;

    if (error) {
      log(`[ERROR] Error fetching meal plan history: ${error.message}`, "mealplan");
      return NextResponse.json(
        { error: "Failed to fetch meal plans" },
        { status: 500 }
      );
    }

    // Add expiration info to each plan for free tier users
    const plansWithExpiration = (plans || []).map((plan: any) => {
      if (isFreeTier && plan.created_at) {
        const createdAt = new Date(plan.created_at);
        const expiresAt = new Date(createdAt.getTime() + 12 * 60 * 60 * 1000); // 12 hours from creation
        const now = new Date();
        const timeRemaining = expiresAt.getTime() - now.getTime();
        const hoursRemaining = Math.max(0, Math.floor(timeRemaining / (1000 * 60 * 60)));
        const minutesRemaining = Math.max(0, Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60)));
        const isExpired = timeRemaining <= 0;
        const isExpiringSoon = timeRemaining > 0 && timeRemaining <= 2 * 60 * 60 * 1000; // Less than 2 hours remaining

        return {
          ...plan,
          expiration: {
            expiresAt: expiresAt.toISOString(),
            hoursRemaining,
            minutesRemaining,
            isExpired,
            isExpiringSoon,
            timeRemainingMs: timeRemaining,
          },
        };
      }
      return plan;
    });

    return NextResponse.json({
      plans: plansWithExpiration,
      total: count || 0,
      isFreeTier,
    });
  } catch (error: any) {
    log(`[ERROR] Error in mealplan/history: ${error.message}`, "mealplan");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

