/**
 * GET /api/mealplan/[id] - Get a specific meal plan by ID
 * DELETE /api/mealplan/[id] - Delete a meal plan
 */

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/server/supabase";
import { authenticateRequest, log } from "@/lib/api-helpers";

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

    const { id: planId } = await params;

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 500 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("meal_plans")
      .select("*")
      .eq("id", planId)
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Meal plan not found" },
          { status: 404 }
        );
      }
      log(`Error fetching meal plan: ${error.message}`, "mealplan");
      return NextResponse.json(
        { error: "Failed to fetch meal plan" },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Meal plan not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    log(`Error in get endpoint: ${error.message}`, "mealplan");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

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

    const { id: planId } = await params;

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 500 }
      );
    }

    // First verify the plan belongs to the user
    const { data: existingPlan, error: fetchError } = await supabaseAdmin
      .from("meal_plans")
      .select("id")
      .eq("id", planId)
      .eq("user_id", userId)
      .single();

    if (fetchError || !existingPlan) {
      return NextResponse.json(
        { error: "Meal plan not found" },
        { status: 404 }
      );
    }

    // Delete the plan
    const { error: deleteError } = await supabaseAdmin
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

    return NextResponse.json({ success: true, message: "Meal plan deleted successfully" });
  } catch (error: any) {
    log(`Error in delete endpoint: ${error.message}`, "mealplan");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

