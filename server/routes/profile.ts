/**
 * Profile Management API Routes
 * Handles saving and retrieving user profiles (individual and business)
 */

import { Router } from "express";
import { supabase, getUserFromToken, getUserIdFromRequest } from "../supabase";
import { log } from "../utils/log";

const router = Router();

/**
 * Middleware to authenticate requests using Supabase
 */
async function authenticateRequest(req: any, res: any, next: any) {
  try {
    const token = getUserIdFromRequest(req);
    
    if (!token) {
      log("No token provided in request", "auth");
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    log(`Verifying token for request: ${req.method} ${req.path}`, "auth");
    const user = await getUserFromToken(token);
    
    if (!user) {
      log(`Token verification failed for ${req.method} ${req.path}`, "auth");
      return res.status(401).json({ error: "Unauthorized: Invalid or expired token. Please sign in again." });
    }

    log(`Token verified successfully for user: ${user.id}`, "auth");
    // Attach user to request
    (req as any).user = user;
    (req as any).userId = user.id;
    
    next();
  } catch (error: any) {
    log(`Authentication error: ${error.message}`, "auth");
    return res.status(401).json({ error: "Unauthorized: " + error.message });
  }
}

/**
 * POST /api/profile/save
 * Save individual user profile (onboarding data)
 */
router.post("/save", authenticateRequest, async (req, res) => {
  try {
    const userId = (req as any).userId;
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
    } = req.body;

    if (!supabase) {
      return res.status(500).json({ error: "Database not configured" });
    }

    // Check if profile already exists
    const { data: existingProfile } = await supabase
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
      const { data, error } = await supabase
        .from("user_profiles")
        .update(profileData)
        .eq("user_id", userId)
        .select()
        .single();

      if (error) {
        log(`Error updating user profile: ${error.message}`, "profile");
        return res.status(500).json({ error: "Failed to update profile" });
      }

      result = data;
    } else {
      // Create new profile
      const { data, error } = await supabase
        .from("user_profiles")
        .insert({
          ...profileData,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        log(`Error creating user profile: ${error.message}`, "profile");
        return res.status(500).json({ error: "Failed to create profile" });
      }

      result = data;
    }

    log(`User profile saved for user: ${userId}`, "profile");

    res.json({
      success: true,
      profile: result,
    });
  } catch (error: any) {
    log(`Error in profile/save: ${error.message}`, "profile");
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/profile/business/save
 * Save professional business profile
 */
router.post("/business/save", authenticateRequest, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const {
      businessName,
      businessType,
      website,
      phone,
      logoUrl,
      brandColors,
      themeColors,
      tagline,
      freeDailyPlan,
    } = req.body;

    if (!businessName) {
      return res.status(400).json({ error: "Business name is required" });
    }

    if (!supabase) {
      return res.status(500).json({ error: "Database not configured" });
    }

    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from("business_profiles")
      .select("id")
      .eq("user_id", userId)
      .single();

    const profileData: any = {
      user_id: userId,
      business_name: businessName,
      business_type: businessType || null,
      website: website || null,
      phone: phone || null,
      logo_url: logoUrl || null,
      brand_colors: brandColors ? JSON.stringify(brandColors) : null,
      theme_colors: themeColors ? JSON.stringify(themeColors) : null,
      tagline: tagline || null,
      free_daily_plan_generated: freeDailyPlan === true,
      onboarding_completed: true,
      updated_at: new Date().toISOString(),
    };

    let result;
    if (existingProfile) {
      // Update existing profile
      const { data, error } = await supabase
        .from("business_profiles")
        .update(profileData)
        .eq("user_id", userId)
        .select()
        .single();

      if (error) {
        log(`Error updating business profile: ${error.message}`, "profile");
        return res.status(500).json({ error: "Failed to update business profile" });
      }

      result = data;
    } else {
      // Create new profile
      const { data, error } = await supabase
        .from("business_profiles")
        .insert({
          ...profileData,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        log(`Error creating business profile: ${error.message}`, "profile");
        return res.status(500).json({ error: "Failed to create business profile" });
      }

      result = data;
    }

    log(`Business profile saved for user: ${userId}`, "profile");

    res.json({
      success: true,
      profile: result,
    });
  } catch (error: any) {
    log(`Error in profile/business/save: ${error.message}`, "profile");
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/profile
 * Get current user's profile (individual or business)
 */
router.get("/", authenticateRequest, async (req, res) => {
  try {
    const userId = (req as any).userId;

    if (!supabase) {
      return res.status(500).json({ error: "Database not configured" });
    }

    // Try to get subscription to determine user type
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("plan_id")
      .eq("user_id", userId)
      .eq("status", "active")
      .single();

    const isB2BPlan = subscription?.plan_id && 
      ["starter", "growth", "professional", "enterprise"].includes(subscription.plan_id);

    if (isB2BPlan) {
      // Get business profile
      const { data: businessProfile, error } = await supabase
        .from("business_profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error && error.code !== "PGRST116") {
        log(`Error fetching business profile: ${error.message}`, "profile");
        return res.status(500).json({ error: "Failed to fetch profile" });
      }

      return res.json({
        type: "business",
        profile: businessProfile || null,
        onboardingCompleted: businessProfile?.onboarding_completed || false,
      });
    } else {
      // Get individual profile
      const { data: userProfile, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error && error.code !== "PGRST116") {
        log(`Error fetching user profile: ${error.message}`, "profile");
        return res.status(500).json({ error: "Failed to fetch profile" });
      }

      return res.json({
        type: "individual",
        profile: userProfile || null,
        onboardingCompleted: userProfile?.onboarding_completed || false,
      });
    }
  } catch (error: any) {
    log(`Error in profile/get: ${error.message}`, "profile");
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/profile/onboarding-status
 * Check if onboarding is complete for current user
 */
router.get("/onboarding-status", authenticateRequest, async (req, res) => {
  try {
    const userId = (req as any).userId;

    if (!supabase) {
      return res.status(500).json({ error: "Database not configured" });
    }

    // Get subscription to determine user type
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("plan_id")
      .eq("user_id", userId)
      .eq("status", "active")
      .single();

    const isB2BPlan = subscription?.plan_id && 
      ["starter", "growth", "professional", "enterprise"].includes(subscription.plan_id);

    if (isB2BPlan) {
      // Check business profile
      const { data: businessProfile } = await supabase
        .from("business_profiles")
        .select("onboarding_completed")
        .eq("user_id", userId)
        .single();

      return res.json({
        completed: businessProfile?.onboarding_completed || false,
        type: "business",
      });
    } else {
      // Check individual profile
      const { data: userProfile } = await supabase
        .from("user_profiles")
        .select("onboarding_completed")
        .eq("user_id", userId)
        .single();

      return res.json({
        completed: userProfile?.onboarding_completed || false,
        type: "individual",
      });
    }
  } catch (error: any) {
    log(`Error in profile/onboarding-status: ${error.message}`, "profile");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

