/**
 * Admin Plans API - Update/Delete specific plan
 * PUT /api/admin/plans/[id] - Update plan
 * DELETE /api/admin/plans/[id] - Deactivate plan (soft delete)
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
    return false;
  }

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return false;
  }

  const providedKey = authHeader.substring(7);
  return providedKey === apiKey;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!verifyAdminKey(request)) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { id: planId } = await params;

    const dbClient = getSupabaseClient();
    if (!dbClient) {
      return NextResponse.json(
        { error: "Database not available" },
        { status: 500 }
      );
    }

    // Build update object (only include provided fields)
    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.price_monthly !== undefined) updateData.price_monthly = body.price_monthly;
    if (body.price_annual !== undefined) updateData.price_annual = body.price_annual;
    if (body.limits !== undefined) updateData.limits = body.limits;
    if (body.features !== undefined) updateData.features = body.features;
    if (body.support !== undefined) updateData.support = body.support;
    if (body.cta !== undefined) updateData.cta = body.cta;
    if (body.popular !== undefined) updateData.popular = body.popular;
    if (body.is_active !== undefined) updateData.is_active = body.is_active;
    if (body.sort_order !== undefined) updateData.sort_order = body.sort_order;

    updateData.updated_at = new Date().toISOString();

    const { data, error } = await dbClient
      .from("plans")
      .update(updateData)
      .eq("id", planId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      return NextResponse.json(
        { error: "Plan not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      plan: data,
      message: "Plan updated successfully",
    });
  } catch (error: any) {
    console.error("Error updating plan:", error);
    return NextResponse.json(
      {
        error: "Failed to update plan",
        message: error.message,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!verifyAdminKey(request)) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const { id: planId } = await params;

    const dbClient = getSupabaseClient();
    if (!dbClient) {
      return NextResponse.json(
        { error: "Database not available" },
        { status: 500 }
      );
    }

    // Soft delete: set is_active to false
    const { data, error } = await dbClient
      .from("plans")
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", planId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      return NextResponse.json(
        { error: "Plan not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      plan: data,
      message: "Plan deactivated successfully",
    });
  } catch (error: any) {
    console.error("Error deactivating plan:", error);
    return NextResponse.json(
      {
        error: "Failed to deactivate plan",
        message: error.message,
      },
      { status: 500 }
    );
  }
}

