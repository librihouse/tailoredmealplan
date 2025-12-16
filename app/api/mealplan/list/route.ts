/**
 * GET /api/mealplan/list
 * Get all meal plans for the authenticated user
 */

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/server/supabase";
import { authenticateRequest, log } from "@/lib/api-helpers";

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { userId } = authResult;

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const limit = searchParams.get("limit");
    const offset = searchParams.get("offset");
    
    const limitNum = limit ? parseInt(limit, 10) : 50;
    const offsetNum = offset ? parseInt(offset, 10) : 0;

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 500 }
      );
    }

    let query = supabaseAdmin
      .from("meal_plans")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(offsetNum, offsetNum + limitNum - 1);

    if (type && ["daily", "weekly", "monthly"].includes(type)) {
      query = query.eq("plan_type", type);
    }

    const { data, error } = await query;

    if (error) {
      log(`Error fetching meal plans: ${error.message}`, "mealplan");
      return NextResponse.json(
        { error: "Failed to fetch meal plans" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      plans: data || [],
      total: data?.length || 0,
    });
  } catch (error: any) {
    log(`Error in list endpoint: ${error.message}`, "mealplan");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

