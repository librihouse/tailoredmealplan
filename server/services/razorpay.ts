/**
 * Razorpay Service
 * Handles Razorpay payment processing
 */

import Razorpay from "razorpay";
import { log } from "../index";
import { getRazorpayPlan } from "../config/razorpay-plans";

const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

if (!keyId || !keySecret) {
  console.warn("Razorpay credentials not configured. Payment features will not work.");
}

// Initialize Razorpay instance
export const razorpay = keyId && keySecret
  ? new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    })
  : null;

/**
 * Create a Razorpay order
 */
export async function createRazorpayOrder(params: {
  planId: string;
  userId: string;
  billingInterval: "monthly" | "annual";
}): Promise<{ orderId: string; amount: number; currency: string }> {
  if (!razorpay) {
    throw new Error("Razorpay is not configured");
  }

  const plan = getRazorpayPlan(params.planId);
  if (!plan) {
    throw new Error(`Plan not found: ${params.planId}`);
  }

  const receipt = `order_${params.userId}_${Date.now()}`;

  try {
    log(`Creating Razorpay order for plan: ${params.planId}`, "razorpay");
    
    const order = await razorpay.orders.create({
      amount: plan.amount, // Amount in cents
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
    log(`Error creating Razorpay order: ${error.message}`, "razorpay");
    throw new Error(`Failed to create payment order: ${error.message}`);
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
  if (!razorpay) {
    throw new Error("Razorpay is not configured");
  }

  try {
    const payment = await razorpay.payments.fetch(paymentId);
    return payment;
  } catch (error: any) {
    log(`Error fetching payment details: ${error.message}`, "razorpay");
    throw new Error(`Failed to fetch payment: ${error.message}`);
  }
}

