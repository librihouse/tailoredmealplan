/**
 * Meal Plan Operations API Routes
 * GET and DELETE operations for individual meal plans
 */

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, supabase } from "@/server/supabase";
import { authenticateRequest, log } from "@/lib/api-helpers";
import { generateMealPlan, type UserProfile } from "@/server/services/openai";
import { checkQuota, incrementUsage, getCreditsRequired, type PlanType } from "@/server/quota-supabase";

// Use admin client if available, otherwise fallback to regular client
const getSupabaseClient = () => supabaseAdmin || supabase;

/**
 * GET /api/mealplan/[id]
 * Get a single meal plan by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { userId } = authResult;

    const dbClient = getSupabaseClient();
    if (!dbClient) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 500 }
      );
    }

    const { id: planId } = await params;

    const { data: plan, error } = await dbClient
      .from("meal_plans")
      .select("*")
      .eq("id", planId)
      .eq("user_id", userId)
      .single();

    if (error || !plan) {
      return NextResponse.json(
        { error: "Meal plan not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      plan,
    });
  } catch (error: any) {
    log(`Error in mealplan/get: ${error.message}`, "mealplan");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/mealplan/[id]
 * Delete a meal plan
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { userId } = authResult;

    const dbClient = getSupabaseClient();
    if (!dbClient) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 500 }
      );
    }

    const { id: planId } = await params;

    // Verify the plan belongs to the user
    const { data: plan, error: fetchError } = await dbClient
      .from("meal_plans")
      .select("id")
      .eq("id", planId)
      .eq("user_id", userId)
      .single();

    if (fetchError || !plan) {
      return NextResponse.json(
        { error: "Meal plan not found" },
        { status: 404 }
      );
    }

    // Delete the plan
    const { error: deleteError } = await dbClient
      .from("meal_plans")
      .delete()
      .eq("id", planId)
      .eq("user_id", userId);

    if (deleteError) {
      log(`Error deleting meal plan: ${deleteError.message}`, "mealplan");
      return NextResponse.json(
        { error: "Failed to delete meal plan" },
        { status: 500 }
      );
    }

    log(`Meal plan deleted: ${planId} by user ${userId}`, "mealplan");

    return NextResponse.json({
      success: true,
      message: "Meal plan deleted successfully",
    });
  } catch (error: any) {
    log(`Error in mealplan/delete: ${error.message}`, "mealplan");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
