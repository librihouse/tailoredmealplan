/**
 * POST /api/mealplan/generate
 * Generate a meal plan with quota checking
 */

// Allow up to 600 seconds for meal plan generation (monthly plans + retries)
export const maxDuration = 600; // 10 minutes to accommodate monthly plans with chunked generation (3 chunks × 2.5min = 7.5min + overhead)

import { NextRequest, NextResponse } from "next/server";
import { checkQuota, incrementUsage, getQuotaInfo, QuotaExceededError, type PlanType } from "@/server/quota-supabase";
import { supabaseAdmin, supabase } from "@/server/supabase";
import { generateMealPlan, type UserProfile } from "@/server/services/openai";
import { authenticateRequest, log } from "@/lib/api-helpers";
import { retryGeneration } from "@/server/services/quality-assurance";
import { logApiUsage } from "@/server/services/usage-monitoring";
import { sanitizeUserProfile } from "@/server/utils/input-sanitizer";

// Use admin client if available, otherwise fallback to regular client
const getSupabaseClient = () => supabaseAdmin || supabase;

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

  const dbClient = getSupabaseClient();
  if (dbClient) {
    try {
      const { data, error } = await dbClient
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
          goal: (typeof data.goal === "string") ? data.goal : (Array.isArray(data.goal) && data.goal.length > 0 ? data.goal[0] : "maintain"),
          activity: data.activity || "moderate",
          diet: Array.isArray(data.diet) ? data.diet : [],
          religious: data.religious || "none",
          conditions: Array.isArray(data.conditions) ? data.conditions : [],
          allergies: Array.isArray(data.allergies) ? data.allergies : [],
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

    const body = await request.json() as GenerateMealPlanRequest & { familyMemberId?: string };
    const { planType, userProfile: requestProfile, options, familyMemberId } = body;

    if (!planType || !["daily", "weekly", "monthly"].includes(planType)) {
      return NextResponse.json(
        { error: "Invalid planType. Must be 'daily', 'weekly', or 'monthly'" },
        { status: 400 }
      );
    }

    // Block monthly plan generation for free tier users
    if (planType === "monthly") {
      const dbClient = getSupabaseClient();
      if (dbClient) {
        // Check user's subscription to determine plan type
        const { data: subscriptions } = await dbClient
          .from("subscriptions")
          .select("plan_id")
          .eq("user_id", userId)
          .eq("status", "active")
          .limit(1);
        
        // If no active subscription, user is on free tier
        const userPlanId = subscriptions && subscriptions.length > 0 
          ? subscriptions[0].plan_id 
          : "free";
        
        if (userPlanId === "free") {
          return NextResponse.json(
            {
              error: "Monthly meal plans are only available for Individual and Family plans. Please upgrade to access this feature.",
              code: "FEATURE_LOCKED",
            },
            { status: 403 }
          );
        }
      }
    }

    // Check quota BEFORE calling OpenAI
    const quotaCheck = await checkQuota(userId, planType as PlanType);
    
    if (!quotaCheck.allowed) {
      const errorMessage = quotaCheck.error?.message || "Quota exceeded";
      const errorCode = quotaCheck.error?.code || "CREDITS_EXCEEDED";
      
      // Provide user-friendly error messages based on error code
      let userFriendlyMessage = errorMessage;
      if (errorCode === "WEEKLY_QUOTA_EXCEEDED") {
        userFriendlyMessage = `Weekly plan limit reached. You have used all your weekly plan credits. Please upgrade your plan or wait for the next billing cycle.`;
      } else if (errorCode === "MONTHLY_QUOTA_EXCEEDED") {
        userFriendlyMessage = `Monthly plan limit reached. You have used all your monthly plan credits. Please upgrade your plan or wait for the next billing cycle.`;
      } else if (errorCode === "CREDITS_EXCEEDED") {
        // For daily plans or general credit exhaustion
        if (planType === "daily") {
          userFriendlyMessage = `Daily plan limit reached. You have used all your daily plan credits. Please upgrade your plan or wait for the next billing cycle.`;
        } else {
          userFriendlyMessage = errorMessage; // Use the detailed message from quota check
        }
      }
      
      return NextResponse.json(
        {
          error: userFriendlyMessage,
          code: errorCode,
          details: quotaCheck.error?.details,
        },
        { status: 429 }
      );
    }

    // Get user profile (from family member or user profile)
    let userProfile: UserProfile | null = null;

    if (familyMemberId) {
      // Get family member profile
      const familyDbClient = getSupabaseClient();
      if (familyDbClient) {
        const { data: member } = await familyDbClient
          .from("family_members")
          .select("*")
          .eq("id", familyMemberId)
          .eq("user_id", userId)
          .single();

        if (member) {
          userProfile = {
            gender: member.gender || "other",
            age: member.age || undefined,
            height: member.height || undefined,
            currentWeight: member.current_weight || undefined,
            targetWeight: member.target_weight || undefined,
            goal: (requestProfile?.goal && typeof requestProfile.goal === "string") ? requestProfile.goal : (Array.isArray(requestProfile?.goal) && requestProfile.goal.length > 0 ? requestProfile.goal[0] : "maintain"),
            activity: member.activity_level || requestProfile?.activity || "moderate",
            diet: (requestProfile?.diet && Array.isArray(requestProfile.diet)) ? requestProfile.diet : [],
            religious: member.religious_diet || "none",
            conditions: Array.isArray(member.medical_conditions) 
              ? member.medical_conditions 
              : [],
            allergies: (requestProfile?.allergies && Array.isArray(requestProfile.allergies)) ? requestProfile.allergies : [],
          };
        }
      }
    } else {
      // Get user profile
      userProfile = await getUserProfile(userId, requestProfile);
    }

    if (!userProfile) {
      return NextResponse.json(
        { 
          error: "User profile data is required. Please complete the onboarding questionnaire or provide userProfile in the request." 
        },
        { status: 400 }
      );
    }

    // Merge options into user profile
    const mergedProfile: UserProfile = {
      ...userProfile,
      diet: (options?.dietaryPreferences && Array.isArray(options.dietaryPreferences)) ? options.dietaryPreferences : (Array.isArray(userProfile.diet) ? userProfile.diet : []),
      allergies: (options?.allergies && Array.isArray(options.allergies)) ? options.allergies : (Array.isArray(userProfile.allergies) ? userProfile.allergies : []),
      goal: (options?.goals && Array.isArray(options.goals) && options.goals.length > 0) ? options.goals[0] : (typeof userProfile.goal === "string" ? userProfile.goal : (Array.isArray(userProfile.goal) && (userProfile.goal as any[]).length > 0 ? (userProfile.goal as any[])[0] : "health")),
    };

    // Sanitize user profile to prevent prompt injection and ensure data safety
    const finalProfile: UserProfile = sanitizeUserProfile(mergedProfile) as UserProfile;

    log(`Generating ${planType} meal plan for user ${userId}`, "mealplan");

    // Generate unique request ID to prevent duplicate saves
    const requestId = `req_${userId}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    log(`Meal plan generation request: ${requestId}`, "mealplan");

    // Get Supabase client once for use throughout the function
    const saveDbClient = getSupabaseClient();

    // Check for recent duplicate requests (within 10 seconds) to prevent duplicates
    if (saveDbClient) {
      try {
        const tenSecondsAgo = new Date(Date.now() - 10000).toISOString();
        const { data: recentPlans } = await saveDbClient
          .from("meal_plans")
          .select("id, plan_data, created_at")
          .eq("user_id", userId)
          .eq("plan_type", planType)
          .gte("created_at", tenSecondsAgo)
          .order("created_at", { ascending: false })
          .limit(1);

        if (recentPlans && recentPlans.length > 0) {
          log(`Duplicate request detected, returning existing plan: ${recentPlans[0].id}`, "mealplan");
          // Return existing plan without deducting credits again
          const quotaInfo = await getQuotaInfo(userId);
          return NextResponse.json({
            success: true,
            mealPlan: recentPlans[0].plan_data,
            mealPlanId: recentPlans[0].id,
            quota: quotaInfo || {
              weeklyPlans: { used: 0, limit: 0 },
              monthlyPlans: { used: 0, limit: 0 },
              clients: { used: 0, limit: 0 },
              credits: { used: 0, limit: 0 },
              resetDate: new Date().toISOString(),
            },
            warning: "Duplicate request detected, returning existing plan",
          });
        }
      } catch (duplicateCheckError: any) {
        // If duplicate check fails, log and continue (don't block generation)
        log(`Duplicate check failed, continuing with generation: ${duplicateCheckError.message}`, "mealplan");
      }
    }

    // Generate meal plan using OpenAI with retry logic and quality validation
    const apiRouteStartTime = Date.now();
    // #region agent log - Hypothesis D: API route start
    fetch('http://127.0.0.1:7242/ingest/29ee16f2-f385-440f-b653-567260a65333',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:227',message:'API route starting generation',data:{planType,maxDuration,apiRouteStartTime},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    let mealPlanResult;
    try {
      mealPlanResult = await retryGeneration({
        planType,
        userProfile: finalProfile,
        options: {
          calories: options?.calories,
          duration: options?.duration,
        },
      }, 3); // Max 3 retries
    } catch (openaiError: any) {
      const apiRouteElapsed = Date.now() - apiRouteStartTime;
      // #region agent log - Hypothesis D,E: API route error
      fetch('http://127.0.0.1:7242/ingest/29ee16f2-f385-440f-b653-567260a65333',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:238',message:'API route caught error',data:{errorMessage:openaiError.message,apiRouteElapsed,maxDuration,maxDurationMs:maxDuration*1000,planType,isTimeout:openaiError.message?.includes('timeout')},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'D,E'})}).catch(()=>{});
      // #endregion
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

    let { mealPlan, usage } = mealPlanResult;

    // Validate meal plan structure - attempt auto-correction if needed
    const { validateMealPlan } = await import("@/server/services/quality-assurance");
    const { correctMealPlan } = await import("@/server/services/meal-plan-corrector");
    
    // First, try to fix structure issues
    if (!mealPlan.overview || !mealPlan.days || !mealPlan.groceryList) {
      log("Invalid meal plan structure from OpenAI, attempting auto-correction", "mealplan");
      const structureResult = await correctMealPlan(mealPlan, [
        { field: "structure", message: "Missing overview, days, or groceryList" }
      ], mealPlan.overview?.dailyCalories || 2000);
      
      if (structureResult) {
        mealPlan = structureResult;
        log("Structure auto-corrected", "mealplan");
      } else {
        // If correction fails, create minimal structure
        if (!mealPlan.overview) {
          mealPlan.overview = {
            dailyCalories: options?.calories || 2000,
            macros: { protein: 150, carbs: 200, fat: 67 },
            duration: mealPlan.days?.length || 1,
            type: planType
          };
        }
        if (!Array.isArray(mealPlan.days)) {
          mealPlan.days = [];
        }
        if (!mealPlan.groceryList) {
          mealPlan.groceryList = {};
        }
        log("Applied minimal structure fixes", "mealplan");
      }
    }

    // Validate meal plan and attempt auto-correction
    const validation = validateMealPlan(mealPlan);
    let warnings: Array<{ field: string; message: string }> = [];
    
    if (!validation.valid || validation.warnings.length > 0) {
      // Attempt auto-correction for fixable issues
      if (validation.canAutoCorrect || validation.warnings.length > 0) {
        const targetCalories = mealPlan.overview?.dailyCalories || options?.calories || 2000;
        const allIssues = [...validation.errors, ...validation.warnings];
        const corrected = await correctMealPlan(mealPlan, allIssues, targetCalories);
        
        if (corrected) {
          // Re-validate corrected plan
          const correctedValidation = validateMealPlan(corrected);
          if (correctedValidation.valid || correctedValidation.canAutoCorrect) {
            mealPlan = corrected;
            log("Meal plan auto-corrected and delivered", "mealplan");
            warnings = correctedValidation.warnings;
          } else {
            // Keep original but log warnings
            warnings = [...validation.warnings, ...validation.errors];
            log(`Delivering meal plan with ${warnings.length} warnings (auto-correction partially successful)`, "mealplan");
          }
        } else {
          // Keep original but log warnings
          warnings = [...validation.warnings, ...validation.errors];
          log(`Delivering meal plan with ${warnings.length} warnings (auto-correction not possible)`, "mealplan");
        }
      } else {
        // Critical errors exist but we'll still try to deliver
        warnings = [...validation.errors, ...validation.warnings];
        log(`Delivering meal plan with ${warnings.length} critical issues (fallback mode)`, "mealplan");
      }
    }

    // Prepare meal plan data for storage
    const mealPlanData = {
      id: `plan_${Date.now()}`,
      type: planType,
      duration: mealPlan.overview.duration || (planType === "monthly" ? 30 : planType === "weekly" ? 7 : 1),
      overview: mealPlan.overview,
      days: mealPlan.days,
      groceryList: mealPlan.groceryList,
      generatedAt: new Date().toISOString(),
      tokenUsage: usage,
    };

    // CRITICAL: Deduct credits BEFORE saving to prevent abuse
    // If generation succeeds, credits must be deducted even if save fails
    try {
      await incrementUsage(userId, planType as PlanType);
      log(`Credits deducted successfully for ${planType} plan`, "mealplan");
    } catch (usageError: any) {
      log(`CRITICAL: Error incrementing usage: ${usageError.message}`, "mealplan");
      // If credit deduction fails, DO NOT return meal plan (prevents free plans)
      return NextResponse.json(
        {
          error: "Failed to process credits. Please try again.",
          code: "CREDIT_DEDUCTION_FAILED",
        },
        { status: 500 }
      );
    }

    // Now save meal plan (credits already deducted)
    // Check for duplicates again right before saving to prevent race conditions
    let savedPlanId: string | null = null;
    let saveError: any = null;
    
    // Reuse saveDbClient from earlier (already declared for duplicate check)
    if (saveDbClient) {
      try {
        // Second duplicate check right before saving (after generation completes)
        const fiveSecondsAgo = new Date(Date.now() - 5000).toISOString();
        const { data: lastPlan } = await saveDbClient
          .from("meal_plans")
          .select("id, created_at")
          .eq("user_id", userId)
          .eq("plan_type", planType)
          .gte("created_at", fiveSecondsAgo)
          .order("created_at", { ascending: false })
          .limit(1);

        if (lastPlan && lastPlan.length > 0) {
          log(`Duplicate detected before save, returning existing plan: ${lastPlan[0].id}`, "mealplan");
          // Return existing plan - credits already deducted, but that's acceptable for duplicate prevention
          const quotaInfo = await getQuotaInfo(userId);
          return NextResponse.json({
            success: true,
            mealPlan: mealPlanData,
            mealPlanId: lastPlan[0].id,
            quota: quotaInfo || {
              weeklyPlans: { used: 0, limit: 0 },
              monthlyPlans: { used: 0, limit: 0 },
              clients: { used: 0, limit: 0 },
              credits: { used: 0, limit: 0 },
              resetDate: new Date().toISOString(),
            },
            warning: "Duplicate request detected, returning existing plan",
          });
        }

        const { data: savedPlan, error: saveErr } = await saveDbClient
          .from("meal_plans")
          .insert({
            user_id: userId,
            plan_type: planType,
            plan_data: mealPlanData,
            family_member_id: familyMemberId || null,
          })
          .select("id")
          .single();

        if (saveErr) {
          saveError = saveErr;
          log(`Error saving meal plan: ${saveErr.message}`, "mealplan");
          // Credits were already deducted, so we need to log this for manual review
          log(`WARNING: Credits deducted but meal plan not saved. Plan ID: ${mealPlanData.id}, User: ${userId}`, "mealplan");
        } else if (savedPlan) {
          savedPlanId = savedPlan.id;
          log(`Meal plan saved successfully (ID: ${savedPlanId})`, "mealplan");
        }
      } catch (err: any) {
        saveError = err;
        log(`Exception saving meal plan: ${err.message}`, "mealplan");
        log(`WARNING: Credits deducted but meal plan not saved. Plan ID: ${mealPlanData.id}, User: ${userId}`, "mealplan");
      }
    } else {
      log(`WARNING: No Supabase client, credits deducted but meal plan not saved. Plan ID: ${mealPlanData.id}, User: ${userId}`, "mealplan");
    }

    // Log API usage for cost monitoring (async, don't wait)
    if (savedPlanId) {
      logApiUsage(
        userId,
        savedPlanId,
        planType,
        usage
      ).catch(err => {
        console.error("Failed to log API usage:", err);
        // Don't throw - logging failure shouldn't break meal plan generation
      });
    }

    // Get updated quota info
    const quotaInfo = await getQuotaInfo(userId);

    // Always return mealPlanId - use generated ID if save failed
    const finalMealPlanId = savedPlanId || mealPlanData.id;
    
    // If save failed, log warning but still return the plan
    if (!savedPlanId && saveError) {
      log(`WARNING: Meal plan generated but not saved. Using temporary ID: ${finalMealPlanId}`, "mealplan");
    }

    return NextResponse.json({
      success: true,
      mealPlan: {
        ...mealPlanData,
        id: finalMealPlanId,
      },
      mealPlanId: finalMealPlanId, // Always return a valid ID
      quota: quotaInfo || {
        weeklyPlans: { used: 0, limit: 0 },
        monthlyPlans: { used: 0, limit: 0 },
        clients: { used: 0, limit: 0 },
        credits: { used: 0, limit: 0 },
        resetDate: new Date().toISOString(),
      },
      tokenUsage: usage,
      warnings: warnings.length > 0 ? warnings : undefined, // Include warnings if any
      warning: saveError ? "Meal plan generated but may not have been saved. Please contact support if you don't see it in your dashboard." : undefined,
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

