/**
 * POST /api/razorpay/verify-payment
 * Verify payment signature and update subscription
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyPaymentSignature, getPaymentDetails } from "@/server/services/razorpay";
import { supabaseAdmin } from "@/server/supabase";
import { authenticateRequest, log } from "@/lib/api-helpers";
import { B2C_PLANS } from "@/shared/plans";

export async function POST(request: NextRequest) {
  try {
    // #region agent log - Verify payment route entry
    fetch('http://127.0.0.1:7242/ingest/29ee16f2-f385-440f-b653-567260a65333',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'verify-payment/route.ts:entry',message:'Verify payment route called',data:{timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'F'})}).catch(()=>{});
    // #endregion
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) {
      // #region agent log - Auth failed
      fetch('http://127.0.0.1:7242/ingest/29ee16f2-f385-440f-b653-567260a65333',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'verify-payment/route.ts:authFailed',message:'Authentication failed',data:{timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'F'})}).catch(()=>{});
      // #endregion
      return authResult;
    }
    const { userId } = authResult;

    const body = await request.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId } = body;
    // #region agent log - Request body parsed
    fetch('http://127.0.0.1:7242/ingest/29ee16f2-f385-440f-b653-567260a65333',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'verify-payment/route.ts:bodyParsed',message:'Request body parsed',data:{hasOrderId:!!razorpay_order_id,hasPaymentId:!!razorpay_payment_id,hasSignature:!!razorpay_signature,hasPlanId:!!planId,userId},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'F'})}).catch(()=>{});
    // #endregion

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: "Missing payment verification data" },
        { status: 400 }
      );
    }

    // Only monthly billing for MVP
    const billingInterval = "monthly";

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

    // Calculate billing period dates (30 days for monthly billing)
    const now = new Date();
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

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
      razorpay_subscription_id: razorpay_payment_id,
      razorpay_customer_id: razorpay_order_id,
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

    // Get the subscription ID (either existing or newly created)
    let subscriptionId: string;
    if (existingSub) {
      subscriptionId = existingSub.id;
    } else {
      const { data: newSub, error: fetchError } = await supabaseAdmin
        .from("subscriptions")
        .select("id")
        .eq("user_id", userId)
        .single();

      if (fetchError || !newSub) {
        log(`Error fetching subscription after creation: ${fetchError?.message}`, "razorpay");
        // Continue anyway - plan_usage can be created later
        subscriptionId = "";
      } else {
        subscriptionId = newSub.id;
      }
    }

    // Get plan details to allocate credits
    const basePlanId = planId.replace("_monthly", "").replace("_annual", "");
    const plan = B2C_PLANS[basePlanId as keyof typeof B2C_PLANS];
    const monthlyCredits = plan?.limits.monthlyCredits || 0;

    // Create or update plan usage record with credits allocation
    if (subscriptionId) {
      const { data: existingUsage } = await supabaseAdmin
        .from("plan_usage")
        .select("*")
        .eq("user_id", userId)
        .eq("subscription_id", subscriptionId)
        .single();

      if (!existingUsage) {
        // Create new usage record with credits allocated
        const { error: usageError } = await supabaseAdmin.from("plan_usage").insert({
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
        });

        if (usageError) {
          log(`Error creating plan usage: ${usageError.message}`, "razorpay");
          // Don't fail the whole request - usage can be created later
        } else {
          log(`Plan usage created with ${monthlyCredits} credits allocated for user: ${userId}`, "razorpay");
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
          })
          .eq("user_id", userId)
          .eq("subscription_id", subscriptionId);

        if (updateUsageError) {
          log(`Error updating plan usage: ${updateUsageError.message}`, "razorpay");
        } else {
          log(`Plan usage updated with ${monthlyCredits} credits allocated for user: ${userId}`, "razorpay");
        }
      }
    }

    log(`Payment verified and subscription updated for user: ${userId}`, "razorpay");

    // #region agent log - Success response
    fetch('http://127.0.0.1:7242/ingest/29ee16f2-f385-440f-b653-567260a65333',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'verify-payment/route.ts:success',message:'Payment verification successful, returning response',data:{userId,planId,timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'G'})}).catch(()=>{});
    // #endregion
    return NextResponse.json({
      success: true,
      message: "Payment verified and subscription activated",
      subscription: subscriptionData,
    });
  } catch (error: any) {
    // #region agent log - Error in verify payment
    fetch('http://127.0.0.1:7242/ingest/29ee16f2-f385-440f-b653-567260a65333',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'verify-payment/route.ts:error',message:'Error in payment verification',data:{errorMessage:error?.message,errorName:error?.name,errorStack:error?.stack?.substring(0,300),timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H'})}).catch(()=>{});
    // #endregion
    log(`Error verifying payment: ${error.message}`, "razorpay");
    return NextResponse.json(
      { error: error.message || "Failed to verify payment" },
      { status: 500 }
    );
  }
}

