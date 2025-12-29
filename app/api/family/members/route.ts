/**
 * Family Members API Routes
 * Handles family member management for family plans
 */

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/server/supabase";
import { authenticateRequest, log } from "@/lib/api-helpers";

/**
 * GET /api/family/members
 * Get all family members for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { userId } = authResult;

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 500 }
      );
    }

    const { data: members, error } = await supabaseAdmin
      .from("family_members")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (error) {
      log(`Error fetching family members: ${error.message}`, "family");
      return NextResponse.json(
        { error: "Failed to fetch family members" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      members: members || [],
    });
  } catch (error: any) {
    log(`Error in family/members/get: ${error.message}`, "family");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/family/members
 * Add a new family member
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { userId } = authResult;

    const body = await request.json();
    const {
      name,
      age,
      gender,
      height,
      currentWeight,
      targetWeight,
      activityLevel,
      religiousDiet,
      medicalConditions,
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 500 }
      );
    }

    // Check current member count (max 5)
    const { data: existingMembers, error: countError } = await supabaseAdmin
      .from("family_members")
      .select("id")
      .eq("user_id", userId);

    if (countError) {
      log(`Error checking member count: ${countError.message}`, "family");
      return NextResponse.json(
        { error: "Failed to check member count" },
        { status: 500 }
      );
    }

    if (existingMembers && existingMembers.length >= 5) {
      return NextResponse.json(
        { error: "Maximum of 5 family members allowed" },
        { status: 400 }
      );
    }

    // Insert new member
    const { data: newMember, error: insertError } = await supabaseAdmin
      .from("family_members")
      .insert({
        user_id: userId,
        name: name.trim(),
        age: age ? parseInt(age, 10) : null,
        gender: gender || null,
        height: height ? parseFloat(height) : null,
        current_weight: currentWeight ? parseFloat(currentWeight) : null,
        target_weight: targetWeight ? parseFloat(targetWeight) : null,
        activity_level: activityLevel || null,
        religious_diet: religiousDiet || "none",
        medical_conditions: medicalConditions && Array.isArray(medicalConditions) 
          ? medicalConditions 
          : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      log(`Error creating family member: ${insertError.message}`, "family");
      return NextResponse.json(
        { error: "Failed to create family member" },
        { status: 500 }
      );
    }

    log(`Family member created: ${newMember.id} for user ${userId}`, "family");

    return NextResponse.json({
      success: true,
      member: newMember,
    });
  } catch (error: any) {
    log(`Error in family/members/post: ${error.message}`, "family");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

