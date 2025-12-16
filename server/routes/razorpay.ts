/**
 * Razorpay Payment API Routes
 * Handles payment processing and subscription management
 */

import { Router } from "express";
import { createRazorpayOrder, verifyPaymentSignature, getPaymentDetails } from "../services/razorpay";
import { supabase, getUserFromToken, getUserIdFromRequest } from "../supabase";
import { log } from "../index";
import { getRazorpayPlan } from "../config/razorpay-plans";

const router = Router();

/**
 * Middleware to authenticate requests using Supabase
 */
async function authenticateRequest(req: any, res: any, next: any) {
  try {
    const token = getUserIdFromRequest(req);
    
    if (!token) {
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    const user = await getUserFromToken(token);
    
    if (!user) {
      return res.status(401).json({ error: "Unauthorized: Invalid token" });
    }

    // Attach user to request
    (req as any).user = user;
    (req as any).userId = user.id;
    
    next();
  } catch (error: any) {
    return res.status(401).json({ error: "Unauthorized: " + error.message });
  }
}

/**
 * POST /api/razorpay/create-order
 * Create a Razorpay order for subscription payment
 */
router.post("/create-order", authenticateRequest, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { planId, billingInterval } = req.body;

    if (!planId || !billingInterval) {
      return res.status(400).json({ error: "planId and billingInterval are required" });
    }

    if (!["monthly", "annual"].includes(billingInterval)) {
      return res.status(400).json({ error: "billingInterval must be 'monthly' or 'annual'" });
    }

    // Build full plan ID (e.g., "individual_monthly")
    const fullPlanId = `${planId}_${billingInterval}`;
    const plan = getRazorpayPlan(fullPlanId);
    
    if (!plan) {
      return res.status(400).json({ error: `Invalid plan: ${fullPlanId}` });
    }

    const order = await createRazorpayOrder({
      planId: fullPlanId,
      userId,
      billingInterval,
    });

    res.json({
      orderId: order.orderId,
      amount: order.amount,
      currency: order.currency,
      planId: fullPlanId,
    });
  } catch (error: any) {
    log(`Error creating order: ${error.message}`, "razorpay");
    res.status(500).json({ error: error.message || "Failed to create order" });
  }
});

/**
 * POST /api/razorpay/verify-payment
 * Verify payment signature and update subscription
 */
router.post("/verify-payment", authenticateRequest, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId, billingInterval } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: "Missing payment verification data" });
    }

    // Verify signature
    const isValid = verifyPaymentSignature({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });

    if (!isValid) {
      log(`Invalid payment signature for order: ${razorpay_order_id}`, "razorpay");
      return res.status(400).json({ error: "Invalid payment signature" });
    }

    // Fetch payment details from Razorpay
    const payment = await getPaymentDetails(razorpay_payment_id);

    if (payment.status !== "captured" && payment.status !== "authorized") {
      return res.status(400).json({ error: `Payment not successful. Status: ${payment.status}` });
    }

    // Calculate billing period dates
    const now = new Date();
    const periodEnd = billingInterval === "annual"
      ? new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000)
      : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Update or create subscription in database
    if (!supabase) {
      return res.status(500).json({ error: "Database not configured" });
    }

    // Check if subscription exists
    const { data: existingSub } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .single();

    const subscriptionData = {
      user_id: userId,
      plan_id: planId,
      status: "active",
      stripe_subscription_id: razorpay_payment_id, // Using stripe_subscription_id field for Razorpay payment ID
      stripe_customer_id: razorpay_order_id, // Using stripe_customer_id field for Razorpay order ID
      current_period_start: now.toISOString(),
      current_period_end: periodEnd.toISOString(),
      billing_interval: billingInterval,
      updated_at: now.toISOString(),
    };

    if (existingSub) {
      // Update existing subscription
      const { error: updateError } = await supabase
        .from("subscriptions")
        .update(subscriptionData)
        .eq("user_id", userId);

      if (updateError) {
        log(`Error updating subscription: ${updateError.message}`, "razorpay");
        return res.status(500).json({ error: "Failed to update subscription" });
      }
    } else {
      // Create new subscription
      const { error: insertError } = await supabase
        .from("subscriptions")
        .insert({
          ...subscriptionData,
          created_at: now.toISOString(),
        });

      if (insertError) {
        log(`Error creating subscription: ${insertError.message}`, "razorpay");
        return res.status(500).json({ error: "Failed to create subscription" });
      }
    }

    // Create initial plan usage record if it doesn't exist
    const { data: existingUsage } = await supabase
      .from("plan_usage")
      .select("*")
      .eq("user_id", userId)
      .eq("subscription_id", existingSub?.id || "new")
      .single();

    if (!existingUsage) {
      const { data: newSub } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("user_id", userId)
        .single();

      if (newSub) {
        await supabase.from("plan_usage").insert({
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

    res.json({
      success: true,
      message: "Payment verified and subscription activated",
      subscription: subscriptionData,
    });
  } catch (error: any) {
    log(`Error verifying payment: ${error.message}`, "razorpay");
    res.status(500).json({ error: error.message || "Failed to verify payment" });
  }
});

/**
 * GET /api/razorpay/subscription-status
 * Get current user's subscription status
 */
router.get("/subscription-status", authenticateRequest, async (req, res) => {
  try {
    const userId = (req as any).userId;

    if (!supabase) {
      return res.status(500).json({ error: "Database not configured" });
    }

    const { data: subscription, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") {
      log(`Error fetching subscription: ${error.message}`, "razorpay");
      return res.status(500).json({ error: "Failed to fetch subscription" });
    }

    if (!subscription) {
      return res.json({
        hasSubscription: false,
        subscription: null,
      });
    }

    res.json({
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
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/razorpay/cancel-subscription
 * Cancel subscription (set to cancel at period end)
 */
router.post("/cancel-subscription", authenticateRequest, async (req, res) => {
  try {
    const userId = (req as any).userId;

    if (!supabase) {
      return res.status(500).json({ error: "Database not configured" });
    }

    // Check if subscription exists
    const { data: subscription, error: fetchError } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (fetchError || !subscription) {
      return res.status(404).json({ error: "No active subscription found" });
    }

    // Update subscription to cancel at period end
    const { error: updateError } = await supabase
      .from("subscriptions")
      .update({
        cancel_at_period_end: true,
        status: "active", // Keep active until period ends
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (updateError) {
      log(`Error cancelling subscription: ${updateError.message}`, "razorpay");
      return res.status(500).json({ error: "Failed to cancel subscription" });
    }

    log(`Subscription cancelled for user: ${userId}`, "razorpay");

    res.json({
      success: true,
      message: "Subscription will be cancelled at the end of the current billing period",
    });
  } catch (error: any) {
    log(`Error in cancel-subscription: ${error.message}`, "razorpay");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

