/**
 * POST /api/mealplan/generate
 * Generate a meal plan with quota checking
 */

import { NextRequest, NextResponse } from "next/server";
import { checkQuota, incrementUsage, getQuotaInfo, QuotaExceededError, type PlanType } from "@/server/quota-supabase";
import { supabaseAdmin } from "@/server/supabase";
import { generateMealPlan, type UserProfile } from "@/server/services/openai";
import { authenticateRequest, log } from "@/lib/api-helpers";

interface GenerateMealPlanRequest {
  planType: "daily" | "weekly" | "monthly";
  userProfile?: UserProfile;
  options?: {
    dietaryPreferences?: string[];
    allergies?: string[];
    goals?: string[];
    calories?: number;
    duration?: number;
  };
}

/**
 * Get user profile from database or request
 */
async function getUserProfile(userId: string, requestProfile?: UserProfile): Promise<UserProfile | null> {
  if (requestProfile) {
    return requestProfile;
  }

  if (supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin
        .from("user_profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (!error && data) {
        return {
          gender: data.gender || "other",
          age: data.age,
          height: data.height,
          currentWeight: data.current_weight,
          targetWeight: data.target_weight,
          goal: data.goal || "maintain",
          activity: data.activity || "moderate",
          diet: data.diet || [],
          religious: data.religious || "none",
          conditions: data.conditions || [],
          allergies: data.allergies || [],
        };
      }
    } catch (err) {
      log("user_profiles table not found, using request data", "mealplan");
    }
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { userId } = authResult;

    const body = await request.json() as GenerateMealPlanRequest;
    const { planType, userProfile: requestProfile, options } = body;

    if (!planType || !["daily", "weekly", "monthly"].includes(planType)) {
      return NextResponse.json(
        { error: "Invalid planType. Must be 'daily', 'weekly', or 'monthly'" },
        { status: 400 }
      );
    }

    // Check quota BEFORE calling OpenAI
    const quotaCheck = await checkQuota(userId, planType as PlanType);
    
    if (!quotaCheck.allowed) {
      return NextResponse.json(
        {
          error: quotaCheck.error?.message || "Quota exceeded",
          code: quotaCheck.error?.code,
          details: quotaCheck.error?.details,
        },
        { status: 429 }
      );
    }

    // Get user profile
    const userProfile = await getUserProfile(userId, requestProfile);

    if (!userProfile) {
      return NextResponse.json(
        { 
          error: "User profile data is required. Please complete the onboarding questionnaire or provide userProfile in the request." 
        },
        { status: 400 }
      );
    }

    // Merge options into user profile
    const finalProfile: UserProfile = {
      ...userProfile,
      diet: options?.dietaryPreferences || userProfile.diet,
      allergies: options?.allergies || userProfile.allergies,
      goal: options?.goals?.[0] || userProfile.goal,
    };

    log(`Generating ${planType} meal plan for user ${userId}`, "mealplan");

    // Generate meal plan using OpenAI
    let mealPlanResult;
    try {
      mealPlanResult = await generateMealPlan({
        planType,
        userProfile: finalProfile,
        options: {
          calories: options?.calories,
          duration: options?.duration,
        },
      });
    } catch (openaiError: any) {
      log(`OpenAI error: ${openaiError.message}`, "mealplan");
      
      if (openaiError.message.includes("rate limit")) {
        return NextResponse.json(
          {
            error: "Service is temporarily busy. Please try again in a few moments.",
            code: "RATE_LIMIT",
          },
          { status: 429 }
        );
      } else if (openaiError.message.includes("API key")) {
        return NextResponse.json(
          {
            error: "Configuration error. Please contact support.",
            code: "CONFIG_ERROR",
          },
          { status: 500 }
        );
      } else {
        return NextResponse.json(
          {
            error: openaiError.message || "Failed to generate meal plan. Please try again.",
            code: "GENERATION_ERROR",
          },
          { status: 500 }
        );
      }
    }

    const { mealPlan, usage } = mealPlanResult;

    // Prepare meal plan data for storage
    const mealPlanData = {
      id: `plan_${Date.now()}`,
      type: planType,
      duration: mealPlan.overview.duration,
      overview: mealPlan.overview,
      days: mealPlan.days,
      groceryList: mealPlan.groceryList,
      generatedAt: new Date().toISOString(),
      tokenUsage: usage,
    };

    // Save meal plan to Supabase
    let savedPlanId: string | null = null;
    if (supabaseAdmin) {
      const { data: savedPlan, error: saveError } = await supabaseAdmin
        .from("meal_plans")
        .insert({
          user_id: userId,
          plan_type: planType,
          plan_data: mealPlanData,
        })
        .select("id")
        .single();

      if (saveError) {
        log(`Error saving meal plan: ${saveError.message}`, "mealplan");
      } else if (savedPlan) {
        savedPlanId = savedPlan.id;
        log(`Meal plan saved successfully (ID: ${savedPlanId})`, "mealplan");
      }
    }

    // Increment usage after successful generation
    await incrementUsage(userId, planType as PlanType);

    // Get updated quota info
    const quotaInfo = await getQuotaInfo(userId);

    return NextResponse.json({
      success: true,
      mealPlan: {
        ...mealPlanData,
        id: savedPlanId || mealPlanData.id,
      },
      mealPlanId: savedPlanId,
      quota: quotaInfo,
      tokenUsage: usage,
    });
  } catch (error: any) {
    log(`Error generating meal plan: ${error.message}`, "mealplan");
    
    if (error instanceof QuotaExceededError) {
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
          details: error.details,
        },
        { status: 429 }
      );
    }
    
    return NextResponse.json(
      { 
        error: error.message || "Internal server error",
        code: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}

