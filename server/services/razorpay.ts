/**
 * Razorpay Service
 * Handles Razorpay payment processing
 */

import Razorpay from "razorpay";
import { log } from "../utils/log";
import { getRazorpayPlan } from "../config/razorpay-plans";

// Function to get Razorpay instance (lazy initialization)
function getRazorpayInstance(): Razorpay | null {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  
  console.log(`[Razorpay] Checking credentials: KEY_ID=${keyId ? 'set (' + keyId.substring(0, 15) + '...)' : 'NOT SET'}, SECRET=${keySecret ? 'set' : 'NOT SET'}`);
  
  if (!keyId || !keySecret) {
    console.warn("[Razorpay] Credentials not configured. Payment features will not work.");
    return null;
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
}

// Cached instance
let razorpayInstance: Razorpay | null = null;

export function getRazorpay(): Razorpay | null {
  if (!razorpayInstance) {
    razorpayInstance = getRazorpayInstance();
  }
  return razorpayInstance;
}

// Legacy export for compatibility
export const razorpay = getRazorpay();

/**
 * Create a Razorpay order
 */
export async function createRazorpayOrder(params: {
  planId: string;
  userId: string;
  billingInterval: "monthly" | "annual";
}): Promise<{ orderId: string; amount: number; currency: string }> {
  // Get fresh instance to ensure env vars are loaded
  const razorpayClient = getRazorpay();
  
  if (!razorpayClient) {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    throw new Error(`Razorpay is not configured. KEY_ID=${keyId ? 'present' : 'MISSING'}, SECRET=${keySecret ? 'present' : 'MISSING'}`);
  }

  const plan = getRazorpayPlan(params.planId);
  if (!plan) {
    throw new Error(`Plan not found: ${params.planId}`);
  }

  // Razorpay receipt must be max 40 characters
  // Format: ord_<userId_8chars>_<timestamp_10chars> = 23 chars max
  const userIdShort = params.userId.substring(0, 8).replace(/-/g, '');
  const timestamp = Date.now().toString().slice(-10);
  const receipt = `ord_${userIdShort}_${timestamp}`;

  try {
    log(`Creating Razorpay order for plan: ${params.planId}`, "razorpay");
    log(`Plan details: amount=${plan.amount}, currency=${plan.currency}`, "razorpay");
    
    const order = await razorpayClient.orders.create({
      amount: plan.amount, // Amount in paise (smallest currency unit)
      currency: plan.currency,
      receipt,
      notes: {
        user_id: params.userId,
        plan_id: params.planId,
        billing_interval: params.billingInterval,
        plan_name: plan.name,
      },
    });

    log(`Razorpay order created: ${order.id}`, "razorpay");

    return {
      orderId: order.id,
      amount: typeof order.amount === 'string' ? parseInt(order.amount, 10) : order.amount,
      currency: order.currency,
    };
  } catch (error: any) {
    // Log the full error object for debugging
    console.error("[Razorpay] Full error object:", JSON.stringify(error, null, 2));
    const errorMessage = error?.error?.description || error?.message || error?.description || JSON.stringify(error);
    log(`Error creating Razorpay order: ${errorMessage}`, "razorpay");
    throw new Error(`Failed to create payment order: ${errorMessage}`);
  }
}

/**
 * Verify Razorpay payment signature
 */
export function verifyPaymentSignature(params: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}): boolean {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    throw new Error("Razorpay key secret not configured");
  }

  const crypto = require("crypto");
  const text = `${params.razorpay_order_id}|${params.razorpay_payment_id}`;
  const generatedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(text)
    .digest("hex");

  return generatedSignature === params.razorpay_signature;
}

/**
 * Fetch payment details from Razorpay
 */
export async function getPaymentDetails(paymentId: string): Promise<any> {
  const razorpayClient = getRazorpay();
  if (!razorpayClient) {
    throw new Error("Razorpay is not configured");
  }

  try {
    const payment = await razorpayClient.payments.fetch(paymentId);
    return payment;
  } catch (error: any) {
    const errorMessage = error?.error?.description || error?.message || JSON.stringify(error);
    log(`Error fetching payment details: ${errorMessage}`, "razorpay");
    throw new Error(`Failed to fetch payment: ${errorMessage}`);
  }
}

