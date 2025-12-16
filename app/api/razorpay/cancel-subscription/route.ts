/**
 * POST /api/razorpay/cancel-subscription
 * Cancel subscription (set to cancel at period end)
 */

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/server/supabase";
import { authenticateRequest, log } from "@/lib/api-helpers";

export async function POST(request: NextRequest) {
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

    // Check if subscription exists
    const { data: subscription, error: fetchError } = await supabaseAdmin
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (fetchError || !subscription) {
      return NextResponse.json(
        { error: "No active subscription found" },
        { status: 404 }
      );
    }

    // Update subscription to cancel at period end
    const { error: updateError } = await supabaseAdmin
      .from("subscriptions")
      .update({
        cancel_at_period_end: true,
        status: "active",
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (updateError) {
      log(`Error cancelling subscription: ${updateError.message}`, "razorpay");
      return NextResponse.json(
        { error: "Failed to cancel subscription" },
        { status: 500 }
      );
    }

    log(`Subscription cancelled for user: ${userId}`, "razorpay");

    return NextResponse.json({
      success: true,
      message: "Subscription will be cancelled at the end of the current billing period",
    });
  } catch (error: any) {
    log(`Error in cancel-subscription: ${error.message}`, "razorpay");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

