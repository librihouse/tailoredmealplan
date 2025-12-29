/**
 * Profile Management API Routes
 * Handles saving and retrieving user profiles (individual and business)
 */

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, supabase } from "@/server/supabase";
import { authenticateRequest, log } from "@/lib/api-helpers";

// Use admin client if available, otherwise fallback to regular client
const getSupabaseClient = () => supabaseAdmin || supabase;

/**
 * POST /api/profile
 * Save individual user profile (onboarding data)
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate request
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { userId } = authResult;

    // Validate Supabase client
    const dbClient = getSupabaseClient();
    if (!dbClient) {
      const isDevelopment = process.env.NODE_ENV === "development";
      const errorMessage = isDevelopment
        ? "Database not configured: Supabase credentials are missing. Please check your environment variables."
        : "Database service is temporarily unavailable. Please try again later.";
      
      log(`[ERROR] Supabase client not initialized.`, "profile");
      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      );
    }

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (parseError: any) {
      log(`[ERROR] Failed to parse request body: ${parseError.message}`, "profile");
      return NextResponse.json(
        { error: "Invalid request data. Please try again." },
        { status: 400 }
      );
    }

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

    // Validate userId
    if (!userId || typeof userId !== "string") {
      log(`[ERROR] Invalid userId: ${userId}`, "profile");
      return NextResponse.json(
        { error: "Invalid user authentication. Please sign in again." },
        { status: 401 }
      );
    }

    // Check if profile already exists
    let existingProfile;
    try {
      const { data, error } = await dbClient
        .from("user_profiles")
        .select("id")
        .eq("user_id", userId)
        .single();

      if (error && error.code !== "PGRST116") {
        // PGRST116 is "not found" which is expected for new profiles
        log(`[ERROR] Database query error when checking existing profile: ${error.message} (code: ${error.code})`, "profile");
        return NextResponse.json(
          { error: "Database error. Please try again later." },
          { status: 500 }
        );
      }

      existingProfile = data;
    } catch (queryError: any) {
      log(`[ERROR] Exception when checking existing profile: ${queryError.message}`, "profile");
      return NextResponse.json(
        { error: "Database connection error. Please try again later." },
        { status: 500 }
      );
    }

    // Build profile data object
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
    
    // Store transition information as JSONB for trans-friendly support
    if (transitionInfo !== undefined && transitionInfo !== null) {
      try {
        // Validate that transitionInfo is an object
        if (typeof transitionInfo === "object" && !Array.isArray(transitionInfo) && transitionInfo !== null) {
          // JSONB accepts objects directly - Supabase will handle the conversion
          profileData.transition_info = transitionInfo;
          log(`[INFO] Storing transition_info for user: ${userId}`, "profile");
        } else if (typeof transitionInfo === "string") {
          // If it's a string, try to parse it
          try {
            const parsed = JSON.parse(transitionInfo);
            if (typeof parsed === "object" && !Array.isArray(parsed)) {
              profileData.transition_info = parsed;
              log(`[INFO] Parsed and storing transition_info from string for user: ${userId}`, "profile");
            } else {
              log(`[WARN] Invalid transitionInfo format after parsing, skipping: ${JSON.stringify(transitionInfo)}`, "profile");
            }
          } catch (parseError: any) {
            log(`[WARN] Failed to parse transitionInfo string: ${parseError.message}`, "profile");
            // Continue without transition info rather than failing
          }
        } else {
          log(`[WARN] Invalid transitionInfo format, skipping: ${JSON.stringify(transitionInfo)}`, "profile");
        }
      } catch (transitionError: any) {
        log(`[ERROR] Exception processing transitionInfo: ${transitionError.message}`, "profile");
        log(`[ERROR] transitionInfo value: ${JSON.stringify(transitionInfo)}`, "profile");
        // Continue without transition info rather than failing
      }
    }

    // Save profile (insert or update)
    let result;
    try {
      if (existingProfile) {
        // Update existing profile
        log(`Updating existing profile for user: ${userId}`, "profile");
        const { data, error } = await dbClient
          .from("user_profiles")
          .update(profileData)
          .eq("user_id", userId)
          .select()
          .single();

        if (error) {
          log(`[ERROR] Database error updating profile: ${error.message} (code: ${error.code}, details: ${error.details || "N/A"})`, "profile");
          
          // Provide more specific error messages based on error code
          if (error.code === "23505") {
            return NextResponse.json(
              { error: "Profile already exists. Please refresh the page." },
              { status: 409 }
            );
          } else if (error.code === "23503") {
            return NextResponse.json(
              { error: "Invalid user reference. Please sign in again." },
              { status: 400 }
            );
          } else if (error.code === "42501") {
            return NextResponse.json(
              { error: "Permission denied. Please contact support." },
              { status: 403 }
            );
          }
          
          return NextResponse.json(
            { error: `Failed to update profile: ${error.message}` },
            { status: 500 }
          );
        }

        if (!data) {
          log(`[ERROR] Update succeeded but no data returned for user: ${userId}`, "profile");
          return NextResponse.json(
            { error: "Profile update completed but data could not be retrieved." },
            { status: 500 }
          );
        }

        result = data;
      } else {
        // Create new profile
        log(`Creating new profile for user: ${userId}`, "profile");
        const { data, error } = await dbClient
          .from("user_profiles")
          .insert({
            ...profileData,
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) {
          log(`[ERROR] Database error creating profile: ${error.message} (code: ${error.code}, details: ${error.details || "N/A"})`, "profile");
          
          // Provide more specific error messages based on error code
          if (error.code === "23505") {
            return NextResponse.json(
              { error: "Profile already exists. Please refresh the page." },
              { status: 409 }
            );
          } else if (error.code === "23503") {
            return NextResponse.json(
              { error: "Invalid user reference. Please sign in again." },
              { status: 400 }
            );
          } else if (error.code === "42501") {
            return NextResponse.json(
              { error: "Permission denied. Please contact support." },
              { status: 403 }
            );
          } else if (error.code === "23502") {
            return NextResponse.json(
              { error: "Required fields are missing. Please check your input." },
              { status: 400 }
            );
          }
          
          return NextResponse.json(
            { error: `Failed to create profile: ${error.message}` },
            { status: 500 }
          );
        }

        if (!data) {
          log(`[ERROR] Insert succeeded but no data returned for user: ${userId}`, "profile");
          return NextResponse.json(
            { error: "Profile created but data could not be retrieved." },
            { status: 500 }
          );
        }

        result = data;
      }
    } catch (dbError: any) {
      log(`[ERROR] Exception during profile save operation: ${dbError.message}`, "profile");
      log(`[ERROR] Stack trace: ${dbError.stack}`, "profile");
      return NextResponse.json(
        { error: "Database operation failed. Please try again later." },
        { status: 500 }
      );
    }

    log(`[SUCCESS] User profile saved successfully for user: ${userId}`, "profile");

    return NextResponse.json({
      success: true,
      profile: result,
    });
  } catch (error: any) {
    log(`[ERROR] Unexpected error in profile/save: ${error.message}`, "profile");
    log(`[ERROR] Stack trace: ${error.stack}`, "profile");
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again later." },
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

    // Validate Supabase client
    const getDbClient = getSupabaseClient();
    if (!getDbClient) {
      const isDevelopment = process.env.NODE_ENV === "development";
      const errorMessage = isDevelopment
        ? "Database not configured: Supabase credentials are missing. Please check your environment variables."
        : "Database service is temporarily unavailable. Please try again later.";
      
      log(`[ERROR] Supabase client not initialized.`, "profile");
      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      );
    }

    // Try to get subscription to determine user type
    const { data: subscription } = await getDbClient
      .from("subscriptions")
      .select("plan_id")
      .eq("user_id", userId)
      .eq("status", "active")
      .single();

    const isB2BPlan = subscription?.plan_id && 
      ["starter", "growth", "professional", "enterprise"].includes(subscription.plan_id);

    if (isB2BPlan) {
      // Get business profile
      const { data: businessProfile, error } = await getDbClient
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
      const { data: userProfile, error } = await getDbClient
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

