/**
 * Usage Monitoring Service
 * Tracks API costs and usage for analytics and cost control
 */

import { supabaseAdmin, supabase } from "../supabase";

// Use admin client if available, otherwise fallback to regular client
const getSupabaseClient = () => supabaseAdmin || supabase;

// OpenAI GPT-4o-mini pricing (as of 2024)
const INPUT_COST_PER_MILLION = 0.15; // $0.15 per 1M input tokens
const OUTPUT_COST_PER_MILLION = 0.60; // $0.60 per 1M output tokens

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface CostAnalytics {
  totalCost: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  costPerPlanType: {
    daily: { cost: number; count: number };
    weekly: { cost: number; count: number };
    monthly: { cost: number; count: number };
  };
  costPerUser: Array<{
    userId: string;
    cost: number;
    planCount: number;
  }>;
  alerts: string[];
}

/**
 * Calculate OpenAI API cost based on token usage
 */
export function calculateCost(inputTokens: number, outputTokens: number): number {
  const inputCost = (inputTokens / 1_000_000) * INPUT_COST_PER_MILLION;
  const outputCost = (outputTokens / 1_000_000) * OUTPUT_COST_PER_MILLION;
  return inputCost + outputCost;
}

/**
 * Log API usage for a meal plan generation
 */
export async function logApiUsage(
  userId: string,
  mealPlanId: string | null,
  planType: 'daily' | 'weekly' | 'monthly',
  tokenUsage: TokenUsage
): Promise<void> {
  const dbClient = getSupabaseClient();
  
  if (!dbClient) {
    console.warn("Database client not available, skipping API usage logging");
    return;
  }

  try {
    const estimatedCost = calculateCost(tokenUsage.promptTokens, tokenUsage.completionTokens);

    const { error } = await dbClient
      .from('api_usage_logs')
      .insert({
        user_id: userId,
        meal_plan_id: mealPlanId,
        plan_type: planType,
        model: 'gpt-4o-mini',
        input_tokens: tokenUsage.promptTokens,
        output_tokens: tokenUsage.completionTokens,
        total_tokens: tokenUsage.totalTokens,
        estimated_cost: estimatedCost,
      });

    if (error) {
      console.error("Error logging API usage:", error);
    }
  } catch (error) {
    console.error("Exception logging API usage:", error);
  }
}

/**
 * Get monthly costs for a specific user
 */
export async function getMonthlyCosts(
  userId: string,
  month: string // Format: "2025-01"
): Promise<number> {
  const dbClient = getSupabaseClient();
  
  if (!dbClient) {
    return 0;
  }

  try {
    const startDate = `${month}-01T00:00:00Z`;
    const endDate = new Date(`${month}-01`);
    endDate.setMonth(endDate.getMonth() + 1);
    const endDateStr = endDate.toISOString().split('T')[0] + 'T00:00:00Z';

    const { data, error } = await dbClient
      .from('api_usage_logs')
      .select('estimated_cost')
      .eq('user_id', userId)
      .gte('created_at', startDate)
      .lt('created_at', endDateStr);

    if (error) {
      console.error("Error fetching monthly costs:", error);
      return 0;
    }

    return data?.reduce((sum, log) => sum + (log.estimated_cost || 0), 0) || 0;
  } catch (error) {
    console.error("Exception fetching monthly costs:", error);
    return 0;
  }
}

/**
 * Check if costs exceed 1% of revenue threshold
 */
export async function checkCostThresholds(): Promise<string[]> {
  const dbClient = getSupabaseClient();
  
  if (!dbClient) {
    return [];
  }

  const alerts: string[] = [];

  try {
    // Get total costs for current month
    const now = new Date();
    const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const startDate = `${monthStr}-01T00:00:00Z`;
    const endDate = new Date(`${monthStr}-01`);
    endDate.setMonth(endDate.getMonth() + 1);
    const endDateStr = endDate.toISOString().split('T')[0] + 'T00:00:00Z';

    const { data: usageLogs } = await dbClient
      .from('api_usage_logs')
      .select('estimated_cost, user_id')
      .gte('created_at', startDate)
      .lt('created_at', endDateStr);

    if (!usageLogs) {
      return alerts;
    }

    const totalCost = usageLogs.reduce((sum, log) => sum + (log.estimated_cost || 0), 0);

    // Get total revenue for current month (from subscriptions)
    const { data: subscriptions } = await dbClient
      .from('subscriptions')
      .select('plan_id')
      .eq('status', 'active')
      .gte('current_period_start', startDate)
      .lt('current_period_start', endDateStr);

    // Calculate revenue (simplified - would need to fetch plan prices)
    // For now, use a rough estimate
    const estimatedRevenue = (subscriptions?.length || 0) * 20; // Rough average

    if (estimatedRevenue > 0) {
      const costPercentage = (totalCost / estimatedRevenue) * 100;
      if (costPercentage > 1) {
        alerts.push(
          `Warning: API costs ($${totalCost.toFixed(2)}) exceed 1% of revenue (${costPercentage.toFixed(2)}%)`
        );
      }
    }

    return alerts;
  } catch (error) {
    console.error("Error checking cost thresholds:", error);
    return alerts;
  }
}

/**
 * Get cost analytics for admin dashboard
 */
export async function getCostAnalytics(
  startDate: string,
  endDate: string
): Promise<CostAnalytics> {
  const dbClient = getSupabaseClient();
  
  const defaultAnalytics: CostAnalytics = {
    totalCost: 0,
    totalInputTokens: 0,
    totalOutputTokens: 0,
    totalTokens: 0,
    costPerPlanType: {
      daily: { cost: 0, count: 0 },
      weekly: { cost: 0, count: 0 },
      monthly: { cost: 0, count: 0 },
    },
    costPerUser: [],
    alerts: [],
  };

  if (!dbClient) {
    return defaultAnalytics;
  }

  try {
    const { data: logs, error } = await dbClient
      .from('api_usage_logs')
      .select('*')
      .gte('created_at', startDate)
      .lt('created_at', endDate);

    if (error || !logs) {
      console.error("Error fetching cost analytics:", error);
      return defaultAnalytics;
    }

    // Calculate totals
    const totalCost = logs.reduce((sum, log) => sum + (log.estimated_cost || 0), 0);
    const totalInputTokens = logs.reduce((sum, log) => sum + (log.input_tokens || 0), 0);
    const totalOutputTokens = logs.reduce((sum, log) => sum + (log.output_tokens || 0), 0);
    const totalTokens = logs.reduce((sum, log) => sum + (log.total_tokens || 0), 0);

    // Calculate cost per plan type
    const costPerPlanType = {
      daily: { cost: 0, count: 0 },
      weekly: { cost: 0, count: 0 },
      monthly: { cost: 0, count: 0 },
    };

    logs.forEach(log => {
      const planType = log.plan_type as 'daily' | 'weekly' | 'monthly';
      if (costPerPlanType[planType]) {
        costPerPlanType[planType].cost += log.estimated_cost || 0;
        costPerPlanType[planType].count += 1;
      }
    });

    // Calculate cost per user
    const userCosts = new Map<string, { cost: number; count: number }>();
    logs.forEach(log => {
      const userId = log.user_id;
      const current = userCosts.get(userId) || { cost: 0, count: 0 };
      current.cost += log.estimated_cost || 0;
      current.count += 1;
      userCosts.set(userId, current);
    });

    const costPerUser = Array.from(userCosts.entries()).map(([userId, data]) => ({
      userId,
      cost: data.cost,
      planCount: data.count,
    }));

    // Get alerts
    const alerts = await checkCostThresholds();

    return {
      totalCost,
      totalInputTokens,
      totalOutputTokens,
      totalTokens,
      costPerPlanType,
      costPerUser,
      alerts,
    };
  } catch (error) {
    console.error("Exception fetching cost analytics:", error);
    return defaultAnalytics;
  }
}

