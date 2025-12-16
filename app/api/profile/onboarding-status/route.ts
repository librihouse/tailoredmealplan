/**
 * GET /api/profile/onboarding-status
 * Check if onboarding is complete for current user
 */

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/server/supabase";
import { authenticateRequest, log } from "@/lib/api-helpers";

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { userId } = authResult;

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 500 }
      );
    }

    // Get subscription to determine user type
    const { data: subscription } = await supabaseAdmin
      .from("subscriptions")
      .select("plan_id")
      .eq("user_id", userId)
      .eq("status", "active")
      .single();

    const isB2BPlan = subscription?.plan_id && 
      ["starter", "growth", "professional", "enterprise"].includes(subscription.plan_id);

    if (isB2BPlan) {
      // Check business profile
      const { data: businessProfile } = await supabaseAdmin
        .from("business_profiles")
        .select("onboarding_completed")
        .eq("user_id", userId)
        .single();

      return NextResponse.json({
        completed: businessProfile?.onboarding_completed || false,
        type: "business",
      });
    } else {
      // Check individual profile
      const { data: userProfile } = await supabaseAdmin
        .from("user_profiles")
        .select("onboarding_completed")
        .eq("user_id", userId)
        .single();

      return NextResponse.json({
        completed: userProfile?.onboarding_completed || false,
        type: "individual",
      });
    }
  } catch (error: any) {
    log(`Error in profile/onboarding-status: ${error.message}`, "profile");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

