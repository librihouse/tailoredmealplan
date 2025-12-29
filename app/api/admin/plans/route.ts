/**
 * Admin Plans API
 * Protected by admin API key
 * GET /api/admin/plans - List all plans (including inactive)
 * POST /api/admin/plans - Create new plan
 */

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, supabase } from "@/server/supabase";

const getSupabaseClient = () => supabaseAdmin || supabase;

/**
 * Verify admin API key
 */
function verifyAdminKey(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const apiKey = process.env.ADMIN_API_KEY;

  if (!apiKey) {
    return false; // No admin key configured
  }

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return false;
  }

  const providedKey = authHeader.substring(7);
  return providedKey === apiKey;
}

export async function GET(request: NextRequest) {
  if (!verifyAdminKey(request)) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const dbClient = getSupabaseClient();
    if (!dbClient) {
      return NextResponse.json(
        { error: "Database not available" },
        { status: 500 }
      );
    }

    const { data, error } = await dbClient
      .from("plans")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      plans: data || [],
      count: data?.length || 0,
    });
  } catch (error: any) {
    console.error("Error fetching plans:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch plans",
        message: error.message,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  if (!verifyAdminKey(request)) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const {
      id,
      name,
      description,
      category,
      price_monthly,
      price_annual,
      limits,
      features,
      support,
      cta,
      popular,
      is_active,
      sort_order,
    } = body;

    // Validate required fields
    if (!id || !name || !category || price_monthly === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: id, name, category, price_monthly" },
        { status: 400 }
      );
    }

    const dbClient = getSupabaseClient();
    if (!dbClient) {
      return NextResponse.json(
        { error: "Database not available" },
        { status: 500 }
      );
    }

    const { data, error } = await dbClient
      .from("plans")
      .insert({
        id,
        name,
        description: description || null,
        category,
        price_monthly,
        price_annual: price_annual || price_monthly,
        limits: limits || {},
        features: features || {},
        support: support || "email",
        cta: cta || "Get Started",
        popular: popular || false,
        is_active: is_active !== undefined ? is_active : true,
        sort_order: sort_order || 0,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      plan: data,
      message: "Plan created successfully",
    }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating plan:", error);
    return NextResponse.json(
      {
        error: "Failed to create plan",
        message: error.message,
      },
      { status: 500 }
    );
  }
}

