/**
 * Credit Add-On Service
 * Handles credit purchases and management for Professional tier users
 */

import { supabaseAdmin, supabase } from "../supabase";

// Use admin client if available, otherwise fallback to regular client
const getSupabaseClient = () => supabaseAdmin || supabase;

export interface CreditPurchase {
  id: string;
  user_id: string;
  plan_id: string;
  credits_amount: number;
  price: number;
  status: 'pending' | 'completed' | 'failed' | 'expired';
  payment_id: string | null;
  applied_to_usage: boolean;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface AvailableAddOn {
  credits_amount: number;
  price: number;
  description: string;
}

/**
 * Create a credit purchase record
 */
export async function purchaseCredits(
  userId: string,
  amount: number,
  price: number
): Promise<CreditPurchase> {
  const dbClient = getSupabaseClient();
  
  if (!dbClient) {
    throw new Error("Database client not available");
  }

  // Validate: amount must be 900, price must be 49.99
  if (amount !== 900) {
    throw new Error("Invalid credits amount. Only 900 credit packs are available.");
  }

  if (price !== 49.99) {
    throw new Error("Invalid price. Credit pack price must be $49.99.");
  }

  // Set expires_at to 30 days from now
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  const { data, error } = await dbClient
    .from('credit_purchases')
    .insert({
      user_id: userId,
      plan_id: 'professional',
      credits_amount: amount,
      price: price,
      status: 'pending',
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to create credit purchase: ${error?.message || 'Unknown error'}`);
  }

  return data as CreditPurchase;
}

/**
 * Apply purchased credits to user's usage balance
 */
export async function applyCreditsToUsage(
  userId: string,
  purchaseId: string
): Promise<void> {
  const dbClient = getSupabaseClient();
  
  if (!dbClient) {
    throw new Error("Database client not available");
  }

  // Get the purchase record
  const { data: purchase, error: purchaseError } = await dbClient
    .from('credit_purchases')
    .select('*')
    .eq('id', purchaseId)
    .eq('user_id', userId)
    .single();

  if (purchaseError || !purchase) {
    throw new Error(`Credit purchase not found: ${purchaseError?.message || 'Unknown error'}`);
  }

  if (purchase.status !== 'completed') {
    throw new Error(`Cannot apply credits: purchase status is ${purchase.status}`);
  }

  if (purchase.applied_to_usage) {
    // Already applied, skip
    return;
  }

  // Get current usage record
  const { data: subscriptions } = await dbClient
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .limit(1);

  let subscriptionId: string | null = null;
  if (subscriptions && subscriptions.length > 0) {
    subscriptionId = subscriptions[0].id;
  }

  // Find or create usage record
  const now = new Date().toISOString();
  let { data: usage } = await dbClient
    .from('plan_usage')
    .select('*')
    .eq('user_id', userId)
    .eq('subscription_id', subscriptionId || null)
    .gte('billing_period_end', now)
    .limit(1)
    .single();

  if (!usage) {
    // Create new usage record if it doesn't exist
    const periodStart = new Date();
    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    const { data: newUsage, error: createError } = await dbClient
      .from('plan_usage')
      .insert({
        user_id: userId,
        subscription_id: subscriptionId,
        billing_period_start: periodStart.toISOString(),
        billing_period_end: periodEnd.toISOString(),
        credits_purchased: 0,
        credits_expires_at: purchase.expires_at,
      })
      .select()
      .single();

    if (createError || !newUsage) {
      throw new Error(`Failed to create usage record: ${createError?.message || 'Unknown error'}`);
    }

    usage = newUsage;
  }

  // Update usage with purchased credits
  const currentPurchased = (usage.credits_purchased || 0) + purchase.credits_amount;
  const currentExpiresAt = usage.credits_expires_at 
    ? new Date(usage.credits_expires_at)
    : new Date(purchase.expires_at);
  const purchaseExpiresAt = new Date(purchase.expires_at);
  
  // Use earliest expiry date if multiple purchases exist
  const earliestExpiry = currentExpiresAt < purchaseExpiresAt 
    ? currentExpiresAt 
    : purchaseExpiresAt;

  const { error: updateError } = await dbClient
    .from('plan_usage')
    .update({
      credits_purchased: currentPurchased,
      credits_expires_at: earliestExpiry.toISOString(),
    })
    .eq('id', usage.id);

  if (updateError) {
    throw new Error(`Failed to apply credits to usage: ${updateError.message}`);
  }

  // Mark purchase as applied
  const { error: markError } = await dbClient
    .from('credit_purchases')
    .update({ applied_to_usage: true })
    .eq('id', purchaseId);

  if (markError) {
    console.error(`Failed to mark purchase as applied: ${markError.message}`);
    // Don't throw - credits were already applied
  }
}

/**
 * Get available add-on packs for a plan
 */
export async function getAvailableAddOns(planId: string): Promise<AvailableAddOn[]> {
  // Only available for professional plan
  if (planId !== 'professional') {
    return [];
  }

  return [
    {
      credits_amount: 900,
      price: 49.99,
      description: "Expand your capacity for high-volume client management",
    },
  ];
}

/**
 * Check and remove expired purchased credits
 */
export async function checkCreditExpiry(userId: string): Promise<void> {
  const dbClient = getSupabaseClient();
  
  if (!dbClient) {
    return;
  }

  try {
    // Find expired purchases
    const now = new Date().toISOString();
    const { data: expiredPurchases } = await dbClient
      .from('credit_purchases')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .lt('expires_at', now);

    if (!expiredPurchases || expiredPurchases.length === 0) {
      return;
    }

    // Calculate total expired credits
    const totalExpired = expiredPurchases.reduce((sum, purchase) => {
      return sum + (purchase.applied_to_usage ? purchase.credits_amount : 0);
    }, 0);

    if (totalExpired === 0) {
      return;
    }

    // Get current usage record
    const { data: subscriptions } = await dbClient
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .limit(1);

    let subscriptionId: string | null = null;
    if (subscriptions && subscriptions.length > 0) {
      subscriptionId = subscriptions[0].id;
    }

    const { data: usage } = await dbClient
      .from('plan_usage')
      .select('*')
      .eq('user_id', userId)
      .eq('subscription_id', subscriptionId || null)
      .gte('billing_period_end', now)
      .limit(1)
      .single();

    if (!usage) {
      return;
    }

    // Subtract expired credits
    const currentPurchased = Math.max(0, (usage.credits_purchased || 0) - totalExpired);

    // Find next expiry date from remaining purchases
    const { data: remainingPurchases } = await dbClient
      .from('credit_purchases')
      .select('expires_at')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .gte('expires_at', now)
      .order('expires_at', { ascending: true })
      .limit(1);

    let nextExpiry: string | null = null;
    if (remainingPurchases && remainingPurchases.length > 0) {
      nextExpiry = remainingPurchases[0].expires_at;
    }

    // Update usage record
    await dbClient
      .from('plan_usage')
      .update({
        credits_purchased: currentPurchased,
        credits_expires_at: nextExpiry,
      })
      .eq('id', usage.id);

    // Mark expired purchases
    await dbClient
      .from('credit_purchases')
      .update({ status: 'expired' })
      .in('id', expiredPurchases.map(p => p.id));
  } catch (error) {
    console.error("Error checking credit expiry:", error);
  }
}

