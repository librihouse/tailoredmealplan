/**
 * POST /api/razorpay/verify-payment
 * Verify payment signature and update subscription
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyPaymentSignature, getPaymentDetails } from "@/server/services/razorpay";
import { supabaseAdmin } from "@/server/supabase";
import { authenticateRequest, log } from "@/lib/api-helpers";

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { userId } = authResult;

    const body = await request.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId, billingInterval } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: "Missing payment verification data" },
        { status: 400 }
      );
    }

    // Verify signature
    const isValid = verifyPaymentSignature({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });

    if (!isValid) {
      log(`Invalid payment signature for order: ${razorpay_order_id}`, "razorpay");
      return NextResponse.json(
        { error: "Invalid payment signature" },
        { status: 400 }
      );
    }

    // Fetch payment details from Razorpay
    const payment = await getPaymentDetails(razorpay_payment_id);

    if (payment.status !== "captured" && payment.status !== "authorized") {
      return NextResponse.json(
        { error: `Payment not successful. Status: ${payment.status}` },
        { status: 400 }
      );
    }

    // Calculate billing period dates
    const now = new Date();
    const periodEnd = billingInterval === "annual"
      ? new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000)
      : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Update or create subscription in database
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 500 }
      );
    }

    // Check if subscription exists
    const { data: existingSub } = await supabaseAdmin
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .single();

    const subscriptionData = {
      user_id: userId,
      plan_id: planId,
      status: "active",
      stripe_subscription_id: razorpay_payment_id,
      stripe_customer_id: razorpay_order_id,
      current_period_start: now.toISOString(),
      current_period_end: periodEnd.toISOString(),
      billing_interval: billingInterval,
      updated_at: now.toISOString(),
    };

    if (existingSub) {
      // Update existing subscription
      const { error: updateError } = await supabaseAdmin
        .from("subscriptions")
        .update(subscriptionData)
        .eq("user_id", userId);

      if (updateError) {
        log(`Error updating subscription: ${updateError.message}`, "razorpay");
        return NextResponse.json(
          { error: "Failed to update subscription" },
          { status: 500 }
        );
      }
    } else {
      // Create new subscription
      const { error: insertError } = await supabaseAdmin
        .from("subscriptions")
        .insert({
          ...subscriptionData,
          created_at: now.toISOString(),
        });

      if (insertError) {
        log(`Error creating subscription: ${insertError.message}`, "razorpay");
        return NextResponse.json(
          { error: "Failed to create subscription" },
          { status: 500 }
        );
      }
    }

    // Create initial plan usage record if it doesn't exist
    const { data: existingUsage } = await supabaseAdmin
      .from("plan_usage")
      .select("*")
      .eq("user_id", userId)
      .eq("subscription_id", existingSub?.id || "new")
      .single();

    if (!existingUsage) {
      const { data: newSub } = await supabaseAdmin
        .from("subscriptions")
        .select("id")
        .eq("user_id", userId)
        .single();

      if (newSub) {
        await supabaseAdmin.from("plan_usage").insert({
          user_id: userId,
          subscription_id: newSub.id,
          billing_period_start: now.toISOString(),
          billing_period_end: periodEnd.toISOString(),
          weekly_plans_used: 0,
          monthly_plans_used: 0,
        });
      }
    }

    log(`Payment verified and subscription updated for user: ${userId}`, "razorpay");

    return NextResponse.json({
      success: true,
      message: "Payment verified and subscription activated",
      subscription: subscriptionData,
    });
  } catch (error: any) {
    log(`Error verifying payment: ${error.message}`, "razorpay");
    return NextResponse.json(
      { error: error.message || "Failed to verify payment" },
      { status: 500 }
    );
  }
}

