/**
 * Meal Plan Generation API Routes
 * Handles meal plan generation with quota checking using Supabase
 */

import { Router } from "express";
import { checkQuota, incrementUsage, getQuotaInfo, QuotaExceededError, type PlanType } from "../quota-supabase";
import { supabase, getUserFromToken, getUserIdFromRequest } from "../supabase";
import { generateMealPlan, type UserProfile } from "../services/openai";
import { log } from "../index";

const router = Router();

interface GenerateMealPlanRequest {
  planType: "daily" | "weekly" | "monthly";
  userProfile?: UserProfile; // Optional - can be passed in request or fetched from DB
  options?: {
    dietaryPreferences?: string[];
    allergies?: string[];
    goals?: string[];
    calories?: number;
    duration?: number; // days
  };
}

/**
 * Middleware to authenticate requests using Supabase
 */
async function authenticateRequest(req: any, res: any, next: any) {
  try {
    const token = getUserIdFromRequest(req);
    
    if (!token) {
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    const user = await getUserFromToken(token);
    
    if (!user) {
      return res.status(401).json({ error: "Unauthorized: Invalid token" });
    }

    // Attach user to request
    (req as any).user = user;
    (req as any).userId = user.id;
    
    next();
  } catch (error: any) {
    return res.status(401).json({ error: "Unauthorized: " + error.message });
  }
}

/**
 * Get user profile from database or request
 */
async function getUserProfile(userId: string, requestProfile?: UserProfile): Promise<UserProfile | null> {
  // If profile is provided in request, use it
  if (requestProfile) {
    return requestProfile;
  }

  // Try to fetch from database (if user_profiles table exists)
  if (supabase) {
    try {
      // Check if user_profiles table exists by trying to query it
      const { data, error } = await supabase
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
      // Table might not exist yet, that's okay
      log("user_profiles table not found, using request data", "mealplan");
    }
  }

  return null;
}

/**
 * POST /api/mealplan/generate
 * Generate a meal plan with quota checking
 */
router.post("/generate", authenticateRequest, async (req, res) => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { planType, userProfile: requestProfile, options } = req.body as GenerateMealPlanRequest;

    if (!planType || !["daily", "weekly", "monthly"].includes(planType)) {
      return res.status(400).json({ error: "Invalid planType. Must be 'daily', 'weekly', or 'monthly'" });
    }

    // Check quota BEFORE calling OpenAI (to avoid unnecessary API costs)
    const quotaCheck = await checkQuota(userId, planType as PlanType);
    
    if (!quotaCheck.allowed) {
      return res.status(429).json({
        error: quotaCheck.error?.message || "Quota exceeded",
        code: quotaCheck.error?.code,
        details: quotaCheck.error?.details,
      });
    }

    // Get user profile (from request or database)
    const userProfile = await getUserProfile(userId, requestProfile);

    if (!userProfile) {
      return res.status(400).json({ 
        error: "User profile data is required. Please complete the onboarding questionnaire or provide userProfile in the request." 
      });
    }

    // Merge options into user profile if provided
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
      
      // Handle specific OpenAI errors
      if (openaiError.message.includes("rate limit")) {
        return res.status(429).json({
          error: "Service is temporarily busy. Please try again in a few moments.",
          code: "RATE_LIMIT",
        });
      } else if (openaiError.message.includes("API key")) {
        return res.status(500).json({
          error: "Configuration error. Please contact support.",
          code: "CONFIG_ERROR",
        });
      } else {
        return res.status(500).json({
          error: openaiError.message || "Failed to generate meal plan. Please try again.",
          code: "GENERATION_ERROR",
        });
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
      tokenUsage: usage, // Store for cost tracking
    };

    // Save meal plan to Supabase
    let savedPlanId: string | null = null;
    if (supabase) {
      const { data: savedPlan, error: saveError } = await supabase
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
        // Continue anyway - plan was generated successfully
      } else if (savedPlan) {
        savedPlanId = savedPlan.id;
        log(`Meal plan saved successfully (ID: ${savedPlanId})`, "mealplan");
      }
    }

    // Increment usage after successful generation
    await incrementUsage(userId, planType as PlanType);

    // Get updated quota info
    const quotaInfo = await getQuotaInfo(userId);

    res.json({
      success: true,
      mealPlan: {
        ...mealPlanData,
        id: savedPlanId || mealPlanData.id, // Use database ID if available
      },
      mealPlanId: savedPlanId, // Also return separately for easy access
      quota: quotaInfo,
      tokenUsage: usage, // Return for client-side cost tracking
    });
  } catch (error: any) {
    log(`Error generating meal plan: ${error.message}`, "mealplan");
    
    if (error instanceof QuotaExceededError) {
      return res.status(429).json({
        error: error.message,
        code: error.code,
        details: error.details,
      });
    }
    
    res.status(500).json({ 
      error: error.message || "Internal server error",
      code: "INTERNAL_ERROR",
    });
  }
});

/**
 * GET /api/mealplan/quota
 * Get current quota information
 */
router.get("/quota", authenticateRequest, async (req, res) => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const quotaInfo = await getQuotaInfo(userId);
    
    if (!quotaInfo) {
      return res.status(404).json({ error: "No subscription found" });
    }

    res.json(quotaInfo);
  } catch (error) {
    console.error("Error fetching quota:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/mealplan/list
 * Get all meal plans for the authenticated user
 */
router.get("/list", authenticateRequest, async (req, res) => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { type, limit, offset } = req.query;
    const limitNum = limit ? parseInt(limit as string, 10) : 50;
    const offsetNum = offset ? parseInt(offset as string, 10) : 0;

    if (!supabase) {
      return res.status(500).json({ error: "Database not configured" });
    }

    let query = supabase
      .from("meal_plans")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(offsetNum, offsetNum + limitNum - 1);

    if (type && ["daily", "weekly", "monthly"].includes(type as string)) {
      query = query.eq("plan_type", type);
    }

    const { data, error } = await query;

    if (error) {
      log(`Error fetching meal plans: ${error.message}`, "mealplan");
      return res.status(500).json({ error: "Failed to fetch meal plans" });
    }

    res.json({
      plans: data || [],
      total: data?.length || 0,
    });
  } catch (error: any) {
    log(`Error in list endpoint: ${error.message}`, "mealplan");
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/mealplan/:id
 * Get a specific meal plan by ID
 */
router.get("/:id", authenticateRequest, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const planId = req.params.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!supabase) {
      return res.status(500).json({ error: "Database not configured" });
    }

    const { data, error } = await supabase
      .from("meal_plans")
      .select("*")
      .eq("id", planId)
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return res.status(404).json({ error: "Meal plan not found" });
      }
      log(`Error fetching meal plan: ${error.message}`, "mealplan");
      return res.status(500).json({ error: "Failed to fetch meal plan" });
    }

    if (!data) {
      return res.status(404).json({ error: "Meal plan not found" });
    }

    res.json(data);
  } catch (error: any) {
    log(`Error in get endpoint: ${error.message}`, "mealplan");
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * DELETE /api/mealplan/:id
 * Delete a meal plan
 */
router.delete("/:id", authenticateRequest, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const planId = req.params.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!supabase) {
      return res.status(500).json({ error: "Database not configured" });
    }

    // First verify the plan belongs to the user
    const { data: existingPlan, error: fetchError } = await supabase
      .from("meal_plans")
      .select("id")
      .eq("id", planId)
      .eq("user_id", userId)
      .single();

    if (fetchError || !existingPlan) {
      return res.status(404).json({ error: "Meal plan not found" });
    }

    // Delete the plan
    const { error: deleteError } = await supabase
      .from("meal_plans")
      .delete()
      .eq("id", planId)
      .eq("user_id", userId);

    if (deleteError) {
      log(`Error deleting meal plan: ${deleteError.message}`, "mealplan");
      return res.status(500).json({ error: "Failed to delete meal plan" });
    }

    res.json({ success: true, message: "Meal plan deleted successfully" });
  } catch (error: any) {
    log(`Error in delete endpoint: ${error.message}`, "mealplan");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

