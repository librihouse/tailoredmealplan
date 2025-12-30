/**
 * POST /api/razorpay/create-order
 * Create a Razorpay order for subscription payment
 */

import { NextRequest, NextResponse } from "next/server";
import { createRazorpayOrder } from "@/server/services/razorpay";
import { getRazorpayPlan } from "@/server/config/razorpay-plans";
import { authenticateRequest, log } from "@/lib/api-helpers";

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { userId } = authResult;

    const body = await request.json();
    const { planId } = body;

    if (!planId) {
      return NextResponse.json(
        { error: "planId is required" },
        { status: 400 }
      );
    }

    // Only monthly billing for MVP
    const billingInterval = "monthly";

    // Build full plan ID (e.g., "individual_monthly")
    const fullPlanId = `${planId}_${billingInterval}`;
    const plan = getRazorpayPlan(fullPlanId);
    
    if (!plan) {
      return NextResponse.json(
        { error: `Invalid plan: ${fullPlanId}` },
        { status: 400 }
      );
    }

    const order = await createRazorpayOrder({
      planId: fullPlanId,
      userId,
      billingInterval,
    });

    return NextResponse.json({
      orderId: order.orderId,
      amount: order.amount,
      currency: order.currency,
      planId: fullPlanId,
    });
  } catch (error: any) {
    log(`Error creating order: ${error.message}`, "razorpay");
    return NextResponse.json(
      { error: error.message || "Failed to create order" },
      { status: 500 }
    );
  }
}

