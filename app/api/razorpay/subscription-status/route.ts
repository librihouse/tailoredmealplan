/**
 * GET /api/razorpay/subscription-status
 * Get current user's subscription status
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

    const { data: subscription, error } = await supabaseAdmin
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") {
      log(`Error fetching subscription: ${error.message}`, "razorpay");
      return NextResponse.json(
        { error: "Failed to fetch subscription" },
        { status: 500 }
      );
    }

    if (!subscription) {
      return NextResponse.json({
        hasSubscription: false,
        subscription: null,
      });
    }

    return NextResponse.json({
      hasSubscription: true,
      subscription: {
        id: subscription.id,
        planId: subscription.plan_id,
        status: subscription.status,
        billingInterval: subscription.billing_interval,
        currentPeriodStart: subscription.current_period_start,
        currentPeriodEnd: subscription.current_period_end,
        cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
      },
    });
  } catch (error: any) {
    log(`Error in subscription-status: ${error.message}`, "razorpay");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

