/**
 * Profile Management API Routes
 * Handles saving and retrieving user profiles (individual and business)
 */

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/server/supabase";
import { authenticateRequest, log } from "@/lib/api-helpers";

/**
 * POST /api/profile/save
 * Save individual user profile (onboarding data)
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
      onboardingCompleted,
      gender,
      age,
      height,
      currentWeight,
      targetWeight,
      goal,
      activity,
      diet,
      religious,
      conditions,
      allergies,
      transitionInfo,
    } = body;

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 500 }
      );
    }

    // Check if profile already exists
    const { data: existingProfile } = await supabaseAdmin
      .from("user_profiles")
      .select("id")
      .eq("user_id", userId)
      .single();

    // For simplified onboarding, we just mark it as complete
    // Detailed questionnaire data will be collected when generating meal plans
    const profileData: any = {
      user_id: userId,
      onboarding_completed: onboardingCompleted !== undefined ? onboardingCompleted : true,
      updated_at: new Date().toISOString(),
    };

    // Only include detailed fields if they're provided (for meal plan generation)
    if (gender !== undefined) profileData.gender = gender || null;
    if (age !== undefined) profileData.age = age ? parseInt(age, 10) : null;
    if (height !== undefined) profileData.height = height ? parseFloat(height) : null;
    if (currentWeight !== undefined) profileData.current_weight = currentWeight ? parseFloat(currentWeight) : null;
    if (targetWeight !== undefined) profileData.target_weight = targetWeight ? parseFloat(targetWeight) : null;
    if (goal !== undefined) profileData.goal = goal || null;
    if (activity !== undefined) profileData.activity = activity || null;
    if (diet !== undefined) profileData.diet = Array.isArray(diet) ? diet : [];
    if (religious !== undefined) profileData.religious = religious || "none";
    if (conditions !== undefined) profileData.conditions = Array.isArray(conditions) ? conditions : [];
    if (allergies !== undefined) profileData.allergies = Array.isArray(allergies) ? allergies : [];
    
    // Store transition information as JSON for trans-friendly support
    if (transitionInfo !== undefined && transitionInfo !== null) {
      profileData.transition_info = JSON.stringify(transitionInfo);
    }

    let result;
    if (existingProfile) {
      // Update existing profile
      const { data, error } = await supabaseAdmin
        .from("user_profiles")
        .update(profileData)
        .eq("user_id", userId)
        .select()
        .single();

      if (error) {
        log(`Error updating user profile: ${error.message}`, "profile");
        return NextResponse.json(
          { error: "Failed to update profile" },
          { status: 500 }
        );
      }

      result = data;
    } else {
      // Create new profile
      const { data, error } = await supabaseAdmin
        .from("user_profiles")
        .insert({
          ...profileData,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        log(`Error creating user profile: ${error.message}`, "profile");
        return NextResponse.json(
          { error: "Failed to create profile" },
          { status: 500 }
        );
      }

      result = data;
    }

    log(`User profile saved for user: ${userId}`, "profile");

    return NextResponse.json({
      success: true,
      profile: result,
    });
  } catch (error: any) {
    log(`Error in profile/save: ${error.message}`, "profile");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/profile
 * Get current user's profile (individual or business)
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

    // Try to get subscription to determine user type
    const { data: subscription } = await supabaseAdmin
      .from("subscriptions")
      .select("plan_id")
      .eq("user_id", userId)
      .eq("status", "active")
      .single();

    const isB2BPlan = subscription?.plan_id && 
      ["starter", "growth", "professional", "enterprise"].includes(subscription.plan_id);

    if (isB2BPlan) {
      // Get business profile
      const { data: businessProfile, error } = await supabaseAdmin
        .from("business_profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error && error.code !== "PGRST116") {
        log(`Error fetching business profile: ${error.message}`, "profile");
        return NextResponse.json(
          { error: "Failed to fetch profile" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        type: "business",
        profile: businessProfile || null,
        onboardingCompleted: businessProfile?.onboarding_completed || false,
      });
    } else {
      // Get individual profile
      const { data: userProfile, error } = await supabaseAdmin
        .from("user_profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error && error.code !== "PGRST116") {
        log(`Error fetching user profile: ${error.message}`, "profile");
        return NextResponse.json(
          { error: "Failed to fetch profile" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        type: "individual",
        profile: userProfile || null,
        onboardingCompleted: userProfile?.onboarding_completed || false,
      });
    }
  } catch (error: any) {
    log(`Error in profile/get: ${error.message}`, "profile");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

