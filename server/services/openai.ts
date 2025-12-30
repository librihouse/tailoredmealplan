/**
 * OpenAI Service
 * Handles meal plan generation using GPT-4o-mini
 */

import OpenAI from "openai";
import { log } from "../index";
import { logApiUsage } from "./usage-monitoring";
import { validateMealPlan, retryGeneration as retryWithValidation } from "./quality-assurance";
import { estimatePromptTokens, isPromptTooLong, validatePrompt, getPromptStats } from "./prompt-utils";
import { networkMonitor } from "./network-monitor";

// Lazy initialization - only create client when needed
let openaiClient: OpenAI | null = null;

function getOpenAIClient(timeoutMs?: number): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured. Please add it to your .env.local file.");
  }
  
  // #region agent log - Hypothesis B: Client creation decision
  fetch('http://127.0.0.1:7242/ingest/29ee16f2-f385-440f-b653-567260a65333',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'openai.ts:getOpenAIClient',message:'getOpenAIClient called',data:{timeoutMs,hasTimeout:!!timeoutMs,timeoutGreaterThan300k:timeoutMs?timeoutMs>300000:false,hasExistingClient:!!openaiClient},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
  
  // For monthly plans (timeout > 5 min), don't set client timeout - rely on custom timeout promise
  // The OpenAI SDK may have internal limits that prevent timeouts > 5 minutes
  if (timeoutMs && timeoutMs > 300000) {
    log(`Creating OpenAI client WITHOUT timeout for monthly plans (will use custom ${timeoutMs/1000}s timeout)`, "openai");
    // #region agent log - Hypothesis B: Creating new client without timeout for monthly plans
    fetch('http://127.0.0.1:7242/ingest/29ee16f2-f385-440f-b653-567260a65333',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'openai.ts:25',message:'Creating new OpenAI client WITHOUT timeout for monthly plans',data:{timeoutMs,timeoutSeconds:timeoutMs/1000,reason:'SDK may have 5min limit'},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    // Create client without timeout - our custom timeout promise will handle it
    return new OpenAI({
      apiKey,
      timeout: 600000, // Set to 10 minutes to avoid SDK limits, but our custom timeout will fire first
      maxRetries: 0, // We handle retries in quality-assurance.ts
    });
  }
  
  // Use singleton for standard timeouts
  if (!openaiClient) {
    // #region agent log - Hypothesis B: Creating singleton client with default timeout
    fetch('http://127.0.0.1:7242/ingest/29ee16f2-f385-440f-b653-567260a65333',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'openai.ts:34',message:'Creating singleton OpenAI client with default timeout',data:{timeout:300000,timeoutSeconds:300},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    openaiClient = new OpenAI({
      apiKey,
      timeout: 300000, // 5 minutes default timeout
      maxRetries: 0, // We handle retries in quality-assurance.ts
    });
  }
  // #region agent log - Hypothesis B: Returning client (singleton or new)
  fetch('http://127.0.0.1:7242/ingest/29ee16f2-f385-440f-b653-567260a65333',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'openai.ts:40',message:'Returning OpenAI client',data:{isNewClient:timeoutMs&&timeoutMs>300000,isSingleton:!timeoutMs||timeoutMs<=300000},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
  return openaiClient;
}

export interface UserProfile {
  gender: string;
  age?: number;
  height?: number; // cm
  currentWeight?: number; // kg
  targetWeight?: number; // kg
  goal: string; // lose_weight, build_muscle, maintain, health
  activity: string; // sedentary, light, moderate, active, athlete
  diet: string[]; // dietary preferences
  religious: string; // none, halal, kosher, jain, hindu, buddhist
  conditions: string[]; // health conditions
  allergies: string[]; // allergies
  // Expanded fields
  dietaryRestrictions?: string[];
  foodIntolerances?: string[];
  secondaryGoals?: string[];
  mealsPerDay?: string;
  includeSnacks?: string;
  mealTimes?: {
    breakfast?: string;
    lunch?: string;
    dinner?: string;
  };
  snackPreferences?: string[];
  intermittentFasting?: string;
  foodsLoved?: string[];
  foodsDisliked?: string[];
  flavorPreferences?: string[];
  texturePreferences?: string[];
  mealSource?: string;
  cookingSkillLevel?: string;
  cookingTimeAvailable?: string;
  cookingMethods?: string[];
  mealPrepPreference?: string;
  kitchenEquipment?: string[];
  restaurantTypes?: string[];
  deliveryServices?: string[];
  mealPrepServices?: string[];
  orderingBudget?: string;
  orderingFrequency?: string;
  activityLevel?: string;
  typicalDaySchedule?: string;
  workSchedule?: string;
  lunchLocation?: string;
  dinnerLocation?: string;
  weekendEatingHabits?: string;
  budgetLevel?: string;
  shoppingFrequency?: string;
  shoppingPreferences?: string[];
  specialtyStoresAccess?: string;
  weightChangeTimeline?: string;
  macroPreferences?: string;
  customMacros?: {
    protein: number;
    carbs: number;
    fat: number;
  };
  fiberTarget?: string;
  sodiumSensitivity?: string;
  medications?: string[];
  pregnancyStatus?: string;
  recentSurgeries?: string;
  culturalBackground?: string;
  cuisinePreference?: string;
  traditionalFoodsToInclude?: string;
  foodsFromCultureToAvoid?: string;
  spiceTolerance?: string;
  specialOccasions?: string;
  specialDietaryNotes?: string;
  mealPlanFocus?: string | string[];
  varietyPreference?: string;
  hydrationPreferences?: string;
  waterIntake?: string;
  beveragePreferences?: string[];
  digestiveHealth?: string[];
  sleepSchedule?: string;
  stressLevel?: string;
  // "Other" text fields
  dietaryPreferencesOther?: string;
  religiousDietOther?: string;
  dietaryRestrictionsOther?: string;
  foodIntolerancesOther?: string;
  healthGoalCustom?: string;
  secondaryGoalsOther?: string;
  allergiesOther?: string;
  cuisinePreferenceOther?: string;
  mealsPerDayOther?: string;
  includeSnacksOther?: string;
  snackPreferencesOther?: string;
  intermittentFastingOther?: string;
  foodsLovedProteinsOther?: string;
  foodsLovedGrainsOther?: string;
  foodsLovedVegetablesOther?: string;
  foodsLovedFruitsOther?: string;
  foodsLovedDairyOther?: string;
  foodsDislikedOther?: string;
  flavorPreferencesOther?: string;
  texturePreferencesOther?: string;
  mealSourceOther?: string;
  cookingSkillLevelOther?: string;
  cookingTimeAvailableOther?: string;
  cookingMethodsOther?: string;
  mealPrepPreferenceOther?: string;
  kitchenEquipmentOther?: string;
  restaurantTypesOther?: string;
  deliveryServicesOther?: string;
  orderingBudgetOther?: string;
  orderingFrequencyOther?: string;
  mealPrepServicesOther?: string;
  typicalDayScheduleOther?: string;
  workScheduleOther?: string;
  lunchLocationOther?: string;
  dinnerLocationOther?: string;
  weekendEatingHabitsOther?: string;
  budgetLevelOther?: string;
  shoppingFrequencyOther?: string;
  shoppingPreferencesOther?: string;
  specialtyStoresAccessOther?: string;
  weightChangeTimelineOther?: string;
  macroPreferencesOther?: string;
  fiberTargetOther?: string;
  sodiumSensitivityOther?: string;
  healthConditionsOther?: string;
  medicationsOther?: string;
  pregnancyStatusOther?: string;
  culturalBackgroundOther?: string;
  spiceToleranceOther?: string;
  specialOccasionsOther?: string;
  mealPlanFocusOther?: string;
  varietyPreferenceOther?: string;
  activityLevelOther?: string;
  hydrationPreferencesOther?: string;
  beveragePreferencesOther?: string;
  digestiveHealthOther?: string;
  sleepScheduleOther?: string;
  stressLevelOther?: string;
}

export interface MealPlanRequest {
  planType: "daily" | "weekly" | "monthly";
  userProfile: UserProfile;
  options?: {
    calories?: number;
    duration?: number;
  };
}

export interface MealPlanResponse {
  overview: {
    dailyCalories: number;
    macros: {
      protein: number; // grams
      carbs: number; // grams
      fat: number; // grams
    };
    duration: number;
    type: string;
  };
  days: Array<{
    day: number;
    meals: {
      breakfast: Meal;
      lunch: Meal;
      dinner: Meal;
      snacks?: Meal[];
    };
  }>;
  groceryList: {
    produce?: string[];
    protein?: string[];
    dairy?: string[];
    pantry?: string[];
    [key: string]: string[] | undefined;
  };
}

export interface Meal {
  name: string;
  ingredients: string[];
  instructions: string;
  nutrition: {
    calories: number;
    protein: number; // grams
    carbs: number; // grams
    fat: number; // grams
  };
}

/**
 * Calculate daily calories based on user profile
 */
function calculateDailyCalories(profile: UserProfile): number {
  // If provided in options, use that
  // Otherwise, use Mifflin-St Jeor Equation for BMR, then apply activity multiplier
  
  if (!profile.age || !profile.height || !profile.currentWeight) {
    // Default estimates if data missing
    return profile.goal === "lose_weight" ? 1500 : 
           profile.goal === "build_muscle" ? 2500 : 2000;
  }

  // BMR calculation (Mifflin-St Jeor)
  const isMale = profile.gender.toLowerCase() === "male";
  let bmr = (10 * profile.currentWeight) + (6.25 * profile.height) - (5 * profile.age);
  bmr += isMale ? 5 : -161;

  // Activity multipliers
  const activityMultipliers: Record<string, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    athlete: 1.9,
  };

  const tdee = bmr * (activityMultipliers[profile.activity] || 1.55);

  // Adjust based on goal
  if (profile.goal === "lose_weight") {
    return Math.round(tdee * 0.85); // 15% deficit
  } else if (profile.goal === "build_muscle") {
    return Math.round(tdee * 1.15); // 15% surplus
  } else {
    return Math.round(tdee); // maintenance
  }
}

/**
 * Build the prompt for OpenAI
 */
function buildPrompt(request: MealPlanRequest): string {
  const { planType, userProfile, options } = request;
  
  // Ensure all arrays are properly initialized
  const safeUserProfile = {
    ...userProfile,
    diet: Array.isArray(userProfile.diet) ? userProfile.diet : [],
    conditions: Array.isArray(userProfile.conditions) ? userProfile.conditions : [],
    allergies: Array.isArray(userProfile.allergies) ? userProfile.allergies : [],
    secondaryGoals: Array.isArray(userProfile.secondaryGoals) ? userProfile.secondaryGoals : [],
    dietaryRestrictions: Array.isArray(userProfile.dietaryRestrictions) ? userProfile.dietaryRestrictions : [],
    foodIntolerances: Array.isArray(userProfile.foodIntolerances) ? userProfile.foodIntolerances : [],
    medications: Array.isArray(userProfile.medications) ? userProfile.medications : [],
    snackPreferences: Array.isArray(userProfile.snackPreferences) ? userProfile.snackPreferences : [],
    foodsLoved: Array.isArray(userProfile.foodsLoved) ? userProfile.foodsLoved : [],
    foodsDisliked: Array.isArray(userProfile.foodsDisliked) ? userProfile.foodsDisliked : [],
    flavorPreferences: Array.isArray(userProfile.flavorPreferences) ? userProfile.flavorPreferences : [],
    texturePreferences: Array.isArray(userProfile.texturePreferences) ? userProfile.texturePreferences : [],
    cookingMethods: Array.isArray(userProfile.cookingMethods) ? userProfile.cookingMethods : [],
    kitchenEquipment: Array.isArray(userProfile.kitchenEquipment) ? userProfile.kitchenEquipment : [],
    restaurantTypes: Array.isArray(userProfile.restaurantTypes) ? userProfile.restaurantTypes : [],
    deliveryServices: Array.isArray(userProfile.deliveryServices) ? userProfile.deliveryServices : [],
    mealPrepServices: Array.isArray(userProfile.mealPrepServices) ? userProfile.mealPrepServices : [],
    shoppingPreferences: Array.isArray(userProfile.shoppingPreferences) ? userProfile.shoppingPreferences : [],
    digestiveHealth: Array.isArray(userProfile.digestiveHealth) ? userProfile.digestiveHealth : [],
    beveragePreferences: Array.isArray(userProfile.beveragePreferences) ? userProfile.beveragePreferences : [],
    mealPlanFocus: Array.isArray(userProfile.mealPlanFocus) ? userProfile.mealPlanFocus : (typeof userProfile.mealPlanFocus === "string" ? userProfile.mealPlanFocus : ""),
  };
  
  const duration = options?.duration || (planType === "monthly" ? 30 : planType === "weekly" ? 7 : 1);
  const dailyCalories = options?.calories || calculateDailyCalories(safeUserProfile);
  
  // Check for retry hints (internal flag for enhanced prompts on retry)
  const isRetryForCalories = (options as any)?._retryHint === 'CALORIE_TARGET_MISMATCH';

  let prompt = `You are a Board-Certified Clinical Nutritionist (CNS) and Registered Dietitian (RD) with 15+ years of experience creating evidence-based therapeutic meal plans. Your recommendations follow USDA Dietary Guidelines, Academy of Nutrition and Dietetics standards, and current peer-reviewed research. Generate a personalized ${planType} meal plan (${duration} days) with the following requirements:

USER PROFILE:
- Gender: ${safeUserProfile.gender}
${safeUserProfile.age ? `- Age: ${safeUserProfile.age} years` : ""}
${safeUserProfile.height ? `- Height: ${safeUserProfile.height} cm` : ""}
${safeUserProfile.currentWeight ? `- Current Weight: ${safeUserProfile.currentWeight} kg` : ""}
${safeUserProfile.targetWeight ? `- Target Weight: ${safeUserProfile.targetWeight} kg` : ""}
- Primary Goal: ${(safeUserProfile.goal || "health").replace("_", " ")}
${safeUserProfile.secondaryGoals && Array.isArray(safeUserProfile.secondaryGoals) && safeUserProfile.secondaryGoals.length > 0 ? `- Secondary Goals: ${safeUserProfile.secondaryGoals.map((g: string) => g.replace("_", " ")).join(", ")}` : ""}
- Activity Level: ${safeUserProfile.activity}
- Daily Calorie Target: ${dailyCalories} kcal
${safeUserProfile.weightChangeTimeline ? `- Weight Change Timeline: ${safeUserProfile.weightChangeTimeline.replace("_", " ")}` : ""}

DIETARY REQUIREMENTS:
${safeUserProfile.diet && Array.isArray(safeUserProfile.diet) && safeUserProfile.diet.length > 0 ? `- Dietary Preferences: ${safeUserProfile.diet.join(", ")}${safeUserProfile.dietaryPreferencesOther ? ` (Other: ${safeUserProfile.dietaryPreferencesOther})` : ""}` : "- No specific dietary preferences"}
${safeUserProfile.religious && safeUserProfile.religious !== "none" ? `- Religious Requirements: ${safeUserProfile.religious}${safeUserProfile.religiousDietOther ? ` (Other: ${safeUserProfile.religiousDietOther})` : ""} (STRICT ADHERENCE REQUIRED)` : "- No religious restrictions"}
${safeUserProfile.dietaryRestrictions && Array.isArray(safeUserProfile.dietaryRestrictions) && safeUserProfile.dietaryRestrictions.length > 0 ? `- Dietary Restrictions: ${safeUserProfile.dietaryRestrictions.join(", ")}${safeUserProfile.dietaryRestrictionsOther ? ` (Other: ${safeUserProfile.dietaryRestrictionsOther})` : ""}` : ""}
${safeUserProfile.foodIntolerances && Array.isArray(safeUserProfile.foodIntolerances) && safeUserProfile.foodIntolerances.length > 0 ? `- Food Intolerances: ${safeUserProfile.foodIntolerances.join(", ")}${safeUserProfile.foodIntolerancesOther ? ` (Other: ${safeUserProfile.foodIntolerancesOther})` : ""}` : ""}
${safeUserProfile.conditions && Array.isArray(safeUserProfile.conditions) && safeUserProfile.conditions.length > 0 ? `- Health Conditions: ${safeUserProfile.conditions.join(", ")}${safeUserProfile.healthConditionsOther ? ` (Other: ${safeUserProfile.healthConditionsOther})` : ""} (must accommodate these conditions)` : "- No health conditions"}
${safeUserProfile.allergies && Array.isArray(safeUserProfile.allergies) && safeUserProfile.allergies.length > 0 ? `- Allergies (MUST EXCLUDE): ${safeUserProfile.allergies.join(", ")}${safeUserProfile.allergiesOther ? ` (Other: ${safeUserProfile.allergiesOther})` : ""}` : "- No known allergies"}
${safeUserProfile.medications && Array.isArray(safeUserProfile.medications) && safeUserProfile.medications.length > 0 ? `- Medications: ${safeUserProfile.medications.join(", ")}${safeUserProfile.medicationsOther ? ` (Other: ${safeUserProfile.medicationsOther})` : ""} (consider interactions)` : ""}
${safeUserProfile.pregnancyStatus && safeUserProfile.pregnancyStatus !== "not_applicable" ? `- Pregnancy Status: ${safeUserProfile.pregnancyStatus.replace("_", " ")}${safeUserProfile.pregnancyStatusOther ? ` (Other: ${safeUserProfile.pregnancyStatusOther})` : ""}` : ""}
${safeUserProfile.recentSurgeries ? `- Recent Surgeries: ${safeUserProfile.recentSurgeries}` : ""}
${safeUserProfile.healthGoalCustom ? `- Custom Health Goal: ${safeUserProfile.healthGoalCustom}` : ""}

MEAL TIMING & FREQUENCY:
${safeUserProfile.mealsPerDay ? `- Meals per day: ${safeUserProfile.mealsPerDay}${safeUserProfile.mealsPerDayOther ? ` (Other: ${safeUserProfile.mealsPerDayOther})` : ""}` : "- 3 meals per day"}
${safeUserProfile.includeSnacks ? `- Include snacks: ${safeUserProfile.includeSnacks}${safeUserProfile.includeSnacksOther ? ` (Other: ${safeUserProfile.includeSnacksOther})` : ""}` : "- Include snacks: yes"}
${safeUserProfile.mealTimes ? `- Preferred meal times: Breakfast ${safeUserProfile.mealTimes.breakfast || "7:00"}, Lunch ${safeUserProfile.mealTimes.lunch || "12:00"}, Dinner ${safeUserProfile.mealTimes.dinner || "19:00"}` : ""}
${safeUserProfile.snackPreferences && Array.isArray(safeUserProfile.snackPreferences) && safeUserProfile.snackPreferences.length > 0 ? `- Snack preferences: ${safeUserProfile.snackPreferences.join(", ")}${safeUserProfile.snackPreferencesOther ? ` (Other: ${safeUserProfile.snackPreferencesOther})` : ""}` : ""}
${safeUserProfile.intermittentFasting && safeUserProfile.intermittentFasting !== "no" ? `- Intermittent Fasting: ${safeUserProfile.intermittentFasting}${safeUserProfile.intermittentFastingOther ? ` (Other: ${safeUserProfile.intermittentFastingOther})` : ""}` : ""}

FOOD PREFERENCES:
${safeUserProfile.foodsLoved && Array.isArray(safeUserProfile.foodsLoved) && safeUserProfile.foodsLoved.length > 0 ? `- Foods to INCLUDE/FAVOR: ${safeUserProfile.foodsLoved.join(", ")}${safeUserProfile.foodsLovedProteinsOther ? ` (Proteins Other: ${safeUserProfile.foodsLovedProteinsOther})` : ""}${safeUserProfile.foodsLovedGrainsOther ? ` (Grains Other: ${safeUserProfile.foodsLovedGrainsOther})` : ""}${safeUserProfile.foodsLovedVegetablesOther ? ` (Vegetables Other: ${safeUserProfile.foodsLovedVegetablesOther})` : ""}${safeUserProfile.foodsLovedFruitsOther ? ` (Fruits Other: ${safeUserProfile.foodsLovedFruitsOther})` : ""}${safeUserProfile.foodsLovedDairyOther ? ` (Dairy Other: ${safeUserProfile.foodsLovedDairyOther})` : ""}` : ""}
${safeUserProfile.foodsDisliked && Array.isArray(safeUserProfile.foodsDisliked) && safeUserProfile.foodsDisliked.length > 0 ? `- Foods to AVOID/EXCLUDE: ${safeUserProfile.foodsDisliked.join(", ")}${safeUserProfile.foodsDislikedOther ? ` (Other: ${safeUserProfile.foodsDislikedOther})` : ""}` : ""}
${safeUserProfile.flavorPreferences && Array.isArray(safeUserProfile.flavorPreferences) && safeUserProfile.flavorPreferences.length > 0 ? `- Flavor preferences: ${safeUserProfile.flavorPreferences.join(", ")}${safeUserProfile.flavorPreferencesOther ? ` (Other: ${safeUserProfile.flavorPreferencesOther})` : ""}` : ""}
${safeUserProfile.texturePreferences && Array.isArray(safeUserProfile.texturePreferences) && safeUserProfile.texturePreferences.length > 0 ? `- Texture preferences: ${safeUserProfile.texturePreferences.join(", ")}${safeUserProfile.texturePreferencesOther ? ` (Other: ${safeUserProfile.texturePreferencesOther})` : ""}` : ""}

COOKING & PREPARATION:
${userProfile.mealSource ? `- Meal source: ${userProfile.mealSource}${userProfile.mealSourceOther ? ` (Other: ${userProfile.mealSourceOther})` : ""}` : ""}
${userProfile.cookingSkillLevel ? `- Cooking skill level: ${userProfile.cookingSkillLevel}${userProfile.cookingSkillLevelOther ? ` (Other: ${userProfile.cookingSkillLevelOther})` : ""}` : ""}
${userProfile.cookingTimeAvailable ? `- Time available: ${userProfile.cookingTimeAvailable.replace("_", " ")}${userProfile.cookingTimeAvailableOther ? ` (Other: ${userProfile.cookingTimeAvailableOther})` : ""}` : ""}
${userProfile.cookingMethods && Array.isArray(userProfile.cookingMethods) && userProfile.cookingMethods.length > 0 ? `- Preferred cooking methods: ${userProfile.cookingMethods.join(", ")}${userProfile.cookingMethodsOther ? ` (Other: ${userProfile.cookingMethodsOther})` : ""}` : ""}
${userProfile.mealPrepPreference ? `- Meal prep preference: ${userProfile.mealPrepPreference}${userProfile.mealPrepPreferenceOther ? ` (Other: ${userProfile.mealPrepPreferenceOther})` : ""}` : ""}
${userProfile.kitchenEquipment && Array.isArray(userProfile.kitchenEquipment) && userProfile.kitchenEquipment.length > 0 ? `- Available equipment: ${userProfile.kitchenEquipment.join(", ")}${userProfile.kitchenEquipmentOther ? ` (Other: ${userProfile.kitchenEquipmentOther})` : ""}` : ""}
${userProfile.restaurantTypes && Array.isArray(userProfile.restaurantTypes) && userProfile.restaurantTypes.length > 0 ? `- Restaurant types: ${userProfile.restaurantTypes.join(", ")}${userProfile.restaurantTypesOther ? ` (Other: ${userProfile.restaurantTypesOther})` : ""}` : ""}
${userProfile.deliveryServices && Array.isArray(userProfile.deliveryServices) && userProfile.deliveryServices.length > 0 ? `- Delivery services: ${userProfile.deliveryServices.join(", ")}${userProfile.deliveryServicesOther ? ` (Other: ${userProfile.deliveryServicesOther})` : ""}` : ""}
${userProfile.orderingBudget ? `- Ordering budget: ${userProfile.orderingBudget}${userProfile.orderingBudgetOther ? ` (Other: ${userProfile.orderingBudgetOther})` : ""}` : ""}
${userProfile.orderingFrequency ? `- Ordering frequency: ${userProfile.orderingFrequency}${userProfile.orderingFrequencyOther ? ` (Other: ${userProfile.orderingFrequencyOther})` : ""}` : ""}
${userProfile.mealPrepServices && Array.isArray(userProfile.mealPrepServices) && userProfile.mealPrepServices.length > 0 ? `- Meal prep services: ${userProfile.mealPrepServices.join(", ")}${userProfile.mealPrepServicesOther ? ` (Other: ${userProfile.mealPrepServicesOther})` : ""}` : ""}

LIFESTYLE & SCHEDULE:
${userProfile.typicalDaySchedule ? `- Typical schedule: ${userProfile.typicalDaySchedule.replace("_", " ")}${userProfile.typicalDayScheduleOther ? ` (Other: ${userProfile.typicalDayScheduleOther})` : ""}` : ""}
${userProfile.workSchedule ? `- Work schedule: ${userProfile.workSchedule.replace("_", " ")}${userProfile.workScheduleOther ? ` (Other: ${userProfile.workScheduleOther})` : ""}` : ""}
${userProfile.lunchLocation ? `- Lunch location: ${userProfile.lunchLocation.replace("_", " ")}${userProfile.lunchLocationOther ? ` (Other: ${userProfile.lunchLocationOther})` : ""}` : ""}
${userProfile.dinnerLocation ? `- Dinner location: ${userProfile.dinnerLocation.replace("_", " ")}${userProfile.dinnerLocationOther ? ` (Other: ${userProfile.dinnerLocationOther})` : ""}` : ""}
${userProfile.weekendEatingHabits ? `- Weekend habits: ${userProfile.weekendEatingHabits.replace("_", " ")}${userProfile.weekendEatingHabitsOther ? ` (Other: ${userProfile.weekendEatingHabitsOther})` : ""}` : ""}
${userProfile.activityLevel ? `- Activity Level: ${userProfile.activityLevel}${userProfile.activityLevelOther ? ` (Other: ${userProfile.activityLevelOther})` : ""}` : ""}

BUDGET & SHOPPING:
${userProfile.budgetLevel ? `- Budget level: ${userProfile.budgetLevel.replace("_", " ")}${userProfile.budgetLevelOther ? ` (Other: ${userProfile.budgetLevelOther})` : ""}` : ""}
${userProfile.shoppingFrequency ? `- Shopping frequency: ${userProfile.shoppingFrequency.replace("_", "/")}${userProfile.shoppingFrequencyOther ? ` (Other: ${userProfile.shoppingFrequencyOther})` : ""}` : ""}
${userProfile.shoppingPreferences && Array.isArray(userProfile.shoppingPreferences) && userProfile.shoppingPreferences.length > 0 ? `- Shopping preferences: ${userProfile.shoppingPreferences.join(", ")}${userProfile.shoppingPreferencesOther ? ` (Other: ${userProfile.shoppingPreferencesOther})` : ""}` : ""}
${userProfile.specialtyStoresAccess ? `- Specialty stores access: ${userProfile.specialtyStoresAccess}${userProfile.specialtyStoresAccessOther ? ` (Other: ${userProfile.specialtyStoresAccessOther})` : ""}` : ""}

NUTRITION DETAILS:
${userProfile.weightChangeTimeline ? `- Weight change timeline: ${userProfile.weightChangeTimeline.replace("_", " ")}${userProfile.weightChangeTimelineOther ? ` (Other: ${userProfile.weightChangeTimelineOther})` : ""}` : ""}
${userProfile.macroPreferences ? `- Macro preference: ${userProfile.macroPreferences.replace("_", " ")}${userProfile.macroPreferencesOther ? ` (Other: ${userProfile.macroPreferencesOther})` : ""}` : ""}
${userProfile.customMacros ? `- Custom macros: Protein ${userProfile.customMacros.protein}%, Carbs ${userProfile.customMacros.carbs}%, Fat ${userProfile.customMacros.fat}%` : ""}
${userProfile.fiberTarget ? `- Fiber target: ${userProfile.fiberTarget.replace("_", " ")}${userProfile.fiberTargetOther ? ` (Other: ${userProfile.fiberTargetOther})` : ""}` : ""}
${userProfile.sodiumSensitivity ? `- Sodium sensitivity: ${userProfile.sodiumSensitivity.replace("_", " ")}${userProfile.sodiumSensitivityOther ? ` (Other: ${userProfile.sodiumSensitivityOther})` : ""}` : ""}

CULTURAL & REGIONAL:
${userProfile.culturalBackground ? `- Cultural background: ${userProfile.culturalBackground.replace("_", " ")}${userProfile.culturalBackgroundOther ? ` (Other: ${userProfile.culturalBackgroundOther})` : ""}` : ""}
${userProfile.cuisinePreference ? `- Cuisine preference: ${userProfile.cuisinePreference}${userProfile.cuisinePreferenceOther ? ` (Other: ${userProfile.cuisinePreferenceOther})` : ""}` : ""}
${userProfile.traditionalFoodsToInclude ? `- Traditional foods to include: ${userProfile.traditionalFoodsToInclude}` : ""}
${userProfile.foodsFromCultureToAvoid ? `- Foods from culture to avoid: ${userProfile.foodsFromCultureToAvoid}` : ""}
${userProfile.spiceTolerance ? `- Spice tolerance: ${userProfile.spiceTolerance.replace("_", " ")}${userProfile.spiceToleranceOther ? ` (Other: ${userProfile.spiceToleranceOther})` : ""}` : ""}

CLINICAL ASSESSMENT FACTORS:
${safeUserProfile.digestiveHealth && Array.isArray(safeUserProfile.digestiveHealth) && safeUserProfile.digestiveHealth.length > 0 ? `- Digestive Health Issues: ${safeUserProfile.digestiveHealth.join(", ")}${safeUserProfile.digestiveHealthOther ? ` (Other: ${safeUserProfile.digestiveHealthOther})` : ""} (consider gut-friendly foods and meal timing)` : ""}
${safeUserProfile.sleepSchedule ? `- Sleep Schedule: ${safeUserProfile.sleepSchedule.replace("_", " ")}${safeUserProfile.sleepScheduleOther ? ` (Other: ${safeUserProfile.sleepScheduleOther})` : ""} (consider circadian rhythm and meal timing)` : ""}
${safeUserProfile.stressLevel ? `- Stress Level: ${safeUserProfile.stressLevel.replace("_", " ")}${safeUserProfile.stressLevelOther ? ` (Other: ${safeUserProfile.stressLevelOther})` : ""} (consider stress-reducing nutrients and meal timing)` : ""}
${safeUserProfile.hydrationPreferences ? `- Hydration Preferences: ${safeUserProfile.hydrationPreferences}${safeUserProfile.hydrationPreferencesOther ? ` (Other: ${safeUserProfile.hydrationPreferencesOther})` : ""}` : ""}
${safeUserProfile.waterIntake ? `- Current Water Intake: ${safeUserProfile.waterIntake} (recommend optimal hydration)` : ""}
${safeUserProfile.beveragePreferences && Array.isArray(safeUserProfile.beveragePreferences) && safeUserProfile.beveragePreferences.length > 0 ? `- Beverage Preferences: ${safeUserProfile.beveragePreferences.join(", ")}${safeUserProfile.beveragePreferencesOther ? ` (Other: ${safeUserProfile.beveragePreferencesOther})` : ""}` : ""}

SPECIAL REQUESTS:
${userProfile.specialOccasions && userProfile.specialOccasions !== "none" ? `- Special occasions: ${userProfile.specialOccasions.replace("_", " ")}${userProfile.specialOccasionsOther ? ` (Other: ${userProfile.specialOccasionsOther})` : ""}` : ""}
${userProfile.specialDietaryNotes ? `- Special notes: ${userProfile.specialDietaryNotes}` : ""}
${safeUserProfile.mealPlanFocus ? (Array.isArray(safeUserProfile.mealPlanFocus) ? (safeUserProfile.mealPlanFocus.length > 0 ? `- Meal plan focus: ${safeUserProfile.mealPlanFocus.join(", ")}${safeUserProfile.mealPlanFocusOther ? ` (Other: ${safeUserProfile.mealPlanFocusOther})` : ""}` : "") : `- Meal plan focus: ${typeof safeUserProfile.mealPlanFocus === "string" ? safeUserProfile.mealPlanFocus.replace("_", " ") : String(safeUserProfile.mealPlanFocus)}${safeUserProfile.mealPlanFocusOther ? ` (Other: ${safeUserProfile.mealPlanFocusOther})` : ""}`) : ""}
${safeUserProfile.varietyPreference ? `- Variety preference: ${safeUserProfile.varietyPreference}${safeUserProfile.varietyPreferenceOther ? ` (Other: ${safeUserProfile.varietyPreferenceOther})` : ""}` : ""}

MEAL PLAN GENERATION REQUIREMENTS (Priority-Based):

═══════════════════════════════════════════════════════════════════════════════
PRIORITY 1: SAFETY & COMPLIANCE (NON-NEGOTIABLE - ZERO TOLERANCE FOR ERRORS)
═══════════════════════════════════════════════════════════════════════════════

⚠️ CRITICAL SAFETY REQUIREMENT - ALLERGEN AVOIDANCE:
${safeUserProfile.allergies && Array.isArray(safeUserProfile.allergies) && safeUserProfile.allergies.length > 0 ? `- USER HAS ALLERGIES: ${safeUserProfile.allergies.join(", ")}${safeUserProfile.allergiesOther ? `, ${safeUserProfile.allergiesOther}` : ""}
- MANDATORY: Check EVERY SINGLE ingredient against this allergy list before including it
- DOUBLE-CHECK: Review each meal's complete ingredient list to ensure ZERO allergens are present
- CROSS-CONTAMINATION: Consider potential cross-contamination risks in processed foods
- THIS IS A SAFETY ISSUE: One mistake could cause serious harm - be extremely careful
- If ANY ingredient contains or may contain these allergens, DO NOT USE IT` : `- User has no known allergies, but still verify all ingredients are safe`}

🕌 RELIGIOUS DIETARY REQUIREMENTS (STRICT ADHERENCE - MANDATORY):
${safeUserProfile.religious && safeUserProfile.religious !== "none" ? (() => {
  const religious = safeUserProfile.religious.toLowerCase();
  if (religious === "halal") {
    return `- RELIGION: HALAL (ISLAMIC DIETARY LAWS) - STRICT COMPLIANCE REQUIRED
- ABSOLUTELY FORBIDDEN: No pork, pork products, or any pork derivatives (gelatin, lard, etc.)
- ABSOLUTELY FORBIDDEN: No alcohol or alcohol-based ingredients (wine, beer, cooking wine, vanilla extract with alcohol, etc.)
- MEAT REQUIREMENT: Only halal-certified meat is permitted (chicken, beef, lamb, goat must be halal-certified)
- FORBIDDEN ANIMALS: No carnivorous animals, birds of prey, or animals not slaughtered according to Islamic law
- PROCESSED FOODS: Check all processed foods for halal certification - avoid if uncertain
- CROSS-CONTAMINATION: Ensure no cross-contamination with non-halal foods during preparation
- CUSTOM REQUIREMENT: ${safeUserProfile.religiousDietOther ? safeUserProfile.religiousDietOther : "None specified"}`;
  } else if (religious === "kosher") {
    return `- RELIGION: KOSHER (JEWISH DIETARY LAWS) - STRICT COMPLIANCE REQUIRED
- ABSOLUTELY FORBIDDEN: No pork, shellfish, or any non-kosher animals
- SEPARATION RULE: Never mix meat with dairy in the same meal or preparation
- MEAT REQUIREMENT: Only kosher-certified meat is permitted
- DAIRY REQUIREMENT: Only kosher-certified dairy products are permitted
- PREPARATION: Separate preparation methods and utensils for meat and dairy meals
- PARVE: Use parve (neutral) ingredients when possible to allow flexibility
- CUSTOM REQUIREMENT: ${safeUserProfile.religiousDietOther ? safeUserProfile.religiousDietOther : "None specified"}`;
  } else if (religious === "jain") {
    return `- RELIGION: JAIN VEGETARIAN - STRICT COMPLIANCE REQUIRED
- ABSOLUTELY FORBIDDEN: No root vegetables (potatoes, onions, garlic, carrots, radishes, turnips, sweet potatoes, beets, etc.)
- VEGETARIAN REQUIREMENT: Strictly vegetarian - no meat, fish, eggs, or any animal products
- ALLOWED VEGETABLES: Only above-ground vegetables (tomatoes, peppers, leafy greens, beans, etc.)
- NO HARM PRINCIPLE: Follow ahimsa (non-violence) - avoid any foods that require uprooting plants
- CUSTOM REQUIREMENT: ${safeUserProfile.religiousDietOther ? safeUserProfile.religiousDietOther : "None specified"}`;
  } else if (religious === "hindu") {
    return `- RELIGION: HINDU VEGETARIAN - STRICT COMPLIANCE REQUIRED
- ABSOLUTELY FORBIDDEN: No beef (cow is sacred in Hinduism)
- VEGETARIAN REQUIREMENT: Strictly vegetarian - no meat, fish, eggs (some allow dairy)
- ONION/GARLIC: Some Hindus avoid onions and garlic - check if user specified this preference
- DAIRY: Most Hindus consume dairy products (milk, yogurt, ghee, paneer)
- CUSTOM REQUIREMENT: ${safeUserProfile.religiousDietOther ? safeUserProfile.religiousDietOther : "None specified"}`;
  } else if (religious === "buddhist") {
    return `- RELIGION: BUDDHIST VEGETARIAN - STRICT COMPLIANCE REQUIRED
- VEGETARIAN REQUIREMENT: Strictly vegetarian - no meat, fish (some avoid eggs and dairy)
- COMPASSION PRINCIPLE: Follow Buddhist principles of non-harm to all living beings
- EGG/DAIRY: Some Buddhists avoid eggs and dairy - check user preferences
- CUSTOM REQUIREMENT: ${safeUserProfile.religiousDietOther ? safeUserProfile.religiousDietOther : "None specified"}`;
  } else if (religious === "sattvic") {
    return `- RELIGION: SATTVIC DIET - STRICT COMPLIANCE REQUIRED
- PURE VEGETARIAN: No meat, fish, eggs, onions, or garlic
- FRESH FOODS ONLY: Only fresh, natural, unprocessed foods
- FORBIDDEN: No stimulants (coffee, tea, chocolate), no fermented foods, no overly spicy foods
- PROMOTE CLARITY: Focus on foods that promote mental clarity and spiritual growth
- CUSTOM REQUIREMENT: ${safeUserProfile.religiousDietOther ? safeUserProfile.religiousDietOther : "None specified"}`;
  } else {
    return `- RELIGION: ${safeUserProfile.religious.toUpperCase()} - STRICT COMPLIANCE REQUIRED
- CUSTOM REQUIREMENT: ${safeUserProfile.religiousDietOther ? safeUserProfile.religiousDietOther : "Please follow all dietary requirements for this religion strictly"}`;
  }
})() : `- No specific religious dietary requirements`}

🌍 CULTURAL AUTHENTICITY REQUIREMENTS (MANDATORY):
${userProfile.culturalBackground || userProfile.cuisinePreference ? `- CULTURAL BACKGROUND: ${userProfile.culturalBackground ? userProfile.culturalBackground.replace("_", " ") : "Not specified"}${userProfile.culturalBackgroundOther ? ` (${userProfile.culturalBackgroundOther})` : ""}
- CUISINE PREFERENCE: ${userProfile.cuisinePreference ? userProfile.cuisinePreference : "Not specified"}${userProfile.cuisinePreferenceOther ? ` (${userProfile.cuisinePreferenceOther})` : ""}
- TRADITIONAL FOODS: ${userProfile.traditionalFoodsToInclude ? `MUST INCLUDE: ${userProfile.traditionalFoodsToInclude}` : "Include culturally significant and traditional dishes from user's background"}
- FOODS TO AVOID: ${userProfile.foodsFromCultureToAvoid ? `AVOID: ${userProfile.foodsFromCultureToAvoid}` : "Respect cultural food taboos and preferences"}
- SPICE TOLERANCE: ${userProfile.spiceTolerance ? `Match spice level to: ${userProfile.spiceTolerance.replace("_", " ")}` : "Match spice levels to cultural preferences"}
- AUTHENTIC METHODS: Use traditional cooking methods and techniques from user's cultural background
- CULTURAL SIGNIFICANCE: Prioritize ingredients and dishes that are culturally significant and familiar
- MAKE IT FEEL FAMILIAR: Meals should feel authentic, culturally appropriate, and reminiscent of home cooking
- REGIONAL TRADITIONS: Respect regional food traditions and variations within the cultural background` : `- No specific cultural requirements, but ensure meals are culturally sensitive and appropriate`}

═══════════════════════════════════════════════════════════════════════════════
PRIORITY 2: HEALTH & NUTRITION (IMPORTANT - EVIDENCE-BASED)
═══════════════════════════════════════════════════════════════════════════════

1. HEALTH CONDITIONS ACCOMMODATION:
${safeUserProfile.conditions && Array.isArray(safeUserProfile.conditions) && safeUserProfile.conditions.length > 0 ? `- User has health conditions: ${safeUserProfile.conditions.join(", ")}${safeUserProfile.healthConditionsOther ? ` (${safeUserProfile.healthConditionsOther})` : ""}
- All meals MUST be therapeutically appropriate for these conditions
- Follow medical nutrition therapy principles for each condition
- Consider medication interactions: ${safeUserProfile.medications && Array.isArray(safeUserProfile.medications) && safeUserProfile.medications.length > 0 ? safeUserProfile.medications.join(", ") : "None specified"}` : `- No specific health conditions to accommodate`}

2. NUTRITIONAL REQUIREMENTS - CRITICAL CALORIE TARGET:
${isRetryForCalories ? `⚠️ RETRY ATTEMPT - PREVIOUS ATTEMPT FAILED CALORIE VALIDATION ⚠️
- CRITICAL: The previous meal plan did not meet the calorie target. You MUST ensure the total equals exactly ${dailyCalories} kcal.
- DOUBLE-CHECK: Before returning, verify the sum of ALL meals + snacks = ${dailyCalories} kcal (±50 kcal)
` : ""}
- MANDATORY: Total daily calories MUST equal exactly ${dailyCalories} kcal (±50 kcal tolerance)
- CALCULATION METHOD: Sum ALL meals for each day: breakfast calories + lunch calories + dinner calories + snack calories (if included) = ${dailyCalories} kcal
- VERIFICATION STEP: Before finalizing each day, calculate the total:
  * Add breakfast.nutrition.calories
  * Add lunch.nutrition.calories  
  * Add dinner.nutrition.calories
  * Add all snacks[].nutrition.calories (if snacks exist)
  * Total MUST be between ${dailyCalories - 50} and ${dailyCalories + 50} kcal
- ADJUSTMENT INSTRUCTIONS:
  * If total is LESS than ${dailyCalories - 50}: Increase portion sizes or add snacks until total reaches target
  * If total is MORE than ${dailyCalories + 50}: Reduce portion sizes until total reaches target
- EXAMPLE: For ${dailyCalories} kcal target, a day might be: Breakfast ${Math.round(dailyCalories * 0.25)} + Lunch ${Math.round(dailyCalories * 0.35)} + Dinner ${Math.round(dailyCalories * 0.30)} + Snacks ${Math.round(dailyCalories * 0.10)} = ${dailyCalories} kcal
- This is a MANDATORY requirement - validation will reject plans that don't meet this target
${isRetryForCalories ? `- ⚠️ REMINDER: This is a RETRY - previous attempt had calorie mismatch. Be extra careful with calculations! ⚠️` : ""}
- Complete nutritional breakdown required for each meal: calories, protein (grams), carbs (grams), fat (grams), fiber (grams), sodium (mg)
- Macronutrient distribution: Align with user's goals and health conditions (follow evidence-based ratios)
${userProfile.customMacros ? `- Custom macro targets: Protein ${userProfile.customMacros.protein}%, Carbs ${userProfile.customMacros.carbs}%, Fat ${userProfile.customMacros.fat}%` : ""}
${userProfile.fiberTarget ? `- Fiber target: ${userProfile.fiberTarget.replace("_", " ")}` : ""}
${userProfile.sodiumSensitivity ? `- Sodium sensitivity: ${userProfile.sodiumSensitivity.replace("_", " ")} - adjust accordingly` : ""}
- Nutrient timing: Consider optimal metabolic response and energy levels throughout the day

3. DIGESTIVE HEALTH:
${safeUserProfile.digestiveHealth && Array.isArray(safeUserProfile.digestiveHealth) && safeUserProfile.digestiveHealth.length > 0 ? `- Digestive issues: ${safeUserProfile.digestiveHealth.join(", ")}${safeUserProfile.digestiveHealthOther ? ` (${safeUserProfile.digestiveHealthOther})` : ""}
- Use gut-friendly foods, proper meal spacing, and appropriate fiber levels` : `- Consider digestive health in meal planning`}

4. STRESS & LIFESTYLE FACTORS:
${safeUserProfile.stressLevel ? `- Stress level: ${safeUserProfile.stressLevel.replace("_", " ")} - incorporate stress-reducing nutrients (magnesium, B vitamins, omega-3s) if high` : ""}
${safeUserProfile.sleepSchedule ? `- Sleep schedule: ${safeUserProfile.sleepSchedule.replace("_", " ")} - optimize meal timing based on circadian rhythm` : ""}
${safeUserProfile.hydrationPreferences ? `- Hydration: ${safeUserProfile.hydrationPreferences}${safeUserProfile.hydrationPreferencesOther ? ` (${safeUserProfile.hydrationPreferencesOther})` : ""}` : ""}

═══════════════════════════════════════════════════════════════════════════════
PRIORITY 3: PREFERENCES & OPTIMIZATION (ENHANCEMENT)
═══════════════════════════════════════════════════════════════════════════════

1. MEAL STRUCTURE:
- Each day MUST include: breakfast, lunch, dinner, and optional snacks based on user preferences and metabolic needs
- Meal timing: ${safeUserProfile.mealTimes ? `Breakfast ${safeUserProfile.mealTimes.breakfast || "7:00"}, Lunch ${safeUserProfile.mealTimes.lunch || "12:00"}, Dinner ${safeUserProfile.mealTimes.dinner || "19:00"}` : "Optimize based on circadian rhythm, sleep schedule, and work patterns"}
${safeUserProfile.mealsPerDay ? `- Meals per day: ${safeUserProfile.mealsPerDay}` : ""}
${safeUserProfile.includeSnacks ? `- Include snacks: ${safeUserProfile.includeSnacks}` : ""}

2. MEAL COMPLETENESS (Each meal MUST have):
- A descriptive name (e.g., "Chicken Biryani with Raita" for Indian cuisine, culturally appropriate)
- Complete ingredients list with quantities (e.g., "2 large eggs", "1 cup fresh spinach", "2 slices whole grain bread")
- Step-by-step cooking instructions suitable for user's cooking skill level: ${userProfile.cookingSkillLevel ? userProfile.cookingSkillLevel : "intermediate"}
- Complete nutritional breakdown (calories, protein in grams, carbs in grams, fat in grams)

3. FOOD PREFERENCES:
${safeUserProfile.foodsLoved && Array.isArray(safeUserProfile.foodsLoved) && safeUserProfile.foodsLoved.length > 0 ? `- Foods to INCLUDE/FAVOR: ${safeUserProfile.foodsLoved.join(", ")} - prioritize these when possible` : ""}
${safeUserProfile.foodsDisliked && Array.isArray(safeUserProfile.foodsDisliked) && safeUserProfile.foodsDisliked.length > 0 ? `- Foods to AVOID: ${safeUserProfile.foodsDisliked.join(", ")} - exclude these completely` : ""}
${safeUserProfile.flavorPreferences && Array.isArray(safeUserProfile.flavorPreferences) && safeUserProfile.flavorPreferences.length > 0 ? `- Flavor preferences: ${safeUserProfile.flavorPreferences.join(", ")}` : ""}
${safeUserProfile.texturePreferences && Array.isArray(safeUserProfile.texturePreferences) && safeUserProfile.texturePreferences.length > 0 ? `- Texture preferences: ${safeUserProfile.texturePreferences.join(", ")}` : ""}

4. COOKING & PRACTICALITY:
- Make meals practical, delicious, and match cooking skill level: ${userProfile.cookingSkillLevel ? userProfile.cookingSkillLevel : "intermediate"}
- Time available: ${userProfile.cookingTimeAvailable ? userProfile.cookingTimeAvailable.replace("_", " ") : "moderate"}
- Cooking methods: ${userProfile.cookingMethods && Array.isArray(userProfile.cookingMethods) && userProfile.cookingMethods.length > 0 ? userProfile.cookingMethods.join(", ") : "various"}
- Kitchen equipment: ${userProfile.kitchenEquipment && Array.isArray(userProfile.kitchenEquipment) && userProfile.kitchenEquipment.length > 0 ? userProfile.kitchenEquipment.join(", ") : "standard"}
- Meal prep preference: ${userProfile.mealPrepPreference ? userProfile.mealPrepPreference : "flexible"}

5. BUDGET & SHOPPING:
- Budget level: ${userProfile.budgetLevel ? userProfile.budgetLevel.replace("_", " ") : "moderate"}
- Shopping frequency: ${userProfile.shoppingFrequency ? userProfile.shoppingFrequency.replace("_", "/") : "weekly"}
- Create a COMPREHENSIVE grocery list that includes:
  - AGGREGATE all ingredients from ALL meals across ALL ${duration} days
  - SUM quantities for duplicate ingredients (e.g., if Day 1 uses "1 tbsp ghee" and Day 2 uses "2 tbsp ghee", list as "3 tbsp ghee" total)
  - Convert to practical shopping units:
    * Small spices: If total < 1 tbsp, list as "1 packet" or "1 small container"
    * Liquids: Convert tbsp/tsp to cups/ml where practical (e.g., 19 tbsp = 1 cup + 3 tbsp)
    * Bulk items: Convert small quantities to standard package sizes (e.g., 1/4 cup flour → "1 bag flour")
  - EXCLUDE these items (they're kitchen staples):
    * "Salt to taste" or any "to taste" items
    * Plain water (unless it's a specific ingredient like "coconut water")
    * "For garnish" items (list separately if significant quantity)
    * Items with "as needed" or "optional"
  - Organize by category: produce, protein, dairy, pantry, spices, beverages
  - Be specific with measurements suitable for grocery shopping (e.g., "500g paneer", "2 cups brown rice", "1 bunch cilantro")

6. VARIETY & CREATIVITY:
- ${userProfile.varietyPreference === "high" ? "Provide HIGH VARIETY - different meals every day" : userProfile.varietyPreference === "low" ? "Provide LOW VARIETY - repeat favorite meals" : "Provide MODERATE VARIETY - mix of new and repeated meals"}
- Be creative with recipes while respecting ALL restrictions (Priority 1 requirements take precedence)
- Consider meal prep and leftovers to reduce waste

═══════════════════════════════════════════════════════════════════════════════
VALIDATION CHECKLIST (MANDATORY - VERIFY BEFORE FINALIZING EACH MEAL)
═══════════════════════════════════════════════════════════════════════════════

Before finalizing ANY meal, you MUST verify:

✓ ALLERGEN CHECK: Have you checked EVERY ingredient against the user's allergy list? (If user has allergies)
✓ RELIGIOUS COMPLIANCE: Does this meal comply with all religious dietary requirements? (If user has religious restrictions)
✓ CULTURAL AUTHENTICITY: Is this meal culturally appropriate and authentic to user's background? (If user specified cultural preferences)
✓ HEALTH CONDITIONS: Is this meal appropriate for user's health conditions?
✓ NUTRITIONAL COMPLETENESS: Does this meal have complete nutritional information (calories, protein, carbs, fat)?
✓ INGREDIENT QUANTITIES: Are all ingredients listed with specific quantities?
✓ COOKING INSTRUCTIONS: Are step-by-step instructions provided and suitable for user's skill level?
✓ CALORIE TARGET: Does the daily total (all meals + snacks combined) equal exactly ${dailyCalories} kcal (±50 kcal)? Calculate: breakfast + lunch + dinner + snacks = ${dailyCalories} kcal

FINAL VALIDATION CHECKLIST (MUST VERIFY BEFORE RETURNING):
Before returning the JSON, verify:
1. ✓ Daily calories: Sum of all meals + snacks = ${dailyCalories} kcal (±50 kcal)
2. ✓ All meals have: name, ingredients (min 3), instructions (min 50 chars), nutrition (calories, protein, carbs, fat)
3. ✓ Grocery list includes ALL ingredients from ALL meals
4. ✓ No allergens present (if user has allergies)
5. ✓ Religious requirements met (if applicable)
6. ✓ Cultural authenticity maintained (if applicable)

IF ANY CHECK FAILS, DO NOT INCLUDE THAT MEAL - REVISE IT UNTIL ALL CHECKS PASS.

OUTPUT FORMAT (JSON only, no markdown):
{
  "overview": {
    "dailyCalories": ${dailyCalories},
    "macros": {
      "protein": <grams>,
      "carbs": <grams>,
      "fat": <grams>
    },
    "duration": ${duration},
    "type": "${planType}"
  },
  "days": [
    {
      "day": 1,
      "meals": {
        "breakfast": {
          "name": "<descriptive meal name>",
          "ingredients": ["<quantity> <ingredient>", "<quantity> <ingredient>"],
          "instructions": "<detailed step-by-step cooking instructions>",
          "nutrition": {
            "calories": <number>,
            "protein": <number in grams>,
            "carbs": <number in grams>,
            "fat": <number in grams>
          }
        },
        "lunch": {
          "name": "<descriptive meal name>",
          "ingredients": ["<quantity> <ingredient>", ...],
          "instructions": "<detailed instructions>",
          "nutrition": {
            "calories": <number>,
            "protein": <number in grams>,
            "carbs": <number in grams>,
            "fat": <number in grams>
          }
        },
        "dinner": {
          "name": "<descriptive meal name>",
          "ingredients": ["<quantity> <ingredient>", ...],
          "instructions": "<detailed instructions>",
          "nutrition": {
            "calories": <number>,
            "protein": <number in grams>,
            "carbs": <number in grams>,
            "fat": <number in grams>
          }
        },
        "snacks": [
          {
            "name": "<snack name>",
            "ingredients": ["<quantity> <ingredient>", ...],
            "instructions": "<preparation instructions>",
            "nutrition": {
              "calories": <number>,
              "protein": <number in grams>,
              "carbs": <number in grams>,
              "fat": <number in grams>
            }
          }
        ]
      }
    },
    ... (repeat for all ${duration} days)
  ],
  "groceryList": {
    "produce": ["<quantity> <item>", "<quantity> <item>"],
    "protein": ["<quantity> <item>", "<quantity> <item>"],
    "dairy": ["<quantity> <item>", "<quantity> <item>"],
    "pantry": ["<quantity> <item>", "<quantity> <item>"],
    "spices": ["<quantity> <item>", ...],
    "beverages": ["<quantity> <item>", ...]
  }
}

CRITICAL REQUIREMENTS - STRICT ENFORCEMENT (PRIORITY-BASED):

⚠️ REMINDER: Priority 1 requirements (Safety & Compliance) are checked FIRST and are NON-NEGOTIABLE.
If any Priority 1 requirement conflicts with Priority 2 or 3, Priority 1 ALWAYS takes precedence.

1. PRIORITY 1 COMPLIANCE CHECK (MANDATORY - VERIFY FIRST):
   - ALLERGEN SAFETY: Every ingredient has been checked against user's allergy list (if applicable)
   - RELIGIOUS COMPLIANCE: All meals comply with religious dietary requirements (if applicable)
   - CULTURAL AUTHENTICITY: Meals are culturally appropriate and authentic (if applicable)
   - If ANY Priority 1 requirement is violated, the meal plan is INVALID

2. MEAL STRUCTURE REQUIREMENTS (EVERY meal MUST have):
   - "name": A descriptive meal name (string, REQUIRED, cannot be empty)
     * Should be culturally appropriate if user specified cultural preferences
   - "ingredients": An array of strings with quantities (REQUIRED, minimum 3 items per meal)
     * Format: "quantity unit ingredient" (e.g., "2 large eggs", "1 cup brown rice", "200g chicken breast")
     * Each ingredient MUST include both quantity and unit
     * ALL ingredients must pass Priority 1 checks (allergens, religious, cultural)
   - "instructions": Step-by-step cooking instructions (string, REQUIRED, minimum 50 characters)
     * Must be detailed enough for user to follow
     * Include cooking times and temperatures where applicable
     * Use traditional cooking methods if user specified cultural preferences
   - "nutrition": An object with (REQUIRED, all must be numbers):
     * "calories": number (REQUIRED)
     * "protein": number in grams (REQUIRED)
     * "carbs": number in grams (REQUIRED)
     * "fat": number in grams (REQUIRED)

3. Grocery list MUST:
   - Include EVERY ingredient from EVERY meal across ALL ${duration} days
   - Consolidate duplicate items (e.g., if "2 eggs" appears 3 times, list "6 eggs" total)
   - Include quantities for ALL items
   - Be organized by category: produce, protein, dairy, pantry, spices, beverages, etc.
   - Be comprehensive - nothing should be missing
   - All items must comply with Priority 1 requirements (allergens, religious, cultural)

4. JSON Structure Validation:
   - Return ONLY valid JSON, no markdown formatting, no code blocks, no explanations
   - All numbers must be actual numbers (not strings)
   - All strings must be properly quoted
   - Arrays must be properly formatted
   - Objects must have all required fields

5. Data Completeness:
   - Total daily calories across all meals (breakfast + lunch + dinner + snacks) must equal approximately ${dailyCalories} kcal (±50 kcal)
   - Each day must have breakfast, lunch, and dinner (snacks optional based on user preference)
   - All meals must be therapeutically appropriate for user's health conditions (Priority 2)
   - All meals must respect dietary restrictions, allergies, and religious requirements (Priority 1 - MANDATORY)

6. Quality Standards (Priority 3):
   - Be creative with recipes while respecting ALL restrictions (Priority 1 takes precedence)
   - Consider meal prep and leftovers to reduce waste
   - Make meals practical, delicious, and match cooking skill level
   - Ensure variety across days (unless user prefers low variety)
   - Prioritize cultural authenticity and traditional foods when specified

EXAMPLE OF CORRECT MEAL STRUCTURE (Culturally Appropriate):
${userProfile.cuisinePreference && (userProfile.cuisinePreference.toLowerCase().includes("indian") || userProfile.culturalBackground && userProfile.culturalBackground.toLowerCase().includes("indian")) ? `{
  "breakfast": {
    "name": "Masala Omelette with Whole Wheat Roti",
    "ingredients": [
      "2 large eggs",
      "1/4 cup finely chopped onions",
      "1/4 cup finely chopped tomatoes",
      "1 green chili, finely chopped",
      "1/4 teaspoon turmeric powder",
      "1/4 teaspoon red chili powder",
      "1/4 teaspoon garam masala",
      "1 tablespoon ghee",
      "2 whole wheat rotis",
      "Salt to taste",
      "Fresh cilantro for garnish"
    ],
    "instructions": "1. Beat eggs with salt, turmeric, red chili powder, and garam masala. 2. Heat ghee in a non-stick pan over medium heat. 3. Add onions and green chili, sauté for 1 minute. 4. Add tomatoes and cook for 1 minute. 5. Pour egg mixture over vegetables. 6. Cook until set, about 3-4 minutes, flipping once. 7. Warm rotis on a griddle. 8. Serve omelette with rotis, garnished with cilantro.",
    "nutrition": {
      "calories": 380,
      "protein": 20,
      "carbs": 32,
      "fat": 18
    }
  }
}` : userProfile.religious && userProfile.religious.toLowerCase() === "halal" ? `{
  "breakfast": {
    "name": "Halal Chicken and Vegetable Scramble with Whole Grain Toast",
    "ingredients": [
      "100g halal-certified chicken breast, diced",
      "2 large eggs",
      "1 cup fresh spinach",
      "1/4 cup bell peppers, diced",
      "1 tablespoon olive oil",
      "2 slices whole grain bread",
      "1/4 teaspoon salt",
      "1/8 teaspoon black pepper"
    ],
    "instructions": "1. Heat olive oil in a non-stick pan over medium heat. 2. Add halal chicken and cook until no longer pink, about 4-5 minutes. 3. Add bell peppers and cook for 2 minutes. 4. Add spinach and cook until wilted, about 1 minute. 5. Beat eggs with salt and pepper. 6. Pour eggs into pan and scramble gently until cooked through, about 3-4 minutes. 7. Toast bread slices. 8. Serve scramble with toast on the side.",
    "nutrition": {
      "calories": 420,
      "protein": 32,
      "carbs": 28,
      "fat": 20
    }
  }
}` : `{
  "breakfast": {
    "name": "Scrambled Eggs with Spinach and Whole Grain Toast",
    "ingredients": [
      "2 large eggs",
      "1 cup fresh spinach",
      "1 tablespoon olive oil",
      "2 slices whole grain bread",
      "1/4 teaspoon salt",
      "1/8 teaspoon black pepper"
    ],
    "instructions": "1. Heat olive oil in a non-stick pan over medium heat. 2. Add spinach and cook until wilted, about 2 minutes. 3. Beat eggs with salt and pepper. 4. Pour eggs into pan and scramble gently until cooked through, about 3-4 minutes. 5. Toast bread slices. 6. Serve scrambled eggs with toast on the side.",
    "nutrition": {
      "calories": 350,
      "protein": 18,
      "carbs": 28,
      "fat": 18
    }
  }
}`}

REMEMBER: If any meal is missing name, ingredients array, instructions string, or nutrition object, the response is INVALID.
`;

  return prompt;
}

/**
 * Fix common JSON errors (trailing commas, unquoted keys, etc.)
 */
function fixCommonJsonErrors(jsonString: string): string {
  let fixed = jsonString;
  
  // Remove trailing commas before closing braces/brackets
  fixed = fixed.replace(/,(\s*[}\]])/g, '$1');
  
  // Fix unquoted keys (basic attempt)
  fixed = fixed.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');
  
  // Remove comments (single and multi-line)
  fixed = fixed.replace(/\/\/.*$/gm, '');
  fixed = fixed.replace(/\/\*[\s\S]*?\*\//g, '');
  
  return fixed;
}

/**
 * Extract partial JSON structure from text (fallback)
 */
function extractPartialJson(text: string): MealPlanResponse | null {
  try {
    // Try to find and extract a valid JSON structure
    const jsonMatch = text.match(/\{[\s\S]{100,}/); // At least 100 chars
    if (!jsonMatch) return null;
    
    // Try to close the JSON structure if incomplete
    let jsonStr = jsonMatch[0];
    const openBraces = (jsonStr.match(/\{/g) || []).length;
    const closeBraces = (jsonStr.match(/\}/g) || []).length;
    
    // Add missing closing braces
    for (let i = 0; i < openBraces - closeBraces; i++) {
      jsonStr += '}';
    }
    
    const fixed = fixCommonJsonErrors(jsonStr);
    return JSON.parse(fixed);
  } catch {
    return null;
  }
}

/**
 * Build prompt for chunked monthly plan generation
 */
function buildChunkPrompt(request: MealPlanRequest, chunkStart: number, chunkEnd: number, chunkNumber: number, totalChunks: number): string {
  const basePrompt = buildPrompt({
    ...request,
    options: {
      ...request.options,
      duration: chunkEnd - chunkStart + 1, // Duration for this chunk
    },
  });
  
  // Add chunk context at the beginning of the prompt
  const chunkContext = `IMPORTANT: This is PART ${chunkNumber} of ${totalChunks} of a 30-day meal plan.
You are generating days ${chunkStart} through ${chunkEnd} of the complete 30-day meal plan.
Ensure day numbers in your response are correct: day ${chunkStart} through day ${chunkEnd}.
Maintain consistency with the overall 30-day plan structure and user preferences.
The grocery list you generate should include ingredients for days ${chunkStart}-${chunkEnd} only (it will be merged with other chunks later).

`;

  return chunkContext + basePrompt.replace(
    `Generate a personalized ${request.planType} meal plan (${chunkEnd - chunkStart + 1} days)`,
    `Generate days ${chunkStart}-${chunkEnd} of a personalized 30-day meal plan (part ${chunkNumber} of ${totalChunks})`
  );
}

/**
 * Merge multiple meal plan chunks into a single 30-day plan
 */
function mergeMealPlanChunks(
  chunks: Array<{ mealPlan: MealPlanResponse; usage: { promptTokens: number; completionTokens: number; totalTokens: number } }>
): { mealPlan: MealPlanResponse; usage: { promptTokens: number; completionTokens: number; totalTokens: number } } {
  if (chunks.length === 0) {
    throw new Error("No chunks to merge");
  }

  // Use first chunk's overview as base, but ensure duration is 30
  const mergedPlan: MealPlanResponse = {
    overview: {
      ...chunks[0].mealPlan.overview,
      duration: 30,
      type: "monthly",
    },
    days: [],
    groceryList: {},
  };

  // Merge all days from all chunks
  chunks.forEach((chunk) => {
    if (chunk.mealPlan.days && Array.isArray(chunk.mealPlan.days)) {
      mergedPlan.days.push(...chunk.mealPlan.days);
    }
  });

  // Sort days by day number to ensure correct order
  mergedPlan.days.sort((a, b) => (a.day || 0) - (b.day || 0));

  // Aggregate token usage
  const aggregatedUsage = chunks.reduce(
    (acc, chunk) => ({
      promptTokens: acc.promptTokens + chunk.usage.promptTokens,
      completionTokens: acc.completionTokens + chunk.usage.completionTokens,
      totalTokens: acc.totalTokens + chunk.usage.totalTokens,
    }),
    { promptTokens: 0, completionTokens: 0, totalTokens: 0 }
  );

  // Re-aggregate grocery list from all merged days using existing logic
  // This will be done in the main generateMealPlan function after merging
  // For now, combine grocery lists from chunks (they'll be re-processed)
  const combinedGroceryList: Record<string, string[]> = {};
  chunks.forEach((chunk) => {
    if (chunk.mealPlan.groceryList) {
      Object.keys(chunk.mealPlan.groceryList).forEach((category) => {
        if (!combinedGroceryList[category]) {
          combinedGroceryList[category] = [];
        }
        const items = chunk.mealPlan.groceryList[category];
        if (Array.isArray(items)) {
          combinedGroceryList[category].push(...items);
        }
      });
    }
  });
  mergedPlan.groceryList = combinedGroceryList;

  return {
    mealPlan: mergedPlan,
    usage: aggregatedUsage,
  };
}

/**
 * Generate monthly meal plan in chunks to avoid OpenAI SDK 5-minute timeout
 */
async function generateMonthlyPlanInChunks(
  request: MealPlanRequest
): Promise<{ mealPlan: MealPlanResponse; usage: { promptTokens: number; completionTokens: number; totalTokens: number } }> {
  log("Generating monthly plan in 3 chunks (days 1-10, 11-20, 21-30) to avoid timeout", "openai");
  
  // Total timeout budget: 10 minutes (600000ms) for all chunks + merge + validation
  const totalTimeoutMs = 600000;
  const startTime = Date.now();
  
  const chunks = [
    { start: 1, end: 10, number: 1 },
    { start: 11, end: 20, number: 2 },
    { start: 21, end: 30, number: 3 },
  ];

  const chunkResults: Array<{ mealPlan: MealPlanResponse; usage: { promptTokens: number; completionTokens: number; totalTokens: number } }> = [];
  const errors: Array<{ chunk: number; error: string }> = [];

  // Generate each chunk sequentially to avoid rate limits
  for (const chunk of chunks) {
    try {
      // Calculate remaining time budget before starting this chunk
      const elapsed = Date.now() - startTime;
      const remaining = totalTimeoutMs - elapsed;
      
      // Calculate dynamic chunk timeout: max 2.5min (150000ms), but leave 30s buffer for merge/validation
      const chunkTimeout = Math.min(150000, remaining - 30000);
      
      // Check if we have sufficient time to complete this chunk
      if (chunkTimeout < 60000) {
        const errorMsg = `Insufficient time remaining for chunk ${chunk.number} (days ${chunk.start}-${chunk.end}): ${remaining}ms remaining, need at least 60000ms`;
        log(errorMsg, "openai");
        throw new Error(errorMsg);
      }
      
      log(`Generating chunk ${chunk.number}/3: days ${chunk.start}-${chunk.end} (timeout: ${chunkTimeout}ms, remaining budget: ${remaining}ms)`, "openai");
      
      // Create chunk-specific request
      const chunkRequest: MealPlanRequest = {
        ...request,
        options: {
          ...request.options,
          duration: chunk.end - chunk.start + 1,
          _chunkStart: chunk.start,
          _chunkEnd: chunk.end,
          _chunkNumber: chunk.number,
          _totalChunks: 3,
        } as typeof request.options & { 
          _chunkStart?: number; 
          _chunkEnd?: number; 
          _chunkNumber?: number; 
          _totalChunks?: number;
        },
      };

      // Build chunk-specific prompt
      const chunkPrompt = buildChunkPrompt(request, chunk.start, chunk.end, chunk.number, 3);
      
      // Generate this chunk using the core generation logic with dynamic timeout
      const chunkResult = await generateMealPlanChunk(chunkRequest, chunkPrompt, chunk.start, chunk.end, chunkTimeout);
      chunkResults.push(chunkResult);
      
      const chunkElapsed = Date.now() - startTime;
      log(`Chunk ${chunk.number}/3 completed: ${chunkResult.mealPlan.days.length} days generated in ${chunkElapsed - elapsed}ms (total elapsed: ${chunkElapsed}ms)`, "openai");
    } catch (error: any) {
      const errorMsg = `Failed to generate chunk ${chunk.number} (days ${chunk.start}-${chunk.end}): ${error.message}`;
      log(errorMsg, "openai");
      errors.push({ chunk: chunk.number, error: errorMsg });
      
      // Continue with other chunks even if one fails
      // We'll handle partial success in merge
    }
  }

  // If all chunks failed, throw error with detailed information
  if (chunkResults.length === 0) {
    const errorDetails = errors.map(e => `Chunk ${e.chunk}: ${e.error}`).join('; ');
    throw new Error(`Monthly plan generation failed: All 3 chunks failed. ${errorDetails}. Please try again or contact support if the issue persists.`);
  }

  // If some chunks failed, log warning but continue with partial success
  if (errors.length > 0) {
    const failedChunks = errors.map(e => e.chunk).join(', ');
    log(`WARNING: ${errors.length} chunk(s) failed (chunks: ${failedChunks}). Proceeding with ${chunkResults.length} successful chunk(s).`, "openai");
    // Note: We'll return partial plan, but user should be aware
  }

  // Merge chunks
  const merged = mergeMealPlanChunks(chunkResults);
  
  // Validate merged result has expected number of days
  if (merged.mealPlan.days.length < 30 && errors.length === 0) {
    log(`WARNING: Merged plan has ${merged.mealPlan.days.length} days instead of 30`, "openai");
  }
  
  log(`Monthly plan generation complete: ${merged.mealPlan.days.length} days merged from ${chunkResults.length} chunks${errors.length > 0 ? ` (${errors.length} chunk(s) failed)` : ''}`, "openai");
  
  return merged;
}

/**
 * Generate a single chunk of a meal plan (internal helper)
 */
async function generateMealPlanChunk(
  request: MealPlanRequest,
  prompt: string,
  chunkStart: number,
  chunkEnd: number,
  timeoutMs: number = 150000 // Default 2.5 minutes per chunk (reduced from 3 minutes)
): Promise<{ mealPlan: MealPlanResponse; usage: { promptTokens: number; completionTokens: number; totalTokens: number } }> {
  const startTime = Date.now();
  const duration = chunkEnd - chunkStart + 1;
  
  // Use provided timeout (default 2.5 minutes, well within 5-minute SDK limit)
  const openai = getOpenAIClient(timeoutMs);

  let timeoutId: NodeJS.Timeout | null = null;
  const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        const elapsedTime = Date.now() - startTime;
        log(`Chunk timeout after ${timeoutMs}ms (days ${chunkStart}-${chunkEnd}, elapsed: ${elapsedTime}ms)`, "openai");
        reject(new Error(`Request timeout after ${timeoutMs}ms for chunk (days ${chunkStart}-${chunkEnd}).`));
      }, timeoutMs);
  });

  const apiCallPromise = openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "You are a Board-Certified Clinical Nutritionist (CNS) and Registered Dietitian (RD) with 15+ years of experience. You create evidence-based, therapeutic meal plans following USDA Dietary Guidelines, Academy of Nutrition and Dietetics standards, and current peer-reviewed research. You generate detailed, personalized meal plans in JSON format. Always return valid JSON only, no markdown or code blocks. Your recommendations prioritize safety, therapeutic appropriateness, and evidence-based nutrition science.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.7,
    max_tokens: 6000, // Reduced for 10-day chunks (well within limit)
    response_format: { type: "json_object" },
  });

  try {
    const completion = await Promise.race([apiCallPromise, timeoutPromise]);
    
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    const apiCallTime = Date.now() - startTime;
    networkMonitor.recordSuccess(apiCallTime);

    const usage = {
      promptTokens: completion.usage?.prompt_tokens || 0,
      completionTokens: completion.usage?.completion_tokens || 0,
      totalTokens: completion.usage?.total_tokens || 0,
    };

    log(`Chunk token usage - Prompt: ${usage.promptTokens}, Completion: ${usage.completionTokens}, Total: ${usage.totalTokens}`, "openai");
    log(`Chunk performance - API call time: ${apiCallTime}ms, Days: ${chunkStart}-${chunkEnd}`, "openai");

    const responseContent = completion.choices[0]?.message?.content;
    const finishReason = completion.choices[0]?.finish_reason;

    if (!responseContent) {
      throw new Error("No response content from OpenAI");
    }

    // Parse JSON response
    let mealPlan: MealPlanResponse;
    const parseStartTime = Date.now();

    try {
      mealPlan = JSON.parse(responseContent);
      log(`Chunk JSON parsed successfully in ${Date.now() - parseStartTime}ms`, "openai");
    } catch (parseError: any) {
      log(`Chunk JSON parse failed: ${parseError.message}`, "openai");
      
      // Try extracting from markdown
      const jsonMatch = responseContent.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (jsonMatch) {
        try {
          mealPlan = JSON.parse(jsonMatch[1]);
          log("Chunk JSON extracted from markdown", "openai");
        } catch (extractError: any) {
          const fixedJson = fixCommonJsonErrors(jsonMatch[1]);
          mealPlan = JSON.parse(fixedJson);
          log("Chunk JSON fixed and parsed", "openai");
        }
      } else {
        const jsonObjectMatch = responseContent.match(/\{[\s\S]*\}/);
        if (jsonObjectMatch) {
          const fixedJson = fixCommonJsonErrors(jsonObjectMatch[0]);
          mealPlan = JSON.parse(fixedJson);
          log("Chunk JSON object found and parsed", "openai");
        } else {
          throw new Error(`Failed to parse chunk JSON response: ${parseError.message}`);
        }
      }
    }

    // Validate and repair chunk structure
    if (!mealPlan.overview) {
      mealPlan.overview = {
        dailyCalories: request.options?.calories || calculateDailyCalories(request.userProfile),
        macros: { protein: 150, carbs: 200, fat: 67 },
        duration: duration,
        type: "monthly",
      };
    }
    if (!mealPlan.days) {
      mealPlan.days = [];
    }
    if (!Array.isArray(mealPlan.days)) {
      mealPlan.days = [];
    }
    if (!mealPlan.groceryList) {
      mealPlan.groceryList = {};
    }

    // Ensure day numbers are correct for this chunk
    mealPlan.days.forEach((day, index) => {
      const expectedDay = chunkStart + index;
      if (day.day !== expectedDay) {
        log(`WARNING: Chunk day number mismatch. Expected day ${expectedDay}, got day ${day.day}. Fixing.`, "openai");
        day.day = expectedDay;
      }
    });

    // Ensure we have the right number of days
    if (mealPlan.days.length !== duration) {
      log(`WARNING: Chunk expected ${duration} days, got ${mealPlan.days.length}. Adjusting.`, "openai");
      if (mealPlan.days.length > duration) {
        mealPlan.days = mealPlan.days.slice(0, duration);
      } else {
        // If we got fewer days, that's okay - use what we have
        log(`Chunk has ${mealPlan.days.length} days instead of ${duration}`, "openai");
      }
    }

    return { mealPlan, usage };
  } catch (error: any) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    networkMonitor.recordFailure();
    throw error;
  }
}

/**
 * Generate meal plan using OpenAI GPT-4o-mini
 */
export async function generateMealPlan(
  request: MealPlanRequest
): Promise<{ mealPlan: MealPlanResponse; usage: { promptTokens: number; completionTokens: number; totalTokens: number } }> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const duration = request.options?.duration || (request.planType === "monthly" ? 30 : request.planType === "weekly" ? 7 : 1);

  // For monthly plans (30 days), use chunking strategy to avoid OpenAI SDK 5-minute timeout
  let mealPlan: MealPlanResponse | null = null;
  let usage: { promptTokens: number; completionTokens: number; totalTokens: number } | null = null;
  let parseStartTime = Date.now();
  let isChunked = false;
  let startTime: number | undefined = undefined; // Track start time for error handling

  if (duration === 30 && request.planType === "monthly") {
    log("Routing monthly plan to chunking strategy", "openai");
    const chunkedResult = await generateMonthlyPlanInChunks(request);
    mealPlan = chunkedResult.mealPlan;
    usage = chunkedResult.usage;
    parseStartTime = Date.now();
    isChunked = true;
    log("Chunked generation complete, proceeding to validation and aggregation", "openai");
  }

  // If not chunked, generate normally
  if (!isChunked) {
    let prompt: string;
    try {
      prompt = buildPrompt(request);
    
      // Validate prompt before sending
      const promptValidation = validatePrompt(prompt);
      if (!promptValidation.valid) {
        log(`Prompt validation failed: ${promptValidation.errors.join(', ')}`, "openai");
        throw new Error(`Invalid prompt: ${promptValidation.errors.join(', ')}`);
      }
      
      // Check prompt length and log statistics
      const promptStats = getPromptStats(prompt);
      log(`Prompt stats: ${promptStats.length} chars, ~${promptStats.estimatedTokens} tokens, ${promptStats.lineCount} lines`, "openai");
      
      // Warn if prompt is very long
      if (isPromptTooLong("", prompt, 100000)) {
        log(`WARNING: Prompt is very long (${promptStats.estimatedTokens} estimated tokens)`, "openai");
      }
    } catch (error: any) {
      log(`Error building prompt: ${error.message}`, "openai");
      throw error;
    }

    log("Generating meal plan with OpenAI", "openai");
    log(`Plan type: ${request.planType}, Duration: ${duration} days`, "openai");

    // Track performance metrics
    const startTime = Date.now();
    const promptBuildTime = startTime - (startTime - (Date.now() - startTime));

    // Calculate timeout based on plan duration (longer plans need more time)
    // With increased token limits, generation takes longer
    // Monthly plans need more time due to 30 days of content generation
    // #region agent log - Hypothesis A,B: Duration check and timeout calculation
    fetch('http://127.0.0.1:7242/ingest/29ee16f2-f385-440f-b653-567260a65333',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'openai.ts:899',message:'Timeout calculation start',data:{planType:request.planType,duration,durationCheck30:duration===30,durationCheck7:duration===7,optionsDuration:request.options?.duration},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A,B'})}).catch(()=>{});
    // #endregion
    const timeoutMs = duration === 30 ? 600000 : duration === 7 ? 180000 : 120000; // 10min monthly (chunked), 3min weekly, 2min daily
    // #region agent log - Hypothesis A,B: Calculated timeout value
    fetch('http://127.0.0.1:7242/ingest/29ee16f2-f385-440f-b653-567260a65333',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'openai.ts:900',message:'Timeout calculated',data:{timeoutMs,timeoutSeconds:timeoutMs/1000,isMonthly:duration===30,isWeekly:duration===7,isDaily:duration===1},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A,B'})}).catch(()=>{});
    // #endregion
    
    log(`Using timeout of ${timeoutMs / 1000}s for ${request.planType} plan (${duration} days)`, "openai");
    log(`OpenAI client timeout: ${timeoutMs > 300000 ? timeoutMs : 300000}ms`, "openai");

    // Get OpenAI client with appropriate timeout (will throw if API key is missing)
    // #region agent log - Hypothesis B: Client creation with timeout
    fetch('http://127.0.0.1:7242/ingest/29ee16f2-f385-440f-b653-567260a65333',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'openai.ts:905',message:'Calling getOpenAIClient',data:{timeoutMs,timeoutGreaterThan300k:timeoutMs>300000},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    const openai = getOpenAIClient(timeoutMs);

    try {
    // Create a timeout promise (Note: OpenAI SDK has a hard 5-minute timeout limit)
    // Even though we set client timeout to 10 minutes, the SDK may still timeout at 5 minutes
    let timeoutId: NodeJS.Timeout | null = null;
    // #region agent log - Hypothesis C,E: Custom timeout promise creation
    fetch('http://127.0.0.1:7242/ingest/29ee16f2-f385-440f-b653-567260a65333',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'openai.ts:909',message:'Creating custom timeout promise',data:{timeoutMs,timeoutSeconds:timeoutMs/1000,startTime,note:'SDK may timeout at 5min despite client timeout'},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C,E'})}).catch(()=>{});
    // #endregion
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        const elapsedTime = Date.now() - startTime;
        // #region agent log - Hypothesis C,E: Custom timeout fired
        fetch('http://127.0.0.1:7242/ingest/29ee16f2-f385-440f-b653-567260a65333',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'openai.ts:911',message:'Custom timeout fired',data:{timeoutMs,elapsedTime,expectedTimeout:timeoutMs,planType:request.planType},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C,E'})}).catch(()=>{});
        // #endregion
        log(`Request timeout after ${timeoutMs}ms for ${request.planType} plan`, "openai");
        reject(new Error(`Request timeout after ${timeoutMs}ms. The meal plan generation is taking longer than expected. Please try again.`));
      }, timeoutMs);
    });

    // Race between API call and timeout
    // Note: OpenAI SDK may timeout at 5 minutes despite client timeout setting
    // #region agent log - Hypothesis C,D: Starting API call race
    fetch('http://127.0.0.1:7242/ingest/29ee16f2-f385-440f-b653-567260a65333',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'openai.ts:917',message:'Starting Promise.race for API call',data:{timeoutMs,startTime,planType:request.planType,duration,clientTimeout:openai.timeout,note:'SDK may have 5min hard limit'},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C,D'})}).catch(()=>{});
    // #endregion
    
    // Create API call promise with error tracking
    // Note: OpenAI SDK doesn't support AbortController signal parameter
    const apiCallPromise = openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a Board-Certified Clinical Nutritionist (CNS) and Registered Dietitian (RD) with 15+ years of experience. You create evidence-based, therapeutic meal plans following USDA Dietary Guidelines, Academy of Nutrition and Dietetics standards, and current peer-reviewed research. You generate detailed, personalized meal plans in JSON format. Always return valid JSON only, no markdown or code blocks. Your recommendations prioritize safety, therapeutic appropriateness, and evidence-based nutrition science.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: duration === 30 ? 16384 : duration === 7 ? 10000 : 4000, // Model limit: 16K monthly (gpt-4o-mini max), 10K weekly, 4K daily
      response_format: { type: "json_object" },
    });
    
    // Wrap apiCallPromise to track when it rejects
    const trackedApiCallPromise = apiCallPromise.catch((apiError: any) => {
      const elapsedTime = Date.now() - startTime;
      // #region agent log - Hypothesis C,D: OpenAI API call error caught before Promise.race
      fetch('http://127.0.0.1:7242/ingest/29ee16f2-f385-440f-b653-567260a65333',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'openai.ts:apiCall-catch',message:'OpenAI API call error caught before Promise.race',data:{errorMessage:apiError?.message,errorCode:apiError?.code,errorStatus:apiError?.status,elapsedTime,timeoutMs,isTimeout:apiError?.message?.includes('timeout')||apiError?.message?.includes('Timeout')||apiError?.name==='AbortError',isAbortError:apiError?.name==='AbortError',has300000:apiError?.message?.includes('300000'),has420000:apiError?.message?.includes('420000')},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C,D'})}).catch(()=>{});
      // #endregion
      // Re-throw to let Promise.race handle it
      throw apiError;
    });
    
    // #region agent log - Hypothesis C,D: About to start Promise.race
    fetch('http://127.0.0.1:7242/ingest/29ee16f2-f385-440f-b653-567260a65333',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'openai.ts:before-race',message:'About to start Promise.race',data:{timeoutMs,startTime,planType:request.planType},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C,D'})}).catch(()=>{});
    // #endregion
    
    let raceResolved = false;
    let raceWinner: 'api' | 'timeout' | 'unknown' = 'unknown';
    let raceElapsedTime = 0;
    
    const completion = await Promise.race([
      trackedApiCallPromise.then((result) => {
        raceResolved = true;
        raceWinner = 'api';
        raceElapsedTime = Date.now() - startTime;
        // #region agent log - Hypothesis C,D: Promise.race resolved with API result
        fetch('http://127.0.0.1:7242/ingest/29ee16f2-f385-440f-b653-567260a65333',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'openai.ts:race-api-win',message:'Promise.race resolved with API result',data:{raceElapsedTime,timeoutMs,planType:request.planType},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C,D'})}).catch(()=>{});
        // #endregion
        return result;
      }).catch((error) => {
        raceResolved = true;
        raceWinner = 'api';
        raceElapsedTime = Date.now() - startTime;
        // #region agent log - Hypothesis C,D: Promise.race rejected with API error
        fetch('http://127.0.0.1:7242/ingest/29ee16f2-f385-440f-b653-567260a65333',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'openai.ts:race-api-error',message:'Promise.race rejected with API error',data:{raceElapsedTime,timeoutMs,errorMessage:error?.message,planType:request.planType},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C,D'})}).catch(()=>{});
        // #endregion
        throw error;
      }),
      timeoutPromise.catch((error) => {
        raceResolved = true;
        raceWinner = 'timeout';
        raceElapsedTime = Date.now() - startTime;
        // #region agent log - Hypothesis C,D: Promise.race rejected with timeout
        fetch('http://127.0.0.1:7242/ingest/29ee16f2-f385-440f-b653-567260a65333',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'openai.ts:race-timeout',message:'Promise.race rejected with timeout',data:{raceElapsedTime,timeoutMs,planType:request.planType},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C,D'})}).catch(()=>{});
        // #endregion
        throw error;
      }),
    ]);
    
    // Clear timeout if API call completed successfully
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    const apiCallTime = Date.now() - startTime;
    // #region agent log - Hypothesis C,D: API call completed successfully
    fetch('http://127.0.0.1:7242/ingest/29ee16f2-f385-440f-b653-567260a65333',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'openai.ts:937',message:'API call completed successfully',data:{apiCallTime,timeoutMs,wasWithinTimeout:apiCallTime<timeoutMs,planType:request.planType},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C,D'})}).catch(()=>{});
    // #endregion
    
    // Record successful API call in network monitor
    networkMonitor.recordSuccess(apiCallTime);
    
    // Set usage for non-chunked path
    usage = {
      promptTokens: completion.usage?.prompt_tokens || 0,
      completionTokens: completion.usage?.completion_tokens || 0,
      totalTokens: completion.usage?.total_tokens || 0,
    };

    // Log token usage and performance metrics
    log(`Token usage - Prompt: ${usage.promptTokens}, Completion: ${usage.completionTokens}, Total: ${usage.totalTokens}`, "openai");
    log(`Performance - API call time: ${apiCallTime}ms, Plan type: ${request.planType}`, "openai");
    
    // Calculate estimated cost (GPT-4o-mini pricing as of 2024)
    const inputCost = (usage.promptTokens / 1000000) * 0.15; // $0.15 per 1M input tokens
    const outputCost = (usage.completionTokens / 1000000) * 0.60; // $0.60 per 1M output tokens
    const totalCost = inputCost + outputCost;
    log(`Estimated cost: $${totalCost.toFixed(4)}`, "openai");

    const responseContent = completion.choices[0]?.message?.content;
    const finishReason = completion.choices[0]?.finish_reason;
    
    // #region agent log - Hypothesis A,B,D: Check raw response and finish reason
    fetch('http://127.0.0.1:7242/ingest/29ee16f2-f385-440f-b653-567260a65333',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'openai.ts:929',message:'OpenAI response received',data:{finishReason,hasContent:!!responseContent,contentLength:responseContent?.length||0,contentPreview:responseContent?.substring(0,500),contentEnd:responseContent?.substring(responseContent.length-200),completionTokens:completion.usage?.completion_tokens,promptTokens:completion.usage?.prompt_tokens,maxTokens:duration===30?16000:duration===7?10000:4000},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A,B,D',runId:'post-fix'})}).catch(()=>{});
    // #endregion
    
    if (!responseContent) {
      throw new Error("No response content from OpenAI");
    }

    // Parse JSON response with multiple fallback strategies
    mealPlan = {} as MealPlanResponse; // Will be assigned in parsing
    parseStartTime = Date.now();
    
    // Strategy 1: Direct JSON parse
    try {
      mealPlan = JSON.parse(responseContent);
      // #region agent log - Hypothesis C: Parse success
      fetch('http://127.0.0.1:7242/ingest/29ee16f2-f385-440f-b653-567260a65333',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'openai.ts:945',message:'JSON parsed successfully',data:{parseTime:Date.now()-parseStartTime,hasOverview:!!mealPlan?.overview,hasDays:!!mealPlan?.days,daysCount:mealPlan?.days?.length,hasGroceryList:!!mealPlan?.groceryList},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      log(`JSON parsed successfully in ${Date.now() - parseStartTime}ms`, "openai");
    } catch (parseError: any) {
      // #region agent log - Hypothesis A,E: Parse failure details
      fetch('http://127.0.0.1:7242/ingest/29ee16f2-f385-440f-b653-567260a65333',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'openai.ts:parse-fail',message:'JSON parse failed',data:{errorMessage:parseError.message,firstChar:responseContent?.charAt(0),last20Chars:responseContent?.substring(responseContent.length-20),startsWithBrace:responseContent?.startsWith('{'),endsWithBrace:responseContent?.endsWith('}')},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A,E'})}).catch(()=>{});
      // #endregion
      log(`Initial JSON parse failed: ${parseError.message}`, "openai");
      
      // Strategy 2: Extract JSON from markdown code blocks
      const jsonMatch = responseContent.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (jsonMatch) {
        try {
          mealPlan = JSON.parse(jsonMatch[1]);
          log("Successfully extracted and parsed JSON from markdown code block", "openai");
        } catch (extractError: any) {
          log(`Failed to parse extracted JSON: ${extractError.message}`, "openai");
          
          // Strategy 3: Try to fix common JSON errors
          try {
            const fixedJson = fixCommonJsonErrors(jsonMatch[1]);
            mealPlan = JSON.parse(fixedJson);
            log("Successfully parsed JSON after fixing common errors", "openai");
          } catch (fixError: any) {
            log(`Failed to fix and parse JSON: ${fixError.message}`, "openai");
            
            // Strategy 4: Try to extract partial JSON
            const partialJson = extractPartialJson(responseContent);
            if (partialJson) {
              mealPlan = partialJson;
              log("Using partial JSON extraction as fallback", "openai");
            } else {
              // #region agent log - Hypothesis A,D: All strategies including partial failed
              fetch('http://127.0.0.1:7242/ingest/29ee16f2-f385-440f-b653-567260a65333',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'openai.ts:partial-fail',message:'All strategies including partial extraction failed',data:{strategy:'partialExtraction',originalError:parseError.message,extractError:extractError?.message,fixError:fixError?.message},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A,D'})}).catch(()=>{});
              // #endregion
              throw new Error(`Failed to parse JSON response after all strategies: ${parseError.message}`);
            }
          }
        }
      } else {
        // Strategy 3: Try to find JSON object in text
        const jsonObjectMatch = responseContent.match(/\{[\s\S]*\}/);
        if (jsonObjectMatch) {
          try {
            const fixedJson = fixCommonJsonErrors(jsonObjectMatch[0]);
            mealPlan = JSON.parse(fixedJson);
            log("Successfully parsed JSON object found in text", "openai");
          } catch (fixError: any) {
            log(`Failed to parse JSON object: ${fixError.message}`, "openai");
            // #region agent log - Hypothesis A,E: All strategies failed
            fetch('http://127.0.0.1:7242/ingest/29ee16f2-f385-440f-b653-567260a65333',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'openai.ts:all-fail',message:'All parse strategies failed',data:{strategy:'fixJsonObject',fixError:fixError.message,originalError:parseError.message},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A,E'})}).catch(()=>{});
            // #endregion
            throw new Error(`Failed to parse JSON response: ${parseError.message}`);
          }
        } else {
          log("No JSON found in response", "openai");
          // #region agent log - Hypothesis A: No JSON in response
          fetch('http://127.0.0.1:7242/ingest/29ee16f2-f385-440f-b653-567260a65333',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'openai.ts:no-json',message:'No JSON found in response at all',data:{contentPreview:responseContent?.substring(0,300)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'})}).catch(()=>{});
          // #endregion
          throw new Error(`Failed to parse JSON response: ${parseError.message}`);
        }
      }
    }

    // Set usage for non-chunked path
    usage = {
      promptTokens: completion.usage?.prompt_tokens || 0,
      completionTokens: completion.usage?.completion_tokens || 0,
      totalTokens: completion.usage?.total_tokens || 0,
    };
    } catch (apiError: any) {
      // Handle API call errors for non-chunked path
      networkMonitor.recordFailure();
      log(`OpenAI API error (non-chunked): ${apiError.message}`, "openai");
      throw apiError;
    }
  }

  // Both chunked and non-chunked paths continue here for validation and aggregation
  if (!mealPlan || !usage) {
    throw new Error("Failed to generate meal plan: no result obtained");
  }

  try {
    // Validate and repair response structure (don't throw, repair instead)
    log("Validating meal plan structure...", "openai");
    if (!mealPlan.overview) {
      log("WARNING: mealPlan.overview is missing, creating default", "openai");
      mealPlan.overview = {
        dailyCalories: request.options?.calories || calculateDailyCalories(request.userProfile),
        macros: { protein: 150, carbs: 200, fat: 67 },
        duration: request.options?.duration || (request.planType === "monthly" ? 30 : request.planType === "weekly" ? 7 : 1),
        type: request.planType
      };
    }
    if (!mealPlan.days) {
      log("WARNING: mealPlan.days is missing, creating empty array", "openai");
      mealPlan.days = [];
    }
    if (!Array.isArray(mealPlan.days)) {
      log(`WARNING: mealPlan.days is not an array (type: ${typeof mealPlan.days}), converting`, "openai");
      mealPlan.days = [];
    }
    if (!mealPlan.groceryList) {
      log("WARNING: mealPlan.groceryList is missing, creating empty object", "openai");
      mealPlan.groceryList = {};
    }

    // Validate overview structure
    if (!mealPlan.overview.duration) {
      log("WARNING: mealPlan.overview.duration is missing, using requested duration", "openai");
      mealPlan.overview.duration = duration;
    }

    // Ensure duration matches
    if (mealPlan.days.length !== duration) {
      log(`Warning: Expected ${duration} days, got ${mealPlan.days.length}. Adjusting...`, "openai");
      // If we got fewer days, that's okay - use what we have
      // If we got more days, trim to requested duration
      if (mealPlan.days.length > duration) {
        mealPlan.days = mealPlan.days.slice(0, duration);
        log(`Trimmed meal plan to ${duration} days`, "openai");
      }
    }

    // Helper function to create a default meal
    const createDefaultMeal = (mealType: string): Meal => ({
      name: `${mealType.charAt(0).toUpperCase() + mealType.slice(1)} Meal`,
      ingredients: ["1 portion protein", "1 portion vegetables", "1 portion grains"],
      instructions: `Prepare a balanced ${mealType} meal following standard cooking practices.`,
      nutrition: { 
        calories: Math.round(mealPlan.overview.dailyCalories / 3), 
        protein: 20, 
        carbs: 30, 
        fat: 10 
      }
    });

    // Validate and repair each day structure (repair instead of throw)
    for (let i = 0; i < mealPlan.days.length; i++) {
      let day = mealPlan.days[i];
      if (!day || typeof day !== "object") {
        log(`WARNING: Day ${i + 1} is invalid, creating default structure`, "openai");
        day = { 
          day: i + 1, 
          meals: {
            breakfast: createDefaultMeal("breakfast"),
            lunch: createDefaultMeal("lunch"),
            dinner: createDefaultMeal("dinner")
          }
        };
        mealPlan.days[i] = day;
      }
      if (!day.meals || typeof day.meals !== "object") {
        log(`WARNING: Day ${i + 1} missing meals object, creating default`, "openai");
        day.meals = {
          breakfast: createDefaultMeal("breakfast"),
          lunch: createDefaultMeal("lunch"),
          dinner: createDefaultMeal("dinner")
        };
      }
      
      // Validate required meals exist - create if missing
      const requiredMeals: Array<'breakfast' | 'lunch' | 'dinner'> = ['breakfast', 'lunch', 'dinner'];
      for (const mealType of requiredMeals) {
        type MealKey = 'breakfast' | 'lunch' | 'dinner';
        const mealKey = mealType as MealKey;
        if (!day.meals[mealKey]) {
          log(`WARNING: Day ${i + 1} missing ${mealType}, creating placeholder`, "openai");
          day.meals[mealKey] = {
            name: `${mealType.charAt(0).toUpperCase() + mealType.slice(1)} Meal`,
            ingredients: ["1 portion protein", "1 portion vegetables", "1 portion grains"],
            instructions: `Prepare a balanced ${mealType} meal following standard cooking practices.`,
            nutrition: { calories: Math.round(mealPlan.overview.dailyCalories / 3), protein: 20, carbs: 30, fat: 10 }
          };
        }
        
        // Validate and repair meal structure
        const meal = day.meals[mealKey];
        
        // Repair name if missing
        if (!meal.name || typeof meal.name !== "string" || meal.name.trim().length === 0) {
          log(`WARNING: Day ${i + 1} ${mealType} missing name, generating from ingredients`, "openai");
          meal.name = meal.ingredients && Array.isArray(meal.ingredients) && meal.ingredients.length > 0
            ? `${meal.ingredients[0]} ${mealType}`
            : `${mealType.charAt(0).toUpperCase() + mealType.slice(1)} Meal`;
        }
        
        // Repair ingredients if missing
        if (!meal.ingredients || !Array.isArray(meal.ingredients)) {
          log(`WARNING: Day ${i + 1} ${mealType} ingredients invalid, creating default`, "openai");
          meal.ingredients = ["1 portion protein", "1 portion vegetables", "1 portion grains"];
        }
        // Filter out invalid ingredients
        meal.ingredients = meal.ingredients.filter((ing: any) => typeof ing === "string" && ing.trim().length > 0);
        if (meal.ingredients.length < 3) {
          log(`WARNING: Day ${i + 1} ${mealType} has fewer than 3 ingredients, adding defaults`, "openai");
          while (meal.ingredients.length < 3) {
            meal.ingredients.push(`1 portion ingredient ${meal.ingredients.length + 1}`);
          }
        }
        
        // Repair instructions if missing or too short
        if (!meal.instructions || typeof meal.instructions !== "string" || meal.instructions.trim().length < 50) {
          log(`WARNING: Day ${i + 1} ${mealType} instructions missing or too short, generating basic steps`, "openai");
          meal.instructions = `1. Gather ingredients: ${meal.ingredients.slice(0, 3).join(", ")}
2. Prepare ingredients according to standard cooking practices
3. Cook following traditional methods for ${meal.name}
4. Season to taste and serve hot
5. Enjoy your meal!`;
        }
        
        // Repair nutrition object if missing
        if (!meal.nutrition || typeof meal.nutrition !== "object") {
          log(`WARNING: Day ${i + 1} ${mealType} nutrition missing, estimating from ingredients`, "openai");
          meal.nutrition = {
            calories: Math.round(mealPlan.overview.dailyCalories / 3),
            protein: 20,
            carbs: 30,
            fat: 10
          };
        }
        
        // Repair nutrition values - convert to numbers if needed
        type NutritionKey = 'calories' | 'protein' | 'carbs' | 'fat';
        const nutritionFields: NutritionKey[] = ['calories', 'protein', 'carbs', 'fat'];
        for (const field of nutritionFields) {
          const nutritionKey = field as NutritionKey;
          if (meal.nutrition[nutritionKey] === undefined || meal.nutrition[nutritionKey] === null) {
            log(`WARNING: Day ${i + 1} ${mealType} nutrition.${nutritionKey} missing, using default`, "openai");
            meal.nutrition[nutritionKey] = nutritionKey === 'calories' ? Math.round(mealPlan.overview.dailyCalories / 3) : 20;
          } else if (typeof meal.nutrition[nutritionKey] !== "number") {
            log(`WARNING: Day ${i + 1} ${mealType} nutrition.${nutritionKey} is not a number, converting`, "openai");
            const numValue = parseFloat(String(meal.nutrition[nutritionKey]));
            meal.nutrition[nutritionKey] = isNaN(numValue) ? (nutritionKey === 'calories' ? Math.round(mealPlan.overview.dailyCalories / 3) : 20) : numValue;
          }
        }
      }
    }

    // ============================================================================
    // GROCERY LIST QUANTITY AGGREGATION UTILITIES
    // ============================================================================

    // Unit conversion constants
    const UNIT_CONVERSIONS: Record<string, { toBase: number; baseUnit: 'ml' | 'g' | 'count' }> = {
      // Liquids (to ml)
      'cup': { toBase: 240, baseUnit: 'ml' },
      'cups': { toBase: 240, baseUnit: 'ml' },
      'tbsp': { toBase: 15, baseUnit: 'ml' },
      'tablespoon': { toBase: 15, baseUnit: 'ml' },
      'tablespoons': { toBase: 15, baseUnit: 'ml' },
      'tsp': { toBase: 5, baseUnit: 'ml' },
      'teaspoon': { toBase: 5, baseUnit: 'ml' },
      'teaspoons': { toBase: 5, baseUnit: 'ml' },
      'ml': { toBase: 1, baseUnit: 'ml' },
      'l': { toBase: 1000, baseUnit: 'ml' },
      'liter': { toBase: 1000, baseUnit: 'ml' },
      'litre': { toBase: 1000, baseUnit: 'ml' },
      'oz': { toBase: 30, baseUnit: 'ml' },
      'ounce': { toBase: 30, baseUnit: 'ml' },
      
      // Solids (to g)
      'g': { toBase: 1, baseUnit: 'g' },
      'gram': { toBase: 1, baseUnit: 'g' },
      'grams': { toBase: 1, baseUnit: 'g' },
      'kg': { toBase: 1000, baseUnit: 'g' },
      'kilogram': { toBase: 1000, baseUnit: 'g' },
      'lb': { toBase: 454, baseUnit: 'g' },
      'pound': { toBase: 454, baseUnit: 'g' },
      'lbs': { toBase: 454, baseUnit: 'g' },
      
      // Count items
      'piece': { toBase: 1, baseUnit: 'count' },
      'pieces': { toBase: 1, baseUnit: 'count' },
      'bunch': { toBase: 1, baseUnit: 'count' },
      'bunches': { toBase: 1, baseUnit: 'count' },
      'head': { toBase: 1, baseUnit: 'count' },
      'heads': { toBase: 1, baseUnit: 'count' },
      'clove': { toBase: 1, baseUnit: 'count' },
      'cloves': { toBase: 1, baseUnit: 'count' },
    };

    // Special ingredient-specific conversions (for dry ingredients measured in cups)
    const INGREDIENT_SPECIFIC_CONVERSIONS: Record<string, { cupToGrams: number }> = {
      'flour': { cupToGrams: 120 },
      'wheat flour': { cupToGrams: 120 },
      'atta': { cupToGrams: 120 },
      'besan': { cupToGrams: 120 },
      'gram flour': { cupToGrams: 120 },
      'semolina': { cupToGrams: 180 },
      'rava': { cupToGrams: 180 },
      'sooji': { cupToGrams: 180 },
      'rice': { cupToGrams: 200 },
      'basmati': { cupToGrams: 200 },
      'brown rice': { cupToGrams: 200 },
      'sugar': { cupToGrams: 200 },
      'oats': { cupToGrams: 80 },
      'quinoa': { cupToGrams: 180 },
    };

    // Normalize unit name variations
    function normalizeUnit(unit: string): string {
      const lower = unit.toLowerCase().trim();
      const normalized: Record<string, string> = {
        'tbsp': 'tbsp', 'tablespoon': 'tbsp', 'tablespoons': 'tbsp', 'tb': 'tbsp',
        'tsp': 'tsp', 'teaspoon': 'tsp', 'teaspoons': 'tsp', 'ts': 'tsp',
        'cup': 'cup', 'cups': 'cup', 'c': 'cup',
        'ml': 'ml', 'milliliter': 'ml', 'millilitre': 'ml', 'milliliters': 'ml', 'millilitres': 'ml',
        'l': 'l', 'liter': 'l', 'litre': 'l', 'liters': 'l', 'litres': 'l',
        'g': 'g', 'gram': 'g', 'grams': 'g', 'gm': 'g',
        'kg': 'kg', 'kilogram': 'kg', 'kilograms': 'kg', 'kilo': 'kg',
        'lb': 'lb', 'pound': 'lb', 'pounds': 'lb', 'lbs': 'lb',
        'oz': 'oz', 'ounce': 'oz', 'ounces': 'oz',
      };
      return normalized[lower] || lower;
    }

    // Parse quantity from ingredient string
    interface ParsedQuantity {
      amount: number;
      unit: string;
      ingredient: string;
      original: string;
    }

    function parseQuantity(ingredient: string): ParsedQuantity | null {
      if (!ingredient || typeof ingredient !== 'string') return null;
      
      const trimmed = ingredient.trim();
      if (!trimmed) return null;

      // Match patterns like:
      // "1 cup ghee"
      // "2 tbsp ghee"
      // "500g paneer"
      // "1/2 tsp salt"
      // "1.5 cups flour"
      // "19 tablespoon ghee"
      
      // Pattern 1: Number (including fractions) + unit + ingredient
      const pattern1 = /^([\d\/\.]+)\s+(cup|cups|tbsp|tablespoon|tablespoons|tsp|teaspoon|teaspoons|ml|l|liter|litre|g|gram|grams|kg|kilogram|lb|pound|lbs|oz|ounce|piece|pieces|bunch|bunches|head|heads|clove|cloves)\s+(.+)$/i;
      const match1 = trimmed.match(pattern1);
      
      if (match1) {
        const amountStr = match1[1];
        const unit = normalizeUnit(match1[2]);
        const ingredientName = match1[3].trim();
        
        // Parse amount (handle fractions like "1/2" or decimals like "1.5")
        let amount: number;
        if (amountStr.includes('/')) {
          const [num, den] = amountStr.split('/').map(Number);
          amount = num / den;
        } else {
          amount = parseFloat(amountStr);
        }
        
        if (isNaN(amount) || amount <= 0) return null;
        
        return { amount, unit, ingredient: ingredientName, original: trimmed };
      }
      
      // Pattern 2: Number + ingredient (no explicit unit, assume count or grams)
      const pattern2 = /^([\d\/\.]+)\s+(.+)$/;
      const match2 = trimmed.match(pattern2);
      
      if (match2) {
        const amountStr = match2[1];
        const ingredientName = match2[2].trim();
        
        let amount: number;
        if (amountStr.includes('/')) {
          const [num, den] = amountStr.split('/').map(Number);
          amount = num / den;
        } else {
          amount = parseFloat(amountStr);
        }
        
        if (isNaN(amount) || amount <= 0) return null;
        
        // Default to 'count' if no unit specified and it's a small number, otherwise 'g'
        const unit = amount < 10 && !ingredientName.match(/\d/) ? 'count' : 'g';
        
        return { amount, unit, ingredient: ingredientName, original: trimmed };
      }
      
      return null;
    }

    // Convert to base unit (ml for liquids, g for solids, count for items)
    function convertToBaseUnit(amount: number, unit: string, ingredient?: string): { baseAmount: number; baseUnit: 'ml' | 'g' | 'count' } | null {
      const normalizedUnit = normalizeUnit(unit);
      
      // Check for ingredient-specific conversions (e.g., 1 cup flour = 120g)
      if (ingredient && (normalizedUnit === 'cup' || normalizedUnit === 'cups')) {
        const lowerIngredient = ingredient.toLowerCase();
        for (const [key, conversion] of Object.entries(INGREDIENT_SPECIFIC_CONVERSIONS)) {
          if (lowerIngredient.includes(key)) {
            return { baseAmount: amount * conversion.cupToGrams, baseUnit: 'g' };
          }
        }
      }
      
      // Use standard unit conversions
      const conversion = UNIT_CONVERSIONS[normalizedUnit];
      if (!conversion) return null;
      
      return {
        baseAmount: amount * conversion.toBase,
        baseUnit: conversion.baseUnit
      };
    }

    // Convert base unit to practical shopping unit
    function convertToShoppingUnit(baseAmount: number, baseUnit: 'ml' | 'g' | 'count', ingredient: string): string {
      if (baseUnit === 'count') {
        // For count items, just return the count
        const count = Math.ceil(baseAmount);
        return count === 1 ? `1 ${ingredient}` : `${count} ${ingredient}`;
      }
      
      if (baseUnit === 'ml') {
        // Convert ml to practical units (cups, tbsp, etc.)
        const cups = Math.floor(baseAmount / 240);
        const remainingMl = baseAmount % 240;
        const tbsp = Math.floor(remainingMl / 15);
        const remainingMlAfterTbsp = remainingMl % 15;
        const tsp = Math.ceil(remainingMlAfterTbsp / 5);
        
        const parts: string[] = [];
        if (cups > 0) {
          parts.push(cups === 1 ? '1 cup' : `${cups} cups`);
        }
        if (tbsp > 0) {
          parts.push(tbsp === 1 ? '1 tbsp' : `${tbsp} tbsp`);
        }
        if (tsp > 0 && remainingMlAfterTbsp > 0) {
          parts.push(tsp === 1 ? '1 tsp' : `${tsp} tsp`);
        }
        
        if (parts.length === 0) {
          // Very small amount, use ml
          return `${Math.ceil(baseAmount)}ml ${ingredient}`;
        }
        
        return `${parts.join(' + ')} ${ingredient}`;
      }
      
      if (baseUnit === 'g') {
        // For grams, convert to practical units
        if (baseAmount >= 1000) {
          const kg = Math.floor(baseAmount / 1000);
          const remainingG = Math.round(baseAmount % 1000);
          if (remainingG === 0) {
            return `${kg}kg ${ingredient}`;
          }
          return `${kg}kg ${remainingG}g ${ingredient}`;
        }
        
        // For small amounts (< 1 tbsp for spices), suggest packet
        if (baseAmount < 15 && ingredient.toLowerCase().match(/(spice|powder|masala|seeds)/)) {
          return `1 packet ${ingredient}`;
        }
        
        // Round to nearest 10g for practical shopping
        const rounded = Math.ceil(baseAmount / 10) * 10;
        return `${rounded}g ${ingredient}`;
      }
      
      return `${baseAmount}${baseUnit} ${ingredient}`;
    }

    // Check if ingredient should be excluded from grocery list
    function shouldExcludeIngredient(ingredient: string): boolean {
      const lower = ingredient.toLowerCase().trim();
      
      // Exclude patterns
      const excludePatterns = [
        /^salt\s+to\s+taste$/i,
        /to\s+taste$/i,
        /as\s+needed$/i,
        /optional$/i,
        /^water$/i, // Plain water
        /^\d+\s*(cup|cups|ml|l|liter|litre)\s+water$/i, // Quantified plain water
        /for\s+garnish$/i,
        /^pinch\s+/i,
        /^dash\s+/i,
        /^\d+\s*(pinch|pinches|dash|dashes)\s+/i,
      ];
      
      // Check if it matches any exclude pattern
      if (excludePatterns.some(pattern => pattern.test(lower))) {
        return true;
      }
      
      // Allow specific water types (coconut water, lemon water, etc.)
      if (lower.includes('water') && !lower.match(/(coconut|lemon|lime|mineral|sparkling|flavored|flavoured)/)) {
        return true;
      }
      
      return false;
    }

    // Post-process grocery list with proper quantity aggregation
    // Step 1: Extract all ingredients from all meals with parsed quantities
    interface AggregatedIngredient {
      parsed: ParsedQuantity;
      baseAmount: number;
      baseUnit: 'ml' | 'g' | 'count';
    }
    
    const ingredientMap = new Map<string, AggregatedIngredient[]>();
    
    // Extract ingredients from all meals
    mealPlan.days.forEach((day: any) => {
      (['breakfast', 'lunch', 'dinner'] as const).forEach((mealType) => {
        type MealKey = 'breakfast' | 'lunch' | 'dinner';
        const mealKey = mealType as MealKey;
        if (day.meals[mealKey]?.ingredients && Array.isArray(day.meals[mealKey].ingredients)) {
          day.meals[mealKey].ingredients.forEach((ing: string) => {
            if (typeof ing !== "string" || !ing.trim()) return;
            
            // Skip excluded ingredients
            if (shouldExcludeIngredient(ing)) return;
            
            const parsed = parseQuantity(ing);
            if (!parsed) return;
            
            // Normalize ingredient name for grouping (lowercase, remove extra spaces)
            const normalizedName = parsed.ingredient.toLowerCase().trim().replace(/\s+/g, ' ');
            
            // Convert to base unit
            const baseConversion = convertToBaseUnit(parsed.amount, parsed.unit, parsed.ingredient);
            if (!baseConversion) return;
            
            // Add to map
            if (!ingredientMap.has(normalizedName)) {
              ingredientMap.set(normalizedName, []);
            }
            ingredientMap.get(normalizedName)!.push({
              parsed,
              baseAmount: baseConversion.baseAmount,
              baseUnit: baseConversion.baseUnit
            });
          });
        }
      });
      
      // Process snacks
      if (day.meals.snacks && Array.isArray(day.meals.snacks)) {
        day.meals.snacks.forEach((snack: any) => {
          if (snack.ingredients && Array.isArray(snack.ingredients)) {
            snack.ingredients.forEach((ing: string) => {
              if (typeof ing !== "string" || !ing.trim()) return;
              
              if (shouldExcludeIngredient(ing)) return;
              
              const parsed = parseQuantity(ing);
              if (!parsed) return;
              
              const normalizedName = parsed.ingredient.toLowerCase().trim().replace(/\s+/g, ' ');
              const baseConversion = convertToBaseUnit(parsed.amount, parsed.unit, parsed.ingredient);
              if (!baseConversion) return;
              
              if (!ingredientMap.has(normalizedName)) {
                ingredientMap.set(normalizedName, []);
              }
              ingredientMap.get(normalizedName)!.push({
                parsed,
                baseAmount: baseConversion.baseAmount,
                baseUnit: baseConversion.baseUnit
              });
            });
          }
        });
      }
    });
    
    // Step 2: Aggregate quantities by ingredient
    interface FinalIngredient {
      name: string;
      totalBaseAmount: number;
      baseUnit: 'ml' | 'g' | 'count';
      shoppingQuantity: string;
    }
    
    const aggregatedIngredients: FinalIngredient[] = [];
    
    ingredientMap.forEach((occurrences, normalizedName) => {
      // Sum all base amounts
      const totalBaseAmount = occurrences.reduce((sum, occ) => sum + occ.baseAmount, 0);
      const baseUnit = occurrences[0].baseUnit; // All should have same base unit
      const ingredientName = occurrences[0].parsed.ingredient; // Use first occurrence's name
      
      // Convert to shopping unit
      const shoppingQuantity = convertToShoppingUnit(totalBaseAmount, baseUnit, ingredientName);
      
      aggregatedIngredients.push({
        name: ingredientName,
        totalBaseAmount,
        baseUnit,
        shoppingQuantity
      });
    });
    
    // Step 3: Categorize ingredients
    const categoryMap: Record<string, string[]> = {
      produce: [
        // Vegetables
        'vegetable', 'spinach', 'tomato', 'onion', 'garlic', 'pepper', 'carrot', 
        'celery', 'cucumber', 'potato', 'cauliflower', 'broccoli', 'peas', 'beans',
        'cabbage', 'lettuce', 'mushroom', 'zucchini', 'eggplant', 'bell pepper',
        // Fruits
        'fruit', 'apple', 'banana', 'orange', 'lemon', 'lime', 'berry', 'mango',
        // Herbs
        'herb', 'cilantro', 'coriander', 'mint', 'basil', 'parsley', 'dill',
        'fenugreek', 'curry leaves', 'green chili', 'chili pepper'
      ],
      protein: [
        // Meat
        'chicken', 'beef', 'pork', 'turkey', 'lamb', 'fish', 'salmon', 'tuna', 
        'shrimp', 'prawn', 'seafood',
        // Plant protein
        'paneer', 'tofu', 'tempeh', 'edamame',
        // Legumes
        'lentil', 'dal', 'chickpea', 'chana', 'bean', 'black bean', 'kidney bean',
        'moong', 'urad', 'rajma', 'quinoa', 'egg'
      ],
      dairy: [
        'milk', 'yogurt', 'curd', 'buttermilk', 'cream', 'sour cream', 
        'butter', 'ghee', 'cheese', 'cottage cheese', 'feta', 'mozzarella', 
        'paneer', 'coconut milk', 'coconut cream'
      ],
      pantry: [
        // Grains
        'rice', 'basmati', 'brown rice', 'quinoa', 'oats', 'barley',
        // Flours
        'flour', 'atta', 'wheat flour', 'besan', 'gram flour', 'semolina', 
        'rava', 'sooji', 'maida',
        // Breads
        'bread', 'roti', 'naan', 'pav', 'tortilla', 'wrap',
        // Other
        'pasta', 'noodle', 'sabudana', 'tapioca', 'sago',
        // Oils & Fats
        'oil', 'olive oil', 'vegetable oil', 'coconut oil',
        // Canned/Jarred
        'canned', 'jar', 'tomato puree', 'tomato paste', 'sauce', 'dressing',
        // Nuts & Seeds
        'almond', 'cashew', 'walnut', 'peanut', 'pistachio', 'sesame',
        // Other
        'sugar', 'honey', 'maple syrup', 'vinegar', 'soy sauce', 'broth', 'stock',
        'popcorn', 'hummus'
      ],
      spices: [
        'cumin', 'coriander powder', 'turmeric', 'garam masala', 'chili powder',
        'mustard seeds', 'paprika', 'curry powder', 'masala', 'cardamom',
        'cinnamon', 'clove', 'bay leaf', 'fenugreek seeds', 'fennel seeds',
        'cumin seeds', 'coriander seeds', 'black pepper', 'red chili',
        'sambar powder', 'pav bhaji masala', 'chaat masala'
      ],
      beverages: [
        // Only include if it's a specific beverage ingredient
        'juice', 'tea', 'coffee', 'soda', 'smoothie', 'coconut water',
        // Exclude plain water
      ]
    };
    
    // Function to categorize an ingredient
    const categorizeIngredient = (ingredient: string): string => {
      const lower = ingredient.toLowerCase();
      for (const [category, keywords] of Object.entries(categoryMap)) {
        if (keywords.some(keyword => lower.includes(keyword))) {
          return category;
        }
      }
      return 'pantry'; // Default category
    };
    
    // Step 4: Build categorized grocery list
    const consolidatedGroceryList: Record<string, string[]> = {};
    
    // Initialize all categories
    Object.keys(categoryMap).forEach(cat => {
      consolidatedGroceryList[cat] = [];
    });
    
    // Categorize and add ingredients
    aggregatedIngredients.forEach(ing => {
      const category = categorizeIngredient(ing.name);
      
      // Check for duplicates in the same category (similar ingredient names)
      const existingIndex = consolidatedGroceryList[category].findIndex((item: string) => {
        const itemLower = item.toLowerCase();
        const ingLower = ing.name.toLowerCase();
        // Check if they're similar (one contains the other or vice versa)
        return itemLower.includes(ingLower) || ingLower.includes(itemLower.split(/\s+/).pop() || '');
      });
      
      if (existingIndex >= 0) {
        // Merge with existing - keep the one with more specific name
        const existing = consolidatedGroceryList[category][existingIndex];
        if (ing.name.length > existing.split(/\s+/).slice(1).join(' ').length) {
          consolidatedGroceryList[category][existingIndex] = ing.shoppingQuantity;
        }
      } else {
        consolidatedGroceryList[category].push(ing.shoppingQuantity);
      }
    });
    
    // Step 5: Update meal plan with consolidated grocery list
    mealPlan.groceryList = consolidatedGroceryList;
    
    // Log grocery list validation
    const totalGroceryItems = Object.values(mealPlan.groceryList).reduce((sum: number, items: any) => {
      return sum + (Array.isArray(items) ? items.length : 0);
    }, 0);
    log(`Grocery list validation: ${totalGroceryItems} items across ${Object.keys(mealPlan.groceryList).length} categories, ${aggregatedIngredients.length} unique ingredients aggregated from meals`, "openai");
    
    if (totalGroceryItems === 0) {
      log("WARNING: Grocery list has no items after consolidation", "openai");
    }
    
    if (aggregatedIngredients.length > 0 && totalGroceryItems < aggregatedIngredients.length * 0.5) {
      log(`WARNING: Grocery list may be incomplete. Found ${aggregatedIngredients.length} unique ingredients but only ${totalGroceryItems} items in grocery list`, "openai");
    }

    // Validate meal plan quality
    const validation = validateMealPlan(mealPlan);
    if (!validation.valid) {
      log(`Meal plan validation failed: ${validation.errors.map(e => e.message).join(', ')}`, "openai");
      throw new Error(`Meal plan validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
    }

    log(`Meal plan validation successful: ${mealPlan.days.length} days, ${mealPlan.overview.duration} day duration`, "openai");
    log(`Total generation time: ${Date.now() - (parseStartTime - (Date.now() - parseStartTime))}ms`, "openai");

    // Note: API usage logging is done in the route handler after meal plan is saved
    // This ensures we have the meal_plan_id for proper tracking

    return { mealPlan, usage };
  } catch (error: any) {
    // Clear timeout if it's still active (only for non-chunked path)
    // Note: timeoutId is only defined in the non-chunked path
    // For chunked paths, timeouts are handled within generateMealPlanChunk
    
    // Record failure in network monitor
    networkMonitor.recordFailure();
    
    log(`OpenAI API error: ${error.message}`, "openai");
    
    // Check network health before retrying
    if (!networkMonitor.isHealthy()) {
      log(`Network is unhealthy (${networkMonitor.getStatus().consecutiveFailures} consecutive failures)`, "openai");
    }
    
    // Handle timeout errors - check this FIRST before other error types
    // Also check for AbortError which indicates our custom timeout fired
    if (error.message?.includes("timeout") || error.message?.includes("Timeout") || 
        error.message?.includes("taking longer than expected") || error.name === "AbortError") {
      const elapsedTime = startTime ? Date.now() - startTime : 0;
      // #region agent log - Hypothesis C,D,E: Timeout error occurred
      fetch('http://127.0.0.1:7242/ingest/29ee16f2-f385-440f-b653-567260a65333',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'openai.ts:1710',message:'Timeout error caught',data:{errorMessage:error.message,elapsedTime,timeoutMs,expectedTimeout:timeoutMs,planType:request.planType,has300000:error.message?.includes("300000"),has5minutes:error.message?.includes("5 minutes"),has300seconds:error.message?.includes("300 seconds")},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C,D,E'})}).catch(()=>{});
      // #endregion
      log(`Timeout error occurred: ${error.message}`, "openai");
      
      // Check if it's client timeout (5 min) or custom timeout (7 min)
      if (error.message?.includes("300000") || error.message?.includes("5 minutes") || 
          error.message?.includes("300 seconds")) {
        log("WARNING: OpenAI client timeout (5 min) fired before custom timeout (7 min)", "openai");
        throw new Error(`Request timeout. The OpenAI client timeout (5 minutes) was reached. This has been fixed - please try again.`);
      }
      
      throw new Error(`Request timeout. The meal plan generation is taking longer than expected. Please try again.`);
    }
    
    // Handle network errors
    if (error.message?.includes("ECONNRESET") || error.message?.includes("ETIMEDOUT") || 
        error.message?.includes("network") || error.message?.includes("Network") ||
        error.code === "ECONNRESET" || error.code === "ETIMEDOUT") {
      throw new Error("Network error occurred. Please check your internet connection and try again.");
    }
    
    // Handle specific OpenAI errors
    if (error.status === 429) {
      throw new Error("OpenAI rate limit exceeded. Please try again later.");
    } else if (error.status === 401) {
      throw new Error("OpenAI API key is invalid.");
    } else if (error.status === 500) {
      throw new Error("OpenAI service is temporarily unavailable. Please try again later.");
    } else if (error.message?.includes("JSON") && !error.message?.includes("timeout")) {
      // Only treat as JSON parse error if it's not a timeout
      throw new Error("Failed to parse meal plan response. Please try again.");
    }
    
    throw new Error(`Failed to generate meal plan: ${error.message}`);
  }
}

