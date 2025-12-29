/**
 * GET /api/mealplan/quota
 * Get current quota information
 */

import { NextRequest, NextResponse } from "next/server";
import { getQuotaInfo } from "@/server/quota-supabase";
import { authenticateRequest } from "@/lib/api-helpers";

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { userId } = authResult;

    const quotaInfo = await getQuotaInfo(userId);
    
    // Always return quota info - getQuotaInfo should return free tier defaults if no subscription
    // But if it returns null (edge case), provide free tier defaults here as fallback
    if (!quotaInfo) {
      // Fallback: Return free tier defaults
      const { getPlan } = await import("@shared/plans");
      const plan = getPlan("free");
      return NextResponse.json({
        weeklyPlans: { used: 0, limit: plan.limits.weeklyPlans },
        monthlyPlans: { used: 0, limit: plan.limits.monthlyPlans },
        clients: { used: 0, limit: plan.limits.clients },
        credits: { used: 0, limit: plan.limits.monthlyCredits },
        resetDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      });
    }

    return NextResponse.json(quotaInfo);
  } catch (error) {
    console.error("[ERROR] Error fetching quota:", error);
    // Even on error, return free tier defaults to prevent infinite loading
    try {
      const { getPlan } = await import("@shared/plans");
      const plan = getPlan("free");
      return NextResponse.json({
        weeklyPlans: { used: 0, limit: plan.limits.weeklyPlans },
        monthlyPlans: { used: 0, limit: plan.limits.monthlyPlans },
        clients: { used: 0, limit: plan.limits.clients },
        credits: { used: 0, limit: plan.limits.monthlyCredits },
        resetDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      });
    } catch (fallbackError) {
      console.error("[ERROR] Fallback quota generation failed:", fallbackError);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  }
}

